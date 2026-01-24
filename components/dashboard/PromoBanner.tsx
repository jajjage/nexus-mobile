// components/dashboard/PromoBanner.tsx
// Following HOME_PAGE_GUIDE.md specifications
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface PromoBannerProps {
  variant: "savings" | "cashback";
  onPress?: () => void;
}

export function PromoBanner({ variant, onPress }: PromoBannerProps) {
  const { colors, isDark } = useTheme();
  
  const config = {
    savings: {
      title: "Save & Secure",
      description: "Enjoy up to 15% interest on your savings.",
      buttonText: "Start Saving",
      backgroundColor: isDark ? "#0D3B66" : "#E3F2FD",
      accentColor: isDark ? "#64B5F6" : "#1565C0",
    },
    cashback: {
      title: "Unlimited Cashback",
      description: "Get up to 5% cashback on all your transactions this month!",
      buttonText: "Learn More",
      backgroundColor: isDark ? "#1B4332" : "#E8F5E9",
      accentColor: isDark ? "#81C784" : "#2E7D32",
    },
  };

  const { title, description, buttonText, backgroundColor, accentColor } = config[variant];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <Pressable
        style={[styles.button, { backgroundColor: accentColor }]}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

