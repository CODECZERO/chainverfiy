import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { ApiError } from '../../util/apiError.util.js';
import { notifySupplier } from '../../services/whatsapp/whatsapp.service.js';
import { cacheDel } from '../../lib/redis.js';

// Wallet-matched order lookup
export const getOrdersByWallet = async (req: any, res: Response) => {
  const { publicKey } = req.params;

  const user = await prisma.user.findUnique({
    where: { stellarWallet: publicKey },
    select: { id: true, email: true, role: true, stellarWallet: true },
  });

  if (!user) {
    return res.json(new ApiResponse(200, [], 'No orders found for this wallet'));
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          priceInr: true,
          proofMediaUrls: true,
          supplier: {
            select: { id: true, name: true, location: true, trustScore: true },
          },
        },
      },
      qrCode: {
        select: {
          shortCode: true,
          totalScans: true,
          machineScans: true,
          countriesReached: true,
          lastScannedCity: true,
          lastScannedCountry: true,
          genesisAnchorTx: true,
          latestAnchorTx: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(new ApiResponse(200, orders, 'Orders fetched'));
};

// Single order for delivery confirmation
export const getOrderForDelivery = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { wallet, userId } = req.query;

  if (!wallet && !userId) throw new ApiError(400, 'wallet or userId query param required');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { id: true, stellarWallet: true, email: true } },
      product: {
        select: {
          id: true,
          title: true,
          description: true,
          priceInr: true,
          priceUsdc: true,
          proofMediaUrls: true,
          supplier: {
            select: {
              id: true,
              name: true,
              location: true,
              trustScore: true,
              totalSales: true,
            },
          },
          stageUpdates: {
            orderBy: { stageNumber: 'asc' },
            select: {
              stageName: true,
              gpsLat: true,
              gpsLng: true,
              gpsAddress: true,
              createdAt: true,
            },
          },
        },
      },
      qrCode: {
        include: {
          scans: {
            orderBy: { scanNumber: 'asc' },
            select: {
              scanNumber: true,
              serverTimestamp: true,
              scanSource: true,
              resolvedLat: true,
              resolvedLng: true,
              resolvedLocation: true,
              coordinateSource: true,
              ipCountry: true,
              ipCountryName: true,
              deviceType: true,
              os: true,
              scannerRole: true,
              anchoredOnChain: true,
              anchorTxId: true,
              anchorReason: true,
              machineModel: true,
              machineEventType: true,
              ipIsProxy: true,
            },
          },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  const isMatchByWallet = wallet && order.buyer.stellarWallet === wallet;
  const isMatchByUserId = userId && order.buyer.id === userId;

  if (!isMatchByWallet && !isMatchByUserId) {
    throw new ApiError(403, 'Wallet or User ID does not match the buyer on this order');
  }

  const now = new Date();
  const isWithinProofWindow =
    order.proofDeadlineAt !== null && now < order.proofDeadlineAt;
  const proofWindowExpired =
    order.proofDeadlineAt !== null && now > order.proofDeadlineAt;
  const hoursRemaining = order.proofDeadlineAt
    ? Math.max(0, (order.proofDeadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60))
    : null;

  return res.json(
    new ApiResponse(
      200,
      {
        order: {
          ...order,
          isWithinProofWindow,
          proofWindowExpired,
          hoursRemaining: hoursRemaining ? parseFloat(hoursRemaining.toFixed(1)) : null,
          refundEligible: order.refundEligible,
        },
      },
      'Order delivery view fetched'
    )
  );
};

// Buyer confirms receipt
export const confirmDelivery = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { walletPublicKey, rating, review } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { stellarWallet: true } },
      product: {
        select: {
          id: true,
          title: true,
          supplierId: true,
          supplier: { select: { userId: true } },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  if (order.buyer.stellarWallet !== walletPublicKey) {
    if (!req.user || order.buyerId !== req.user.id) {
      throw new ApiError(403, 'Unauthorized — wallet mismatch and no valid session found');
    }
  }

  if (order.status === 'COMPLETED') {
    throw new ApiError(409, 'Order already completed');
  }
  if (order.deliveryConfirmedAt !== null) {
    throw new ApiError(409, 'Delivery already confirmed — proof window is active');
  }

  const now = new Date();
  const proofDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveryConfirmedAt: now,
      proofDeadlineAt: proofDeadline,
      buyerRating: rating ?? null,
      buyerReview: review ?? null,
      refundEligible: true,
    },
  });

  await notifySupplier(order.product.supplierId, 'DELIVERY_CONFIRMED', {
    title: order.product.title,
    orderId: order.id,
    productId: order.product.id,
    note: 'Buyer confirmed delivery. Escrow releases in 72 hours if no dispute is raised.',
  });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: 'DELIVERY_CONFIRMED',
      title: 'Delivery confirmed',
      body: `You confirmed receipt of "${order.product.title}". If something is wrong, upload proof before ${proofDeadline.toLocaleDateString()} to be eligible for a refund.`,
      referenceId: order.id,
    },
  });

  await cacheDel(`order:${orderId}`);

  return res.json(
    new ApiResponse(
      200,
      {
        orderId: updated.id,
        status: updated.status,
        deliveryConfirmedAt: updated.deliveryConfirmedAt,
        proofDeadlineAt: updated.proofDeadlineAt,
        message: '72-hour proof window is now open. Upload evidence if your package has any issues.',
      },
      'Delivery confirmed — proof window opened'
    )
  );
};

// Buyer uploads dispute proof
export const uploadDisputeProof = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { walletPublicKey, proofCid, disputeReason } = req.body;

  if (!proofCid) throw new ApiError(400, 'proofCid required — upload proof to IPFS first');
  if (!disputeReason || disputeReason.length > 500) {
    throw new ApiError(400, 'disputeReason required (max 500 characters)');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { stellarWallet: true } },
      product: { select: { title: true, supplierId: true } },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Authorization check: match by either internal userId (JWT) OR provided walletPublicKey
  const isMatchByJWT = req.user?.id && order.buyerId === req.user.id;
  const isMatchByWallet = walletPublicKey && order.buyer.stellarWallet === walletPublicKey;

  if (!isMatchByJWT && !isMatchByWallet) {
    throw new ApiError(403, 'Unauthorized — you must be the buyer of this order');
  }

  if (order.status !== 'DELIVERED') {
    throw new ApiError(
      409,
      order.status === 'COMPLETED'
        ? 'Order already completed — proof window has closed. No refund possible.'
        : 'You must confirm delivery before raising a dispute.'
    );
  }

  if (!order.proofDeadlineAt || new Date() > order.proofDeadlineAt) {
    await prisma.order.update({
      where: { id: orderId },
      data: { refundEligible: false },
    });
    throw new ApiError(
      410,
      'The 72-hour proof window has expired. Refund is no longer possible for this order.'
    );
  }

  if (order.buyerProofCid) {
    throw new ApiError(409, 'Dispute proof already submitted for this order');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DISPUTED',
      buyerProofCid: proofCid,
      buyerProofUploadedAt: new Date(),
      buyerDisputeReason: disputeReason,
    },
  });

  // ─── Auto-Bounty Creation ──────────────────────────────────────────
  // Create a verification bounty for the community to audit the dispute
  try {
    const bountyDeadline = new Date();
    bountyDeadline.setHours(bountyDeadline.getHours() + 48); // 2 day deadline suggestion (implicit in description)

    await prisma.bounty.create({
      data: {
        productId: order.productId,
        issuerId: order.buyerId,
        issuerWallet: walletPublicKey || order.buyer.stellarWallet,
        amount: 5, // Default incentive for verification
        description: `DISPUTE AUDIT: Order ${order.id} | Buyer claims: "${disputeReason.slice(0, 100)}...". Please verify product integrity.`,
        status: 'ACTIVE',
        expiresAt: bountyDeadline,
      }
    });
  } catch (e) {
    console.error("[Dispute] Failed to create auto-bounty", e);
  }

  await notifySupplier(order.product.supplierId, 'DISPUTE_OPENED', {
    orderId: order.id,
    reason: disputeReason,
    productId: order.productId,
    proofCid,
  });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: 'DISPUTE_OPENED',
      title: 'Dispute submitted',
      body: `Your dispute for "${order.product.title}" is under review. Escrow is frozen until resolved.`,
      referenceId: order.id,
    },
  });

  await cacheDel(`order:${orderId}`);

  return res.json(
    new ApiResponse(200, updated, 'Dispute proof submitted — escrow frozen pending review')
  );
};

/**
 * Process all disputed orders whose proof deadline has expired.
 * For each expired dispute, set status to REFUNDED and notify the buyer.
 * This should be called periodically (cron job or server interval).
 */
export const processExpiredDisputes = async (req: Request, res: Response) => {
  const now = new Date();

  // Find all DISPUTED orders past their proof deadline
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'DISPUTED',
      proofDeadlineAt: { lt: now },
    },
    include: {
      product: { select: { title: true } },
    },
  });

  if (expiredOrders.length === 0) {
    return res.json(new ApiResponse(200, { refundedCount: 0 }, 'No expired disputes found.'));
  }

  let refundedCount = 0;

  for (const order of expiredOrders) {
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
        },
      });

      // Notify buyer about the refund
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Auto-Resolved — Refund Issued',
          body: `The 72-hour proof window for "${order.product.title}" has expired without resolution. Your escrow funds have been released back to your wallet.`,
          referenceId: order.id,
        },
      });

      await cacheDel(`order:${order.id}`);
      refundedCount++;
    } catch (e) {
      console.error(`[processExpiredDisputes] Failed to process order ${order.id}:`, e);
    }
  }

  return res.json(
    new ApiResponse(200, { refundedCount, total: expiredOrders.length }, `Processed ${refundedCount} expired disputes.`)
  );
};
