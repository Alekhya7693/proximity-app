import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity, UserStatus } from '../auth/entities/user.entity';
import { ProfileEntity, IntentionType } from '../profile/entities/profile.entity';
import { SwipeEntity } from '../match/entities/swipe.entity';
import { BlockEntity } from '../safety/safety.service';
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
    @InjectRepository(SwipeEntity)
    private readonly swipeRepository: Repository<SwipeEntity>,
    @InjectRepository(BlockEntity)
    private readonly blockRepository: Repository<BlockEntity>,
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
    onlineOnly = true,
  ): Promise<DiscoveryFeed> {
    // Get user's profile for preference matching
    const userProfile = await this.profileRepository.findOne({
      where: { userId },
    });

    // Get blocked/swiped user IDs to exclude
    const excludeIds = await this.getExcludedUserIds(userId);
    excludeIds.push(userId);

    // Fetch nearby users from location service.
    // Use a wider search radius internally so we have candidates to filter,
    // but the client-requested radius is used for display.
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

    // Get online statuses — used for both filtering and scoring
    const onlineStatuses = await this.redisGeoService.getOnlineStatuses(
      candidateUserIds,
    );

    // Also check lastActiveAt as fallback for "recently active" (within 5 min)
    const recentlyActiveThreshold = Date.now() - 5 * 60 * 1000;

    // Build scored candidates
    let candidates: DiscoveryCandidate[] = [];

    for (const nearbyUser of filteredNearby) {
      const profile = profileMap.get(nearbyUser.userId);
      if (!profile) continue;

      const isOnlineRedis = onlineStatuses[nearbyUser.userId] || false;
      // Treat user as "active" if Redis says online OR lastActiveAt within 5 min
      const isRecentlyActive =
        isOnlineRedis ||
        (profile.user?.lastActiveAt &&
          new Date(profile.user.lastActiveAt).getTime() > recentlyActiveThreshold);

      // Online filter: only show users who are currently active
      if (onlineOnly && !isRecentlyActive) {
        continue;
      }

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
        isOnlineRedis,
        userProfile,
      );

      candidates.push({
        userId: nearbyUser.userId,
        distance: Math.round((nearbyUser.distance || 0) * 10) / 10,
        score,
        profile: this.sanitizeProfile(profile),
        isOnline: isOnlineRedis,
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
    viewerProfile?: ProfileEntity | null,
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

    // ─── Vibe match bonus (up to 25 points) ─────────────
    const candidateVibesActive =
      profile.vibes &&
      profile.vibes.length > 0 &&
      (!profile.vibeExpiresAt || new Date(profile.vibeExpiresAt) > new Date());

    if (candidateVibesActive) {
      // Boost users who have active vibes (they're actively looking)
      score += 10;

      // Extra bonus if viewer also has vibes and they overlap
      if (viewerProfile?.vibes && viewerProfile.vibes.length > 0) {
        const viewerVibeSet = new Set(
          viewerProfile.vibes.map((v) => v.toLowerCase()),
        );
        const shared = profile.vibes!.filter((v) =>
          viewerVibeSet.has(v.toLowerCase()),
        );
        if (shared.length > 0) {
          score += 15; // Exact vibe match — strong signal
        }
      }
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
    // Get users already swiped by this user
    const [swipes, blocks] = await Promise.all([
      this.swipeRepository.find({
        where: { swiperId: userId },
        select: ['swipedId'],
      }),
      // Exclude anyone this user blocked OR who blocked this user (bidirectional)
      this.blockRepository.find({
        where: [{ blockerId: userId }, { blockedId: userId }],
        select: ['blockerId', 'blockedId'],
      }),
    ]);

    const ids = new Set<string>(swipes.map((s) => s.swipedId));
    for (const block of blocks) {
      ids.add(block.blockerId === userId ? block.blockedId : block.blockerId);
    }
    return [...ids];
  }

  private sanitizeProfile(profile: ProfileEntity): Record<string, any> {
    const user = profile.user;
    // Check if vibes are still active (not expired)
    const vibesActive =
      profile.vibes &&
      profile.vibes.length > 0 &&
      (!profile.vibeExpiresAt || new Date(profile.vibeExpiresAt) > new Date());

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName
        || (user ? (user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName[0] : ''}` : user.username) : undefined),
      age: user?.dateOfBirth
        ? this.calculateAge(user.dateOfBirth)
        : undefined,
      bio: profile.bio,
      gender: profile.gender,
      intention: profile.intention,
      photos: profile.photos,
      interests: profile.interests,
      vibes: vibesActive ? profile.vibes : [],
      activeVibeCustomText: vibesActive ? profile.activeVibeCustomText : null,
      occupation: profile.occupation,
      city: profile.city,
      prompts: profile.prompts,
      profileCompleteness: profile.profileCompleteness,
    };
  }

  // ─── Vibe Endpoints ────────────────────────────────────

  private static readonly SOCIAL_VIBES = [
    'Coffee Chat', 'Gaming', 'Yoga', 'Food Run', 'Study Session',
    'Workout', 'Live Music', 'Creative', 'Drinks', 'Adventure',
    'Chill', 'Party', 'Movie Night', 'Foodie Run',
  ];

  private static readonly PROFESSIONAL_VIBES = [
    'Networking', 'Mentorship', 'Co-Working', 'Brainstorming',
    'Coffee Meeting', 'Industry Chat', 'Hiring', 'Startup Talk',
    'Skill Swap', 'Workshop',
  ];

  getAvailableVibes(mode: string): { vibes: string[] } {
    const vibes =
      mode === 'professional'
        ? DiscoveryService.PROFESSIONAL_VIBES
        : DiscoveryService.SOCIAL_VIBES;
    return { vibes };
  }

  async setActiveVibes(
    userId: string,
    vibes: string[],
    durationMinutes = 60,
    customText?: string,
  ): Promise<{ message: string; vibes: string[]; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    await this.profileRepository.update(
      { userId },
      {
        vibes,
        activeVibeCustomText: customText || null,
        vibeExpiresAt: expiresAt,
      },
    );

    this.logger.log(
      `User ${userId} set vibes: [${vibes.join(', ')}] expires at ${expiresAt.toISOString()}`,
    );

    return {
      message: 'Vibes updated',
      vibes,
      expiresAt,
    };
  }

  async clearActiveVibes(userId: string): Promise<{ message: string }> {
    await this.profileRepository.update(
      { userId },
      {
        vibes: null,
        activeVibeCustomText: null,
        vibeExpiresAt: null,
      },
    );
    return { message: 'Vibes cleared' };
  }
}
