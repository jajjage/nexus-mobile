/**
 * CheckoutModal - Multi-state checkout bottom sheet
 * Per mobile-airtime-data-guide.md Section 4 - Payment Waterfall
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { NETWORK_PROVIDERS, NetworkProvider } from "@/lib/detectNetwork";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import {
  CheckCircle,
  RefreshCw,
  Share2,
  XCircle
} from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export type CheckoutMode = "checkout" | "success" | "failed";

export interface CheckoutData {
  productName: string;
  recipientPhone: string;
  amount: number;
  originalAmount?: number;
  network?: NetworkProvider;
  transactionId?: string;
  errorMessage?: string;
  bonusToEarn?: number;
}

interface CheckoutModalProps {
  data: CheckoutData | null;
  mode: CheckoutMode;
  walletBalance: number;
  cashbackBalance: number;
  useCashback: boolean;
  onUseCashbackChange: (value: boolean) => void;
  onConfirm: () => void;
  onRetry: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const CheckoutModal = forwardRef<BottomSheet, CheckoutModalProps>(
  (
    {
      data,
      mode,
      walletBalance,
      cashbackBalance,
      useCashback,
      onUseCashbackChange,
      onConfirm,
      onRetry,
      onClose,
      isLoading = false,
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const colors = colorScheme === "dark" ? darkColors : lightColors;

    const snapPoints = useMemo(() => {
      if (mode === "checkout") return ["70%"]; // Increased height for new layout
      return ["50%"];
    }, [mode]);

    // Calculate payable amount
    const cashbackToUse = useCashback
      ? Math.min(cashbackBalance, data?.amount || 0)
      : 0;
    const totalToPay = (data?.amount || 0) - cashbackToUse;
    const insufficientBalance = totalToPay > walletBalance;

    // Share receipt
    const handleShare = useCallback(async () => {
      if (!data) return;
      Haptics.selectionAsync();

      const message = `🎉 Nexus Transaction Receipt\n\n📱 ${data.productName}\n📞 ${data.recipientPhone}\n💰 ₦${data.amount.toLocaleString()}\n🔖 Ref: ${data.transactionId || "N/A"}\n\n✅ Transaction Successful!`;

      await Share.share({
        message,
        title: "Transaction Receipt",
      });
    }, [data]);

    if (!data) return null;

    const networkInfo = data.network ? NETWORK_PROVIDERS[data.network] : null;

    // Render based on mode
    const renderContent = () => {
      switch (mode) {
        case "success":
          return (
            <View style={styles.content}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: `${colors.success}20` },
                ]}
              >
                <CheckCircle size={48} color={colors.success} />
              </View>

              <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                Transaction Successful!
              </Text>

              <Text
                style={[styles.statusSubtitle, { color: colors.textSecondary }]}
              >
                {data.productName} sent to {data.recipientPhone}
              </Text>

              <View
                style={[styles.amountCard, { backgroundColor: colors.muted }]}
              >
                <Text
                  style={[styles.amountLabel, { color: colors.textSecondary }]}
                >
                  Amount
                </Text>
                <Text style={[styles.amountValue, { color: colors.success }]}>
                  ₦{data.amount.toLocaleString()}
                </Text>
              </View>

              {data.transactionId && (
                <Text style={[styles.refText, { color: colors.textTertiary }]}>
                  Ref: {data.transactionId}
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    { borderColor: colors.primary },
                  ]}
                  onPress={handleShare}
                >
                  <Share2 size={18} color={colors.primary} />
                  <Text style={[styles.shareText, { color: colors.primary }]}>
                    Share
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: colors.primary }]}
                  onPress={onClose}
                >
                  <Text
                    style={[
                      styles.doneText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );

        case "failed":
          return (
            <View style={styles.content}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: `${colors.destructive}20` },
                ]}
              >
                <XCircle size={48} color={colors.destructive} />
              </View>

              <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                Transaction Failed
              </Text>

              <Text
                style={[styles.statusSubtitle, { color: colors.textSecondary }]}
              >
                {data.errorMessage || "Something went wrong. Please try again."}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={onRetry}
                >
                  <RefreshCw size={18} color={colors.primaryForeground} />
                  <Text
                    style={[
                      styles.retryText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text
                    style={[styles.cancelText, { color: colors.textSecondary }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );

        default:
          // Checkout mode
          return (
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Confirm Purchase
              </Text>

              {/* Hero Amount */}
              <View style={styles.heroSection}>
                <Text style={[styles.heroAmount, { color: colors.foreground }]}>
                  ₦{(totalToPay).toLocaleString()}
                </Text>
                {data.originalAmount && data.originalAmount > data.amount && (
                  <Text style={[styles.heroStrikethrough, { color: colors.textTertiary }]}>
                    ₦{data.originalAmount.toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Details List */}
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Product Name
                  </Text>
                  <View style={styles.detailValueContainer}>
                     {networkInfo && (
                        /* Use Image instead of view with letter if possible, but keeping consistent with request */
                       <View style={[styles.miniLogo, { backgroundColor: "transparent" /* Transparent for image */ }]}>
                          <Image 
                            source={networkInfo.logo} 
                            style={{ width: 16, height: 16, borderRadius: 8 }} 
                            resizeMode="cover"
                          />
                       </View>
                     )}
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      Mobile Data
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Recipient Mobile
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {data.recipientPhone}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Data Bundle
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {data.productName}
                  </Text>
                </View>

                 <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Amount to Paid
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.foreground, fontWeight: '700' }]}>
                    ₦{data.amount.toLocaleString()}
                  </Text>
                </View>

                 {cashbackBalance > 0 && (
                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                       <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                          Use Cashback (₦{cashbackBalance.toLocaleString()})
                       </Text>
                      <Switch
                        value={useCashback}
                        onValueChange={onUseCashbackChange}
                        trackColor={{
                          false: colors.muted,
                          true: `${colors.success}50`,
                        }}
                        thumbColor={useCashback ? colors.success : colors.border}
                        style={{ transform: [{ scale: 0.8 }] }} 
                      />
                    </View>
                 )}

                 {/* Bonus to Earn */}
                 {data.bonusToEarn !== undefined && data.bonusToEarn > 0 && (
                    <View style={styles.detailRow}>
                       <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                          Bonus to Earn
                       </Text>
                       <Text style={{ color: colors.success, fontSize: 14, fontWeight: '600' }}>
                          +₦{data.bonusToEarn.toFixed(2)} Cashback
                       </Text>
                    </View>
                 )}
              </View>

              {/* Payment Method Section */}
              <View style={styles.paymentSection}>
                 <Text style={[styles.paymentTitle, { color: colors.foreground }]}>Payment Method</Text>
                 <View style={[styles.paymentCard, { borderColor: colors.primary, backgroundColor: `${colors.primary}05` }]}>
                    <View style={styles.paymentCardContent}>
                       <Text style={[styles.paymentBalance, { color: colors.foreground }]}>
                          Available Balance (₦{walletBalance.toLocaleString()})
                       </Text>
                       <Text style={[styles.paymentDeduction, { color: colors.textSecondary }]}>
                          Wallet -₦{totalToPay.toLocaleString()}
                       </Text>
                    </View>
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                       <CheckCircle size={14} color="#FFF" />
                    </View>
                 </View>
              </View>

              {/* Insufficient Balance Warning */}
              {insufficientBalance && (
                <Text style={[styles.warningText, { color: colors.destructive }]}>
                  Insufficient balance. Please add funds.
                </Text>
              )}

              {/* Pay Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor:
                      insufficientBalance || isLoading
                        ? colors.muted
                        : colors.primary,
                  },
                ]}
                onPress={onConfirm}
                disabled={insufficientBalance || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.confirmText,
                      {
                        color: insufficientBalance
                          ? colors.textDisabled
                          : colors.primaryForeground,
                      },
                    ]}
                  >
                    Pay
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{
          backgroundColor: colors.card,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 40,
        }}
      >
        <BottomSheetView style={styles.container}>
          {renderContent()}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: designTokens.spacing.lg,
    flex: 1,
  },
  title: {
    fontSize: designTokens.fontSize.xl,
    fontWeight: "700",
    marginBottom: designTokens.spacing.lg,
    textAlign: "center",
  },
  summaryCard: {
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: designTokens.spacing.xs,
  },
  summaryLabel: {
    fontSize: designTokens.fontSize.sm,
  },
  summaryValue: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
  },
  networkTag: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: designTokens.spacing.sm,
  },
  amountText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "700",
  },
  cashbackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    marginBottom: designTokens.spacing.md,
  },
  cashbackInfo: {
    flex: 1,
  },
  cashbackLabel: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
  },
  cashbackAmount: {
    fontSize: designTokens.fontSize.xs,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: designTokens.spacing.md,
  },
  totalLabel: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
  },
  warningText: {
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
    marginBottom: designTokens.spacing.md,
  },
  confirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    gap: designTokens.spacing.sm,
    marginTop: "auto",
  },
  confirmText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
  },
  // Success/Failed styles
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: designTokens.spacing.lg,
  },
  statusTitle: {
    fontSize: designTokens.fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: designTokens.spacing.xs,
  },
  statusSubtitle: {
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
    marginBottom: designTokens.spacing.lg,
  },
  amountCard: {
    alignItems: "center",
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.radius.lg,
    marginBottom: designTokens.spacing.md,
  },
  amountLabel: {
    fontSize: designTokens.fontSize.sm,
    marginBottom: designTokens.spacing.xs,
  },
  amountValue: {
    fontSize: designTokens.fontSize["3xl"],
    fontWeight: "700",
  },
  refText: {
    fontSize: designTokens.fontSize.xs,
    textAlign: "center",
    marginBottom: designTokens.spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: designTokens.spacing.md,
    marginTop: "auto",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1.5,
    gap: designTokens.spacing.sm,
  },
  shareText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  doneButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
  },
  doneText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  retryButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    gap: designTokens.spacing.sm,
  },
  retryText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "500",
  },
  // New Styles
  heroSection: {
    alignItems: "center",
    marginBottom: designTokens.spacing.lg,
  },
  heroAmount: {
    fontSize: 32, // Large font per screenshot
    fontWeight: "700",
  },
  heroStrikethrough: {
    fontSize: designTokens.fontSize.sm,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  detailsList: {
    marginBottom: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: designTokens.fontSize.sm,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
  },
  detailValue: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
    textAlign: "right",
  },
  miniLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  miniLogoText: {
    fontSize: 8,
    color: "#FFF",
    fontWeight: "700",
  },
  paymentSection: {
    marginTop: "auto",
    marginBottom: designTokens.spacing.lg,
  },
  paymentTitle: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
    marginBottom: designTokens.spacing.sm,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  paymentCardContent: {
    gap: 2,
  },
  paymentBalance: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
  },
  paymentDeduction: {
    fontSize: designTokens.fontSize.xs,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
