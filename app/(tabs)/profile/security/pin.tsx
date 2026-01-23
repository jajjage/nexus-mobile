import { Box, Button, ButtonText, FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText, Input, InputField, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useSetPin } from "@/hooks/usePin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { toast } from "sonner-native";
import { z } from "zod";

const pinSchema = z
  .object({
    pin: z
      .string()
      .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
    confirmPin: z.string(),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type PinFormData = z.infer<typeof pinSchema>;

export default function TransactionPinScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();
  const setPinMutation = useSetPin();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: "",
      confirmPin: "",
    },
  });

  const onSubmit = async (data: PinFormData) => {
    setIsLoading(true);
    try {
      await setPinMutation.mutateAsync({ pin: data.pin });
      toast.success("Transaction PIN set successfully");
      reset();
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to set PIN";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || setPinMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Transaction PIN",
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
          <Text className="text-base font-semibold text-typography-900">Transaction PIN</Text>
          <Text className="text-sm text-typography-700">
            Your 4-digit PIN is required to authorize purchase transactions (airtime, data, etc).
          </Text>
          {user?.hasPin && (
            <Text className="text-sm font-semibold text-success-600">✓ PIN is currently set</Text>
          )}
        </VStack>
      </Box>

      {/* Form */}
      <Box className="p-4">
        <VStack space="lg">
          {/* PIN */}
          <FormControl isInvalid={!!errors.pin}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">4-Digit PIN</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="pin"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="0000"
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.pin && (
              <FormControlError>
                <FormControlErrorText>{errors.pin.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Confirm PIN */}
          <FormControl isInvalid={!!errors.confirmPin}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Confirm PIN</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="confirmPin"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="0000"
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.confirmPin && (
              <FormControlError>
                <FormControlErrorText>{errors.confirmPin.message}</FormControlErrorText>
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
              <ButtonText>{isSubmitting ? "Setting..." : user?.hasPin ? "Update PIN" : "Set PIN"}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
    </>
  );
}
