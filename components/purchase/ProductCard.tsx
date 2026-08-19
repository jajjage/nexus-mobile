/**
 * ProductCard - Ultra-Compact Product Display Card
 * Per mobile-airtime-data-guide.md Section 3.D
 * Updated to match Image 2 reference design & ultra-compact layout
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { getResolvedProductPrice } from "@/lib/price-calculator";
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
  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  // === PRICING LOGIC ===
  const faceValue = getResolvedProductPrice(product);
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice.toString())
    : 0;

  const baseSellingPrice = faceValue;

  // === OFFER LOGIC ===
  const hasOffer = !!product.activeOffer;
  const showDiscountedPrice = hasOffer && (isGuest || isEligibleForOffer);

  let displayPrice = baseSellingPrice;
  let discountPercent = 0;

  if (showDiscountedPrice && product.activeOffer) {
    const offer = product.activeOffer;

    if (product.discountedPrice) {
      displayPrice = product.discountedPrice;
      discountPercent = Math.round(
        ((faceValue - displayPrice) / faceValue) * 100
      );
    } else {
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

  // Supplier discount fallback
  const hasValidSupplierDiscount =
    supplierPrice > 0 && supplierPrice < faceValue && !product.resolvedPrice;

  if (
    !showDiscountedPrice &&
    hasValidSupplierDiscount &&
    baseSellingPrice < faceValue
  ) {
    hasDiscount = true;
    displayPrice = baseSellingPrice;
    discountPercent = Math.round(
      ((faceValue - baseSellingPrice) / faceValue) * 100
    );
  }

  // Cashback info
  const hasCashback = product.has_cashback && product.cashback_percentage;

  // Format data size or name
  const formatDataSize = () => {
    if (!product.dataMb) return null;
    if (product.dataMb >= 1024) {
      return `${(product.dataMb / 1024).toFixed(
        product.dataMb % 1024 === 0 ? 0 : 1
      )} GB`;
    }
    return `${product.dataMb} MB`;
  };

  const dataSize = formatDataSize();
  const validityText = product.validityDays
    ? product.validityDays === 1
      ? "1 Day"
      : `${product.validityDays} Days`
    : null;

  const accentColor = isDark ? "#38BDF8" : "#0284C7";
  const selectedCardBg = isDark ? "#0284C720" : "#F0F9FF";

  const renderOfferBadge = () => {
    if (!hasOffer || !product.activeOffer) return null;

    if (isGuest) {
      return (
        <View style={[styles.badge, styles.guestBadge]}>
          <Lock size={9} color="#FFFFFF" />
          <Text style={styles.badgeText}>Login</Text>
        </View>
      );
    }

    if (isEligibleForOffer) {
      return (
        <View style={[styles.badge, styles.eligibleBadge]}>
          <Sparkles size={9} color="#FFFFFF" />
          <Text style={styles.badgeText}>
            {product.activeOffer.title || "Offer"}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.ineligibleBadge]}>
        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
          {product.activeOffer.title || "Offer"}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? selectedCardBg : colors.card,
          borderColor: isSelected ? accentColor : isDark ? "#334155" : "#E2E8F0",
          borderWidth: isSelected ? 1.5 : 1,
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

      {/* Offer Badge Container */}
      <View style={styles.offerBadgeContainer}>{renderOfferBadge()}</View>

      {/* Selected Indicator - Top Right Check Circle */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: accentColor }]}>
          <Check size={12} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Title / Plan Name */}
      <Text
        style={[styles.mainText, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {dataSize || product.name}
      </Text>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: accentColor }]}>
          ₦{displayPrice.toLocaleString()}
        </Text>

        {hasDiscount && (
          <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
            ₦{faceValue.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Footer: Validity & Cashback */}
      <View style={styles.footer}>
        {validityText ? (
          <Text style={[styles.validityText, { color: colors.textSecondary }]}>
            {validityText}
          </Text>
        ) : (
          <View />
        )}

        {hasCashback && (
          <View
            style={[styles.cashbackBadge, { backgroundColor: `${colors.info}20` }]}
          >
            <Zap size={9} color={colors.info} />
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
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    position: "relative",
    minHeight: 78,
    justifyContent: "space-between",
  },
  discountBadge: {
    position: "absolute",
    top: -5,
    left: -4,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 12,
    left: -4,
    zIndex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  guestBadge: {
    backgroundColor: "#4F46E5",
  },
  eligibleBadge: {
    backgroundColor: "#10B981",
  },
  ineligibleBadge: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "600",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  mainText: {
    fontSize: 12,
    fontWeight: "600",
    paddingRight: 24, // Space for selected checkmark badge
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginVertical: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validityText: {
    fontSize: 10,
    fontWeight: "500",
  },
  cashbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  cashbackText: {
    fontSize: 9,
    fontWeight: "600",
  },
});
