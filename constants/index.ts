/**
 * Constants Index
 * 
 * Central export point for all constants.
 */

// Color Palette
export {
    darkColors,
    designTokens,
    getColors, lightColors, type ColorPalette,
    type ThemeType
} from './palette';

// Theme (backward compatibility)
export {
    borderRadius, colors, fontSize,
    fontWeight,
    shadow, spacing
} from './theme';

// Navigation Colors
export { default as Colors } from './Colors';

// Default exports
export { default as colorPalette } from './palette';
export { default as theme } from './theme';

