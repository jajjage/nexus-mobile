import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { Stack, useRouter } from "expo-router";
import { ArrowRight, Key, Layers, Store, Upload } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResellerDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      title: "API Keys",
      description: "Manage your API keys for integration",
      icon: Key,
      route: "/reseller-hub/api-keys",
      color: colors.primary,
    },
    {
      title: "Bulk Topup",
      description: "Process multiple transactions via CSV",
      icon: Upload,
      route: "/reseller-hub/bulk-topup",
      color: colors.secondary || "#4CAF50", // Fallback green
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Store size={24} color={colors.primary} />
            </View>
            <View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>Reseller Hub</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your business</Text>
            </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tools</Text>
        
        <View style={styles.grid}>
            {menuItems.map((item, index) => (
            <TouchableOpacity
                key={index}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(item.route as any)}
            >
                <View style={[styles.cardIcon, { backgroundColor: item.color + '20' }]}>
                    <item.icon size={24} color={item.color} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
                <ArrowRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            ))}
        </View>
        
        {/* Placeholder for stats */}
        <View style={[styles.promoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Layers size={32} color={colors.textSecondary} />
            <Text style={[styles.promoText, { color: colors.textSecondary }]}>
                Analytics & Reports coming soon
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: designTokens.spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: designTokens.spacing.md,
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  headerTitle: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "700",
  },
  headerSubtitle: {
      fontSize: designTokens.fontSize.sm,
  },
  content: {
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.lg,
  },
  sectionTitle: {
      fontSize: designTokens.fontSize.lg,
      fontWeight: '600',
      marginBottom: designTokens.spacing.sm,
  },
  grid: {
      gap: designTokens.spacing.md,
  },
  card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: designTokens.spacing.md,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      gap: designTokens.spacing.md,
  },
  cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  },
  cardContent: {
      flex: 1,
  },
  cardTitle: {
      fontSize: designTokens.fontSize.base,
      fontWeight: '600',
      marginBottom: 2,
  },
  cardDesc: {
      fontSize: designTokens.fontSize.sm,
  },
  promoBox: {
      padding: designTokens.spacing.xl,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: designTokens.spacing.md,
      marginTop: designTokens.spacing.md,
  },
  promoText: {
      fontSize: designTokens.fontSize.sm,
      fontWeight: '500',
  }

});
