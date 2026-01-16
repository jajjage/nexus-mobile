import { referralService } from "@/services/referral.service";
import {
  GetReferralsParams,
  WithdrawalRequestV2,
} from "@/types/referral.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// ============= FEATURE FLAG =============
// Referrals feature is temporarily disabled (Coming Soon)
// Set to true to enable all referral API calls
const REFERRALS_ENABLED = false;

// ============= Query Keys =============
export const referralKeys = {
  all: ["referrals"] as const,
  stats: () => [...referralKeys.all, "stats"] as const,
  statsV2: () => [...referralKeys.all, "stats-v2"] as const,
  link: () => [...referralKeys.all, "link"] as const,
  list: (params?: GetReferralsParams) =>
    [...referralKeys.all, "list", params] as const,
  withdrawals: {
    all: () => [...referralKeys.all, "withdrawals"] as const,
    balanceV2: (type: "referrer" | "referred") =>
      [...referralKeys.withdrawals.all(), "balance-v2", type] as const,
  },
  rewardId: () => [...referralKeys.all, "rewardId"] as const,
};

// ============= Referral Queries (V2) =============

/**
 * Get comprehensive referral stats (V2)
 * NOTE: Disabled while referrals feature is Coming Soon
 */
export const useReferralStatsV2 = () => {
  return useQuery({
    queryKey: referralKeys.statsV2(),
    queryFn: async () => {
      const response = await referralService.getReferralStatsV2();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: REFERRALS_ENABLED, // Disabled - feature Coming Soon
  });
};

/**
 * Get available balance for withdrawal (V2)
 * NOTE: Disabled while referrals feature is Coming Soon
 */
export const useAvailableBalanceV2 = (userType: "referrer" | "referred") => {
  return useQuery({
    queryKey: referralKeys.withdrawals.balanceV2(userType),
    queryFn: async () => {
      const response = await referralService.getAvailableBalanceV2(userType);
      return response.data;
    },
    enabled: REFERRALS_ENABLED, // Disabled - feature Coming Soon
  });
};

// ============= Existing Queries (Adapted) =============

/**
 * Get user's referral link data
 * NOTE: Disabled while referrals feature is Coming Soon
 */
export const useReferralLink = () => {
  return useQuery({
    queryKey: referralKeys.link(),
    queryFn: async () => {
      const response = await referralService.getReferralLink();
      return response.data;
    },
    staleTime: Infinity,
    enabled: REFERRALS_ENABLED, // Disabled - feature Coming Soon
  });
};

/**
 * Get list of referrals
 * NOTE: Disabled while referrals feature is Coming Soon
 */
export const useReferralsList = (params?: GetReferralsParams) => {
  return useQuery({
    queryKey: referralKeys.list(params),
    queryFn: async () => {
      const response = await referralService.getReferrals(params);
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
    enabled: REFERRALS_ENABLED, // Disabled - feature Coming Soon
  });
};

/**
 * Get Referral Reward ID (Legacy/Helper)
 * NOTE: Disabled while referrals feature is Coming Soon
 */
export const useReferralRewardId = () => {
  return useQuery({
    queryKey: referralKeys.rewardId(),
    queryFn: async () => {
      return await referralService.getReferralRewardId();
    },
    staleTime: Infinity,
    enabled: REFERRALS_ENABLED, // Disabled - feature Coming Soon
  });
};

// ============= Referral Mutations (V2) =============
// NOTE: Mutations are kept but will show "Feature coming soon" toast if called

/**
 * Claim referral bonus (V2)
 */
export const useClaimReferralBonusV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!REFERRALS_ENABLED) {
        return Promise.reject(new Error("Feature coming soon"));
      }
      return referralService.claimReferralBonusV2();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: referralKeys.statsV2() });
      queryClient.invalidateQueries({
        queryKey: referralKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(data.message || "Referral bonus claimed successfully!");
    },
    onError: (error: AxiosError<any>) => {
      if (!REFERRALS_ENABLED) {
        toast.info("Referrals feature coming soon!");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to claim referral bonus"
      );
    },
  });
};

/**
 * Request withdrawal (V2)
 */
export const useRequestWithdrawalV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawalRequestV2) => {
      if (!REFERRALS_ENABLED) {
        return Promise.reject(new Error("Feature coming soon"));
      }
      return referralService.requestWithdrawalV2(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: referralKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({ queryKey: referralKeys.statsV2() });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(variables.amount);

      toast.success(`Successfully withdrawn ${formattedAmount}`);
    },
    onError: (error: AxiosError<any>) => {
      if (!REFERRALS_ENABLED) {
        toast.info("Referrals feature coming soon!");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to submit withdrawal request"
      );
    },
  });
};

// ============= Referral Link Mutations =============

/**
 * Regenerate referral code
 */
export const useRegenerateReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!REFERRALS_ENABLED) {
        return Promise.reject(new Error("Feature coming soon"));
      }
      return referralService.regenerateReferralCode();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(referralKeys.link(), data.data);
      toast.success("Referral code regenerated successfully");
    },
    onError: (error: AxiosError<any>) => {
      if (!REFERRALS_ENABLED) {
        toast.info("Referrals feature coming soon!");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to regenerate referral code"
      );
    },
  });
};

/**
 * Deactivate referral link
 */
export const useDeactivateReferralLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!REFERRALS_ENABLED) {
        return Promise.reject(new Error("Feature coming soon"));
      }
      return referralService.deactivateReferralLink();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.link() });
      toast.success("Referral link deactivated");
    },
    onError: (error: AxiosError<any>) => {
      if (!REFERRALS_ENABLED) {
        toast.info("Referrals feature coming soon!");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to deactivate referral link"
      );
    },
  });
};

/**
 * Validate referral code (Public)
 * NOTE: This one stays enabled for registration flow
 */
export const useValidateReferralCode = () => {
  return useMutation({
    mutationFn: (code: string) => referralService.validateReferralCode(code),
  });
};
