import { userService } from '@/services/user.service';
import { Purchase } from '@/types/user.types';
import { useQuery } from '@tanstack/react-query';

export const transactionKeys = {
  all: ['wallet', 'transactions'] as const,
};

export function useRecentTransactions() {
  const query = useQuery({
    queryKey: transactionKeys.all,
    queryFn: async (): Promise<Purchase[]> => {
      const response = await userService.getPurchases({ page: 1, limit: 10 });
      return response.data?.purchases || []; 
    },
    // Keep data fresh for 1 minute
    staleTime: 60 * 1000, 
  });

  return {
    transactions: query.data || [] as Purchase[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
