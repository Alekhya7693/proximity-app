import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from '../profile/entities/profile.entity';
import {
  FEATURE_FLAGS,
  FeatureFlags,
  isFeatureEnabled,
} from '../../config/feature-flags';

interface VibeScore {
  overall: number;
  interestOverlap: number;
  intentionAlignment: number;
  proximityBonus: number;
  activityMatch: number;
}

interface VibeCheckResult {
  userId1: string;
  userId2: string;
  score: VibeScore;
  compatibilityLevel: 'low' | 'medium' | 'high' | 'soulmate';
  sharedInterests: string[];
  vibeStatement: string;
}

@Injectable()
export class VibeService {
  private readonly logger = new Logger(VibeService.name);

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @Inject(FEATURE_FLAGS)
    private readonly featureFlags: FeatureFlags,
  ) {}

  /**
   * Run a "vibe check" between two users.
   * Calculates compatibility score based on profile data.
   */
  async vibeCheck(
    userId1: string,
    userId2: string,
    distanceKm?: number,
  ): Promise<VibeCheckResult> {
    if (!isFeatureEnabled(this.featureFlags, 'vibeCheck')) {
      throw new NotFoundException('Vibe check feature is not enabled');
    }

    const [profile1, profile2] = await Promise.all([
      this.profileRepository.findOne({ where: { userId: userId1 } }),
      this.profileRepository.findOne({ where: { userId: userId2 } }),
    ]);

    if (!profile1 || !profile2) {
      throw new NotFoundException('One or both profiles not found');
    }

    const score = this.calculateVibeScore(profile1, profile2, distanceKm);
    const sharedInterests = this.findSharedInterests(profile1, profile2);
    const compatibilityLevel = this.getCompatibilityLevel(score.overall);
    const vibeStatement = this.generateVibeStatement(
      compatibilityLevel,
      sharedInterests,
    );

    return {
      userId1,
      userId2,
      score,
      compatibilityLevel,
      sharedInterests,
      vibeStatement,
    };
  }

  /**
   * Get vibe summary for a user's profile (self-analysis).
   */
  async getVibeProfile(userId: string): Promise<{
    topInterests: string[];
    vibeEnergy: string;
    profileStrength: number;
  }> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const vibeEnergy = this.determineVibeEnergy(profile);

    return {
      topInterests: (profile.interests || []).slice(0, 5),
      vibeEnergy,
      profileStrength: profile.profileCompleteness,
    };
  }

  // ─── Private ──────────────────────────────────────────────

  private calculateVibeScore(
    p1: ProfileEntity,
    p2: ProfileEntity,
    distanceKm?: number,
  ): VibeScore {
    const interestOverlap = this.calculateInterestOverlap(
      p1.interests || [],
      p2.interests || [],
    );

    const intentionAlignment = this.calculateIntentionAlignment(
      p1.intention,
      p2.intention,
    );

    const proximityBonus = distanceKm
      ? Math.max(0, 100 - distanceKm * 2)
      : 50;

    const activityMatch = this.calculateActivityMatch(p1, p2);

    const overall = Math.round(
      interestOverlap * 0.35 +
        intentionAlignment * 0.25 +
        proximityBonus * 0.2 +
        activityMatch * 0.2,
    );

    return {
      overall: Math.min(overall, 100),
      interestOverlap,
      intentionAlignment,
      proximityBonus: Math.round(proximityBonus),
      activityMatch,
    };
  }

  private calculateInterestOverlap(
    interests1: string[],
    interests2: string[],
  ): number {
    if (interests1.length === 0 || interests2.length === 0) return 0;

    const set1 = new Set(interests1.map((i) => i.toLowerCase()));
    const set2 = new Set(interests2.map((i) => i.toLowerCase()));
    const intersection = [...set1].filter((i) => set2.has(i));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity * 100
    return Math.round((intersection.length / union.size) * 100);
  }

  private calculateIntentionAlignment(
    intention1: string,
    intention2: string,
  ): number {
    if (intention1 === intention2) return 100;
    if (intention1 === 'all' || intention2 === 'all') return 75;
    return 25;
  }

  private calculateActivityMatch(
    p1: ProfileEntity,
    p2: ProfileEntity,
  ): number {
    let score = 0;
    let factors = 0;

    // Occupation similarity (basic string check)
    if (p1.occupation && p2.occupation) {
      factors++;
      if (
        p1.occupation.toLowerCase() === p2.occupation.toLowerCase()
      ) {
        score += 80;
      } else {
        score += 30;
      }
    }

    // City match
    if (p1.city && p2.city) {
      factors++;
      if (p1.city.toLowerCase() === p2.city.toLowerCase()) {
        score += 100;
      } else {
        score += 20;
      }
    }

    // Education
    if (p1.education && p2.education) {
      factors++;
      if (p1.education.toLowerCase() === p2.education.toLowerCase()) {
        score += 70;
      } else {
        score += 30;
      }
    }

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  private findSharedInterests(
    p1: ProfileEntity,
    p2: ProfileEntity,
  ): string[] {
    const set1 = new Set(
      (p1.interests || []).map((i) => i.toLowerCase()),
    );
    return (p2.interests || []).filter((i) =>
      set1.has(i.toLowerCase()),
    );
  }

  private getCompatibilityLevel(
    score: number,
  ): 'low' | 'medium' | 'high' | 'soulmate' {
    if (score >= 85) return 'soulmate';
    if (score >= 65) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateVibeStatement(
    level: string,
    sharedInterests: string[],
  ): string {
    const interestNote =
      sharedInterests.length > 0
        ? ` You both share an interest in ${sharedInterests.slice(0, 3).join(', ')}.`
        : '';

    switch (level) {
      case 'soulmate':
        return `Incredible vibe match! You two are practically on the same wavelength.${interestNote}`;
      case 'high':
        return `Strong connection potential! There is a lot of common ground here.${interestNote}`;
      case 'medium':
        return `Decent compatibility. Worth exploring more about each other.${interestNote}`;
      case 'low':
        return `Different vibes, but opposites can attract! Keep an open mind.${interestNote}`;
      default:
        return `Check complete.${interestNote}`;
    }
  }

  private determineVibeEnergy(profile: ProfileEntity): string {
    const interests = profile.interests || [];

    const creativeKeywords = [
      'art',
      'music',
      'photography',
      'writing',
      'design',
    ];
    const activeKeywords = [
      'sports',
      'gym',
      'hiking',
      'running',
      'yoga',
    ];
    const socialKeywords = [
      'travel',
      'food',
      'nightlife',
      'events',
      'networking',
    ];
    const intellectualKeywords = [
      'reading',
      'tech',
      'science',
      'philosophy',
      'podcasts',
    ];

    const scores = {
      creative: 0,
      active: 0,
      social: 0,
      intellectual: 0,
    };

    for (const interest of interests) {
      const lower = interest.toLowerCase();
      if (creativeKeywords.some((k) => lower.includes(k)))
        scores.creative++;
      if (activeKeywords.some((k) => lower.includes(k)))
        scores.active++;
      if (socialKeywords.some((k) => lower.includes(k)))
        scores.social++;
      if (intellectualKeywords.some((k) => lower.includes(k)))
        scores.intellectual++;
    }

    const maxEntry = Object.entries(scores).sort(
      ([, a], [, b]) => b - a,
    )[0];

    switch (maxEntry[0]) {
      case 'creative':
        return 'Creative Soul';
      case 'active':
        return 'Active Energy';
      case 'social':
        return 'Social Butterfly';
      case 'intellectual':
        return 'Deep Thinker';
      default:
        return 'Balanced Vibes';
    }
  }
}
