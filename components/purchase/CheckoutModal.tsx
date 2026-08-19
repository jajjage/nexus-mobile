/**
 * CheckoutModal - Multi-state checkout bottom sheet
 * Per mobile-airtime-data-guide.md Section 4 - Payment Waterfall
 * Updated to modern card-grouped UI reference design
 */

import { ShareTransactionSheet } from "@/components/ShareTransactionSheet";
import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { NETWORK_PROVIDERS, NetworkProvider } from "@/lib/detectNetwork";
import { Transaction } from "@/types/wallet.types";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Gift,
  Phone,
  RefreshCw,
  Share2,
  ShoppingCart,
  Tv,
  XCircle,
  Zap,
} from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CheckoutMode = "checkout" | "success" | "failed";

export interface CheckoutData {
  productName: string;
  productType?: string;
  recipientPhone: string;
  amount: number;
  originalAmount?: number;
  network?: NetworkProvider;
  transactionId?: string;
  errorMessage?: string;
  bonusToEarn?: number;
  validity?: string;
  // Price breakdown details
  supplierCost?: number;
  markup?: number;
  markupPercent?: number;
  faceValue?: number;
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
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const colors = isDark ? darkColors : lightColors;

    const snapPoints = useMemo(() => {
      // 85% height to ensure plenty of room for all card components & scroll
      return ["85%"];
    }, []);

    const [showShareSheet, setShowShareSheet] = React.useState(false);

    // Calculate payable amount
    const cashbackToUse = useCashback
      ? Math.min(cashbackBalance, data?.amount || 0)
      : 0;
    const totalToPay = (data?.amount || 0) - cashbackToUse;

    // Add small tolerance (0.01) for floating point precision issues
    const insufficientBalance = totalToPay > walletBalance + 0.01;

    // Helper to create a Transaction object from checkout data for the receipt
    const createTransactionFromCheckoutData = useCallback((): Transaction | null => {
      if (!data) return null;

      const isData =
        data.productType === "data" ||
        data.productType === "subscription" ||
        data.productName.toLowerCase().includes("data") ||
        data.productName.toLowerCase().includes("gb") ||
        data.productName.toLowerCase().includes("mb");

      return {
        id: data.transactionId || `REF-${Date.now()}`,
        walletId: "current-wallet",
        userId: "current-user",
        direction: "debit",
        amount: data.amount,
        balanceAfter: walletBalance - totalToPay,
        method: "wallet",
        relatedType: "topup_request",
        cashbackUsed: cashbackToUse,
        productCode: data.productName,
        denomAmount: data.faceValue || data.amount,
        createdAt: new Date(),
        related: {
          status: "completed",
          recipient_phone: data.recipientPhone,
          operatorCode: data.network,
          type: data.productType || (isData ? "data" : "airtime"),
        },
      } as Transaction;
    }, [data, cashbackToUse, walletBalance, totalToPay]);

    // Memoize transaction to prevent re-rendering issues
    const cachedTransaction = useMemo(
      () => createTransactionFromCheckoutData(),
      [createTransactionFromCheckoutData]
    );

    // Share receipt
    const handleShare = useCallback(() => {
      if (!data) return;
      Haptics.selectionAsync();
      setShowShareSheet(true);
    }, [data]);

    const networkInfo = data?.network ? NETWORK_PROVIDERS[data.network] : null;

    // Helper for deriving validity string if not explicitly passed
    const getValidityText = (): string | null => {
      if (!data) return null;
      if (data.validity) return data.validity;
      const lower = data.productName.toLowerCase();
      if (
        lower.includes("daily") ||
        lower.includes("1 day") ||
        lower.includes("24 hrs") ||
        lower.includes("24hrs")
      )
        return "1 Day";
      if (
        lower.includes("weekly") ||
        lower.includes("7 day") ||
        lower.includes("7 days")
      )
        return "7 Days";
      if (
        lower.includes("monthly") ||
        lower.includes("30 day") ||
        lower.includes("30 days") ||
        lower.includes("1 month")
      )
        return "30 Days";
      if (lower.includes("yearly") || lower.includes("1 year")) return "1 Year";
      return null;
    };

    // Determine header iconography and title
    const isDataProduct =
      data?.productType === "data" ||
      data?.productName?.toLowerCase().includes("data") ||
      data?.productName?.toLowerCase().includes("gb") ||
      data?.productName?.toLowerCase().includes("mb");

    const isAirtimeProduct =
      data?.productType === "airtime" ||
      data?.productName?.toLowerCase().includes("airtime");

    const isElectricityProduct =
      data?.productType === "electricity" ||
      data?.productName?.toLowerCase().includes("electricity") ||
      data?.productName?.toLowerCase().includes("meter");

    const isCableProduct =
      data?.productType === "cable" ||
      data?.productName?.toLowerCase().includes("dstv") ||
      data?.productName?.toLowerCase().includes("gotv") ||
      data?.productName?.toLowerCase().includes("startimes");

    let titleText = "Confirm Purchase";
    let HeaderIcon = ShoppingCart;
    let tileBgColor = isDark ? "#1E293B" : "#E0F2FE";
    let iconColor = isDark ? "#38BDF8" : "#0284C7";

    if (isDataProduct) {
      titleText = "Data Purchase";
      HeaderIcon = ShoppingCart;
      tileBgColor = isDark ? "#1E293B" : "#E0F2FE";
      iconColor = isDark ? "#38BDF8" : "#0284C7";
    } else if (isAirtimeProduct) {
      titleText = "Airtime Purchase";
      HeaderIcon = Phone;
      tileBgColor = isDark ? "#1E293B" : "#E0F2FE";
      iconColor = isDark ? "#38BDF8" : "#0284C7";
    } else if (isElectricityProduct) {
      titleText = "Electricity Payment";
      HeaderIcon = Zap;
      tileBgColor = isDark ? "#312E81" : "#EEF2FF";
      iconColor = isDark ? "#818CF8" : "#4F46E5";
    } else if (isCableProduct) {
      titleText = "Cable Subscription";
      HeaderIcon = Tv;
      tileBgColor = isDark ? "#312E81" : "#EEF2FF";
      iconColor = isDark ? "#818CF8" : "#4F46E5";
    }

    // Render content based on mode
    const renderContent = () => {
      if (!data) return null;
      switch (mode) {
        case "success":
          return (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom + 24, 32) },
              ]}
              showsVerticalScrollIndicator={false}
            >
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
                  style={[
                    styles.doneButton,
                    { backgroundColor: colors.primary },
                  ]}
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
            </ScrollView>
          );

        case "failed":
          return (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom + 24, 32) },
              ]}
              showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>
          );

        default:
          // Checkout mode (Modern Card-Grouped Reference Layout)
          return (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom + 24, 32) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section with Icon Badge */}
              <View style={styles.headerRow}>
                <View style={[styles.headerIconTile, { backgroundColor: tileBgColor }]}>
                  <HeaderIcon size={22} color={iconColor} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  {titleText}
                </Text>
              </View>

              {/* Card 1: Details Grouped Box */}
              <View
                style={[
                  styles.groupedCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                {/* Phone Row */}
                <View style={styles.cardRow}>
                  <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>
                    Phone
                  </Text>
                  <Text style={[styles.cardRowValue, { color: colors.foreground }]}>
                    {data.recipientPhone}
                  </Text>
                </View>

                <View
                  style={[
                    styles.rowDivider,
                    { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
                  ]}
                />

                {/* Network Row */}
                <View style={styles.cardRow}>
                  <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>
                    Network
                  </Text>

                  <View style={styles.detailValueContainer}>
                    {networkInfo && (
                      <View style={styles.miniLogo}>
                        <Image
                          source={networkInfo.logo}
                          style={{ width: 16, height: 16, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <Text style={[styles.cardRowValue, { color: colors.foreground }]}>
                      {data.network ? data.network.toUpperCase() : "N/A"}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.rowDivider,
                    { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
                  ]}
                />

                {/* Plan / Product Row */}
                <View style={styles.cardRow}>
                  <Text style={[styles.cardRowLabel, { color: colors.textSecondary }]}>
                    Plan
                  </Text>
                  <Text
                    style={[
                      styles.cardRowValue,
                      { color: colors.foreground, flex: 1, textAlign: "right" },
                    ]}
                  >
                    {data.productName}
                  </Text>
                </View>

                {/* Validity Row (if applicable) */}
                {getValidityText() ? (
                  <>
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
                      ]}
                    />
                    <View style={styles.cardRow}>
                      <Text
                        style={[styles.cardRowLabel, { color: colors.textSecondary }]}
                      >
                        Validity
                      </Text>
                      <Text style={[styles.cardRowValue, { color: colors.foreground }]}>
                        {getValidityText()}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Card 2: Cashback Card */}
              <View
                style={[
                  styles.cashbackCard,
                  {
                    backgroundColor: isDark ? "#064E3B20" : "#ECFDF5",
                    borderColor: isDark ? "#047857" : "#A7F3D0",
                  },
                ]}
              >
                <View style={styles.cashbackLeft}>
                  <View
                    style={[
                      styles.cashbackIconTile,
                      { backgroundColor: isDark ? "#065F46" : "#D1FAE5" },
                    ]}
                  >
                    <Gift size={18} color="#059669" />
                  </View>
                  <View>
                    <Text style={[styles.cashbackTitle, { color: colors.foreground }]}>
                      Use Cashback
                    </Text>
                    <Text style={[styles.cashbackSubtext, { color: "#059669" }]}>
                      Available: ₦{cashbackBalance.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onUseCashbackChange(!useCashback);
                  }}
                  style={[
                    styles.customToggleTrack,
                    {
                      backgroundColor: useCashback
                        ? "#10B981"
                        : isDark
                        ? "#334155"
                        : "#CBD5E1",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.customToggleDot,
                      {
                        transform: [{ translateX: useCashback ? 16 : 0 }],
                        backgroundColor: "#FFFFFF",
                      },
                    ]}
                  />
                </Pressable>
              </View>

              {/* Card 3: Total Amount Card */}
              <View
                style={[
                  styles.totalAmountCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: insufficientBalance
                      ? "#FCA5A5"
                      : isDark
                      ? "#334155"
                      : "#E2E8F0",
                  },
                ]}
              >
                <View>
                  <Text style={[styles.totalAmountTitle, { color: colors.foreground }]}>
                    Total Amount
                  </Text>
                  <Text style={[styles.walletSubtext, { color: colors.textSecondary }]}>
                    Wallet: ₦{walletBalance.toLocaleString()}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.totalAmountPrice,
                    { color: insufficientBalance ? "#EF4444" : "#0EA5E9" },
                  ]}
                >
                  ₦{totalToPay.toLocaleString()}
                </Text>
              </View>

              {/* Insufficient Balance Notice Banner */}
              {insufficientBalance && (
                <View
                  style={[
                    styles.warningBanner,
                    {
                      backgroundColor: isDark ? "#451A1A" : "#FEF2F2",
                      borderColor: isDark ? "#7F1D1D" : "#FCA5A5",
                    },
                  ]}
                >
                  <AlertCircle size={18} color="#DC2626" />
                  <Text style={[styles.warningBannerText, { color: "#DC2626" }]}>
                    Insufficient balance. Fund your wallet to continue.
                  </Text>
                </View>
              )}

              {/* Bonus to Earn Notice */}
              {data.bonusToEarn !== undefined && data.bonusToEarn > 0 && (
                <View style={styles.bonusRow}>
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                    +₦{data.bonusToEarn.toFixed(2)} Cashback will be earned
                  </Text>
                </View>
              )}

              {/* Action Buttons Container */}
              <View style={styles.buttonStack}>
                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: insufficientBalance
                        ? isDark
                          ? "#334155"
                          : "#CBD5E1"
                        : colors.primary,
                      opacity: isLoading ? 0.8 : 1,
                    },
                  ]}
                  onPress={onConfirm}
                  disabled={insufficientBalance || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                      <Text
                        style={[
                          styles.primaryButtonText,
                          {
                            color: colors.primaryForeground,
                            marginLeft: 8,
                          },
                        ]}
                      >
                        Processing...
                      </Text>
                    </>
                  ) : insufficientBalance ? (
                    <>
                      <Ban size={18} color={isDark ? "#94A3B8" : "#64748B"} />
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: isDark ? "#94A3B8" : "#64748B", marginLeft: 6 },
                        ]}
                      >
                        Insufficient Balance
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Pay ₦{totalToPay.toLocaleString()}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Secondary Cancel Button */}
                <TouchableOpacity
                  style={[
                    styles.cancelOutlineButton,
                    { borderColor: isDark ? "#334155" : "#CBD5E1" },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cancelOutlineButtonText,
                      { color: isDark ? "#F8FAFC" : "#334155" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          );
      }
    };

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          enableDynamicSizing={false}
          animateOnMount={false}
          onClose={onClose}
          backgroundStyle={{
            backgroundColor: colors.card,
          }}
          handleIndicatorStyle={{
            backgroundColor: colors.border,
            width: 40,
          }}
        >
          <BottomSheetView style={styles.container}>{renderContent()}</BottomSheetView>
        </BottomSheet>

        {/* Share Receipt Sheet */}
        {cachedTransaction && (
          <ShareTransactionSheet
            visible={showShareSheet}
            onClose={() => setShowShareSheet(false)}
            transaction={cachedTransaction}
          />
        )}
      </>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
  },

  // Header Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: designTokens.spacing.lg,
  },
  headerIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Grouped Card 1: Details
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  cardRowLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardRowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  rowDivider: {
    height: 1,
    width: "100%",
  },

  // Grouped Card 2: Cashback
  cashbackCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  cashbackLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cashbackIconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cashbackTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  cashbackSubtext: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  customToggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: "center",
  },
  customToggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },

  // Grouped Card 3: Total Amount
  totalAmountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  totalAmountTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  walletSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  totalAmountPrice: {
    fontSize: 22,
    fontWeight: "800",
  },

  // Insufficient Balance Warning Banner
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningBannerText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // Bonus Row
  bonusRow: {
    marginBottom: 16,
    alignItems: "center",
  },

  // Action Buttons Stack
  buttonStack: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cancelOutlineButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelOutlineButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Success / Failed status styles
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: designTokens.spacing.lg,
    marginTop: designTokens.spacing.md,
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
    marginTop: designTokens.spacing.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
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
    height: 48,
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
    height: 48,
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
    height: 48,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "500",
  },
});
