import { biometricService } from "@/services/biometric.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner-native";

// Query Keys
export const biometricKeys = {
  all: ["biometric"] as const,
  enrollments: () => [...biometricKeys.all, "enrollments"] as const,
  auditLogs: () => [...biometricKeys.all, "audit-logs"] as const,
};

/**
 * Fetch user's biometric enrollments
 */
export function useBiometricEnrollments() {
  return useQuery({
    queryKey: biometricKeys.enrollments(),
    queryFn: () => biometricService.listEnrollments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Delete/revoke a biometric enrollment
 */
export function useDeleteBiometricEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      reason,
    }: {
      enrollmentId: string;
      reason?: string;
    }) => biometricService.revokeEnrollment(enrollmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: biometricKeys.enrollments() });
      queryClient.invalidateQueries({ queryKey: biometricKeys.auditLogs() });
      toast.success("Device removed successfully");
    },
    onError: (error: AxiosError<any>) => {
      const message =
        error.response?.data?.message || "Failed to remove device";
      toast.error(message);
    },
  });
}

/**
 * Fetch biometric audit logs
 */
export function useBiometricAuditLogs(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...biometricKeys.auditLogs(), limit, offset] as const,
    queryFn: () => biometricService.getAuditLog(limit, offset),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
  });
}

/**
 * Register a new biometric device (WebAuthn)
 */
export function useBiometricRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attestationResponse: any) => {
      const options = await biometricService.getRegistrationOptions();
      return biometricService.verifyRegistration(
        attestationResponse,
        options.challenge
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: biometricKeys.enrollments() });
      queryClient.invalidateQueries({ queryKey: biometricKeys.auditLogs() });
      toast.success("Device registered successfully");
    },
    onError: (error: AxiosError<any>) => {
      const message =
        error.response?.data?.message ||
        "Failed to register biometric device";
      toast.error(message);
    },
  });
}
