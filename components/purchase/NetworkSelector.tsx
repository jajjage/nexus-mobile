/**
 * NetworkSelector - Horizontal scrollable network selector
 * Per mobile-airtime-data-guide Section 3.B
 */

import { darkColors, lightColors } from "@/constants/palette";
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

export interface NetworkSelectorProps {
  networks: NetworkInfo[];
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
    Haptics.selectionAsync().catch(() => {});
    onSelect(network);
  };

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
                      color: colors.background,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {info.name}
                </Text>
              )}

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
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  scrollContent: {
    gap: 8,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    height: 34,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  networkName: {
    fontSize: 12,
    fontWeight: "700",
  },
  detectedBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  detectedText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
