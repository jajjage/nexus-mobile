// lib/secure-store.ts
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "nexus_access_token";
const REFRESH_TOKEN_KEY = "nexus_refresh_token";
const USER_CACHE_KEY = "nexus_user_cache";
const USER_ROLE_KEY = "nexus_user_role";

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

/**
 * Secure user cache storage - stores user data securely
 * Used for quick app restarts and session restoration
 */
export const userStorage = {
  async getUser<T>(): Promise<T | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_CACHE_KEY);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (e) {
      console.error("[userStorage] Failed to parse user cache", e);
      return null;
    }
  },

  async setUser<T>(user: T): Promise<void> {
    await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_CACHE_KEY);
  },

  async getUserRole(): Promise<string | null> {
    return SecureStore.getItemAsync(USER_ROLE_KEY);
  },

  async setUserRole(role: string): Promise<void> {
    await SecureStore.setItemAsync(USER_ROLE_KEY, role);
  },

  async clearUserRole(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
  },

  /**
   * Clear all user-related data (for logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(USER_CACHE_KEY),
      SecureStore.deleteItemAsync(USER_ROLE_KEY),
    ]);
  },
};
