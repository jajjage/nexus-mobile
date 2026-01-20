import { useLogin } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Gluestack UI components
import { Alert } from "@/components/ui/alert";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// Valid Nigerian phone prefixes
const VALID_NIGERIAN_PREFIXES = [
  "0703", "0706", "0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916",
  "0701", "0708", "0802", "0808", "0812", "0901", "0902", "0907", "0912",
  "0705", "0805", "0807", "0811", "0815", "0905", "0915",
  "0809", "0817", "0818", "0908", "0909",
];

const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const isValidNigerianPhone = (value: string): boolean => {
  if (value.length !== 11 || !/^\d+$/.test(value)) return false;
  const prefix = value.substring(0, 4);
  return VALID_NIGERIAN_PREFIXES.includes(prefix);
};

const loginSchema = z.object({
  credentials: z
    .string()
    .min(1, "Email or phone number is required")
    .refine(
      (val) => isValidEmail(val) || isValidNigerianPhone(val),
      "Enter a valid email or 11-digit Nigerian phone number"
    ),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { mutate: login, isPending, errorMessage, reset } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
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
    mode: "onChange",
  });

  const credentials = watch("credentials");
  const password = watch("password");
  const isFormFilled = credentials.length > 0 && password.length > 0;
  const canSubmit = isValid && isFormFilled && !isPending;

  const onSubmit = (data: LoginFormData) => {
    const isEmail = data.credentials.includes("@");
    
    // Only send the field that has a value (email OR phone, not both)
    const loginPayload: { email?: string; phone?: string; password: string; totpCode?: string } = {
      password: data.password,
    };
    
    if (isEmail) {
      loginPayload.email = data.credentials;
    } else {
      loginPayload.phone = data.credentials;
    }
    
    if (data.totpCode) {
      loginPayload.totpCode = data.totpCode;
    }
    
    login(loginPayload);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingHorizontal: 20, 
            paddingVertical: 24,
            paddingBottom: 40,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            {/* Logo */}
            <Center className="mb-8">
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-16 h-16"
                alt="Nexus Logo"
                resizeMode="contain"
              />
            </Center>

            {/* Login Card */}
            <Card variant="elevated" className="p-6 bg-background-0 rounded-2xl shadow-sm">
              <VStack space="xl">
                {/* Header */}
                <VStack space="sm">
                  <Heading size="xl" className="text-typography-900">Login</Heading>
                  <Text size="sm" className="text-typography-500">
                    Enter your email or phone number below to login to your account
                  </Text>
                </VStack>

                {/* API Error Alert */}
                {errorMessage && (
                  <Alert
                    variant="error"
                    message={errorMessage}
                    closable
                    onClose={() => reset()}
                  />
                )}

                {/* Email/Phone Field */}
                <FormControl isInvalid={!!errors.credentials}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Email or Phone Number
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="credentials"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="m@example.com or 08012345678"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                      </Input>
                    )}
                  />
                  {errors.credentials && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>
                        {errors.credentials.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Password Field */}
                <FormControl isInvalid={!!errors.password}>
                  <HStack className="justify-between items-center mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Password
                    </FormControlLabelText>
                    <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                      <Text className="text-primary-500 text-sm font-medium">
                        Forgot your password?
                      </Text>
                    </Pressable>
                  </HStack>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="••••••••"
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                        <InputSlot className="pr-4" onPress={() => setShowPassword(!showPassword)}>
                          <Text className="text-primary-500 font-medium">
                            {showPassword ? "Hide" : "Show"}
                          </Text>
                        </InputSlot>
                      </Input>
                    )}
                  />
                  {errors.password && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>
                        {errors.password.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* 2FA Field (conditional) */}
                {showTwoFactor && (
                  <FormControl>
                    <FormControlLabel className="mb-2">
                      <FormControlLabelText className="text-typography-700 font-medium">
                        2FA Code
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Controller
                      control={control}
                      name="totpCode"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                          <InputField
                            placeholder="Enter your 6-digit code"
                            keyboardType="number-pad"
                            maxLength={6}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-typography-900"
                          />
                        </Input>
                      )}
                    />
                  </FormControl>
                )}

                {/* Login Button */}
                <Button
                  size="xl"
                  onPress={handleSubmit(onSubmit)}
                  isDisabled={!canSubmit}
                  className={`mt-2 rounded-xl bg-primary-500 ${!canSubmit ? 'opacity-60' : ''}`}
                >
                  {isPending ? (
                    <ButtonSpinner color="white" />
                  ) : (
                    <ButtonText className="text-white">
                      Login
                    </ButtonText>
                  )}
                </Button>

                {/* Divider */}
                <HStack className="items-center my-2">
                  <Divider className="flex-1 bg-outline-200" />
                  <Text className="text-typography-400 text-xs px-4 uppercase">
                    or continue with
                  </Text>
                  <Divider className="flex-1 bg-outline-200" />
                </HStack>

                {/* Sign Up Link */}
                <Center>
                  <HStack space="xs">
                    <Text className="text-typography-500">
                      Don't have an account?
                    </Text>
                    <Link href="/(auth)/register" asChild>
                      <Pressable>
                        <Text className="text-primary-500 font-semibold">
                          Sign up
                        </Text>
                      </Pressable>
                    </Link>
                  </HStack>
                </Center>
              </VStack>
            </Card>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
