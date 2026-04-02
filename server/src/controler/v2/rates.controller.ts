import { Response } from 'express';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { getUSDExchangeRates } from '../../util/exchangeRate.util.js';

export const getAllExchangeRates = async (req: any, res: Response) => {
  try {
    const rates = await getUSDExchangeRates();
    const { getRecentOrders, getTransparencyStats } = await import('../../dbQueries/order.Queries.js');
    const recentOrders = await getRecentOrders(5);
    const transStats = await getTransparencyStats();

    const recentDeals = recentOrders.map(o => ({
      id: o.id,
      product: o.product?.title || 'Unknown Product',
      amount: o.priceUsdc,
      wallet: o.buyer?.stellarWallet ? `${o.buyer.stellarWallet.slice(0, 6)}...${o.buyer.stellarWallet.slice(-4)}` : 'Anonymous',
      date: (o as any).createdAt,
      status: (o as any).status || 'COMPLETED',
      fee: (Number(o.priceUsdc) * 0.01).toFixed(4) // 1% platform fee + network
    }));

    res.json(new ApiResponse(200, {
      USDC: {
        usd: rates.USDC ?? 1.0,
        inr: rates.USDC_INR ?? 83.33,
      },
      USDT: {
        usd: rates.USDT ?? 1.0,
        inr: rates.USDT_INR ?? 83.33,
      },
      XLM: {
        usd: rates.XLM ?? 0.12,
        inr: rates.XLM_INR ?? 28.6,
      },
      INR_EXCHANGE: rates.USDC_INR ?? 83.33,
      networkStats: {
        avgFee: "0.00001 XLM",
        tps: "1000+",
        protocol: "Stellar/Soroban",
        uptime: "99.99%",
        systemFees: (transStats.totalVolume * 0.01).toFixed(2), // 1% total platform gather
        totalVolume: transStats.totalVolume.toFixed(2),
        countriesReached: transStats.salesByCountry.length
      },
      salesByCountry: transStats.salesByCountry,
      volumeTrend: transStats.volumeTrend,
      recentDeals
    }, 'All exchange rates and transparency data fetched'));

  } catch (error: any) {
    res.status(502).json(new ApiResponse(502, null, 'Error fetching rates from CoinGecko'));
  }
};
