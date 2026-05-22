import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, GraduationCap, Tv, Zap } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const billOptions = [
  {
    title: "Electricity",
    description: "Pay prepaid and postpaid meter bills.",
    href: "/electricity",
    icon: Zap,
  },
  {
    title: "Cable TV",
    description: "Renew or change DSTV, GOtv, and Startimes subscriptions.",
    href: "/cable",
    icon: Tv,
  },
  {
    title: "Exam Pins",
    description: "Buy WAEC and JAMB registration or result checker pins.",
    href: "/education",
    icon: GraduationCap,
  },
] as const;

export default function PayBillsScreen() {
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
          title: "Pay Bills",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {billOptions.map(option => {
          const Icon = option.icon;
          return (
            <Pressable
              key={option.href}
              onPress={() => router.push(option.href)}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Icon size={24} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {option.title}
                </Text>
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                >
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
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
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
  },
  card: {
    minHeight: 104,
    borderRadius: 16,
    borderWidth: 1,
    padding: designTokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
