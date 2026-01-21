import { useAuth } from './useAuth';

// Key for wallet balance - separate from user if we eventually split endpoints
export const walletKeys = {
  balance: ['wallet', 'balance'] as const,
};

export function useWalletBalance() {
  const { user, refetch: refetchAuth } = useAuth();
  
  // Currently balance is part of user profile, so we just return it
  // But we wrap it in a query structure to support the requested interface
  // and future proofing if balance becomes a separate endpoint.
  
  const balance = user?.balance ? parseFloat(user.balance.toString()) : 0;
  
  return {
    balance,
    isLoading: false, // Since it comes from auth which is already loaded
    // When refreshing balance, we refresh the user profile
    refetch: refetchAuth,
  };
}
