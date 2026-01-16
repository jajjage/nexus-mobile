// context/AuthContext.tsx
import { tokenStorage } from "@/lib/secure-store";
import { MobileLoginRequest, MobileLoginResponse, User } from "@/types/auth.types";
import axios from "axios";
import * as Device from "expo-device";
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

const BASE_URL = "https://localhost:3000/api/v1";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string, backupCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        if (accessToken) {
          // Try to refresh and get user info
          await refreshAuth();
        }
      } catch (error) {
        console.log("Auth initialization failed:", error);
        await tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    totpCode?: string,
    backupCode?: string
  ) => {
    setIsLoading(true);
    try {
      const deviceId = Device.deviceName || "unknown-device";

      const loginRequest: MobileLoginRequest = {
        email,
        password,
        deviceId,
        ...(totpCode && { totpCode }),
        ...(backupCode && { backupCode }),
      };

      const { data } = await axios.post<MobileLoginResponse>(
        `${BASE_URL}/mobile/auth/login`,
        loginRequest
      );

      await tokenStorage.setAccessToken(data.accessToken);
      await tokenStorage.setRefreshToken(data.refreshToken);

      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const { data } = await axios.post<MobileLoginResponse>(
      `${BASE_URL}/mobile/auth/refresh`,
      { refreshToken }
    );

    await tokenStorage.setAccessToken(data.accessToken);
    await tokenStorage.setRefreshToken(data.refreshToken);

    setUser({
      id: data.id,
      email: data.email,
      role: data.role,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
