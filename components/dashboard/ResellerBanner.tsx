import { ResellerApplicationModal } from "@/components/reseller/ResellerApplicationModal";
import { useTheme } from "@/context/ThemeContext";
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
  const { colors, isDark } = useTheme();
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
      <View style={[styles.container, { backgroundColor: isDark ? colors.card : "#F3F4F6" }]}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Upgrade request pending review
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable 
        style={[styles.container, { backgroundColor: isDark ? "#3D2800" : "#FFFDE7" }]}
        onPress={handlePress}
      >
        <Sparkles size={16} color={colors.primary} />
        <Text style={[styles.text, { color: colors.foreground }]}>
          Become a Reseller — <Text style={[styles.highlight, { color: colors.primary }]}>Get 10% OFF</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    fontSize: 14,
  },
  highlight: {
    fontWeight: "600",
  },
});


