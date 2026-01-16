"use client";

import { topupService } from "@/services/topup.service";
import { User } from "@/types/api.types";
import { TopupRequest, TopupResponse } from "@/types/topup.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Query keys matching useAuth
const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// Context type for optimistic updates
interface TopupMutationContext {
  previousUser: User | undefined;
}

/**
 * useTopup - Topup mutation with optimistic balance updates
 *
 * Optimistic UI Strategy:
 * 1. Immediately deduct balance from local state (feels instant)
 * 2. On error: Rollback to previous balance
 * 3. On success/settled: Refresh user data to sync with server
 */
export function useTopup() {
  const queryClient = useQueryClient();

  return useMutation<
    TopupResponse,
    AxiosError<any>,
    TopupRequest,
    TopupMutationContext
  >({
    mutationFn: (data) => {
      console.log("[useTopup] mutationFn called with data:", {
        ...data,
        pin: data.pin ? "****" : undefined,
      });
      return topupService.initiateTopup(data);
    },

    // Optimistic update: Immediately reduce balance before API responds
    onMutate: async (data) => {
      console.log("[useTopup] Optimistic update - deducting balance");

      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: authKeys.currentUser() });

      // Snapshot the previous user data for rollback
      const previousUser = queryClient.getQueryData<User>(
        authKeys.currentUser()
      );

      // Optimistically update the balance
      queryClient.setQueryData(authKeys.currentUser(), (old: any) => {
        if (!old) return old;
        const currentBalance = parseFloat(old.balance || "0");
        const newBalance = Math.max(0, currentBalance - data.amount);
        return {
          ...old,
          balance: newBalance.toFixed(2),
        };
      });

      // Return context with previous value for rollback
      return { previousUser };
    },

    onSuccess: (response) => {
      console.log("[useTopup] Transaction Successful", response);
      // Fire-and-forget: Treat both "success" and "pending" as success
      toast.success("Order Placed! 🎉", {
        description: response.message || "Your topup is being processed.",
      });
    },

    onError: (error, _data, context) => {
      console.error("[useTopup] Transaction Failed - rolling back", error);

      // Rollback to previous balance on error
      if (context?.previousUser) {
        queryClient.setQueryData(authKeys.currentUser(), context.previousUser);
        console.log("[useTopup] Balance rolled back");
      }

      // Extract error message from various possible response structures
      const responseData = error.response?.data;
      const errorMessage =
        responseData?.message || // Standard API response
        responseData?.msg || // Provider format 1
        responseData?.data?.msg || // Nested provider format
        responseData?.data?.message || // Nested API format
        responseData?.error || // Error field
        error.message || // Axios error message
        "Topup failed. Please try again.";

      console.log("[useTopup] Extracted error message:", errorMessage);

      toast.error("Transaction Failed", {
        description: errorMessage,
      });
    },

    // Always refetch user data after mutation to sync with server
    onSettled: () => {
      console.log("[useTopup] Settled - invalidating user query");
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}
