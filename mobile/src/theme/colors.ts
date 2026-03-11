// Social Mode: Deep dark theme with violet/pink gradient identity
export const socialColors = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  accent: '#06B6D4',
  background: '#0F0A1A',
  surface: '#1A1128',
  surfaceElevated: '#241B35',
  text: '#FFFFFF',
  textSecondary: '#A78BFA',
  textTertiary: '#6B7280',
  textInverse: '#0F0A1A',
  border: '#2D2340',
  borderLight: '#1F1730',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.7)',
  cardShadow: 'rgba(139, 92, 246, 0.3)',
  gradient: {
    start: '#8B5CF6',
    middle: '#A855F7',
    end: '#EC4899',
  },
  gradientCard: {
    start: '#EC4899',
    middle: '#D946EF',
    end: '#8B5CF6',
  },
  tabBar: {
    active: '#8B5CF6',
    inactive: '#6B7280',
    background: '#0F0A1A',
  },
  chat: {
    sent: '#8B5CF6',
    sentText: '#FFFFFF',
    received: '#1A1128',
    receivedText: '#FFFFFF',
  },
  compatibility: {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444',
  },
  input: {
    background: '#1A1128',
    border: '#2D2340',
    borderFocused: '#8B5CF6',
    placeholder: '#6B7280',
    text: '#FFFFFF',
  },
} as const;

// Professional Mode: Clean light theme with navy/teal accent system
export const professionalColors = {
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  primaryDark: '#0D9488',
  secondary: '#0284C7',
  secondaryLight: '#38BDF8',
  accent: '#8B5CF6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(15, 118, 110, 0.15)',
  gradient: {
    start: '#0F766E',
    middle: '#0891B2',
    end: '#0284C7',
  },
  gradientCard: {
    start: '#0F766E',
    middle: '#0891B2',
    end: '#0EA5E9',
  },
  tabBar: {
    active: '#0F766E',
    inactive: '#94A3B8',
    background: '#FFFFFF',
  },
  chat: {
    sent: '#0F766E',
    sentText: '#FFFFFF',
    received: '#F1F5F9',
    receivedText: '#0F172A',
  },
  compatibility: {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444',
  },
  input: {
    background: '#F1F5F9',
    border: '#E2E8F0',
    borderFocused: '#0F766E',
    placeholder: '#94A3B8',
    text: '#0F172A',
  },
} as const;

// Admin Panel: Dark theme with high-contrast red/yellow alert states
export const adminColors = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  background: '#0F0A1A',
  surface: '#1A1128',
  surfaceElevated: '#241B35',
  text: '#FFFFFF',
  textSecondary: '#A78BFA',
  textTertiary: '#6B7280',
  border: '#2D2340',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  alertHigh: '#EF4444',
  alertMedium: '#F59E0B',
  alertLow: '#3B82F6',
} as const;

// Use a widened type so both social and professional palettes are assignable
type DeepWiden<T> = {
  [K in keyof T]: T[K] extends object ? DeepWiden<T[K]> : string;
};

export type ColorPalette = DeepWiden<typeof socialColors>;
