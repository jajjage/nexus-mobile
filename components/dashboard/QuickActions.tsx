// components/dashboard/QuickActions.tsx
// Following HOME_PAGE_GUIDE.md specifications
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Phone, Receipt, Send, Wifi } from "lucide-react-native";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface QuickAction {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
}

const actions: QuickAction[] = [
  {
    id: "transfer",
    label: "Transfer",
    Icon: Send,
    route: "/transfer",
  },
  {
    id: "airtime",
    label: "Airtime",
    Icon: Phone,
    route: "/airtime",
  },
  {
    id: "data",
    label: "Data",
    Icon: Wifi,
    route: "/data",
  },
  {
    id: "bills",
    label: "Pay Bills",
    Icon: Receipt,
    route: "/pay-bills",
  },
];

export function QuickActions() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handlePress = (route: string) => {
    console.log("Navigate to:", route);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Make Payment</Text>
      
      <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={styles.actionItem}
            onPress={() => handlePress(action.route)}
          >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <action.Icon size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  actionsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    padding: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
});

