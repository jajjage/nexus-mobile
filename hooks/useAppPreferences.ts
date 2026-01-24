/**
 * App Preferences Hook
 * Manages user preferences stored locally in AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const PREFERENCES_KEY = "@nexus_app_preferences";

export interface AppPreferences {
  hapticsEnabled: boolean;
  autoRedirectAfterPurchase: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_PREFERENCES: AppPreferences = {
  hapticsEnabled: true,
  autoRedirectAfterPurchase: false,
  theme: 'system',
};

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = useCallback(
    async <K extends keyof AppPreferences>(
      key: K,
      value: AppPreferences[K]
    ) => {
      try {
        const updated = { ...preferences, [key]: value };
        setPreferences(updated);
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save preference:", error);
      }
    },
    [preferences]
  );

  return {
    preferences,
    updatePreference,
    isLoading,
  };
}

/**
 * Sync version for use outside React components
 */
let cachedPreferences: AppPreferences = DEFAULT_PREFERENCES;

export async function initializePreferences() {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      cachedPreferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to initialize preferences:", error);
  }
}

export function getAppPreferences(): AppPreferences {
  return cachedPreferences;
}

// Initialize preferences cache on app start
initializePreferences();
