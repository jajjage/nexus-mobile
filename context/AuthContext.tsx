// context/AuthContext.tsx
import { tokenStorage, userStorage } from "@/lib/secure-store";
import { userService } from "@/services/user.service";
import { User } from "@/types/api.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

/**
 * Auth Context - Manages user session state
 * 
 * Key concepts:
 * - isSessionExpired: True only when app code explicitly marks it
 * - User cache stored in SecureStore for security
 * - markSessionAsExpired: Called by API client when refresh token fails
 */
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSessionExpired: boolean;
  markSessionAsExpired: () => void;
  isLocalBiometricSetup: boolean;
  setIsLocalBiometricSetup: (isSetup: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLocalBiometricSetup, setIsLocalBiometricSetup] = useState(false);

  // Load user from SecureStore on mount
  // CRITICAL: Also verify tokens exist - if tokens are missing, don't restore user
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if tokens exist first
        const accessToken = await tokenStorage.getAccessToken();
        const refreshToken = await tokenStorage.getRefreshToken();
        
        // If no tokens, don't restore user (they're logged out)
        if (!accessToken && !refreshToken) {
          console.log("[AuthContext] No tokens found, user is logged out");
          await userStorage.clearAll();
          setUserState(null);
          setIsLoading(false);
          return;
        }

        // Check local biometric setup state
        const bioSetup = await AsyncStorage.getItem('biometric_setup_completed');
        setIsLocalBiometricSetup(bioSetup === 'true');

        // Tokens exist, restore user from SecureStore for immediate display
        const storedUser = await userStorage.getUser<User>();
        if (storedUser) {
          console.log("[AuthContext] Restored user from SecureStore:", storedUser.userId);
          setUserState(storedUser);
        }

        // Prefetch latest profile from API to ensure data is fresh
        try {
          console.log("[AuthContext] Fetching latest profile...");
          const profileResponse = await userService.getProfile();
          
          if (profileResponse?.data) {
            const freshUser = profileResponse.data as unknown as User; 
            setUserState(freshUser);
            await userStorage.setUser(freshUser);
            if (freshUser.role) {
                await userStorage.setUserRole(freshUser.role);
            }
          }
        } catch (apiError: any) {
          console.warn("[AuthContext] Failed to fetch latest profile:", apiError?.message);

          const status = apiError?.response?.status;
          if (status === 401 || status === 403) {
            console.warn("[AuthContext] Profile returned 401/403; keeping cached session");
            return;
          }
          
          console.log("[AuthContext] Network error or server down; keeping cached session.");
        }

      } catch (error) {
        console.error("Failed to load user from storage", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Wrapper to save to SecureStore when setting user
  const setUser = async (newUser: User | null) => {
    setUserState(newUser);
    setIsSessionExpired(false); // Reset session expired flag on new login
    
    if (newUser) {
      try {
        await userStorage.setUser(newUser);
        await userStorage.setUserRole(newUser.role);
        
        // Check local biometric setup again on login
        const bioSetup = await AsyncStorage.getItem('biometric_setup_completed');
        setIsLocalBiometricSetup(bioSetup === 'true');
      } catch (e) {
        console.error("Failed to save user to SecureStore", e);
      }
    } else {
      // When clearing user, also clear tokens and user cache
      try {
        await userStorage.clearAll();
        await tokenStorage.clearTokens();
        // Don't clear biometric_setup_completed here?
        // Actually, if user logs out, we should probably force setup again for new user?
        // But biometric enrollment is device-wide usually.
        // If a NEW user logs in, they might need setup.
        // Let's assume biometric setup is per-login-session roughly?
        // Actually, biometric_enrolled is device-specific.
        // If user A enrolls, then logs out. User B logs in.
        // User B shouldn't be auto-enrolled.
        // So we should probably clear biometric_setup_completed on logout IF we want multi-user safety.
        // But for now, let's keep it simple. If I clear it, they have to setup every time they login.
        // Wait, typical flow: Login -> Setup -> Done.
        // If I logout and login again, I am already setup.
        // So DO NOT clear it on logout.
      } catch (e) {
        console.error("Failed to clear auth data", e);
      }
    }
  };

  // Helper to partially update user state (optimistic updates)
  const updateUser = async (updates: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // Save asynchronously
      userStorage.setUser(updated).catch((e) =>
        console.error("Failed to save user update", e)
      );
      
      // Update role if changed
      if (updates.role) {
        userStorage.setUserRole(updates.role).catch((e) =>
          console.error("Failed to save user role", e)
        );
      }
      
      return updated;
    });
  };

  /**
   * Explicit session-expiry path. API errors should not call this.
   */
  const markSessionAsExpired = async () => {
    console.log("[AuthContext] Session marked as expired");
    setIsSessionExpired(true);
    
    // Clear tokens but keep user role for redirect purposes
    await tokenStorage.clearTokens();
    await userStorage.clearUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        isLoading,
        setIsLoading,
        isSessionExpired,
        markSessionAsExpired,
        isLocalBiometricSetup,
        setIsLocalBiometricSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
