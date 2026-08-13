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
    let isMounted = true;
    
    // Safety fallback: Ensure isLoading is never true for more than 4 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("[AuthContext] Load user safety timeout triggered, forcing isLoading to false");
        setIsLoading(false);
      }
    }, 4000);

    const loadUser = async () => {
      try {
        // Check if tokens exist first
        const accessToken = await tokenStorage.getAccessToken().catch(() => null);
        const refreshToken = await tokenStorage.getRefreshToken().catch(() => null);
        
        // If no tokens, don't restore user (they're logged out)
        if (!accessToken && !refreshToken) {
          console.log("[AuthContext] No tokens found, user is logged out");
          await userStorage.clearAll().catch(() => {});
          if (isMounted) {
            setUserState(null);
          }
          return;
        }

        // Check local biometric setup state
        const bioSetup = await AsyncStorage.getItem('biometric_setup_completed').catch(() => null);
        if (isMounted) {
          setIsLocalBiometricSetup(bioSetup === 'true');
        }

        // Tokens exist, restore user from SecureStore for immediate display
        const storedUser = await userStorage.getUser<User>().catch(() => null);
        if (storedUser && isMounted) {
          console.log("[AuthContext] Restored user from SecureStore:", storedUser.userId);
          setUserState(storedUser);
        }

        // Prefetch latest profile from API to ensure data is fresh
        try {
          console.log("[AuthContext] Fetching latest profile...");
          const profileResponse = await userService.getProfile();
          
          if (profileResponse?.data && isMounted) {
            const freshUser = profileResponse.data as unknown as User; 
            setUserState(freshUser);
            await userStorage.setUser(freshUser).catch(() => {});
            if (freshUser.role) {
                await userStorage.setUserRole(freshUser.role).catch(() => {});
            }
          }
        } catch (apiError: any) {
          console.warn("[AuthContext] Failed to fetch latest profile:", apiError?.message);
        }

      } catch (error) {
        console.error("Failed to load user from storage", error);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Wrapper to save to SecureStore when setting user
  const setUser = async (newUser: User | null) => {
    setUserState(newUser);
    setIsSessionExpired(false); // Reset session expired flag on new login
    
    if (newUser) {
      try {
        await userStorage.setUser(newUser);
        await userStorage.setUserRole(newUser.role);
        
        // Check local biometric setup state (user-scoped)
        const activeUserId = newUser.userId;
        const bioSetup = activeUserId
          ? await AsyncStorage.getItem(`biometric_setup_completed_${activeUserId}`)
          : await AsyncStorage.getItem('biometric_setup_completed');
        setIsLocalBiometricSetup(bioSetup === 'true');
      } catch (e) {
        console.error("Failed to save user to SecureStore", e);
      }
    } else {
      // When clearing user, also clear tokens and user cache
      try {
        await userStorage.clearAll();
        await tokenStorage.clearTokens();
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
