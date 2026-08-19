/**
 * NetworkDetectorInput - Phone input with network auto-detection
 * Per mobile-airtime-data-guide Section 3.A
 * Ultra-Compact Version
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import {
  NETWORK_PROVIDERS,
  NetworkProvider,
  detectNetworkProvider,
  isValidNigerianPhone,
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
  autoDetectEnabled?: boolean;
}

export function NetworkDetectorInput({
  value,
  onChangeText,
  onNetworkDetected,
  placeholder = "Enter phone number",
  recentNumbers: propRecentNumbers,
  disabled = false,
  autoDetectEnabled = true,
}: NetworkDetectorInputProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();

  const [isFocused, setIsFocused] = useState(false);
  const [showRecentNumbers, setShowRecentNumbers] = useState(false);

  const recentNumbers = (propRecentNumbers || user?.recentlyUsedNumbers || []).slice(0, 5);

  const handleChangeText = useCallback(
    (text: string) => {
      const raw = text.trim();
      let cleaned = raw.replace(/[^\d+]/g, "");
      cleaned = cleaned.replace(/\+/g, (match, offset) => (offset === 0 ? match : ""));

      const rawPlus2340 = raw.startsWith("+2340");
      const raw2340 = raw.startsWith("2340");
      if (rawPlus2340 && !cleaned.startsWith("+2340")) {
        cleaned = "+2340" + cleaned.replace(/^(\+?2340)/, "");
      } else if (raw2340 && !(cleaned.startsWith("2340") || cleaned.startsWith("+2340"))) {
        cleaned = "2340" + cleaned.replace(/^(\+?2340)/, "");
      }

      cleaned = cleaned.slice(0, 20);
      onChangeText(cleaned);

      if (autoDetectEnabled) {
        const detected = detectNetworkProvider(cleaned);
        onNetworkDetected(detected);
      } else {
        onNetworkDetected(null);
      }
    },
    [autoDetectEnabled, onChangeText, onNetworkDetected]
  );

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onChangeText("");
    onNetworkDetected(null);
  }, [onChangeText, onNetworkDetected]);

  const handleSelectRecent = useCallback(
    (phoneNumber: string) => {
      Haptics.selectionAsync();
      handleChangeText(phoneNumber);
      setShowRecentNumbers(false);
    },
    [handleChangeText]
  );

  const detectedNetwork = autoDetectEnabled ? detectNetworkProvider(value) : null;
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
            <User size={15} color={colors.textSecondary} />
            <ChevronDown size={12} color={colors.textSecondary} />
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
            <Phone size={16} color={colors.textDisabled} />
          )}
        </View>

        {/* Phone Input */}
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="phone-pad"
          maxLength={20}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          selectTextOnFocus={false}
        />

        {/* Right Side: Clear button */}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={15} color={colors.textSecondary} />
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
              removeClippedSubviews={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.recentItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectRecent(item.phoneNumber)}
                >
                  <Phone size={14} color={colors.textSecondary} />
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
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  recentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.1)",
    marginRight: 8,
    gap: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 24,
  },
  networkLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  clearButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  recentModal: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    maxHeight: 280,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  recentPhone: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  recentCount: {
    fontSize: 10,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 12,
  },
});
