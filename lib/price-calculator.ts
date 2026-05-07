/**
 * Price Calculator Utility - FULL COMPLEX PRICING
 * Includes: Face Value → Supplier Cost → Markup → Offer Discount → Cashback
 * 
 * Formula: 
 * 1. Base Selling = Supplier Price × (1 + Markup%)
 * 2. With Offer = Apply discount if better than base
 * 3. Final Price = Selling Price (highest precedence: offer > base)
 * 4. Payable = Final Price - Cashback Used
 * 5. Bonus = Final Price × Cashback%
 */

import { Product } from "@/types/product.types";

export function getResolvedProductPrice(product: Product): number {
  if (typeof product.resolvedPrice === "number" && product.resolvedPrice > 0) {
    return product.resolvedPrice;
  }

  const fallback = parseFloat(product.denomAmount || "0");
  return fallback > 0 ? fallback : 0;
}

export interface PriceCalculation {
  faceValue: number; // What user thinks they're buying
  supplierCost: number; // What we pay supplier
  baseSellingPrice: number; // Supplier cost with markup applied
  hasOfferDiscount: boolean; // Whether offer was applied
  offerDiscount: number; // Amount saved from offer
  finalSellingPrice: number; // Actual price customer pays (base or offer, whichever is lower)
  cashbackUsed: number; // Amount deducted from cashback balance
  payableAmount: number; // finalSellingPrice - cashbackUsed (what goes to wallet)
  bonusToEarn: number; // Cashback bonus customer earns
}

/**
 * Calculate final price with FULL COMPLEX PRICING
 * 
 * Step 1: Get face value (denomination)
 * Step 2: Get supplier cost
 * Step 3: Apply markup percentage
 * Step 4: Check for offer discount and apply if better
 * Step 5: Calculate cashback usage
 * Step 6: Calculate bonus to earn
 */
export function calculateFinalPrice(
  product: Product,
  useCashback: boolean,
  userCashbackBalance: number = 0,
  markupPercent: number = 0 // Markup% for this supplier
): PriceCalculation {
  try {
    // STEP 1: Face value (what user thinks they're buying)
    // Prefer backend-resolved role price, fall back to the legacy denom amount.
    const faceValue = getResolvedProductPrice(product);
    if (faceValue <= 0) {
      throw new Error("Invalid product denomination");
    }

    // STEP 2: Keep supplier cost for informational purposes only.
    const supplierOffer = product.supplierOffers?.[0];
    const supplierCost = supplierOffer?.supplierPrice
      ? parseFloat(supplierOffer.supplierPrice)
      : 0;

    // STEP 3: Product price is now role-based, not supplier-cost-based.
    const baseSellingPrice = faceValue;

    // STEP 4: Check for offer discount
    let finalSellingPrice = baseSellingPrice;
    let hasOfferDiscount = false;
    let offerDiscount = 0;

    if (product.activeOffer) {
      const offer = product.activeOffer;
      const backendDiscount = product.discountedPrice;

      if (
        backendDiscount !== undefined &&
        backendDiscount !== null &&
        backendDiscount < baseSellingPrice
      ) {
        finalSellingPrice = backendDiscount;
        hasOfferDiscount = true;
        offerDiscount = baseSellingPrice - backendDiscount;
      } else {
        switch (offer.discountType) {
          case "percentage":
            finalSellingPrice = baseSellingPrice * (1 - offer.discountValue / 100);
            hasOfferDiscount = finalSellingPrice < baseSellingPrice;
            offerDiscount = Math.max(0, baseSellingPrice - finalSellingPrice);
            break;
          case "fixed_amount":
            finalSellingPrice = Math.max(0, baseSellingPrice - offer.discountValue);
            hasOfferDiscount = finalSellingPrice < baseSellingPrice;
            offerDiscount = Math.max(0, baseSellingPrice - finalSellingPrice);
            break;
          case "fixed_price":
            finalSellingPrice = offer.discountValue;
            hasOfferDiscount = finalSellingPrice < baseSellingPrice;
            offerDiscount = Math.max(0, baseSellingPrice - finalSellingPrice);
            break;
        }
      }
    }

    // STEP 5: Calculate cashback usage
    const cashbackUsed = useCashback
      ? Math.min(userCashbackBalance, finalSellingPrice)
      : 0;

    const payableAmount = Math.max(0, finalSellingPrice - cashbackUsed);

    // STEP 6: Calculate bonus to earn (cashback percentage on final price)
    const cashbackPercent = product.has_cashback
      ? parseFloat(String(product.cashback_percentage) || "0")
      : 0;
    const bonusToEarn = cashbackPercent > 0 
      ? finalSellingPrice * (cashbackPercent / 100) 
      : 0;

    return {
      faceValue,
      supplierCost,
      baseSellingPrice,
      hasOfferDiscount,
      offerDiscount,
      finalSellingPrice,
      cashbackUsed,
      payableAmount,
      bonusToEarn,
    };
  } catch (error) {
    console.error("[PriceCalculator] Error calculating price:", error);
    throw error;
  }
}

/**
 * Validate purchase before proceeding to checkout
 */
export interface PurchaseValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePurchase(
  phoneNumber: string,
  product: Product | null,
  userBalance: number,
  markupPercent: number = 0,
  selectedAmount?: number,
  useCashback: boolean = false,
  cashbackBalance: number = 0
): PurchaseValidation {
  const errors: string[] = [];

  // Validate phone
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push("Phone number is required");
  }

  // Validate product
  if (!product) {
    errors.push("Product not selected");
  } else {
    // Calculate price and check balance
    try {
      const priceCalc = calculateFinalPrice(product, useCashback, cashbackBalance, markupPercent);
      if (priceCalc.payableAmount > userBalance) {
        errors.push(
          `Insufficient balance. Need ₦${priceCalc.payableAmount.toFixed(2)}, have ₦${userBalance.toFixed(2)}`
        );
      }
    } catch (e) {
      errors.push("Unable to calculate price. Product may be invalid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, symbol = "₦"): string {
  return `${symbol}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate savings from offer discount
 */
export function calculateOfferSavings(
  basePrice: number,
  discountedPrice: number
): number {
  return Math.max(0, basePrice - discountedPrice);
}

/**
 * Calculate total savings (offer + cashback)
 */
export function calculateTotalSavings(
  offerSavings: number,
  cashbackUsed: number
): number {
  return offerSavings + cashbackUsed;
}
