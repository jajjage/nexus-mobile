# Mobile Purchase Flow Guide (End-to-End)

This guide covers the **complete checkout lifecycle** for Airtime and Data purchases: from selecting a product, calculating cashback, verifying identity (Biometric/PIN), to handling success/failure states and sharing receipts.

---

## 1. High-Level Flow

```mermaid
graph TD
    A[Select Product] --> B[Open Checkout Modal]
    B --> C{User Confirms}
    C --> D[Close Checkout Modal]
    D --> E[Open Biometric Prompt]
    E -->|Success| F[Call API (with Token)]
    E -->|Unavailable/Failed| G[Open PIN Modal]
    G -->|PIN Entered| F[Call API (with PIN)]
    F -->|Processing| H[Show Loading State]
    H -->|Success| I[Show Success View (in Checkout Modal)]
    H -->|Error| J[Show Failure View (in Checkout Modal)]
    I --> K[Share Receipt]
    I --> L[Done (Reset)]
```

---

## 2. Product Selection

When a user taps a product card:
1.  **Validate Phone Number**: Ensure valid length (11 digits) and network match.
2.  **Calculate Markup & Offer**: Get supplier markup and check strictly for eligible offers.
3.  **Open Modal**: Set state `isCheckoutOpen(true)`.

```typescript
const handlePlanClick = (product: Product) => {
    // 1. Validation
    if (!phoneNumber || phoneNumber.length < 11) {
        toast.error("Enter valid phone number");
        return;
    }

    // 2. Network Check
    const detected = detectNetworkProvider(phoneNumber);
    if (detected && !product.operator.name.includes(detected)) {
        toast.error(`Mismatch: Number is ${detected}, plan is ${product.operator.name}`);
        return;
    }

    // 3. Set State
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
};
```

---

## 3. Checkout Modal (Pre-Purchase)

**Component:** `CheckoutModal`
**Purpose:** Review details and toggle cashback usage.

### 3.1 Cashback Logic
The user can toggle `useCashback` to pay part of the amount using their bonus balance.

```typescript
// Price Calculation Logic
const faceValue = parseFloat(product.denomAmount);
const supplierPrice = product.supplierOffers[0].supplierPrice;
const markup = markupMap.get(supplierId) || 0;

// Selling Price = SupplierPrice + Markup
const sellingPrice = supplierPrice + (supplierPrice * (markup / 100));

// Payable Amount Logic
const payableAmount = useCashback
  ? Math.max(0, sellingPrice - user.cashback.availableBalance)
  : sellingPrice;

// Bonus to Earn (if product has cashback)
const bonusToEarn = product.has_cashback
  ? sellingPrice * (product.cashback_percentage / 100)
  : 0;
```

### 3.2 UI Elements
*   **Header:** "Confirm Purchase"
*   **Hero Amount:** Large display of `payableAmount`.
*   **Discount Badge:** Strikethrough original price if `activeOffer` exists.
*   **Details List:** Product Name, Recipient, Wallet Balance.
*   **Cashback Switch:** "Use Cashback (₦500.00)" toggle.
*   **Pay Button:** Disabled if `balance < payableAmount`.

---

## 4. Security Verification Flow

We use a **Biometric-First** approach, falling back to **PIN** only if necessary.

### 4.1 Triggering Verification
When "Pay" is clicked:
1.  Close `CheckoutModal`.
2.  Store pending payment data (`useCashback`, `amount`).
3.  Open `BiometricModal`.

### 4.2 Biometric Step (Native)
Use `expo-local-authentication`.

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticate() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    // Fallback immediately
    setShowPinModal(true);
    return;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: `Authorize payment of ₦${amount}`,
    fallbackLabel: 'Use PIN',
  });

  if (result.success) {
    // Proceed with payment (using token if backend supports, or just flag)
    proceedWithPayment({ verificationToken: 'biometric-success' });
  } else if (result.error === 'user_fallback') {
    setShowPinModal(true);
  }
}
```

### 4.3 PIN Fallback Step
If biometrics fail or user chooses fallback:
1.  Open `PinVerificationModal`.
2.  **Input:** 4 separate digit inputs (auto-focus next, backspace support).
3.  **Auto-Submit:** When 4th digit is entered, call `onSuccess(pin)`.

---

## 5. API Integration

**Hook:** `useTopup()`
**Payload:** `TopupRequest`

```typescript
const topupMutation = useTopup();

const proceedWithPayment = (data) => {
    topupMutation.mutate({
        amount: parseFloat(product.denomAmount), // Always send face value
        productCode: product.productCode,
        recipientPhone: phoneNumber,
        supplierSlug: product.supplierOffers[0].supplierSlug,
        supplierMappingId: product.supplierOffers[0].mappingId,
        useCashback: data.useCashback,
        pin: data.pin, // Optional: if PIN verification used
        verificationToken: data.verificationToken, // Optional: if Biometric used
        offerId: selectedOfferId, // If offer applies
    }, {
        onSuccess: (response) => {
            setLastTransactionId(response.data.transactionId);
            setIsSuccess(true);
            setIsCheckoutOpen(true); // Re-open modal in SUCCESS state
        },
        onError: (error) => {
            setFailureMessage(error.message);
            setIsFailed(true);
            setIsCheckoutOpen(true); // Re-open modal in FAILED state
        }
    });
}
```

### Optimistic Updates
The `useTopup` hook should optimistically deduct from the user's local balance cache to make the app feel instant.

---

## 6. Result Handling (Success / Failed)

The **CheckoutModal** acts as the result container. It has 3 states: `default`, `success`, `failed`.

### 6.1 Success State
*   **Icon:** Animated Green Checkmark (`lucide-react` / `Lottie`).
*   **Message:** "Airtime Purchase Successful!"
*   **Details:** "₦100 airtime sent to 08012345678".
*   **Actions:**
    *   **Share Receipt:** Opens `ShareTransactionDialog` (using `lastTransactionId`).
    *   **Done:** Closes modal and resets state.

### 6.2 Failed State
*   **Icon:** Red X Circle.
*   **Message:** "Transaction Failed".
*   **Reason:** "Insufficient funds" or "Provider error" (from API).
*   **Actions:**
    *   **Try Again:** Retries the flow (opens Biometric modal again).
    *   **Close:** Dismisses modal.

---

## 7. Native Implementation Checklist

| Feature | Library Recommendation | Implementation Note |
|---------|------------------------|---------------------|
| **Modal** | `react-native-modal` or `gorhom/bottom-sheet` | Use Bottom Sheet for smooth mobile feel. |
| **Biometrics** | `expo-local-authentication` | Handle `user_fallback` error to trigger PIN. |
| **PIN Input** | Custom Views | Use 4 `TextInput`s or a hidden input overlay. |
| **Animations** | `react-native-reanimated` | Fade/Slide transitions between modal states. |
| **Haptics** | `expo-haptics` | `Haptics.notificationAsync` on success/error. |
| **Toast** | `react-native-toast-message` | Show "Order Placed" notification. |

### Component Structure Suggestion (Expo)

```tsx
// PaymentFlowManager.tsx
// Wraps the logic for modals to keep screens clean

export function PaymentFlowManager({ product, phoneNumber, onClose }) {
  const [step, setStep] = useState<'checkout' | 'biometric' | 'pin' | 'success' | 'failed'>('checkout');

  // ... implementation of state machine ...

  return (
    <>
      <CheckoutBottomSheet
        isOpen={step === 'checkout'}
        product={product}
        onConfirm={() => setStep('biometric')}
      />

      {/* Native Biometric is imperative, not a UI component */}

      <PinModal
        isOpen={step === 'pin'}
        onSuccess={(pin) => callApi(pin)}
      />

      <SuccessModal
        isOpen={step === 'success'}
        onShare={shareReceipt}
      />
    </>
  );
}
```
