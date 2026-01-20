// app/(tabs)/profile.tsx
import { lightColors } from "@/constants/palette";
import { useAuth, useLogout } from "@/hooks/useAuth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
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
  const phone = user?.phoneNumber || "";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </View>
        
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.phone}>{phone}</Text>

        {/* Logout Button */}
        <Pressable 
          style={styles.logoutButton} 
          onPress={() => logout.mutate()}
        >
          <FontAwesome name="sign-out" size={18} color="#E63636" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: lightColors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: lightColors.textSecondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: lightColors.textSecondary,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E63636",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E63636",
  },
});
