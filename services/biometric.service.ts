import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  AuthenticationOptionsResponse,
  BiometricAuditLog,
  BiometricEnrollment,
  RegistrationOptionsResponse,
  VerificationResponse,
  WebAuthnAuthenticationResponse,
  WebAuthnRegistrationResponse,
} from "@/types/biometric.types";

export const biometricService = {
  // ===================================================================
  // REGISTRATION ENDPOINTS (OPTIONS → VERIFY flow)
  // ===================================================================

  /**
   * STEP 1: Get registration options
   * GET /biometric/register/options
   */
  getRegistrationOptions: async (): Promise<RegistrationOptionsResponse> => {
    const response = await apiClient.get<
      ApiResponse<RegistrationOptionsResponse>
    >("/biometric/register/options");
    if (!response.data.data) {
      throw new Error(
        response.data.message || "Failed to get registration options"
      );
    }
    return response.data.data;
  },

  /**
   * STEP 2: Verify registration response
   * POST /biometric/register/verify
   */
  verifyRegistration: async (
    attestationResponse: WebAuthnRegistrationResponse
  ): Promise<VerificationResponse> => {
    const response = await apiClient.post<ApiResponse<VerificationResponse>>(
      "/biometric/register/verify",
      {
        id: attestationResponse.id,
        rawId: attestationResponse.rawId,
        response: attestationResponse.response,
        type: attestationResponse.type,
        deviceName: attestationResponse.deviceName,
        platform: attestationResponse.platform,
        authenticatorAttachment: attestationResponse.authenticatorAttachment,
      }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to verify registration");
    }
    return response.data.data;
  },

  // ===================================================================
  // AUTHENTICATION ENDPOINTS (OPTIONS → VERIFY flow)
  // ===================================================================

  /**
   * STEP 1: Get authentication options
   * GET /biometric/auth/options
   */
  getAuthenticationOptions:
    async (): Promise<AuthenticationOptionsResponse> => {
      const response = await apiClient.get<
        ApiResponse<AuthenticationOptionsResponse>
      >("/biometric/auth/options");
      if (!response.data.data) {
        throw new Error(
          response.data.message || "Failed to get authentication options"
        );
      }
      return response.data.data;
    },

  /**
   * STEP 2: Verify authentication response
   * POST /biometric/auth/verify
   */
  verifyAuthentication: async (
    assertionResponse: WebAuthnAuthenticationResponse
  ): Promise<VerificationResponse> => {
    const response = await apiClient.post<ApiResponse<VerificationResponse>>(
      "/biometric/auth/verify",
      {
        id: assertionResponse.id,
        rawId: assertionResponse.rawId,
        response: assertionResponse.response,
        type: assertionResponse.type,
      }
    );
    if (!response.data.data) {
      throw new Error(
        response.data.message || "Failed to verify authentication"
      );
    }
    return response.data.data;
  },

  // ===================================================================
  // ENROLLMENT MANAGEMENT ENDPOINTS
  // ===================================================================

  /**
   * List user's biometric enrollments
   * GET /biometric/enrollments
   */
  listEnrollments: async (): Promise<BiometricEnrollment[]> => {
    const response = await apiClient.get<ApiResponse<any>>(
      "/biometric/enrollments"
    );
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.enrollments || [];
  },

  /**
   * Revoke an enrollment
   * DELETE /biometric/enrollments/:enrollmentId
   */
  revokeEnrollment: async (
    enrollmentId: string,
    reason?: string
  ): Promise<void> => {
    await apiClient.delete(`/biometric/enrollments/${enrollmentId}`, {
      data: { reason },
    });
  },

  // ===================================================================
  // AUDIT LOG ENDPOINTS
  // ===================================================================

  /**
   * Get user's audit logs
   * GET /biometric/audit-log
   */
  getAuditLog: async (
    limit = 50,
    offset = 0
  ): Promise<{ logs: BiometricAuditLog[]; count: number }> => {
    const response = await apiClient.get<
      ApiResponse<{ logs: BiometricAuditLog[]; count: number }>
    >("/biometric/audit-log", {
      params: { limit, offset },
    });
    if (!response.data.data) {
      return { logs: [], count: 0 };
    }
    return response.data.data;
  },

  // ===================================================================
  // PASSCODE VERIFICATION (for soft-lock/session revalidation)
  // ===================================================================

  /**
   * Verify 6-digit passcode
   * POST /biometric/verify-passcode
   *
   * Used for:
   * - Soft-lock unlock
   * - Session revalidation
   * - Transaction verification fallback
   *
   * IMPORTANT: Throws on failure so React Query onError callback is triggered
   */
  verifyPasscode: async (data: {
    passcode: string;
    intent?: "unlock" | "revalidate" | "transaction";
  }): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      "/biometric/verify-passcode",
      data
    );

    // Check if verification was successful
    if (!response.data.data?.success) {
      // CRITICAL: Throw error so onError callback fires, not onSuccess
      throw new Error(response.data.message || "Invalid passcode");
    }

    return {
      success: true,
      message: response.data.message,
    };
  },
};
