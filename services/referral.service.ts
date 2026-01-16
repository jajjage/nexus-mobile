import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  AvailableBalanceV2,
  GetReferralsParams,
  ReferralLinkData,
  ReferralListResponse,
  ReferralStatsV2,
  ValidateReferralCodeResponse,
  WithdrawalRequestV2,
} from "@/types/referral.types";

export const referralService = {
  // Public Flow: Validate Referral Code
  validateReferralCode: async (
    code: string
  ): Promise<ApiResponse<ValidateReferralCodeResponse>> => {
    const response = await apiClient.get<
      ApiResponse<ValidateReferralCodeResponse>
    >("/referral/code/validate", {
      params: { code },
    });
    return response.data;
  },

  // User Flow: Referral Dashboard (V2)

  /**
   * 1. Get Comprehensive Stats (V2)
   * Returns stats for both Referrer and Referred roles.
   */
  getReferralStatsV2: async (): Promise<ApiResponse<ReferralStatsV2>> => {
    const response = await apiClient.get<ApiResponse<ReferralStatsV2>>(
      "/dashboard/referrals/stats-v2"
    );
    return response.data;
  },

  /**
   * 2. Claim Referral Bonus (V2)
   * For the referred user to claim their signup bonus.
   */
  claimReferralBonusV2: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/dashboard/referrals/claim-v2",
      {}
    );
    return response.data;
  },

  /**
   * 3. Check Available Balance (V2)
   */
  getAvailableBalanceV2: async (
    userType: "referrer" | "referred"
  ): Promise<ApiResponse<AvailableBalanceV2>> => {
    const response = await apiClient.get<ApiResponse<AvailableBalanceV2>>(
      "/dashboard/referrals/available-balance-v2",
      { params: { type: userType } }
    );
    return response.data;
  },

  /**
   * 4. Request Withdrawal (V2)
   */
  requestWithdrawalV2: async (
    data: WithdrawalRequestV2
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/dashboard/referrals/withdraw-v2",
      data
    );
    return response.data;
  },

  /**
   * 5. List Referrals (History)
   */
  getReferrals: async (
    params?: GetReferralsParams
  ): Promise<ApiResponse<ReferralListResponse>> => {
    const response = await apiClient.get<ApiResponse<ReferralListResponse>>(
      "/dashboard/referrals/list-with-details",
      { params }
    );
    return response.data;
  },

  /**
   * 6. Referral Link Management
   */
  getReferralLink: async (): Promise<ApiResponse<ReferralLinkData>> => {
    const response = await apiClient.get<ApiResponse<ReferralLinkData>>(
      "/dashboard/referrals/link"
    );
    return response.data;
  },

  regenerateReferralCode: async (): Promise<ApiResponse<ReferralLinkData>> => {
    const response = await apiClient.post<ApiResponse<ReferralLinkData>>(
      "/dashboard/referrals/link/regenerate"
    );
    return response.data;
  },

  deactivateReferralLink: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(
      "/dashboard/referrals/link/deactivate"
    );
    return response.data;
  },

  // Helper: Get Referral Reward ID (May be used for legacy compatibility or program info)
  getReferralRewardId: async (): Promise<string | null> => {
    try {
      const response =
        await apiClient.get<ApiResponse<any>>("/dashboard/rewards");
      return response.data.data?.id || null;
    } catch (e) {
      console.warn("Failed to fetch referral reward ID", e);
      return null;
    }
  },
};
