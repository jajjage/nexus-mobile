/**
 * CategoryTabs - Horizontal Scrollable Category Selector
 * Per mobile-airtime-data-guide & user-activity-and-mobile-catalog-experience spec
 */

import { darkColors, lightColors } from "@/constants/palette";
import { ProductCategory } from "@/types/product.types";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export interface CategoryTabsProps {
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
    Haptics.selectionAsync().catch(() => {});
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
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {allTabs.map((tab) => {
          const isActive = selectedCategory === tab.slug;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : "transparent",
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelect(tab.slug)}
              activeOpacity={0.7}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.textSecondary,
                  },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    gap: 8,
  },
  tab: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
