import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorPalette, ThemeType, darkColors, designTokens, lightColors } from '../constants/palette';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  themePreference: ThemePreference;
  colors: ColorPalette;
  tokens: typeof designTokens;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isDark: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "@nexus_app_preferences";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
          setThemePreferenceState(parsed.theme);
          console.log("[ThemeContext] Loaded theme preference:", parsed.theme);
        }
      }
    } catch (error) {
      console.error("[ThemeContext] Failed to load theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme preference to AsyncStorage
  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    try {
      setThemePreferenceState(preference);
      
      // Load existing preferences and update theme
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed.theme = preference;
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(parsed));
      
      console.log("[ThemeContext] Saved theme preference:", preference);
    } catch (error) {
      console.error("[ThemeContext] Failed to save theme preference:", error);
    }
  }, []);

  // Resolve the actual theme based on preference
  const resolvedTheme: ThemeType = 
    themePreference === 'system' 
      ? (systemColorScheme ?? 'light') 
      : themePreference;

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    const newPreference = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(newPreference);
  }, [resolvedTheme, setThemePreference]);

  const setTheme = useCallback((theme: ThemeType) => {
    setThemePreference(theme);
  }, [setThemePreference]);

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme,
      themePreference,
      colors,
      tokens: designTokens,
      toggleTheme,
      setTheme,
      setThemePreference,
      isDark,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get just the colors without the full theme context
 * Useful for components that only need color values
 */
export const useColors = (): ColorPalette => {
  const { colors } = useTheme();
  return colors;
};

/**
 * Hook to get design tokens
 */
export const useTokens = () => {
  const { tokens } = useTheme();
  return tokens;
};

/**
 * Hook that returns 'light' or 'dark' for compatibility
 * This replaces useColorScheme calls
 */
export const useAppColorScheme = (): 'light' | 'dark' => {
  const { theme } = useTheme();
  return theme;
};

export default ThemeProvider;

