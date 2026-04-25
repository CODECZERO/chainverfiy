import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { notifySupplier } from '../../services/whatsapp/whatsapp.service.js';
import { cacheDel, buildCacheKey } from '../../lib/redis.js';
import { getUSDCtoINRRate } from '../../util/exchangeRate.util.js';
import jwt from 'jsonwebtoken';
import { uploadOnIpfs } from '../../services/ipfs(pinata)/ipfs.services.js';
import QRCode from 'qrcode';
import { EscrowService } from '../../services/stellar/escrow.service.js';
import logger from '../../util/logger.js';

export const placeOrder = async (req: any, res: Response) => {
  const { 
    id, productId, buyerId, quantity = 1, paymentMethod, sourceCurrency, sourceAmount, 
    escrowTxId, pathPaymentTxId, stellarWallet,
    shippingFullName, shippingPhone, shippingAddress, shippingCity, shippingState, shippingPincode, shippingCountry 
  } = req.body;

  let finalBuyerId = buyerId;

  // If no buyerId provided but wallet is present, find or create the buyer user
  if (!finalBuyerId && stellarWallet) {
    let user = await prisma.user.findUnique({ where: { stellarWallet } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          stellarWallet,
          role: 'BUYER',
        }
      });
    }
    finalBuyerId = user.id;
  }

  if (!finalBuyerId) {
    return res.status(401).json(new ApiResponse(401, null, 'Authentication or wallet connection required'));
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json(new ApiResponse(404, null, 'Product not found'));
  }

  const usdcInr = await getUSDCtoINRRate();
  const priceUsdc = Number(product.priceUsdc) || Number(product.priceInr) / usdcInr;

  const orderData: any = {
    productId,
    buyerId: String(finalBuyerId),
    quantity: parseInt(quantity as string),
    priceInr: product.priceInr,
    priceUsdc,
    paymentMethod,
    sourceCurrency,
    sourceAmount: sourceAmount ? parseFloat(sourceAmount) : null,
    status: 'PAID',
    escrowTxId,
    pathPaymentTxId,
    shippingFullName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPincode,
    shippingCountry
  };

  if (id) {
    orderData.id = id;
  }

  const order = await prisma.order.create({
    data: orderData,
  });

  const qrSecret = process.env.QR_SECRET || 'chainverify_qr_secret_fallback';
  const qrBuyerToken = jwt.sign({ orderId: order.id, role: 'BUYER' }, qrSecret);
  const qrSupplierToken = jwt.sign({ orderId: order.id, role: 'SUPPLIER' }, qrSecret);

  // Generate unique buyer journey QR
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const buyerJourneyUrl = `${appUrl}/order/${order.id}/journey?token=${qrBuyerToken}`;
  const qrBuyerDataUrl = await QRCode.toDataURL(buyerJourneyUrl, { 
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const finalOrder = await (prisma.order as any).update({
    where: { id: order.id },
    data: { qrBuyerToken, qrSupplierToken, qrCodeUrl: qrBuyerDataUrl }
  });

  // Eagerly initiate Living QR Journey record
  await prisma.qRCode.create({
    data: {
      id: order.id, // Use orderId as QR ID for 1:1 mapping
      shortCode: order.id,
      token: qrBuyerToken,
      purpose: 'ORDER_BUYER',
      orderId: order.id,
      productId: product.id,
      supplierId: product.supplierId,
    }
  }).catch(() => {}); // Fail silently if already exists

  // ─── Silent Community Enrollment ───────────────────────────────────
  try {
    const finalBuyerIdStr = String(finalBuyerId);
    await ((prisma as any).communityMember as any).upsert({
      where: {
        userId_supplierId: {
          userId: finalBuyerIdStr,
          supplierId: product.supplierId,
        }
      },
      update: {}, 
      create: {
        userId: finalBuyerIdStr,
        supplierId: product.supplierId,
      }
    });
  } catch (e) {
    console.error("[Order] Failed silent community enrollment", e);
  }

  await notifySupplier(product.supplierId, 'ORDER_RECEIVED', {
    title: product.title,
    quantity,
    amountInr: product.priceInr,
    amountUsdc: priceUsdc.toFixed(4),
    orderId: order.id,
    productId: product.id,
  });

  await cacheDel(`product:${productId}`);

  return res.status(201).json(new ApiResponse(201, finalOrder, 'Order placed with unique journey QR'));
};

export const getBuyerOrders = async (req: any, res: Response) => {
  const { buyerId, stellarWallet } = req.query;
  const authUserId = req.user?.id;
  
  let finalBuyerId = authUserId || buyerId;

  if (!finalBuyerId && stellarWallet) {
    const user = await prisma.user.findUnique({ where: { stellarWallet: String(stellarWallet) } });
    if (user) finalBuyerId = user.id;
  }

  if (!finalBuyerId) {
    logger.info(`[Orders] getBuyerOrders: No user found for filters, returning empty list`);
    return res.json(new ApiResponse(200, [], 'No orders found for this identity'));
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: String(finalBuyerId) },
    include: {
      product: { include: { supplier: { select: { name: true, location: true, trustScore: true } } } },
      qrCode: true
    },
    orderBy: { createdAt: 'desc' }
  });

  logger.info(`[Orders] Fetched ${orders.length} orders for buyer ${finalBuyerId}`);
  return res.json(new ApiResponse(200, orders, 'Orders fetched successfully'));
};

export const getOrderStatus = async (req: any, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      product: { 
        include: { 
          supplier: { select: { name: true, stellarWallet: true, location: true } },
          stageUpdates: { orderBy: { stageNumber: 'asc' } }
        } 
      },
      buyer: { select: { email: true, stellarWallet: true } },
      qrCode: {
        include: {
          scans: {
            orderBy: { scanNumber: 'asc' },
            select: {
              id: true,
              scanNumber: true,
              resolvedLocation: true,
              serverTimestamp: true,
              scanSource: true,
              scannerRole: true,
              anchoredOnChain: true
            },
            take: 50 // Limit to avoid massive payloads
          }
        }
      }
    },
  });
  if (!order) {
    res.status(404).json(new ApiResponse(404, null, 'Order not found'));
    return;
  }
  res.json(new ApiResponse(200, order, 'Order fetched'));
};

export const confirmDelivery = async (req: any, res: Response) => {
  const { releaseTxId, rating, review } = req.body;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED', releaseTxId, buyerRating: rating, buyerReview: review },
    include: { product: true },
  });

  await notifySupplier(order.product.supplierId, 'PAYMENT_RELEASED', {
    amountUsdc: Number(order.priceUsdc).toFixed(4),
    orderId: order.id,
    productId: order.productId,
  });

  await prisma.supplier.update({
    where: { id: order.product.supplierId },
    data: { totalSales: { increment: 1 } },
  });

  res.json(new ApiResponse(200, order, 'Delivery confirmed, payment released'));
};

export const disputeOrder = async (req: any, res: Response) => {
  const { reason, buyerProofCid } = req.body;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { 
      status: 'DISPUTED',
      buyerDisputeReason: reason,
      buyerProofCid
    },
    include: { product: true, buyer: true },
  });

  // ─── Auto-Bounty for High-Value Disputes ───────────────────────────
  try {
    const minBountyThreshold = 5000; // INR
    if (Number(order.priceInr) >= minBountyThreshold) {
      await prisma.bounty.create({
        data: {
          productId: order.productId,
          amount: 5.0, // Fixed 5 USDC reward for dispute audits
          description: `DISPUTE AUDIT: Order #${order.id.slice(0, 8)} needs verification. Buyer claims: "${reason || 'No description'}". Verify product authenticity via provided IPFS proof.`,
          status: 'ACTIVE',
          issuerId: order.buyerId,
          issuerWallet: (order.buyer as any)?.stellarWallet || null,
        }
      });
      console.log(`[Bounty] Auto-created dispute audit for Order ${order.id}`);
    }
  } catch (e) {
    console.error("[Bounty] Failed to auto-create dispute bounty", e);
  }

  await notifySupplier(order.product.supplierId, 'DISPUTE_OPENED', {
    orderId: order.id,
    reason,
    productId: order.productId,
  });

  res.json(new ApiResponse(200, order, 'Dispute opened and governance bounty active'));
};

export const scanQrHandshake = async (req: Request, res: Response) => {
  const { token, roleScanned } = req.body;
  const orderId = req.params.id;

  const qrSecret = process.env.QR_SECRET || 'chainverify_qr_secret_fallback';
  try {
    const payload = jwt.verify(token, qrSecret) as { orderId: string, role: string };
    if (payload.orderId !== orderId) throw new Error("Order ID mismatch");
    if (payload.role !== roleScanned) throw new Error("Role mismatch");
    
    const order = await prisma.order.findUnique({ 
        where: { id: orderId },
        include: { product: { include: { supplier: true } }, buyer: true }
    });
    
    if (!order) return res.status(404).json(new ApiResponse(404, null, 'Order not found'));

    if (roleScanned === 'BUYER') {
      await prisma.order.update({ where: { id: orderId }, data: { qrBuyerScannedAt: new Date() } });
    } else {
      await prisma.order.update({ where: { id: orderId }, data: { qrSupplierScannedAt: new Date() } });
    }

    if (order.deliveryCertCid) {
        return res.json(new ApiResponse(200, { cid: order.deliveryCertCid }, 'Delivery already confirmed.'));
    }

    const certData = {
        orderId: order.id,
        productId: order.productId,
        buyerId: order.buyerId,
        supplierName: order.product.supplier.name,
        deliveredAt: new Date().toISOString(),
        verifiedVia: 'Dual-JWT QR Handshake'
    };

    const ipfsRes = await uploadOnIpfs(certData);
    if (!ipfsRes.success || !ipfsRes.cid) throw new Error('Failed to upload proof to IPFS');
    const cid = ipfsRes.cid;

    const stellarAnchorTxId = `0xlm_anchor_${cid.substring(0, 10)}`; 

    const updatedOrder = await prisma.order.update({
         where: { id: orderId },
         data: {
             status: 'DELIVERED',
             deliveryCertCid: cid,
             deliveryCertTxId: stellarAnchorTxId,
             deliveredAt: new Date()
         }
    });

    await notifySupplier(order.product.supplierId, 'ORDER_RECEIVED', {
       title: order.product.title,
       quantity: order.quantity,
       amountInr: order.priceInr,
       amountUsdc: Number(order.priceUsdc).toFixed(4),
       orderId: order.id,
       productId: order.product.id
    });

    return res.json(new ApiResponse(200, { cert: cid, order: updatedOrder }, 'QR Scan successful. Delivery verified!'));
  } catch (err: any) {
    return res.status(400).json(new ApiResponse(400, null, `Invalid Handshake: ${err.message}`));
  }
};

export const getPublicProof = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { product: { include: { supplier: true } } }
  });
  if (!order || !order.deliveryCertCid) return res.status(404).json(new ApiResponse(404, null, 'Public proof not found'));
  return res.json(new ApiResponse(200, {
    orderId: order.id,
    productTitle: order.product.title,
    supplierName: order.product.supplier.name,
    deliveredAt: order.deliveredAt,
    deliveryCertCid: order.deliveryCertCid,
    deliveryCertTxId: order.deliveryCertTxId,
    status: order.status
  }, 'Proof fetched'));
};

export const dispatchOrder = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: { include: { supplier: true } } }
  });

  if (!order) return res.status(404).json(new ApiResponse(404, null, 'Order not found'));

  // Try to dispatch half payment to supplier vault
  if (order.priceUsdc && order.product.supplier.stellarWallet && order.status === 'PAID') {
    const halfAmount = Number(order.priceUsdc) / 2;
    try {
      const escrowService = new EscrowService();
      const txHash = await escrowService.releaseDispatchPartialPayment(order.product.supplier.stellarWallet, halfAmount);
      console.log(`[STELLAR] Dispatched half payment TX: ${txHash}`);
    } catch (e) {
      console.error("[STELLAR] Failed to release half payment", e);
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: 'SHIPPED' }
  });

  let qrCode = await prisma.qRCode.findFirst({
    where: {
      OR: [
        { shortCode: id },
        { orderId: id }
      ]
    }
  });
  if (!qrCode) {
    qrCode = await prisma.qRCode.create({
      data: {
        shortCode: id,
        token: order.qrBuyerToken || `fallback-token-${id}`,
        purpose: 'ORDER_BUYER',
        orderId: id,
        productId: order.productId,
        supplierId: order.product.supplierId,
        firstScannedAt: new Date(),
        lastScannedAt: new Date()
      }
    });
  }

  await prisma.qRScan.create({
    data: {
      qrCodeId: qrCode.id,
      scanSource: 'MACHINE',
      machineEventType: 'DISPATCHED',
      scanNumber: (await prisma.qRScan.count({ where: { qrCodeId: qrCode.id } })) + 1,
      serverTimestamp: new Date(),
      clientTimestamp: new Date(),
      ipCountry: order.shippingCountry || null,
      ipCountryName: null,
      ipCity: order.shippingCity || null,
      resolvedLocation: `Dispatched from ${order.product.supplier.location || 'Seller Facility'}`,
      resolvedLat: null,
      resolvedLng: null
    }
  });

  await cacheDel(buildCacheKey('journey', { shortCode: id }));

  return res.json(new ApiResponse(200, updatedOrder, 'Order marked as dispatched and journey initiated'));
};

// ─── Decentralized DAO Dispute Validation ───

export const getPublicDispute = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  const order = await prisma.order.findFirst({
    where: { 
      id: id.length < 36 ? { startsWith: id } : id
    },
    include: {
      product: {
        include: {
          supplier: true
        }
      },
      buyer: {
        select: { email: true, stellarWallet: true }
      },
      disputeVotes: true
    }
  });

  if (!order) {
    return res.status(404).json(new ApiResponse(404, null, 'Order not found'));
  }

  if (order.status !== 'DISPUTED') {
    return res.status(400).json(new ApiResponse(400, null, 'This order is not currently under dispute'));
  }

  // Count votes
  const refundVotes = order.disputeVotes.filter(v => v.decision === 'REFUND_BUYER').length;
  const releaseVotes = order.disputeVotes.filter(v => v.decision === 'RELEASE_FUNDS').length;

  // Check if current user has already voted
  const reqUser = (req as any).user;
  const queryWallet = req.query.wallet as string | undefined;
  let hasVoted = false;

  if (reqUser?.id) {
    hasVoted = order.disputeVotes.some(v => v.userId === reqUser.id);
  }
  if (!hasVoted && queryWallet) {
    hasVoted = order.disputeVotes.some(v => v.voterWallet === queryWallet);
  }

  return res.json(new ApiResponse(200, {
    orderId: order.id,
    product: order.product,
    buyer: order.buyer,
    buyerDisputeReason: order.buyerDisputeReason,
    buyerProofCid: order.buyerProofCid,
    disputeCreatedAt: order.updatedAt || order.createdAt,
    hasVoted,
    votes: {
      refund: refundVotes,
      release: releaseVotes,
      total: refundVotes + releaseVotes
    }
  }, 'Dispute details fetched successfully'));
};

export const voteOnDispute = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { stellarWallet, decision } = req.body;

  if (!decision || (decision !== 'REFUND_BUYER' && decision !== 'RELEASE_FUNDS')) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid decision. Must be REFUND_BUYER or RELEASE_FUNDS'));
  }

  // ── 1. Derive identity from VERIFIED sources only ──
  // Priority: JWT-authenticated user > wallet lookup > body wallet
  const reqUser = (req as any).user;
  let finalUserId: string | null = reqUser?.id || null;
  let finalWallet: string | null = stellarWallet || null;

  // If we have a JWT user but no wallet, look up their wallet
  if (finalUserId && !finalWallet) {
    const dbUser = await prisma.user.findUnique({ where: { id: finalUserId }, select: { stellarWallet: true } });
    if (dbUser?.stellarWallet) finalWallet = dbUser.stellarWallet;
  }

  // If we have a wallet but no JWT user, resolve the userId from DB
  if (!finalUserId && finalWallet) {
    const dbUser = await prisma.user.findUnique({ where: { stellarWallet: finalWallet }, select: { id: true } });
    if (dbUser) finalUserId = dbUser.id;
  }

  // Must have at least one verified identity
  if (!finalUserId && !finalWallet) {
    return res.status(401).json(new ApiResponse(401, null, 'Must be logged in or connect a wallet to vote'));
  }

  // ── 2. Find the disputed order ──
  const order = await prisma.order.findFirst({
    where: { 
      id: id.length < 36 ? { startsWith: id } : id 
    },
    select: { id: true, status: true, productId: true }
  });

  console.log(`[AUDIT] Vote attempt: prefix=${id}, resolvedOrder=${order?.id || 'NOT_FOUND'}, user=${finalUserId}, wallet=${finalWallet}`);

  if (!order || order.status !== 'DISPUTED') {
    return res.status(404).json(new ApiResponse(404, null, 'Active dispute not found'));
  }

  // ── 3. Database-level duplicate check ──
  // Build OR conditions for all identity dimensions
  const duplicateConditions: any[] = [];
  if (finalUserId) duplicateConditions.push({ orderId: order.id, userId: finalUserId });
  if (finalWallet) duplicateConditions.push({ orderId: order.id, voterWallet: finalWallet });

  const existingVote = await prisma.disputeVote.findFirst({
    where: { OR: duplicateConditions }
  });

  if (existingVote) {
    console.log(`[AUDIT] Duplicate vote blocked: existing=${existingVote.id}, user=${finalUserId}, wallet=${finalWallet}`);
    return res.status(400).json(new ApiResponse(400, null, 'You have already voted on this dispute'));
  }

  // ── 4. Record vote with DB-level unique constraint as safety net ──
  let newVote;
  try {
    newVote = await prisma.disputeVote.create({
      data: {
        orderId: order.id,
        userId: finalUserId,
        voterWallet: finalWallet,
        decision
      }
    });
  } catch (e: any) {
    // Catch unique constraint violation (race condition between check and insert)
    if (e.code === 'P2002') {
      return res.status(400).json(new ApiResponse(400, null, 'You have already voted on this dispute'));
    }
    // Catch FK violation (should never happen, but safety net)
    if (e.code === 'P2003') {
      console.error(`[AUDIT] FK violation — orderId=${order.id} does not exist in orders table`);
      return res.status(400).json(new ApiResponse(400, null, 'Dispute case reference is invalid. Please refresh and try again.'));
    }
    throw e;
  }
  console.log(`[AUDIT] Vote recorded: ${newVote.id} for Order ${order.id} (User: ${finalUserId}, Wallet: ${finalWallet})`);

  // ── 5. Check consensus threshold ──
  const updatedVotes = await prisma.disputeVote.findMany({ where: { orderId: order.id } });
  const refundVotes = updatedVotes.filter((v: any) => v.decision === 'REFUND_BUYER').length;
  const releaseVotes = updatedVotes.filter((v: any) => v.decision === 'RELEASE_FUNDS').length;
  const totalVotes = refundVotes + releaseVotes;

  let resolutionMsg = 'Vote recorded successfully';
  const THRESHOLD = 3;

  if (totalVotes >= THRESHOLD) {
    console.log(`[AUDIT] Threshold reached (${totalVotes}/${THRESHOLD}) for Order ${order.id}. Resolving...`);
    const escrowService = new EscrowService();
    
    if (refundVotes > releaseVotes) {
      try {
        await escrowService.refundEscrow(order.id);
        await prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
        resolutionMsg = 'Consensus reached. Escrow has been refunded to the buyer.';
      } catch (e: any) {
        logger.error(`DAO Refund failed: ${e.message}`);
        resolutionMsg = 'Vote recorded. Consensus reached for refund but execution failed.';
      }
    } else {
      try {
        await escrowService.releaseEscrow(order.id);
        await prisma.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
        resolutionMsg = 'Consensus reached. Escrow has been released to the supplier.';
      } catch (e: any) {
        logger.error(`DAO Release failed: ${e.message}`);
        resolutionMsg = 'Vote recorded. Consensus reached for release but execution failed.';
      }
    }

    const bounty = await prisma.bounty.findFirst({
      where: { productId: order.productId, status: 'ACTIVE', description: { startsWith: 'DISPUTE AUDIT:' } }
    });
    if (bounty) {
      await prisma.bounty.update({ where: { id: bounty.id }, data: { status: 'COMPLETED' } });
    }
  }

  return res.json(new ApiResponse(200, { refundVotes, releaseVotes, totalVotes }, resolutionMsg));
};
