import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.config';

export interface GeoMember {
  userId: string;
  longitude: number;
  latitude: number;
  distance?: number;
  unit?: string;
}

@Injectable()
export class RedisGeoService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisGeoService.name);
  private readonly GEO_KEY = 'proximity:user_locations';
  private readonly ONLINE_KEY = 'proximity:online_users';
  private readonly ONLINE_TTL = 300; // 5 minutes

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Store a user's location using GEOADD.
   */
  async setUserLocation(
    userId: string,
    longitude: number,
    latitude: number,
  ): Promise<void> {
    try {
      await this.redis.geoadd(this.GEO_KEY, longitude, latitude, userId);
      // Mark user as online
      await this.redis.setex(
        `${this.ONLINE_KEY}:${userId}`,
        this.ONLINE_TTL,
        '1',
      );
      this.logger.debug(
        `Location set for ${userId}: [${longitude}, ${latitude}]`,
      );
    } catch (error) {
      this.logger.error(`Failed to set location for ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get nearby users within a radius using GEORADIUS.
   */
  async getNearbyUsers(
    longitude: number,
    latitude: number,
    radiusKm: number,
    count = 100,
  ): Promise<GeoMember[]> {
    try {
      const results = await this.redis.georadius(
        this.GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHCOORD',
        'WITHDIST',
        'ASC',
        'COUNT',
        count,
      );

      return this.parseGeoResults(results);
    } catch (error) {
      this.logger.error('Failed to get nearby users', error);
      return [];
    }
  }

  /**
   * Get nearby users around a specific user by their stored location.
   */
  async getNearbyUsersByMember(
    userId: string,
    radiusKm: number,
    count = 100,
  ): Promise<GeoMember[]> {
    try {
      const results = await this.redis.georadiusbymember(
        this.GEO_KEY,
        userId,
        radiusKm,
        'km',
        'WITHCOORD',
        'WITHDIST',
        'ASC',
        'COUNT',
        count,
      );

      // Exclude the requesting user themselves
      return this.parseGeoResults(results as any[]).filter(
        (member) => member.userId !== userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get nearby users for member ${userId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Get distance between two users in km.
   */
  async getDistanceBetween(
    userId1: string,
    userId2: string,
  ): Promise<number | null> {
    try {
      const distance = await (this.redis as any).geodist(
        this.GEO_KEY,
        userId1,
        userId2,
        'km',
      );
      return distance ? parseFloat(distance) : null;
    } catch (error) {
      this.logger.error(
        `Failed to get distance between ${userId1} and ${userId2}`,
        error,
      );
      return null;
    }
  }

  /**
   * Get a user's stored coordinates.
   */
  async getUserPosition(
    userId: string,
  ): Promise<{ longitude: number; latitude: number } | null> {
    try {
      const positions = await this.redis.geopos(this.GEO_KEY, userId);
      if (positions && positions[0]) {
        const [lng, lat] = positions[0] as [string, string];
        return {
          longitude: parseFloat(lng),
          latitude: parseFloat(lat),
        };
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get position for ${userId}`, error);
      return null;
    }
  }

  /**
   * Remove a user's location data.
   */
  async removeUserLocation(userId: string): Promise<void> {
    try {
      await this.redis.zrem(this.GEO_KEY, userId);
      await this.redis.del(`${this.ONLINE_KEY}:${userId}`);
    } catch (error) {
      this.logger.error(`Failed to remove location for ${userId}`, error);
    }
  }

  /**
   * Check if a user is currently online.
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const online = await this.redis.get(`${this.ONLINE_KEY}:${userId}`);
    return online === '1';
  }

  /**
   * Batch check online status.
   */
  async getOnlineStatuses(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (userIds.length === 0) return {};

    const pipeline = this.redis.pipeline();
    for (const userId of userIds) {
      pipeline.get(`${this.ONLINE_KEY}:${userId}`);
    }

    const results = await pipeline.exec();
    const statuses: Record<string, boolean> = {};

    if (results) {
      userIds.forEach((userId, index) => {
        const [err, value] = results[index];
        statuses[userId] = !err && value === '1';
      });
    }

    return statuses;
  }

  private parseGeoResults(results: any[]): GeoMember[] {
    if (!Array.isArray(results)) return [];

    return results.map((result: any) => {
      // GEORADIUS with WITHCOORD and WITHDIST returns:
      // [member, distance, [longitude, latitude]]
      if (Array.isArray(result)) {
        return {
          userId: result[0] as string,
          distance: parseFloat(result[1] as string),
          longitude: parseFloat((result[2] as string[])[0]),
          latitude: parseFloat((result[2] as string[])[1]),
          unit: 'km',
        };
      }
      return {
        userId: result as string,
        longitude: 0,
        latitude: 0,
      };
    });
  }
}
