import { Router } from 'express';
import { castVote, getQueue, getTopVerifiers, getUserHistory, getJoinedNodes } from '../controler/community.controler.js';
import { verifyJWT, optionalJWT } from '../midelware/verify.midelware.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../util/asyncHandler.util.js';

const router = Router();
router.post('/vote', castVote);
router.get('/queue', getQueue);
router.get('/leaderboard', getTopVerifiers);
router.get('/history/:userId', optionalJWT, getUserHistory);
router.get('/joined', optionalJWT, getJoinedNodes);

export default router;
