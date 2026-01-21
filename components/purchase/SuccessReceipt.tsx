/**
 * SuccessReceipt Component
 * Transaction success view with share functionality
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { NETWORK_PROVIDERS, NetworkProvider } from "@/lib/detectNetwork";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Check, Copy, Home, Share2 } from "lucide-react-native";
import React, { useCallback, useRef } from "react";
import {
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import ViewShot from "react-native-view-shot";

export interface ReceiptData {
  transactionId: string;
  productName: string;
  recipientPhone: string;
  amount: number;
  network?: NetworkProvider;
  timestamp?: Date;
  status?: string;
}

interface SuccessReceiptProps {
  data: ReceiptData;
  onDone: () => void;
}

export function SuccessReceipt({ data, onDone }: SuccessReceiptProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const viewShotRef = useRef<ViewShot>(null);

  const formattedDate = (data.timestamp || new Date()).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleShare = useCallback(async () => {
    Haptics.selectionAsync();

    try {
      // Try to capture and share as image first
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share Receipt",
          });
          return;
        }
      }
    } catch (error) {
      console.log("Image share failed, falling back to text:", error);
    }

    // Fallback to text share
    const message = `🎉 Nexus Transaction Receipt\n\n📱 ${data.productName}\n📞 ${data.recipientPhone}\n💰 ₦${data.amount.toLocaleString()}\n📅 ${formattedDate}\n🔖 Ref: ${data.transactionId}\n\n✅ Transaction Successful!`;

    await Share.share({
      message,
      title: "Transaction Receipt",
    });
  }, [data, formattedDate]);

  const handleCopyRef = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(data.transactionId);
  }, [data.transactionId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
        style={[styles.receiptContainer, { backgroundColor: colors.background }]}
      >
        {/* Success Animation */}
        <View style={[styles.successCircle, { backgroundColor: colors.success }]}>
          <Check size={48} color="#FFFFFF" strokeWidth={3} />
        </View>

        {/* Success Message */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Transaction Successful!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your {data.productName} has been processed
        </Text>

        {/* Receipt Card */}
        <View
          style={[
            styles.receiptCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
              Amount
            </Text>
            <Text style={[styles.amount, { color: colors.primary }]}>
              ₦{data.amount.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Product
              </Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {data.productName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Phone Number
              </Text>
              <View style={styles.phoneContainer}>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {data.recipientPhone}
                </Text>
                {data.network && (
                  <Text
                    style={[
                      styles.networkTag,
                      { color: NETWORK_PROVIDERS[data.network].color },
                    ]}
                  >
                    {NETWORK_PROVIDERS[data.network].name}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Date & Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formattedDate}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Reference
              </Text>
              <TouchableOpacity
                style={styles.refContainer}
                onPress={handleCopyRef}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.refValue, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {data.transactionId}
                </Text>
                <Copy size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.shareButton,
            {
              backgroundColor: `${colors.primary}15`,
              borderColor: colors.primary,
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={20} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>
            Share Receipt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={onDone}
          activeOpacity={0.8}
        >
          <Home size={20} color={colors.primaryForeground} />
          <Text style={[styles.doneText, { color: colors.primaryForeground }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.xxl,
  },
  receiptContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: designTokens.spacing.xl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
    textAlign: "center",
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
    marginBottom: designTokens.spacing.xl,
  },
  receiptCard: {
    width: "100%",
    borderRadius: designTokens.radius.xl,
    borderWidth: 1,
    padding: designTokens.spacing.lg,
  },
  amountSection: {
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
  },
  amountLabel: {
    fontSize: designTokens.fontSize.sm,
    marginBottom: designTokens.spacing.xs,
  },
  amount: {
    fontSize: designTokens.fontSize["4xl"],
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: designTokens.spacing.md,
  },
  detailsSection: {
    gap: designTokens.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: designTokens.fontSize.sm,
  },
  detailValue: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
    textAlign: "right",
    maxWidth: "60%",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
  },
  networkTag: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: "600",
  },
  refContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    maxWidth: "60%",
  },
  refValue: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: "500",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xxl,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1.5,
  },
  shareText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  doneButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
  },
  doneText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
});
