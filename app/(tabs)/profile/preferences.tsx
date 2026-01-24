/**
 * App Preferences Screen
 * Allows users to control app behavior settings
 */

import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function PreferencesScreen() {
  const { colors, themePreference, setThemePreference, isDark } = useTheme();
  const router = useRouter();
  const { preferences, updatePreference, isLoading } = useAppPreferences();

  const handleToggle = async (
    key: keyof typeof preferences,
    value: boolean,
    label: string
  ) => {
    await updatePreference(key, value);
    toast.success("Preference updated", {
      description: `${label} ${value ? "enabled" : "disabled"}`,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading preferences...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "App Preferences",
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Feedback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Feedback
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                  Haptic Feedback
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Enable vibration feedback when interacting with the app
                </Text>
              </View>
              <Switch
                value={preferences.hapticsEnabled}
                onValueChange={(value) =>
                  handleToggle("hapticsEnabled", value, "Haptic feedback")
                }
                trackColor={{
                  false: colors.muted,
                  true: `${colors.primary}80`,
                }}
                thumbColor={preferences.hapticsEnabled ? colors.primary : colors.border}
              />
            </View>
          </View>
        </View>

        {/* Section: Navigation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Navigation
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                  Auto-Redirect After Purchase
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Automatically return to home screen after successful purchase
                </Text>
              </View>
              <Switch
                value={preferences.autoRedirectAfterPurchase}
                onValueChange={(value) =>
                  handleToggle("autoRedirectAfterPurchase", value, "Auto-redirect")
                }
                trackColor={{
                  false: colors.muted,
                  true: `${colors.primary}80`,
                }}
                thumbColor={
                  preferences.autoRedirectAfterPurchase ? colors.primary : colors.border
                }
              />
            </View>
          </View>
        </View>

        {/* Section: Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Appearance
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Theme
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Choose your preferred app theme
              </Text>
            </View>

            <View style={styles.themeOptions}>
              {(['light', 'dark', 'system'] as const).map((themeOption) => (
                <TouchableOpacity
                  key={themeOption}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themePreference === themeOption ? `${colors.primary}20` : colors.card,
                      borderColor: themePreference === themeOption ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={async () => {
                    await setThemePreference(themeOption);
                    toast.success('Theme updated', {
                      description: `Theme set to ${themeOption === 'system' ? 'System Default' : themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}`,
                    });
                  }}
                >
                  <View style={[
                    styles.radioCircle,
                    {
                      borderColor: themePreference === themeOption ? colors.primary : colors.border,
                      backgroundColor: themePreference === themeOption ? colors.primary : 'transparent',
                    },
                  ]} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themePreference === themeOption ? colors.primary : colors.foreground },
                  ]}>
                    {themeOption === 'system' ? 'System Default' : themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.muted }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 Changes are saved automatically and take effect immediately.
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
  backButton: {
    padding: designTokens.spacing.xs,
    marginLeft: -designTokens.spacing.xs,
  },
  loadingText: {
    textAlign: "center",
    marginTop: designTokens.spacing.xxl,
    fontSize: designTokens.fontSize.base,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: designTokens.spacing.md,
  },
  section: {
    marginBottom: designTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "700",
    marginBottom: designTokens.spacing.md,
  },
  settingCard: {
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    padding: designTokens.spacing.md,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
    marginRight: designTokens.spacing.md,
  },
  settingLabel: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
    marginBottom: designTokens.spacing.xs,
  },
  settingDescription: {
    fontSize: designTokens.fontSize.sm,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.md,
    marginTop: designTokens.spacing.md,
  },
  infoText: {
    fontSize: designTokens.fontSize.sm,
    lineHeight: 20,
  },
  themeOptions: {
    marginTop: designTokens.spacing.md,
    gap: designTokens.spacing.sm,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: designTokens.spacing.sm,
  },
  themeOptionText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "500",
  },
});
