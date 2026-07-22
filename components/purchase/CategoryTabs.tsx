/**
 * CategoryTabs - Compact wrapped category selector
 * Per mobile-airtime-data-guide & user-activity-and-mobile-catalog-experience spec
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { ProductCategory } from "@/types/product.types";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = designTokens.spacing.md * 2; // 16 * 2 = 32
const GAP = designTokens.spacing.sm; // 8

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelect: (categorySlug: string) => void;
  isLoading?: boolean;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
  isLoading = false,
}: CategoryTabsProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  // Sort categories by priority first, then name
  const sortedCategories = [...categories].sort((a, b) => {
    const priorityDiff = (a.priority || 0) - (b.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  const allTabs = sortedCategories.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    id: cat.id,
  }));

  const handleSelect = (slug: string) => {
    Haptics.selectionAsync();
    onSelect(slug);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (allTabs.length === 0) {
    return null; // Graceful empty state without breaking layout
  }

  // Calculate dynamic width for 3-column layout on 4+ items vs flex-equal for 1-3 items
  const count = allTabs.length;
  const isThreeColumnLayout = count >= 4;
  const itemWidth = isThreeColumnLayout
    ? (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * 2) / 3
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.wrapContainer}>
        {allTabs.map((tab) => {
          const isActive = selectedCategory === tab.slug;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isThreeColumnLayout
                  ? { width: itemWidth }
                  : { flex: 1, minWidth: 90 },
                {
                  backgroundColor: isActive ? colors.primary : "transparent",
                  borderColor: isActive ? colors.primary : colors.border,
                },
                isActive && styles.activeTab,
              ]}
              onPress={() => handleSelect(tab.slug)}
              activeOpacity={0.7}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.textSecondary,
                  },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  loadingContainer: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  wrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tab: {
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.sm,
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "600",
  },
});
