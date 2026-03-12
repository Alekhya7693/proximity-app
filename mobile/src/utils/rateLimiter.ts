/**
 * Client-side rate limiter utilities for Proximity app.
 *
 * Features:
 * - Debounce: Prevent rapid button taps (delays execution until pause)
 * - Throttle: Limit how often a function can fire (execute at most once per interval)
 * - useThrottledCallback: React hook for throttled callbacks
 * - useDebouncedCallback: React hook for debounced callbacks
 */

import { useCallback, useRef, useEffect } from 'react';

// ── Debounce ─────────────────────────────────────────────────────────────────

/**
 * Creates a debounced version of a function.
 * The function will only be called after `delayMs` milliseconds
 * of inactivity (no new calls).
 *
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds (default: 300)
 * @returns Debounced function with a `.cancel()` method
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 300,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, delayMs);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// ── Throttle ─────────────────────────────────────────────────────────────────

/**
 * Creates a throttled version of a function.
 * The function will execute at most once every `intervalMs` milliseconds.
 * Uses a leading-edge strategy: fires immediately on first call,
 * then suppresses until the interval elapses.
 *
 * @param fn - The function to throttle
 * @param intervalMs - Minimum interval between calls in milliseconds (default: 500)
 * @returns Throttled function with a `.cancel()` method
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number = 500,
): T & { cancel: () => void } {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = intervalMs - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      // Enough time has passed, fire immediately
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      fn.apply(this, args);
    } else if (timeoutId === null) {
      // Schedule a trailing call
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
        }
        lastArgs = null;
        lastThis = null;
      }, remaining);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  return throttled;
}

// ── React Hooks ──────────────────────────────────────────────────────────────

/**
 * React hook that returns a throttled version of the given callback.
 * The throttled function fires at most once every `intervalMs` milliseconds.
 * Automatically cleans up on unmount.
 *
 * @param callback - The callback to throttle
 * @param intervalMs - Minimum interval between calls (default: 500)
 *
 * @example
 * ```tsx
 * const handleSwipe = useThrottledCallback(
 *   (direction: string) => { api.swipe(direction); },
 *   500,
 * );
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  intervalMs: number = 500,
): T {
  const callbackRef = useRef(callback);

  // Always keep the ref updated to the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledRef = useRef<(T & { cancel: () => void }) | null>(null);

  if (throttledRef.current === null) {
    throttledRef.current = throttle(
      ((...args: any[]) => callbackRef.current(...args)) as T,
      intervalMs,
    );
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      throttledRef.current?.cancel();
    };
  }, []);

  return throttledRef.current as T;
}

/**
 * React hook that returns a debounced version of the given callback.
 * The debounced function only fires after `delayMs` milliseconds of inactivity.
 * Automatically cleans up on unmount.
 *
 * @param callback - The callback to debounce
 * @param delayMs - Delay in milliseconds (default: 300)
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => { api.search(query); },
 *   300,
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedRef = useRef<(T & { cancel: () => void }) | null>(null);

  if (debouncedRef.current === null) {
    debouncedRef.current = debounce(
      ((...args: any[]) => callbackRef.current(...args)) as T,
      delayMs,
    );
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      debouncedRef.current?.cancel();
    };
  }, []);

  return debouncedRef.current as T;
}
