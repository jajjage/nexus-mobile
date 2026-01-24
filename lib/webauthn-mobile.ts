/**
 * WebAuthn Mobile - Response Builder for React Native/Expo
 * 
 * Converts expo-local-authentication responses to WebAuthn format for backend verification.
 * This is a shim layer since React Native doesn't have native WebAuthn support like web.
 */

import { WebAuthnAuthenticationResponse } from "@/types/biometric.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Pure JavaScript base64 encoding (works in Expo Go without native modules)
 */
function btoa(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  
  for (let i = 0; i < str.length; i += 3) {
    const byte1 = str.charCodeAt(i);
    const byte2 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const byte3 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
    
    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;
    
    if (i + 1 >= str.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    } else if (i + 2 >= str.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    } else {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }
  }
  
  return output;
}

/**
 * Build WebAuthn authentication response from expo-local-authentication result
 * 
 * Note: This implementation uses mock/placeholder signatures.
 * For production with strict WebAuthn validation, integrate:
 * - iOS: SecKey cryptographic signing
 * - Android: KeyStore ECDSA/RSA signing
 * 
 * For MVP: Backend should accept mock signatures in dev/test mode
 */
export async function buildWebAuthnAssertion(
  challenge: string,
  rpId: string = "nexus-data.com"
): Promise<WebAuthnAuthenticationResponse> {
  try {
    console.log("[WebAuthnMobile] ===== BUILDING ASSERTION =====");
    console.log("[WebAuthnMobile] Challenge received:", challenge.substring(0, 20) + "...");
    
    // Retrieve stored credential ID from device enrollment
    const storedCredentialId = await AsyncStorage.getItem(
      "biometric_credential_id"
    );

    if (!storedCredentialId) {
      throw new Error("No biometric credential found. Please enroll first.");
    }

    console.log("[WebAuthnMobile] Stored credential ID:", storedCredentialId.substring(0, 20) + "...");

    // Build client data JSON (matches WebAuthn spec)
    const clientDataJSON = {
      type: "webauthn.get",
      challenge: challenge,
      origin: rpId,
      crossOrigin: false,
    };

    // Build WebAuthn assertion response with BASE64URL encoding (URL-safe)
    const assertion: WebAuthnAuthenticationResponse = {
      id: encodeBase64Url(storedCredentialId), // base64url
      rawId: encodeBase64Url(storedCredentialId), // base64url (same as id)
      response: {
        clientDataJSON: encodeBase64Url(JSON.stringify(clientDataJSON)), // base64url
        authenticatorData: buildAuthenticatorData(), // Already returns base64url
        signature: generateSignature(challenge, storedCredentialId), // Already returns base64url
      },
      type: "public-key",
    };

    console.log("[WebAuthnMobile] ===== ASSERTION BUILT =====");
    console.log("[WebAuthnMobile] id (base64url):", assertion.id.substring(0, 30) + "...");
    console.log("[WebAuthnMobile] rawId (base64url):", assertion.rawId.substring(0, 30) + "...");
    console.log("[WebAuthnMobile] clientDataJSON (base64url):", assertion.response.clientDataJSON.substring(0, 30) + "...");
    console.log("[WebAuthnMobile] authenticatorData (base64url):", assertion.response.authenticatorData.substring(0, 30) + "...");
    console.log("[WebAuthnMobile] signature (base64url):", assertion.response.signature.substring(0, 30) + "...");
    console.log("[WebAuthnMobile] Encoding check - contains '+' or '/':", 
      assertion.id.includes('+') || assertion.id.includes('/') || 
      assertion.rawId.includes('+') || assertion.rawId.includes('/')
    );

    // Validate structure before returning
    if (!validateWebAuthnResponse(assertion)) {
      throw new Error("Invalid WebAuthn response structure");
    }

    return assertion;
  } catch (error: any) {
    console.error("[WebAuthnMobile] Error building assertion:", error.message);
    throw error;
  }
}

/**
 * Build minimal authenticator data for mobile
 * 
 * WebAuthn spec requires authenticator data with:
 * - RP ID hash (32 bytes)
 * - Flags (1 byte)
 * - Sign counter (4 bytes)
 * - (Optional) Credential data
 * 
 * For transaction verification: minimal data is acceptable
 */
function buildAuthenticatorData(): string {
  // Create minimal authenticator data (32 + 1 + 4 = 37 bytes)
  // In production, this should include proper RP ID hash and flags
  
  // RP ID Hash (32 bytes of zeros for MVP - should be SHA256(rpId))
  const rpIdHash = new Uint8Array(32).fill(0);
  
  // Flags byte: 
  // 0x01 = UP (User Present)
  // 0x04 = UV (User Verified)
  const flagsByte = new Uint8Array([0x05]); // UP + UV
  
  // Sign counter (4 bytes - big endian)
  const signCounter = new Uint8Array(4);
  const counterValue = Math.floor(Math.random() * 0xffffffff);
  new DataView(signCounter.buffer).setUint32(0, counterValue, false);
  
  // Combine all parts
  const authenticatorData = new Uint8Array(
    rpIdHash.length + flagsByte.length + signCounter.length
  );
  authenticatorData.set(rpIdHash, 0);
  authenticatorData.set(flagsByte, rpIdHash.length);
  authenticatorData.set(signCounter, rpIdHash.length + flagsByte.length);
  
  return toBase64Url(btoa(String.fromCharCode(...authenticatorData)));
}

/**
 * Generate signature for challenge
 * 
 * MVP Implementation for Expo Go: Create mock signature as JSON
 * The backend will recognize this as a mock signature and accept it in dev mode
 * 
 * Production Implementation (for standalone builds):
 * - Fetch private key from iOS Keychain / Android KeyStore
 * - Use ECDSA/RSA to sign the challenge
 * - Return base64url-encoded signature
 */
function generateSignature(challenge: string, credentialId: string): string {
  try {
    // Detect if running in Expo Go
    const Constants = require('expo-constants');
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (isExpoGo || __DEV__) {
      // MOCK SIGNATURE for Expo Go / Development
      // Backend will recognize this JSON structure and accept it in dev/test mode
      console.log("[WebAuthnMobile] Creating MOCK signature for Expo Go/Dev");
      
      const mockSignature = {
        isMock: true,
        isTest: true,
        challenge: challenge.substring(0, 20),
        credentialId: credentialId.substring(0, 20),
        timestamp: Date.now(),
      };
      
      // Encode mock signature as base64url JSON
      return toBase64Url(btoa(JSON.stringify(mockSignature)));
    }
    
    // PRODUCTION: Real cryptographic signature (for standalone builds)
    // For MVP: Create a deterministic signature based on challenge
    // This allows backend to verify consistency without needing actual crypto
    
    // Hash the challenge to create a signature-like value
    let hash = 0;
    for (let i = 0; i < challenge.length; i++) {
      const char = challenge.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Mix in credential ID for uniqueness
    for (let i = 0; i < credentialId.length; i++) {
      const char = credentialId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    
    // Create a base64url-encoded signature representation
    const signatureBuffer = new Uint8Array(64); // 64 bytes for ECDSA P-256
    
    // Fill with deterministic values based on hash
    for (let i = 0; i < signatureBuffer.length; i++) {
      signatureBuffer[i] = (Math.abs(hash) + i) % 256;
      hash = Math.imul(hash, 31);
    }
    
    return toBase64Url(btoa(String.fromCharCode(...signatureBuffer)));
  } catch (error) {
    console.error("[WebAuthnMobile] Error generating signature:", error);
    throw error;
  }
}

/**
 * Validate WebAuthn response structure
 */
export function validateWebAuthnResponse(
  response: WebAuthnAuthenticationResponse
): boolean {
  try {
    const isValid =
      !!response.id &&
      typeof response.id === "string" &&
      !!response.rawId &&
      typeof response.rawId === "string" &&
      !!response.response &&
      typeof response.response === "object" &&
      !!response.response.clientDataJSON &&
      typeof response.response.clientDataJSON === "string" &&
      !!response.response.authenticatorData &&
      typeof response.response.authenticatorData === "string" &&
      !!response.response.signature &&
      typeof response.response.signature === "string" &&
      response.type === "public-key";

    if (!isValid) {
      console.warn("[WebAuthnMobile] Invalid response structure:", {
        hasId: !!response.id,
        hasRawId: !!response.rawId,
        hasResponse: !!response.response,
        hasClientData: !!response.response?.clientDataJSON,
        hasAuthData: !!response.response?.authenticatorData,
        hasSignature: !!response.response?.signature,
        type: response.type,
      });
    }

    return isValid;
  } catch (error) {
    console.error("[WebAuthnMobile] Validation error:", error);
    return false;
  }
}

/**
 * Convert standard base64 to base64url (RFC 4648)
 * Replace + with -, / with _, and remove padding =
 */
function toBase64Url(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Encode string to base64url
 */
function encodeBase64Url(str: string): string {
  return toBase64Url(btoa(str));
}

/**
 * Generate a cryptographically-sized credential ID for WebAuthn
 * Real WebAuthn credential IDs are typically 32-64 bytes
 * For MVP, we generate a reasonable-length ID that passes validation
 */
function generateCredentialId(): string {
  // Generate a 64-character hex string (32 bytes when decoded)
  // This mimics real WebAuthn credential IDs
  const timestamp = Date.now().toString(16).padStart(16, '0');
  const random = Math.random().toString(16).substring(2).padEnd(32, '0');
  const credId = (timestamp + random).substring(0, 64);
  
  return credId;
}

/**
 * Build WebAuthn registration response for enrollment
 * Used during setup biometric enrollment
 * 
 * NOTE: This is a MOCK implementation for MVP. The attestation object is JSON-encoded,
 * not proper CBOR. For production, consider:
 * 1. Using proper CBOR encoding library (if available for RN)
 * 2. Having backend accept mock JSON format for MVP phase
 * 3. Switching to native WebAuthn APIs in future (iOS Security Framework, Android Keystore)
 */
export async function buildWebAuthnAttestationResponse(
  challenge: string,
  credentialId: string = '',
  rpId: string = "nexus-data.com"
): Promise<any> {
  try {
    // Use provided credential ID or generate a new one
    const finalCredentialId = credentialId || generateCredentialId();
    
    const clientDataJSON = {
      type: "webauthn.create",
      challenge: challenge,
      origin: rpId,
      crossOrigin: false,
    };

    // Save credential ID for future use
    await AsyncStorage.setItem("biometric_credential_id", finalCredentialId);

    // Detect platform and device info
    const isIOS = require("react-native").Platform.OS === "ios";
    const platform = isIOS ? "ios" : "android";
    const deviceName = require("react-native").Platform.OS === "ios" ? "iPhone/iPad" : "Android";

    // Encode to base64url (not standard base64)
    const encodedCredentialId = encodeBase64Url(finalCredentialId);

    return {
      id: encodedCredentialId,  // Base64url-encoded
      rawId: encodedCredentialId,  // Same as id for WebAuthn compatibility
      response: {
        clientDataJSON: encodeBase64Url(JSON.stringify(clientDataJSON)),
        attestationObject: buildAttestationObject(finalCredentialId, challenge),
      },
      type: "public-key",
      deviceName: deviceName,
      platform: platform,
      authenticatorAttachment: "platform",
    };
  } catch (error: any) {
    console.error("[WebAuthnMobile] Error building attestation response:", error);
    throw error;
  }
}

/**
 * Build attestation object for enrollment
 * 
 * Real WebAuthn uses CBOR encoding. For mobile MVP with mock biometrics,
 * we create a structure that mimics real attestation while being simple to work with.
 * 
 * Format: Base64url-encoded JSON representing attestation structure
 * The backend may need to decode and parse this as JSON (if using mock verification)
 * or convert to proper CBOR format if using real WebAuthn libraries.
 */
function buildAttestationObject(credentialId: string, challenge: string): string {
  // Mock attestation structure similar to what WebAuthn produces
  // In real WebAuthn, this would be CBOR-encoded and contain:
  // - fmt: attestation format
  // - attStmt: attestation statement
  // - authData: authenticator data
  
  const attestationObject = {
    fmt: "none", // "none" = no attestation statement (OK for mobile/mock)
    attStmt: {}, // Empty for "none" format
    authData: {
      rpIdHash: btoa(challenge).substring(0, 32), // Simulated RP ID hash
      flags: {
        userPresent: true, // User verified device
        userVerified: true, // User verified with biometric
        backupEligible: false,
        backupState: false,
        attestedCredentialData: true,
      },
      signCount: 0,
      attestedCredentialData: {
        aaguid: "00000000-0000-0000-0000-000000000000", // Platform AAGUID
        credentialId: credentialId,
        credentialPublicKey: {
          kty: 2, // Asymmetric key type
          crv: 1, // P-256
          x: challenge.substring(0, 20), // Mock X coordinate
          y: challenge.substring(20, 40), // Mock Y coordinate
        },
      },
      extensions: {
        credProps: {
          rk: true, // Resident key
        },
      },
    },
  };

  // For now, encode as JSON. Backend should expect this for MVP mock verification.
  // If backend uses simplewebauthn or similar, it may need to be converted to CBOR
  // or the backend needs to have a separate mock verification path.
  return encodeBase64Url(JSON.stringify(attestationObject));
}

/**
 * Store credential ID locally after successful enrollment
 */
export async function storeCredentialId(credentialId: string): Promise<void> {
  try {
    await AsyncStorage.setItem("biometric_credential_id", credentialId);
    console.log("[WebAuthnMobile] Credential ID stored");
  } catch (error: any) {
    console.error("[WebAuthnMobile] Error storing credential ID:", error);
    throw error;
  }
}

/**
 * Retrieve stored credential ID
 */
export async function getStoredCredentialId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("biometric_credential_id");
  } catch (error: any) {
    console.error("[WebAuthnMobile] Error retrieving credential ID:", error);
    return null;
  }
}

/**
 * Clear stored credential ID (e.g., on logout or re-enrollment)
 */
export async function clearCredentialId(): Promise<void> {
  try {
    await AsyncStorage.removeItem("biometric_credential_id");
    console.log("[WebAuthnMobile] Credential ID cleared");
  } catch (error: any) {
    console.error("[WebAuthnMobile] Error clearing credential ID:", error);
    throw error;
  }
}
