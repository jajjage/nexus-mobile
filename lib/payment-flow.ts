/**
 * Payment Flow Orchestrator
 * Handles the complete payment waterfall: Biometric → PIN → Transaction
 * Per PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md Section 3-5
 */

import apiClient from "@/lib/api-client";
import { TopupRequest } from "@/types/topup.types";
import * as LocalAuthentication from "expo-local-authentication";
import { btoa } from "react-native-quick-base64";

export interface PaymentFlowState {
  step: "biometric" | "pin" | "processing" | "complete";
  verificationToken?: string;
  pin?: string;
  error?: string;
}

export interface BiometricChallengeResponse {
  challenge: string;
  rpId: string;
  allowCredentials?: any[];
}

/**
 * Get biometric challenge from backend
 * This is CRITICAL for security - must happen before local biometric prompt
 */
export async function getBiometricChallenge(): Promise<BiometricChallengeResponse> {
  try {
    console.log(
      "[PaymentFlow] Requesting biometric challenge from /biometric/auth/options"
    );

    const response = await apiClient.get("/biometric/auth/options");

    if (!response.data?.data?.challenge) {
      throw new Error("Server did not return a biometric challenge");
    }

    const { challenge, rpId, allowCredentials } = response.data.data;

    console.log("[PaymentFlow] Challenge received:", {
      challenge: challenge.substring(0, 20) + "...",
      rpId,
    });

    return { challenge, rpId, allowCredentials };
  } catch (error) {
    console.error("[PaymentFlow] Failed to get biometric challenge:", error);
    throw error;
  }
}

/**
 * Verify biometric locally and get verification token from backend
 * Step 1: Get challenge
 * Step 2: Local biometric authentication
 * Step 3: Send assertion to backend
 * Step 4: Get verification token
 */
export async function verifyBiometricAndGetToken(): Promise<string> {
  try {
    // Step 1: Get biometric challenge from backend
    const { challenge, rpId } = await getBiometricChallenge();

    // Step 2: Check hardware support
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      console.log("[PaymentFlow] Biometric hardware not available");
      throw new Error("Biometric not supported on this device");
    }

    // Step 3: Check if enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      console.log("[PaymentFlow] User has not enrolled biometric");
      throw new Error("Please set up biometric authentication first");
    }

    // Step 4: Prompt for biometric
    console.log("[PaymentFlow] Prompting for biometric authentication");
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to complete payment",
      fallbackLabel: "Use PIN Instead",
      disableDeviceFallback: false,
    });

    if (!result.success) {
      console.log("[PaymentFlow] Biometric authentication failed:", result.error);
      throw new Error("Biometric authentication failed. Use PIN instead.");
    }

    // Step 5: Build assertion response (simplified)
    // In production, this would cryptographically sign the challenge
    // For now, we'll build a proper WebAuthn assertion response
    const clientDataJSON = JSON.stringify({
      type: "webauthn.get",
      challenge: challenge,
      origin: "https://api.nexus-data.com",
    });

    const assertionResponse = {
      id: "credential-id", // Would come from stored credential
      rawId: "Y3JlZGVudGlhbC1pZA==", // Base64URL of credential ID
      response: {
        clientDataJSON: btoa(clientDataJSON),
        authenticatorData: "authenticator-data",
        signature: "signature-of-challenge", // Would be real ECDSA signature
      },
      type: "public-key",
    };

    console.log("[PaymentFlow] Sending biometric assertion to backend");

    // Step 6: Verify with backend
    const verifyResponse = await apiClient.post(
      "/biometric/auth/verify",
      assertionResponse
    );

    if (!verifyResponse.data?.data?.verificationToken) {
      throw new Error("Backend did not return verification token");
    }

    const verificationToken = verifyResponse.data.data.verificationToken;
    console.log(
      "[PaymentFlow] Verification successful, token:",
      verificationToken.substring(0, 20) + "..."
    );

    return verificationToken;
  } catch (error) {
    console.error("[PaymentFlow] Biometric verification failed:", error);
    throw error;
  }
}

/**
 * Verify PIN with backend (if needed)
 * For now, PINs are sent directly with transaction
 * Backend validates them
 */
export async function verifyPINWithBackend(pin: string): Promise<boolean> {
  try {
    console.log("[PaymentFlow] Verifying PIN with backend");

    const response = await apiClient.post("/user/verify-pin", { pin });

    if (!response.data?.data?.verified) {
      return false;
    }

    console.log("[PaymentFlow] PIN verified successfully");
    return true;
  } catch (error) {
    console.error("[PaymentFlow] PIN verification failed:", error);
    return false;
  }
}

/**
 * Build topup request with correct verification method
 * Either biometric token OR PIN, never both
 */
export function buildTopupRequest(
  baseRequest: Omit<TopupRequest, "pin" | "verificationToken">,
  verification: { pin?: string; verificationToken?: string }
): TopupRequest {
  // Ensure only one verification method is used
  if (verification.verificationToken && verification.pin) {
    console.warn("[PaymentFlow] Both token and PIN provided, using token");
  }

  const request: TopupRequest = {
    ...baseRequest,
  };

  if (verification.verificationToken) {
    request.verificationToken = verification.verificationToken;
  } else if (verification.pin) {
    request.pin = verification.pin;
  } else {
    throw new Error("No verification method provided (PIN or biometric token)");
  }

  return request;
}

/**
 * Determine which payment method to use
 * Returns: "biometric" | "pin" | null
 */
export async function determinePaymentMethod(
  userHasBiometric: boolean
): Promise<"biometric" | "pin" | null> {
  try {
    // If user has biometric enrolled, try biometric first
    if (userHasBiometric) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        return "biometric";
      }

      console.log("[PaymentFlow] Biometric unavailable, falling back to PIN");
    }

    // Otherwise use PIN
    return "pin";
  } catch (error) {
    console.error("[PaymentFlow] Error determining payment method:", error);
    return "pin"; // Safe fallback
  }
}
