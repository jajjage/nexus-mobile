import apiClient, { publicApiClient } from "@/lib/api-client";
import {
    ActivateAgentResponse,
    AgentAccount,
    AgentCommission,
    AgentCustomer,
    AgentStats,
    AvailableBalance,
    PaginatedResponse,
    RegenerateAgentCodeResponse,
    RegisterWithAgentCodePayload,
    ValidateAgentCodeResponse,
    WithdrawalRequest,
    WithdrawalResponse,
} from "@/types/agent.types";
import { ApiResponse } from "@/types/api.types";

export function normalizeAgentCodeValidation(
  response: ApiResponse<ValidateAgentCodeResponse>
): ValidateAgentCodeResponse {
  const payload: any = response?.data ?? response ?? {};
  const topLevelMessage = response?.message;

  const valid =
    typeof payload?.valid === "boolean"
      ? payload.valid
      : typeof payload?.isValid === "boolean"
        ? payload.isValid
        : response?.success === true;

  return {
    valid,
    referrerName:
      payload?.referrerName ??
      payload?.agentName ??
      payload?.name,
    message: payload?.message ?? topLevelMessage,
  };
}

/**
 * Agent Service
 * Handles all agent-related API calls for:
 * - Signup with agent code
 * - Becoming an agent
 * - Agent dashboard operations
 * - Commission management
 */

export const agentService = {
  // ==================== Public Endpoints ====================

  /**
   * Validate agent code during signup
   * GET /api/v1/agent/code/validate?code=AGENT-ABC123
   * Note: apiClient baseURL already includes /api/v1
   */
  validateAgentCode: async (
    code: string
  ): Promise<ApiResponse<ValidateAgentCodeResponse>> => {
    const response = await publicApiClient.get<
      ApiResponse<ValidateAgentCodeResponse>
    >("/agent/code/validate", {
      params: { code: code.trim().toUpperCase() },
    });
    return {
      ...response.data,
      data: normalizeAgentCodeValidation(response.data),
    };
  },

  /**
   * Register with agent code
   * POST /api/v1/auth/register
   * Includes agentCode in payload if user is signing up under an agent
   */
  registerWithAgentCode: async (
    payload: RegisterWithAgentCodePayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/register",
      payload
    );
    return response.data;
  },

  // ==================== Authenticated Endpoints ====================

  /**
   * Activate agent account for current user
   * POST /api/v1/dashboard/agent/account/activate
   * Returns: { agentCode: string }
   */
  activateAgentAccount: async (): Promise<ApiResponse<ActivateAgentResponse>> => {
    const response = await apiClient.post<ApiResponse<ActivateAgentResponse>>(
      "/dashboard/agent/account/activate",
      {}
    );
    return response.data;
  },

  /**
   * Deactivate agent account for current user
   * POST /api/v1/dashboard/agent/account/deactivate
   */
  deactivateAgentAccount: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/dashboard/agent/account/deactivate",
      {}
    );
    return response.data;
  },

  /**
   * Get current agent account details
   * GET /api/v1/dashboard/agent/account
   */
  getAgentAccount: async (): Promise<ApiResponse<AgentAccount>> => {
    const response = await apiClient.get<ApiResponse<AgentAccount>>(
      "/dashboard/agent/account"
    );
    return response.data;
  },

  /**
   * Get agent dashboard statistics
   * GET /api/v1/dashboard/agent/stats
   */
  getAgentStats: async (): Promise<ApiResponse<AgentStats>> => {
    const response = await apiClient.get<ApiResponse<AgentStats>>(
      "/dashboard/agent/stats"
    );
    return response.data;
  },

  /**
   * Get list of customers acquired by this agent
   * GET /api/v1/dashboard/agent/customers?page=1&limit=20
   */
  getAgentCustomers: async (
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<AgentCustomer>>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AgentCustomer>>
    >("/dashboard/agent/customers", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get list of commissions earned
   * GET /api/v1/dashboard/agent/commissions?page=1&limit=20
   */
  getAgentCommissions: async (
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<AgentCommission>>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<AgentCommission>>
    >("/dashboard/agent/commissions", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get available balance for withdrawal
   * GET /api/v1/dashboard/agent/available-balance
   */
  getAvailableBalance: async (): Promise<ApiResponse<AvailableBalance>> => {
    const response = await apiClient.get<ApiResponse<AvailableBalance>>(
      "/dashboard/agent/available-balance"
    );
    return response.data;
  },

  /**
   * Withdraw commission balance
   * POST /api/v1/dashboard/agent/withdraw
   * Body: { amount: number }
   */
  withdrawCommission: async (
    amount: number
  ): Promise<ApiResponse<WithdrawalResponse>> => {
    const response = await apiClient.post<ApiResponse<WithdrawalResponse>>(
      "/dashboard/agent/withdraw",
      { amount } as WithdrawalRequest
    );
    return response.data;
  },

  /**
   * Regenerate agent code
   * POST /api/v1/dashboard/agent/account/regenerate-code
   */
  regenerateAgentCode: async (): Promise<
    ApiResponse<RegenerateAgentCodeResponse>
  > => {
    const response = await apiClient.post<
      ApiResponse<RegenerateAgentCodeResponse>
    >("/dashboard/agent/account/regenerate-code", {});
    return response.data;
  },
};
