import { ResellerApplicationModal } from "@/components/reseller/ResellerApplicationModal";
import { lightColors } from "@/constants/palette";
import { useResellerUpgradeStatus } from "@/hooks/useReseller";
import { Clock, Sparkles } from "lucide-react-native";
import React, { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

interface ResellerBannerProps {
  onPress?: () => void;
}

export function ResellerBanner({ onPress }: ResellerBannerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { isPending, refetch } = useResellerUpgradeStatus();

  const handlePress = () => {
    if (isPending) return;
    setModalVisible(true);
    if (onPress) onPress();
  };

  const handleSuccess = () => {
    refetch(); // Update pending status
  };

  if (isPending) {
    return (
      <View style={[styles.container, styles.pendingContainer]}>
        <Clock size={16} color={lightColors.textSecondary} />
        <Text style={[styles.text, styles.pendingText]}>
          Upgrade request pending review
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.container} onPress={handlePress}>
        <Sparkles size={16} color={lightColors.primary} />
        <Text style={styles.text}>
          Become a Reseller — <Text style={styles.highlight}>Get 10% OFF</Text>
        </Text>
      </Pressable>

      <ResellerApplicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDE7", // Light amber
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  pendingContainer: {
    backgroundColor: "#F3F4F6", // Muted gray
  },
  text: {
    fontSize: 14,
    color: lightColors.textPrimary, // #2E2E33
  },
  pendingText: {
    color: lightColors.textSecondary,
  },
  highlight: {
    color: lightColors.primary, // #E69E19
    fontWeight: "600",
  },
});

