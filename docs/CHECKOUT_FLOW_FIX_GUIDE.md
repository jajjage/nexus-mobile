# Checkout Flow Fix Guide

## Issues Fixed (Jan 22, 2026)

### 1. ✅ Price Calculation Simplified
**Before**: Used face value + supplier cost + markup (service fee)
**After**: Uses max(faceValue, supplierPrice)

No more service fee - much simpler calculation.

### 2. ✅ Biometric-First Payment Flow
**Priority Order**:
1. Check if user has biometric enabled (`user.hasBiometric`)
2. If yes, prompt biometric first
3. If biometric fails → show PIN modal
4. If user doesn't have biometric → show PIN modal directly
5. User can always add biometric later in profile/security/biometric

## Topup Request Format (For 404 Errors)

### Correct Format:
```typescript
interface TopupRequest {
  amount: number;              // Final payable amount (NOT face value)
  productCode: string;         // e.g., "MTN_100_AIRTIME"
  recipientPhone: string;      // e.g., "08012345678"
  pin?: string;                // 4-digit PIN (if using PIN)
  verificationToken?: string;  // Biometric token (if using biometric)
  supplierSlug?: string;       // e.g., "mtn-ng"
  supplierMappingId?: string;  // Supplier-specific ID
  useCashback?: boolean;       // Whether to use cashback
  offerId?: string;            // Active offer ID (optional)
}
```

### Example Valid Requests:

**With PIN:**
```json
{
  "amount": 100,
  "productCode": "MTN_100_AIRTIME",
  "recipientPhone": "08012345678",
  "pin": "1234",
  "supplierSlug": "mtn-ng",
  "supplierMappingId": "mtn_001",
  "useCashback": false
}
```

**With Biometric:**
```json
{
  "amount": 100,
  "productCode": "MTN_100_AIRTIME",
  "recipientPhone": "08012345678",
  "verificationToken": "eyJhbGciOiJIUzI1NiIs...",
  "supplierSlug": "mtn-ng",
  "supplierMappingId": "mtn_001",
  "useCashback": false
}
```

### Common 404 Issues:
1. **Missing recipientPhone** - Must be valid Nigerian number
2. **Invalid amount** - Must be > 0, should match product price
3. **Wrong endpoint** - Should be `/user/topup`, not `/topup` or `/api/topup`
4. **Missing productCode** - Required field from product
5. **Both PIN and token provided** - Use only one verification method

## Price Calculation Examples

### Example 1: Face value = 100, Supplier Price = 0
```
faceValue = 100
supplierCost = 0
payableAmount = max(100, 0) = 100
cashbackUsed = 0
payableAmount = 100 ✓
```

### Example 2: Face value = 100, Supplier Price = 95
```
faceValue = 100
supplierCost = 95
payableAmount = max(100, 95) = 100
cashbackUsed = 0
payableAmount = 100 ✓
```

### Example 3: Face value = 100, Supplier Price = 120, Cashback available = 50
```
faceValue = 100
supplierCost = 120
payableAmount = max(100, 120) = 120
cashbackUsed = min(50, 120) = 50
final payableAmount = 120 - 50 = 70 ✓
```

## Biometric Flow Improvements

### Setup Phase (First Time):
1. User completes setup wizard
2. Asked to enable biometric
3. If yes → `enable-biometric.tsx` handles enrollment
4. Updates `user.hasBiometric = true`
5. Stored in server + AuthContext

### Later Enrollment (Profile Screen):
1. User navigates to `profile/security/biometric`
2. Shows existing enrolled devices
3. **NEW**: "Add Biometric Device" button (to be implemented)
4. Clicking button → opens enrollment flow
5. Updates device list when complete

### Payment Flow:
1. User selects product and clicks checkout
2. `useCompletePaymentFlow` is called
3. `processPayment()` → checks `user.hasBiometric`
4. If true → attempts biometric verification first
5. If biometric fails → returns error, shows PIN modal
6. If user has no biometric → skips to PIN modal directly

## Implementation Status

| Feature | Status | File |
|---------|--------|------|
| Simplified price calc | ✅ DONE | `lib/price-calculator.ts` |
| Biometric-first flow | ✅ DONE | `hooks/useCompletePaymentFlow.ts` |
| PIN fallback | ✅ DONE | `lib/payment-flow.ts` |
| Add biometric in profile | ⏳ TODO | `app/(tabs)/profile/security/biometric.tsx` |
| Handle biometric skip | ✅ DONE | `app/(setup)/enable-biometric.tsx` |

## Testing Checklist

- [ ] Select data/airtime product
- [ ] Verify price shown is max(faceValue, supplierPrice)
- [ ] Proceed to checkout
- [ ] If user has biometric → biometric prompt appears first
- [ ] If biometric fails → PIN modal shows
- [ ] If user has no biometric → PIN modal shows directly
- [ ] Submit PIN successfully
- [ ] Verify topup request contains correct `amount`, `productCode`, `recipientPhone`
- [ ] Check response status is not 404

