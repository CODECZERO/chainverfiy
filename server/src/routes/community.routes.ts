import { Router } from 'express';
import { castVote, getQueue, getTopVerifiers, getUserHistory } from '../controler/community.controler.js';
import { verifyJWT, optionalJWT } from '../midelware/verify.midelware.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../util/asyncHandler.util.js';

const router = Router();
router.post('/vote', castVote);
router.get('/queue', getQueue);
router.get('/leaderboard', getTopVerifiers);
router.get('/history/:userId', optionalJWT, getUserHistory);

export default router;
