// Social Mode: Rich blue theme with vibrant cyan + warm orange accents (MYKO brand)
export const socialColors = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark: '#0284C7',
  secondary: '#F97316',
  secondaryLight: '#FB923C',
  accent: '#06B6D4',
  background: '#0B2545',
  surface: '#133E68',
  surfaceElevated: '#1A4F7A',
  text: '#FFFFFF',
  textSecondary: '#7DD3FC',
  textTertiary: '#93B8D7',
  textInverse: '#0B2545',
  border: '#1B5B8A',
  borderLight: '#0F3660',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  overlay: 'rgba(11, 37, 69, 0.8)',
  cardShadow: 'rgba(14, 165, 233, 0.3)',
  gradient: {
    start: '#0EA5E9',
    middle: '#06B6D4',
    end: '#F97316',
  },
  gradientCard: {
    start: '#F97316',
    middle: '#FB923C',
    end: '#0EA5E9',
  },
  tabBar: {
    active: '#0EA5E9',
    inactive: '#6B95B8',
    background: '#0B2545',
  },
  chat: {
    sent: '#0EA5E9',
    sentText: '#FFFFFF',
    received: '#133E68',
    receivedText: '#FFFFFF',
  },
  compatibility: {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444',
  },
  input: {
    background: '#133E68',
    border: '#1B5B8A',
    borderFocused: '#0EA5E9',
    placeholder: '#6B95B8',
    text: '#FFFFFF',
  },
} as const;

// Professional Mode: Warm light theme with deep navy + rich gold/orange accents (MYKO brand)
export const professionalColors = {
  primary: '#1E3A5F',
  primaryLight: '#2D5F8A',
  primaryDark: '#152C4A',
  secondary: '#D4A853',
  secondaryLight: '#E0BE7A',
  accent: '#E8820C',
  background: '#FFF7ED',
  surface: '#FFF1E0',
  surfaceElevated: '#FFECD1',
  text: '#1A1A2E',
  textSecondary: '#5A4A32',
  textTertiary: '#9A8468',
  textInverse: '#FFFFFF',
  border: '#F0D9B5',
  borderLight: '#F5E6CE',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  info: '#2563EB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(212, 168, 83, 0.2)',
  gradient: {
    start: '#1E3A5F',
    middle: '#2D5F8A',
    end: '#D4A853',
  },
  gradientCard: {
    start: '#1E3A5F',
    middle: '#2D5F8A',
    end: '#1E3A5F',
  },
  tabBar: {
    active: '#1E3A5F',
    inactive: '#9A8468',
    background: '#FFF7ED',
  },
  chat: {
    sent: '#1E3A5F',
    sentText: '#FFFFFF',
    received: '#FFECD1',
    receivedText: '#1A1A2E',
  },
  compatibility: {
    high: '#059669',
    medium: '#D97706',
    low: '#DC2626',
  },
  input: {
    background: '#FFECD1',
    border: '#F0D9B5',
    borderFocused: '#D4A853',
    placeholder: '#9A8468',
    text: '#1A1A2E',
  },
} as const;

// Admin Panel: Blue theme with MYKO brand
export const adminColors = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  background: '#0B2545',
  surface: '#133E68',
  surfaceElevated: '#1A4F7A',
  text: '#FFFFFF',
  textSecondary: '#7DD3FC',
  textTertiary: '#93B8D7',
  border: '#1B5B8A',
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
