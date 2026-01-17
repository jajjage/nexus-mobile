import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorPalette, ThemeType, darkColors, designTokens, lightColors } from '../constants/palette';

interface ThemeContextType {
  theme: ThemeType;
  colors: ColorPalette;
  tokens: typeof designTokens;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(
    defaultTheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light')
  );

  // Sync with system theme changes
  useEffect(() => {
    if (!defaultTheme && systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme, defaultTheme]);

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme((prev: ThemeType) => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colors,
      tokens: designTokens,
      toggleTheme,
      setTheme,
      isDark
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

export default ThemeProvider;
