/**
 * hooks/useBiometricTransaction.ts
 *
 * Handles biometric-verified transactions (purchases)
 *
 * Flow:
 * 1. GET /biometric/auth/options (get challenge)
 * 2. User performs local biometric (device-only)
 * 3. POST /biometric/auth/verify (verify with backend)
 * 4. Return verificationToken for transaction
 */

import { buildWebAuthnAssertion } from "@/lib/webauthn-mobile";
import { biometricService } from "@/services/biometric.service";
import { verificationService } from "@/services/verification.service";
import { useMutation } from "@tanstack/react-query";
import { useBiometricAuth } from "./useBiometric";

export interface BiometricTransactionResult {
  verificationToken: string; // JWT token to pass to topup/purchase
  success: boolean;
}

/**
 * Hook for transaction biometric verification
 *
 * Flow:
 * 1. GET /biometric/auth/options (get challenge)
 * 2. User performs local biometric
 * 3. POST /biometric/auth/verify (verify with backend)
 * 4. Return verificationToken for transaction
 */
export function useBiometricTransaction() {
  const { authenticate, checkBiometricSupport } = useBiometricAuth();

  const verifyMutation = useMutation({
    mutationFn: async (): Promise<BiometricTransactionResult> => {
      try {
        console.log("[BioTx] Starting transaction biometric verification");

        // Check device support
        const { hasHardware, isEnrolled } = await checkBiometricSupport();
        if (!hasHardware || !isEnrolled) {
          throw new Error("Biometric not available on this device");
        }

        // Step 1: Get authentication challenge from backend
        console.log("[BioTx] Fetching auth options");
        const authOptions = await biometricService.getAuthenticationOptions();
        console.log(
          "[BioTx] Got challenge:",
          authOptions.challenge.substring(0, 20) + "..."
        );

        // Step 2: Perform local biometric (device-only - NO backend call yet)
        console.log("[BioTx] Prompting for biometric");
        const biometricSuccess = await authenticate();

        if (!biometricSuccess) {
          console.warn("[BioTx] User cancelled biometric");
          throw new Error("Biometric verification was cancelled or failed");
        }

        console.log("[BioTx] Biometric success");

        // Step 3: Build WebAuthn assertion response
        console.log("[BioTx] Building assertion");
        const assertion = await buildWebAuthnAssertion(authOptions.challenge);
        console.log("[BioTx] Assertion built");

        // Step 4: Send to backend for verification
        console.log("[BioTx] Verifying with backend");
        const verificationResult =
          await verificationService.verifyBiometricForTransaction({
            ...assertion,
            type: "public-key" as const,
            intent: "transaction",
          });

        if (!verificationResult.success) {
          console.error(
            "[BioTx] Backend verification failed:",
            verificationResult.message
          );
          throw new Error(
            verificationResult.message || "Backend verification failed"
          );
        }

        if (!verificationResult.verificationToken) {
          console.error("[BioTx] No verification token returned");
          throw new Error("No verification token returned from backend");
        }

        console.log("[BioTx] Verification successful, token received");

        return {
          verificationToken: verificationResult.verificationToken,
          success: true,
        };
      } catch (error: any) {
        console.error("[BioTx] Error:", error.message);
        throw error;
      }
    },
  });

  return {
    authenticate: verifyMutation.mutateAsync,
    isLoading: verifyMutation.isPending,
    error: verifyMutation.error,
    reset: verifyMutation.reset,
  };
}
