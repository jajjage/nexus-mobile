import { agentService, normalizeAgentCodeValidation } from "@/services/agent.service";
import {
    ActivateAgentResponse,
    AgentAccount,
    AgentCommission,
    AgentCustomer,
    AgentCustomersParams,
    AgentStats,
    AvailableBalance,
    BankWithdrawalHistoryItem,
    BankWithdrawalHistoryParams,
    BankWithdrawalRequest,
    PaginatedResponse,
    RegenerateAgentCodeResponse,
    ValidateAgentCodeResponse,
    WalletWithdrawalRequest,
    WithdrawalResponse,
} from "@/types/agent.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

// ==================== Query Keys ====================

export const agentKeys = {
  all: ["agent"] as const,
  account: () => [...agentKeys.all, "account"] as const,
  stats: () => [...agentKeys.all, "stats"] as const,
  customers: (params: AgentCustomersParams) =>
    [
      ...agentKeys.all,
      "customers",
      params.page ?? 1,
      params.limit ?? 20,
      params.q ?? "",
      typeof params.isActive === "boolean" ? params.isActive : "all",
    ] as const,
  commissions: (page: number, limit: number) =>
    [...agentKeys.all, "commissions", page, limit] as const,
  availableBalance: () => [...agentKeys.all, "available-balance"] as const,
  bankWithdrawals: (params: BankWithdrawalHistoryParams) =>
    [
      ...agentKeys.all,
      "bank-withdrawals",
      params.page ?? 1,
      params.limit ?? 20,
      params.status ?? "all",
    ] as const,
};

// ==================== Query Hooks ====================

/**
 * Check if current user has an active agent account
 */
export function useAgentAccount() {
  return useQuery<AgentAccount | null>({
    queryKey: agentKeys.account(),
    queryFn: async () => {
      try {
        const response = await agentService.getAgentAccount();
        return response.data || null;
      } catch (error: any) {
        // 404 or not found means user is not an agent
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Get agent dashboard statistics
 */
export function useAgentStats() {
  return useQuery<AgentStats | undefined>({
    queryKey: agentKeys.stats(),
    queryFn: async (): Promise<AgentStats | undefined> => {
      const response = await agentService.getAgentStats();
      return response.data as AgentStats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true, // Only enabled when user is an agent
  });
}

/**
 * Get list of agent's customers with pagination
 */
export function useAgentCustomers(params: AgentCustomersParams = {}) {
  const normalizedParams: AgentCustomersParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    q: params.q?.trim() || undefined,
    isActive: params.isActive,
  };

  return useQuery<PaginatedResponse<AgentCustomer> | undefined>({
    queryKey: agentKeys.customers(normalizedParams),
    queryFn: async (): Promise<PaginatedResponse<AgentCustomer> | undefined> => {
      const response = await agentService.getAgentCustomers(normalizedParams);
      return response.data as PaginatedResponse<AgentCustomer>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get list of agent's commissions with pagination
 */
export function useAgentCommissions(page: number = 1, limit: number = 20) {
  return useQuery<PaginatedResponse<AgentCommission> | undefined>({
    queryKey: agentKeys.commissions(page, limit),
    queryFn: async (): Promise<PaginatedResponse<AgentCommission> | undefined> => {
      const response = await agentService.getAgentCommissions(page, limit);
      return response.data as PaginatedResponse<AgentCommission>;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get available commission balance
 */
export function useAvailableAgentBalance() {
  return useQuery<AvailableBalance | undefined>({
    queryKey: agentKeys.availableBalance(),
    queryFn: async (): Promise<AvailableBalance | undefined> => {
      const response = await agentService.getAvailableBalance();
      return response.data as AvailableBalance;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Validate agent code (public query)
 */
export function useValidateAgentCode(
  code: string,
  onSuccess?: (data: ValidateAgentCodeResponse) => void
) {
  return useQuery({
    queryKey: ["agent", "validate", code],
    queryFn: async () => {
      const response = await agentService.validateAgentCode(code);
      const normalized = normalizeAgentCodeValidation(response);
      onSuccess?.(normalized);
      return normalized;
    },
    enabled: !!code && code.length > 0,
    retry: false,
  });
}

export function useAgentBankWithdrawals(
  params: BankWithdrawalHistoryParams = {}
) {
  const normalizedParams: BankWithdrawalHistoryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    status: params.status,
  };

  return useQuery<PaginatedResponse<BankWithdrawalHistoryItem> | undefined>({
    queryKey: agentKeys.bankWithdrawals(normalizedParams),
    queryFn: async (): Promise<
      PaginatedResponse<BankWithdrawalHistoryItem> | undefined
    > => {
      const response = await agentService.getBankWithdrawals(normalizedParams);
      return response.data as PaginatedResponse<BankWithdrawalHistoryItem>;
    },
    staleTime: 0,
  });
}

// ==================== Mutation Hooks ====================

/**
 * Activate agent account for current user
 */
export function useActivateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await agentService.activateAgentAccount();
      return response.data as ActivateAgentResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
      toast.success("Agent account activated successfully!");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to activate agent account";
      toast.error(message);
    },
  });
}

/**
 * Deactivate agent account
 */
export function useDeactivateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await agentService.deactivateAgentAccount();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
      toast.success("Agent account deactivated");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to deactivate agent account";
      toast.error(message);
    },
  });
}

/**
 * Regenerate agent code
 */
export function useRegenerateAgentCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await agentService.regenerateAgentCode();
      return response.data as RegenerateAgentCodeResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.account() });
      toast.success(`New agent code: ${data.agentCode}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to regenerate agent code";
      toast.error(message);
    },
  });
}

/**
 * Withdraw commission balance
 */
export function useWithdrawToWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WalletWithdrawalRequest) => {
      const response = await agentService.withdrawToWallet(payload);
      return response.data as WithdrawalResponse;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      // Refetch immediately for real-time UI update
      queryClient.refetchQueries({ queryKey: agentKeys.bankWithdrawals({ page: 1, limit: 100, status: "pending" }) });
      queryClient.refetchQueries({ queryKey: agentKeys.bankWithdrawals({ page: 1, limit: 100, status: "processing" }) });
      toast.success(
        `Withdrawal of ₦${(data?.amount ?? payload.amount).toLocaleString()} sent to wallet`
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to process withdrawal";
      toast.error(message);
    },
  });
}

export function useRequestBankWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BankWithdrawalRequest) => {
      const response = await agentService.requestBankWithdrawal(payload);
      return response.data as WithdrawalResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      // Refetch immediately for real-time UI update
      queryClient.refetchQueries({ queryKey: agentKeys.bankWithdrawals({ page: 1, limit: 100, status: "pending" }) });
      queryClient.refetchQueries({ queryKey: agentKeys.bankWithdrawals({ page: 1, limit: 100, status: "processing" }) });
      toast.success(
        "Bank withdrawal request submitted. Your withdrawal will be processed in the next 24 hours."
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to submit bank withdrawal request";
      toast.error(message);
    },
  });
}
