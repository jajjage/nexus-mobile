import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  CreateVirtualAccountRequest,
  CreateVirtualAccountResponse,
  GetPurchasesParams,
  GetSupplierMarkupParams,
  PaginatedSupplierMarkupResponse,
  ProfileResponse,
  PurchaseResponse,
  PurchasesListResponse,
  SetPinRequest,
  TopupRequest,
  TopupResponse,
  UpdatePasswordRequest,
  UpdateProfileRequest,
} from "@/types/user.types";

export const userService = {
  // ============= Profile Methods =============

  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>("/user/profile/me");
    return response.data;
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (
    data: UpdateProfileRequest
  ): Promise<ProfileResponse> => {
    const response = await apiClient.put<ProfileResponse>(
      "/user/profile/me",
      data
    );
    return response.data;
  },

  /**
   * Update user password
   */
  updatePassword: async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/update-password",
      data
    );
    return response.data;
  },

  /**
   * Set or update transaction PIN
   */
  setPin: async (data: SetPinRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(
      "/user/profile/pin",
      data
    );
    return response.data;
  },

  /**
   * Set or update soft-lock passcode (6 digits)
   * Used for session revalidation and app lock
   */
  setPasscode: async (data: {
    passcode: string;
    currentPasscode?: string; // Required if updating existing passcode
  }): Promise<ApiResponse> => {
    // Map currentPasscode to currentPassword for backend
    const payload: any = {
      passcode: data.passcode,
    };
    if (data.currentPasscode) {
      payload.currentPassword = data.currentPasscode;
    }
    const response = await apiClient.post<ApiResponse>(
      "/user/profile/passcode",
      payload
    );
    return response.data;
  },

  // ============= Purchase Methods =============

  /**
   * Get user's purchase history with filters
   */
  getPurchases: async (
    params?: GetPurchasesParams
  ): Promise<PurchasesListResponse> => {
    const response = await apiClient.get<PurchasesListResponse>(
      "/user/purchases",
      { params }
    );
    return response.data;
  },

  /**
   * Get supplier markup percentages
   */
  getMarkupPercent: async (
    params?: GetSupplierMarkupParams
  ): Promise<PaginatedSupplierMarkupResponse> => {
    const response = await apiClient.get<any>("/user/supplier-markups", {
      params,
    });
    // Backend wraps response in { success, message, data: { markups, pagination }, statusCode }
    // Extract the actual data from the wrapper
    const data = response.data?.data || response.data;
    return data;
  },

  /**
   * Get single purchase by ID
   */
  getPurchaseById: async (id: string): Promise<PurchaseResponse> => {
    const response = await apiClient.get<PurchaseResponse>(
      `/user/purchases/${id}`
    );
    return response.data;
  },

  // ============= Topup Methods =============

  /**
   * Create a new topup/purchase request
   */
  createTopup: async (data: TopupRequest): Promise<TopupResponse> => {
    const response = await apiClient.post<TopupResponse>("/user/topup", data);
    return response.data;
  },

  // ============= Virtual Account Methods =============

  /**
   * Create virtual account for user
   * BVN must be 11 digits and start with "22"
   */
  createVirtualAccount: async (
    data: CreateVirtualAccountRequest
  ): Promise<CreateVirtualAccountResponse> => {
    const response = await apiClient.post<CreateVirtualAccountResponse>(
      "/user/virtual-account",
      data
    );
    return response.data;
  },
};
