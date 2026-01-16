import { walletService } from "@/services/wallet.service";
import { GetTransactionsParams } from "@/types/wallet.types";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { userKeys } from "./useUser";

// ============= Query Keys =============
export const walletKeys = {
  all: ["wallet"] as const,
  wallet: () => [...walletKeys.all, "details"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: {
    all: () => [...walletKeys.all, "transactions"] as const,
    list: (params?: GetTransactionsParams) =>
      [...walletKeys.transactions.all(), params] as const,
    detail: (id: string) => [...walletKeys.transactions.all(), id] as const,
  },
};

// ============= Wallet Queries =============

/**
 * Get user wallet details
 */
export const useWallet = () => {
  return useQuery({
    queryKey: walletKeys.wallet(),
    queryFn: () => walletService.getWallet(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/**
 * Get wallet balance
 */
export const useWalletBalance = () => {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    retry: 2,
  });
};

/**
 * Get all transactions with optional filters (for simple, non-paginated lists)
 * Also invalidates user profile to keep balance in sync
 */
export const useTransactions = (params?: GetTransactionsParams) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: walletKeys.transactions.list(params),
    queryFn: async () => {
      const result = await walletService.getTransactions(params);
      // Invalidate user profile to refresh balance when transactions update
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      return result;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    select: (data) => data.data.transactions,
    enabled: true,
  });
};

/**
 * Get all transactions with infinite scrolling
 */
export const useInfiniteTransactions = (params?: GetTransactionsParams) => {
  return useInfiniteQuery({
    queryKey: walletKeys.transactions.list(params),
    queryFn: ({ pageParam = 1 }) =>
      walletService.getTransactions({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.data.pagination.page;
      const totalPages = lastPage.data.pagination.totalPages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
};

/**
 * Get single transaction by ID
 */
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: walletKeys.transactions.detail(id),
    queryFn: () => walletService.getTransactionById(id),
    staleTime: 1000 * 60 * 10,
    retry: 2,
    enabled: !!id,
  });
};

/**
 * Get recent transactions (for dashboard)
 */
export const useRecentTransactions = () => {
  // This continues to use the simple useTransactions hook, which is fine for a small, non-paginated list
  return useTransactions({ page: 1, limit: 10 });
};

/**
 * Get pending transactions
 */
export const usePendingTransactions = () => {
  return useTransactions({ direction: "PENDING" as any, page: 1, limit: 20 });
};
