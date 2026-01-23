import { Box, Button, ButtonText, Card, Heading, HStack, VStack } from "@/components/ui";
import { useAuth, useLogout } from "@/hooks/useAuth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import { Alert, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const logout = useLogout();

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fullName = user?.fullName || "User";
  const email = user?.email || "";

  const menuItems = [
    {
      icon: "user",
      label: "Personal Information",
      description: "Edit name, email, phone",
      route: "personal-info",
    },
    {
      icon: "shield",
      label: "Security & Privacy",
      description: "Password, PIN, passcode, biometric",
      route: "security",
    },
    {
      icon: "bell",
      label: "Notifications",
      description: "Transaction & account alerts",
      route: "notifications",
    },
    {
      icon: "credit-card",
      label: "Payment Methods",
      description: "Manage your payment cards",
      route: "wallet",
    },
    {
      icon: "question-circle",
      label: "Help & Support",
      description: "FAQs and contact support",
      route: "support",
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Logout",
          onPress: () => logout.mutate(),
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background-50"
      style={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section with Avatar and Info */}
      <Box className="px-5 pt-6 pb-8">
        <VStack space="md" className="items-center">
          {/* Avatar Circle */}
          <Box className="w-20 h-20 rounded-full bg-primary-500 justify-center items-center shadow-lg">
            <Heading size="2xl" className="text-white font-bold">
              {getInitials(fullName)}
            </Heading>
          </Box>

          {/* User Info */}
          <VStack space="xs" className="items-center">
            <Heading size="lg" className="font-bold text-typography-900">
              {fullName}
            </Heading>
            <Heading size="sm" className="text-typography-500">
              {email}
            </Heading>
          </VStack>
        </VStack>
      </Box>

      {/* Menu Items Section */}
      <Box className="px-5 pb-8">
        <VStack space="md">
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(`/(tabs)/profile/${item.route}` as any)}
            >
              {({ pressed }) => (
                <Card
                  size="md"
                  variant={pressed ? "filled" : "elevated"}
                  className={`rounded-xl border border-outline-200 ${
                    pressed ? "bg-background-100" : "bg-background-0"
                  }`}
                >
                  <HStack className="flex-row items-center justify-between w-full">
                    <HStack space="md" className="flex-1 items-center">
                      {/* Icon */}
                      <Box className="w-12 h-12 rounded-lg bg-background-50 justify-center items-center">
                        <FontAwesome name={item.icon as any} size={20} color="#E69E19" />
                      </Box>

                      {/* Label and Description */}
                      <VStack space="xs" className="flex-1">
                        <Heading
                          size="sm"
                          className="font-semibold text-typography-900"
                        >
                          {item.label}
                        </Heading>
                        <Heading
                          size="xs"
                          className="text-typography-500 font-normal"
                        >
                          {item.description}
                        </Heading>
                      </VStack>
                    </HStack>

                    {/* Chevron */}
                    <ChevronRight size={18} color="#999999" />
                  </HStack>
                </Card>
              )}
            </Pressable>
          ))}
        </VStack>
      </Box>

      {/* Logout Section */}
      <Box className="px-5 pb-12">
        <Button
          onPress={handleLogout}
          className="bg-error-50 border border-error-200 rounded-xl"
        >
          <HStack space="md" className="items-center justify-center">
            <LogOut size={18} color="#E53935" />
            <ButtonText className="text-error-600 font-semibold text-base">
              Logout
            </ButtonText>
          </HStack>
        </Button>
      </Box>
    </ScrollView>
  );
}
