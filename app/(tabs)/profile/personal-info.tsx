import { Box, Button, ButtonText, FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText, Input, InputField, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { toast } from "sonner-native";
import { z } from "zod";

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  phoneNumber: z.string().regex(/^\d{10,}$/, "Invalid phone number"),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  const onSubmit = async (data: PersonalInfoFormData) => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success("Profile updated successfully");
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || updateProfileMutation.isPending;
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Personal Information",
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
          {/* Full Name */}
          <FormControl isInvalid={!!errors.fullName}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Full Name</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your full name"
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.fullName && (
              <FormControlError>
                <FormControlErrorText>{errors.fullName.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Email */}
          <FormControl isInvalid={!!errors.email}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Email Address</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.email && (
              <FormControlError>
                <FormControlErrorText>{errors.email.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Phone Number */}
          <FormControl isInvalid={!!errors.phoneNumber}>
            <FormControlLabel>
              <FormControlLabelText className="font-semibold">Phone Number</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { value, onChange } }) => (
                <Input className="rounded-lg" size="lg" isDisabled={isSubmitting}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                </Input>
              )}
            />
            {errors.phoneNumber && (
              <FormControlError>
                <FormControlErrorText>{errors.phoneNumber.message}</FormControlErrorText>
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
              <ButtonText>{isSubmitting ? "Saving..." : "Save Changes"}</ButtonText>
            </Button>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
    </>
  );
}
