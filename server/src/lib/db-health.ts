import { prisma } from './prisma.js';
import logger from '../util/logger.js';

// ─── Database Health Tracker ───
// Monitors Supabase connectivity with periodic pings.
// When the DB goes down, the rest of the system can check `isDbUp()`
// and serve cached data instead of crashing.

let _isHealthy = true;
let _lastHealthyAt: Date = new Date();
let _consecutivePingFailures = 0;
let _pingInterval: ReturnType<typeof setInterval> | null = null;

const PING_INTERVAL_MS = 30_000; // 30 seconds
const MAX_PING_TIMEOUT_MS = 5_000; // 5 seconds

/**
 * Attempt a lightweight DB ping. Returns true if reachable.
 */
async function pingDb(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRawUnsafe('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB ping timeout')), MAX_PING_TIMEOUT_MS)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a single health check cycle.
 */
async function healthCheckCycle(): Promise<void> {
  const reachable = await pingDb();

  if (reachable) {
    if (!_isHealthy) {
      logger.info('[DB-Health] Database connection RECOVERED');
    }
    _isHealthy = true;
    _lastHealthyAt = new Date();
    _consecutivePingFailures = 0;
  } else {
    _consecutivePingFailures++;
    _isHealthy = false;
    // Only log on 1st failure and every 10th to prevent spam
    if (_consecutivePingFailures === 1 || _consecutivePingFailures % 10 === 0) {
      logger.warn(`[DB-Health] Database UNREACHABLE (failure #${_consecutivePingFailures})`);
    }
  }
}

/**
 * Start the periodic health check loop.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startHealthCheck(): void {
  if (_pingInterval) return;
  logger.info(`[DB-Health] Starting health monitor (interval: ${PING_INTERVAL_MS / 1000}s)`);
  _pingInterval = setInterval(healthCheckCycle, PING_INTERVAL_MS);
  // Run immediately on start
  healthCheckCycle();
}

/**
 * Stop the health check loop (for graceful shutdown / tests).
 */
export function stopHealthCheck(): void {
  if (_pingInterval) {
    clearInterval(_pingInterval);
    _pingInterval = null;
  }
}

/**
 * Check if the database is currently healthy.
 */
export function isDbUp(): boolean {
  return _isHealthy;
}

/**
 * Manually mark the database as down (called when a query catches a DB error).
 */
export function markDbDown(): void {
  if (_isHealthy) {
    logger.warn('[DB-Health] Marked DOWN by query failure');
  }
  _isHealthy = false;
  _consecutivePingFailures++;
}

/**
 * Manually mark the database as up (called when a query succeeds after a failure period).
 */
export function markDbUp(): void {
  if (!_isHealthy) {
    logger.info('[DB-Health] Marked UP by successful query');
  }
  _isHealthy = true;
  _lastHealthyAt = new Date();
  _consecutivePingFailures = 0;
}

/**
 * Get full health status (for internal monitoring / `/health` endpoint).
 */
export function getDbHealth() {
  return {
    healthy: _isHealthy,
    lastHealthyAt: _lastHealthyAt.toISOString(),
    consecutiveFailures: _consecutivePingFailures,
  };
}

/**
 * Detect if a thrown error is a Prisma "database not reachable" error.
 */
export function isDbUnreachableError(err: any): boolean {
  if (!err) return false;
  const message = err.message || '';
  const cause = err.cause;

  // Prisma adapter throws with cause.kind === 'DatabaseNotReachable'
  if (cause && cause.kind === 'DatabaseNotReachable') return true;

  // Common Prisma / pg error messages
  if (message.includes("Can't reach database server")) return true;
  if (message.includes('DatabaseNotReachable')) return true;
  if (message.includes('Connection terminated unexpectedly')) return true;
  if (message.includes('ECONNREFUSED')) return true;
  if (message.includes('ETIMEDOUT')) return true;
  if (message.includes('DB query timeout')) return true;
  if (message.includes('connect EHOSTUNREACH')) return true;

  return false;
}
