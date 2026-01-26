// Lightweight crypto.getRandomValues polyfill for React Native using @noble/hashes utils
// This provides a minimal `globalThis.crypto.getRandomValues` implementation
// so libraries that rely on Web Crypto RNG (getRandomValues) work in RN/Expo.

import { randomBytes } from "@noble/hashes/utils.js";

if (typeof globalThis.crypto === "undefined" || typeof (globalThis.crypto as any).getRandomValues !== "function") {
  // Provide a simple getRandomValues implementation
  (globalThis as any).crypto = (globalThis as any).crypto || {};
  (globalThis as any).crypto.getRandomValues = function (array: Uint8Array) {
    const bytes = randomBytes(array.length);
    array.set(bytes);
    return array;
  };
}

export { };

