// components/dashboard/UserProfileCard.tsx
// Updated to match screenshot layout with logo-3 image
import { useTheme } from "@/context/ThemeContext";
import * as Clipboard from "expo-clipboard";
import { ChevronDown, Copy } from "lucide-react-native";
import React from "react";
import {
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface UserProfileCardProps {
  initials: string;
  fullName: string;
  phoneNumber: string;
}

export function UserProfileCard({ initials, fullName, phoneNumber }: UserProfileCardProps) {
  const { colors } = useTheme();
  
  const handleCopyPhone = async () => {
    await Clipboard.setStringAsync(phoneNumber);
    Alert.alert("Copied", "Phone number copied to clipboard");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Logo Avatar */}
      <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
        <Image 
          source={require("@/assets/images/logo-3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{fullName}</Text>
      </View>

      {/* Phone Number with Copy */}
      <View style={styles.phoneSection}>
        <Text style={[styles.phoneNumber, { color: colors.textSecondary }]}>{phoneNumber}</Text>
        <Pressable style={styles.dropdownIcon}>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={handleCopyPhone} hitSlop={8}>
          <Copy size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 15,
    marginLeft: 15,
    marginBottom: 8,
    borderRadius: 35,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  logo: {
    width: 40,
    height: 40,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
  },
  phoneSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phoneNumber: {
    fontSize: 13,
  },
  dropdownIcon: {
    padding: 2,
  },
});

