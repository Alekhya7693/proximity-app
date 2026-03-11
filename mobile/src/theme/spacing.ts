export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
} as const;

export const hitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export const screenPadding = {
  horizontal: spacing.lg,
  vertical: spacing.lg,
} as const;
