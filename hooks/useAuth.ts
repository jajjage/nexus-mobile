import { useAuthContext } from "@/context/AuthContext";
import { clearSessionExpiredCallback, setSessionExpiredCallback } from "@/lib/api-client";
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
import { toast } from "sonner-native";

// Query keys for React Query cache
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

// ============================================================================
// MAIN AUTH HOOK - uses React Query to fetch user profile
// ============================================================================

export function useAuth() {
  const { user, setUser, isLoading, setIsLoading, isSessionExpired, markSessionAsExpired, isLocalBiometricSetup } = useAuthContext();
  const queryClient = useQueryClient();
  
  // Check if we have a token stored (enables the query)
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  // Register session expiry callback on mount
  useEffect(() => {
    setSessionExpiredCallback(() => {

      markSessionAsExpired();
      queryClient.clear();
    });
    
    return () => {
      clearSessionExpiredCallback();
    };
  }, [markSessionAsExpired, queryClient]);

  useEffect(() => {
    const checkToken = async () => {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      
      // CRITICAL: Both tokens missing = logged out state
      const canAuthenticate = !!accessToken || !!refreshToken;
      setHasToken(canAuthenticate);
      
      if (!canAuthenticate) {
        // If no tokens, clear user immediately

        setUser(null);
        setIsLoading(false);
      }
    };
    checkToken();
  }, [setUser, setIsLoading]);

  // Fetch user profile - this determines if user is authenticated
  const query = useQuery<User, AxiosError>({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const profile = await authService.getProfile();
      return profile;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (access token valid for 15 min, so safe to cache 3 min)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/403 - these are handled by api-client's refresh interceptor
      // If we reach here with 401/403 after api-client's refresh attempt, user is logged out
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false; // Stop retrying, user needs to log in
      }
      // Retry network errors up to 3 times
      return failureCount < 3;
    },
    enabled: hasToken === true && !isSessionExpired, // Don't fetch if session is expired
  });

  // Sync query result to context
  // IMPORTANT: Preserve device-local flags that shouldn't be overwritten by API
  // Sync query result to context
  // IMPORTANT: Preserve device-local flags that shouldn't be overwritten by API
  useEffect(() => {
    if (query.isSuccess && query.data) {
      // console.log('[useAuth] Query success, data from backend:', JSON.stringify({
      //     hasPin: query.data.hasPin,
      //     hasPasscode: query.data.hasPasscode,
      //     hasBiometric: query.data.hasBiometric
      // }, null, 2));

      // hasBiometric is device-specific and managed locally
      // hasPin and hasPasscode might be stale from backend due to eventual consistency
      const localHasBiometric = user?.hasBiometric;
      const localHasPin = user?.hasPin;
      const localHasPasscode = user?.hasPasscode;
      
      const mergedUser = {
        ...query.data,
        // Preserve local state if it's true (optimistic update)
        hasBiometric: localHasBiometric === true ? true : query.data.hasBiometric,
        hasPin: localHasPin === true ? true : query.data.hasPin,
        hasPasscode: localHasPasscode === true ? true : query.data.hasPasscode,
      };
      
      // Deep comparison to prevent infinite loop / unnecessary updates
      if (JSON.stringify(mergedUser) !== JSON.stringify(user)) {
         setUser(mergedUser);
      }
      setIsLoading(false);
    }
  }, [query.isSuccess, query.data, user]);

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

  // isAuthenticated check as per MOBILE_AUTH_STATE_GUIDE.md
  const isAuthenticated = 
    user !== null && 
    !isSessionExpired && 
    user.isSuspended === false;
    
  const isAdmin = user?.role === "admin";

  return {
    user,
    isAuthenticated,
    isAdmin,
    isSessionExpired,
    isLoading: hasToken === null || isLoading || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isLocalBiometricSetup,
    // Permission helpers
    checkPermission: (permission: string) => user?.permissions?.includes(permission) ?? false,
    checkRole: (role: string) => user?.role === role,
  };
}

// ============================================================================
// LOGIN HOOK
// ============================================================================

export function useLogin() {
  const { setUser, setIsLoading } = useAuthContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (credentials: { email?: string; phone?: string; password: string; totpCode?: string }) => {
      const deviceId = Device.deviceName || Device.modelName || "unknown-device";
      
      // Build clean login data - only include defined values
      const loginData: LoginRequest = {
        password: credentials.password,
        deviceId,
      };
      
      // Only add email if defined
      if (credentials.email) {
        loginData.email = credentials.email;
      }
      
      // Only add phone if defined
      if (credentials.phone) {
        loginData.phone = credentials.phone;
      }
      
      // Only add totpCode if defined
      if (credentials.totpCode) {
        loginData.totpCode = credentials.totpCode;
      }
      
      return authService.login(loginData);
    },
    onSuccess: async (response) => {
      // Show global loader to cover the transition and data fetching
      setIsLoading(true);

      try {
        // Fetch full profile immediately
        const profile = await authService.getProfile();
        
        // Update React Query cache
        queryClient.setQueryData(authKeys.currentUser(), profile);
        
        // Update Context State
        setUser(profile);

        // Pre-fetch critical home screen data if possible (e.g. balance)
        // await queryClient.prefetchQuery(...) // Optional

        toast.success("Welcome back! 👋", {
          description: "Login successful",
        });
        
        router.replace("/(tabs)");
      } catch (error) {
        console.error("[useLogin] Failed to fetch profile after login:", error);
        toast.error("Login Error", { description: "Could not load user profile" });
      } finally {
        // Hide loader after a short delay to allow Home screen to render
        setTimeout(() => {
          setIsLoading(false);
        }, 500); 
      }
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      toast.error("Login Failed", {
        description: message,
      });
      setIsLoading(false);
    },
  });

  // Extract error message for inline display
  const errorMessage = mutation.error 
    ? (mutation.error as AxiosError<any>).response?.data?.message || "Login failed"
    : null;

  return {
    ...mutation,
    errorMessage,
  };
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
  const mutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      toast.success("Account Created! 🎉", {
        description: "Please login with your credentials",
      });
      router.replace("/(auth)/login");
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error("Registration Failed", {
        description: message,
      });
    },
  });

  // Extract error message for inline display
  const errorMessage = mutation.error 
    ? (mutation.error as AxiosError<any>).response?.data?.message || "Registration failed"
    : null;

  return {
    ...mutation,
    errorMessage,
  };
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
