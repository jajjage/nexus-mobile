/**
 * Nexus Colors for Expo/React Navigation
 * 
 * This file provides colors in the format expected by Expo and React Navigation.
 * The colors are derived from the Nexus color palette.
 */

import { darkColors, lightColors } from './palette';

const tintColorLight = lightColors.primary; // #E69E19 - Nexus Gold
const tintColorDark = lightColors.primary;  // #E69E19 - Same in dark mode

export default {
  light: {
    text: lightColors.foreground,           // #2E2E33
    background: lightColors.background,      // #FAFAFA
    tint: tintColorLight,                    // #E69E19
    tabIconDefault: lightColors.mutedForeground, // #525D60
    tabIconSelected: tintColorLight,
    
    // Additional navigation colors
    card: lightColors.card,
    border: lightColors.border,
    notification: lightColors.destructive,
    primary: lightColors.primary,
  },
  dark: {
    text: darkColors.foreground,             // #FCF3E1
    background: darkColors.background,        // #182125
    tint: tintColorDark,                      // #E69E19
    tabIconDefault: darkColors.mutedForeground, // #CC9F59
    tabIconSelected: tintColorDark,
    
    // Additional navigation colors
    card: darkColors.card,
    border: darkColors.border,
    notification: darkColors.destructive,
    primary: darkColors.primary,
  },
};
