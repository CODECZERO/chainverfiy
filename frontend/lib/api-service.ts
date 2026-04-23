// ChainVerify API service — all calls go to Express backend via Prisma/PostgreSQL
// Zero blockchain reads — Stellar is only used for payments

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const targetUrl = `${API}${path}`;
  console.log(`[apiFetch] Calling: ${targetUrl}`, { method: options?.method || 'GET' });

  const headers: any = { ...authHeaders, ...options?.headers };
  
  // Only set application/json if not sending FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(targetUrl, {
    credentials: 'include',
    headers,
    cache: 'no-store',
    ...options,
  });
  const json = await res.json();

  // Unwrap ApiResponse envelope: { statusCode, data, message, success }
  // Return the inner .data so callers get clean payloads
  if (json && typeof json === 'object' && 'success' in json && 'data' in json && 'statusCode' in json) {
    if (json.success === false) {
      throw new Error(json.message || `API Request Failed (${json.statusCode})`);
    }
    
    const result = json.data;
    // Attach success/message to the data even for arrays (as hidden/extra props)
    if (result && (typeof result === 'object' || Array.isArray(result))) {
       try {
         Object.defineProperty(result, '_success', { value: json.success, enumerable: false });
         Object.defineProperty(result, '_message', { value: json.message, enumerable: false });
         // For backward compatibility with existing code that checks .success
         Object.defineProperty(result, 'success', { value: json.success, enumerable: false });
       } catch (e) {
         // Silently fail if object is frozen (e.g. some library objects)
       }
    }
    return result;
  }
  return json;
}

// ─── Products (Marketplace) ───
export const getProducts = (params?: Record<string, string>) => {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/products${q}`);
};

export const getProduct = (id: string) => apiFetch(`/products/${id}`);
export const getTasks = getProducts;

export const createProduct = (data: any) =>
  apiFetch('/products', { method: 'POST', body: JSON.stringify(data) });

export const addStageUpdate = (productId: string, data: any) =>
  apiFetch(`/products/${productId}/stage`, { method: 'POST', body: JSON.stringify(data) });

export const voteProduct = (productId: string, data: any) =>
  apiFetch(`/products/${productId}/vote`, { method: 'POST', body: JSON.stringify(data) });

// ─── Orders ───
export const createOrder = (data: any) =>
  apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) });

export const getOrder = (id: string) => apiFetch(`/orders/${id}`);

export const confirmDelivery = (orderId: string, data: any) =>
  apiFetch(`/orders/${orderId}/confirm-delivery`, { method: 'POST', body: JSON.stringify(data) });

export const disputeOrder = (orderId: string, data: any) =>
  apiFetch(`/orders/${orderId}/dispute`, { method: 'POST', body: JSON.stringify(data) });

export const getPublicDispute = (orderId: string) =>
  apiFetch(`/orders/${orderId}/dispute`);

export const voteOnDispute = (orderId: string, data: { decision: string; userId?: string; stellarWallet?: string }) =>
  apiFetch(`/orders/${orderId}/dispute/vote`, { method: 'POST', body: JSON.stringify(data) });

export const dispatchOrder = (orderId: string) =>
  apiFetch(`/orders/${orderId}/dispatch`, { method: 'PATCH' });


// ─── Suppliers ───
export const getSupplier = (id: string) => apiFetch(`/suppliers/${id}`);

export const getSupplierProducts = (id: string) => apiFetch(`/suppliers/${id}/products`);

export const flagSupplier = (id: string) =>
  apiFetch(`/suppliers/${id}/flag`, { method: 'POST' });


// ─── Community ───
export const getVerifyQueue = () => apiFetch('/community/queue');

export const castVote = (data: any) =>
  apiFetch('/community/vote', { method: 'POST', body: JSON.stringify(data) });

export const getLeaderboard = () => apiFetch('/community/leaderboard');
export const getJoinedCommunities = (params?: { userId?: string; stellarWallet?: string }) => {
  const qs = new URLSearchParams();
  if (params?.userId) qs.set('userId', params.userId);
  if (params?.stellarWallet) qs.set('stellarWallet', params.stellarWallet);
  const query = qs.toString();
  return apiFetch(`/community/joined${query ? `?${query}` : ''}`);
};

export const getCommunityQueue = (userId?: string) => {
  const q = userId ? `?userId=${userId}` : '';
  return apiFetch(`/community/queue${q}`);
};

export const getCommunityHistory = (identifier: string) => 
  apiFetch(`/community/history/${identifier}`);

export const getTokenBalance = (identifier: string) =>
  apiFetch(`/products/tokens/${identifier}`);


// ─── Stats ───
export const getStats = () => apiFetch('/stats');

// ─── Auth ───
export const signup = (data: any) =>
  apiFetch('/user/signup', { method: 'POST', body: JSON.stringify(data) });

export const login = (data: any) =>
  apiFetch('/user/login', { method: 'POST', body: JSON.stringify(data) });

export const logout = () => apiFetch('/user/logout', { method: 'POST' });

export const getMe = () => apiFetch('/user/me');

// ─── Legacy aliases (keep for any remaining component refs) ───
export const getPosts = () => getProducts({ status: 'VERIFIED' });
export const verifyProof = (id: string) => getProduct(id);

export type Post = {
  id: string;
  _id: string;
  title: string;
  Title: string;
  description?: string;
  Description?: string;
  category: string;
  Type?: string;
  priceInr: number;
  NeedAmount?: number;
  status: string;
  supplier: { name: string; location: string };
  supplierId?: string;
  voteReal: number;
  voteFake: number;
  proofMediaUrls: string[];
  ImgCid?: string;
  WalletAddr?: string;
  Location?: string;
};

// Additional aliases for backward compat
export const getUserProfile = (id: string) => apiFetch(`/user-profile/${id}`);
export const getWalletProfile = (walletAddr: string) => apiFetch(`/user-profile/wallet/${walletAddr}`);
export const getOrders = () => apiFetch('/donations');
export const getNotifications = () => apiFetch('/notifications');
export const markNotificationsRead = () => apiFetch('/notifications/read-all', { method: 'PATCH' });
export const getPaymentQuote = (sourceCurrency: string, targetUsdcAmount: string) =>
  apiFetch('/payments/quote', { method: 'POST', body: JSON.stringify({ sourceCurrency, targetUsdcAmount }) });
export const initiateUPI = (data: any) => apiFetch('/payments/upi/initiate', { method: 'POST', body: JSON.stringify(data) });
export const uploadToIpfs = (formData: FormData) => 
  apiFetch('/ipfs/upload', { method: 'POST', body: formData }); // Browser will now correctly set boundary since we removed default Content-Type


// ─── Stellar / Wallet helpers (used by stellar-utils.ts) ───
export const getWalletBalance = (publicKey: string) => apiFetch(`/wallet/balance/${publicKey}`);

// Bounties
export const createBounty = (data: { productId: string; issuerId: string; amount: number; description: string }) =>
  apiFetch('/bounties', { method: 'POST', body: JSON.stringify(data) });

export const verifyBountyPayment = (data: { bountyId: string; transactionHash: string; paymentMethod?: string }) =>
  apiFetch('/bounties/verify', { method: 'POST', body: JSON.stringify(data) });

export const verifyDonation = verifyBountyPayment;

export const submitBountyProof = (data: { bountyId: string; solverId?: string; stellarWallet?: string; proofCid: string }) =>
  apiFetch('/bounties/submit-proof', { method: 'POST', body: JSON.stringify(data) });

export const getBountiesByProduct = (productId: string) =>
  apiFetch(`/bounties/product/${productId}`);

export const getSupplierBounties = (supplierId: string) =>
  apiFetch(`/bounties/supplier/${supplierId}`);

export const getAllBounties = () => apiFetch('/bounties');

export const getIssuerBounties = (issuerId?: string, wallet?: string) => {
  const q = wallet ? `?wallet=${wallet}` : '';
  return apiFetch(`/bounties/issuer/${issuerId || 'null'}${q}`);
};

export const approveBountyProof = (bountyId: string, data: { issuerId?: string; stellarWallet?: string }) =>
  apiFetch(`/bounties/${bountyId}/approve-proof`, { method: 'POST', body: JSON.stringify(data) });

export const rejectBountyProof = (bountyId: string, data: { issuerId?: string; stellarWallet?: string; reason?: string }) =>
  apiFetch(`/bounties/${bountyId}/reject-proof`, { method: 'POST', body: JSON.stringify(data) });

export const createStellarAccount = () => apiFetch('/wallet/create', { method: 'POST' });
export const walletPay = (data: any) =>
  apiFetch('/payment/wallet-pay', { method: 'POST', body: JSON.stringify(data) });
export const sendPayment = (data: any) =>
  apiFetch('/payment/send', { method: 'POST', body: JSON.stringify(data) });
export const getEscrowXdr = (data: { sequence?: string; [key: string]: any }) =>
  apiFetch('/contracts/escrow/create-escrow/xdr', { method: 'POST', body: JSON.stringify(data) });
export const getVoteXdr = (data: { sequence?: string; [key: string]: any }) =>
  apiFetch('/contracts/escrow/vote/xdr', { method: 'POST', body: JSON.stringify(data) });
export const getSubmitProofXdr = (data: { sequence?: string; [key: string]: any }) =>
  apiFetch('/contracts/escrow/submit-proof/xdr', { method: 'POST', body: JSON.stringify(data) });
export const submitEscrowTx = (data: { signedXdr: string }) =>
  apiFetch('/contracts/escrow/submit', { method: 'POST', body: JSON.stringify(data) });

export const getSupplierOrders = (supplierId?: string) => 
  supplierId ? apiFetch(`/donations/supplier/${supplierId}`) : apiFetch('/user/supplier/orders');

export const getSupplierAnalytics = (supplierId: string) => 
  apiFetch(`/suppliers/${supplierId}/analytics`);


export const getVerificationStatus = (productId?: string, wallet?: string) => {
  const params: any = {};
  if (productId) params.productId = productId;
  if (wallet) params.wallet = wallet;
  const q = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/verification/status${q}`);
};

// ─── Journey & Map ───
export const getQRJourney = (shortCode: string) => apiFetch(`/qr/${shortCode}/journey`);
export const getQRMapData = (shortCode: string) => apiFetch(`/qr/${shortCode}/map-data`);
export const getQRCertificate = (shortCode: string) => apiFetch(`/qr/${shortCode}/certificate`);

export const registerQRScan = (data: any) =>
  apiFetch('/qr/scan', { method: 'POST', body: JSON.stringify(data) });

export const updateQRLocation = (scanId: string, data: any) =>
  apiFetch(`/qr/scan/${scanId}/location`, { method: 'PATCH', body: JSON.stringify(data) });


// ─── Machines ───
export const registerMachine = (data: any) =>
  apiFetch('/qr/machines/register', { method: 'POST', body: JSON.stringify(data) });

// ─── WhatsApp ───
export const getWhatsappStatus = () => apiFetch('/whatsapp/status');

// ─── Market Rates ───
export const getExchangeRates = () => apiFetch('/rates/all');

// ─── Buyer Profile ───
export const getBuyerProfile = (wallet?: string) => {
  const q = wallet ? `?stellarWallet=${wallet}` : '';
  return apiFetch(`/buyer${q}`);
};
export const updateBuyerProfile = (data: any) =>
  apiFetch('/buyer', { method: 'PUT', body: JSON.stringify(data) });

export const getMyOrders = (params: Record<string, string>) => {
  const q = '?' + new URLSearchParams(params).toString();
  return apiFetch(`/orders/my-orders${q}`);
};


// ─── Discussions (Community Hub) ───
export const getDiscussions = (params?: { tag?: string; search?: string }) => {
  const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return apiFetch(`/discussions${q}`);
};

export const getDiscussion = (id: string) => apiFetch(`/discussions/${id}`);

export const createDiscussion = (data: { title: string; content: string; authorId?: string; authorWallet?: string; tags?: string[] }) =>
  apiFetch('/discussions', { method: 'POST', body: JSON.stringify(data) });

export const addDiscussionComment = (data: { discussionId: string; authorId?: string; authorWallet?: string; content: string }) =>
  apiFetch('/discussions/comments', { method: 'POST', body: JSON.stringify(data) });

// ─── Escrow & Delivery (Advanced) ───
export const getEscrow = (taskId: string) => apiFetch(`/contracts/escrow/${taskId}`);

export const releaseEscrow = (taskId: string) =>
  apiFetch('/contracts/escrow/release', { method: 'POST', body: JSON.stringify({ taskId }) });

export const disputeEscrow = (taskId: string) =>
  apiFetch('/contracts/escrow/dispute', { method: 'POST', body: JSON.stringify({ taskId }) });

export const refundEscrow = (taskId: string) =>
  apiFetch('/contracts/escrow/refund', { method: 'POST', body: JSON.stringify({ taskId }) });

export const buildRequestReturnTx = (data: { buyerPublicKey: string; taskId: string }) =>
  apiFetch('/contracts/escrow/request-return/xdr', { method: 'POST', body: JSON.stringify(data) });

export const buildConfirmReturnTx = (data: { supplierPublicKey: string; taskId: string }) =>
  apiFetch('/contracts/escrow/confirm-return/xdr', { method: 'POST', body: JSON.stringify(data) });

