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


        // Check device support
        const { hasHardware, isEnrolled } = await checkBiometricSupport();
        if (!hasHardware || !isEnrolled) {
          throw new Error("Biometric not available on this device");
        }

        // Step 1: Get authentication challenge from backend

        const authOptions = await biometricService.getAuthenticationOptions();



        // Step 2: Perform local biometric (device-only - NO backend call yet)

        const biometricSuccess = await authenticate();

        if (!biometricSuccess) {

          throw new Error("Biometric verification was cancelled or failed");
        }



        // Step 3: Build WebAuthn assertion response

        const assertion = await buildWebAuthnAssertion(authOptions.challenge);


        // Step 4: Send to backend for verification

        const verificationResult =
          await verificationService.verifyBiometricForTransaction({
            ...assertion,
            type: "public-key" as const,
            intent: "transaction",
          });

        if (!verificationResult.success) {


          throw new Error(
            verificationResult.message || "Backend verification failed"
          );
        }

        if (!verificationResult.verificationToken) {

          throw new Error("No verification token returned from backend");
        }



        return {
          verificationToken: verificationResult.verificationToken,
          success: true,
        };
      } catch (error: any) {

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
