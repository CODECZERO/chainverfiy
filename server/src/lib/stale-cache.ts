import logger from '../util/logger.js';
import { isDbUp, markDbDown, markDbUp, isDbUnreachableError } from './db-health.js';

// ─── In-Memory Stale Cache ───
// Acts as a temporary database for READ endpoints when Supabase is unreachable.
// Transparently caches successful query results and serves them during outages.
// The frontend never knows the difference.

interface CacheEntry {
  data: any;
  timestamp: number;
}

const store = new Map<string, CacheEntry>();

// Cache configuration
const DEFAULT_STALE_TTL_MS = 15 * 60 * 1000;  // 15 minutes — serve stale data up to this age
const MAX_STALE_TTL_MS = 60 * 60 * 1000;       // 60 minutes — absolute max before refusing stale
const MAX_CACHE_ENTRIES = 2000;                  // Handles full response-level caching for all GET endpoints

/**
 * Evict oldest entries when cache exceeds MAX_CACHE_ENTRIES.
 */
function evictOldest(): void {
  if (store.size <= MAX_CACHE_ENTRIES) return;
  // Find and remove the oldest entry
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, entry] of store) {
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      oldestKey = key;
    }
  }
  if (oldestKey) store.delete(oldestKey);
}

/**
 * Store a successful query result in the in-memory cache.
 */
export function setCachedResult(key: string, data: any): void {
  store.set(key, { data, timestamp: Date.now() });
  evictOldest();
}

/**
 * Get a cached result. Returns null if the key doesn't exist or is expired beyond MAX_STALE_TTL_MS.
 */
export function getCachedResult(key: string): any | null {
  const entry = store.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > MAX_STALE_TTL_MS) {
    store.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Check if a cached entry is "fresh" (within DEFAULT_STALE_TTL_MS).
 */
export function isCacheFresh(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return (Date.now() - entry.timestamp) < DEFAULT_STALE_TTL_MS;
}

/**
 * The main resilience wrapper. Use this around any read query.
 *
 * - On success: caches result, marks DB up, returns data.
 * - On DB failure: serves cached data transparently if available.
 * - If no cache available: returns the provided `emptyFallback`.
 *
 * The frontend never sees a difference.
 *
 * @example
 * ```ts
 * const products = await withFallback(
 *   'products:all',
 *   () => prisma.product.findMany({ ... }),
 *   { products: [], total: 0 }
 * );
 * ```
 */
export async function withFallback<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  emptyFallback: T,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await queryFn();
    // Success — cache the result and mark DB healthy
    setCachedResult(cacheKey, data);
    if (!isDbUp()) markDbUp();
    return { data, fromCache: false };
  } catch (err: any) {
    if (isDbUnreachableError(err)) {
      markDbDown();

      // Try serving from cache
      const cached = getCachedResult(cacheKey);
      if (cached !== null) {
        logger.info(`[StaleCache] Serving cached data for key: ${cacheKey}`);
        return { data: cached as T, fromCache: true };
      }

      // No cache available — return empty fallback so frontend gets a clean response
      logger.warn(`[StaleCache] No cache for key: ${cacheKey} — returning empty fallback`);
      return { data: emptyFallback, fromCache: true };
    }

    // Not a DB connectivity error — rethrow (it's a real bug)
    throw err;
  }
}

/**
 * Variant of withFallback for single-item queries (e.g. getProduct by ID).
 * Returns null instead of empty fallback if not cached.
 */
export async function withFallbackOrNull<T>(
  cacheKey: string,
  queryFn: () => Promise<T | null>,
): Promise<{ data: T | null; fromCache: boolean }> {
  try {
    const data = await queryFn();
    if (data !== null) {
      setCachedResult(cacheKey, data);
    }
    if (!isDbUp()) markDbUp();
    return { data, fromCache: false };
  } catch (err: any) {
    if (isDbUnreachableError(err)) {
      markDbDown();

      const cached = getCachedResult(cacheKey);
      if (cached !== null) {
        logger.info(`[StaleCache] Serving cached item for key: ${cacheKey}`);
        return { data: cached as T, fromCache: true };
      }

      return { data: null, fromCache: true };
    }

    throw err;
  }
}

/**
 * Get cache statistics (for internal monitoring).
 */
export function getCacheStats() {
  let freshCount = 0;
  let staleCount = 0;
  const now = Date.now();

  for (const [, entry] of store) {
    if ((now - entry.timestamp) < DEFAULT_STALE_TTL_MS) {
      freshCount++;
    } else {
      staleCount++;
    }
  }

  return {
    totalEntries: store.size,
    freshEntries: freshCount,
    staleEntries: staleCount,
    maxEntries: MAX_CACHE_ENTRIES,
  };
}
