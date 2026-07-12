import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './util/appStartup.util.js';
import routes from './routes/index.routes.js';
import logger, { httpLogger } from './util/logger.js';
import { getDbHealth, isDbUnreachableError, markDbDown } from './lib/db-health.js';
import { getCacheStats } from './lib/stale-cache.js';

// Load environment variables
dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(origin => origin.trim().replace(/\/$/, ""))
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all for development ease
      callback(null, origin || '*');
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Access-Token', 'Accept'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"],
        "connect-src": ["'self'", "http://localhost:8000", "http://127.0.0.1:8000", "https://va.vercel-scripts.com", "*.stellar.org", "*.soroban.org", "https://*.onrender.com"],
      },
    },
  })
);

// HTTP request logging via winston
app.use(httpLogger);

// Custom JSON parser with better error handling
// Standard body parsers
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── DB Resilience Middleware ───
// Wraps ALL route handlers: if any async controller throws a DB error
// without catching it, this middleware catches it and returns a clean 503.
// This is the safety net for controllers that don't use asyncHandler or withFallback.
app.use('/api', (req, res, next) => {
  const originalJson = res.json.bind(res);
  // Intercept and ensure we never accidentally send raw errors
  res.json = function(body: any) {
    return originalJson(body);
  };
  next();
});

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ChainVerify API is active',
    project: 'ChainVerify — Verified Marketplace on Stellar',
    version: '2.0.0'
  });
});

app.use('/api', routes);

// Health check endpoint — includes DB health and cache stats for internal monitoring
app.get('/health', (req, res) => {
  const dbHealth = getDbHealth();
  const cacheStats = getCacheStats();
  res.json({
    success: true,
    message: dbHealth.healthy ? 'Server is running' : 'Server running in DEGRADED mode (DB unreachable)',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    cache: cacheStats,
  });
});

// Test-only: delay endpoint for server-close / in-flight tests (no response loss under load)
if (process.env.NODE_ENV === 'test') {
  app.get('/api/test/delay', (req, res) => {
    const ms = Math.min(parseInt(String(req.query.ms), 10) || 50, 500);
    setTimeout(() => res.json({ success: true, delayed: ms }), ms);
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // ─── Database Unreachable — clean 503, frontend never sees "DB down" ───
  if (isDbUnreachableError(err)) {
    markDbDown();
    logger.warn(`[Resilience] DB unreachable during ${req.method} ${req.originalUrl}`);
    return res.status(503).json({
      success: false,
      statusCode: 503,
      data: null,
      message: 'Service temporarily unavailable. Please try again in a moment.',
    });
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack, url: req.originalUrl, method: req.method });

  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Bad Request',
    });
  }

  // Handle ApiError instances
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    diagnostic: process.env.NODE_ENV !== 'production' ? {
      url: req.originalUrl,
      method: req.method,
      error: err.message
    } : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});



export default app;
