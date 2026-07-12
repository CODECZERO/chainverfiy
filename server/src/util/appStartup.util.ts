import { prisma } from '../lib/prisma.js';
import logger from './logger.js';
import { startHealthCheck, markDbDown, markDbUp } from '../lib/db-health.js';

export const connectDB = async () => {
  try {
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB connect timeout (10s)')), 10_000)
      ),
    ]);
    markDbUp();
    logger.info('PostgreSQL connected via Prisma');
  } catch (error: any) {
    // CRITICAL: Do NOT throw. Let the server start without the DB.
    // The in-memory stale cache will serve cached data for read endpoints.
    // The health-check loop will detect when the DB recovers.
    markDbDown();
    logger.warn(`PostgreSQL connection failed — server will start in DEGRADED mode: ${error.message}`);
  }

  // Start periodic DB health monitoring regardless of initial connection status
  startHealthCheck();
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
};
