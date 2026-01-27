// context/AuthContext.tsx
import { tokenStorage, userStorage } from "@/lib/secure-store";
import { userService } from "@/services/user.service";
import { User } from "@/types/api.types";
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

/**
 * Auth Context - Manages user session state
 * 
 * Key concepts:
 * - isSessionExpired: True when session expires (different from logout)
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

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

        // Tokens exist, restore user from SecureStore for immediate display
        const storedUser = await userStorage.getUser<User>();
        if (storedUser) {
          console.log("[AuthContext] Restored user from SecureStore:", storedUser.userId);
          setUserState(storedUser);
        }

        // Prefetch latest profile from API to ensure data is fresh
        // This keeps the global loader visible until we have the latest data
        try {
          console.log("[AuthContext] Fetching latest profile...");
          const profileResponse = await userService.getProfile();
          
          if (profileResponse?.data) {
            // Merge with stored user or use fresh profile
            // profileResponse.data contains the actual User object
            const freshUser = profileResponse.data as unknown as User; 
            setUserState(freshUser);
            // Update cache
            await userStorage.setUser(freshUser);
            if (freshUser.role) {
                await userStorage.setUserRole(freshUser.role);
            }
          }
        } catch (apiError) {
          console.warn("[AuthContext] Failed to fetch latest profile, using cached user:", apiError);
          // If API fails but we have storedUser, we proceed (offline mode or server error)
          // If no storedUser and API fails, user stays null -> might redirect to login?
          // If token was invalid, apiClient interceptor might have called markSessionAsExpired
        }

      } catch (error) {
        console.error("Failed to load user from storage", error);
        setUserState(null);
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
   * Called by API client when refresh token fails
   * Marks session as expired but keeps user data for display
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
