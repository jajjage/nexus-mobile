/**
 * Reseller Service
 * API methods for reseller-specific features
 */

import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api.types";
import type {
  ApiKeysListData,
  BulkTopupRequest,
  BulkTopupResponseData,
  CreateApiKeyRequest,
  CreateApiKeyResponseData,
} from "@/types/reseller.types";

export const resellerService = {
  // ============= Bulk Topup =============

  /**
   * Process multiple topups in a single batch
   * @param data - Batch of topup requests (max 50 items)
   * @returns Batch processing results
   */
  bulkTopup: async (
    data: BulkTopupRequest
  ): Promise<ApiResponse<BulkTopupResponseData>> => {
    const response = await apiClient.post<ApiResponse<BulkTopupResponseData>>(
      "/reseller/bulk-topup",
      data
    );
    return response.data;
  },

  // ============= API Key Management =============

  /**
   * Get all API keys for the current reseller
   * @returns List of API keys (prefixes only, not full keys)
   */
  getApiKeys: async (): Promise<ApiResponse<ApiKeysListData>> => {
    const response =
      await apiClient.get<ApiResponse<ApiKeysListData>>("/reseller/keys");
    return response.data;
  },

  /**
   * Create a new API key
   * WARNING: The full key is returned ONLY ONCE in the response
   * @param data - Key name and environment (live/test)
   * @returns Created key with full key value
   */
  createApiKey: async (
    data: CreateApiKeyRequest
  ): Promise<ApiResponse<CreateApiKeyResponseData>> => {
    const response = await apiClient.post<
      ApiResponse<CreateApiKeyResponseData>
    >("/reseller/keys", data);
    return response.data;
  },

  /**
   * Revoke an API key permanently
   * @param keyId - ID of the key to revoke
   */
  revokeApiKey: async (keyId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/reseller/keys/${keyId}`
    );
    return response.data;
  },

  // ============= Upgrade Request =============

  /**
   * Request upgrade to reseller status
   * For regular users (role=user) to apply for reseller account
   * @param message - User's business pitch/reason for upgrade
   */
  requestUpgrade: async (
    message: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/reseller/request-upgrade",
      { message }
    );
    return response.data;
  },
};
