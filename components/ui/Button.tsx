// components/ui/Button.tsx
import { useColorScheme } from "@/components/useColorScheme";
import { borderRadius, colors, spacing } from "@/constants/theme";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];

  const getBackgroundColor = (): string => {
    if (disabled) return theme.muted;
    switch (variant) {
      case "primary":
        return theme.primary;
      case "secondary":
        return theme.secondary;
      case "destructive":
        return theme.destructive;
      case "ghost":
        return "transparent";
      default:
        return theme.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.mutedForeground;
    switch (variant) {
      case "primary":
        return theme.primaryForeground;
      case "secondary":
        return theme.foreground;
      case "destructive":
        return "#FFFFFF";
      case "ghost":
        return theme.foreground;
      default:
        return theme.primaryForeground;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
      case "md":
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case "lg":
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
      default:
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
    }
  };

  const buttonStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...getPadding(),
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: size === "sm" ? 14 : size === "lg" ? 18 : 16,
    fontWeight: "600",
  };

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && styles.pressed,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
