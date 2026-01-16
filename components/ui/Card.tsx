// components/ui/Card.tsx
import { useColorScheme } from "@/components/useColorScheme";
import { borderRadius, colors, spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
  ...props
}: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];

  const getPadding = (): number => {
    switch (padding) {
      case "none":
        return 0;
      case "sm":
        return spacing.sm;
      case "md":
        return spacing.md;
      case "lg":
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: theme.border,
        };
      default:
        return {};
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          padding: getPadding(),
        },
        getVariantStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
  },
});
