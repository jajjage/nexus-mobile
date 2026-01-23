import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";

export default function WalletScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const features = [
    "Bank account linking",
    "Saved payment cards",
    "Wallet balance top-up",
    "Transaction history",
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Payment Methods",
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
      {/* Info Banner */}
      <Box className="flex-row items-center p-4 mx-4 my-4 bg-info-50 rounded-lg border-l-4 border-l-primary-600 gap-3">
        <FontAwesome name="credit-card" size={18} color="#E69E19" />
        <Text className="flex-1 text-sm text-typography-700">
          Manage your payment methods and bank accounts.
        </Text>
      </Box>

      {/* Coming Soon */}
      <VStack space="md" className="items-center justify-center py-16 px-8">
        <FontAwesome name="hourglass-half" size={48} color="#999999" />
        <Heading size="lg" className="font-semibold text-center mt-4">Coming Soon</Heading>
        <Text size="sm" className="text-center text-typography-500">
          Payment method management will be available in the next update.
        </Text>
      </VStack>

      {/* Feature List */}
      <Box className="mx-4 mb-8 p-4 bg-background-0 rounded-lg border border-outline-200">
        <Heading size="sm" className="font-semibold mb-4">Coming Features</Heading>
        <VStack space="md">
          {features.map((feature, index) => (
            <HStack key={index} space="md" className="items-center">
              <FontAwesome name="check" size={16} color="#22c55e" />
              <Text size="sm" className="text-typography-600">{feature}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </ScrollView>
    </>
  );
}
