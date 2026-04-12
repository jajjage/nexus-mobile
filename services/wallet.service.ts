import apiClient from "@/lib/api-client";
import {
    GetTransactionsParams,
    TransactionResponse,
    TransactionsListResponse,
    WalletResponse,
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
  // Supports: direction, status, date range, pagination
  // Note: status filtering works with relatedType (typically "topup_request")
  getTransactions: async (
    params?: GetTransactionsParams
  ): Promise<TransactionsListResponse> => {
    // Build clean params object - only include defined values
    const cleanParams: any = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.direction) cleanParams.direction = params.direction;
    if (params?.relatedType) cleanParams.relatedType = params.relatedType;
    if (params?.status) cleanParams.status = params.status;
    if (params?.startDate) cleanParams.startDate = params.startDate;
    if (params?.endDate) cleanParams.endDate = params.endDate;

    console.log('[TX_SERVICE] Fetching with params:', cleanParams);
    
    const response = await apiClient.get<TransactionsListResponse>(
      "/user/wallet/transactions",
      { params: cleanParams }
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
