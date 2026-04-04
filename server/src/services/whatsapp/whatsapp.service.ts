import QRCode from 'qrcode';
import twilio from 'twilio';
import { prisma } from '../../lib/prisma.js';
import { generateWhatsAppReply, improveProductDescription } from '../nvidia/nim.service.js';
import type { WhatsAppState } from '@prisma/client';
import { getUSDCtoINRRate } from '../../util/exchangeRate.util.js';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { uploadOnIpfsBill } from '../ipfs(pinata)/ipfs.services.js';

async function transloadMediaToIpfs(twilioUrl: string): Promise<string> {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID || '';
    const token = process.env.TWILIO_AUTH_TOKEN || '';
    if (!sid || !token) return twilioUrl;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    
    const res = await fetch(twilioUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) throw new Error("Twilio fetch failed");
    
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    
    const ext = contentType.split('/')[1] || 'jpg';
    const tmpPath = path.join('/tmp', `wa_media_${Date.now()}.${ext}`);
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    
    const fileObj: any = {
      path: tmpPath,
      originalname: `wa_media.${ext}`,
      mimetype: contentType,
    };
    
    const uploadRes = await uploadOnIpfsBill(fileObj);
    if (!uploadRes.success || !uploadRes.cid) {
       console.error("IPFS upload failed", uploadRes.error);
       return twilioUrl;
    }
    
    const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
    return `https://${gateway}/ipfs/${uploadRes.cid}`;
  } catch (err) {
    console.error("Transload error", err);
    return twilioUrl;
  }
}

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

async function reverseGeocode(latNum: number, lngNum: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        String(latNum),
      )}&lon=${encodeURIComponent(String(lngNum))}`,
      {
        headers: {
          // Nominatim requests a UA; keep it simple.
          'User-Agent': 'chainverify-whatsapp-bot/1.0',
        },
      },
    );
    const j: any = await r.json();
    return j?.display_name ? String(j.display_name) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// MAIN INCOMING HANDLER
// ─────────────────────────────────────────────
export async function handleIncoming(req: any, res: any) {
  console.log(`[WHATSAPP] Incoming webhook from ${req.body.From}: ${req.body.Body || '[Media]'}`);
  const { Body, From, Latitude, Longitude } = req.body;
  const phone = (From as string).replace('whatsapp:', '');
  const message = (Body as string)?.trim() || '';
  const numMedia = Number(req.body?.NumMedia || 0);
  const rawMediaUrls: string[] = [];
  for (let i = 0; i < Math.min(numMedia, 10); i++) {
    const u = req.body?.[`MediaUrl${i}`];
    if (u) rawMediaUrls.push(String(u));
  }

  // Normalize media URLs to IPFS
  const mediaUrls = await Promise.all(rawMediaUrls.map(u => transloadMediaToIpfs(u)));

  // Get or create session from PostgreSQL
  let session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber: phone } });
  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: { phoneNumber: phone, state: 'IDLE' },
    });
  }

  let reply = '';
  const upper = message.toUpperCase();

  try {
    if (upper === 'JOIN CASE-SMALLER' || upper === 'CASE-SMALLER') {
      // 1. Mark as joined
      await updateSession(phone, 'IDLE', { ...(session.sessionData as any), joined: true });
      
      // 2. Try to link to an existing supplier or user
      const existingSupplier = await prisma.supplier.findUnique({
        where: { whatsappNumber: phone }
      });
      const existingUser = await prisma.user.findUnique({
        where: { whatsappNumber: phone }
      });
      
      if (existingSupplier) {
        await prisma.whatsAppSession.update({
          where: { phoneNumber: phone },
          data: { supplierId: existingSupplier.id }
        });
        reply = `Welcome back, ${existingSupplier.name}! You are now connected to ChainVerify. Type HELP for commands.`;
      } else if (existingUser) {
        reply = `Welcome back! You are now connected to ChainVerify as a ${existingUser.role.toLowerCase()}. We'll notify you about your orders here.`;
      } else {
        reply = `Welcome to ChainVerify! Your WhatsApp is now connected. Please register at chainverify.app to link your account.`;
      }
    } else if (upper.startsWith('REGISTER')) {
      const name = message.substring(8).trim();
      if (!name) {
         reply = 'Please provide your full name to register. Example: REGISTER Aman Sharma';
      } else {
         const existingUser = await prisma.user.findUnique({ where: { whatsappNumber: phone } });
         if (existingUser) {
           reply = 'You are already registered! Use STATUS or HELP to get started.';
         } else {
           const newUser = await prisma.user.create({
             data: {
               whatsappNumber: phone,
               role: 'SUPPLIER',
               supplierProfile: {
                 create: {
                   name,
                   whatsappNumber: phone
                 }
               }
             }
           });
           
           const newSupplier = await prisma.supplier.findUnique({ where: { whatsappNumber: phone } });
           if (newSupplier) {
             await updateSession(phone, 'IDLE', { ...((session.sessionData || {}) as any), joined: true });
             await prisma.whatsAppSession.update({
               where: { phoneNumber: phone },
               data: { supplierId: newSupplier.id }
             });
             reply = `Registration successful! Welcome to ChainVerify, ${name}. You can now list products using the NEW command.`;
           } else {
             reply = 'Registration failed. Try via web.';
           }
         }
      }
    } else if (upper === 'HELP') {
      reply = getHelpMenu();
      await updateSession(phone, 'IDLE', {});
    } else if (upper === 'STATUS') {
      reply = await getStatus(phone);
    } else if (upper === 'NEW' || upper === 'LIST') {
      reply = "Let's list your product.\n\nWhat is your product name?";
      await updateSession(phone, 'AWAITING_PRODUCT_NAME', {});
    } else if (session.state !== 'IDLE') {
      reply = await handleFlow(session, message, mediaUrls, Latitude, Longitude);
    } else if (mediaUrls.length) {
      // Any media outside listing flow = stage update
      reply = await handleStageUpdate(phone, mediaUrls[0]!, message);
    } else if (Latitude && Longitude) {
      // Common real-world flow: suppliers often share location first.
      // Store it and attach to the next stage update photo automatically.
      const latNum = parseFloat(String(Latitude));
      const lngNum = parseFloat(String(Longitude));
      await updateSession(phone, 'IDLE', { ...(session.sessionData as any), pendingGps: { lat: latNum, lng: lngNum } });
      reply =
        'Location received.\nNow send a photo/video for the stage update and I will attach this location automatically.\n\nTip: Add a short caption like "Packed" / "Shipped" / "Out for delivery".';
    } else {
      // NVIDIA NIM handles everything else (Acting as Advanced Dashboard Assistant)
      const supplier = await getSupplierByPhone(phone);
      let richContext: any = null;
      if (supplier) {
         const products = await prisma.product.findMany({ where: { supplierId: supplier.id }, take: 5, orderBy: { createdAt: 'desc'} });
         const orders = await prisma.order.findMany({ where: { product: { supplierId: supplier.id } }, take: 5, orderBy: { createdAt: 'desc'} });
         richContext = {
            id: supplier.id,
            name: supplier.name,
            trustScore: supplier.trustScore,
            totalSales: supplier.totalSales,
            recentProducts: products.map(p => ({ title: p.title, price: Number(p.priceInr), status: p.status })),
            recentOrders: orders.map(o => ({ amountUsdc: Number(o.priceUsdc), status: o.status }))
         };
      }
      
      const history = buildHistory(session.sessionData as any);
      reply = await generateWhatsAppReply(message, history, richContext || null);
      await appendHistory(phone, message, reply, session.sessionData as any);
    }
  } catch (err) {
    console.error('WhatsApp handler error:', err);
    reply = 'Something went wrong. Please try again or type HELP.';
  }

  await send(phone, reply);
  res.status(200).send('OK');
}

// ─────────────────────────────────────────────
// FLOW STEP HANDLER
// ─────────────────────────────────────────────
async function handleFlow(session: any, message: string, mediaUrls?: string[], lat?: string, lng?: string): Promise<string> {
  const data: any = session.sessionData || {};
  const phone: string = session.phoneNumber;

  switch (session.state as WhatsAppState) {
    case 'AWAITING_PRODUCT_NAME': {
      await updateSession(phone, 'AWAITING_PRICE', { ...data, title: message });
      return `Great. "${message}"\n\nWhat is your price in INR? (numbers only)\nExample: 450`;
    }

    case 'AWAITING_PRICE': {
      const price = parseFloat(message);
      if (isNaN(price)) return 'Please enter a number only. Example: 450';
      await updateSession(phone, 'AWAITING_CATEGORY', { ...data, priceInr: price });
      return `Price saved: ₹${price}\n\nSelect category:\n1. Food & Spices\n2. Textiles\n3. Handicrafts\n4. Agriculture\n5. Electronics\n6. Other`;
    }

    case 'AWAITING_CATEGORY': {
      const cats = ['Food & Spices', 'Textiles', 'Handicrafts', 'Agriculture', 'Electronics', 'Other'];
      const cat = cats[parseInt(message) - 1] || 'Other';
      await updateSession(phone, 'AWAITING_DESCRIPTION', { ...data, category: cat });
      return `Category saved: ${cat}\n\nAdd a short description (1-2 sentences):`;
    }

    case 'AWAITING_DESCRIPTION': {
      const improved = await improveProductDescription(message, data.category);
      await updateSession(phone, 'AWAITING_PROOF_MEDIA', { ...data, description: improved, proofMedia: [] });
      return `Description saved.\n\nNow send up to 5 photos or videos of your product.\nType DONE when finished.`;
    }

    case 'AWAITING_PROOF_MEDIA': {
      if (message.toUpperCase() === 'DONE') {
        if (!data.proofMedia?.length) return 'Please send at least 1 photo first.';
        return await finalizeProduct(phone, data);
      }
      if (mediaUrls?.length) {
        const updated = [...(data.proofMedia || []), ...mediaUrls].slice(0, 5);
        await updateSession(phone, 'AWAITING_PROOF_MEDIA', { ...data, proofMedia: updated });
        return `Photo ${updated.length} received.\n${updated.length < 5 ? 'Send more or type DONE' : 'Max 5 reached. Type DONE to finish.'}`;
      }
      return 'Please send a photo or video, or type DONE to finish.';
    }

    case 'AWAITING_GPS': {
      if (lat && lng) {
        const stageUpdateId = data.stageUpdateId as string | undefined;
        let updated: any = null;

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(`${latNum},${lngNum}`)}`;

        // Best-effort reverse geocode for human-readable address
        const address = await reverseGeocode(latNum, lngNum);

        if (stageUpdateId) {
          updated = await prisma.stageUpdate.update({
            where: { id: stageUpdateId },
            data: { gpsLat: latNum, gpsLng: lngNum, gpsAddress: address || undefined },
          });
        } else {
          // Fallback: update latest stage update for this supplier
          const supplier = await getSupplierByPhone(phone);
          if (supplier) {
            const latest = await prisma.stageUpdate.findFirst({
              where: { product: { supplierId: supplier.id } },
              orderBy: { createdAt: 'desc' },
            });
            if (latest) {
              updated = await prisma.stageUpdate.update({
                where: { id: latest.id },
                data: { gpsLat: latNum, gpsLng: lngNum, gpsAddress: address || undefined },
              });
            }
          }
        }

        await updateSession(phone, 'IDLE', {});

        const tx = updated?.stellarTxId ? String(updated.stellarTxId) : '';
        const txLink = tx ? `https://stellar.expert/explorer/testnet/tx/${tx}` : '';
        const addressLine = address ? `\nAddress: ${address}` : '';
        const txLine = txLink ? `\n\nStellar TX: ${txLink}` : '';
        return `Location saved.${addressLine}\nMap: ${mapsLink}${txLine}`;
      }
      return 'Please share your location using the WhatsApp attachment button → Location.';
    }

    default:
      await updateSession(phone, 'IDLE', {});
      return getHelpMenu();
  }
}

// ─────────────────────────────────────────────
// FINALIZE PRODUCT LISTING
// ─────────────────────────────────────────────
async function finalizeProduct(phone: string, data: any): Promise<string> {
  const supplier = await getSupplierByPhone(phone);
  if (!supplier) {
    return 'Please register at chainverify.app first to list products.';
  }

  const usdcInr = await getUSDCtoINRRate();
  const priceUsdc = Number(data.priceInr) ? Number(data.priceInr) / usdcInr : 0;

  const product = await prisma.product.create({
    data: {
      supplierId: supplier.id,
      title: data.title,
      description: data.description,
      category: data.category,
      priceInr: data.priceInr,
      priceUsdc,
      proofMediaUrls: data.proofMedia || [],
      status: 'PENDING_VERIFICATION',
    },
  });

  const productUrl = `${process.env.APP_URL}/product/${product.id}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(productUrl, { width: 200 });
    await prisma.product.update({ where: { id: product.id }, data: { qrCodeUrl: qrDataUrl } });
  } catch (_) {}

  // Keep last product in session for stage updates / easy lookup.
  await updateSession(phone, 'IDLE', { lastProductId: product.id });

  // Best-effort: send QR as WhatsApp media (Twilio accepts a URL; data: URLs may not render in some clients)
  if (qrDataUrl) {
    await send(phone, `QR code for "${data.title}"`, qrDataUrl);
  }

  return `Product listed.\n\n${data.title}\nPrice: ₹${data.priceInr} (≈${priceUsdc.toFixed(2)} USDC)\nStatus: Pending community verification\n\nView: ${productUrl}\n\nShare with buyers while community verifies (24-48 hrs).`;
}

// ─────────────────────────────────────────────
// STAGE UPDATE HANDLER
// ─────────────────────────────────────────────
async function handleStageUpdate(phone: string, mediaUrl: string, caption: string): Promise<string> {
  const supplier = await getSupplierByPhone(phone);
  if (!supplier) return 'Please register at chainverify.app first.';

  // Prefer the last product the supplier listed (more reliable than "latest").
  const session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber: phone } });
  const lastProductId = (session?.sessionData as any)?.lastProductId as string | undefined;

  const product = lastProductId
    ? await prisma.product.findUnique({ where: { id: lastProductId } })
    : await prisma.product.findFirst({
        where: { supplierId: supplier.id, status: { in: ['VERIFIED', 'PENDING_VERIFICATION'] } },
        orderBy: { createdAt: 'desc' },
      });

  if (!product) return 'No active product found. Type NEW to list one.';

  const count = await prisma.stageUpdate.count({ where: { productId: product.id } });

  const stage = await prisma.stageUpdate.create({
    data: {
      productId: product.id,
      stageName: caption || `Stage ${count + 1}`,
      stageNumber: count + 1,
      photoUrl: mediaUrl,
    },
  });

  const pendingGps = (session?.sessionData as any)?.pendingGps as { lat: number; lng: number } | undefined;
  if (pendingGps?.lat && pendingGps?.lng) {
    const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(`${pendingGps.lat},${pendingGps.lng}`)}`;
    const address = await reverseGeocode(pendingGps.lat, pendingGps.lng);
    await prisma.stageUpdate.update({
      where: { id: stage.id },
      data: { gpsLat: pendingGps.lat, gpsLng: pendingGps.lng, gpsAddress: address || undefined },
    });
    await updateSession(phone, 'IDLE', { ...(session?.sessionData as any), pendingGps: undefined, lastProductId: product.id });
    return `Stage update recorded.\n\nProduct: ${product.title}\nStage: ${count + 1}\nLocation attached${address ? `\nAddress: ${address}` : ''}\nMap: ${mapsLink}`;
  }

  await updateSession(phone, 'AWAITING_GPS', { stageUpdateId: stage.id, lastProductId: product.id });

  return `Stage update recorded.\n\nProduct: ${product.title}\nStage: ${count + 1}\n\nNow share your GPS location (tap Attachment -> Location).`;
}

// ─────────────────────────────────────────────
// STATUS COMMAND
// ─────────────────────────────────────────────
async function getStatus(phone: string): Promise<string> {
  const supplier = await getSupplierByPhone(phone);
  if (!supplier) return 'No supplier account found. Register at chainverify.app';

  const products = await prisma.product.findMany({
    where: { supplierId: supplier.id },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  if (!products.length) return 'You have no listings yet. Type NEW to list your first product!';

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const lines = (products as any[]).map((p: any, i: number) => {
    const icon = p.status === 'VERIFIED' ? '[VERIFIED]' : p.status === 'FLAGGED' ? '[FLAGGED]' : '[PENDING]';
    const url = `${appUrl}/product/${p.id}`;
    const votes = `${Number(p.voteReal)} real · ${Number(p.voteFake)} fake · ${Number(p.voteNeedsProof)} needs proof`;
    const usdc = Number(p.priceUsdc || 0);
    return `${i + 1}. ${icon} ${p.title}\n   Price: ₹${Number(p.priceInr)} (≈${usdc ? usdc.toFixed(2) : '—'} USDC)\n   Votes: ${votes}\n   Link: ${url}`;
  });

  const orders = await prisma.order.findMany({
    where: { product: { supplierId: supplier.id } },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { title: true } } },
  });

  const orderLines = orders.length
    ? orders.map((o: any, i: number) => {
        const usdc = Number(o.priceUsdc || 0);
        return `${i + 1}. ${o.product?.title || 'Order'} · ${usdc ? usdc.toFixed(2) : '—'} USDC · ${String(o.status)}`;
      })
    : [];

  const ordersBlock = orderLines.length ? `\n\nRecent orders:\n${orderLines.join('\n')}` : '';

  return `Your latest listings:\n\n${lines.join('\n\n')}${ordersBlock}\n\nTip: Send a stage photo anytime to update delivery proof.`;
}

// ─────────────────────────────────────────────
// OUTBOUND NOTIFICATIONS
// ─────────────────────────────────────────────
export async function notifySupplier(
  supplierId: string,
  type: string,
  data: Record<string, any>
) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { user: true },
  });
  if (!supplier?.whatsappNumber) return;

  const messages: Record<string, string> = {
    PRODUCT_VERIFIED: `"${data.title}" verified.\nReal votes: ${data.voteReal}\nMarketplace:\n${data.url}`,
    PRODUCT_FLAGGED: `"${data.title}" flagged.\nReason: ${data.reason}\nReply RESUBMIT to add better proof.`,
    ORDER_RECEIVED: `New order received.\n${data.title} x${data.quantity}\nAmount: ${data.amountUsdc} USDC in escrow\nShip within 3 days.`,
    PAYMENT_RELEASED: `Payment released.\n${data.amountUsdc} USDC sent to your wallet\nOrder #${data.orderId} complete.`,
    PAYMENT_REFUNDED: `Order #${data.orderId} disputed. Funds returned to buyer.`,
  };

  const msg = messages[type];
  if (msg) {
    // Check if session is joined
    const session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber: supplier.whatsappNumber } });
    const isJoined = (session?.sessionData as any)?.joined === true;

    if (isJoined) {
      await send(supplier.whatsappNumber, msg);
    }
    
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: type as any,
        title: type.replace(/_/g, ' '),
        body: msg,
        referenceId: data.productId || data.orderId,
      },
    });
  }
}

export async function notifyUser(
  userId: string,
  type: string,
  data: Record<string, any>
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user?.whatsappNumber) return;

  const messages: Record<string, string> = {
    ORDER_PLACED: `Order placed successfully!\nProduct: ${data.title}\nAmount: ${data.amountInr} INR\nTrack at: ${data.url}`,
    ORDER_SHIPPED: `Your order for "${data.title}" has been shipped!`,
    DELIVERY_CONFIRMED: `Delivery confirmed for "${data.title}". Thank you for shopping with ChainVerify!`,
  };

  const msg = messages[type];
  if (msg) {
    const session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber: user.whatsappNumber } });
    const isJoined = (session?.sessionData as any)?.joined === true;

    if (isJoined) {
      await send(user.whatsappNumber, msg);
    }
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function updateSession(phone: string, state: WhatsAppState, sessionData: any) {
  await prisma.whatsAppSession.upsert({
    where: { phoneNumber: phone },
    update: { state, sessionData, lastMessageAt: new Date() },
    create: { phoneNumber: phone, state, sessionData },
  });
}

async function getSupplierByPhone(phone: string) {
  return prisma.supplier.findUnique({ where: { whatsappNumber: phone } });
}

function getHelpMenu(): string {
  return 'ChainVerify Commands:\n\nNEW — List a product\nSTATUS — Your listings & orders\nHELP — Show this menu\n\nOr visit chainverify.app';
}

function buildHistory(sessionData: any): Array<{ role: 'user' | 'assistant'; content: string }> {
  return (sessionData?.history || []).slice(-6);
}

async function appendHistory(phone: string, userMsg: string, botReply: string, sessionData: any) {
  const history = [...(sessionData?.history || []), { role: 'user', content: userMsg }, { role: 'assistant', content: botReply }].slice(-10);
  await prisma.whatsAppSession.update({
    where: { phoneNumber: phone },
    data: { sessionData: { ...(sessionData || {}), history } },
  });
}

async function send(
  phone: string,
  bodyOrVariables: string | Record<string, string>,
  mediaUrl?: string,
  contentSid?: string
) {
  if (!client) {
    console.error('[WHATSAPP] Twilio client not initialized. Check TWILIO_ACCOUNT_SID/AUTH_TOKEN.');
    return;
  }
  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  
  if (contentSid) {
    await client.messages.create({
      from: FROM,
      to,
      contentSid,
      contentVariables: typeof bodyOrVariables === 'string' ? bodyOrVariables : JSON.stringify(bodyOrVariables),
    });
  } else {
    await client.messages.create({
      from: FROM,
      to,
      body: typeof bodyOrVariables === 'string' ? bodyOrVariables : '',
      ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
    });
  }
}
