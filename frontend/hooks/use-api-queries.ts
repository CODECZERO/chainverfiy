import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api-service";

/**
 * Global Query Keys for consistent cache management.
 */
export const queryKeys = {
  products: (params?: any) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,
  stats: ["stats"] as const,
  exchangeRates: ["exchangeRates"] as const,
  discussions: (params?: any) => ["discussions", params] as const,
  discussion: (id: string) => ["discussion", id] as const,
  userMe: ["userMe"] as const,
  joinedCommunities: ["joinedCommunities"] as const,
  usdcRates: ["usdcRates"] as const,
  communityQueue: (userId?: string) => ["communityQueue", userId] as const,
  communityHistory: (identifier: string) => ["communityHistory", identifier] as const,
  tokenBalance: (identifier: string) => ["tokenBalance", identifier] as const,
  buyerProfile: (wallet?: string) => ["buyerProfile", wallet] as const,
  myOrders: (params: any) => ["myOrders", params] as const,
};

// ─── Products / Marketplace ───

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  });
}

// ─── Stats & Rates ───

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.getStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: queryKeys.exchangeRates,
    queryFn: api.getExchangeRates,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Background refresh every minute
  });
}

export function useUSDCRates() {
  return useQuery({
    queryKey: queryKeys.usdcRates,
    queryFn: async () => {
      const all = await api.getExchangeRates();
      return all?.USDC || { usd: 1.0, inr: 83.33 };
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ─── Community Hub ───

export function useDiscussions(params?: { tag?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.discussions(params),
    queryFn: () => api.getDiscussions(params),
    staleTime: 45 * 1000,
  });
}

export function useDiscussion(id: string) {
  return useQuery({
    queryKey: queryKeys.discussion(id),
    queryFn: () => api.getDiscussion(id),
    enabled: !!id,
  });
}

// ─── User & Buyer ───

export function useUserMe() {
  return useQuery({
    queryKey: queryKeys.userMe,
    queryFn: api.getMe,
    retry: false, // Don't retry auth checks
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBuyerProfile(stellarWallet?: string) {
  return useQuery({
    queryKey: queryKeys.buyerProfile(stellarWallet),
    queryFn: () => api.getBuyerProfile(stellarWallet),
    staleTime: 60 * 1000,
  });
}

export function useMyOrders(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.myOrders(params),
    queryFn: () => api.getMyOrders(params),
    enabled: !!params,
  });
}

// ─── Verification ───

export function useCommunityQueue(userId?: string) {
  return useQuery({
    queryKey: queryKeys.communityQueue(userId),
    queryFn: () => api.getCommunityQueue(userId),
    staleTime: 30 * 1000,
  });
}

export function useCommunityHistory(identifier: string) {
  return useQuery({
    queryKey: queryKeys.communityHistory(identifier),
    queryFn: () => api.getCommunityHistory(identifier),
    staleTime: 60 * 1000,
    enabled: !!identifier,
  });
}

export function useJoinedCommunities(params?: { userId?: string; stellarWallet?: string }) {
  return useQuery({
    queryKey: [...queryKeys.joinedCommunities, params?.userId, params?.stellarWallet],
    queryFn: () => api.getJoinedCommunities(params),
    staleTime: 30 * 1000,
    enabled: !!(params?.userId || params?.stellarWallet),
  });
}

export function useTokenBalance(identifier: string) {
  return useQuery({
    queryKey: queryKeys.tokenBalance(identifier),
    queryFn: () => api.getTokenBalance(identifier),
    staleTime: 30 * 1000,
    enabled: !!identifier,
  });
}

// ─── Mutations (Actions) ───

export function useVoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, voteType }: { productId: string; voteType: string }) => 
      api.voteProduct(productId, { voteType }),
    onSuccess: (_, { productId }) => {
      // Invalidate both the specific product and the general product list
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useConfirmDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) => 
      api.confirmDelivery(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}
