# Nexus Color Scheme Guide for React Native

This guide provides the complete color palette extracted from the Nexus web application, formatted for use in React Native mobile development.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Color Palette - Light Theme](#color-palette---light-theme)
3. [Color Palette - Dark Theme](#color-palette---dark-theme)
4. [React Native Implementation](#react-native-implementation)
5. [Usage Examples](#usage-examples)
6. [Theme Provider Setup](#theme-provider-setup)
7. [HSL to Hex Conversion Reference](#hsl-to-hex-conversion-reference)

---

## Overview

The Nexus app uses a **warm, golden primary color palette** with a **cool blue-gray secondary palette**. The design supports both **light** and **dark** themes with carefully crafted color relationships.

### Brand Colors at a Glance

| Color Role | Light Theme | Dark Theme | Hex (Light) |
|------------|-------------|------------|-------------|
| **Primary** | HSL(39, 80%, 50%) | HSL(39, 80%, 50%) | `#E69E19` |
| **Background** | HSL(0, 0%, 98%) | HSL(192, 20%, 12%) | `#FAFAFA` / `#182125` |
| **Destructive** | HSL(0, 80%, 55%) | HSL(0, 80%, 50%) | `#E63636` |

---

## Color Palette - Light Theme

### Core Colors

```javascript
// Light Theme - Core Colors (HSL Values from Web App)
const lightColors = {
  // Background & Foreground
  background: 'hsl(0, 0%, 98%)',         // #FAFAFA - Very light gray
  foreground: 'hsl(240, 10%, 20%)',      // #2E2E33 - Dark charcoal

  // Card
  card: 'hsl(0, 0%, 98%)',               // #FAFAFA - Same as background
  cardForeground: 'hsl(240, 10%, 20%)',  // #2E2E33 - Same as foreground

  // Popover
  popover: 'hsl(0, 0%, 98%)',            // #FAFAFA
  popoverForeground: 'hsl(240, 10%, 20%)', // #2E2E33

  // Primary (Brand Color - Golden/Orange)
  primary: 'hsl(39, 80%, 50%)',          // #E69E19 - Nexus Gold
  primaryForeground: 'hsl(39, 100%, 98%)', // #FFFCF5 - Light cream

  // Secondary
  secondary: 'hsl(192, 10%, 85%)',       // #D4DADC - Light blue-gray
  secondaryForeground: 'hsl(192, 20%, 15%)', // #1F2A2D - Dark blue-gray

  // Muted
  muted: 'hsl(192, 5%, 92%)',            // #EAEBEC - Very light gray
  mutedForeground: 'hsl(192, 10%, 35%)', // #525D60 - Medium gray

  // Accent
  accent: 'hsl(192, 5%, 92%)',           // #EAEBEC
  accentForeground: 'hsl(240, 10%, 20%)', // #2E2E33

  // Destructive (Error/Danger)
  destructive: 'hsl(0, 80%, 55%)',       // #E63636 - Red
  destructiveForeground: 'hsl(0, 0%, 98%)', // #FAFAFA - White

  // Border & Input
  border: 'hsl(192, 10%, 85%)',          // #D4DADC
  input: 'hsl(192, 10%, 85%)',           // #D4DADC

  // Focus Ring
  ring: 'hsl(39, 80%, 50%)',             // #E69E19 - Primary color
};
```

### Sidebar Colors (Light)

```javascript
const lightSidebarColors = {
  sidebarBackground: 'hsl(0, 0%, 95%)',       // #F2F2F2
  sidebarForeground: 'hsl(240, 10%, 38%)',    // #585862
  sidebarPrimary: 'hsl(39, 80%, 47%)',        // #D99316
  sidebarPrimaryForeground: 'hsl(39, 100%, 0%)', // #000000
  sidebarAccent: 'hsl(192, 5%, 89%)',         // #E1E3E4
  sidebarAccentForeground: 'hsl(240, 10%, 20%)', // #2E2E33
  sidebarBorder: 'hsl(192, 10%, 82%)',        // #CBCFD1
  sidebarRing: 'hsl(39, 80%, 47%)',           // #D99316
};
```

### Chart Colors (Light)

```javascript
const lightChartColors = {
  chart1: 'hsl(39, 80%, 50%)',   // #E69E19 - Primary Gold
  chart2: 'hsl(12, 70%, 50%)',   // #D95C33 - Orange-Red
  chart3: 'hsl(173, 58%, 39%)',  // #2A9D8F - Teal
  chart4: 'hsl(43, 74%, 66%)',   // #E9C46A - Light Gold
  chart5: 'hsl(27, 87%, 67%)',   // #F4A261 - Light Orange
};
```

---

## Color Palette - Dark Theme

### Core Colors

```javascript
// Dark Theme - Core Colors (HSL Values from Web App)
const darkColors = {
  // Background & Foreground
  background: 'hsl(192, 20%, 12%)',      // #182125 - Dark blue-gray
  foreground: 'hsl(39, 90%, 90%)',       // #FCF3E1 - Warm cream

  // Card
  card: 'hsl(192, 20%, 12%)',            // #182125
  cardForeground: 'hsl(39, 90%, 90%)',   // #FCF3E1

  // Popover
  popover: 'hsl(192, 20%, 12%)',         // #182125
  popoverForeground: 'hsl(39, 90%, 90%)', // #FCF3E1

  // Primary (Brand Color - Same as Light)
  primary: 'hsl(39, 80%, 50%)',          // #E69E19 - Nexus Gold
  primaryForeground: 'hsl(39, 100%, 98%)', // #FFFCF5

  // Secondary
  secondary: 'hsl(192, 10%, 25%)',       // #3A4346 - Medium dark gray
  secondaryForeground: 'hsl(192, 30%, 85%)', // #CDD8DC - Light blue-gray

  // Muted
  muted: 'hsl(192, 5%, 18%)',            // #2B2F30
  mutedForeground: 'hsl(39, 50%, 60%)',  // #CC9F59 - Muted gold

  // Accent
  accent: 'hsl(192, 5%, 18%)',           // #2B2F30
  accentForeground: 'hsl(39, 90%, 90%)', // #FCF3E1

  // Destructive (Error/Danger)
  destructive: 'hsl(0, 80%, 50%)',       // #E62E2E - Red (slightly darker)
  destructiveForeground: 'hsl(39, 90%, 98%)', // #FFFEF5

  // Border & Input
  border: 'hsl(192, 10%, 25%)',          // #3A4346
  input: 'hsl(192, 10%, 25%)',           // #3A4346

  // Focus Ring
  ring: 'hsl(39, 80%, 50%)',             // #E69E19
};
```

### Sidebar Colors (Dark)

```javascript
const darkSidebarColors = {
  sidebarBackground: 'hsl(192, 20%, 4%)',     // #0A0D0E - Very dark
  sidebarForeground: 'hsl(39, 90%, 38%)',     // #B87A13 - Muted gold
  sidebarPrimary: 'hsl(39, 80%, 25%)',        // #735010 - Dark gold
  sidebarPrimaryForeground: 'hsl(39, 100%, 98%)', // #FFFCF5
  sidebarAccent: 'hsl(192, 5%, 10%)',         // #181A1A
  sidebarAccentForeground: 'hsl(39, 90%, 90%)', // #FCF3E1
  sidebarBorder: 'hsl(192, 10%, 17%)',        // #262C2E
  sidebarRing: 'hsl(39, 80%, 42%)',           // #C28517
};
```

### Chart Colors (Dark)

```javascript
const darkChartColors = {
  chart1: 'hsl(39, 70%, 40%)',   // #AD7D14 - Darker Gold
  chart2: 'hsl(27, 87%, 67%)',   // #F4A261 - Light Orange
  chart3: 'hsl(12, 76%, 61%)',   // #E76F51 - Coral
  chart4: 'hsl(43, 74%, 66%)',   // #E9C46A - Light Gold
  chart5: 'hsl(173, 58%, 39%)',  // #2A9D8F - Teal
};
```

---

## React Native Implementation

### Option 1: Complete Theme File (Recommended)

Create a file `src/theme/colors.ts`:

```typescript
/**
 * Nexus App Color Scheme
 *
 * This file contains the complete color palette for the Nexus app,
 * extracted from the web application for consistency across platforms.
 *
 * @module theme/colors
 */

// HSL to RGB helper function
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Light theme color palette
 */
export const lightColors = {
  // Core colors
  background: '#FAFAFA',
  foreground: '#2E2E33',

  // Card
  card: '#FAFAFA',
  cardForeground: '#2E2E33',

  // Popover
  popover: '#FAFAFA',
  popoverForeground: '#2E2E33',

  // Primary (Nexus Gold)
  primary: '#E69E19',
  primaryForeground: '#FFFCF5',
  primaryLight: '#F4B84D',      // Lighter variant for pressed states
  primaryDark: '#C28517',       // Darker variant for active states

  // Secondary
  secondary: '#D4DADC',
  secondaryForeground: '#1F2A2D',

  // Muted
  muted: '#EAEBEC',
  mutedForeground: '#525D60',

  // Accent
  accent: '#EAEBEC',
  accentForeground: '#2E2E33',

  // Destructive (Error/Danger)
  destructive: '#E63636',
  destructiveForeground: '#FAFAFA',

  // Success (Additional for mobile)
  success: '#2A9D8F',
  successForeground: '#FFFFFF',

  // Warning (Additional for mobile)
  warning: '#F4A261',
  warningForeground: '#1F2A2D',

  // Info (Additional for mobile)
  info: '#3B82F6',
  infoForeground: '#FFFFFF',

  // Border & Input
  border: '#D4DADC',
  input: '#D4DADC',
  inputBackground: '#FFFFFF',

  // Focus Ring
  ring: '#E69E19',

  // Sidebar
  sidebarBackground: '#F2F2F2',
  sidebarForeground: '#585862',
  sidebarPrimary: '#D99316',
  sidebarPrimaryForeground: '#000000',
  sidebarAccent: '#E1E3E4',
  sidebarAccentForeground: '#2E2E33',
  sidebarBorder: '#CBCFD1',
  sidebarRing: '#D99316',

  // Charts
  chart1: '#E69E19',
  chart2: '#D95C33',
  chart3: '#2A9D8F',
  chart4: '#E9C46A',
  chart5: '#F4A261',

  // Text variants
  textPrimary: '#2E2E33',
  textSecondary: '#525D60',
  textTertiary: '#7D8487',
  textDisabled: '#A8ADAF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Dark theme color palette
 */
export const darkColors = {
  // Core colors
  background: '#182125',
  foreground: '#FCF3E1',

  // Card
  card: '#182125',
  cardForeground: '#FCF3E1',

  // Popover
  popover: '#182125',
  popoverForeground: '#FCF3E1',

  // Primary (Nexus Gold)
  primary: '#E69E19',
  primaryForeground: '#FFFCF5',
  primaryLight: '#F4B84D',
  primaryDark: '#C28517',

  // Secondary
  secondary: '#3A4346',
  secondaryForeground: '#CDD8DC',

  // Muted
  muted: '#2B2F30',
  mutedForeground: '#CC9F59',

  // Accent
  accent: '#2B2F30',
  accentForeground: '#FCF3E1',

  // Destructive (Error/Danger)
  destructive: '#E62E2E',
  destructiveForeground: '#FFFEF5',

  // Success
  success: '#2A9D8F',
  successForeground: '#FFFFFF',

  // Warning
  warning: '#F4A261',
  warningForeground: '#1F2A2D',

  // Info
  info: '#60A5FA',
  infoForeground: '#FFFFFF',

  // Border & Input
  border: '#3A4346',
  input: '#3A4346',
  inputBackground: '#232A2D',

  // Focus Ring
  ring: '#E69E19',

  // Sidebar
  sidebarBackground: '#0A0D0E',
  sidebarForeground: '#B87A13',
  sidebarPrimary: '#735010',
  sidebarPrimaryForeground: '#FFFCF5',
  sidebarAccent: '#181A1A',
  sidebarAccentForeground: '#FCF3E1',
  sidebarBorder: '#262C2E',
  sidebarRing: '#C28517',

  // Charts
  chart1: '#AD7D14',
  chart2: '#F4A261',
  chart3: '#E76F51',
  chart4: '#E9C46A',
  chart5: '#2A9D8F',

  // Text variants
  textPrimary: '#FCF3E1',
  textSecondary: '#CC9F59',
  textTertiary: '#8B7A5A',
  textDisabled: '#5C5448',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Color type definition
 */
export type Colors = typeof lightColors;

/**
 * Theme type definition
 */
export type ThemeType = 'light' | 'dark';

/**
 * Get colors based on theme
 */
export const getColors = (theme: ThemeType): Colors => {
  return theme === 'dark' ? darkColors : lightColors;
};

/**
 * Design tokens for spacing, radius, etc.
 */
export const designTokens = {
  // Border radius (matching web app)
  radius: {
    sm: 4,   // calc(0.5rem - 4px) = 4px
    md: 6,   // calc(0.5rem - 2px) = 6px
    lg: 8,   // 0.5rem = 8px
    xl: 12,  // calc(0.5rem + 4px) = 12px
    full: 9999,
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Shadows (for elevation)
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;

export default {
  light: lightColors,
  dark: darkColors,
  tokens: designTokens,
};
```

---

## Theme Provider Setup

Create a file `src/theme/ThemeContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, Colors, ThemeType, designTokens } from './colors';

interface ThemeContextType {
  theme: ThemeType;
  colors: Colors;
  tokens: typeof designTokens;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colors,
      tokens: designTokens,
      toggleTheme,
      setTheme
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

export default ThemeProvider;
```

---

## Usage Examples

### Basic Component Styling

```typescript
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const ExampleCard: React.FC = () => {
  const { colors, tokens } = useTheme();

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: tokens.radius.lg,
      }
    ]}>
      <Text style={[styles.title, { color: colors.cardForeground }]}>
        Welcome to Nexus
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Your financial companion
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
            borderRadius: tokens.radius.md,
          }
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Get Started
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExampleCard;
```

### Status Indicators

```typescript
import { useTheme } from '../theme/ThemeContext';

const StatusBadge: React.FC<{ status: 'success' | 'warning' | 'error' | 'info' }> = ({ status }) => {
  const { colors } = useTheme();

  const statusColors = {
    success: { bg: colors.success, text: colors.successForeground },
    warning: { bg: colors.warning, text: colors.warningForeground },
    error: { bg: colors.destructive, text: colors.destructiveForeground },
    info: { bg: colors.info, text: colors.infoForeground },
  };

  const { bg, text } = statusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: text }}>{status.toUpperCase()}</Text>
    </View>
  );
};
```

### App Entry Point

```typescript
// App.tsx
import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import MainNavigator from './src/navigation/MainNavigator';

const AppContent: React.FC = () => {
  const { theme, colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <MainNavigator />
      </SafeAreaView>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
```

---

## HSL to Hex Conversion Reference

For quick reference, here are the exact hex values for all colors:

### Light Theme Hex Values

| Variable | HSL | Hex |
|----------|-----|-----|
| `background` | 0 0% 98% | `#FAFAFA` |
| `foreground` | 240 10% 20% | `#2E2E33` |
| `primary` | 39 80% 50% | `#E69E19` |
| `primaryForeground` | 39 100% 98% | `#FFFCF5` |
| `secondary` | 192 10% 85% | `#D4DADC` |
| `secondaryForeground` | 192 20% 15% | `#1F2A2D` |
| `muted` | 192 5% 92% | `#EAEBEC` |
| `mutedForeground` | 192 10% 35% | `#525D60` |
| `destructive` | 0 80% 55% | `#E63636` |
| `border` | 192 10% 85% | `#D4DADC` |
| `ring` | 39 80% 50% | `#E69E19` |

### Dark Theme Hex Values

| Variable | HSL | Hex |
|----------|-----|-----|
| `background` | 192 20% 12% | `#182125` |
| `foreground` | 39 90% 90% | `#FCF3E1` |
| `primary` | 39 80% 50% | `#E69E19` |
| `primaryForeground` | 39 100% 98% | `#FFFCF5` |
| `secondary` | 192 10% 25% | `#3A4346` |
| `secondaryForeground` | 192 30% 85% | `#CDD8DC` |
| `muted` | 192 5% 18% | `#2B2F30` |
| `mutedForeground` | 39 50% 60% | `#CC9F59` |
| `destructive` | 0 80% 50% | `#E62E2E` |
| `border` | 192 10% 25% | `#3A4346` |
| `ring` | 39 80% 50% | `#E69E19` |

---

## Best Practices

1. **Always use the theme context** - Never hardcode colors directly in components.

2. **Use semantic color names** - Access `colors.primary`, `colors.destructive`, etc. instead of hex values.

3. **Test both themes** - Ensure your components look good in both light and dark modes.

4. **Use design tokens** - For spacing, radius, and typography, use the `tokens` object for consistency.

5. **Disabled states** - Apply 60% opacity for disabled elements:
   ```typescript
   style={{ opacity: disabled ? 0.6 : 1 }}
   ```

6. **Pressed states** - Use the `primaryDark` or `primaryLight` variants for interactive feedback.

---

## File Structure Recommendation

```
src/
├── theme/
│   ├── colors.ts           # Color palette definitions
│   ├── ThemeContext.tsx    # Theme provider and hook
│   └── index.ts            # Re-exports
├── components/
│   └── ...
└── ...
```

---

