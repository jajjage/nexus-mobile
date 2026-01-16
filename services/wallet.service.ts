import apiClient from "@/lib/api-client";
import {
  GetTransactionsParams,
  WalletResponse,
  TransactionResponse,
  TransactionsListResponse,
} from "@/types/wallet.types";

export const walletService = {
  // Get user wallet
  getWallet: async (): Promise<WalletResponse> => {
    const response = await apiClient.get<WalletResponse>("/user/wallet");
    return response.data;
  },

  // Get wallet balance
  getBalance: async (): Promise<WalletResponse> => {
    const response = await apiClient.get<WalletResponse>(
      "/user/wallet/balance"
    );
    return response.data;
  },

  // Get all transactions with filters
  getTransactions: async (
    params?: GetTransactionsParams
  ): Promise<TransactionsListResponse> => {
    const response = await apiClient.get<TransactionsListResponse>(
      "/user/wallet/transactions",
      { params }
    );
    return response.data;
  },

  // Get single transaction by ID
  getTransactionById: async (id: string): Promise<TransactionResponse> => {
    const response = await apiClient.get<TransactionResponse>(
      `/user/wallet/transactions/${id}`
    );
    return response.data;
  },
};
