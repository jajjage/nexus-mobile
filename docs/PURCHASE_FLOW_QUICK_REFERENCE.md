
# Quick Reference: Purchase Flow Implementation

## 🚀 Quick Start for Developers

### 1. Display Price Breakdown in Checkout

```typescript
import { calculateFinalPrice } from "@/lib/price-calculator";

const priceDetails = calculateFinalPrice(product, useCashback, userCashbackBalance);

console.log(`Face Value: ₦${priceDetails.faceValue}`);
console.log(`Supplier Cost: ₦${priceDetails.supplierCost}`);
console.log(`Service Fee (${priceDetails.markupPercent}%): +₦${priceDetails.markup}`);
console.log(`Total: ₦${priceDetails.sellingPrice}`);
console.log(`After Cashback: ₦${priceDetails.payableAmount}`);
console.log(`Bonus Earning: +₦${priceDetails.bonusToEarn}`);
```

### 2. Process Complete Payment

```typescript
import { useCompletePaymentFlow } from "@/hooks/useCompletePaymentFlow";

const { processPayment, submitPIN } = useCompletePaymentFlow({
  onSuccess: (txId) => toast.success("Payment successful!"),
  onError: (err) => toast.error(err),
});

// Initiate payment (auto-handles biometric → PIN fallback)
const result = await processPayment({
  product: selectedProduct,
  phoneNumber: "08012345678",
  useCashback: true,
  userCashbackBalance: 5000,
});

// If PIN required:
if (!result.success && result.error?.includes("PIN")) {
  // Show PIN modal, then:
  await submitPIN({
    product: selectedProduct,
    phoneNumber: "08012345678",
    useCashback: true,
    pin: "1234",
    userCashbackBalance: 5000,
  });
}
```

### 3. Share Receipt with QR Code

```typescript
import { TransactionReceipt } from "@/components/purchase/TransactionReceipt";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

const receiptRef = useRef();

const transaction = {
  transactionId: "TXN-20260122-001",
  createdAt: new Date().toISOString(),
  product: "1GB Data",
  operator: "MTN",
  recipientPhone: "08012345678",
  amount: 250,
  cashbackUsed: 50,
  bonusEarned: 12,
  status: "success" as const,
};

const handleShare = async () => {
  const uri = await receiptRef.current?.capture?.();
  if (uri) {
    await Sharing.shareAsync(uri);
  }
};

return (
  <>
    <TransactionReceipt ref={receiptRef} transaction={transaction} />
    <Button onPress={handleShare} title="Share Receipt" />
  </>
);
```

---

## 🔐 Security

### PIN Never Logged
```typescript
// ❌ WRONG
console.log("[Payment] Submitting PIN:", pin); // DON'T DO THIS!

// ✅ CORRECT
console.log("[Payment] Submitting PIN:", pin ? "****" : "none");
```

### Biometric Verification Steps
1. ✅ Get challenge from `/biometric/auth/options`
2. ✅ Show biometric prompt locally (never send to server)
3. ✅ Send signed challenge to `/biometric/auth/verify`
4. ✅ Get verification token
5. ✅ Use token (or PIN) in `/user/topup`

---

## 📊 State Machine Transitions

```typescript
import { isValidTransition, transitionState } from "@/types/purchase-flow.types";

// Check if transition is valid
if (!isValidTransition("checkout", "processing-biometric")) {
  console.error("Invalid transition!");
}

// Safely transition
const newState = transitionState(currentState, "processing-transaction");
if (newState) {
  setFlowState(newState);
} else {
  console.error("Transition not allowed");
}
```

Valid paths:
```
idle → checkout → processing-biometric → processing-transaction → success
                → processing-pin → processing-transaction → success
success → idle
failed → checkout or idle
```

---

## 💰 Price Calculation Formula

```
Face Value: What user thinks they're buying (e.g., "₦100 airtime")
Supplier Cost: What we pay the supplier
Markup %: By supplier (MTN: 15%, Airtel: 12%, Glo: 10%, 9Mobile: 8%)
Service Fee: Supplier Cost × (Markup % / 100)
Selling Price: Supplier Cost + Service Fee

Cashback Used: min(user's cashback, Selling Price) if toggled
Payable Amount: Selling Price - Cashback Used

Bonus Earning: Selling Price × (Product's Cashback % / 100)
```

---

## 🧪 Common Scenarios

### Scenario 1: User has biometric
```
1. GET /biometric/auth/options → challenge
2. LocalAuthentication.authenticateAsync() ← user authenticates
3. POST /biometric/auth/verify → verification token
4. POST /user/topup (with verification token)
5. Success! ✅
```

### Scenario 2: Biometric fails
```
1. GET /biometric/auth/options → challenge
2. LocalAuthentication.authenticateAsync() ← fails ❌
3. Show PIN modal
4. User enters PIN
5. POST /user/topup (with PIN)
6. Success! ✅
```

### Scenario 3: No biometric enrolled
```
1. determinePaymentMethod() checks device
2. No hardware/enrollment detected
3. Show PIN modal directly
4. User enters PIN
5. POST /user/topup (with PIN)
6. Success! ✅
```

### Scenario 4: Insufficient balance
```
1. calculateFinalPrice() returns payableAmount
2. Check: payableAmount > userBalance → TRUE
3. Disable "Pay" button
4. Show error: "Insufficient balance. Need ₦X, have ₦Y"
5. User can "Top Up" or cancel
```

---

## 📱 UI Integration Points

### Checkout Modal
```tsx
<CheckoutModal
  data={checkoutData} // Must include: supplierCost, markup, markupPercent, faceValue
  mode="checkout"
  walletBalance={userBalance}
  cashbackBalance={cashbackBalance}
  useCashback={useCashback}
  onUseCashbackChange={setUseCashback}
  onConfirm={handleConfirmPayment}
  onClose={handleClose}
/>
```

### PIN Modal
```tsx
<PinPadModal
  isVisible={showPinModal}
  onSubmit={handlePinSubmit} // Receives pin: string
  onCancel={() => setShowPinModal(false)}
/>
```

### Receipt Share
```tsx
<TransactionReceipt
  ref={receiptRef}
  transaction={{
    transactionId: "TXN-123",
    createdAt: new Date().toISOString(),
    product: "1GB",
    operator: "MTN",
    recipientPhone: "0801...",
    amount: 250,
    status: "success",
  }}
/>
```

---

## ⚠️ Common Mistakes

❌ **Mistake 1**: Sending both PIN and biometric token
```typescript
// WRONG
await topup({ pin: "1234", verificationToken: "xyz" });

// CORRECT - send only one
await topup({ pin: "1234" }); // or
await topup({ verificationToken: "xyz" });
```

❌ **Mistake 2**: Not checking biometric hardware
```typescript
// WRONG
const result = await authenticate(); // May fail if hardware unavailable

// CORRECT
const support = await checkBiometricSupport();
if (support.hasHardware && support.isEnrolled) {
  const result = await authenticate();
}
```

❌ **Mistake 3**: Ignoring state machine
```typescript
// WRONG
state.step = "processing-transaction"; // Direct state mutation

// CORRECT
const newState = transitionState(state, "processing-transaction");
if (newState) setState(newState);
```

❌ **Mistake 4**: Not rolling back on error
```typescript
// WRONG
balance = balance - amount; // Will leave user in broken state if transaction fails

// CORRECT
// Let React Query handle optimistic updates
// It automatically rolls back on error
```

---

## 🔍 Debugging

### Enable Full Logging
All functions log with prefixes like `[PaymentFlow]`, `[PriceCalculator]`, `[AirtimeScreen]`

```bash
# Filter to payment flow only
console.log("Payment Flow");
// Search logs for: [PaymentFlow], [CompletePayment], [Biometric]
```

### Check Challenge Flow
1. Network tab: Look for `GET /biometric/auth/options` → see challenge
2. Local biometric triggers
3. Network tab: Look for `POST /biometric/auth/verify` → see token
4. Network tab: Look for `POST /user/topup` → see final transaction

### Price Debugging
```typescript
const calc = calculateFinalPrice(product, useCashback, cashback);
console.table(calc);
// Shows all components: faceValue, supplierCost, markup, etc.
```

---

## 📖 Related Files

- **Implementation Guide**: `docs/PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md`
- **Setup Flow Reference**: `docs/SETUP_FLOW_FIX.md`
- **Mobile Engineer Guide**: `docs/MOBILE_ENGINEER_GUIDE.md`
- **Airtime Screen**: `app/airtime.tsx`
- **Data Screen**: `app/data.tsx`

---

## ✅ Pre-Launch Checklist

- [ ] Price breakdown displays correctly in modal
- [ ] Biometric → PIN fallback works
- [ ] PIN submission completes transaction
- [ ] Receipt displays with QR code
- [ ] Share button works (opens native share)
- [ ] Optimistic balance updates
- [ ] Error messages are clear
- [ ] All state transitions valid
- [ ] No PIN logged to console
- [ ] Backend endpoints responding correctly

Ready for production! 🚀
