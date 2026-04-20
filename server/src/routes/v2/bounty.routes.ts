import { Router } from 'express';
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

router.get('/', getAllBounties);
router.post('/', createBounty);
router.post('/verify', verifyBountyPayment);
router.get('/product/:productId', getBountiesByProduct);
router.get('/supplier/:supplierId', getSupplierBounties);
router.get('/issuer/:issuerId', getIssuerBounties);
router.post('/submit-proof', submitBountyProof);
router.post('/:bountyId/approve-proof', approveBountyProof);
router.post('/:bountyId/reject-proof', rejectBountyProof);

export default router;
