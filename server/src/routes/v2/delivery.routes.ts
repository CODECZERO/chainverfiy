import { Router } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import { verifyJWT, optionalJWT } from '../../midelware/verify.midelware.js';
import {
  getOrderForDelivery,
  confirmDelivery,
  uploadDisputeProof,
  getOrdersByWallet,
  processExpiredDisputes,
} from '../../controler/v2/delivery.controller.js';

const router = Router();

// Process expired disputes — auto-refund orders past 72-hour proof window
// MUST come before /:orderId routes to prevent path collision
router.post('/process-expired-disputes', asyncHandler(processExpiredDisputes));

// Wallet-matched order lookup — no JWT needed (wallet is the auth)
router.get('/by-wallet/:publicKey', asyncHandler(getOrdersByWallet));

// Single order for delivery confirmation — checks wallet matches buyer
router.get('/:orderId/delivery-view', asyncHandler(getOrderForDelivery));

// Buyer confirms receipt — supports both JWT and wallet-only users
router.post('/:orderId/confirm', optionalJWT, asyncHandler(confirmDelivery));

// Buyer uploads dispute proof within 3-day window — supports both JWT and wallet-only users
router.post('/:orderId/dispute-proof', optionalJWT, asyncHandler(uploadDisputeProof));

export default router;
