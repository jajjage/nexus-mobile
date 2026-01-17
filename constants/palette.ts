/**
 * Nexus App Color Scheme
 *
 * This file contains the complete color palette for the Nexus app,
 * extracted from the web application for consistency across platforms.
 *
 * @module constants/palette
 */

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
 * Color type definitions
 */
export type LightColorPalette = typeof lightColors;
export type DarkColorPalette = typeof darkColors;
export type ColorPalette = LightColorPalette | DarkColorPalette;

/**
 * Base color keys (useful for type-safe color access)
 */
export type ColorKey = keyof LightColorPalette;

/**
 * Theme type definition
 */
export type ThemeType = 'light' | 'dark';

/**
 * Get colors based on theme
 */
export const getColors = (theme: ThemeType): ColorPalette => {
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

/**
 * Default export for convenience
 */
export default {
  light: lightColors,
  dark: darkColors,
  tokens: designTokens,
};
