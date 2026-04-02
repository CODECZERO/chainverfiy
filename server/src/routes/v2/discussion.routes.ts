import { Router } from 'express';
import * as DiscussionController from '../../controler/v2/discussion.controller.js';
import { verifyJWT } from '../../midelware/verify.midelware.js';

const router = Router();

router.get('/', DiscussionController.getDiscussions);
router.get('/:id', DiscussionController.getDiscussionById);

// Protected routes (require JWT, but for community we might want to allow wallet-only later)
router.post('/', verifyJWT, DiscussionController.createDiscussion);
router.post('/comments', verifyJWT, DiscussionController.addComment);

export default router;
