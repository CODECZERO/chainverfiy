import { Request, Response, NextFunction } from 'express';
import { isDbUp, isDbUnreachableError, markDbDown } from '../lib/db-health.js';
import { setCachedResult, getCachedResult } from '../lib/stale-cache.js';
import logger from '../util/logger.js';

// ─── Automatic Response-Level Resilience Middleware ───
//
// This middleware does TWO things transparently:
//
// 1. CACHE: On every successful GET response, caches the JSON body
//    keyed by the full URL (including query params).
//
// 2. SERVE: When the DB is down and a GET request would normally fail,
//    the global error handler calls `tryCachedResponse()` to replay
//    the last successful response for that URL.
//
// The frontend NEVER sees a difference — it always gets a 200 with data.

/**
 * Build a cache key from a request.
 * Uses method + full original URL (includes query string).
 */
function buildRequestCacheKey(req: Request): string {
  return `res:${req.method}:${req.originalUrl}`;
}

/**
 * Middleware: intercept successful GET responses and cache them.
 * Hooks into res.json() so it captures the FINAL response body
 * after all controller logic has run.
 */
export function responseCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only cache GET requests (reads)
  if (req.method !== 'GET') {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    // Only cache successful responses (2xx status)
    if (res.statusCode >= 200 && res.statusCode < 300 && body) {
      const key = buildRequestCacheKey(req);
      setCachedResult(key, {
        statusCode: res.statusCode,
        body,
      });
    }
    return originalJson(body);
  };

  next();
}

/**
 * Try to serve a cached response for a failed GET request.
 * Called from the global error handler when a DB error is detected.
 * Returns true if a cached response was served, false if no cache available.
 */
export function tryCachedResponse(req: Request, res: Response): boolean {
  // Only replay cache for GET requests
  if (req.method !== 'GET') return false;

  const key = buildRequestCacheKey(req);
  const cached = getCachedResult(key);

  if (cached && cached.body) {
    logger.info(`[Resilience] Serving cached response for ${req.originalUrl}`);
    res.status(cached.statusCode || 200).json(cached.body);
    return true;
  }

  return false;
}

/**
 * For GET requests when DB is known to be down BEFORE hitting the controller,
 * try to serve from cache immediately to avoid the Prisma timeout wait.
 * This is a performance optimization — skip the 5-10s Prisma timeout
 * and serve the cached version instantly.
 */
export function preflightCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET') {
    return next();
  }

  // If DB is known to be down, try serving from cache immediately
  if (!isDbUp()) {
    const key = buildRequestCacheKey(req);
    const cached = getCachedResult(key);

    if (cached && cached.body) {
      logger.info(`[Resilience] Pre-flight cache hit for ${req.originalUrl} (DB is down)`);
      res.status(cached.statusCode || 200).json(cached.body);
      return; // Don't call next() — response already sent
    }
  }

  // DB is up, or no cache — proceed normally
  next();
}
