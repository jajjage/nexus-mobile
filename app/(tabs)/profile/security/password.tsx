import { Box, Button, ButtonText, FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText, Input, InputField, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useUpdatePassword } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { toast } from "sonner-native";
import { z } from "zod";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Password must be at least 8 characters"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const updatePasswordMutation = useUpdatePassword();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await updatePasswordMutation.mutateAsync({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      reset();
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to change password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || updatePasswordMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Change Password",
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
        <Box className="p-4">
          <VStack space="lg">
          {/* Current Password */}
          <FormControl isInvalid={!!errors.currentPassword}>
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
                    placeholder="Enter your current password"
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.currentPassword && (
              <FormControlError>
                <FormControlErrorText>{errors.currentPassword.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* New Password */}
          <FormControl isInvalid={!!errors.newPassword}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">New Password</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="8+ chars, 1 uppercase, 1 lowercase, 1 number"
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.newPassword && (
              <FormControlError>
                <FormControlErrorText>{errors.newPassword.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Confirm Password */}
          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Confirm Password</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Re-enter your new password"
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.confirmPassword && (
              <FormControlError>
                <FormControlErrorText>{errors.confirmPassword.message}</FormControlErrorText>
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
              <ButtonText>{isSubmitting ? "Changing..." : "Change Password"}</ButtonText>
            </Button>
          </Box>
          </VStack>
        </Box>
      </ScrollView>
    </>
  );
}
