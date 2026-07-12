import { Router } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import { getBuyerProfile, updateBuyerProfile } from '../../controler/v2/buyer.controller.js';
import { verifyJWT } from '../../midelware/verify.midelware.js';

const router = Router();

router.get('/', asyncHandler(getBuyerProfile));
router.put('/', asyncHandler(updateBuyerProfile));

export default router;
