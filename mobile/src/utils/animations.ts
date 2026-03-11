import { Platform } from 'react-native';

/**
 * Wraps a Reanimated entering/exiting animation to be web-safe.
 * Reanimated layout animations (FadeInUp, FadeInDown, etc.) don't work on web
 * and cause elements to remain invisible. This utility returns undefined on web
 * so the entering prop is not applied.
 */
export function enteringAnim<T>(animation: T): T | undefined {
  return Platform.OS === 'web' ? undefined : animation;
}
