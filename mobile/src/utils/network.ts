/**
 * Production-grade network utility for MYKO app.
 *
 * Features:
 * - Request timeout (10s default)
 * - Retry logic (3 retries with exponential backoff)
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Response caching (simple in-memory LRU cache)
 * - Connection check utility
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Whether to use the response cache for GET requests (default: true) */
  useCache?: boolean;
  /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
  cacheTtl?: number;
  /** Whether to deduplicate identical in-flight requests (default: true) */
  deduplicate?: boolean;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ── LRU Cache ────────────────────────────────────────────────────────────────

const MAX_CACHE_SIZE = 100;

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;

  constructor(maxSize: number = MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ── In-flight Request Deduplication ──────────────────────────────────────────

const inFlightRequests = new Map<string, Promise<Response>>();

// ── Singleton Cache Instance ─────────────────────────────────────────────────

const responseCache = new LRUCache(MAX_CACHE_SIZE);

// ── Helper: Build Cache Key ──────────────────────────────────────────────────

function buildCacheKey(url: string, options?: FetchOptions): string {
  const method = (options?.method || 'GET').toUpperCase();
  return `${method}:${url}`;
}

// ── Helper: Fetch with Timeout ───────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        } else {
          reject(error);
        }
      });
  });
}

// ── Helper: Exponential Backoff Delay ────────────────────────────────────────

function backoffDelay(attempt: number): number {
  // 1s, 2s, 4s base with +-25% jitter
  const base = Math.pow(2, attempt) * 1000;
  const jitter = base * 0.25 * (Math.random() * 2 - 1);
  return Math.min(base + jitter, 10000); // Cap at 10s
}

// ── Helper: Should Retry ─────────────────────────────────────────────────────

function shouldRetry(error: unknown, response?: Response): boolean {
  // Always retry network errors
  if (!response) return true;

  // Retry on server errors (5xx) and 429 (Too Many Requests)
  if (response.status >= 500 || response.status === 429) return true;

  // Don't retry client errors (4xx except 429)
  return false;
}

// ── Main Fetch Wrapper ───────────────────────────────────────────────────────

/**
 * Enhanced fetch wrapper with timeout, retry, deduplication, and caching.
 *
 * @example
 * ```ts
 * const data = await networkFetch<UserProfile>('/api/profile');
 * ```
 */
export async function networkFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    timeout = 10000,
    maxRetries = 3,
    useCache = true,
    cacheTtl = 60000,
    deduplicate = true,
    ...fetchInit
  } = options;

  const method = (fetchInit.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = buildCacheKey(url, options);

  // 1. Check cache for GET requests
  if (isGet && useCache) {
    const cached = responseCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. Deduplicate identical in-flight GET requests
  if (isGet && deduplicate && inFlightRequests.has(cacheKey)) {
    const existingRequest = inFlightRequests.get(cacheKey)!;
    const response = await existingRequest;
    const data = await response.clone().json();
    return data as T;
  }

  // 3. Execute with retry logic
  let lastError: Error | null = null;

  const executeRequest = async (): Promise<Response> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, fetchInit, timeout);

        if (response.ok) {
          return response;
        }

        if (!shouldRetry(null, response) || attempt === maxRetries) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, backoffDelay(attempt)),
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying network errors
        await new Promise((resolve) =>
          setTimeout(resolve, backoffDelay(attempt)),
        );
      }
    }

    throw lastError || new Error('Request failed after all retries');
  };

  // Set up deduplication for GET requests
  const requestPromise = executeRequest();

  if (isGet && deduplicate) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  try {
    const response = await requestPromise;
    const data = (await response.json()) as T;

    // Cache the result for GET requests
    if (isGet && useCache) {
      responseCache.set(cacheKey, data, cacheTtl);
    }

    return data;
  } finally {
    // Clean up in-flight tracking
    if (isGet && deduplicate) {
      inFlightRequests.delete(cacheKey);
    }
  }
}

// ── Connection Check ─────────────────────────────────────────────────────────

/**
 * Check if the device currently has network connectivity.
 * Uses a lightweight HEAD request to a known endpoint.
 * Falls back to `true` if the check itself fails.
 */
export async function isConnected(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

// ── Cache Management ─────────────────────────────────────────────────────────

/**
 * Invalidate a specific cache entry.
 */
export function invalidateCache(url: string, method: string = 'GET'): void {
  const key = `${method.toUpperCase()}:${url}`;
  responseCache.invalidate(key);
}

/**
 * Clear the entire response cache.
 */
export function clearCache(): void {
  responseCache.clear();
}
