// lib/secure-store.ts
import * as SecureStore from "expo-secure-store";
import { AsyncStorage } from "react-native";

const ACCESS_TOKEN_KEY = "nexus_access_token";
const REFRESH_TOKEN_KEY = "nexus_refresh_token";
const USER_CACHE_KEY = "nexus_user_cache";  // Moved to AsyncStorage
const USER_ROLE_KEY = "nexus_user_role";    // Moved to AsyncStorage

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
 * User cache storage - moved to AsyncStorage (non-sensitive data)
 * We only store critical security data in SecureStore (tokens, PINs, passcodes)
 * User profiles are cached in AsyncStorage for faster app startup
 * 
 * This avoids the 2048 byte SecureStore limit while keeping tokens secure
 */
export const userStorage = {
  async getUser<T>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(USER_CACHE_KEY);
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
    console.log('[userStorage] Storing user in AsyncStorage (not SecureStore - non-sensitive data)');
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_CACHE_KEY);
  },

  async getUserRole(): Promise<string | null> {
    return AsyncStorage.getItem(USER_ROLE_KEY);
  },

  async setUserRole(role: string): Promise<void> {
    await AsyncStorage.setItem(USER_ROLE_KEY, role);
  },

  async clearUserRole(): Promise<void> {
    await AsyncStorage.removeItem(USER_ROLE_KEY);
  },

  /**
   * Clear all user-related data (for logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(USER_CACHE_KEY),
      AsyncStorage.removeItem(USER_ROLE_KEY),
    ]);
  },
};
