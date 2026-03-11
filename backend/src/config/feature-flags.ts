import { ConfigService } from '@nestjs/config';

export interface FeatureFlags {
  vibeCheck: boolean;
  videoChat: boolean;
  professionalMode: boolean;
  groupVibes: boolean;
}

export function getFeatureFlags(configService: ConfigService): FeatureFlags {
  return {
    vibeCheck: configService.get<boolean>('FF_VIBE_CHECK', true),
    videoChat: configService.get<boolean>('FF_VIDEO_CHAT', false),
    professionalMode: configService.get<boolean>('FF_PROFESSIONAL_MODE', true),
    groupVibes: configService.get<boolean>('FF_GROUP_VIBES', false),
  };
}

export const FEATURE_FLAGS = 'FEATURE_FLAGS';

/**
 * Check whether a specific feature is enabled.
 * Usage in services:
 *   @Inject(FEATURE_FLAGS) private flags: FeatureFlags
 *   if (this.flags.vibeCheck) { ... }
 */
export function isFeatureEnabled(
  flags: FeatureFlags,
  feature: keyof FeatureFlags,
): boolean {
  return flags[feature] === true;
}
