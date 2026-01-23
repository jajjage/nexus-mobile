# Topup Request Format

## Endpoint
```
POST /user/topup
```

## Required Request Format

The topup request has this exact TypeScript interface:

```typescript
interface TopupRequest {
  amount: number;                    // Payable amount (max(faceValue, supplierPrice))
  productCode: string;               // Product code (e.g., "airtime_500")
  recipientPhone: string;            // Phone number to topup
  pin?: string;                      // Optional - use PIN OR verificationToken (not both)
  verificationToken?: string;        // Optional - use biometric token OR PIN (not both)
  supplierSlug?: string;             // Supplier identifier
  supplierMappingId?: string;        // Supplier mapping ID
  useCashback?: boolean;             // Whether to apply cashback
  offerId?: string;                  // Optional - offer ID if using discount
}
```

## CRITICAL Rules

1. **Exactly ONE verification method required:**
   - Either `pin` OR `verificationToken`
   - **NEVER both** at the same time
   - If both provided, backend should reject with error

2. **Amount calculation:**
   - `amount = max(product.faceValue, product.supplierPrice)`
   - No service fees
   - No markup percentage
   - Cashback handled separately after transaction

3. **Phone number format:**
   - Include country code or confirm backend format requirement
   - e.g., `2348012345678` (Nigeria) or `+2348012345678`

---

## Example Requests

### Example 1: Biometric Verification (Preferred)
```json
{
  "amount": 500,
  "productCode": "airtime_500",
  "recipientPhone": "2348012345678",
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "supplierSlug": "mtn_ng",
  "supplierMappingId": "mtn_mapping_001",
  "useCashback": true,
  "offerId": "offer_jan_2026"
}
```

### Example 2: PIN Verification (Fallback)
```json
{
  "amount": 500,
  "productCode": "airtime_500",
  "recipientPhone": "2348012345678",
  "pin": "1234",
  "supplierSlug": "mtn_ng",
  "supplierMappingId": "mtn_mapping_001",
  "useCashback": false
}
```

### Example 3: Minimal Request (No Offer/Cashback)
```json
{
  "amount": 500,
  "productCode": "airtime_500",
  "recipientPhone": "2348012345678",
  "pin": "1234"
}
```

---

## Where It's Built

**In `lib/payment-flow.ts`:**
```typescript
export function buildTopupRequest(
  baseRequest: Omit<TopupRequest, "pin" | "verificationToken">,
  verification: { pin?: string; verificationToken?: string }
): TopupRequest {
  // Ensures only one verification method
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

**In `hooks/useCompletePaymentFlow.ts`:**
```typescript
const baseRequest: Omit<TopupRequest, "pin" | "verificationToken"> = {
  amount: priceDetails.payableAmount,
  productCode: product.productCode,
  recipientPhone: phoneNumber,
  supplierSlug: product.supplierOffers?.[0]?.supplierSlug,
  supplierMappingId: product.supplierOffers?.[0]?.mappingId,
  useCashback: useCashback,
  offerId: product.activeOffer?.id,
};

const topupRequest = buildTopupRequest(baseRequest, {
  pin: pinToUse,
  verificationToken: verificationToken,
});
```

---

## Troubleshooting 404 Errors

If you're getting **404 on POST /user/topup**:

1. **Verify endpoint URL:**
   - Base URL: `process.env.EXPO_PUBLIC_AUTH_URL` (e.g., `http://10.152.118.138:3000/api/v1`)
   - Full endpoint: `{BASE_URL}/user/topup`

2. **Check request body:**
   - Ensure `amount` is a number (not string)
   - Ensure `recipientPhone` is valid format
   - Ensure `productCode` exists in backend
   - Ensure **exactly one** of `pin` or `verificationToken` is present

3. **Verify authentication:**
   - Request must include `Authorization: Bearer {accessToken}` header
   - Token is automatically added by `apiClient` interceptor
   - If 401, token may be expired

4. **Check server logs:**
   - Backend should log request details
   - Look for validation errors in request body
   - Verify productCode is valid in system

---

## API Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Topup successful",
  "data": {
    "transactionId": "txn_1234567890",
    "status": "success",
    "amount": 500,
    "balance": 4500,
    "timestamp": "2026-01-22T10:30:00Z"
  }
}
```

**Errors:**
```json
{
  "success": false,
  "message": "Invalid PIN",
  "statusCode": 400
}
```

---

## Testing Checklist

- [ ] Verify endpoint URL is correct: `/user/topup`
- [ ] Confirm amount is number type, not string
- [ ] Confirm recipientPhone format matches backend expectation
- [ ] Confirm productCode exists in backend
- [ ] Confirm request has only ONE of: `pin` or `verificationToken`
- [ ] Confirm Authorization header is being sent (check network tab)
- [ ] Test with Postman using valid token from secure storage
- [ ] Check backend logs for validation errors

