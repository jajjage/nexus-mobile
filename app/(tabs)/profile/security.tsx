import { Box, Card, Heading, HStack, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, TouchableOpacity, useColorScheme } from "react-native";

export default function SecurityHubScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();

  const securityItems = [
    {
      icon: "lock",
      label: "Password",
      description: "Change your login password",
      route: "profile/security/password",
      badge: null,
    },
    {
      icon: "hashtag",
      label: "Transaction PIN",
      description: "Set or update 4-digit PIN",
      route: "profile/security/pin",
      badge: user?.hasPin ? "✓ Set" : "Not Set",
    },
    {
      icon: "mobile",
      label: "App Passcode",
      description: "Set 6-digit app lock code",
      route: "profile/security/passcode",
      badge: user?.hasPasscode ? "✓ Set" : "Not Set",
    },
    {
      icon: "fingerprint",
      label: "Biometric Devices",
      description: "Manage fingerprint & face recognition",
      route: "profile/security/biometric",
      badge: null,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Security Settings",
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
      <ScrollView 
        className="flex-1 bg-background-0"
        showsVerticalScrollIndicator={false}
      >
      {/* Security Info Banner */}
      <Box className="flex-row items-center p-4 mx-4 my-4 bg-info-50 rounded-lg border-l-4 border-l-primary-600 gap-3">
        <FontAwesome name="shield" size={20} color="#E69E19" />
        <Text className="flex-1 text-sm text-typography-700">
          Secure your account with strong passwords and biometric authentication.
        </Text>
      </Box>

      {/* Security Items */}
      <Box className="px-4 pb-5">
        <VStack space="md">
          {securityItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(item.route as any)}
              className="active:opacity-70"
            >
              <Card className="rounded-lg border border-outline-200 p-4 bg-background-0">
                <HStack className="flex-row items-center justify-between">
                  <HStack space="md" className="flex-1 items-center">
                    <Box className="w-10 h-10 rounded-lg bg-info-50 justify-center items-center">
                      <FontAwesome
                        name={item.icon as any}
                        size={20}
                        color="#E69E19"
                      />
                    </Box>
                    <VStack className="flex-1">
                      <Heading size="sm" className="font-semibold">{item.label}</Heading>
                      <Text size="xs" className="text-typography-500">{item.description}</Text>
                    </VStack>
                  </HStack>
                  <HStack space="md" className="items-center">
                    {item.badge && (
                      <Text
                        size="xs"
                        className={`font-semibold ${
                          item.badge === "✓ Set"
                            ? "text-success-600"
                            : "text-typography-500"
                        }`}
                      >
                        {item.badge}
                      </Text>
                    )}
                    <FontAwesome
                      name="chevron-right"
                      size={14}
                      color="#999999"
                    />
                  </HStack>
                </HStack>
              </Card>
            </Pressable>
          ))}
        </VStack>
      </Box>
    </ScrollView>
    </>
  );
}
