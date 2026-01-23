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
    const faceValue = parseFloat(product.denomAmount || "0");
    if (faceValue <= 0) {
      throw new Error("Invalid product denomination");
    }

    // STEP 2: Get supplier cost
    const supplierOffer = product.supplierOffers?.[0];
    if (!supplierOffer) {
      throw new Error("No supplier offer available for this product");
    }

    const supplierCost = parseFloat(supplierOffer.supplierPrice || "0");
    if (supplierCost <= 0) {
      throw new Error("Invalid supplier price");
    }

    // STEP 3: Apply markup to supplier cost
    // Normalize markup: if < 1, treat as decimal (0.05), else as percentage (5)
    const normalizedMarkup = markupPercent < 1 ? markupPercent : markupPercent / 100;
    const baseSellingPrice = supplierCost * (1 + normalizedMarkup);

    // STEP 4: Check for offer discount
    let finalSellingPrice = baseSellingPrice;
    let hasOfferDiscount = false;
    let offerDiscount = 0;

    if (product.activeOffer && product.discountedPrice !== undefined && product.discountedPrice !== null) {
      const discountedPrice = product.discountedPrice;
      
      // Only apply offer if it's cheaper than base selling price
      if (discountedPrice < baseSellingPrice) {
        finalSellingPrice = discountedPrice;
        hasOfferDiscount = true;
        offerDiscount = baseSellingPrice - discountedPrice;
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
  selectedAmount?: number
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
      const priceCalc = calculateFinalPrice(product, false, 0, markupPercent);
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
