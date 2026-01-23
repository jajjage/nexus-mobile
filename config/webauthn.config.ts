/**
 * WebAuthn Configuration
 * 
 * Note: Mobile apps use different origins than web apps.
 * - Web: https://localhost:3001 (HTTPS)
 * - Mobile: http://localhost:3001 (HTTP) + origin from backend registration options
 * 
 * The RP_ID should match what's configured in the backend.
 */

/**
 * Get WebAuthn origin for mobile client
 * This should match the WEBAUTHN_ORIGIN in the backend environment
 */
export const getWebAuthnOrigin = (): string => {
  // In development, use the configured origin
  // In production, this would come from the backend via registration options
  const origin = process.env.EXPO_PUBLIC_WEBAUTHN_ORIGIN;
  
  if (!origin) {
    console.warn(
      '[WebAuthnConfig] EXPO_PUBLIC_WEBAUTHN_ORIGIN not set, using fallback'
    );
    return 'http://localhost:3001';
  }
  
  return origin;
};

/**
 * Get WebAuthn RP ID (Relying Party ID)
 * This should match the WEBAUTHN_RP_ID in the backend environment
 */
export const getWebAuthnRpId = (): string => {
  // In development, use the configured RP ID
  // In production, this would come from the backend via registration options
  const rpId = process.env.EXPO_PUBLIC_WEBAUTHN_RP_ID;
  
  if (!rpId) {
    console.warn(
      '[WebAuthnConfig] EXPO_PUBLIC_WEBAUTHN_RP_ID not set, using fallback'
    );
    return 'localhost';
  }
  
  return rpId;
};

/**
 * Extract hostname from URL
 * Useful for converting https://localhost:3001 to localhost
 */
export const extractHostname = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('[WebAuthnConfig] Error parsing URL:', url, error);
    return url;
  }
};

/**
 * Get origin from registration options RP
 * Falls back to configured mobile origin if not available
 */
export const getOriginForAttestation = (rpId?: string): string => {
  // If backend provides an RP ID in registration options, use our mobile origin
  // Don't use the web origin directly - use the mobile-specific one
  const mobileOrigin = getWebAuthnOrigin();
  
  console.log('[WebAuthnConfig] Using mobile origin for attestation:', mobileOrigin);
  
  return mobileOrigin;
};

export const webauthnConfig = {
  getWebAuthnOrigin,
  getWebAuthnRpId,
  extractHostname,
  getOriginForAttestation,
};

export default webauthnConfig;
