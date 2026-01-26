/**
 * CBOR & Crypto Utilities for WebAuthn
 * 
 * Uses industry-standard libraries:
 * - @noble/hashes: Pure JS SHA256 (audited, production-grade)
 * - cbor-x: Fast CBOR encoder/decoder (RFC 8949 compliant)
 * 
 * No external native dependencies - works in Expo Go
 */

import { sha256 as sha256Hash } from "@noble/hashes/sha2.js";
import { encode } from "cbor-x";

/**
 * Encode a value to CBOR binary format (RFC 8949)
 * @param value - Any JavaScript value
 * @returns CBOR-encoded bytes as Uint8Array
 */
export function encodeCBOR(value: any): Uint8Array {
  try {
    const encoded = encode(value);
    return encoded instanceof Uint8Array ? encoded : new Uint8Array(encoded);
  } catch (error) {
    console.error("[CBOR] Encoding error:", error);
    throw new Error(`Failed to encode CBOR: ${error}`);
  }
}

/**
 * Encode a map/object to CBOR format
 * @param obj - Plain JavaScript object
 * @returns CBOR-encoded bytes
 */
export function encodeCBORMap(obj: Record<string, any>): Uint8Array {
  return encodeCBOR(obj);
}

/**
 * Convert Uint8Array to base64url string (URL-safe, no padding)
 * Used in WebAuthn (challenge, credential IDs, etc.)
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  // Prefer Node/React Native Buffer when available (more reliable than btoa)
  if (typeof Buffer !== "undefined") {
    const b64 = Buffer.from(bytes).toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  let binary = "";
  for (let byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Convert Uint8Array to base64 string (standard base64, with padding)
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Convert base64url string back to Uint8Array
 */
export function base64UrlToUint8Array(str: string): Uint8Array {
  const padded = str + "==".substring(0, (4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Calculate SHA256 hash of input
 * Uses @noble/hashes (audited, production-grade)
 */
export function sha256(input: string | Uint8Array): Uint8Array {
  try {
    const data =
      typeof input === "string" ? new TextEncoder().encode(input) : input;
    const hash = sha256Hash(data);
    return hash instanceof Uint8Array ? hash : new Uint8Array(hash);
  } catch (error) {
    console.error("[SHA256] Hashing error:", error);
    throw new Error(`Failed to compute SHA256: ${error}`);
  }
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Check if two Uint8Arrays are equal
 */
export function uint8ArrayEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
   