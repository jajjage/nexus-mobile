import { useTheme } from "@/context/ThemeContext";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Rocket, Sparkles, Zap } from "lucide-react-native";
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MoreServicesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const upcomingFeatures = [
    {
      title: "Bank Transfer",
      description: "Send money to any bank account in Nigeria instantly.",
      Icon: Zap,
      color: "#E69E19",
    },
    {
      title: "Gift Cards",
      description: "Buy and sell popular gift cards at the best rates.",
      Icon: Sparkles,
      color: "#9333EA",
    },
    {
      title: "Virtual Dollar Card",
      description: "Get a virtual card for your international online payments.",
      Icon: Rocket,
      color: "#2563EB",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>More Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : "#FFF" }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
            <Sparkles size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Exciting Things are Coming!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We're working hard to bring you more value. Stay tuned for these amazing features landing soon!
          </Text>
        </View>

        <View style={styles.featuresList}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>UPCOMING FEATURES</Text>
          
          {upcomingFeatures.map((feature, index) => (
            <View 
              key={index} 
              style={[styles.featureItem, { backgroundColor: isDark ? colors.card : "#FFF", borderColor: colors.border }]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                <feature.Icon size={20} color={feature.color} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{feature.description}</Text>
              </View>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Have a suggestion? Reach out to our support team!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  featuresList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  comingSoonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
  },
});
