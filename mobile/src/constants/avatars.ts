export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  gradientColors: [string, string];
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'urban-fox',
    name: 'UrbanFox',
    emoji: '\u{1F98A}',
    gradientColors: ['#0EA5E9', '#06B6D4'],
  },
  {
    id: 'solar-nomad',
    name: 'SolarNomad',
    emoji: '\u2B50',
    gradientColors: ['#F59E0B', '#F97316'],
  },
  {
    id: 'tidal-thinker',
    name: 'TidalThinker',
    emoji: '\u{1F30A}',
    gradientColors: ['#06B6D4', '#3B82F6'],
  },
  {
    id: 'night-hawk',
    name: 'NightHawk',
    emoji: '\u{1F985}',
    gradientColors: ['#6366F1', '#0EA5E9'],
  },
  {
    id: 'cosmic-drifter',
    name: 'CosmicDrifter',
    emoji: '\u{1F319}',
    gradientColors: ['#0EA5E9', '#F97316'],
  },
  {
    id: 'ember-spark',
    name: 'EmberSpark',
    emoji: '\u{1F525}',
    gradientColors: ['#EF4444', '#F97316'],
  },
];

export const DEFAULT_AVATAR_ID = 'urban-fox';

export function getAvatarById(id: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) || AVATAR_OPTIONS[0];
}
