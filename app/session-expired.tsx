import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { LogIn, ShieldAlert } from "lucide-react-native";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionExpiredScreen() {
  const { colors } = useTheme();
  const { isSessionExpired } = useAuth();

  // This route is only meaningful for a confirmed expired session.
  useEffect(() => {
    if (!isSessionExpired) router.replace("/");
  }, [isSessionExpired]);

  if (!isSessionExpired) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.icon, { backgroundColor: `${colors.destructive}18` }]}>
          <ShieldAlert size={48} color={colors.destructive} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Session expired</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          For your security, your session has ended. Please log in again to continue.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in again"
          onPress={() => router.replace("/(auth)/login")}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <LogIn size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Log in again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  icon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  message: { fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 12, marginBottom: 28, maxWidth: 340 },
  button: { minHeight: 50, borderRadius: 14, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { fontSize: 16, fontWeight: "700" },
});
