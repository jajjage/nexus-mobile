/**
 * Environment Detection for WebAuthn
 * 
 * Separates development (mock) and production (real CBOR) implementations
 */

export type WebAuthnEnvironment = 'development' | 'production';

/**
 * Detect current environment
 * 
 * In dev builds: __DEV__ is true (Expo Go, debug builds)
 * In production: __DEV__ is false (standalone builds, stores)
 */
export function getWebAuthnEnvironment(): WebAuthnEnvironment {
  // Check environment variable first (can be set in eas.json or app.json)
  const envVar = process.env.EXPO_PUBLIC_WEBAUTHN_ENV;
  if (envVar === 'production' || envVar === 'development') {
    return envVar;
  }

  // Fall back to __DEV__ (React Native build-time constant)
  return __DEV__ ? 'development' : 'production';
}

/**
 * Check if running in development mode (mock attestations)
 */
export function isWebAuthnDevelopment(): boolean {
  return getWebAuthnEnvironment() === 'development';
}

/**
 * Check if running in production mode (real CBOR attestations)
 */
export function isWebAuthnProduction(): boolean {
  return getWebAuthnEnvironment() === 'production';
}

/**
 * Log environment detection for debugging
 */
export function logWebAuthnEnvironment(): void {
  const env = getWebAuthnEnvironment();
  const devVar = process.env.EXPO_PUBLIC_WEBAUTHN_ENV;
  const isDev = __DEV__;

  console.log('[WebAuthnEnv] Configuration:', {
    detectedEnvironment: env,
    envVariable: devVar,
    __DEV__: isDev,
    mode: env === 'development' ? 'MOCK (JSON)' : 'REAL (CBOR)',
  });
}
