/**
 * WebAuthn Mobile - Native Passkey Implementation
 * 
 * Uses react-native-passkey to interface with native OS Credential Managers:
 * - Android: Credential Manager / FIDO2
 * - iOS: ASAuthorizationController (Passkeys)
 * 
 * Fallback for Expo Go: Uses expo-local-authentication + Mock Response
 */

import { Passkey } from 'react-native-passkey';
import { 
  WebAuthnAuthenticationResponse, 
  WebAuthnRegistrationResponse 
} from "@/types/biometric.types";
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Register a new Passkey (WebAuthn Enrollment)
 */
export async function buildWebAuthnAttestationResponse(
  challenge: string,
  userId: string,
  userName: string,
  rpId: string = "nexusdatasub.com"
): Promise<WebAuthnRegistrationResponse> {
  try {
    console.log("[Passkey] Starting registration...", isExpoGo ? "(Expo Go Mock)" : "(Native)");
    
    // --- EXPO GO FALLBACK (MOCK) ---
    if (isExpoGo) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Register Biometrics (Mock)',
      });
      
      if (!auth.success) {
        throw new Error("Biometric authentication failed");
      }

      // Return MOCK response for development
      // This mimics a "none" attestation which backend might accept in dev mode
      const credentialId = "mock-credential-" + Date.now();
      await AsyncStorage.setItem("mock_cred_id", credentialId);
      
      return {
        id: credentialId,
        rawId: credentialId,
        response: {
          clientDataJSON: encodeBase64Url(JSON.stringify({
            type: "webauthn.create",
            challenge,
            origin: `https://${rpId}`,
            crossOrigin: false
          })),
          attestationObject: createMockAttestationObject(challenge),
        },
        type: "public-key",
        deviceName: "Expo Go Device",
        platform: Platform.OS,
        authenticatorAttachment: "platform",
      };
    }

    // --- NATIVE PASSKEY (PRODUCTION) ---
    const result = await Passkey.create({
      challenge: challenge,
      rp: {
        name: "Nexus Data",
        id: rpId,
      },
      user: {
        id: userId,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct"
    });

    console.log("[Passkey] Registration successful");

    return {
      id: result.id,
      rawId: result.rawId,
      response: {
        clientDataJSON: result.response.clientDataJSON,
        attestationObject: result.response.attestationObject,
      },
      type: "public-key",
      deviceName: Platform.OS === 'ios' ? "iPhone" : "Android",
      platform: Platform.OS,
      authenticatorAttachment: "platform",
    };

  } catch (error: any) {
    console.error("[Passkey] Registration error:", error);
    if (error.message && error.message.includes("cancelled")) {
      throw new Error("User cancelled the operation");
    }
    throw error;
  }
}

/**
 * Authenticate with existing Passkey (WebAuthn Assertion)
 */
export async function buildWebAuthnAssertion(
  challenge: string,
  rpId: string = "nexusdatasub.com"
): Promise<WebAuthnAuthenticationResponse> {
  try {
    console.log("[Passkey] Starting authentication...", isExpoGo ? "(Expo Go Mock)" : "(Native)");

    // --- EXPO GO FALLBACK (MOCK) ---
    if (isExpoGo) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate (Mock)',
      });

      if (!auth.success) {
        throw new Error("Biometric authentication failed");
      }

      const credentialId = await AsyncStorage.getItem("mock_cred_id") || "mock-id";

      return {
        id: credentialId,
        rawId: credentialId,
        response: {
          clientDataJSON: encodeBase64Url(JSON.stringify({
            type: "webauthn.get",
            challenge,
            origin: `https://${rpId}`,
            crossOrigin: false
          })),
          authenticatorData: "mock_authenticator_data_base64url",
          signature: "mock_signature_base64url",
        },
        type: "public-key",
      };
    }

    // --- NATIVE PASSKEY (PRODUCTION) ---
    const result = await Passkey.get({
      challenge: challenge,
      rpId: rpId,
      userVerification: "required",
      timeout: 60000,
    });

    console.log("[Passkey] Authentication successful");

    return {
      id: result.id,
      rawId: result.rawId,
      response: {
        clientDataJSON: result.response.clientDataJSON,
        authenticatorData: result.response.authenticatorData,
        signature: result.response.signature,
      },
      type: "public-key",
    };

  } catch (error: any) {
    console.error("[Passkey] Authentication error:", error);
    if (error.message && error.message.includes("cancelled")) {
      throw new Error("User cancelled the operation");
    }
    throw error;
  }
}

// Helpers for Mock Data
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
    if (i + 1 >= str.length) output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    else if (i + 2 >= str.length) output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    else output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function encodeBase64Url(str: string): string {
  return toBase64Url(btoa(str));
}

function createMockAttestationObject(challenge: string): string {
  // Simple JSON attestation (backend must accept this in dev mode)
  const attestation = {
    fmt: "none",
    attStmt: {},
    authData: {
      rpIdHash: "mock_hash",
      flags: { userPresent: true, userVerified: true },
      signCount: 0,
      aaguid: "00000000-0000-0000-0000-000000000000",
      credentialId: "mock-credential-id",
      credentialPublicKey: "mock-public-key"
    }
  };
  return encodeBase64Url(JSON.stringify(attestation));
}

// Deprecated helpers maintained for compatibility if imported elsewhere
export async function storeCredentialId(credentialId: string): Promise<void> {}
export async function getStoredCredentialId(): Promise<string | null> { return null; }
export async function clearCredentialId(): Promise<void> {}