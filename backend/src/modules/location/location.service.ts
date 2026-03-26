import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../auth/entities/user.entity';
import { RedisGeoService, GeoMember } from './redis-geo.service';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

interface SpoofCheckResult {
  isSuspicious: boolean;
  reason?: string;
  confidence: number;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly MAX_SPEED_KMH = 1200; // Roughly max commercial flight speed
  private readonly MIN_UPDATE_INTERVAL_MS: number;
  private readonly spoofDetectionEnabled: boolean;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisGeoService: RedisGeoService,
    private readonly configService: ConfigService,
  ) {
    this.MIN_UPDATE_INTERVAL_MS = configService.get<number>(
      'LOCATION_UPDATE_THROTTLE_MS',
      30000,
    );
    this.spoofDetectionEnabled = configService.get<boolean>(
      'LOCATION_SPOOF_DETECTION',
      true,
    );
  }

  /**
   * Update user's location in both PostGIS (persistent) and Redis (real-time).
   */
  async updateLocation(
    userId: string,
    update: LocationUpdate,
  ): Promise<{ updated: boolean; spoofCheck?: SpoofCheckResult }> {
    this.validateCoordinates(update.latitude, update.longitude);

    // Spoof detection
    let spoofCheck: SpoofCheckResult | undefined;
    if (this.spoofDetectionEnabled) {
      spoofCheck = await this.checkForSpoofing(userId, update);
      if (spoofCheck.isSuspicious && spoofCheck.confidence > 0.8) {
        this.logger.warn(
          `Suspicious location update from ${userId}: ${spoofCheck.reason}`,
        );
        // Still update but flag it; don't block the user outright
      }
    }

    // Update Redis geo index for real-time queries
    await this.redisGeoService.setUserLocation(
      userId,
      update.longitude,
      update.latitude,
    );

    // Update PostGIS in database for persistent storage
    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        lastLocation: () =>
          `ST_SetSRID(ST_MakePoint(${update.longitude}, ${update.latitude}), 4326)`,
        lastLocationUpdatedAt: new Date(),
        lastActiveAt: new Date(),
      })
      .where('id = :id', { id: userId })
      .execute();

    this.logger.debug(
      `Location updated for ${userId}: [${update.latitude}, ${update.longitude}]`,
    );

    return { updated: true, spoofCheck };
  }

  /**
   * Get nearby users using Redis geo for speed,
   * falling back to PostGIS for accuracy.
   */
  async getNearbyUsers(
    userId: string,
    radiusKm?: number,
    limit = 50,
  ): Promise<GeoMember[]> {
    const maxRadius = this.configService.get<number>(
      'MAX_DISCOVERY_RADIUS_KM',
      50,
    );
    const defaultRadius = this.configService.get<number>(
      'DEFAULT_DISCOVERY_RADIUS_KM',
      10,
    );
    const radius = Math.min(radiusKm || defaultRadius, maxRadius);

    // Try Redis first (faster)
    let nearby = await this.redisGeoService.getNearbyUsersByMember(
      userId,
      radius,
      limit,
    );

    // If Redis has no data for this user, fall back to PostGIS
    if (nearby.length === 0) {
      nearby = await this.getNearbyUsersFromPostGIS(userId, radius, limit);
    }

    return nearby;
  }

  /**
   * PostGIS fallback for nearby user queries.
   */
  async getNearbyUsersFromPostGIS(
    userId: string,
    radiusKm: number,
    limit: number,
  ): Promise<GeoMember[]> {
    const radiusMeters = radiusKm * 1000;

    const results = await this.userRepository
      .createQueryBuilder('user')
      .select([
        '"user"."id" as user_id',
        `ST_Distance("user"."lastLocation", "ref"."lastLocation") as distance`,
        `ST_X("user"."lastLocation"::geometry) as longitude`,
        `ST_Y("user"."lastLocation"::geometry) as latitude`,
      ])
      .innerJoin(UserEntity, 'ref', '"ref"."id" = :userId', { userId })
      .where('"user"."id" != :userId', { userId })
      .andWhere('"user"."lastLocation" IS NOT NULL')
      .andWhere(
        `ST_DWithin("user"."lastLocation", "ref"."lastLocation", :radius)`,
        { radius: radiusMeters },
      )
      .orderBy('distance', 'ASC')
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      userId: row.user_id,
      longitude: parseFloat(row.longitude),
      latitude: parseFloat(row.latitude),
      distance: parseFloat(row.distance) / 1000, // convert to km
      unit: 'km',
    }));
  }

  /**
   * Get distance between two users.
   */
  async getDistanceBetween(
    userId1: string,
    userId2: string,
  ): Promise<number | null> {
    // Try Redis first
    const redisDistance = await this.redisGeoService.getDistanceBetween(
      userId1,
      userId2,
    );
    if (redisDistance !== null) {
      return redisDistance;
    }

    // Fall back to PostGIS
    const result = await this.userRepository
      .createQueryBuilder('u1')
      .select(
        `ST_Distance("u1"."lastLocation", "u2"."lastLocation") / 1000 as distance_km`,
      )
      .innerJoin(UserEntity, 'u2', '"u2"."id" = :userId2', { userId2 })
      .where('"u1"."id" = :userId1', { userId1 })
      .andWhere('"u1"."lastLocation" IS NOT NULL')
      .andWhere('"u2"."lastLocation" IS NOT NULL')
      .getRawOne();

    return result ? parseFloat(result.distance_km) : null;
  }

  /**
   * Remove user location data (for privacy / logout).
   */
  async clearLocation(userId: string): Promise<void> {
    await this.redisGeoService.removeUserLocation(userId);
    await this.userRepository.update(userId, {
      lastLocation: null,
      lastLocationUpdatedAt: null,
    });
  }

  // ─── Spoof Detection ─────────────────────────────────────

  private async checkForSpoofing(
    userId: string,
    update: LocationUpdate,
  ): Promise<SpoofCheckResult> {
    const previousPosition = await this.redisGeoService.getUserPosition(userId);

    if (!previousPosition) {
      return { isSuspicious: false, confidence: 0 };
    }

    // Calculate distance and time between updates
    const distanceKm = this.haversineDistance(
      previousPosition.latitude,
      previousPosition.longitude,
      update.latitude,
      update.longitude,
    );

    // Check impossible speed
    const timeDiffHours = this.MIN_UPDATE_INTERVAL_MS / 3600000;
    const impliedSpeedKmh = distanceKm / timeDiffHours;

    if (impliedSpeedKmh > this.MAX_SPEED_KMH) {
      return {
        isSuspicious: true,
        reason: `Impossible speed: ${impliedSpeedKmh.toFixed(0)} km/h over ${distanceKm.toFixed(1)} km`,
        confidence: Math.min(impliedSpeedKmh / this.MAX_SPEED_KMH, 1),
      };
    }

    // Check accuracy (if provided) - extremely low accuracy is suspicious
    if (update.accuracy !== undefined && update.accuracy < 1) {
      return {
        isSuspicious: true,
        reason: `Suspiciously perfect accuracy: ${update.accuracy}m`,
        confidence: 0.6,
      };
    }

    // Check for exactly round coordinates (common in spoofing apps)
    if (
      update.latitude === Math.round(update.latitude) &&
      update.longitude === Math.round(update.longitude)
    ) {
      return {
        isSuspicious: true,
        reason: 'Perfectly round coordinates',
        confidence: 0.5,
      };
    }

    return { isSuspicious: false, confidence: 0 };
  }

  private validateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
