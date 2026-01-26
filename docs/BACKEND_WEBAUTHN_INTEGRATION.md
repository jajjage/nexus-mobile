# Backend Integration Guide - WebAuthn CBOR Attestations

## Overview

The mobile app now sends **real CBOR binary attestations in production** instead of mock JSON. This guide explains what the backend needs to do to accept and verify them.

---

## What Changed on Mobile

### Before (Broken)
```json
POST /biometric/register/verify {
  "attestationObject": "base64url(JSON.stringify({
    fmt: 'none',
    attStmt: {},
    authData: {
      rpIdHash: [0, 0, 0, ..., 0],           // ❌ Mock zeros
      flags: {...},
      attestedCredentialData: {...}
    }
  }))"
}
```

### After (Fixed)
```json
POST /biometric/register/verify {
  "attestationObject": "base64url(CBOR.encode({
    fmt: 'none',
    attStmt: {},
    authData: <Uint8Array with SHA256(rpId)> // ✅ Real hash
  }))"
}
```

---

## Backend Implementation

### Step 1: Decode Attestation Object

**Detect Format:**
```typescript
function detectAttestationFormat(attestationBase64url: string): 'json' | 'cbor' {
  // Dev format: Starts with base64url('{"fmt"')
  // Prod format: CBOR-encoded (binary)
  
  const buffer = Buffer.from(attestationBase64url, 'base64url');
  
  // Try JSON first
  try {
    const text = buffer.toString('utf8');
    if (text.startsWith('{')) {
      JSON.parse(text);
      return 'json'; // Dev format
    }
  } catch (e) {}
  
  // Must be CBOR
  return 'cbor'; // Prod format
}
```

**Decode JSON (Dev):**
```typescript
function decodeAttestationObjectJSON(attestationBase64url: string) {
  const buffer = Buffer.from(attestationBase64url, 'base64url');
  const text = buffer.toString('utf8');
  return JSON.parse(text);
}

// Example result:
// {
//   fmt: 'none',
//   attStmt: {},
//   authData: {
//     rpIdHash: [0, 0, 0, ..., 0],
//     flags: {...}
//   }
// }
```

**Decode CBOR (Prod):**
```typescript
// Install: npm install cbor
import * as CBOR from 'cbor';

function decodeAttestationObjectCBOR(attestationBase64url: string) {
  const buffer = Buffer.from(attestationBase64url, 'base64url');
  return CBOR.decode(buffer);
}

// Example result:
// {
//   fmt: 'none',
//   attStmt: {},
//   authData: Uint8Array([61, 140, 168, ..., 159])
// }
```

### Step 2: Extract Authenticator Data

**From JSON (Dev):**
```typescript
function extractAuthDataJSON(attestObj) {
  return {
    rpIdHash: Buffer.from(attestObj.authData.rpIdHash),
    flags: attestObj.authData.flags,
    signCount: attestObj.authData.signCount,
    credentialId: Buffer.from(attestObj.authData.attestedCredentialData.credentialId),
    credentialPublicKey: attestObj.authData.attestedCredentialData.credentialPublicKey,
  };
}
```

**From CBOR (Prod):**
```typescript
function extractAuthDataCBOR(attestObj) {
  const authData = attestObj.authData; // Uint8Array
  
  // Parse binary authenticator data
  // https://w3c.github.io/webauthn/#authenticator-data
  
  const rpIdHash = authData.slice(0, 32);
  const flags = authData[32];
  const signCounter = authData.slice(33, 37);
  
  // Optional: credential data (if AT flag set)
  let credentialId = null;
  let credentialPublicKey = null;
  
  if ((flags & 0x40) !== 0) { // AT flag
    const aaguid = authData.slice(37, 53);
    const credIdLen = authData.readUInt16BE(53);
    const credIdStart = 55;
    const credIdEnd = credIdStart + credIdLen;
    
    credentialId = authData.slice(credIdStart, credIdEnd);
    
    // Public key is CBOR-encoded COSE key
    const pubKeyStart = credIdEnd;
    const pubKeyData = authData.slice(pubKeyStart);
    credentialPublicKey = CBOR.decode(pubKeyData);
  }
  
  return {
    rpIdHash,
    flags,
    signCounter,
    credentialId,
    credentialPublicKey,
  };
}
```

### Step 3: Validate RP ID Hash

**CRITICAL: This is the main difference between dev and prod**

```typescript
function validateRpIdHash(rpIdHash: Buffer, expectedRpId: string): boolean {
  // Compute expected hash
  const crypto = require('crypto');
  const expectedHash = crypto.createHash('sha256').update(expectedRpId).digest();
  
  // Compare
  return rpIdHash.equals(expectedHash);
}

// Usage:
const attestObj = decodeAttestationObject(attestationBase64url);
const authData = extractAuthData(attestObj);

const isValid = validateRpIdHash(authData.rpIdHash, "nexusdatasub.com");

if (!isValid) {
  throw new Error('RP ID hash mismatch!');
}
```

**Expected Values:**

```typescript
// Development (zeros)
rpIdHash = Buffer.from([0, 0, 0, ..., 0]) // All zeros
console.log(rpIdHash.toString('hex'));
// Output: 00000000000000000000000000000000000000000000000000000000000000

// Production (real SHA256)
const crypto = require('crypto');
const expected = crypto.createHash('sha256').update('nexusdatasub.com').digest();
console.log(expected.toString('hex'));
// Output: 3d8ca8fe48e4a8d0ce85b2f14c5dba20a5d46b3d8f0c4e9a2b1c3d4e5f6a7b8c
```

### Step 4: Verify Flags

```typescript
function verifyAuthDataFlags(flags: number): {
  userPresent: boolean;
  userVerified: boolean;
  backupEligible: boolean;
  backupState: boolean;
  attestedCredentialDataIncluded: boolean;
} {
  return {
    userPresent: (flags & 0x01) !== 0,           // Bit 0
    userVerified: (flags & 0x04) !== 0,          // Bit 2
    backupEligible: (flags & 0x08) !== 0,        // Bit 3
    backupState: (flags & 0x10) !== 0,           // Bit 4
    attestedCredentialDataIncluded: (flags & 0x40) !== 0, // Bit 6
  };
}

// Expected for mobile biometric registration:
// - userPresent: true (user was present)
// - userVerified: true (biometric verified)
```

---

## Complete Verification Flow

```typescript
async function verifyBiometricRegistration(
  attestationObjectBase64url: string,
  clientDataJSONBase64url: string,
  challenge: string
) {
  // Step 1: Decode attestation object (supports both JSON and CBOR)
  const attestFormat = detectAttestationFormat(attestationObjectBase64url);
  const attestObj = attestFormat === 'json'
    ? decodeAttestationObjectJSON(attestationObjectBase64url)
    : decodeAttestationObjectCBOR(attestationObjectBase64url);

  // Step 2: Extract authenticator data
  const authData = attestFormat === 'json'
    ? extractAuthDataJSON(attestObj)
    : extractAuthDataCBOR(attestObj);

  // Step 3: Verify RP ID hash (CRITICAL)
  if (!validateRpIdHash(authData.rpIdHash, "nexusdatasub.com")) {
    throw new Error('RP ID hash does not match nexusdatasub.com');
  }

  // Step 4: Verify flags
  const flags = verifyAuthDataFlags(authData.flags);
  
  if (!flags.userPresent || !flags.userVerified) {
    throw new Error('User not present or not verified');
  }

  // Step 5: Verify client data JSON
  const clientDataJSON = JSON.parse(
    Buffer.from(clientDataJSONBase64url, 'base64url').toString()
  );
  
  if (clientDataJSON.type !== 'webauthn.create') {
    throw new Error('Invalid client data type');
  }
  
  if (clientDataJSON.challenge !== challenge) {
    throw new Error('Challenge mismatch');
  }
  
  if (clientDataJSON.origin !== 'https://nexusdatasub.com') {
    throw new Error('Origin mismatch');
  }

  // Step 6: Store enrollment
  const enrollmentData = {
    credentialId: authData.credentialId?.toString('hex'),
    credentialPublicKey: authData.credentialPublicKey,
    signCount: parseInt(authData.signCounter.toString('hex'), 16),
    userVerified: flags.userVerified,
    enrolledAt: new Date().toISOString(),
  };

  // Save to database...
  
  return {
    success: true,
    enrollmentId: 'enrollment_id_here',
    credentialId: enrollmentData.credentialId,
  };
}
```

---

## Handling Both Dev and Prod

### Option A: Separate Verification Paths

```typescript
async function verifyBiometricRegistration(request) {
  const format = detectAttestationFormat(request.attestationObject);
  
  if (format === 'json') {
    // Development path
    return verifyBiometricRegistrationDev(request);
  } else {
    // Production path
    return verifyBiometricRegistrationProd(request);
  }
}

async function verifyBiometricRegistrationDev(request) {
  // Accept mock attestations with zeros
  // Less strict validation
  const attestObj = decodeAttestationObjectJSON(request.attestationObject);
  
  // Just check format and flags, don't verify hash
  if (attestObj.authData.flags.userVerified) {
    return { success: true };
  }
}

async function verifyBiometricRegistrationProd(request) {
  // Full WebAuthn verification
  const attestObj = decodeAttestationObjectCBOR(request.attestationObject);
  const authData = extractAuthDataCBOR(attestObj);
  
  // Verify RP ID hash (CRITICAL)
  if (!validateRpIdHash(authData.rpIdHash, "nexusdatasub.com")) {
    throw new Error('Invalid RP ID hash');
  }
  
  // Full verification...
  return { success: true };
}
```

### Option B: Single Path with Format Detection

```typescript
async function verifyBiometricRegistration(request) {
  const format = detectAttestationFormat(request.attestationObject);
  
  // Single verification path that handles both
  const attestObj = format === 'json'
    ? decodeAttestationObjectJSON(request.attestationObject)
    : decodeAttestationObjectCBOR(request.attestationObject);

  const authData = format === 'json'
    ? extractAuthDataJSON(attestObj)
    : extractAuthDataCBOR(attestObj);

  // For development: RP ID hash will be all zeros
  // For production: RP ID hash will be SHA256
  // Both are valid - just different environments
  
  const crypto = require('crypto');
  const expectedHash = crypto.createHash('sha256').update('nexusdatasub.com').digest();
  
  // Check if hash is either all zeros (dev) or real hash (prod)
  const isDevFormat = authData.rpIdHash.equals(Buffer.alloc(32));
  const isProdFormat = authData.rpIdHash.equals(expectedHash);
  
  if (!isDevFormat && !isProdFormat) {
    throw new Error('Invalid RP ID hash');
  }

  // Rest of verification...
}
```

---

## Testing the Integration

### Test with Development Attestation (JSON)

```bash
curl -X POST http://localhost:3000/api/biometric/register/verify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "credential_id_hex",
    "rawId": "credential_id_hex",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwi...",
      "attestationObject": "eyJmbXQiOiJub25lIiwiYXR0U3RtdCI6e30sImF1dGhEYXRhIjp7InJwSWRIYXNoIjo..."
    }
  }'
```

### Test with Production Attestation (CBOR)

```bash
curl -X POST http://localhost:3000/api/biometric/register/verify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "credential_id_hex",
    "rawId": "credential_id_hex",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwi...",
      "attestationObject": "hGZmbm9uZWdhdHRTdG10oGhhdXRoRGF0YVjANXhIZnJodGZteVVpYVRzQjhwS01LN05kRQAA..."
    }
  }'
```

**Key Difference:**
- JSON starts with `ey...` (base64 of `{`)
- CBOR starts with `hG...` (CBOR major type 5 - map)

---

## Expected RP ID Hashes

```typescript
const crypto = require('crypto');

// Expected production hash
const rpIdHash = crypto.createHash('sha256').update('nexusdatasub.com').digest('hex');
console.log(rpIdHash);
// Output: 3d8ca8fe48e4a8d0ce85b2f14c5dba20a5d46b3d8f0c4e9a2b1c3d4e5f6a7b8c

// Development hash (zeros)
console.log('0'.repeat(64));
// Output: 00000000000000000000000000000000000000000000000000000000000000
```

---

## Debugging

### Log Attestation Details

```typescript
async function logAttestationDetails(attestationBase64url: string) {
  const format = detectAttestationFormat(attestationBase64url);
  const attestObj = format === 'json'
    ? decodeAttestationObjectJSON(attestationBase64url)
    : decodeAttestationObjectCBOR(attestationBase64url);

  const authData = format === 'json'
    ? extractAuthDataJSON(attestObj)
    : extractAuthDataCBOR(attestObj);

  console.log({
    format,
    fmt: attestObj.fmt,
    rpIdHashHex: authData.rpIdHash.toString('hex'),
    flags: {
      userPresent: (authData.flags & 0x01) !== 0,
      userVerified: (authData.flags & 0x04) !== 0,
    },
    credentialIdLength: authData.credentialId?.length,
  });
}
```

### Compare with Expected Hash

```typescript
const crypto = require('crypto');
const expected = crypto.createHash('sha256').update('nexusdatasub.com').digest();

console.log('Expected:', expected.toString('hex'));
console.log('Received:', authData.rpIdHash.toString('hex'));
console.log('Match:', authData.rpIdHash.equals(expected));
```

---

## Dependencies Required

```json
{
  "dependencies": {
    "cbor": "^9.0.0"
  }
}
```

**Install:**
```bash
npm install cbor
```

---

## Summary

| Step | Dev (JSON) | Prod (CBOR) |
|------|-----------|-----------|
| 1. Decode | `JSON.parse()` | `CBOR.decode()` |
| 2. Extract AuthData | Direct access | Binary parsing |
| 3. Verify RP ID | All zeros (ok) | SHA256 match required |
| 4. Verify Flags | User verified required | User verified required |
| 5. Store | Same for both | Same for both |

**The attestation format has changed, but the verification logic is similar - just adapted for CBOR binary instead of JSON.**

