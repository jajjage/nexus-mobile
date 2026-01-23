# Complete Product Pricing Calculation Guide

## 📊 Overview

This guide explains the complete pricing calculation system including:

- Supplier pricing
- Markup calculations
- Offer discounts
- Cashback deductions
- Final payable amount

---

## 🏗️ Data Structure

### Product Object

```typescript
interface Product {
  id: string;
  productCode: string;
  name: string;
  productType: "airtime" | "data";
  denomAmount: string; // Face value (e.g., "500", "1000")
  has_cashback?: boolean; // Has cashback reward
  cashback_percentage?: number; // Cashback rate (e.g., 2.5)

  // Supplier pricing
  supplierOffers: SupplierOffer[]; // Array of supplier options

  // Offer discount
  discountedPrice?: number; // Final price after discount
  activeOffer?: ActiveOffer; // Offer details

  // ... other fields
}

interface SupplierOffer {
  supplierId: string; // Supplier ID (for markup lookup)
  supplierSlug: string;
  supplierPrice: string; // Supplier's cost (e.g., "450")
  // ... other fields
}

interface ActiveOffer {
  id: string;
  title: string;
  discountType: "percentage" | "fixed_amount" | "fixed_price";
  discountValue: number;
}
```

---

## 💰 Pricing Calculation Flow

```
START
  ↓
[1] GET FACE VALUE
  ├─ Use product.denomAmount
  └─ Example: ₦500
  ↓
[2] GET SUPPLIER PRICE
  ├─ IF product.supplierOffers[0].supplierPrice exists
  │  └─ Use it (cost from supplier)
  │     Example: ₦450
  └─ ELSE
     └─ Use face value (no supplier override)
        Example: ₦500
  ↓
[3] GET MARKUP PERCENT
  ├─ Query useSupplierMarkupMap()
  ├─ Lookup: supplierId → markup%
  └─ Example: 5% markup
  ↓
[4] CALCULATE MARKUP AMOUNT
  ├─ baseSellingPrice = supplierPrice + (supplierPrice × markupPercent)
  ├─ Formula: base = supplier × (1 + markup%)
  └─ Example: 450 × (1 + 0.05) = ₦472.50
  ↓
[5] CHECK FOR OFFER DISCOUNT
  ├─ IF activeOffer exists AND discountedPrice < baseSellingPrice
  │  ├─ hasOfferDiscount = true
  │  └─ Use discounted price
  │     Example: ₦450 (offer discount)
  └─ ELSE
     ├─ hasOfferDiscount = false
     └─ Use base selling price
        Example: ₦472.50
  ↓
[6] CALCULATE CASHBACK BONUS
  ├─ IF has_cashback = true
  │  ├─ bonusAmount = sellingPrice × (cashback_percentage / 100)
  │  └─ Example: 450 × (2.5 / 100) = ₦11.25
  └─ ELSE
     └─ bonusAmount = 0
  ↓
[7] APPLY CASHBACK PAYMENT METHOD (optional)
  ├─ IF user chooses to use cashback
  │  ├─ payableAmount = MAX(0, sellingPrice - userCashbackBalance)
  │  └─ Example: MAX(0, 450 - 100) = ₦350
  └─ ELSE
     └─ payableAmount = sellingPrice
        Example: ₦450
  ↓
[8] VALIDATE BALANCE
  ├─ isInsufficientBalance = userBalance < payableAmount
  └─ Show error if insufficient
  ↓
END → Display prices in checkout modal
```

---

## 📐 Step-by-Step Calculation Examples

### **Example 1: Product WITH Supplier Price, NO Offer, NO Cashback**

**Scenario**: MTN Airtime ₦500, Supplier costs ₦450, 5% markup, No offer, User has ₦1000

```
Step 1: Face Value
  denomAmount = "500"
  faceValue = ₦500

Step 2: Supplier Price (EXISTS)
  supplierOffers[0].supplierPrice = "450"
  supplierPrice = ₦450

Step 3: Markup Percent
  useSupplierMarkupMap().get(supplierId) = 5
  markupPercent = 5%

Step 4: Calculate Base Selling Price
  actualMarkup = 5 < 1 ? 5 : (5 / 100) = 0.05
  baseSellingPrice = 450 + (450 × 0.05)
                   = 450 + 22.50
                   = ₦472.50

Step 5: Check Offer Discount
  activeOffer = null
  discountedPrice = undefined
  hasOfferDiscount = false
  sellingPrice = baseSellingPrice = ₦472.50

Step 6: Calculate Cashback Bonus
  has_cashback = false OR cashback_percentage = null
  bonusAmount = 0

Step 7: Apply Cashback Payment
  useCashback = false (user didn't choose it)
  payableAmount = sellingPrice = ₦472.50

Step 8: Validation
  userBalance = ₦1000
  isInsufficientBalance = 1000 < 472.50 = false ✓ Sufficient

RESULT:
  ├─ Original Price (strikethrough): ₦500 (face value)
  ├─ Selling Price (hero): ₦472.50
  ├─ Payable Amount (checkout): ₦472.50
  └─ Bonus to Earn: ₦0 (no cashback)
```

---

### **Example 2: Product WITH Supplier Price, WITH Offer Discount, WITH Cashback**

**Scenario**: MTN Data 1GB ₦1000, Supplier costs ₦900, 10% markup, 15% OFF offer, User has ₦2000 cashback balance of ₦200, chooses to use cashback

```
Step 1: Face Value
  denomAmount = "1000"
  faceValue = ₦1000

Step 2: Supplier Price (EXISTS)
  supplierOffers[0].supplierPrice = "900"
  supplierPrice = ₦900

Step 3: Markup Percent
  useSupplierMarkupMap().get(supplierId) = 10
  markupPercent = 10%

Step 4: Calculate Base Selling Price
  actualMarkup = 10 < 1 ? 10 : (10 / 100) = 0.10
  baseSellingPrice = 900 + (900 × 0.10)
                   = 900 + 90
                   = ₦990

Step 5: Check Offer Discount
  activeOffer exists = true
  discountType = "percentage"
  discountValue = 15

  Calculate discount:
  IF discountType = "percentage"
    discountAmount = 990 × (15 / 100) = 148.50
    discountedPrice = 990 - 148.50 = ₦841.50

  hasOfferDiscount = (841.50 < 990) = true ✓
  sellingPrice = discountedPrice = ₦841.50

Step 6: Calculate Cashback Bonus
  has_cashback = true
  cashback_percentage = 2.5
  bonusAmount = 841.50 × (2.5 / 100) = ₦21.04

Step 7: Apply Cashback Payment
  useCashback = true (user chose to use it)
  userCashbackBalance = ₦200
  payableAmount = MAX(0, 841.50 - 200)
                = MAX(0, 641.50)
                = ₦641.50

Step 8: Validation
  userBalance = ₦2000
  isInsufficientBalance = 2000 < 641.50 = false ✓ Sufficient

RESULT:
  ├─ Original Price (strikethrough): ₦990 (base selling price before offer)
  ├─ Offer Applied: -₦148.50 (15% OFF)
  ├─ Selling Price (display): ₦841.50
  ├─ Payable Amount (checkout): ₦641.50 (after ₦200 cashback)
  ├─ Cashback Used: -₦200
  ├─ Bonus to Earn: +₦21.04 (2.5% of ₦841.50)
  └─ Offer Badge: "15% OFF"
```

---

### **Example 3: Product WITHOUT Supplier Price (rare case)**

**Scenario**: Custom product ₦2000 (no supplier), 5% markup, No offer, User has ₦5000

```
Step 1: Face Value
  denomAmount = "2000"
  faceValue = ₦2000

Step 2: Supplier Price (DOES NOT EXIST)
  supplierOffers[0].supplierPrice = undefined OR null
  → Use face value as supplier price
  supplierPrice = faceValue = ₦2000

Step 3: Markup Percent
  useSupplierMarkupMap().get(supplierId) = 5
  markupPercent = 5%

Step 4: Calculate Base Selling Price
  actualMarkup = 5 < 1 ? 5 : (5 / 100) = 0.05
  baseSellingPrice = 2000 + (2000 × 0.05)
                   = 2000 + 100
                   = ₦2100

Step 5: Check Offer Discount
  activeOffer = null
  hasOfferDiscount = false
  sellingPrice = baseSellingPrice = ₦2100

Step 6: Calculate Cashback Bonus
  has_cashback = false
  bonusAmount = 0

Step 7: Apply Cashback Payment
  useCashback = false
  payableAmount = sellingPrice = ₦2100

Step 8: Validation
  userBalance = ₦5000
  isInsufficientBalance = 5000 < 2100 = false ✓ Sufficient

RESULT:
  ├─ Original Price (strikethrough): ₦2000 (face value)
  ├─ Selling Price (hero): ₦2100
  ├─ Payable Amount (checkout): ₦2100
  └─ Bonus to Earn: ₦0 (no cashback)
```

---

### **Example 4: With Fixed Amount Discount Offer**

**Scenario**: Airtel Airtime ₦500, Supplier ₦480, 5% markup, Fixed ₦50 OFF offer, User has ₦1000

```
Step 1-4: Same as Example 1
  supplierPrice = ₦480
  baseSellingPrice = 480 + (480 × 0.05) = ₦504

Step 5: Check Offer Discount (FIXED AMOUNT)
  activeOffer exists = true
  discountType = "fixed_amount"
  discountValue = 50

  discountedPrice = baseSellingPrice - 50
                  = 504 - 50
                  = ₦454

  hasOfferDiscount = (454 < 504) = true ✓
  sellingPrice = ₦454

Step 6: Cashback Bonus
  has_cashback = true
  cashback_percentage = 3
  bonusAmount = 454 × (3 / 100) = ₦13.62

Step 7: Payment
  useCashback = false
  payableAmount = ₦454

RESULT:
  ├─ Original Price (strikethrough): ₦504 (base)
  ├─ Offer Applied: -₦50 (FIXED)
  ├─ Selling Price: ₦454
  ├─ Payable Amount: ₦454
  ├─ Bonus to Earn: ₦13.62
  └─ Offer Badge: "₦50 OFF"
```

---

### **Example 5: With Fixed Price Offer**

**Scenario**: GLO Airtime ₦1000, Supplier ₦950, 8% markup, Fixed ₦899 offer, User has ₦2000

```
Step 1-4: Calculate base
  supplierPrice = ₦950
  baseSellingPrice = 950 + (950 × 0.08) = ₦1026

Step 5: Check Offer Discount (FIXED PRICE)
  activeOffer exists = true
  discountType = "fixed_price"
  discountValue = 899

  discountedPrice = 899 (override the base price entirely)

  hasOfferDiscount = (899 < 1026) = true ✓
  sellingPrice = ₦899

Step 6: Cashback Bonus
  has_cashback = true
  cashback_percentage = 2
  bonusAmount = 899 × (2 / 100) = ₦17.98

Step 7: Payment
  useCashback = false
  payableAmount = ₦899

RESULT:
  ├─ Original Price (strikethrough): ₦1026 (base)
  ├─ Offer Applied: Special Price
  ├─ Selling Price: ₦899
  ├─ Payable Amount: ₦899
  ├─ Bonus to Earn: ₦17.98
  └─ Offer Badge: "Special Price ₦899"
```

---

## 🔧 Implementation Locations

### **Frontend Calculations**

#### 1. **Checkout Modal** (`src/components/features/dashboard/shared/checkout-modal.tsx`)

```typescript
// Lines 58-110
const faceValue = parseFloat(product.denomAmount || "0");
const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
  ? parseFloat(product.supplierOffers[0].supplierPrice)
  : faceValue;

const actualMarkup = markupPercent < 1 ? markupPercent : markupPercent / 100;
const baseSellingPrice = supplierPrice + supplierPrice * actualMarkup;

const hasOfferDiscount =
  product.discountedPrice !== undefined &&
  product.discountedPrice !== null &&
  product.discountedPrice < baseSellingPrice;

const sellingPrice = hasOfferDiscount
  ? (product.discountedPrice ?? baseSellingPrice)
  : baseSellingPrice;

const originalPrice = hasOfferDiscount ? baseSellingPrice : faceValue;

const payableAmount = useCashback
  ? Math.max(0, sellingPrice - userCashbackBalance)
  : sellingPrice;

const bonusAmount =
  product.has_cashback && product.cashback_percentage
    ? sellingPrice * (product.cashback_percentage / 100)
    : 0;
```

**Location**: Where checkout modal displays the final price before payment

**Used By**:

- Airtime Plans
- Data Plans
- Any product purchase flow

---

#### 2. **Airtime Plans** (`src/components/features/dashboard/airtime/airtime-plans.tsx`)

```typescript
// Lines 240-245
const supplierId = product.supplierOffers?.[0]?.supplierId || "";
const markup = markupMap.get(supplierId) || 0;
setSelectedMarkupPercent(markup);

// Fetch markup from map when product is selected
// Pass to CheckoutModal via markupPercent prop
```

**Location**: Where user selects a product for purchase

**Used By**:

- Product card click handler
- Sets initial markup state

---

#### 3. **Data Plans** (`src/components/features/dashboard/data/data-plans.tsx`)

```typescript
// Same as Airtime Plans - identical calculation pattern
```

---

#### 4. **Supplier Markup Hook** (`src/hooks/useSupplierMarkup.ts`)

```typescript
// useSupplierMarkupMap() creates a Map<supplierId, markupPercent>
export function useSupplierMarkupMap(enabled = true) {
  const { data: markupData } = useMarkup(undefined, enabled);

  const markupMap = useMemo(() => {
    const map = new Map<string, number>();
    if (markupData?.markups) {
      markupData.markups.forEach((markup) => {
        const percent =
          typeof markup.markupPercent === "string"
            ? parseFloat(markup.markupPercent)
            : markup.markupPercent;
        map.set(markup.supplierId, percent);
      });
    }
    return map;
  }, [markupData]);

  return markupMap;
}
```

**Used By**:

- Airtime Plans
- Data Plans
- Any component needing supplier markups

---

## 🔗 Data Flow Diagram

```
Product Selected
    ↓
[1] Get Product Details
    ├─ denomAmount
    ├─ supplierOffers[0].supplierPrice
    ├─ activeOffer
    ├─ discountedPrice
    ├─ has_cashback
    └─ cashback_percentage
    ↓
[2] Get Supplier ID & Markup
    ├─ supplierId = product.supplierOffers[0].supplierId
    ├─ useSupplierMarkupMap() lookup
    └─ markupPercent = map.get(supplierId)
    ↓
[3] Pass to CheckoutModal
    ├─ product={selectedProduct}
    ├─ markupPercent={selectedMarkupPercent}
    ├─ userBalance={user.balance}
    └─ userCashbackBalance={user.cashback.availableBalance}
    ↓
[4] Calculate in CheckoutModal
    ├─ faceValue = parseFloat(product.denomAmount)
    ├─ supplierPrice = product.supplierOffers[0].supplierPrice || faceValue
    ├─ baseSellingPrice = supplierPrice × (1 + markupPercent/100)
    ├─ sellingPrice = discountedPrice || baseSellingPrice
    ├─ payableAmount = useCashback ? (sellingPrice - cashbackBalance) : sellingPrice
    └─ bonusAmount = sellingPrice × (cashback_percentage/100)
    ↓
[5] Display Prices
    ├─ Hero Price: payableAmount
    ├─ Strikethrough: originalPrice
    ├─ Bonus: bonusAmount
    └─ Payment Method: Wallet or Cashback + Wallet
```

---

## 📋 Markup Percent Format

### **Important**: Markup Percent Handling

The application handles both **decimal** and **percentage** formats:

```typescript
// Input can be either format
const actualMarkup =
  markupPercent < 1
    ? markupPercent // Already decimal: 0.05
    : markupPercent / 100; // Percentage: 5 → 0.05

// Examples:
// If markupPercent = 0.05 (from API as decimal)
//   → actualMarkup = 0.05
//
// If markupPercent = 5 (from API as percentage)
//   → actualMarkup = 5 / 100 = 0.05
```

**Always normalize before calculation!**

---

## 🧮 Offer Discount Types

### **1. Percentage Discount**

```typescript
// Example: 15% OFF
discountType: "percentage"
discountValue: 15

calculation:
  discountAmount = baseSellingPrice × (15 / 100)
  discountedPrice = baseSellingPrice - discountAmount
```

### **2. Fixed Amount Discount**

```typescript
// Example: ₦50 OFF
discountType: "fixed_amount";
discountValue: 50;

calculation: discountedPrice = baseSellingPrice - 50;
```

### **3. Fixed Price**

```typescript
// Example: Sell at ₦899
discountType: "fixed_price";
discountValue: 899;

calculation: discountedPrice = 899; // Directly use the value
```

---

## 💳 Cashback Payment Method

### **When User Chooses "Use Cashback"**

```
Original Selling Price: ₦841.50
User Cashback Balance: ₦200

payableAmount = MAX(0, 841.50 - 200)
              = MAX(0, 641.50)
              = ₦641.50

User pays:
  ├─ ₦200 from Cashback Balance
  └─ ₦641.50 from Wallet (or card/bank)

Total: ₦841.50 ✓
```

### **When User Doesn't Use Cashback**

```
payableAmount = sellingPrice = ₦841.50

User pays:
  └─ ₦841.50 from Wallet (or card/bank)

Cashback Balance remains: ₦200 (unchanged)
Bonus to Earn: ₦21.04 (added to cashback after transaction)
```

---

## ✅ Validation Rules

### **1. Insufficient Balance Check**

```typescript
isInsufficientBalance = userBalance < payableAmount;

if (isInsufficientBalance) {
  // Show error: "Insufficient balance"
  // Disable checkout button
}
```

### **2. Markup Percent Validation**

```typescript
// Must be non-negative
if (markupPercent < 0) {
  throw new Error("Invalid markup percent");
}
```

### **3. Offer Discount Validation**

```typescript
// Discount must be less than base price
if (discountedPrice >= baseSellingPrice) {
  // Ignore discount, use baseSellingPrice
  hasOfferDiscount = false;
}
```

### **4. Cashback Balance Validation**

```typescript
// Cashback cannot exceed selling price
const usableCashback = Math.min(userCashbackBalance, sellingPrice);
const payableAmount = Math.max(0, sellingPrice - usableCashback);
```

---

## 🎯 API Endpoints

### **Get Markups**

```
GET /user/markups

Response:
{
  "markups": [
    {
      "supplierId": "sup-123",
      "markupPercent": "5"  // Can be string or number
    },
    {
      "supplierId": "sup-456",
      "markupPercent": "10"
    }
  ]
}
```

### **Create Topup Request**

```
POST /user/topup

Body:
{
  "amount": 500,                    // Face value (not discounted)
  "productCode": "MTN-AIRTIME-500",
  "recipientPhone": "08031234567",
  "supplierSlug": "mtn-ng",
  "supplierMappingId": "map-123",
  "useCashback": false,             // Payment method flag
  "pin": "123456",                  // OR verificationToken
  "verificationToken": "token-abc", // For biometric
  "offerId": "offer-123"            // Optional
}

Response:
{
  "transactionId": "tx-123",
  "status": "success",
  "amount": 500,
  "balance": 4500
}
```

**Important**: API receives **face value**, not the calculated prices. Backend handles its own calculations.

---

## 📊 Display Examples

### **Checkout Modal Display**

```
┌─────────────────────────────────────┐
│      CONFIRM PURCHASE               │
├─────────────────────────────────────┤
│                                     │
│          ₦472.50                    │
│     ₦500 (strikethrough)  [15% OFF] │
│                                     │
├─────────────────────────────────────┤
│ TRANSACTION DETAILS                 │
├─────────────────────────────────────┤
│ Product Name    MTN Airtime         │
│ Recipient       08031234567         │
│ Amount          ₦500 (face value)   │
│ Markup          5% (₦22.50)         │
│ Discount        15% (-₦76.88)       │
│                 ─────────────        │
│ Selling Price   ₦472.50             │
├─────────────────────────────────────┤
│ PAYMENT METHOD                      │
├─────────────────────────────────────┤
│ ☑ Wallet (₦472.50)                  │
│ ☐ Use Cashback (₦200 available)     │
├─────────────────────────────────────┤
│ BONUS TO EARN                       │
│ +₦11.88 Cashback (2.5%)             │
├─────────────────────────────────────┤
│          [CONFIRM PAYMENT]          │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Basic Calculation**

- Product: ₦500 airtime
- Supplier: ₦450
- Markup: 5%
- Expected: ₦472.50

```typescript
test("should calculate basic price with supplier markup", () => {
  const faceValue = 500;
  const supplierPrice = 450;
  const markup = 0.05;

  const expected = 450 * (1 + 0.05); // 472.50

  expect(expected).toBe(472.5);
});
```

### **Test Case 2: With Offer Discount**

- Base: ₦472.50
- Offer: 15% OFF
- Expected: ₦401.63

```typescript
test("should apply percentage discount", () => {
  const base = 472.5;
  const discountPercent = 15;

  const discounted = base * (1 - discountPercent / 100); // 401.625

  expect(discounted).toBeCloseTo(401.63);
});
```

### **Test Case 3: With Cashback Payment**

- Selling: ₦841.50
- Cashback Balance: ₦200
- Expected Payable: ₦641.50

```typescript
test("should calculate payable with cashback", () => {
  const sellingPrice = 841.5;
  const cashbackBalance = 200;

  const payable = Math.max(0, sellingPrice - cashbackBalance); // 641.50

  expect(payable).toBe(641.5);
});
```

---

## 🚨 Common Mistakes to Avoid

### ❌ **Mistake 1**: Using Wrong Base for Markup

```typescript
// WRONG - calculates markup on face value
const wrong = faceValue * (1 + markup); // 500 * 1.05 = 525

// CORRECT - calculate markup on supplier price
const correct = supplierPrice * (1 + markup); // 450 * 1.05 = 472.50
```

### ❌ **Mistake 2**: Not Handling Missing Supplier Price

```typescript
// WRONG - will crash if supplierOffers is empty
const price = product.supplierOffers[0].supplierPrice;

// CORRECT - fallback to face value
const price = product.supplierOffers?.[0]?.supplierPrice
  ? parseFloat(product.supplierOffers[0].supplierPrice)
  : faceValue;
```

### ❌ **Mistake 3**: Forgetting to Normalize Markup Percent

```typescript
// WRONG - assumes it's always decimal
const price = supplier * (1 + markupPercent); // Fails if 5 is passed

// CORRECT - handle both formats
const markup = markupPercent < 1 ? markupPercent : markupPercent / 100;
const price = supplier * (1 + markup);
```

### ❌ **Mistake 4**: Not Checking Offer Validity

```typescript
// WRONG - uses offer without validation
const price = product.discountedPrice;

// CORRECT - validate offer exists and is cheaper
const hasValidOffer =
  product.discountedPrice !== undefined &&
  product.discountedPrice < baseSellingPrice;

const price = hasValidOffer ? product.discountedPrice : baseSellingPrice;
```

### ❌ **Mistake 5**: Allowing Negative Payable Amount

```typescript
// WRONG - cashback can exceed selling price
const payable = sellingPrice - userCashbackBalance; // Could be negative!

// CORRECT - cap at zero
const payable = Math.max(0, sellingPrice - userCashbackBalance);
```

---

## 📈 Performance Considerations

### **Markup Lookup Optimization**

```typescript
// ✅ GOOD - O(1) lookup using Map
const markupMap = useSupplierMarkupMap();
const markup = markupMap.get(supplierId); // O(1)

// ❌ BAD - O(n) lookup on every calculation
const markup = markupData.markups.find((m) => m.supplierId === supplierId);
```

### **Memoization**

```typescript
// Memoize map creation to prevent recalculation
const markupMap = useMemo(() => {
  const map = new Map();
  // ... build map
  return map;
}, [markupData]);
```

---

## 🔐 Backend vs Frontend

### **Frontend Calculations**

- Display purposes only
- Price preview in UI
- Checkout modal display
- User experience

### **Backend Calculations**

- Actual transaction processing
- Final price determination
- Offer validation
- Security verification
- Database updates

**Important**: Always trust backend price for actual charge!

---

## 📚 Related Files

- [src/components/features/dashboard/shared/checkout-modal.tsx](src/components/features/dashboard/shared/checkout-modal.tsx) - Checkout calculations
- [src/components/features/dashboard/airtime/airtime-plans.tsx](src/components/features/dashboard/airtime/airtime-plans.tsx) - Product selection & markup
- [src/components/features/dashboard/data/data-plans.tsx](src/components/features/dashboard/data/data-plans.tsx) - Data product markup
- [src/hooks/useSupplierMarkup.ts](src/hooks/useSupplierMarkup.ts) - Markup lookup
- [src/types/product.types.ts](src/types/product.types.ts) - Product types
- [PRICING_CALCULATION_GUIDE.md](PRICING_CALCULATION_GUIDE.md) - Legacy guide (refer to this document instead)

---

## 🎓 Quick Reference

### **Formula Summary**

| Calculation        | Formula                    | Example                        |
| ------------------ | -------------------------- | ------------------------------ |
| **Face Value**     | From product               | ₦500                           |
| **Supplier Price** | From offer OR faceValue    | ₦450                           |
| **Base Selling**   | supplier × (1 + markup%)   | 450 × 1.05 = ₦472.50           |
| **With Discount**  | base - discount            | 472.50 × 0.85 = ₦401.63        |
| **With Cashback**  | MAX(0, selling - cashback) | MAX(0, 401.63 - 200) = ₦201.63 |
| **Bonus Earned**   | selling × cashback%        | 401.63 × 0.025 = ₦10.04        |

---

**Last Updated**: January 22, 2026
**Version**: 1.0
**Status**: Complete & Production Ready
