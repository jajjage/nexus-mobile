/**
 * NetworkDetectorInput - Phone input with network auto-detection
 * Per mobile-airtime-data-guide.md Section 3.A
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import {
    NETWORK_PROVIDERS,
    NetworkProvider,
    detectNetworkProvider,
    isValidNigerianPhone
} from "@/lib/detectNetwork";
import { RecentNumber } from "@/types/api.types";
import * as Haptics from "expo-haptics";
import { ChevronDown, Phone, User, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface NetworkDetectorInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onNetworkDetected: (network: NetworkProvider | null) => void;
  placeholder?: string;
  recentNumbers?: RecentNumber[];
  disabled?: boolean;
}

export function NetworkDetectorInput({
  value,
  onChangeText,
  onNetworkDetected,
  placeholder = "Enter phone number",
  recentNumbers: propRecentNumbers,
  disabled = false,
}: NetworkDetectorInputProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();

  const [isFocused, setIsFocused] = useState(false);
  const [showRecentNumbers, setShowRecentNumbers] = useState(false);

  // Use prop if provided, otherwise fallback to user profile
  // Limit to 5 most recent numbers
  const recentNumbers = (propRecentNumbers || user?.recentlyUsedNumbers || []).slice(0, 5);

  // Handle text input with paste logic
  const handleChangeText = useCallback(
    (text: string) => {
      // Strip non-digits
      let cleaned = text.replace(/\D/g, "");

      // Convert 234 prefix to 0
      if (cleaned.startsWith("234") && cleaned.length > 3) {
        cleaned = "0" + cleaned.slice(3);
      }

      // Limit to 11 characters
      cleaned = cleaned.slice(0, 11);

      onChangeText(cleaned);

      // Detect network on every keystroke
      const detected = detectNetworkProvider(cleaned);
      onNetworkDetected(detected);
    },
    [onChangeText, onNetworkDetected]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onChangeText("");
    onNetworkDetected(null);
  }, [onChangeText, onNetworkDetected]);

  // Handle recent number selection
  const handleSelectRecent = useCallback(
    (phoneNumber: string) => {
      Haptics.selectionAsync();
      handleChangeText(phoneNumber);
      setShowRecentNumbers(false);
    },
    [handleChangeText]
  );

  // Get network logo if detected
  const detectedNetwork = detectNetworkProvider(value);
  const networkInfo = detectedNetwork ? NETWORK_PROVIDERS[detectedNetwork] : null;

  const isValid = value.length === 0 || isValidNigerianPhone(value);

  return (
    <View style={[styles.container, { opacity: disabled ? 0.6 : 1 }]}>


      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? colors.background : colors.muted,
            borderColor: isFocused
              ? colors.primary
              : !isValid
              ? colors.destructive
              : colors.border,
          },
        ]}
      >
        {/* Recent Numbers Button */}
        {recentNumbers.length > 0 && (
          <TouchableOpacity
            style={styles.recentButton}
            onPress={() => !disabled && setShowRecentNumbers(true)}
            disabled={disabled}
          >
            <User size={18} color={colors.textSecondary} />
            <ChevronDown size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Left Side: Network Logo or Phone Icon */}
        <View style={styles.leftIconContainer}>
          {networkInfo ? (
            <Image
              source={
                typeof (networkInfo.logo || networkInfo.logoUrl) === "string"
                  ? { uri: networkInfo.logo || networkInfo.logoUrl }
                  : networkInfo.logo || networkInfo.logoUrl
              }
              style={styles.networkLogo}
              resizeMode="contain"
            />
          ) : (
            <Phone size={20} color={colors.textDisabled} />
          )}
        </View>

        {/* Phone Input */}
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground },
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="number-pad"
          maxLength={11}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          selectTextOnFocus={false}
        />

        {/* Right Side: Clear button */}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation hint */}
      {!isValid && value.length > 0 && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Enter a valid 11-digit Nigerian number
        </Text>
      )}

      {/* Recent Numbers Modal */}
      <Modal
        visible={showRecentNumbers}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecentNumbers(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRecentNumbers(false)}
        >
          <View
            style={[
              styles.recentModal,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.recentTitle, { color: colors.foreground }]}>
              Recent Numbers
            </Text>
            <FlatList
              data={recentNumbers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.recentItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectRecent(item.phoneNumber)}
                >
                  <Phone size={16} color={colors.textSecondary} />
                  <Text
                    style={[styles.recentPhone, { color: colors.foreground }]}
                  >
                    {item.phoneNumber}
                  </Text>
                  <Text
                    style={[styles.recentCount, { color: colors.textTertiary }]}
                  >
                    {item.usageCount}x
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No recent numbers
                </Text>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.md,
  },
  label: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
    marginBottom: designTokens.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: designTokens.radius.lg,
    paddingHorizontal: designTokens.spacing.md,
    height: 52,
  },
  recentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: designTokens.spacing.sm,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.1)",
    marginRight: designTokens.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: designTokens.fontSize.lg,
    fontWeight: "500",
  },
  inputWithRecent: {
    paddingLeft: 0,
  },
  leftIconContainer: {
    marginRight: designTokens.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    width: 24, // Fixed width to prevent jumping
  },
  networkLogo: {
    width: 24,
    height: 24,
    borderRadius: 12, // Make it circular
  },
  clearButton: {
    padding: designTokens.spacing.xs,
  },
  errorText: {
    fontSize: designTokens.fontSize.xs,
    marginTop: designTokens.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: designTokens.spacing.lg,
  },
  recentModal: {
    width: "100%",
    maxWidth: 320,
    borderRadius: designTokens.radius.xl,
    borderWidth: 1,
    padding: designTokens.spacing.md,
    maxHeight: 300,
  },
  recentTitle: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
    marginBottom: designTokens.spacing.md,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: designTokens.spacing.sm,
    borderBottomWidth: 1,
    gap: designTokens.spacing.sm,
  },
  recentPhone: {
    flex: 1,
    fontSize: designTokens.fontSize.base,
    fontWeight: "500",
  },
  recentCount: {
    fontSize: designTokens.fontSize.xs,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: designTokens.spacing.lg,
  },
});
