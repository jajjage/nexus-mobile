/**
 * PlanGrid Component
 * Filterable grid of data bundles with category tabs
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { Product } from "@/types/product.types";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { ProductCard } from "./ProductCard";

interface PlanGridProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
  isLoading?: boolean;
  eligibleOfferIds?: Set<string>;
  isGuest?: boolean;
  markupMap?: Map<string, number>;
}

type CategoryFilter = "all" | "daily" | "weekly" | "monthly" | "sme";

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "sme", label: "SME" },
];

export function PlanGrid({
  products,
  selectedProduct,
  onSelect,
  isLoading = false,
  eligibleOfferIds = new Set(),
  isGuest = false,
  markupMap = new Map(),
}: PlanGridProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");

  // Extract unique categories from products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category?.slug) {
        cats.add(p.category.slug.toLowerCase());
      }
    });
    return cats;
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;

    return products.filter((p) => {
      const slug = p.category?.slug?.toLowerCase() || "";
      return slug.includes(activeFilter);
    });
  }, [products, activeFilter]);

  const handleFilterChange = (filter: CategoryFilter) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const handleProductSelect = (product: Product) => {
    Haptics.selectionAsync();
    onSelect(product);
  };

  // Only show filters that have matching products
  const visibleFilters = CATEGORY_FILTERS.filter(
    (f) => f.key === "all" || availableCategories.has(f.key)
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading plans...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter Tabs */}
      {visibleFilters.length > 1 && (
        <View style={styles.filterContainer}>
          <FlatList
            data={visibleFilters}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      activeFilter === item.key
                        ? colors.primary
                        : colors.background,
                    borderColor:
                      activeFilter === item.key
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => handleFilterChange(item.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        activeFilter === item.key
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          />
        </View>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No plans available for this category
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                isSelected={selectedProduct?.id === item.id}
                onSelect={() => handleProductSelect(item)}
                markupPercent={markupMap.get(item.supplierOffers?.[0]?.supplierId || "") || 0}
                isEligibleForOffer={eligibleOfferIds.has(item.activeOffer?.id || "")}
                isGuest={isGuest}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: designTokens.spacing.sm,
  },
  filterContainer: {
    marginBottom: designTokens.spacing.md,
  },
  filterList: {
    paddingHorizontal: designTokens.spacing.xs,
  },
  filterTab: {
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
    marginRight: designTokens.spacing.sm,
  },
  filterText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
  },
  gridContent: {
    paddingHorizontal: designTokens.spacing.xs,
    paddingBottom: designTokens.spacing.xxl,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: designTokens.spacing.sm,
  },
  cardWrapper: {
    width: "48%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.xxl,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.xxl,
  },
  emptyText: {
    fontSize: designTokens.fontSize.base,
  },
});
