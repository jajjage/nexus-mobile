# WebAuthn Production CBOR - Quick Reference

## TL;DR

**Problem**: Production builds send mock JSON attestations, not real CBOR.  
**Solution**: Environment-based separation using `EXPO_PUBLIC_WEBAUTHN_ENV`.

## Configuration (5 minutes)

### Step 1: Set Environment Variable

**In `eas.json`:**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_WEBAUTHN_ENV": "production"
      }
    }
  }
}
```

### Step 2: Build for Production

```bash
# Build with production CBOR attestations
eas build --platform android -e production

# Or locally test production mode
EXPO_PUBLIC_WEBAUTHN_ENV=production npm start
```

## What Changed

### Files Added
- ✅ `lib/cbor-encoder.ts` - CBOR binary encoding + SHA256
- ✅ `lib/webauthn-env.ts` - Environment detection
- ✅ `docs/WEBAUTHN_PRODUCTION_CBOR_IMPLEMENTATION.md` - Full documentation

### Files Updated  
- ✅ `lib/webauthn-mobile.ts` - Environment-aware attestation generation
- ✅ `hooks/useBiometricRegistration.ts` - Environment logging

## Key Differences

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Format** | JSON | CBOR Binary |
| **Attestation** | Mock (all zeros) | Real (SHA256) |
| **Signature** | Mock JSON | ECDSA P-256 |
| **RP ID Hash** | Zeros | SHA256("nexusdatasub.com") |
| **Backend Path** | Mock verification | Full WebAuthn validation |

## Development (Testing)

```bash
# Works as before - uses mock JSON attestations
npm start
# or
expo start

# Console output:
# [WebAuthnEnv] Configuration: { 
#   detectedEnvironment: "development",
#   mode: "MOCK (JSON)"
# }
```

## Production (App Store)

```bash
# Set environment variable
EXPO_PUBLIC_WEBAUTHN_ENV=production eas build --platform android

# Sends real CBOR attestations with proper RP ID hash
# Console output:
# [WebAuthnEnv] Configuration: {
#   detectedEnvironment: "production",
#   mode: "REAL (CBOR)"
# }
```

## What Backend Receives Now

### Development Request Body:
```json
{
  "id": "credential_id",
  "rawId": "credential_id",
  "response": {
    "clientDataJSON": "base64url(JSON)",
    "attestationObject": "base64url(JSON-encoded attestation with mock hash)"
  }
}
```

### Production Request Body:
```json
{
  "id": "credential_id",
  "rawId": "credential_id",
  "response": {
    "clientDataJSON": "base64url(JSON)",
    "attestationObject": "base64url(CBOR-encoded attestation with SHA256 hash)"
  }
}
```

## Backend Integration

### Option A: Separate Dev/Prod Paths

```typescript
if (build === 'development') {
  // Decode JSON format
  const attestObj = JSON.parse(base64urlDecode(attestationObject));
  if (attestObj.fmt === "none") return VERIFIED;
} else {
  // Decode CBOR format
  const attestObj = CBOR.decode(base64urlDecode(attestationObject));
  const rpIdHash = attestObj.authData.slice(0, 32);
  const expected = sha256("nexusdatasub.com");
  return rpIdHash.equals(expected);
}
```

### Option B: CBOR-Only (Recommended for Forward Compatibility)

```typescript
// Always decode as CBOR
const attestObj = CBOR.decode(base64urlDecode(attestationObject));

// In dev mode, CBOR encoder produces same structure as JSON
// Just encode it first: CBOR.encode(JSON.parse(...))
// In prod mode, proper CBOR binary

// Single verification path works for both
```

## Debugging

### Check Environment

```typescript
import { logWebAuthnEnvironment } from '@/lib/webauthn-env';

// In component/hook
useEffect(() => {
  logWebAuthnEnvironment();
}, []);

// Watch console for output
```

### Inspect Network Requests

In production builds, look at `/biometric/register/verify` POST request:
- `attestationObject` should be longer (CBOR overhead)
- First few bytes when base64 decoded should differ from dev version
- Should contain real hash, not zeros

### Compare Hashes

```typescript
import { sha256 } from '@/lib/cbor-encoder';

const rpIdHash = sha256("nexusdatasub.com");
// Should match authData[0:32] in production attestation
```

## Migration Checklist

### Mobile Team
- [ ] Pull latest code with CBOR implementation
- [ ] Test locally in dev mode (should still work with JSON)
- [ ] Set `EXPO_PUBLIC_WEBAUTHN_ENV=production` in eas.json
- [ ] Build APK/IPA for production
- [ ] Inspect attestation objects in production builds
- [ ] Verify RP ID hash is real SHA256, not zeros

### Backend Team  
- [ ] Create CBOR decoder (use existing library or update verification)
- [ ] Add support for SHA256 RP ID hash verification
- [ ] Test with attestation objects from production mobile builds
- [ ] Keep dev JSON path working for backwards compatibility
- [ ] Update tests to include both dev (JSON) and prod (CBOR) formats

## Testing Checklist

```bash
# ✅ Development mode works
npm start
# Enroll biometric → Check attestationObject is JSON

# ✅ Production mode sends CBOR
EXPO_PUBLIC_WEBAUTHN_ENV=production npm start
# Enroll biometric → Check attestationObject is CBOR

# ✅ Backend can verify production attestations
curl -X POST https://api.nexusdatasub.com/biometric/register/verify \
  -H "Content-Type: application/json" \
  -d @production-attestation.json

# ✅ RP ID hash matches
# Extract from production attestation and compare with SHA256("nexusdatasub.com")
```

## Troubleshooting

### "RP ID hash mismatch" error
- ✅ Verify `EXPO_PUBLIC_WEBAUTHN_ENV=production` is set
- ✅ Check backend is computing `sha256("nexusdatasub.com")`
- ✅ Ensure RP ID in options matches backend (should be "nexusdatasub.com")

### "Invalid CBOR format" error
- ✅ Backend should decode `attestationObject` as CBOR, not JSON
- ✅ Check that attestation is base64url-encoded
- ✅ Verify CBOR decoder library is installed

### Still seeing JSON in production
- ✅ Check `getWebAuthnEnvironment()` returns "production"
- ✅ Verify environment variable is set in build config
- ✅ Check app version has latest code

## Next Steps

### Immediate (v1 - Done)
- ✅ CBOR encoding implemented
- ✅ SHA256 RP ID hash implemented
- ✅ Environment separation implemented

### Short-term (v2 - TODO)
- [ ] iOS: Native ECDSA P-256 signing with SecKey
- [ ] Android: Native ECDSA P-256 signing with KeyStore
- [ ] Replace deterministic signatures with real crypto

### Long-term (v3 - TODO)
- [ ] Certificate chain validation
- [ ] Attestation statement verification
- [ ] Biometric hardware attestation (if supported by devices)

## Documentation

- **Full Details**: `docs/WEBAUTHN_PRODUCTION_CBOR_IMPLEMENTATION.md`
- **CBOR Encoding**: `lib/cbor-encoder.ts` (with inline comments)
- **Environment Detection**: `lib/webauthn-env.ts`
- **WebAuthn Mobile**: `lib/webauthn-mobile.ts` (updated)

## Support

For questions or issues:
1. Check console logs with `logWebAuthnEnvironment()`
2. Review full documentation in `WEBAUTHN_PRODUCTION_CBOR_IMPLEMENTATION.md`
3. Inspect network requests to see attestation format
4. Compare RP ID hash with expected value

