/**
 * Transfer Screen - Placeholder
 * Coming soon feature
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, ArrowRightLeft, Sparkles } from "lucide-react-native";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransferScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Transfer",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <ArrowRightLeft size={64} color={colors.primary} strokeWidth={1.5} />
        </View>

        {/* Coming Soon Badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
          ]}
        >
          <Sparkles size={16} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            Coming Soon
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Transfer Money
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Send money instantly to other Nexus users, bank accounts, or mobile wallets.
          This feature is currently under development and will be available soon!
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <FeatureItem
            text="Instant transfers to other Nexus users"
            colors={colors}
          />
          <FeatureItem
            text="Send to any Nigerian bank account"
            colors={colors}
          />
          <FeatureItem
            text="Transfer to mobile wallets"
            colors={colors}
          />
          <FeatureItem
            text="Schedule recurring transfers"
            colors={colors}
          />
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backHomeButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.backHomeText,
              { color: colors.primaryForeground },
            ]}
          >
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureBullet,
          { backgroundColor: colors.primary },
        ]}
      />
      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: designTokens.spacing.xs,
    marginLeft: -designTokens.spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: designTokens.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: designTokens.spacing.lg,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
    marginBottom: designTokens.spacing.md,
  },
  badgeText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
  },
  title: {
    fontSize: designTokens.fontSize["3xl"],
    fontWeight: "700",
    textAlign: "center",
    marginBottom: designTokens.spacing.md,
  },
  description: {
    fontSize: designTokens.fontSize.base,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: designTokens.spacing.xl,
  },
  featuresList: {
    width: "100%",
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    flex: 1,
    fontSize: designTokens.fontSize.sm,
    lineHeight: 20,
  },
  backHomeButton: {
    width: "100%",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  backHomeText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
});
