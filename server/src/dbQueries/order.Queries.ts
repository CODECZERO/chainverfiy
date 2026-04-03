// Renamed: Donations → Orders
import { prisma } from '../lib/prisma.js';

export const createOrder = async (data: {
  productId: string;
  buyerId: string;
  quantity: number;
  priceInr: number;
  priceUsdc: number;
  paymentMethod: string;
  escrowTxId?: string;
}) => {

  return prisma.order.create({ data: data as any });
};

export const getOrdersByBuyer = async (buyerId: string) => {
  return prisma.order.findMany({
    where: { buyerId },
    include: { product: { select: { title: true, supplier: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrdersBySupplier = async (supplierId: string) => {
  return prisma.order.findMany({
    where: { product: { supplierId } },
    include: { 
      buyer: { select: { email: true, stellarWallet: true, id: true } }, 
      product: { select: { title: true, category: true, proofMediaUrls: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getStats = async () => {
  const [totalProducts, verifiedProducts, totalOrders, suppliers, totalTokensRes, totalUsdc] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'VERIFIED' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.supplier.count(),
    prisma.trustTokenLedger.aggregate({ _sum: { amount: true } }),
    prisma.order.aggregate({ _sum: { priceUsdc: true }, where: { status: 'COMPLETED' } }),
  ]);


  // Prisma doesn't easily average date differences across all dialects without raw SQL.
  // We'll fetch the records and calculate in JS for now or use a raw query.
  const verifiedProductsList = await prisma.product.findMany({
    where: { status: 'VERIFIED', NOT: { verifiedAt: null } },
    select: { createdAt: true, verifiedAt: true }
  });

  let avgVerifyTime = 0;
  if (verifiedProductsList.length > 0) {
    const totalDiff = verifiedProductsList.reduce(
      (acc: number, p: { createdAt: Date; verifiedAt: Date | null }) => {
        return acc + ((p.verifiedAt ?? p.createdAt).getTime() - p.createdAt.getTime());
      },
      0,
    );
    avgVerifyTime = Math.round(totalDiff / verifiedProductsList.length / (1000 * 60 * 60)); // in hours
  }

  return {
    totalProducts,
    verifiedProducts,
    totalOrders,
    totalSuppliers: suppliers,
    totalUsdcTransacted: Number(totalUsdc._sum.priceUsdc || 0),
    avgVerifyTime: avgVerifyTime || 18,
    totalTrustTokens: totalTokensRes._sum.amount || 0,
  };
};

export const getOrder = async (txId: string) => {
  const { prisma } = await import('../lib/prisma.js');
  return prisma.order.findFirst({ where: { escrowTxId: txId } });
};

export const getOrdersByDonor = async (buyerId: string) => {
  return prisma.order.findMany({
    where: { buyerId },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });
};
export const getRecentOrders = async (limit: number = 5) => {
  return prisma.order.findMany({
    take: limit,
    include: { 
      product: { select: { title: true } },
      buyer: { select: { stellarWallet: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTransparencyStats = async () => {
  const [salesByCountryRaw, totalUsdc, volumeTrendRaw] = await Promise.all([
    prisma.order.groupBy({
      by: ['shippingCountry'],
      _count: { id: true },
      _sum: { priceUsdc: true, quantity: true },
      _avg: { priceUsdc: true },
      where: { status: 'COMPLETED' }
    }),
    prisma.order.aggregate({
      _sum: { priceUsdc: true },
      where: { status: 'COMPLETED' }
    }),
    prisma.order.findMany({
      where: { 
        status: 'COMPLETED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      select: { createdAt: true, priceUsdc: true },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  // Process volume trend into daily buckets
  const dailyBuckets: Record<string, number> = {};
  volumeTrendRaw.forEach(o => {
    const date = o.createdAt.toISOString().split('T')[0] as string;
    dailyBuckets[date] = (dailyBuckets[date] || 0) + Number(o.priceUsdc || 0);
  });

  const volumeTrend = Object.entries(dailyBuckets).map(([date, volume]) => ({
    date,
    volume: Number(volume.toFixed(2))
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    salesByCountry: salesByCountryRaw.map(c => ({
      country: c.shippingCountry || 'Global',
      count: c._count.id,
      volume: Number(c._sum.priceUsdc || 0),
      itemsSold: Number(c._sum.quantity || 0),
      avgRate: Number(c._avg.priceUsdc || 0)
    })),
    totalVolume: Number(totalUsdc._sum.priceUsdc || 0),
    volumeTrend
  };
};
