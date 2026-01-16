import apiClient from "@/lib/api-client";
import { tokenStorage } from "@/lib/secure-store";
import { ApiResponse, User } from "@/types/api.types";
import {
  ForgotPasswordRequest,
  LoginRequest,
  MobileAuthResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth.types";

export const authService = {
  // Login user - returns tokens + basic user info
  login: async (data: LoginRequest): Promise<MobileAuthResponse> => {
    const response = await apiClient.post<MobileAuthResponse>(
      "/mobile/auth/login",
      data
    );
    
    // Save tokens to secure store
    await tokenStorage.setAccessToken(response.data.accessToken);
    await tokenStorage.setRefreshToken(response.data.refreshToken);
    
    return response.data;
  },

  // Register new user
  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<MobileAuthResponse>> => {
    const response = await apiClient.post<ApiResponse<MobileAuthResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // Ignore logout errors
    }
    await tokenStorage.clearTokens();
  },

  // Get current user profile - this determines if user is authenticated
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/user/profile/me");
    return response.data.data!;
  },

  // Refresh access token
  // refreshToken: async (): Promise<MobileAuthResponse> => {
  //   const refreshToken = await tokenStorage.getRefreshToken();
  //   if (!refreshToken) {
  //     throw new Error("No refresh token");
  //   }
    
  //   const response = await apiClient.post<MobileAuthResponse>(
  //     "/mobile/auth/refresh",
  //     { refreshToken }
  //   );
    
  //   // Save new tokens
  //   await tokenStorage.setAccessToken(response.data.accessToken);
  //   await tokenStorage.setRefreshToken(response.data.refreshToken);
    
  //   return response.data;
  // },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/forgot-password",
      data
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/reset-password",
      data
    );
    return response.data;
  },

  // Update password
  updatePassword: async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      "/password/update-password",
      data
    );
    return response.data;
  },
};
