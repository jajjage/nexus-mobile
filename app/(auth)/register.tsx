// app/(auth)/register.tsx
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

// Valid Nigerian phone prefixes
const VALID_NIGERIAN_PREFIXES = [
  // MTN
  "0703", "0706", "0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916",
  // Airtel
  "0701", "0708", "0802", "0808", "0812", "0901", "0902", "0907", "0912",
  // Glo
  "0705", "0805", "0807", "0811", "0815", "0905", "0915",
  // 9mobile
  "0809", "0817", "0818", "0908", "0909",
];

const isValidNigerianPhone = (phone: string): boolean => {
  if (phone.length !== 11) return false;
  const prefix = phone.substring(0, 4);
  return VALID_NIGERIAN_PREFIXES.includes(prefix);
};

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(
        (val) => val.length === 11,
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      )
      .refine(
        (val) => isValidNigerianPhone(val),
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colors[colorScheme];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for real-time button state
  });

  // Watch all fields to determine if form is filled
  const name = watch("name");
  const email = watch("email");
  const phone = watch("phone");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const isFormFilled = name.length > 0 && email.length > 0 && phone.length > 0 && password.length > 0 && confirmPassword.length > 0;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement registration API call
      console.log("Register data:", data);
      
      router.replace("/(auth)/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
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
            <Text style={[styles.title, { color: theme.foreground }]}>Sign Up</Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Enter your information to create an account
            </Text>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}15` }]}>
                <Text style={[styles.errorText, { color: theme.destructive }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Name Field */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            {/* Email Field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="m@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Phone Field */}
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="08012345678"
                  keyboardType="phone-pad"
                  maxLength={11}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                />
              )}
            />

            {/* Password Field */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder=""
                  isPassword
                  autoComplete="new-password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            {/* Confirm Password Field */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder=""
                  isPassword
                  autoComplete="new-password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {/* Submit Button - Disabled until form is valid */}
            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid || !isFormFilled}
              style={styles.submitButton}
            >
              Create an account
            </Button>

            {/* Login Link */}
            <View style={styles.footer}>
              <Text style={{ color: theme.mutedForeground }}>
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={[styles.linkText, { color: theme.foreground }]}>
                    Login
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
  submitButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
