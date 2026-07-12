import { Router } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import {
  createBounty,
  verifyBountyPayment,
  getBountiesByProduct,
  getSupplierBounties,
  getAllBounties,
  submitBountyProof,
  approveBountyProof,
  rejectBountyProof,
  getIssuerBounties
} from '../../controler/v2/bounty.controller.js';

const router = Router();

router.get('/', asyncHandler(getAllBounties));
router.post('/', asyncHandler(createBounty));
router.post('/verify', asyncHandler(verifyBountyPayment));
router.get('/product/:productId', asyncHandler(getBountiesByProduct));
router.get('/supplier/:supplierId', asyncHandler(getSupplierBounties));
router.get('/issuer/:issuerId', asyncHandler(getIssuerBounties));
router.post('/submit-proof', asyncHandler(submitBountyProof));
router.post('/:bountyId/approve-proof', asyncHandler(approveBountyProof));
router.post('/:bountyId/reject-proof', asyncHandler(rejectBountyProof));

export default router;
