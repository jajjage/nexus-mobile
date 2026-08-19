/**
 * ProductCard - Modern High-Performance Product Display Card
 * Emil Design Engineering principles: Crisp typography, well-proportioned density, instant feedback
 */

import { darkColors, lightColors } from "@/constants/palette";
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

export interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
  markupPercent?: number;
  isEligibleForOffer?: boolean;
  isGuest?: boolean;
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
  markupPercent = 0,
  isEligibleForOffer = false,
  isGuest = false,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  const faceValue = getResolvedProductPrice(product);
  const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
    ? parseFloat(product.supplierOffers[0].supplierPrice.toString())
    : 0;

  const baseSellingPrice = faceValue;
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

  const hasCashback = product.has_cashback && product.cashback_percentage;

  // Format data size cleanly
  const dataSize = product.dataMb
    ? product.dataMb >= 1024
      ? `${(product.dataMb / 1024).toFixed(
          product.dataMb % 1024 === 0 ? 0 : 1
        )} GB`
      : `${product.dataMb} MB`
    : null;

  const validityText = product.validityDays
    ? product.validityDays === 1
      ? "1 Day"
      : `${product.validityDays} Days`
    : null;

  const selectedCardBg = `${colors.primary}14`;
  const borderColor = isSelected
    ? colors.primary
    : isDark
    ? "#334155"
    : "#E2E8F0";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? selectedCardBg : colors.card,
          borderColor,
          borderWidth: isSelected ? 1.5 : 1,
        },
      ]}
      onPress={() => onSelect(product)}
      activeOpacity={0.6}
    >
      {/* Top Badges (Discount / Offer) */}
      {discountPercent > 0 && hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
        </View>
      )}

      {hasOffer && !discountPercent && (
        <View style={styles.offerBadge}>
          {isGuest ? (
            <Lock size={8.5} color="#FFFFFF" />
          ) : (
            <Sparkles size={8.5} color="#FFFFFF" />
          )}
          <Text style={styles.offerBadgeText}>
            {isGuest ? "Login" : "Offer"}
          </Text>
        </View>
      )}

      {/* Selected Indicator - Check mark in top right */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
          <Check size={11} color={colors.primaryForeground || "#FFFFFF"} strokeWidth={3} />
        </View>
      )}

      {/* Top Header: Data Size / Plan Title */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.mainText, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {dataSize || product.name}
        </Text>
      </View>

      {/* Middle Row: Price */}
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: isSelected ? colors.primary : colors.foreground }]}>
          ₦{Math.round(displayPrice).toLocaleString()}
        </Text>

        {hasDiscount && (
          <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
            ₦{Math.round(faceValue).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Bottom Row: Validity & Cashback */}
      <View style={styles.footerRow}>
        {validityText ? (
          <Text style={[styles.validityText, { color: colors.textSecondary }]}>
            {validityText}
          </Text>
        ) : (
          <View />
        )}

        {hasCashback && (
          <View
            style={[styles.cashbackBadge, { backgroundColor: `${colors.info}18` }]}
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
    minHeight: 84,
    justifyContent: "space-between",
  },
  discountBadge: {
    position: "absolute",
    top: -6,
    left: -2,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    zIndex: 2,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  offerBadge: {
    position: "absolute",
    top: -6,
    left: -2,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    zIndex: 2,
  },
  offerBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  selectedBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 18,
  },
  mainText: {
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginVertical: 2,
  },
  price: {
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  validityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cashbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    gap: 2.5,
  },
  cashbackText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
});
