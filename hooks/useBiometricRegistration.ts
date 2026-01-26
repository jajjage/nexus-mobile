/**
 * hooks/useBiometricRegistration.ts
 * 
 * Handles WebAuthn enrollment during setup wizard.
 * Flow: Get options → Local biometric → Verify with backend → Save enrollment
 */

import {
    buildWebAuthnAttestationResponse,
    storeCredentialId,
} from "@/lib/webauthn-mobile";
import { biometricService } from "@/services/biometric.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { useBiometricAuth } from "./useBiometric";

export interface BiometricRegistrationResult {
  success: boolean;
  message: string;
  enrolled: boolean;
}

/**
 * Hook for biometric enrollment during setup
 *
 * Flow:
 * 1. GET /biometric/register/options (get enrollment challenge)
 * 2. User performs local biometric (device-only, no backend)
 * 3. POST /biometric/register/verify (verify enrollment with backend)
 * 4. Save enrollment status locally
 */
export function useBiometricRegistration() {
  const { authenticate, checkBiometricSupport } = useBiometricAuth();

  const registerMutation = useMutation({
    mutationFn: async (): Promise<BiometricRegistrationResult> => {
      try {
        console.log("[BiometricReg] Starting enrollment");

        // Step 1: Check device support
        const { hasHardware, isEnrolled } = await checkBiometricSupport();

        if (!hasHardware) {
          console.warn("[BiometricReg] Device has no biometric hardware");
          return {
            success: false,
            message: "Biometric hardware not available",
            enrolled: false,
          };
        }

        if (!isEnrolled) {
          console.warn("[BiometricReg] User has not enrolled biometric");
          return {
            success: false,
            message: "No biometric enrolled on device",
            enrolled: false,
          };
        }

        // Step 2: Get registration options from backend
        console.log("[BiometricReg] Fetching registration options");
        const options = await biometricService.getRegistrationOptions();
        console.log("[BiometricReg] Got challenge:", options.challenge.substring(0, 20) + "...");

        // Step 3: Perform local biometric (device-only - NO backend call)
        console.log("[BiometricReg] Prompting for biometric");
        const biometricSuccess = await authenticate();

        if (!biometricSuccess) {
          console.warn("[BiometricReg] User cancelled biometric");
          return {
            success: false,
            message: "Biometric verification was cancelled",
            enrolled: false,
          };
        }

        console.log("[BiometricReg] Biometric verification successful");

        // Step 4: Build WebAuthn registration response
        // Step 4: Build WebAuthn registration response
        // Use RP ID from options (e.g. nexusdatasub.com), NOT the full origin URL
        console.log("[BiometricReg] Building attestation response");
        const rpId = options.rp?.id || "nexusdatasub.com";
        
        const attestationResponse = await buildWebAuthnAttestationResponse(
          options.challenge,
          '',  // Let the function generate a proper credential ID
          rpId  // Pass domain only, webauthn-mobile.ts will prepend https://
        );

        console.log("[BiometricReg] Attestation response structure:", {
          id: attestationResponse.id,
          rawId: attestationResponse.rawId?.substring(0, 20) + "...",
          type: attestationResponse.type,
          deviceName: attestationResponse.deviceName,
          platform: attestationResponse.platform,
          authenticatorAttachment: attestationResponse.authenticatorAttachment,
          responseKeys: Object.keys(attestationResponse.response),
        });

        // Step 5: Verify enrollment with backend
        console.log("[BiometricReg] Sending verification to backend");
        const verificationResult = await biometricService.verifyRegistration(
          attestationResponse,
          options.challenge  // Pass the challenge for backend verification
        );

        console.log("[BiometricReg] Verification result:", {
          enrollmentId: verificationResult.enrollmentId,
          credentialId: verificationResult.credentialId,
          hasJwt: !!verificationResult.jwt,
        });

        // Check if enrollment was successful (should have enrollmentId or credentialId)
        if (!verificationResult.enrollmentId && !verificationResult.credentialId) {
          console.error(
            "[BiometricReg] Backend verification failed - no enrollment ID or credential ID"
          );
          return {
            success: false,
            message: "Backend verification failed",
            enrolled: false,
          };
        }

        // Step 6: Save enrollment status locally
        console.log("[BiometricReg] Saving enrollment status");
        await AsyncStorage.setItem("biometric_enrolled", "true");
        await AsyncStorage.setItem("biometric_enrollment_timestamp", Date.now().toString());

        // Store credential ID if provided by backend
        if (verificationResult.credentialId) {
          await storeCredentialId(verificationResult.credentialId);
        }

        console.log("[BiometricReg] Enrollment successful!");

        return {
          success: true,
          message: "Biometric enrollment successful",
          enrolled: true,
        };
      } catch (error: any) {
        const errorMessage = error.message || "Unknown enrollment error";
        console.error("[BiometricReg] Enrollment error:", errorMessage);

        return {
          success: false,
          message: errorMessage,
          enrolled: false,
        };
      }
    },
  });

  return {
    registerBiometric: registerMutation.mutateAsync,
    isLoading: registerMutation.isPending,
    isSuccess: registerMutation.isSuccess,
    error: registerMutation.error,
    reset: registerMutation.reset,
  };
}

/**
 * Check if user has already enrolled biometric
 */
export async function checkBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await AsyncStorage.getItem("biometric_enrolled");
    return enrolled === "true";
  } catch (error) {
    console.error("[BiometricReg] Error checking enrollment:", error);
    return false;
  }
}

/**
 * Clear biometric enrollment (for re-enrollment or logout)
 */
export async function clearBiometricEnrollment(): Promise<void> {
  try {
    await AsyncStorage.removeItem("biometric_enrolled");
    await AsyncStorage.removeItem("biometric_enrollment_timestamp");
    console.log("[BiometricReg] Enrollment cleared");
  } catch (error) {
    console.error("[BiometricReg] Error clearing enrollment:", error);
    throw error;
  }
}
