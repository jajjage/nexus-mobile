import { useAuthContext } from "@/context/AuthContext";
import { tokenStorage } from "@/lib/secure-store";
import { authService } from "@/services/auth.service";
import { User } from "@/types/api.types";
import { LoginRequest, RegisterRequest } from "@/types/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import * as Device from "expo-device";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

// Query keys for React Query cache
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// ============================================================================
// MAIN AUTH HOOK - uses React Query to fetch user profile
// ============================================================================

export function useAuth() {
  const { user, setUser, isLoading, setIsLoading } = useAuthContext();
  const queryClient = useQueryClient();
  
  // Check if we have a token stored (enables the query)
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    tokenStorage.getAccessToken().then((token) => {
      setHasToken(!!token);
      if (!token) {
        setIsLoading(false);
      }
    });
  }, []);

  // Fetch user profile - this determines if user is authenticated
  const query = useQuery<User, AxiosError>({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const profile = await authService.getProfile();
      return profile;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry on 401 - let api-client handle refresh
    enabled: hasToken === true, // Only fetch if we have a token
  });

  // Sync query result to context
  useEffect(() => {
    if (query.isSuccess && query.data) {
      setUser(query.data);
      setIsLoading(false);
    }
  }, [query.isSuccess, query.data]);

  // Handle auth errors
  useEffect(() => {
    if (query.isError) {
      const status = query.error?.response?.status;
      if (status === 401 || status === 403) {
        // Token invalid or expired and refresh failed
        tokenStorage.clearTokens();
        setUser(null);
        setHasToken(false);
      }
      setIsLoading(false);
    }
  }, [query.isError, query.error]);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading: hasToken === null || isLoading || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    // Permission helpers
    checkPermission: (permission: string) => user?.permissions?.includes(permission) ?? false,
    checkRole: (role: string) => user?.role === role,
  };
}

// ============================================================================
// LOGIN HOOK
// ============================================================================

export function useLogin() {
  const { setUser } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email?: string; phone?: string; password: string; totpCode?: string }) => {
      const deviceId = Device.deviceName || Device.modelName || "unknown-device";
      
      const loginData: LoginRequest = {
        ...credentials,
        deviceId,
      };
      
      return authService.login(loginData);
    },
    onSuccess: async (response) => {
      // Invalidate and refetch user profile
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      
      Alert.alert("Success", "Login successful!");
      router.replace("/(tabs)");
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Login failed";
      Alert.alert("Error", message);
    },
  });
}

// ============================================================================
// LOGOUT HOOK
// ============================================================================

export function useLogout() {
  const { setUser } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      router.replace("/(auth)/login");
    },
    onError: () => {
      // Force logout even on error
      setUser(null);
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
}

// ============================================================================
// REGISTER HOOK
// ============================================================================

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      Alert.alert("Success", "Registration successful! Please login.");
      router.replace("/(auth)/login");
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Registration failed";
      Alert.alert("Error", message);
    },
  });
}

// ============================================================================
// FORGOT PASSWORD HOOK
// ============================================================================

export function useForgotPassword() {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      Alert.alert("Success", "Password reset email sent!");
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Failed to send reset email";
      Alert.alert("Error", message);
    },
  });
}
