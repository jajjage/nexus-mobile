import { darkColors, lightColors } from "@/constants/palette";
import { useAuthContext } from "@/context/AuthContext";
import { useBiometricEnrollments, useDeleteBiometricEnrollment } from "@/hooks/useBiometricManagement";
import { useBiometricRegistration } from "@/hooks/useBiometricRegistration";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";

export default function BiometricDevicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { data: enrollments, isLoading, error, refetch } = useBiometricEnrollments();
  const deleteEnrollmentMutation = useDeleteBiometricEnrollment();
  const { registerBiometric, isLoading: isEnrolling } = useBiometricRegistration();
  const { updateUser } = useAuthContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingBiometric, setTogglingBiometric] = useState(false);

  // Get current device's biometric enrollment (if any)
  const currentDeviceEnrollment = enrollments?.find(
    (e) => e.is_active && e.platform === Platform.OS
  );
  const isCurrentDeviceBiometricEnabled = !!currentDeviceEnrollment;

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
      if (isCurrentDeviceBiometricEnabled && currentDeviceEnrollment) {
        // Turn OFF: Revoke the current device's biometric
        console.log("[BiometricDevicesScreen] Revoking biometric for current device");
        await deleteEnrollmentMutation.mutateAsync({
          enrollmentId: currentDeviceEnrollment.id,
          reason: "User disabled biometric on this device",
        });
        Alert.alert(
          "Success",
          "Biometric has been disabled on this device",
          [{ text: "OK" }]
        );
      } else {
        // Turn ON: Register biometric for current device
        console.log("[BiometricDevicesScreen] Starting biometric enrollment for current device");
        const result = await registerBiometric();
        
        if (result.success && result.enrolled) {
          // Update user state
          updateUser({ hasBiometric: true });
          // Refetch devices list
          await refetch();
          Alert.alert(
            "Success",
            "Biometric has been enabled on this device",
            [{ text: "OK" }]
          );
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
      <View style={[styles.container, styles.centerContent]}>
        <FontAwesome name="exclamation-circle" size={40} color="#e63636" />
        <Text style={styles.errorText}>Failed to load devices</Text>
      </View>
    );
  }

  const activeDevices = enrollments?.filter((e) => e.is_active) || [];
  const inactiveDevices = enrollments?.filter((e) => !e.is_active) || [];

  // Debug logging
  console.log("[BiometricDevicesScreen] Debug:", {
    enrollmentsData: enrollments,
    currentDeviceEnrollment,
    isCurrentDeviceBiometricEnabled,
    allActiveDevices: activeDevices.length,
    isLoading,
    error,
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <FontAwesome name="lock" size={18} color={lightColors.primary} />
        <Text style={styles.infoText}>
          Manage your registered biometric devices for secure authentication.
        </Text>
      </View>

      {/* Loading Indicator (if fetching data) */}
      {isLoading && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" color={lightColors.primary} />
          <Text style={{ marginTop: 12, color: lightColors.textSecondary }}>
            Loading devices...
          </Text>
        </View>
      )}

      {/* Current Device Biometric Toggle Section */}
      {!isLoading && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Device</Text>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleIconBg}>
                <FontAwesome
                  name="mobile"
                  size={20}
                  color={isCurrentDeviceBiometricEnabled ? lightColors.primary : lightColors.mutedForeground}
                />
              </View>
              <View style={styles.toggleDetails}>
                <Text style={styles.toggleTitle}>Biometric {Platform.OS === "ios" ? "Face ID" : "Fingerprint"}</Text>
                <Text style={styles.toggleStatus}>
                  {isCurrentDeviceBiometricEnabled ? "Enabled on this device" : "Not enabled on this device"}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.toggleButton,
                isCurrentDeviceBiometricEnabled && styles.toggleButtonActive,
                pressed && styles.toggleButtonPressed,
                togglingBiometric && styles.toggleButtonDisabled,
              ]}
              onPress={handleToggleBiometric}
              disabled={togglingBiometric}
            >
              {togglingBiometric ? (
                <ActivityIndicator 
                  size="small" 
                  color={isCurrentDeviceBiometricEnabled ? "#22c55e" : "#999"}
                />
              ) : (
                <View
                  style={[
                    styles.toggleSwitch,
                    isCurrentDeviceBiometricEnabled && styles.toggleSwitchOn,
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
          <Text style={styles.sectionTitle}>Registered Devices ({activeDevices.length})</Text>
          <View style={styles.devicesList}>
            {activeDevices.map((device) => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceIconBg}>
                      <FontAwesome
                        name={getPlatformIcon(device.platform)}
                        size={18}
                        color={lightColors.primary}
                      />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceName}>{device.device_name}</Text>
                      <Text style={styles.deviceMeta}>
                        {device.platform.charAt(0).toUpperCase() + device.platform.slice(1)} •{" "}
                        {device.authenticator_attachment === "platform"
                          ? "Built-in"
                          : "External"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <FontAwesome name="check-circle" size={14} color="#22c55e" />
                  </View>
                </View>
                <View style={styles.deviceStats}>
                  <Text style={styles.statText}>
                    Verified {device.verification_count} times
                  </Text>
                  <Text style={styles.statText}>
                    Enrolled {formatDate(device.enrolled_at)}
                  </Text>
                  {device.last_verified_at && (
                    <Text style={styles.statText}>
                      Last used {formatDate(device.last_verified_at)}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.removeButtonPressed,
                  ]}
                  onPress={() => handleRemoveDevice(device.id, device.device_name)}
                  disabled={deletingId === device.id}
                >
                  {deletingId === device.id ? (
                    <ActivityIndicator size="small" color="#e63636" />
                  ) : (
                    <>
                      <FontAwesome name="trash" size={14} color="#e63636" />
                      <Text style={styles.removeButtonText}>Remove</Text>
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
          <Text style={styles.sectionTitle}>Revoked Devices</Text>
          <View style={styles.devicesList}>
            {inactiveDevices.map((device) => (
              <View key={device.id} style={[styles.deviceCard, styles.inactiveCard]}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <View style={[styles.deviceIconBg, styles.inactiveIconBg]}>
                      <FontAwesome
                        name={getPlatformIcon(device.platform)}
                        size={18}
                        color={lightColors.foreground}
                      />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={[styles.deviceName, styles.inactiveText]}>
                        {device.device_name}
                      </Text>
                      <Text style={[styles.deviceMeta, styles.inactiveText]}>Revoked</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}



      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>About Biometric Devices</Text>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color="#22c55e" />
          <Text style={styles.infoItemText}>
            Each device stores your unique biometric data locally
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color="#22c55e" />
          <Text style={styles.infoItemText}>
            You can register multiple devices for added convenience
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="check" size={14} color="#22c55e" />
          <Text style={styles.infoItemText}>
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
    backgroundColor: lightColors.background,
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
    backgroundColor: "#f0f7ff",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: lightColors.primary,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: lightColors.foreground,
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
    color: lightColors.foreground,
    marginBottom: 12,
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    backgroundColor: lightColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightColors.input,
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
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  inactiveIconBg: {
    backgroundColor: "#f5f5f5",
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.foreground,
    marginBottom: 2,
  },
  inactiveText: {
    color: lightColors.mutedForeground,
  },
  deviceMeta: {
    fontSize: 12,
    color: lightColors.mutedForeground,
  },
  statusBadge: {
    marginLeft: 8,
  },
  deviceStats: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  statText: {
    fontSize: 11,
    color: lightColors.mutedForeground,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#ffe6e6",
    borderWidth: 1,
    borderColor: "#ffcccc",
    gap: 6,
  },
  removeButtonPressed: {
    backgroundColor: "#ffcccc",
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e63636",
  },
  errorText: {
    fontSize: 16,
    color: "#e63636",
    marginTop: 12,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightColors.input,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.foreground,
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
    color: lightColors.mutedForeground,
    lineHeight: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: lightColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightColors.input,
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
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleDetails: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.foreground,
    marginBottom: 4,
  },
  toggleStatus: {
    fontSize: 12,
    color: lightColors.mutedForeground,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#e8f5e9",
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
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: "#22c55e",
    alignItems: "flex-end",
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
});
