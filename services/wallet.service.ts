import apiClient from "@/lib/api-client";
import {
    GetTransactionsParams,
    Transaction,
    TransactionResponse,
    TransactionsListResponse,
    WalletResponse,
} from "@/types/wallet.types";

const normalizeTransactionsResponse = (payload: any): TransactionsListResponse => {
  const wrapper = payload?.data && (payload.data.transactions || payload.data.items || payload.data.results)
    ? payload
    : { ...payload, data: payload?.data?.data || payload?.data || payload };
  const data = wrapper.data || {};
  const transactions = (data.transactions || data.items || data.results || []) as Transaction[];
  const pagination = data.pagination || data.meta || {};
  const page = Number(pagination.page || data.page || 1);
  const limit = Number(pagination.limit || data.limit || transactions.length || 20);
  const total = Number(pagination.total || data.total || transactions.length);
  const totalPages = Number(pagination.totalPages || data.totalPages || Math.max(1, Math.ceil(total / Math.max(limit, 1))));

  return {
    success: payload?.success ?? true,
    message: payload?.message || "Transactions retrieved successfully",
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  };
};

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
    return normalizeTransactionsResponse(response.data);
  },

  // Get single transaction by ID
  getTransactionById: async (id: string): Promise<TransactionResponse> => {
    const response = await apiClient.get<TransactionResponse>(
      `/user/wallet/transactions/${id}`
    );
    return response.data;
  },
};
