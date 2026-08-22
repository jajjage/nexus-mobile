// components/dashboard/QuickActions.tsx
// Following HOME_PAGE_GUIDE.md specifications
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BadgeCheck, FileText, GraduationCap, MoreHorizontal, Phone, Tv, Wifi, Zap } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
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
    id: "data",
    label: "Data",
    Icon: Wifi,
    route: "/data",
  },
  {
    id: "airtime",
    label: "Airtime",
    Icon: Phone,
    route: "/airtime",
  },
  {
    id: "subscription",
    label: "Call Sub",
    Icon: BadgeCheck,
    route: "/subscription",
  },
  {
    id: "bills",
    label: "Bills",
    Icon: FileText,
    route: "/pay-bills",
  },
  {
    id: "electricity",
    label: "Electricity",
    Icon: Zap,
    route: "/electricity",
  },
  {
    id: "cable",
    label: "Cable TV",
    Icon: Tv,
    route: "/cable",
  },
  {
    id: "education",
    label: "Exam Pins",
    Icon: GraduationCap,
    route: "/education",
  },
  {
    id: "more",
    label: "More",
    Icon: MoreHorizontal,
    route: "/more-services",
  },
];

export function QuickActions() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Make Payment</Text>
      
      <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={() => handlePress(action.route)}
            activeOpacity={0.65}
          >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <action.Icon size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
          </TouchableOpacity>
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
    flexWrap: "wrap",
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
    width: "22%",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
