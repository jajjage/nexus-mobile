import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import { TopupRequest } from "@/types/topup.types";
import { topupService } from "./topup.service";

/**
 * Verification Service
 *
 * Uses EXISTING backend endpoints ONLY:
 * - POST /biometric/auth/verify (with intent: 'unlock' | 'transaction')
 * - POST /user/topup (with pin OR verificationToken)
 *
 * No new endpoints needed
 */

// ============================================================
// TYPES
// ============================================================

export interface BiometricVerificationRequest {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  };
  type: "public-key";
  intent: "unlock" | "transaction";
}

export interface BiometricVerificationResponse {
  success: boolean;
  verificationToken?: string;
  message?: string;
}

export interface TopupResponse {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    status: string;
  };
  message?: string;
}

// ============================================================
// SERVICE
// ============================================================

export const verificationService = {
  /**
   * Verify biometric for soft-lock unlock
   *
   * Uses intent: 'unlock'
   * Backend returns: { success: true/false }
   * No verification token for unlock flow
   */
  verifyBiometricForUnlock: async (
    request: BiometricVerificationRequest
  ): Promise<BiometricVerificationResponse> => {
    try {
      console.log("[Verification] Verifying biometric for unlock");

      const response = await apiClient.post<
        ApiResponse<BiometricVerificationResponse>
      >("/biometric/auth/verify", {
        ...request,
        intent: "unlock",
      });

      const result = response.data.data || {
        success: false,
        message: "Verification failed",
      };

      console.log("[Verification] Biometric unlock response", {
        success: result.success,
      });

      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Biometric verification failed";
      console.error("[Verification] Biometric unlock error", { message });

      return {
        success: false,
        message,
      };
    }
  },

  /**
   * Verify biometric for transaction
   *
   * Uses intent: 'transaction'
   * Backend returns: { success: true/false, verificationToken: "JWT" }
   * Token is then used in /user/topup call
   */
  verifyBiometricForTransaction: async (
    request: BiometricVerificationRequest
  ): Promise<BiometricVerificationResponse> => {
    try {
      console.log("[Verification] Verifying biometric for transaction");

      const response = await apiClient.post<
        ApiResponse<BiometricVerificationResponse>
      >("/biometric/auth/verify", {
        ...request,
        intent: "transaction",
      });

      const result = response.data.data || {
        success: false,
        message: "Verification failed",
      };

      console.log("[Verification] Biometric transaction response", {
        success: result.success,
        hasToken: !!result.verificationToken,
      });

      return result;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Biometric verification failed";
      console.error("[Verification] Biometric transaction error", { message });
      console.error("[ERROR FROM SERVER]: ", err);

      return {
        success: false,
        message,
      };
    }
  },

  /**
   * Submit topup with either PIN or verification token
   *
   * PIN Flow: { pin: "1234", amount, ... }
   *   - Backend validates PIN against users.pin (hashed)
   *
   * Biometric Flow: { verificationToken: "JWT", amount, ... }
   *   - Backend validates verification token JWT
   *
   * IMPORTANT: This endpoint returns business logic errors (400, 422)
   * that should NOT trigger session cleanup. Only auth errors (401, 403)
   * trigger session expiration. The api-client.ts interceptor handles this.
   */
  submitTopup: async (request: TopupRequest): Promise<TopupResponse> => {
    try {
      console.log("[Verification] Submitting topup", {
        amount: request.amount,
        productCode: request.productCode,
        usePin: !!request.pin,
        useBiometric: !!request.verificationToken,
      });

      const response = await topupService.initiateTopup(request);

      const result: TopupResponse = {
        success: response.success,
        message: response.message,
        transaction: response.data
          ? {
              id: response.data.transactionId,
              amount: response.data.amount,
              status: response.data.status,
            }
          : undefined,
      };

      console.log("[Verification] Topup response", {
        success: result.success,
        transactionId: result.transaction?.id,
      });

      return result;
    } catch (err: any) {
      // Detailed error handling for different failure modes
      const status = err.response?.status;
      const errorData = err.response?.data;
      const message = err.response?.data?.message || "Topup failed";

      console.error("[Verification] Topup error", {
        status,
        message,
        errorData,
        url: err.config?.url,
      });

      // If this is a session/auth error (401, 403), the api-client interceptor
      // has already handled clearing the session. Don't repeat that here.
      // Just return the error message for the UI.

      return {
        success: false,
        message,
      };
    }
  },
};
