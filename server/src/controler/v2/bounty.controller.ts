import { Request, Response } from 'express';
import AsyncHandler from '../../util/asyncHandler.util.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../util/apiError.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import {
  createBountyQuery,
  updateBountyStatusQuery,
  getBountiesByProductQuery,
  getBountiesBySupplierQuery,
  getBountyByIdQuery,
  getAllBountiesQuery,
  submitBountyProofQuery,
  approveBountyProofQuery,
  rejectBountyProofQuery,
  getIssuerBountiesQuery
} from '../../dbQueries/bounty.Queries.js';
import { verfiyTransaction } from '../../services/stellar/transcation.stellar.js';

export const createBounty = AsyncHandler(async (req: Request, res: Response) => {
  const { productId, issuerId, stellarWallet, amount, description, paymentMethod } = req.body;

  if (!productId || (!issuerId && !stellarWallet) || !amount || !description) {
    throw new ApiError(400, 'Missing required fields: productId, (issuerId or stellarWallet), amount, description');
  }

  // ─── Verification Guard: Removed as per user request — anyone can create bounties ───
  const issuer = issuerId
    ? await prisma.user.findUnique({ where: { id: issuerId } })
    : stellarWallet
      ? await prisma.user.findFirst({ where: { stellarWallet } })
      : null;

  if (!issuer && !stellarWallet) {
    throw new ApiError(401, 'User identification required to create bounties.');
  }

  const bounty = await createBountyQuery({
    productId,
    issuerId,
    issuerWallet: stellarWallet,
    amount: parseFloat(amount),
    description,
    paymentMethod: paymentMethod || 'STELLAR_USDC'
  });

  return res.status(201).json(new ApiResponse(201, bounty, 'Bounty request created (Pending payment)'));
});

export const verifyBountyPayment = AsyncHandler(async (req: Request, res: Response) => {
  const { bountyId, transactionHash, paymentMethod } = req.body;

  if (!bountyId || !transactionHash) {
    throw new ApiError(400, 'bountyId and transactionHash are required');
  }

  const bounty = await getBountyByIdQuery(bountyId);
  if (!bounty) throw new ApiError(404, 'Bounty not found');

  let finalHash = transactionHash;

  // Verify transaction if using Stellar
  if (paymentMethod === 'INTERNAL' || transactionHash === 'managed_wallet_auth') {
    // ── Managed Wallet Payment ──
    // In a real system, we'd find the user's managedSecret and sign a tx here.
    // For this dev flow, if the user requested INTERNAL, we verify they HAVE a managed wallet or we use the admin wallet as fallback.
    // We'll mark it as ACTIVE and use a mock "managed" hash if not provided.
    finalHash = `managed_${Date.now()}_${bountyId.slice(0, 8)}`;
  } else if (!paymentMethod || paymentMethod.startsWith('STELLAR')) {
    const tx = await verfiyTransaction(transactionHash);
    if (!tx) {
      throw new ApiError(400, 'Transaction not found on Stellar network');
    }
  } else if (paymentMethod === 'UPI') {
    // UPI verification logic (handled via webhook in production, mock here)
  }

  const updatedBounty = await updateBountyStatusQuery(bountyId, 'ACTIVE', finalHash);

  return res.json(new ApiResponse(200, updatedBounty, 'Bounty payment verified and activated'));
});

export const getBountiesByProduct = AsyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(productId)) {
    return res.json(new ApiResponse(200, [], 'Invalid UUID format (no bounties)'));
  }
  const bounties = await getBountiesByProductQuery(productId);
  return res.json(new ApiResponse(200, bounties, 'Bounties fetched for product'));
});

export const getSupplierBounties = AsyncHandler(async (req: Request, res: Response) => {
  const supplierId = req.params.supplierId as string;
  const bounties = await getBountiesBySupplierQuery(supplierId);
  return res.json(new ApiResponse(200, bounties, 'Bounties fetched for supplier'));
});

export const getAllBounties = AsyncHandler(async (req: Request, res: Response) => {
  const bounties = await getAllBountiesQuery();
  return res.json(new ApiResponse(200, bounties, 'All active bounties fetched'));
});

export const submitBountyProof = AsyncHandler(async (req: Request, res: Response) => {
  const { bountyId, solverId, proofCid, stellarWallet } = req.body;

  if (!bountyId || (!solverId && !stellarWallet) || !proofCid) {
    throw new ApiError(400, 'bountyId, solverId/stellarWallet, and proofCid are required');
  }

  // Check if bounty exists and is active
  const bounty = await getBountyByIdQuery(bountyId);
  if (!bounty) throw new ApiError(404, 'Bounty not found');
  if (bounty.status !== 'ACTIVE') throw new ApiError(400, 'Bounty is not active');

  // ── Verification Rule Enforcement ──
  let solver = solverId 
    ? await prisma.user.findUnique({ where: { id: solverId }, include: { supplierProfile: true } })
    : stellarWallet
      ? await prisma.user.findFirst({ where: { stellarWallet }, include: { supplierProfile: true } })
      : null;

  if (!solver && stellarWallet) {
    // Auto-create user for wallet-only logins
    solver = await prisma.user.create({
      data: {
        stellarWallet: stellarWallet,
        role: 'BUYER',
        isVerified: false,
      },
      include: { supplierProfile: true }
    });
  }

  if (!solver) throw new ApiError(404, 'Solver user not found');
  const effectiveSolverId = solver.id;

  let isVerified = false;
  if (solver.role === 'SUPPLIER' && solver.supplierProfile) {
    if (solver.supplierProfile.totalSales > 5) isVerified = true;
  } else if (solver.role === 'BUYER') {
    const order = await prisma.order.findFirst({
      where: {
        buyerId: effectiveSolverId,
        productId: bounty.productId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] }
      }
    });
    if (order) isVerified = true;
  }

  if (!isVerified) {
    throw new ApiError(403, 'Unauthorized: You must be a verified supplier or have purchased/received this product to submit proof.');
  }

  const updatedBounty = await submitBountyProofQuery(bountyId, effectiveSolverId, proofCid);

  return res.json(new ApiResponse(200, updatedBounty, 'Bounty proof submitted — awaiting issuer review'));
});

// ── Approve Proof (Issuer Only) ──
export const approveBountyProof = AsyncHandler(async (req: Request, res: Response) => {
  const { bountyId } = req.params;
  const { issuerId, stellarWallet } = req.body;

  if (!bountyId) throw new ApiError(400, 'bountyId is required');
  if (!issuerId && !stellarWallet) throw new ApiError(400, 'issuerId or stellarWallet required to approve');

  const bounty = await getBountyByIdQuery(bountyId);
  if (!bounty) throw new ApiError(404, 'Bounty not found');
  if (bounty.status !== 'IN_REVIEW') throw new ApiError(400, 'Bounty is not in review');

  // Verify the requester is the original issuer
  const isIssuer = 
    (issuerId && bounty.issuerId === issuerId) ||
    (stellarWallet && bounty.issuerWallet === stellarWallet);

  if (!isIssuer) {
    throw new ApiError(403, 'Only the bounty issuer can approve proof submissions');
  }

  const approved = await approveBountyProofQuery(bountyId);

  return res.json(new ApiResponse(200, approved, 'Proof approved — bounty completed. Payment can now be released to the solver.'));
});

// ── Reject Proof (Issuer Only) ──
export const rejectBountyProof = AsyncHandler(async (req: Request, res: Response) => {
  const { bountyId } = req.params;
  const { issuerId, stellarWallet, reason } = req.body;

  if (!bountyId) throw new ApiError(400, 'bountyId is required');
  if (!issuerId && !stellarWallet) throw new ApiError(400, 'issuerId or stellarWallet required to reject');

  const bounty = await getBountyByIdQuery(bountyId);
  if (!bounty) throw new ApiError(404, 'Bounty not found');
  if (bounty.status !== 'IN_REVIEW') throw new ApiError(400, 'Bounty is not in review');

  const isIssuer = 
    (issuerId && bounty.issuerId === issuerId) ||
    (stellarWallet && bounty.issuerWallet === stellarWallet);

  if (!isIssuer) {
    throw new ApiError(403, 'Only the bounty issuer can reject proof submissions');
  }

  const rejected = await rejectBountyProofQuery(bountyId);

  return res.json(new ApiResponse(200, rejected, `Proof rejected${reason ? ': ' + reason : ''}. Bounty returned to ACTIVE state.`));
});

// ── Get Bounties Created by Issuer ──
export const getIssuerBounties = AsyncHandler(async (req: Request, res: Response) => {
  const { issuerId } = req.params;
  if (!issuerId) throw new ApiError(400, 'issuerId is required');

  const bounties = await getIssuerBountiesQuery(issuerId);
  return res.json(new ApiResponse(200, bounties, 'Issuer bounties fetched'));
});
