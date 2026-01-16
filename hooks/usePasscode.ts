"use client";

import { biometricService } from "@/services/biometric.service";
import { userService } from "@/services/user.service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "./useAuth";

/**
 * Hook to set or update user's passcode
 * Used for soft-lock and session revalidation
 */
export function useSetPasscode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      passcode: string;
      currentPasscode?: string;
    }) => {
      if (!data.passcode || data.passcode.length !== 6) {
        throw new Error("Passcode must be 6 digits");
      }

      if (!/^\d{6}$/.test(data.passcode)) {
        throw new Error("Passcode must contain only digits");
      }

      return userService.setPasscode({
        passcode: data.passcode,
        currentPasscode: data.currentPasscode,
      });
    },
    onSuccess: async (response, variables) => {
      console.log("[useSetPasscode] Success", {
        message: response.message,
      });

      // Invalidate both auth and user profile queries to update hasPasscode status
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
    onError: (error: any) => {
      console.error("[useSetPasscode] Error", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to set passcode";
      toast.error(message);
    },
  });
}

/**
 * Hook to verify user's passcode
 * Used for soft-lock unlock and session revalidation
 */
export function useVerifyPasscode() {
  return useMutation({
    mutationFn: async (data: {
      passcode: string;
      intent?: "unlock" | "revalidate" | "transaction";
    }) => {
      if (!data.passcode || data.passcode.length !== 6) {
        throw new Error("Passcode must be 6 digits");
      }

      if (!/^\d{6}$/.test(data.passcode)) {
        throw new Error("Passcode must contain only digits");
      }

      return biometricService.verifyPasscode({
        passcode: data.passcode,
        intent: data.intent,
      });
    },
    onError: (error: any) => {
      console.error("[useVerifyPasscode] Error", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Passcode verification failed";
      toast.error(message);
    },
  });
}
