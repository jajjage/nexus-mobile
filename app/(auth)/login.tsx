// app/(auth)/login.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useColorScheme } from "@/components/useColorScheme";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  credentials: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      credentials: "",
      password: "",
      totpCode: "",
    },
    mode: "onChange", // Validate on change for real-time button state
  });

  // Watch all fields to determine if form is filled
  const credentials = watch("credentials");
  const password = watch("password");
  const isFormFilled = credentials.length > 0 && password.length > 0;

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.credentials, data.password, data.totpCode || undefined);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("2FA") || err.message.includes("TOTP")) {
          setShowTwoFactor(true);
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="elevated" padding="lg" style={styles.card}>
            {/* Header */}
            <Text style={[styles.title, { color: theme.foreground }]}>Login</Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Enter your email or phone number below to login to your account
            </Text>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}15` }]}>
                <Text style={[styles.errorText, { color: theme.destructive }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Email or Phone Field */}
            <Controller
              control={control}
              name="credentials"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email or Phone Number"
                  placeholder="m@example.com or 08012345678"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.credentials?.message}
                />
              )}
            />

            {/* Password Field with Forgot Link */}
            <View style={styles.passwordHeader}>
              <Text style={[styles.label, { color: theme.foreground }]}>Password</Text>
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text style={[styles.forgotLink, { color: theme.foreground }]}>
                  Forgot your password?
                </Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="••••••••"
                  isPassword
                  autoComplete="password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            {showTwoFactor && (
              <Controller
                control={control}
                name="totpCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="2FA Code"
                    placeholder="Enter your 6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    hint="Enter the code from your authenticator app"
                  />
                )}
              />
            )}

            {/* Login Button - Disabled until form is valid */}
            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || !isFormFilled}
              style={styles.submitButton}
            >
              Login
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.mutedForeground }]}>
                OR CONTINUE WITH
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={{ color: theme.mutedForeground }}>
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={[styles.linkText, { color: theme.foreground }]}>
                    Sign up
                  </Text>
                </Pressable>
              </Link>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  errorBox: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  forgotLink: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
  submitButton: {
    marginTop: spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    fontSize: 12,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
