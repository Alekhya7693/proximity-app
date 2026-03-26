import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity, UserStatus } from '../auth/entities/user.entity';
import { ProfileEntity, IntentionType } from '../profile/entities/profile.entity';
import { LocationService } from '../location/location.service';
import { RedisGeoService, GeoMember } from '../location/redis-geo.service';

interface DiscoveryCandidate {
  userId: string;
  distance: number;
  score: number;
  profile: Partial<ProfileEntity>;
  isOnline: boolean;
}

interface DiscoveryFeed {
  candidates: DiscoveryCandidate[];
  total: number;
  page: number;
  pageSize: number;
}

enum DiscoveryTier {
  CLOSE = 'close',     // 0-2 km
  NEARBY = 'nearby',   // 2-10 km
  EXTENDED = 'extended', // 10-50 km
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly pageSize: number;
  private readonly boostNewUsersHours: number;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly locationService: LocationService,
    private readonly redisGeoService: RedisGeoService,
    private readonly configService: ConfigService,
  ) {
    this.pageSize = configService.get<number>('DISCOVERY_PAGE_SIZE', 20);
    this.boostNewUsersHours = configService.get<number>(
      'DISCOVERY_BOOST_NEW_USERS_HOURS',
      72,
    );
  }

  /**
   * Generate discovery feed using tiered proximity strategy.
   * Priority: close > nearby > extended, with scoring within each tier.
   */
  async getDiscoveryFeed(
    userId: string,
    page = 1,
    radiusKm?: number,
    intention?: IntentionType,
  ): Promise<DiscoveryFeed> {
    // Get user's profile for preference matching
    const userProfile = await this.profileRepository.findOne({
      where: { userId },
    });

    // Get blocked/swiped user IDs to exclude
    const excludeIds = await this.getExcludedUserIds(userId);
    excludeIds.push(userId);

    // Fetch nearby users from location service
    const maxRadius =
      radiusKm ||
      this.configService.get<number>('DEFAULT_DISCOVERY_RADIUS_KM', 10);

    const nearbyUsers = await this.locationService.getNearbyUsers(
      userId,
      maxRadius,
      200, // Fetch more than page size for scoring
    );

    // Filter out excluded users
    const filteredNearby = nearbyUsers.filter(
      (u) => !excludeIds.includes(u.userId),
    );

    // Load profiles for nearby users
    const candidateUserIds = filteredNearby.map((u) => u.userId);
    const profiles =
      candidateUserIds.length > 0
        ? await this.profileRepository.find({
            where: {
              userId: In(candidateUserIds),
              isVisible: true,
            },
            relations: ['user'],
          })
        : [];

    // Build profile lookup
    const profileMap = new Map<string, ProfileEntity>();
    for (const profile of profiles) {
      profileMap.set(profile.userId, profile);
    }

    // Get online statuses
    const onlineStatuses = await this.redisGeoService.getOnlineStatuses(
      candidateUserIds,
    );

    // Build scored candidates
    let candidates: DiscoveryCandidate[] = [];

    for (const nearbyUser of filteredNearby) {
      const profile = profileMap.get(nearbyUser.userId);
      if (!profile) continue;

      // Intention filter
      if (
        intention &&
        intention !== IntentionType.ALL &&
        profile.intention !== IntentionType.ALL &&
        profile.intention !== intention
      ) {
        continue;
      }

      // Preference-based filtering
      if (userProfile?.preferences) {
        if (!this.matchesPreferences(userProfile, profile)) {
          continue;
        }
      }

      const tier = this.getTier(nearbyUser.distance || 0);
      const score = this.calculateScore(
        nearbyUser,
        profile,
        tier,
        onlineStatuses[nearbyUser.userId] || false,
      );

      candidates.push({
        userId: nearbyUser.userId,
        distance: Math.round((nearbyUser.distance || 0) * 10) / 10,
        score,
        profile: this.sanitizeProfile(profile),
        isOnline: onlineStatuses[nearbyUser.userId] || false,
      });
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Paginate
    const total = candidates.length;
    const startIndex = (page - 1) * this.pageSize;
    candidates = candidates.slice(startIndex, startIndex + this.pageSize);

    return {
      candidates,
      total,
      page,
      pageSize: this.pageSize,
    };
  }

  // ─── Scoring ──────────────────────────────────────────────

  private calculateScore(
    geoMember: GeoMember,
    profile: ProfileEntity,
    tier: DiscoveryTier,
    isOnline: boolean,
  ): number {
    let score = 0;

    // Tier bonus (closer = higher base score)
    switch (tier) {
      case DiscoveryTier.CLOSE:
        score += 100;
        break;
      case DiscoveryTier.NEARBY:
        score += 60;
        break;
      case DiscoveryTier.EXTENDED:
        score += 30;
        break;
    }

    // Distance decay within tier (closer is better)
    const distance = geoMember.distance || 0;
    score += Math.max(0, 20 - distance * 2);

    // Profile completeness bonus
    score += (profile.profileCompleteness / 100) * 25;

    // Online bonus
    if (isOnline) {
      score += 15;
    }

    // New user boost
    if (profile.createdAt) {
      const hoursOld =
        (Date.now() - new Date(profile.createdAt).getTime()) / 3600000;
      if (hoursOld < this.boostNewUsersHours) {
        score += 20 * (1 - hoursOld / this.boostNewUsersHours);
      }
    }

    // Premium boost
    if (profile.isPremium) {
      score += 10;
    }

    // Photos bonus
    if (profile.photos && profile.photos.length > 0) {
      score += Math.min(profile.photos.length * 3, 15);
    }

    return Math.round(score * 100) / 100;
  }

  private getTier(distanceKm: number): DiscoveryTier {
    if (distanceKm <= 2) return DiscoveryTier.CLOSE;
    if (distanceKm <= 10) return DiscoveryTier.NEARBY;
    return DiscoveryTier.EXTENDED;
  }

  private matchesPreferences(
    userProfile: ProfileEntity,
    candidateProfile: ProfileEntity,
  ): boolean {
    const prefs = userProfile.preferences;
    if (!prefs) return true;

    // Age filter
    if (
      prefs.ageMin !== undefined ||
      prefs.ageMax !== undefined
    ) {
      const candidateUser = candidateProfile.user;
      if (candidateUser?.dateOfBirth) {
        const age = this.calculateAge(candidateUser.dateOfBirth);
        if (prefs.ageMin && age < prefs.ageMin) return false;
        if (prefs.ageMax && age > prefs.ageMax) return false;
      }
    }

    // Gender filter
    if (prefs.genders && prefs.genders.length > 0 && candidateProfile.gender) {
      if (!prefs.genders.includes(candidateProfile.gender)) {
        return false;
      }
    }

    // Intention filter
    if (prefs.intentions && prefs.intentions.length > 0) {
      if (
        candidateProfile.intention !== IntentionType.ALL &&
        !prefs.intentions.includes(candidateProfile.intention)
      ) {
        return false;
      }
    }

    return true;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  private async getExcludedUserIds(userId: string): Promise<string[]> {
    // This will be expanded when swipe/block entities are integrated.
    // For now, query any blocked users or already-swiped users.
    // Placeholder: return empty array until match/safety modules are wired.
    return [];
  }

  private sanitizeProfile(profile: ProfileEntity): Record<string, any> {
    const user = profile.user;
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: user
        ? user.firstName || user.username
        : undefined,
      age: user?.dateOfBirth
        ? this.calculateAge(user.dateOfBirth)
        : undefined,
      bio: profile.bio,
      gender: profile.gender,
      intention: profile.intention,
      photos: profile.photos,
      interests: profile.interests,
      occupation: profile.occupation,
      city: profile.city,
      prompts: profile.prompts,
      profileCompleteness: profile.profileCompleteness,
    };
  }
}
