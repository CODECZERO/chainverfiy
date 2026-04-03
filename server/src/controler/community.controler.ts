import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { submitVote, getPendingVerificationQueue, getLeaderboard } from '../dbQueries/community.Queries.js';
import { cacheGet, cacheSet, cacheDel } from '../util/redis.util.js';

export const castVote = asyncHandler(async (req: Request, res: Response) => {
  const { productId, userId, voteType, reason } = req.body;
  const result = await submitVote(productId, userId, voteType, reason);
  
  // Invalidate related caches
  await cacheDel('community:queue');
  await cacheDel('community:leaderboard');
  await cacheDel(`post:${productId}`);
  await cacheDel('posts:*');
  
  return res.status(201).json(new ApiResponse(201, result, 'Vote recorded'));
});

export const getQueue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const cacheKey = userId ? `community:queue:${userId}` : 'community:queue:public';
  
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(new ApiResponse(200, cached, `Verification queue fetched (cached${userId ? ' for user' : ''})`));

  try {
    const queue = await getPendingVerificationQueue(userId);
    await cacheSet(cacheKey, queue, userId ? 60 : 300); // 1 min for user-specific, 5 min for public
    return res.json(new ApiResponse(200, queue, 'Verification queue fetched'));
  } catch {
    return res.json(new ApiResponse(200, [], 'Verification queue fetched (fallback)'));
  }
});

export const getTopVerifiers = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'community:leaderboard';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(new ApiResponse(200, cached, 'Leaderboard fetched (cached)'));

  const leaderboard = await getLeaderboard();
  await cacheSet(cacheKey, leaderboard, 600); // 10 min
  return res.json(new ApiResponse(200, leaderboard, 'Leaderboard fetched'));
});

export const getUserHistory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json(new ApiResponse(400, null, 'User ID or Wallet required.'));
  const { getVotesForUser } = await import('../dbQueries/community.Queries.js');
  
  let targetId = userId;
  if (userId.length > 40) {
    const user = await prisma.user.findUnique({ where: { stellarWallet: userId } });
    if (!user) return res.json(new ApiResponse(200, [], 'User not found.'));
    targetId = user.id;
  }

  const history = await getVotesForUser(targetId as string);
  return res.json(new ApiResponse(200, history, 'User voting history fetched'));
});
