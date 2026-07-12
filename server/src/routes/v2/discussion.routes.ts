import { Router } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import * as DiscussionController from '../../controler/v2/discussion.controller.js';
import { verifyJWT } from '../../midelware/verify.midelware.js';

const router = Router();

router.get('/', asyncHandler(DiscussionController.getDiscussions));
router.get('/:id', asyncHandler(DiscussionController.getDiscussionById));

// Protected routes (require JWT, but for community we might want to allow wallet-only later)
router.post('/', verifyJWT, asyncHandler(DiscussionController.createDiscussion));
router.post('/comments', verifyJWT, asyncHandler(DiscussionController.addComment));

export default router;
