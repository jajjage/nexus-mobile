// components/dashboard/ResellerBanner.tsx
// Following HOME_PAGE_GUIDE.md specifications
import { lightColors } from "@/constants/palette";
import { Sparkles } from "lucide-react-native";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text
} from "react-native";

interface ResellerBannerProps {
  onPress?: () => void;
}

export function ResellerBanner({ onPress }: ResellerBannerProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Sparkles size={16} color={lightColors.primary} />
      <Text style={styles.text}>
        Become a Reseller — <Text style={styles.highlight}>Get 10% OFF</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDE7", // Light amber
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: lightColors.textPrimary, // #2E2E33
  },
  highlight: {
    color: lightColors.primary, // #E69E19
    fontWeight: "600",
  },
});
