import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useNotificationPreferences, useUpdateNotificationPreference } from "@/hooks/useNotificationPreferences";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Switch, TouchableOpacity, useColorScheme, View } from "react-native";

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferenceMutation = useUpdateNotificationPreference();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleTogglePreference = async (key: string, value: boolean) => {
    setLoadingKey(key);
    try {
      await updatePreferenceMutation.mutateAsync({
        category: key,
        subscribed: value,
      });
    } finally {
      setLoadingKey(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <ActivityIndicator size="large" color="#E69E19" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <FontAwesome name="exclamation-circle" size={40} color="#e63636" />
        <Text className="text-error-600 mt-3">Failed to load preferences</Text>
      </View>
    );
  }

  const buildPreferenceGroups = () => {
    if (!preferences || !Array.isArray(preferences)) return [];
    
    const prefMap = preferences.reduce((acc, pref) => {
      acc[pref.category] = pref.subscribed;
      return acc;
    }, {} as Record<string, boolean>);

    return [
      {
        title: "Transactions",
        description: "Purchase confirmations and receipts",
        items: [
          {
            key: "transaction_purchase_confirmation",
            label: "Purchase Confirmations",
            description: "Notify when purchases complete",
            value: prefMap.transaction_purchase_confirmation ?? true,
          },
          {
            key: "transaction_receipt",
            label: "Receipt Notifications",
            description: "Send receipt after each transaction",
            value: prefMap.transaction_receipt ?? true,
          },
        ],
      },
      {
        title: "Account",
        description: "Security and account updates",
        items: [
          {
            key: "account_password_change",
            label: "Password Changes",
            description: "Alert when password is changed",
            value: prefMap.account_password_change ?? true,
          },
          {
            key: "account_login_notification",
            label: "Login Notifications",
            description: "Notify on new device login",
            value: prefMap.account_login_notification ?? true,
          },
          {
            key: "account_security_alert",
            label: "Security Alerts",
            description: "Unusual account activity alerts",
            value: prefMap.account_security_alert ?? true,
          },
        ],
      },
      {
        title: "Promotions",
        description: "Offers and campaigns",
        items: [
          {
            key: "promo_special_offer",
            label: "Special Offers",
            description: "Exclusive deals and promotions",
            value: prefMap.promo_special_offer ?? false,
          },
          {
            key: "promo_cashback",
            label: "Cashback Alerts",
            description: "When you earn cashback rewards",
            value: prefMap.promo_cashback ?? true,
          },
          {
            key: "promo_referral_bonus",
            label: "Referral Bonuses",
            description: "When referrals are successful",
            value: prefMap.promo_referral_bonus ?? true,
          },
        ],
      },
    ];
  };

  const preferenceGroups = buildPreferenceGroups();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notification Preferences",
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
        <FontAwesome name="bell" size={18} color="#E69E19" />
        <Text className="flex-1 text-sm text-typography-700">
          Manage how and when we notify you about important updates.
        </Text>
      </Box>

      {/* Preference Groups */}
      {preferenceGroups.map((group, groupIndex) => (
        <Box key={groupIndex} className="px-4 mb-6">
          <VStack space="md">
            <VStack space="xs">
              <Heading size="md" className="font-semibold">{group.title}</Heading>
              <Text size="xs" className="text-typography-500">{group.description}</Text>
            </VStack>

            <Box className="bg-background-0 border border-outline-200 rounded-lg overflow-hidden">
              <VStack>
                {group.items.map((item, itemIndex) => (
                  <HStack
                    key={item.key}
                    space="md"
                    className={`flex-row items-center justify-between py-3 px-4 ${
                      itemIndex < group.items.length - 1 ? "border-b border-outline-100" : ""
                    }`}
                  >
                    <VStack space="xs" className="flex-1">
                      <Heading size="xs" className="font-semibold">{item.label}</Heading>
                      <Text size="xs" className="text-typography-500">{item.description}</Text>
                    </VStack>
                    <Switch
                      value={item.value}
                      onValueChange={(value) =>
                        handleTogglePreference(item.key, value)
                      }
                      disabled={loadingKey === item.key}
                      trackColor={{
                        false: "#d4d4d4",
                        true: "#E69E1940",
                      }}
                      thumbColor={item.value ? "#E69E19" : "#f4f4f4"}
                    />
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        </Box>
      ))}

      {/* Info Footer */}
      <Box className="flex-row items-start px-4 py-3 mx-4 mb-8 rounded-lg bg-background-100 border border-outline-200 gap-3">
        <FontAwesome name="info-circle" size={16} color="#E69E19" />
        <Text size="xs" className="flex-1 text-typography-700">
          You can always disable all notifications in your device settings, but we recommend keeping security alerts enabled.
        </Text>
      </Box>
    </ScrollView>
    </>
  );
}
