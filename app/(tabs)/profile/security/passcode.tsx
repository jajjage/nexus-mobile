import { Box, Button, ButtonText, FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText, Input, InputField, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useSetPasscode } from "@/hooks/usePasscode";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { toast } from "sonner-native";
import { z } from "zod";

  const passcodeSchema = z
  .object({
    passcode: z
      .string()
      .regex(/^\d{6}$/, "Passcode must be exactly 6 digits"),
    confirmPasscode: z.string(),
    currentPassword: z.string().optional(),
  })
  .refine((data) => data.passcode === data.confirmPasscode, {
    message: "Passcodes do not match",
    path: ["confirmPasscode"],
  });

type PasscodeFormData = z.infer<typeof passcodeSchema>;

export default function AppPasscodeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();
  const setPasscodeMutation = useSetPasscode();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasscodeFormData>({
    resolver: zodResolver(passcodeSchema),
    defaultValues: {
      passcode: "",
      confirmPasscode: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (data: PasscodeFormData) => {
    setIsLoading(true);
    try {
      await setPasscodeMutation.mutateAsync({
        passcode: data.passcode,
        currentPassword: user?.hasPasscode ? data.currentPassword : undefined,
      });
      toast.success("App passcode set successfully");
      reset();
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to set passcode";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || setPasscodeMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "App Passcode",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background-0" showsVerticalScrollIndicator={false}>
      {/* Info Section */}
      <Box className="mb-6 p-4 bg-info-50 rounded-lg border-l-4 border-l-primary-600">
        <VStack space="md">
          <Text className="text-base font-semibold text-typography-900">App Passcode</Text>
          <Text className="text-sm text-typography-700">
            Your 6-digit passcode locks the app when it runs in the background for more than 5 minutes.
          </Text>
          {user?.hasPasscode && (
            <Text className="text-sm font-semibold text-success-600">✓ Passcode is currently set</Text>
          )}
        </VStack>
      </Box>

      {/* Form */}
      <Box className="p-4">
        <VStack space="lg">
          {/* Current Password (if updating) */}
          {user?.hasPasscode && (
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="font-semibold">Current Password</FormControlLabelText>
              </FormControlLabel>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { value, onChange } }) => (
                  <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter account password"
                      autoCapitalize="none"
                      secureTextEntry
                      editable={!isSubmitting}
                    />
                  </Input>
                )}
              />
            </FormControl>
          )}

          {/* New Passcode */}
          <FormControl isInvalid={!!errors.passcode}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">New Passcode (6 digits)</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="passcode"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.passcode && (
              <FormControlError>
                <FormControlErrorText>{errors.passcode.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Confirm Passcode */}
          <FormControl isInvalid={!!errors.confirmPasscode}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Confirm Passcode</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="confirmPasscode"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.confirmPasscode && (
              <FormControlError>
                <FormControlErrorText>{errors.confirmPasscode.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Submit Button */}
          <Box className="mt-6">
            <Button 
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              action={isSubmitting ? "secondary" : "primary"}
              size="lg"
              className="rounded-lg"
            >
              <ButtonText>{isSubmitting ? "Setting..." : user?.hasPasscode ? "Update Passcode" : "Set Passcode"}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
    </>
  );
}
