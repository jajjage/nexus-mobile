import { useForgotPassword } from "@/hooks/useAuth";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function ForgotPasswordScreen() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const canSubmit = email.length > 0 && email.includes("@") && !isPending;

  const handleSubmit = () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setError("");
    forgotPassword({ email });
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
                    <FormControl isInvalid={!!error}>
                      <FormControlLabel className="mb-2">
                        <FormControlLabelText className="text-typography-700 font-medium">
                          Email
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input variant="outline" size="xl" className="bg-background-0 rounded-xl">
                        <InputField
                          placeholder="m@example.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          onChangeText={(text) => {
                            setEmail(text);
                            setError("");
                          }}
                          value={email}
                          className="text-typography-900"
                          placeholderTextColor="#9CA3AF"
                        />
                      </Input>
                      {error && (
                        <FormControlError className="mt-1">
                          <FormControlErrorText>{error}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    {/* Submit Button */}
                    <Button
                      size="xl"
                      onPress={handleSubmit}
                      isDisabled={!canSubmit}
                      className={`mt-2 rounded-xl ${canSubmit ? 'bg-primary-500' : 'bg-primary-200'}`}
                    >
                      {isPending ? (
                        <ButtonSpinner color="white" />
                      ) : (
                        <ButtonText className={canSubmit ? 'text-white' : 'text-primary-400'}>
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
