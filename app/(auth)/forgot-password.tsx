import { useForgotPassword } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import React from "react";
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
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const email = watch("email");
  const canSubmit = isValid && email.length > 0 && !isPending;

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword({ email: data.email });
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
              <HStack space="sm" className="items-center">
                <Image
                  source={require("@/assets/images/icon.png")}
                  className="w-12 h-12"
                  alt="Nexus Logo"
                />
              </HStack>
            </Center>
            <Card variant="outline" className="p-6 bg-background-0 rounded-2xl">
              <VStack space="xl">
                {/* Header */}
                <VStack space="sm">
                  <Heading size="xl" className="text-typography-900">Forgot Password</Heading>
                  <Text size="sm" className="text-typography-500">
                    Enter your email address and we'll send you a link to reset your password
                  </Text>
                </VStack>

                {isSuccess ? (
                  <VStack space="md" className="bg-success-50 p-4 rounded-xl">
                    <Text className="text-success-700 text-center font-medium">
                      Check your email for a password reset link
                    </Text>
                  </VStack>
                ) : (
                  <>
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

                    {/* Submit Button */}
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
                          Send Reset Link
                        </ButtonText>
                      )}
                    </Button>
                  </>
                )}

                {/* Back to Login Link */}
                <Center className="mt-2">
                  <HStack space="xs">
                    <Text className="text-typography-500">Remember your password?</Text>
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
