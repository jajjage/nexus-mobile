import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { useBiometricEnrollments, useDeleteBiometricEnrollment } from "@/hooks/useBiometricManagement";
import { useBiometricRegistration } from "@/hooks/useBiometricRegistration";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function BiometricDevicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: enrollments, isLoading, error, refetch } = useBiometricEnrollments();
  const deleteEnrollmentMutation = useDeleteBiometricEnrollment();
  const { registerBiometric, isLoading: isEnrolling } = useBiometricRegistration();
  const { updateUser } = useAuthContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingBiometric, setTogglingBiometric] = useState(false);
  
  // Local state for current device enrollment
  const [isLocalEnrolled, setIsLocalEnrolled] = useState(false);

  // Check local enrollment status on mount
  useEffect(() => {
    checkLocalStatus();
  }, []);

  const checkLocalStatus = async () => {
    try {
      const enrolled = await AsyncStorage.getItem("biometric_enrolled");
      setIsLocalEnrolled(enrolled === "true");
    } catch (e) {
      console.error("Failed to check local biometric status", e);
    }
  };

  const handleRemoveDevice = async (enrollmentId: string, deviceName: string) => {
    setDeletingId(enrollmentId);
    try {
      await deleteEnrollmentMutation.mutateAsync({
        enrollmentId,
        reason: "User-initiated removal",
      });
    } catch (error) {
      // Error already shown by toast
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle biometric on/off for current device
  const handleToggleBiometric = async () => {
    setTogglingBiometric(true);
    try {
      if (isLocalEnrolled) {
        // Turn OFF: 
        // 1. Find the backend enrollment for this device (best effort match)
        // If we can't find it easily, we just clear local state and backend user flag?
        // Ideally we revoke the specific credential.
        // For now, we update local state and try to find a matching enrollment to revoke.
        
        console.log("[BiometricDevicesScreen] Disabling biometric for current device");
        
        // Attempt to find enrollment to revoke (active, same platform)
        // This is a heuristic. Ideally we store the credentialId locally.
        const enrollmentToRevoke = enrollments?.find(
            (e) => e.is_active && e.platform === Platform.OS
        );

        if (enrollmentToRevoke) {
             await deleteEnrollmentMutation.mutateAsync({
                enrollmentId: enrollmentToRevoke.id,
                reason: "User disabled biometric on this device",
             });
        }

        // Always clear local state
        await AsyncStorage.removeItem("biometric_enrolled");
        setIsLocalEnrolled(false);
        
        Alert.alert("Success", "Biometric has been disabled on this device");

      } else {
        // Turn ON: Register biometric for current device
        console.log("[BiometricDevicesScreen] Starting biometric enrollment for current device");
        const result = await registerBiometric();
        
        if (result.success && result.enrolled) {
          // Update user state
          updateUser({ hasBiometric: true });
          // Update local state
          await AsyncStorage.setItem("biometric_enrolled", "true");
          setIsLocalEnrolled(true);
          
          // Refetch devices list
          await refetch();
          Alert.alert("Success", "Biometric has been enabled on this device");
        } else {
          Alert.alert("Enrollment Failed", result.message || "Please try again");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update biometric setting");
    } finally {
      setTogglingBiometric(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "ios":
        return "apple";
      case "android":
        return "android";
      case "macos":
        return "apple";
      case "windows":
        return "windows";
      default:
        return "mobile";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <FontAwesome name="exclamation-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.destructive }]}>Failed to load devices</Text>
      </View>
    );
  }

  const activeDevices = enrollments?.filter((e) => e.is_active) || [];
  const inactiveDevices = enrollments?.filter((e) => !e.is_active) || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isDark ? `${colors.primary}15` : "#f0f7ff", borderLeftColor: colors.primary }]}>
        <FontAwesome name="lock" size={18} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.foreground }]}>
          Manage your registered biometric devices for secure authentication.
        </Text>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.mutedForeground }}>
            Loading devices...
          </Text>
        </View>
      )}

      {/* Current Device Biometric Toggle Section */}
      {!isLoading && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Device</Text>
          <View style={[styles.toggleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <View style={[styles.toggleIconBg, { backgroundColor: isDark ? `${colors.primary}15` : "#f0f7ff" }]}>
                <FontAwesome
                  name="mobile"
                  size={20}
                  color={isLocalEnrolled ? colors.primary : colors.mutedForeground}
                />
              </View>
              <View style={styles.toggleDetails}>
                <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                    Biometric {Platform.OS === "ios" ? "Face ID" : "Fingerprint"}
                </Text>
                <Text style={[styles.toggleStatus, { color: colors.mutedForeground }]}>
                  {isLocalEnrolled ? "Enabled on this device" : "Not enabled on this device"}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.toggleButton,
                isLocalEnrolled && { backgroundColor: isDark ? `${colors.success}20` : "#e8f5e9" },
                !isLocalEnrolled && { backgroundColor: isDark ? colors.border : "#f5f5f5" },
                pressed && styles.toggleButtonPressed,
                togglingBiometric && styles.toggleButtonDisabled,
              ]}
              onPress={handleToggleBiometric}
              disabled={togglingBiometric}
            >
              {togglingBiometric ? (
                <ActivityIndicator 
                  size="small" 
                  color={isLocalEnrolled ? colors.success : colors.mutedForeground}
                />
              ) : (
                <View
                  style={[
                    styles.toggleSwitch,
                    isLocalEnrolled ? { backgroundColor: colors.success, alignItems: 'flex-end' } : { backgroundColor: "#ccc", alignItems: 'flex-start' },
                  ]}
                >
                  <View style={styles.toggleDot} />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Active Devices */}
      {activeDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Registered Devices ({activeDevices.length})</Text>
          <View style={styles.devicesList}>
            {activeDevices.map((device) => (
              <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <View style={[styles.deviceIconBg, { backgroundColor: isDark ? `${colors.primary}15` : "#f0f7ff" }]}>
                      <FontAwesome
                        name={getPlatformIcon(device.platform)}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={[styles.deviceName, { color: colors.foreground }]}>{device.device_name}</Text>
                      <Text style={[styles.deviceMeta, { color: colors.mutedForeground }]}>
                        {device.platform.charAt(0).toUpperCase() + device.platform.slice(1)} •{" "}
                        {device.authenticator_attachment === "platform"
                          ? "Built-in"
                          : "External"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <FontAwesome name="check-circle" size={14} color={colors.success} />
                  </View>
                </View>
                <View style={[styles.deviceStats, { borderTopColor: isDark ? colors.border : "#f5f5f5" }]}>
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    Verified {device.verification_count} times
                  </Text>
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    Enrolled {formatDate(device.enrolled_at)}
                  </Text>
                  {device.last_verified_at && (
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                      Last used {formatDate(device.last_verified_at)}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.removeButton,
                    { backgroundColor: isDark ? `${colors.destructive}15` : "#ffe6e6", borderColor: isDark ? `${colors.destructive}30` : "#ffcccc" },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleRemoveDevice(device.id, device.device_name)}
                  disabled={deletingId === device.id}
                >
                  {deletingId === device.id ? (
                    <ActivityIndicator size="small" color={colors.destructive} />
                  ) : (
                    <>
                      <FontAwesome name="trash" size={14} color={colors.destructive} />
                      <Text style={[styles.removeButtonText, { color: colors.destructive }]}>Remove</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Inactive Devices */}
      {inactiveDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revoked Devices</Text>
          <View style={styles.devicesList}>
            {inactiveDevices.map((device) => (
              <View key={device.id} style={[styles.deviceCard, styles.inactiveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <View style={[styles.deviceIconBg, { backgroundColor: isDark ? colors.border : "#f5f5f5" }]}>
                      <FontAwesome
                        name={getPlatformIcon(device.platform)}
                        size={18}
                        color={colors.foreground}
                      />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={[styles.deviceName, styles.inactiveText, { color: colors.mutedForeground }]}>
                        {device.device_name}
                      </Text>
                      <Text style={[styles.deviceMeta, styles.inactiveText, { color: colors.mutedForeground }]}>Revoked</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: isDark ? colors.card : "#f9f9f9", borderColor: colors.border }]}>
        <Text style={[styles.infoSectionTitle, { color: colors.foreground }]}>About Biometric Devices</Text>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.mutedForeground }]}>
            Each device stores your unique biometric data locally
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.mutedForeground }]}>
            You can register multiple devices for added convenience
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.mutedForeground }]}>
            Remove devices you no longer use for security
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  deviceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  inactiveText: {
    // handled dynamically
  },
  deviceMeta: {
    fontSize: 12,
  },
  statusBadge: {
    marginLeft: 8,
  },
  deviceStats: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statText: {
    fontSize: 11,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  infoItemText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleDetails: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleStatus: {
    fontSize: 12,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  toggleButtonDisabled: {
    opacity: 0.6,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    // handled dynamically
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
});
