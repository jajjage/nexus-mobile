'use client';
import { vars } from 'nativewind';

// Amber/Gold Color Palette
// Primary: #D4A017 (hsl(43, 80%, 46%))
// Light Background: #FAFAFA
// Dark Background: #1A2329

export const config = {
  light: vars({
    // Primary - Amber/Gold
    '--color-primary-0': '255 253 247', // #FFFDF7 - lightest
    '--color-primary-50': '254 249 231', // light gold tint
    '--color-primary-100': '253 241 196', 
    '--color-primary-200': '250 225 143', // #FAE18F - disabled state
    '--color-primary-300': '245 203 92',
    '--color-primary-400': '230 175 40', // #E6AF28
    '--color-primary-500': '230 158 25', // #e69e19 - main primary
    '--color-primary-600': '180 136 20',
    '--color-primary-700': '148 112 17',
    '--color-primary-800': '116 88 13',
    '--color-primary-900': '84 64 10',
    '--color-primary-950': '52 40 6',

    /* Secondary */
    '--color-secondary-0': '253 253 253',
    '--color-secondary-50': '250 250 250', // #FAFAFA
    '--color-secondary-100': '246 246 246',
    '--color-secondary-200': '237 238 239',
    '--color-secondary-300': '224 225 227',
    '--color-secondary-400': '212 214 217', // #D4D6D9
    '--color-secondary-500': '200 202 205',
    '--color-secondary-600': '175 177 180',
    '--color-secondary-700': '150 152 155',
    '--color-secondary-800': '125 127 130',
    '--color-secondary-900': '100 102 105',
    '--color-secondary-950': '75 77 80',

    /* Tertiary - Using amber tones */
    '--color-tertiary-0': '255 250 245',
    '--color-tertiary-50': '255 242 229',
    '--color-tertiary-100': '255 233 213',
    '--color-tertiary-200': '254 209 170',
    '--color-tertiary-300': '253 180 116',
    '--color-tertiary-400': '251 157 75',
    '--color-tertiary-500': '231 129 40',
    '--color-tertiary-600': '215 117 31',
    '--color-tertiary-700': '180 98 26',
    '--color-tertiary-800': '130 73 23',
    '--color-tertiary-900': '108 61 19',
    '--color-tertiary-950': '84 49 18',

    /* Error - Red */
    '--color-error-0': '254 242 242',
    '--color-error-50': '254 226 226',
    '--color-error-100': '254 202 202',
    '--color-error-200': '252 165 165',
    '--color-error-300': '248 113 113',
    '--color-error-400': '239 68 68',
    '--color-error-500': '229 57 53', // #E53935
    '--color-error-600': '220 38 38',
    '--color-error-700': '185 28 28',
    '--color-error-800': '153 27 27',
    '--color-error-900': '127 29 29',
    '--color-error-950': '83 19 19',

    /* Success */
    '--color-success-0': '228 255 244',
    '--color-success-50': '220 252 231',
    '--color-success-100': '187 247 208',
    '--color-success-200': '134 239 172',
    '--color-success-300': '74 222 128',
    '--color-success-400': '34 197 94',
    '--color-success-500': '22 163 74',
    '--color-success-600': '21 128 61',
    '--color-success-700': '22 101 52',
    '--color-success-800': '20 83 45',
    '--color-success-900': '20 83 45',
    '--color-success-950': '5 46 22',

    /* Warning - Orange/Amber tones */
    '--color-warning-0': '255 251 235',
    '--color-warning-50': '254 243 199',
    '--color-warning-100': '253 230 138',
    '--color-warning-200': '252 211 77',
    '--color-warning-300': '250 204 21',
    '--color-warning-400': '234 179 8',
    '--color-warning-500': '202 138 4',
    '--color-warning-600': '161 98 7',
    '--color-warning-700': '133 77 14',
    '--color-warning-800': '113 63 18',
    '--color-warning-900': '101 56 18',
    '--color-warning-950': '66 32 6',

    /* Info - Blue */
    '--color-info-0': '239 246 255',
    '--color-info-50': '219 234 254',
    '--color-info-100': '191 219 254',
    '--color-info-200': '147 197 253',
    '--color-info-300': '96 165 250',
    '--color-info-400': '59 130 246',
    '--color-info-500': '37 99 235',
    '--color-info-600': '29 78 216',
    '--color-info-700': '30 64 175',
    '--color-info-800': '30 58 138',
    '--color-info-900': '30 58 138',
    '--color-info-950': '23 37 84',

    /* Typography */
    '--color-typography-0': '255 255 255',
    '--color-typography-50': '250 250 250',
    '--color-typography-100': '245 245 245',
    '--color-typography-200': '229 229 229',
    '--color-typography-300': '212 212 212',
    '--color-typography-400': '163 163 163',
    '--color-typography-500': '115 115 115', // #737373
    '--color-typography-600': '82 87 95', // #52575F - mutedForeground
    '--color-typography-700': '64 64 64',
    '--color-typography-800': '46 48 57', // #2E3039 - foreground
    '--color-typography-900': '38 38 39',
    '--color-typography-950': '23 23 23',

    /* Outline */
    '--color-outline-0': '255 255 255',
    '--color-outline-50': '250 250 250',
    '--color-outline-100': '245 245 245',
    '--color-outline-200': '229 229 229',
    '--color-outline-300': '212 214 217', // #D4D6D9 - border
    '--color-outline-400': '163 163 163',
    '--color-outline-500': '115 115 115',
    '--color-outline-600': '82 82 82',
    '--color-outline-700': '64 64 64',
    '--color-outline-800': '46 48 57',
    '--color-outline-900': '38 38 39',
    '--color-outline-950': '23 23 23',

    /* Background */
    '--color-background-0': '255 255 255', // #FFFFFF - white
    '--color-background-50': '250 250 250', // #FAFAFA - main bg
    '--color-background-100': '245 245 245',
    '--color-background-200': '232 233 234', // #E8E9EA - muted
    '--color-background-300': '212 214 217',
    '--color-background-400': '163 163 163',
    '--color-background-500': '115 115 115',
    '--color-background-600': '82 82 82',
    '--color-background-700': '64 64 64',
    '--color-background-800': '46 48 57',
    '--color-background-900': '38 38 39',
    '--color-background-950': '23 23 23',

    /* Background Special */
    '--color-background-error': '254 242 242',
    '--color-background-warning': '255 251 235',
    '--color-background-success': '220 252 231',
    '--color-background-muted': '232 233 234', // #E8E9EA
    '--color-background-info': '239 246 255',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '212 160 23', // #D4A017
    '--color-indicator-info': '59 130 246',
    '--color-indicator-error': '229 57 53',
  }),
  dark: vars({
    // Primary - Amber/Gold (same in dark mode)
    '--color-primary-0': '52 40 6',
    '--color-primary-50': '84 64 10',
    '--color-primary-100': '116 88 13',
    '--color-primary-200': '148 112 17',
    '--color-primary-300': '180 136 20',
    '--color-primary-400': '196 148 22',
    '--color-primary-500': '230 158 25', // #e69e19 - main primary
    '--color-primary-600': '230 175 40',
    '--color-primary-700': '245 203 92',
    '--color-primary-800': '250 225 143',
    '--color-primary-900': '253 241 196',
    '--color-primary-950': '255 253 247',

    /* Secondary */
    '--color-secondary-0': '26 35 41', // #1A2329
    '--color-secondary-50': '36 44 48', // #242C30 - muted dark
    '--color-secondary-100': '46 54 57', // #2E3639 - secondary dark
    '--color-secondary-200': '56 64 67',
    '--color-secondary-300': '66 74 77',
    '--color-secondary-400': '86 94 97',
    '--color-secondary-500': '106 114 117',
    '--color-secondary-600': '136 144 147',
    '--color-secondary-700': '166 174 177',
    '--color-secondary-800': '196 204 207',
    '--color-secondary-900': '226 234 237',
    '--color-secondary-950': '246 254 255',

    /* Tertiary */
    '--color-tertiary-0': '84 49 18',
    '--color-tertiary-50': '108 61 19',
    '--color-tertiary-100': '130 73 23',
    '--color-tertiary-200': '180 98 26',
    '--color-tertiary-300': '215 117 31',
    '--color-tertiary-400': '231 129 40',
    '--color-tertiary-500': '251 157 75',
    '--color-tertiary-600': '253 180 116',
    '--color-tertiary-700': '254 209 170',
    '--color-tertiary-800': '255 233 213',
    '--color-tertiary-900': '255 242 229',
    '--color-tertiary-950': '255 250 245',

    /* Error */
    '--color-error-0': '83 19 19',
    '--color-error-50': '127 29 29',
    '--color-error-100': '153 27 27',
    '--color-error-200': '185 28 28',
    '--color-error-300': '211 47 47', // #D32F2F
    '--color-error-400': '229 57 53',
    '--color-error-500': '239 68 68',
    '--color-error-600': '248 113 113',
    '--color-error-700': '252 165 165',
    '--color-error-800': '254 202 202',
    '--color-error-900': '254 226 226',
    '--color-error-950': '254 242 242',

    /* Success */
    '--color-success-0': '5 46 22',
    '--color-success-50': '20 83 45',
    '--color-success-100': '22 101 52',
    '--color-success-200': '21 128 61',
    '--color-success-300': '22 163 74',
    '--color-success-400': '34 197 94',
    '--color-success-500': '74 222 128',
    '--color-success-600': '134 239 172',
    '--color-success-700': '187 247 208',
    '--color-success-800': '220 252 231',
    '--color-success-900': '240 253 244',
    '--color-success-950': '240 253 244',

    /* Warning */
    '--color-warning-0': '66 32 6',
    '--color-warning-50': '101 56 18',
    '--color-warning-100': '113 63 18',
    '--color-warning-200': '133 77 14',
    '--color-warning-300': '161 98 7',
    '--color-warning-400': '202 138 4',
    '--color-warning-500': '234 179 8',
    '--color-warning-600': '250 204 21',
    '--color-warning-700': '252 211 77',
    '--color-warning-800': '253 230 138',
    '--color-warning-900': '254 243 199',
    '--color-warning-950': '255 251 235',

    /* Info */
    '--color-info-0': '23 37 84',
    '--color-info-50': '30 58 138',
    '--color-info-100': '30 64 175',
    '--color-info-200': '29 78 216',
    '--color-info-300': '37 99 235',
    '--color-info-400': '59 130 246',
    '--color-info-500': '96 165 250',
    '--color-info-600': '147 197 253',
    '--color-info-700': '191 219 254',
    '--color-info-800': '219 234 254',
    '--color-info-900': '239 246 255',
    '--color-info-950': '239 246 255',

    /* Typography - Dark mode */
    '--color-typography-0': '23 23 23',
    '--color-typography-50': '38 38 39',
    '--color-typography-100': '46 48 57',
    '--color-typography-200': '64 64 64',
    '--color-typography-300': '82 82 82',
    '--color-typography-400': '201 168 92', // #C9A85C - muted foreground dark
    '--color-typography-500': '163 163 163',
    '--color-typography-600': '189 189 189',
    '--color-typography-700': '212 212 212',
    '--color-typography-800': '229 229 229',
    '--color-typography-900': '245 230 200', // #F5E6C8 - foreground dark
    '--color-typography-950': '255 253 247',

    /* Outline */
    '--color-outline-0': '23 23 23',
    '--color-outline-50': '38 38 39',
    '--color-outline-100': '46 54 57', // #2E3639 - border dark
    '--color-outline-200': '64 64 64',
    '--color-outline-300': '82 82 82',
    '--color-outline-400': '115 115 115',
    '--color-outline-500': '140 140 140',
    '--color-outline-600': '163 163 163',
    '--color-outline-700': '189 189 189',
    '--color-outline-800': '212 212 212',
    '--color-outline-900': '229 229 229',
    '--color-outline-950': '245 245 245',

    /* Background - Dark mode */
    '--color-background-0': '26 35 41', // #1A2329 - main dark bg
    '--color-background-50': '36 44 48', // #242C30 - muted dark
    '--color-background-100': '46 54 57', // #2E3639
    '--color-background-200': '56 64 67',
    '--color-background-300': '76 84 87',
    '--color-background-400': '106 114 117',
    '--color-background-500': '136 144 147',
    '--color-background-600': '166 174 177',
    '--color-background-700': '196 204 207',
    '--color-background-800': '226 234 237',
    '--color-background-900': '246 254 255',
    '--color-background-950': '255 255 255',

    /* Background Special - Dark */
    '--color-background-error': '66 43 43',
    '--color-background-warning': '65 47 35',
    '--color-background-success': '28 43 33',
    '--color-background-muted': '36 44 48', // #242C30
    '--color-background-info': '26 40 46',

    /* Focus Ring Indicator - Dark */
    '--color-indicator-primary': '212 160 23', // #D4A017
    '--color-indicator-info': '96 165 250',
    '--color-indicator-error': '248 113 113',
  }),
};
