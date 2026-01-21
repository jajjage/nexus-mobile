/**
 * NetworkSelector - Horizontal scrollable network selector
 * Per mobile-airtime-data-guide.md Section 3.B
 * Updated to support DYNAMIC network lists derived from API (Section 2.B)
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { NetworkInfo, NetworkProvider } from "@/lib/detectNetwork";
import * as Haptics from "expo-haptics";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface NetworkSelectorProps {
  networks: NetworkInfo[]; // Changed from hardcoded to prop
  selectedNetwork: NetworkProvider | null;
  onSelect: (network: NetworkProvider) => void;
  detectedNetwork?: NetworkProvider | null;
}

export function NetworkSelector({
  networks,
  selectedNetwork,
  onSelect,
  detectedNetwork,
}: NetworkSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const handleSelect = (network: NetworkProvider) => {
    Haptics.selectionAsync();
    onSelect(network);
  };

  // If no networks available yet (loading), show nothing or skeleton
  if (!networks || networks.length === 0) {
    return null; 
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        Select Network
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {networks.map((info) => {
          const isActive = selectedNetwork === info.slug;
          const isDetected = detectedNetwork === info.slug;

          return (
            <TouchableOpacity
              key={info.slug}
              style={[
                styles.networkItem,
                {
                  // Per guide: Active = inverted (bg-foreground, text-background)
                  backgroundColor: isActive
                    ? colors.foreground
                    : "transparent",
                  borderColor: isActive
                    ? colors.foreground
                    : colors.border,
                },
              ]}
              onPress={() => handleSelect(info.slug)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.2)"
                      : `${info.color}15`,
                  },
                ]}
              >
                {/* Use logo (alias) or logoUrl as fallback, handling local assets vs remote URLs */}
                <Image
                  source={
                    typeof (info.logo || info.logoUrl) === "string"
                      ? { uri: info.logo || info.logoUrl }
                      : info.logo || info.logoUrl
                  }
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>

              {isActive && (
                <Text
                  style={[
                    styles.networkName,
                    {
                      // Inverted text color when active
                      color: colors.background,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {info.name}
                </Text>
              )}

              {/* Auto-detected indicator */}
              {isDetected && !isActive && (
                <View
                  style={[
                    styles.detectedBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.detectedText}>Auto</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.md,
  },
  label: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
    marginBottom: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: designTokens.spacing.xs, // Reduced vertical padding
    paddingHorizontal: designTokens.spacing.sm, // Reduced horizontal padding
    borderRadius: designTokens.radius.full,
    borderWidth: 1.5,
    gap: designTokens.spacing.xs,
    // minWidth: 100, // Removed fixed minWidth to allow shrinking to logo only
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    overflow: "hidden", // Crop image to circle
  },
  logo: {
    width: "100%", // Fill container
    height: "100%",
  },
  networkName: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
  },
  detectedBadge: {
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: designTokens.radius.sm,
    marginLeft: designTokens.spacing.xs,
  },
  detectedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
