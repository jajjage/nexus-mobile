/**
 * WebAuthn Mobile - Response Builder for React Native/Expo
 * 
 * Converts expo-local-authentication responses to WebAuthn format for backend verification.
 * This is a shim layer since React Native doesn't have native WebAuthn support like web.
 */

import { WebAuthnAuthenticationResponse } from "@/types/biometric.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    // Retrieve stored credential ID from device enrollment
    const storedCredentialId = await AsyncStorage.getItem(
      "biometric_credential_id"
    );

    if (!storedCredentialId) {
      throw new Error("No biometric credential found. Please enroll first.");
    }

    // Build client data JSON (matches WebAuthn spec)
    const clientDataJSON = {
      type: "webauthn.get",
      challenge: challenge,
      origin: rpId,
      crossOrigin: false,
    };

    // Build WebAuthn assertion response
    const assertion: WebAuthnAuthenticationResponse = {
      id: storedCredentialId,
      rawId: btoa(storedCredentialId), // Base64 encode credential ID
      response: {
        clientDataJSON: btoa(JSON.stringify(clientDataJSON)),
        authenticatorData: buildAuthenticatorData(),
        signature: generateSignature(challenge, storedCredentialId),
      },
      type: "public-key",
    };

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
  
  return btoa(String.fromCharCode(...authenticatorData));
}

/**
 * Generate signature for challenge
 * 
 * MVP Implementation: Deterministic mock signature based on challenge
 * 
 * Production Implementation:
 * - Fetch private key from iOS Keychain / Android KeyStore
 * - Use ECDSA/RSA to sign the challenge
 * - Return base64-encoded signature
 */
function generateSignature(challenge: string, credentialId: string): string {
  try {
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
    
    // Create a base64-encoded signature representation
    const signatureBuffer = new Uint8Array(64); // 64 bytes for ECDSA P-256
    
    // Fill with deterministic values based on hash
    for (let i = 0; i < signatureBuffer.length; i++) {
      signatureBuffer[i] = (Math.abs(hash) + i) % 256;
      hash = Math.imul(hash, 31);
    }
    
    return btoa(String.fromCharCode(...signatureBuffer));
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
