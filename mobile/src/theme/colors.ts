export const socialColors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',
  secondary: '#FD79A8',
  secondaryLight: '#FDCBDF',
  accent: '#00CEC9',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  textTertiary: '#B2BEC3',
  textInverse: '#FFFFFF',
  border: '#DFE6E9',
  borderLight: '#F0F3F5',
  error: '#FF6B6B',
  success: '#00B894',
  warning: '#FDCB6E',
  info: '#74B9FF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(108, 92, 231, 0.15)',
  gradient: {
    start: '#6C5CE7',
    end: '#A29BFE',
  },
  tabBar: {
    active: '#6C5CE7',
    inactive: '#B2BEC3',
    background: '#FFFFFF',
  },
  chat: {
    sent: '#6C5CE7',
    sentText: '#FFFFFF',
    received: '#F0F3F5',
    receivedText: '#2D3436',
  },
  compatibility: {
    high: '#00B894',
    medium: '#FDCB6E',
    low: '#FF6B6B',
  },
} as const;

export const professionalColors = {
  primary: '#0984E3',
  primaryLight: '#74B9FF',
  primaryDark: '#0767B5',
  secondary: '#00CEC9',
  secondaryLight: '#81ECEC',
  accent: '#6C5CE7',
  background: '#FFFFFF',
  surface: '#F5F6FA',
  surfaceElevated: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  textTertiary: '#B2BEC3',
  textInverse: '#FFFFFF',
  border: '#DFE6E9',
  borderLight: '#F0F3F5',
  error: '#FF6B6B',
  success: '#00B894',
  warning: '#FDCB6E',
  info: '#74B9FF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(9, 132, 227, 0.15)',
  gradient: {
    start: '#0984E3',
    end: '#74B9FF',
  },
  tabBar: {
    active: '#0984E3',
    inactive: '#B2BEC3',
    background: '#FFFFFF',
  },
  chat: {
    sent: '#0984E3',
    sentText: '#FFFFFF',
    received: '#F0F3F5',
    receivedText: '#2D3436',
  },
  compatibility: {
    high: '#00B894',
    medium: '#FDCB6E',
    low: '#FF6B6B',
  },
} as const;

export type ColorPalette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  overlay: string;
  cardShadow: string;
  gradient: { start: string; end: string };
  tabBar: { active: string; inactive: string; background: string };
  chat: { sent: string; sentText: string; received: string; receivedText: string };
  compatibility: { high: string; medium: string; low: string };
};
