# Biometric-First Payment Flow - Complete Implementation

## Overview

The payment flow is now **biometric-first with PIN fallback**. Users who skipped biometric setup during onboarding can still enroll later in the profile settings.

---

## Flow Diagram

```
User Initiates Purchase (Airtime/Data)
│
├─→ Checkout Modal Shows Amount & Confirm Button
│   └─→ User confirms payment
│
├─→ CHECK: Does user have biometric enabled? (user.hasBiometric)
│   │
│   ├─ YES (user.hasBiometric === true)
│   │  │
│   │  ├─→ CHECK: Does device support biometric hardware?
│   │  │  │
│   │  │  ├─ YES
│   │  │  │  └─→ REQUEST Biometric Challenge from backend
│   │  │  │      └─→ Prompt user for biometric (FaceID/TouchID)
│   │  │  │          ├─ SUCCESS → Get verificationToken
│   │  │  │          │  └─→ Submit Topup Request with verificationToken
│   │  │  │          │
│   │  │  │          └─ FAILED → Show "Use PIN Instead"
│   │  │  │             └─→ Show PIN Modal
│   │  │  │
│   │  │  └─ NO (no hardware/not enrolled)
│   │  │     └─→ Show PIN Modal
│   │  │
│   │  └─→ TRANSACTION RESULT (Success/Failure)
│   │
│   └─ NO (user.hasBiometric === false OR null)
│      │
│      └─→ Show PIN Modal (User skipped biometric setup)
│         └─→ User enters 4-digit PIN
│            └─→ Submit Topup Request with PIN
│               └─→ TRANSACTION RESULT (Success/Failure)
│
└─→ Show Success Screen with Transaction Details
    └─→ User can download receipt or go back
```

---

## Code Components

### 1. Payment Flow Hook (`hooks/useCompletePaymentFlow.ts`)

**Handles the entire waterfall:**

```typescript
export function useCompletePaymentFlow(options: PaymentFlowHookOptions) {
  const processPayment = useCallback(
    async (args: {
      product: Product;
      phoneNumber: string;
      useCashback: boolean;
      pin?: string;
    }) => {
      // Step 1: Validate purchase
      // Step 2: Calculate price (simplified: max(faceValue, supplierPrice))
      // Step 3: Check payment method
      if (!pin) {
        const paymentMethod = await determinePaymentMethod(
          user?.hasBiometric || false  // ← THIS IS THE KEY CHECK
        );
        
        if (paymentMethod === "biometric") {
          // Try biometric
          verificationToken = await verifyBiometricAndGetToken();
        } else {
          // Return error asking for PIN modal
          return { success: false, error: "PIN verification required" };
        }
      }
      
      // Step 4: Build topup request with verification method
      const topupRequest = buildTopupRequest(baseRequest, {
        pin: pinToUse,
        verificationToken: verificationToken,
      });
      
      // Step 5: Submit
      await topupMutation.mutateAsync(topupRequest);
      return { success: true };
    },
    [user?.hasBiometric] // ← Reactive to user.hasBiometric changes
  );
}
```

### 2. Payment Method Determination (`lib/payment-flow.ts`)

```typescript
export async function determinePaymentMethod(
  userHasBiometric: boolean
): Promise<"biometric" | "pin" | null> {
  if (userHasBiometric) {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      return "biometric"; // Try biometric
    }
  }
  
  return "pin"; // Fallback to PIN
}
```

### 3. Biometric Verification (`lib/payment-flow.ts`)

```typescript
export async function verifyBiometricAndGetToken(): Promise<string> {
  // 1. Get challenge from backend
  const { challenge, rpId } = await getBiometricChallenge();
  
  // 2. Check hardware & enrollment
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  // 3. Prompt user
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to complete payment",
    fallbackLabel: "Use PIN Instead",
  });
  
  if (!result.success) throw new Error("Biometric failed");
  
  // 4. Verify with backend
  const verifyResponse = await apiClient.post(
    "/biometric/auth/verify",
    assertionResponse
  );
  
  return verifyResponse.data.data.verificationToken;
}
```

### 4. Topup Request Building (`lib/payment-flow.ts`)

```typescript
export function buildTopupRequest(
  baseRequest: Omit<TopupRequest, "pin" | "verificationToken">,
  verification: { pin?: string; verificationToken?: string }
): TopupRequest {
  // Ensure only ONE verification method
  const request: TopupRequest = {
    ...baseRequest,
  };
  
  if (verification.verificationToken) {
    request.verificationToken = verification.verificationToken;
  } else if (verification.pin) {
    request.pin = verification.pin;
  } else {
    throw new Error("No verification method provided");
  }
  
  return request;
}
```

### 5. Purchase Screen Implementation (`app/airtime.tsx`)

**Key parts:**

```typescript
// Initiate payment (tries biometric first)
const handleConfirmPayment = useCallback(async () => {
  const result = await processPayment({
    product: selectedProduct,
    phoneNumber: normalizedPhone,
    useCashback,
    userCashbackBalance: cashbackBalance,
  });
  
  // If biometric failed or PIN required, show PIN modal
  if (!result.success && result.error?.includes("PIN")) {
    setShowPinModal(true); // ← Show PIN input
  }
}, [...]);

// Submit PIN after biometric fails
const handlePinSubmit = useCallback(async (pin: string) => {
  const result = await submitPIN({
    product: pendingPaymentData.product,
    phoneNumber: pendingPaymentData.phoneNumber,
    useCashback: pendingPaymentData.useCashback,
    pin: pin, // ← PIN provided, skip biometric
    userCashbackBalance: cashbackBalance,
  });
}, [...]);
```

---

## User Scenarios

### Scenario 1: User Has Biometric (Enrolled During Setup)

1. **Starts purchase** → Amount confirmation screen
2. **Taps Confirm** → Payment flow initiated
3. **User check**: `user.hasBiometric === true` ✓
4. **System checks**: Device has hardware? Yes. Enrolled? Yes.
5. **Prompts**: "Authenticate to complete payment"
6. **User**: Taps biometric (FaceID/TouchID)
7. **Success**: Backend verifies → `verificationToken` received
8. **Request sent**: 
   ```json
   {
     "amount": 500,
     "productCode": "airtime_500",
     "recipientPhone": "2348012345678",
     "verificationToken": "eyJhbGc...",
     "supplierSlug": "mtn_ng"
   }
   ```
9. **Result**: Transaction success → Show receipt

### Scenario 2: User Skipped Biometric Setup, Doesn't Have Device Hardware

1. **Starts purchase** → Amount confirmation screen
2. **Taps Confirm** → Payment flow initiated
3. **User check**: `user.hasBiometric === false` OR `null`
4. **System checks**: Skip biometric (user opted out)
5. **Shows**: PIN input modal
6. **User**: Enters 4-digit PIN
7. **Request sent**:
   ```json
   {
     "amount": 500,
     "productCode": "airtime_500",
     "recipientPhone": "2348012345678",
     "pin": "1234",
     "supplierSlug": "mtn_ng"
   }
   ```
8. **Result**: Transaction success → Show receipt

### Scenario 3: User Has Biometric But Biometric Fails

1. **Starts purchase** → Amount confirmation screen
2. **Taps Confirm** → Payment flow initiated
3. **User check**: `user.hasBiometric === true` ✓
4. **Prompts**: "Authenticate to complete payment"
5. **User**: Failed biometric attempt (wrong fingerprint, etc.)
6. **Error**: "Biometric authentication failed"
7. **Shows**: PIN input modal as fallback
8. **User**: Enters 4-digit PIN
9. **Request sent**: Same as Scenario 2 (with PIN instead)
10. **Result**: Transaction success → Show receipt

### Scenario 4: User Skipped Biometric, Now Wants to Enroll

1. **User goes to**: Profile → Security → Biometric Devices
2. **Screen shows**: "No devices registered yet"
3. **Button visible**: "Add Biometric Device"
4. **User taps**: Button
5. **System**:
   - Checks device support
   - Prompts for biometric enrollment
   - Sends to backend for storage
6. **Success**: `user.hasBiometric = true` updated in context
7. **Result**: 
   - User can now use biometric for future payments
   - Next purchase will attempt biometric first
   - Device listed on biometric screen

---

## Backend Integration

### API Endpoints Required

1. **GET /biometric/auth/options**
   - Returns: `{ challenge, rpId, allowCredentials }`
   - When: Before biometric prompt

2. **POST /biometric/auth/verify**
   - Input: Assertion response from local auth
   - Returns: `{ verificationToken }`
   - When: After local biometric auth succeeds

3. **POST /user/topup**
   - Input: TopupRequest (with `pin` OR `verificationToken`)
   - Returns: `{ transactionId, status, balance }`
   - When: Final transaction submission

4. **POST /user/verify-pin** (Optional)
   - Input: `{ pin }`
   - Returns: `{ verified: boolean }`
   - When: PIN pre-validation (can be skipped)

5. **POST /biometric/auth/enroll**
   - Input: Enrollment data
   - Returns: `{ enrolled: true, enrollmentId }`
   - When: User enrolls from profile screen

---

## State Management

### AuthContext (`context/AuthContext.tsx`)

```typescript
interface User {
  id: string;
  email: string;
  phone: string;
  hasBiometric: boolean;  // ← KEY FIELD
  hasPin: boolean;
  balance: number;
  cashback?: { availableBalance: number };
  // ...other fields
}
```

- **Persisted to**: AsyncStorage
- **Updated via**: 
  - Login response (from backend)
  - `updateUser()` after biometric enrollment
  - `setUser(null)` on logout

### useAuth Hook (`hooks/useAuth.ts`)

```typescript
const { user } = useAuth(); // ← user.hasBiometric is reactive
```

- Fetches latest user profile on mount
- Handles token validation & refresh
- Clears on 401/403
- **Important**: Tokens persisted in SecureStore (separate from user data)

---

## Testing Checklist

### Setup Phase Tests
- [ ] User completes setup with biometric enrollment
  - [ ] `user.hasBiometric === true` after setup
  - [ ] Biometric device appears on profile/security/biometric screen
  
- [ ] User skips biometric during setup
  - [ ] `user.hasBiometric === false` or not set
  - [ ] PIN enrollment still required

### Payment Flow Tests - With Biometric
- [ ] Start purchase with biometric enabled user
  - [ ] Biometric prompt appears
  - [ ] Successful biometric → transaction with verificationToken
  - [ ] Failed biometric → PIN modal appears
  
- [ ] Test on device without biometric hardware
  - [ ] System detects no hardware
  - [ ] Falls back to PIN immediately

### Payment Flow Tests - Without Biometric
- [ ] Start purchase with biometric disabled user
  - [ ] PIN modal appears immediately
  - [ ] Transaction with PIN proceeds

### Post-Setup Biometric Enrollment
- [ ] User goes to Profile → Security → Biometric
  - [ ] "Add Biometric Device" button visible (if no devices)
  - [ ] Biometric enrollment flow works
  - [ ] `user.hasBiometric === true` after successful enrollment
  - [ ] Next purchase attempt shows biometric prompt

### Edge Cases
- [ ] User has biometric but it becomes unavailable (soft lock)
  - [ ] Unlock with biometric → payment with biometric still works
  - [ ] No logout on background (token still valid)

- [ ] Multiple devices enrolled
  - [ ] All devices listed on profile
  - [ ] Can remove individual devices
  - [ ] Remaining device still used for payments

- [ ] Biometric changes on device (e.g., added new fingerprint)
  - [ ] Old device still works
  - [ ] Verification count increments

---

## Common Issues & Fixes

### Issue: Biometric prompt appears but does nothing

**Cause**: `LocalAuthentication.authenticateAsync` not getting proper config

**Fix**: Ensure prompt message is provided:
```typescript
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: "Authenticate to complete payment",
  fallbackLabel: "Use PIN Instead",
  disableDeviceFallback: false,
});
```

### Issue: Transaction fails with verificationToken

**Cause**: Biometric verification token not properly formatted or expired

**Fix**: 
- Token returned immediately from backend, don't cache
- Must be used within same session
- Check backend logs for WebAuthn verification errors

### Issue: User logs out after soft lock unlock

**Cause**: OLD - AuthContext was checking tokens and clearing user on mount

**Fix**: RESOLVED - AuthContext now only loads persisted user data, token validation is lazy (happens when API calls made)

### Issue: PIN modal doesn't appear after biometric fails

**Cause**: Error message doesn't include "PIN"

**Fix**: Check error message handling in `handleConfirmPayment`:
```typescript
if (!result.success && result.error?.includes("PIN")) {
  setShowPinModal(true);
}
```

---

## Files Modified/Created

- `hooks/useCompletePaymentFlow.ts` - Main payment orchestration
- `lib/payment-flow.ts` - Biometric verification logic
- `app/airtime.tsx` - Purchase screen with biometric-first flow
- `app/data.tsx` - Same as airtime for data purchases
- `app/(tabs)/profile/security/biometric.tsx` - Biometric device management + enrollment
- `context/AuthContext.tsx` - User state with hasBiometric field
- `types/topup.types.ts` - TopupRequest interface

---

## Summary

✅ **Biometric-first payment flow fully implemented**:
1. User with biometric → attempts biometric first
2. Biometric fails or unavailable → PIN fallback
3. User without biometric → PIN directly
4. Users who skipped setup can enroll anytime in profile
5. After enrollment, biometric becomes first attempt
6. No logout during soft lock background/unlock
7. Tokens properly managed in SecureStore
8. User state properly managed in AsyncStorage

