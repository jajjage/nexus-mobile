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
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle,
  Copy,
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
      if (mode === "success") return ["72%"];
      if (mode === "failed") return ["55%"];
      return ["85%"];
    }, [mode]);

    const [showShareSheet, setShowShareSheet] = React.useState(false);
    const [copiedRef, setCopiedRef] = React.useState(false);

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

    // Copy transaction reference
    const handleCopyRef = useCallback(async () => {
      if (!data?.transactionId) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(data.transactionId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }, [data?.transactionId]);

    // Render content based on mode
    const renderContent = () => {
      if (!data) return null;
      switch (mode) {
        case "success":
          return (
            <ScrollView
              contentContainerStyle={[
                styles.successScrollContent,
                { paddingBottom: Math.max(insets.bottom + 16, 24) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Success Header Icon & Title */}
              <View style={styles.successHeader}>
                <View style={[styles.successIconOuter, { backgroundColor: `${colors.success}18` }]}>
                  <View style={[styles.successIconInner, { backgroundColor: colors.success }]}>
                    <Check size={24} color="#FFFFFF" strokeWidth={3.5} />
                  </View>
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>
                  Payment Successful!
                </Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Your data bundle is active & credited
                </Text>
              </View>

              {/* Amount Paid Hero Banner */}
              <View
                style={[
                  styles.successAmountBanner,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={[styles.successAmountLabel, { color: colors.textSecondary }]}>
                  Total Paid
                </Text>
                <Text style={[styles.successAmountValue, { color: colors.foreground }]}>
                  ₦{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={[styles.successPaymentMethodPill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.successPaymentMethodText, { color: colors.primary }]}>
                    Debited from Wallet
                  </Text>
                </View>
              </View>

              {/* Grouped Receipt Card */}
              <View
                style={[
                  styles.successReceiptCard,
                  {
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                {/* Plan Row */}
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptRowLabel, { color: colors.textSecondary }]}>
                    Plan
                  </Text>
                  <Text style={[styles.receiptRowValue, { color: colors.foreground, flex: 1, textAlign: "right" }]}>
                    {data.productName}
                  </Text>
                </View>

                <View style={[styles.receiptDivider, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]} />

                {/* Recipient Phone Row */}
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptRowLabel, { color: colors.textSecondary }]}>
                    Recipient
                  </Text>
                  <View style={styles.recipientRowRight}>
                    {networkInfo && (
                      <View style={styles.miniLogo}>
                        <Image
                          source={networkInfo.logo}
                          style={{ width: 16, height: 16, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <Text style={[styles.receiptRowValue, { color: colors.foreground }]}>
                      {data.recipientPhone}
                    </Text>
                  </View>
                </View>

                {/* Reference Row with One-Tap Copy */}
                {data.transactionId && (
                  <>
                    <View style={[styles.receiptDivider, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]} />
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptRowLabel, { color: colors.textSecondary }]}>
                        Reference
                      </Text>
                      <TouchableOpacity
                        style={styles.copyRefButton}
                        onPress={handleCopyRef}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.refCodeText, { color: colors.foreground }]} numberOfLines={1}>
                          {data.transactionId}
                        </Text>
                        {copiedRef ? (
                          <Text style={[styles.copiedBadgeText, { color: colors.success }]}>Copied!</Text>
                        ) : (
                          <Copy size={13} color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Bonus / Cashback Earned Row */}
                {data.bonusToEarn && data.bonusToEarn > 0 ? (
                  <>
                    <View style={[styles.receiptDivider, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]} />
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptRowLabel, { color: colors.textSecondary }]}>
                        Cashback Earned
                      </Text>
                      <View style={[styles.cashbackEarnedBadge, { backgroundColor: `${colors.success}18` }]}>
                        <Zap size={11} color={colors.success} />
                        <Text style={[styles.cashbackEarnedText, { color: colors.success }]}>
                          +₦{data.bonusToEarn.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.successActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.successShareButton,
                    {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}12`,
                    },
                  ]}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Share2 size={16} color={colors.primary} />
                  <Text style={[styles.successShareButtonText, { color: colors.primary }]}>
                    Share
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.successDoneButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.successDoneButtonText, { color: colors.primaryForeground }]}>
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
                styles.successScrollContent,
                { paddingBottom: Math.max(insets.bottom + 16, 24) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.successHeader}>
                <View style={[styles.successIconOuter, { backgroundColor: `${colors.destructive}18` }]}>
                  <View style={[styles.successIconInner, { backgroundColor: colors.destructive }]}>
                    <XCircle size={24} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>
                  Transaction Failed
                </Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  {data.errorMessage || "Something went wrong. Please check your balance or try again."}
                </Text>
              </View>

              <View style={styles.successActionsRow}>
                <TouchableOpacity
                  style={[styles.successShareButton, { borderColor: colors.border, backgroundColor: "transparent" }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.successShareButtonText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.successDoneButton, { backgroundColor: colors.primary }]}
                  onPress={onRetry}
                  activeOpacity={0.85}
                >
                  <RefreshCw size={16} color={colors.primaryForeground} />
                  <Text style={[styles.successDoneButtonText, { color: colors.primaryForeground }]}>
                    Try Again
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

  // Success / Failed View Modern Styles
  successScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  successIconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
  },
  successAmountBanner: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  successAmountLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  successAmountValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  successPaymentMethodPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  successPaymentMethodText: {
    fontSize: 11,
    fontWeight: "700",
  },
  successReceiptCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  receiptRowLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  receiptRowValue: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  recipientRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  receiptDivider: {
    height: 1,
    width: "100%",
  },
  copyRefButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "65%",
  },
  refCodeText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  copiedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cashbackEarnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cashbackEarnedText: {
    fontSize: 12,
    fontWeight: "700",
  },
  successActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  successShareButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  successShareButtonText: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  successDoneButton: {
    flex: 1.4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    gap: 6,
  },
  successDoneButtonText: {
    fontSize: 14.5,
    fontWeight: "700",
  },
});
