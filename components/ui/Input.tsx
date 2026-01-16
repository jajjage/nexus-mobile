// components/ui/Input.tsx
import { useColorScheme } from "@/components/useColorScheme";
import { borderRadius, colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  style,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return theme.destructive;
    if (isFocused) return theme.primary;
    return theme.border;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderColor: getBorderColor(),
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.foreground,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={theme.mutedForeground}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.mutedForeground}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
