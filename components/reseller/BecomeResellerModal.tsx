import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { useRequestResellerUpgrade, useResellerUpgradeStatus } from "@/hooks/useReseller";
import { Check, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface BecomeResellerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BecomeResellerModal({
  visible,
  onClose,
}: BecomeResellerModalProps) {
  const { colors } = useTheme();
  const [pitch, setPitch] = useState("");
  const { requestUpgrade, isSubmitting } = useRequestResellerUpgrade();
  const { refetch: refetchStatus } = useResellerUpgradeStatus();

  const handleApply = async () => {
    if (!pitch.trim()) return;
    try {
      await requestUpgrade(pitch);
      setPitch("");
      refetchStatus();
      onClose();
    } catch (error) {
      // Error handled by hook toast
    }
  };

  const benefits = [
    {
      title: "Massive Discounts",
      description: "Get up to 5% off on airtime and data bundles.",
    },
    {
      title: "Bulk Tools",
      description: "Process thousands of transactions at once with CSV upload.",
    },
    {
      title: "Developer API",
      description: "Integrate our services directly into your own platform.",
    },
    {
      title: "Priority Support",
      description: "Get faster response times from our support team.",
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Become a Reseller
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Unlock exclusive tools and pricing
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={{ paddingBottom: designTokens.spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.benefitsGrid}>
                {benefits.map((benefit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.benefitCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkCircle,
                        { backgroundColor: colors.primary + "20" }, // 20% opacity
                      ]}
                    >
                      <Check size={16} color={colors.primary} />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text
                        style={[
                          styles.benefitTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {benefit.title}
                      </Text>
                      <Text
                        style={[
                          styles.benefitDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {benefit.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Why do you want to become a reseller?
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Tell us about your business or use case..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={pitch}
                  onChangeText={setPitch}
                  editable={!isSubmitting}
                />
                <Text
                  style={[
                    styles.helperText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Briefly explain how you plan to use our platform (e.g., selling to customers, integrating via API, etc.)
                </Text>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { borderTopColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: !pitch.trim() || isSubmitting ? 0.6 : 1,
                  },
                ]}
                onPress={handleApply}
                disabled={!pitch.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Submit Application
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: designTokens.radius.xl,
    borderTopRightRadius: designTokens.radius.xl,
    maxHeight: "90%",
    paddingTop: designTokens.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
  },
  subtitle: {
    fontSize: designTokens.fontSize.sm,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: designTokens.spacing.lg,
  },
  benefitsGrid: {
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xl,
  },
  benefitCard: {
    flexDirection: "row",
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    gap: designTokens.spacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: designTokens.fontSize.sm,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: designTokens.spacing.lg,
  },
  label: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
    marginBottom: designTokens.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.md,
    fontSize: designTokens.fontSize.base,
    minHeight: 100,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: designTokens.fontSize.xs,
    marginTop: designTokens.spacing.xs,
  },
  footer: {
    padding: designTokens.spacing.lg,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : designTokens.spacing.lg,
  },
  applyButton: {
    height: 50,
    borderRadius: designTokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
});
