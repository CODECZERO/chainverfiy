import { Router } from 'express';
import { castVote, getQueue, getTopVerifiers, getUserHistory } from '../controler/community.controler.js';
import { verifyJWT } from '../midelware/verify.midelware.js';

const router = Router();
router.post('/vote', castVote);
router.get('/queue', getQueue);
router.get('/leaderboard', getTopVerifiers);
router.get('/history/:userId', verifyJWT, getUserHistory);

export default router;
