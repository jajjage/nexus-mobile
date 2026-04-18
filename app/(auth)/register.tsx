import { useValidateAgentCode } from "@/hooks/useAgent";
import { useRegister } from "@/hooks/useAuth";
import { agentService } from "@/services/agent.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams } from "expo-router";
import { Briefcase } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Keyboard,
    Platform,
    Pressable,
    TouchableWithoutFeedback
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { z } from "zod";

// Gluestack UI components
import { Alert } from "@/components/ui/alert";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
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

const isValidNigerianPhone = (phone: string): boolean => {
  if (phone.length !== 11 || !/^\d+$/.test(phone)) return false;
  const prefix = phone.substring(0, 3);
  return ['070', '080', '090', '081', '091'].includes(prefix);
};

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine((val) => val.length === 11, "Phone number must be 11 digits")
      .refine((val) => isValidNigerianPhone(val), "Invalid Nigerian phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agentCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ agentCode?: string; code?: string }>();
  const { mutate: register, isPending, errorMessage, reset } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agentCodeFromUrl, setAgentCodeFromUrl] = useState<string | undefined>(undefined);
  const [agentInfo, setAgentInfo] = useState<{ isValid: boolean; name?: string } | null>(null);

  // Get agent code from deep link or URL params
  useEffect(() => {
    const code = (params?.agentCode || params?.code)?.toString().trim().toUpperCase();
    
    if (code) {
      setAgentCodeFromUrl(code);
    }
  }, [params?.agentCode, params?.code]);
  // Validate agent code if provided
  const {
    data: validationResult,
    isError: isAgentValidationUnavailable,
    isLoading: isValidating,
  } = useValidateAgentCode(
    agentCodeFromUrl || ""
  );

  useEffect(() => {
    if (validationResult) {
      setAgentInfo({
        isValid: validationResult.valid,
        name: validationResult.referrerName,
      });
      return;
    }

    if (!isValidating) {
      setAgentInfo(null);
    }
  }, [validationResult, isValidating]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
    setError,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agentCode: agentCodeFromUrl || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (agentCodeFromUrl) {
      setValue("agentCode", agentCodeFromUrl);
    }
  }, [agentCodeFromUrl, setValue]);

  const hasKnownInvalidAgentCode =
    !!agentCodeFromUrl && validationResult?.valid === false;
  
  const canSubmit = isValid && !isPending && !isValidating && !hasKnownInvalidAgentCode;

  const onSubmit = async (data: RegisterFormData) => {
    const normalizedAgentCode = data.agentCode?.trim().toUpperCase();

    if (normalizedAgentCode) {
      try {
        const response = await agentService.validateAgentCode(normalizedAgentCode);
        const validation = response.data;

        if (!validation?.valid) {
          const message = validation?.message || "Invalid agent code";

          setError("agentCode", {
            type: "validate",
            message,
          });

          toast.error("Invalid Agent Code", {
            description: message,
          });
          return;
        }

        clearErrors("agentCode");
      } catch (error: any) {
        if (error?.response) {
          const message =
            error?.response?.data?.message || "Invalid agent code";

          setError("agentCode", {
            type: "validate",
            message,
          });

          toast.error("Invalid Agent Code", {
            description: message,
          });
          return;
        }

        console.warn(
          "[Register] Agent code validation unavailable, proceeding with signup:",
          error?.message || error
        );
      }
    } else {
      clearErrors("agentCode");
    }

    register({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
      agentCode: normalizedAgentCode || undefined,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraHeight={Platform.OS === "ios" ? 120 : 140}
          extraScrollHeight={Platform.OS === "ios" ? 40 : 120}
          keyboardOpeningTime={0}
          enableResetScrollToCoords={false}
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingHorizontal: 20, 
            paddingVertical: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
            {/* Logo */}
            <Center className="mb-6">
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-16 h-16"
                alt="Nexus Logo"
                resizeMode="contain"
              />
            </Center>

            {/* Register Card */}
            <Card variant="elevated" className="p-6 bg-background-0 rounded-2xl shadow-sm">
              <VStack space="lg">
                {/* Header */}
                <VStack space="sm">
                  <Heading size="xl" className="text-typography-900">Sign Up</Heading>
                  <Text size="sm" className="text-typography-500">
                    Enter your information to create an account
                  </Text>
                </VStack>

                {/* Agent Info Banner */}
                {agentCodeFromUrl && (
                  <VStack space="sm" className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <HStack space="md" className="items-center">
                      <Briefcase size={20} color="#E69E19" />
                      <VStack space="xs" className="flex-1">
                        {isValidating ? (
                          <Text className="text-primary-700">Verifying agent code...</Text>
                        ) : agentInfo?.isValid ? (
                          <>
                            <Text className="text-primary-700 font-semibold">Agent Code Verified!</Text>
                            <Text className="text-primary-600 text-sm">
                              You're signing up under agent {agentInfo.name}
                            </Text>
                          </>
                        ) : validationResult?.valid === false ? (
                          <Text className="text-error-700 text-sm">Invalid agent code</Text>
                        ) : isAgentValidationUnavailable ? (
                          <Text className="text-typography-600 text-sm">
                            We couldn&apos;t verify this code right now. We&apos;ll check again before signup.
                          </Text>
                        ) : (
                          <Text className="text-primary-700">Waiting to verify agent code...</Text>
                        )}
                      </VStack>
                    </HStack>
                  </VStack>
                )}

                {/* API Error Alert */}
                {errorMessage && (
                  <Alert
                    variant="error"
                    message={errorMessage}
                    closable
                    onClose={() => reset()}
                  />
                )}

                {/* Name Field */}
                <FormControl isInvalid={!!errors.fullName}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Full Name
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="fullName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="John Doe"
                          autoCapitalize="words"
                          autoComplete="name"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                      </Input>
                    )}
                  />
                  {errors.fullName && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>{errors.fullName.message}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Email Field */}
                <FormControl isInvalid={!!errors.email}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Email
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="m@example.com"
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
                  {errors.email && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>{errors.email.message}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Phone Field */}
                <FormControl isInvalid={!!errors.phoneNumber}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Phone Number
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="08012345678"
                          keyboardType="phone-pad"
                          maxLength={11}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                      </Input>
                    )}
                  />
                  {errors.phoneNumber && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>{errors.phoneNumber.message}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Agent Code Field (Optional or from deep link) */}
                {!agentCodeFromUrl && (
                  <FormControl isInvalid={!!errors.agentCode}>
                    <FormControlLabel className="mb-2">
                      <FormControlLabelText className="text-typography-700 font-medium">
                        Agent Code (Optional)
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Controller
                      control={control}
                      name="agentCode"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                          <InputField
                            placeholder="E.g. AGENT-ABC123"
                            autoCapitalize="characters"
                            onBlur={onBlur}
                            onChangeText={(text) => {
                              clearErrors("agentCode");
                              onChange(text.toUpperCase());
                            }}
                            value={value}
                            className="text-typography-900"
                            placeholderTextColor="#9CA3AF"
                          />
                        </Input>
                      )}
                    />
                    {errors.agentCode && (
                      <FormControlError className="mt-1">
                        <FormControlErrorText>{errors.agentCode.message}</FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}

                {/* Password Field */}
                <FormControl isInvalid={!!errors.password}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Password
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="••••••••"
                          secureTextEntry={!showPassword}
                          autoComplete="new-password"
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
                      <FormControlErrorText>{errors.password.message}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Confirm Password Field */}
                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormControlLabel className="mb-2">
                    <FormControlLabelText className="text-typography-700 font-medium">
                      Confirm Password
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="••••••••"
                          secureTextEntry={!showConfirmPassword}
                          autoComplete="new-password"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                        <InputSlot className="pr-4" onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Text className="text-primary-500 font-medium">
                            {showConfirmPassword ? "Hide" : "Show"}
                          </Text>
                        </InputSlot>
                      </Input>
                    )}
                  />
                  {errors.confirmPassword && (
                    <FormControlError className="mt-1">
                      <FormControlErrorText>{errors.confirmPassword.message}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>

                {/* Register Button */}
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
                      Create an account
                    </ButtonText>
                  )}
                </Button>

                {/* Login Link */}
                <Center className="mt-2">
                  <HStack space="xs">
                    <Text className="text-typography-500">Already have an account?</Text>
                    <Link href="/(auth)/login" asChild>
                      <Pressable>
                        <Text className="text-primary-500 font-semibold">Login</Text>
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
