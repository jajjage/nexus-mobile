import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { useNotificationPreferences, useUpdateNotificationPreference } from "@/hooks/useNotificationPreferences";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Switch, TouchableOpacity, View } from "react-native";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

  const CATEGORY_META: Record<string, { label: string; description: string }> = {
    transaction_purchase_confirmation: {
      label: "Purchase Confirmations",
      description: "Notify when purchases complete",
    },
    transaction_receipt: {
      label: "Receipt Notifications",
      description: "Send receipt after each transaction",
    },
    account_password_change: {
      label: "Password Changes",
      description: "Alert when password is changed",
    },
    account_login_notification: {
      label: "Login Notifications",
      description: "Notify on new device login",
    },
    account_security_alert: {
      label: "Security Alerts",
      description: "Unusual account activity alerts",
    },
    promo_special_offer: {
      label: "Special Offers",
      description: "Exclusive deals and promotions",
    },
    promo_cashback: {
      label: "Cashback Alerts",
      description: "When you earn cashback rewards",
    },
    promo_referral_bonus: {
      label: "Referral Bonuses",
      description: "When referrals are successful",
    },
  };

  const buildPreferenceGroups = () => {
    // Access the 'data' property from the backend response
    const prefsList = preferences?.data || [];
    
    if (!Array.isArray(prefsList) || prefsList.length === 0) return [];

    // Group items by their prefix (e.g., 'transaction', 'account')
    const groups: Record<string, any[]> = {};

    prefsList.forEach((pref) => {
      const parts = pref.category.split('_');
      const groupKey = parts[0] || 'other';
      const meta = CATEGORY_META[pref.category] || {
        label: pref.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: "Receive updates for this category",
      };

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push({
        key: pref.category,
        label: meta.label,
        description: meta.description,
        value: pref.subscribed,
      });
    });

    const groupTitles: Record<string, { title: string; description: string }> = {
      transaction: { title: "Transactions", description: "Purchase confirmations and receipts" },
      account: { title: "Account", description: "Security and account updates" },
      promo: { title: "Promotions", description: "Offers and campaigns" },
      other: { title: "General", description: "Other notifications" },
    };

    return Object.keys(groups).map((key) => ({
      ... (groupTitles[key] || { title: key.charAt(0).toUpperCase() + key.slice(1), description: "" }),
      items: groups[key],
    }));
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
      {preferenceGroups.length === 0 ? (
        <Box className="flex-1 justify-center items-center py-20 px-10">
          <FontAwesome name="bell-slash" size={40} color={colors.textDisabled} />
          <Text className="text-typography-500 mt-4 text-center">
            No notification categories available at this time.
          </Text>
        </Box>
      ) : preferenceGroups.map((group, groupIndex) => (
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
