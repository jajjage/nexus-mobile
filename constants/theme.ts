/**
 * Nexus Theme Constants
 * 
 * Re-exports the complete color palette and design tokens.
 * This file provides backward compatibility with existing imports.
 */

import {
  darkColors,
  designTokens,
  getColors,
  lightColors,
  type ColorPalette,
  type ThemeType
} from './palette';

// Re-export everything from palette
export {
  darkColors,
  designTokens,
  getColors, lightColors, type ColorPalette,
  type ThemeType
};

/**
 * Colors object for backward compatibility
 * Maps to the new color palette structure
 */
export const colors = {
  light: lightColors,
  dark: darkColors,
};

/**
 * Spacing scale
 */
export const spacing = designTokens.spacing;

/**
 * Border radius values
 */
export const borderRadius = designTokens.radius;

/**
 * Font sizes
 */
export const fontSize = designTokens.fontSize;

/**
 * Font weights
 */
export const fontWeight = designTokens.fontWeight;

/**
 * Shadow presets for elevation
 */
export const shadow = designTokens.shadow;

/**
 * Default export for convenience
 */
export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
  tokens: designTokens,
};