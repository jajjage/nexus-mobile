/**
 * ProductCard - Product display card with markup pricing
 * Per mobile-airtime-data-guide.md Section 3.D
 * Updated with correct offer/discount display logic
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { Product } from "@/types/product.types";
import { Check, Lock, Sparkles, Zap } from "lucide-react-native";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
  markupPercent: number;
  isEligibleForOffer: boolean;
  isGuest?: boolean;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
  markupPercent,
  isEligibleForOffer,
  isGuest = false,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  // === PRICING LOGIC ===
  // 1. Base Price (supplierPrice or denomAmount)
  const faceValue = parseFloat(product.denomAmount);
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice.toString())
    : faceValue;

  // 2. Apply Markup
  const baseSellingPrice = supplierPrice + supplierPrice * (markupPercent / 100);

  // === OFFER LOGIC ===
  const hasOffer = !!product.activeOffer;
  
  // Determine if user should see discounted pricing
  // Guests: See the discount (incentive to log in)
  // Eligible Users: See and get the discount
  // Ineligible Users: See grayed badge, pay full price
  const showDiscountedPrice = hasOffer && (isGuest || isEligibleForOffer);

  // 3. Calculate Display Price
  let displayPrice = baseSellingPrice;
  let discountPercent = 0;

  if (showDiscountedPrice && product.activeOffer) {
    const offer = product.activeOffer;

    // Source 1: Backend-calculated discountedPrice
    if (product.discountedPrice) {
      displayPrice = product.discountedPrice;
      discountPercent = Math.round(
        ((faceValue - displayPrice) / faceValue) * 100
      );
    } else {
      // Source 2: Client-calculated based on discountType
      switch (offer.discountType) {
        case "percentage":
          displayPrice = baseSellingPrice * (1 - offer.discountValue / 100);
          discountPercent = offer.discountValue;
          break;
        case "fixed_amount":
          displayPrice = baseSellingPrice - offer.discountValue;
          discountPercent = Math.round(
            ((faceValue - displayPrice) / faceValue) * 100
          );
          break;
        case "fixed_price":
          displayPrice = offer.discountValue;
          discountPercent = Math.round(
            ((faceValue - displayPrice) / faceValue) * 100
          );
          break;
      }
    }
  }

  let hasDiscount = false;
  
  if (showDiscountedPrice && displayPrice < baseSellingPrice) {
    hasDiscount = true;
  }
  
  // === SUPPLIER DISCOUNT LOGIC (When no active offer) ===
  const hasValidSupplierDiscount = supplierPrice > 0 && supplierPrice < faceValue;
  
  // If no active offer, but supplier price gives a discount
  if (!showDiscountedPrice && hasValidSupplierDiscount && baseSellingPrice < faceValue) {
    hasDiscount = true;
    displayPrice = baseSellingPrice;
    discountPercent = Math.round(
      ((faceValue - baseSellingPrice) / faceValue) * 100
    );
  }

  // Cashback info
  const hasCashback = product.has_cashback && product.cashback_percentage;
  const cashbackAmount = hasCashback
    ? (displayPrice * (product.cashback_percentage || 0)) / 100
    : 0;

  // Format data size
  const formatDataSize = () => {
    if (!product.dataMb) return null;
    if (product.dataMb >= 1024) {
      return `${(product.dataMb / 1024).toFixed(product.dataMb % 1024 === 0 ? 0 : 1)} GB`;
    }
    return `${product.dataMb} MB`;
  };

  const dataSize = formatDataSize();
  const validityText = product.validityDays
    ? product.validityDays === 1
      ? "1 Day"
      : `${product.validityDays} Days`
    : null;

  // === BADGE LOGIC ===
  // Condition: hasOffer && isGuest → "🔓 Login to Claim" (Blue)
  // Condition: hasOffer && isEligibleForOffer → "🎉 {offer.title}" (Green, pulsing)
  // Condition: hasOffer && !isEligibleForOffer → "{offer.title}" (Grayed out)
  // Condition: discountPercentage > 0 → "-X% OFF" (Orange-Red)

  const renderOfferBadge = () => {
    if (!hasOffer || !product.activeOffer) return null;

    if (isGuest) {
      return (
        <View style={[styles.badge, styles.guestBadge]}>
          <Lock size={10} color="#FFFFFF" />
          <Text style={styles.badgeText}>Login to Claim</Text>
        </View>
      );
    }

    if (isEligibleForOffer) {
      return (
        <View style={[styles.badge, styles.eligibleBadge]}>
          <Sparkles size={10} color="#FFFFFF" />
          <Text style={styles.badgeText}>
            {product.activeOffer.title || "Special Deal"}
          </Text>
        </View>
      );
    }

    // Ineligible - grayed out
    return (
      <View style={[styles.badge, styles.ineligibleBadge]}>
        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
          {product.activeOffer.title || "Limited Offer"}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={() => onSelect(product)}
      activeOpacity={0.7}
    >
      {/* Discount Percentage Badge - Top Left */}
      {discountPercent > 0 && hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
        </View>
      )}

      {/* Offer Badge - Below discount */}
      <View style={styles.offerBadgeContainer}>{renderOfferBadge()}</View>

      {/* Selected Indicator */}
      {isSelected && (
        <View
          style={[styles.selectedBadge, { backgroundColor: colors.primary }]}
        >
          <Check size={14} color={colors.primaryForeground} strokeWidth={3} />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Data Size or Product Name */}
        <Text
          style={[styles.mainText, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {dataSize || product.name}
        </Text>

        {/* Validity */}
        {validityText && (
          <Text style={[styles.validityText, { color: colors.textSecondary }]}>
            {validityText}
          </Text>
        )}
      </View>

      {/* Price & Cashback Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₦{displayPrice.toLocaleString()}
          </Text>

          {/* Strikethrough (Original Price) */}
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
              ₦{faceValue.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Cashback Badge (Relative Logic) */}
        {hasCashback && (
          <View
            style={[styles.cashbackBadge, { backgroundColor: `${colors.info}20` }]}
          >
            <Zap size={10} color={colors.info} />
            <Text style={[styles.cashbackText, { color: colors.info }]}>
              +{product.cashback_percentage}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.md,
    position: "relative",
    minHeight: 110,
    justifyContent: "space-between",
  },
  discountBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: "#FF6B35",
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: designTokens.radius.sm,
    zIndex: 2,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 16,
    left: -6,
    zIndex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: designTokens.radius.sm,
    gap: 4,
  },
  guestBadge: {
    backgroundColor: "#4F46E5", // Indigo/Blue gradient
  },
  eligibleBadge: {
    backgroundColor: "#10B981", // Green
  },
  ineligibleBadge: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
  selectedBadge: {
    position: "absolute",
    top: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.lg,
  },
  mainText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "700",
  },
  validityText: {
    fontSize: designTokens.fontSize.xs,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  priceContainer: {
    flexDirection: "column", // Stack price and original price cleanly? Or row?
    // Let's use column to ensure width conservation if needed, or flex-start
    alignItems: "flex-start",
  },
  price: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: designTokens.fontSize.xs,
    textDecorationLine: "line-through",
    marginTop: -2,
  },
  cashbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: designTokens.radius.sm,
    gap: 2,
    marginLeft: 4,
    marginBottom: 2,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
