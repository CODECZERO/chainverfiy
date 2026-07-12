import { Request, Response } from 'express';
import { asyncHandler } from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getStats } from '../dbQueries/order.Queries.js';
import { cacheGet, cacheSet } from '../util/redis.util.js';
import { withFallback } from '../lib/stale-cache.js';

const STATS_FALLBACK = { totalProducts: 0, verifiedProducts: 0, totalOrders: 0, totalSuppliers: 0, totalUsdcTransacted: 0, avgVerifyTime: 0, totalTrustTokens: 0 };

export const fetchStats = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'global:stats';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(new ApiResponse(200, cached, 'Stats fetched (cached)'));

  const { data: stats } = await withFallback(
    'stale:global:stats',
    () => getStats(),
    STATS_FALLBACK
  );

  await cacheSet(cacheKey, stats, 300); // 5 min
  return res.json(new ApiResponse(200, stats, 'Stats fetched'));
});
