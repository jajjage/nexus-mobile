/**
 * Airtime Purchase Screen - Simplified "Magic" Flow
 * 
 * New Flow:
 * 1. User enters Phone Number (Auto-detects network logo for UX)
 * 2. User enters Amount (Any value 50-50,000)
 * 3. System uses "GENERAL_AIRTIME" product code
 * 4. Backend handles routing and porting
 */

import BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingOverlay } from "@/components/LoadingOverlay";
import {
  CheckoutData,
  CheckoutModal,
  CheckoutMode,
  NetworkDetectorInput,
  NetworkSelector
} from "@/components/purchase";
import { PinPadModal } from "@/components/security/PinPadModal";
import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompletePaymentFlow } from "@/hooks/useCompletePaymentFlow";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
  NetworkProvider,
  NETWORK_PROVIDERS,
  NetworkInfo,
  isValidNigerianPhone,
  normalizePhoneNumber,
} from "@/lib/detectNetwork";
import { calculateFinalPrice } from "@/lib/price-calculator";
import { Product } from "@/types/product.types";
import { getUserFriendlyError } from "@/utils/errors";

export default function AirtimeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // === STATE ===
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  
  // Modals & Flows
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("checkout");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [useCashback, setUseCashback] = useState(false);

  const checkoutSheetRef = useRef<BottomSheet>(null);

  // === HOOKS ===
  const { data: productsData } = useProducts({
    productType: "airtime",
    isActive: true,
  });
  const markupMap = useSupplierMarkupMap();
  const { balance: walletBalance } = useWalletBalance();
  const { user } = useAuth();
  
  // Mutation state
  const { isPending: isTopupPending } = useTopup();
  
  // Payment Flow Hook
  const { processPayment, submitPIN, isLoading: isPaymentProcessing } = useCompletePaymentFlow({
    onSuccess: (transactionId) => {
      setLastTransactionId(transactionId);
      setLastErrorMessage(null);
      setCheckoutMode("success");
      checkoutSheetRef.current?.expand();
    },
    onError: (error) => {
      setLastErrorMessage(error);
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    },
  });

  const cashbackBalance = user?.cashback?.availableBalance || 0;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isPhoneValid = isValidNigerianPhone(normalizedPhone);

  // Validate Amount
  const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, "") || "0");
  const isAmountValid = numericAmount >= 50 && numericAmount <= 50000;

  // Derive unique networks from products
  const networks = useMemo(() => {
    if (!productsData?.products) return [];

    const uniqueNetworks = new Map<string, NetworkInfo>();

    productsData.products.forEach((p: Product) => {
      if (p.operator && p.operator.name) {
        const rawName = p.operator.name.toLowerCase();
        let slug: NetworkProvider;
        
        if (rawName.includes("mtn")) slug = "mtn";
        else if (rawName.includes("glo")) slug = "glo";
        else if (rawName.includes("airtel")) slug = "airtel";
        else if (rawName.includes("9mobile") || rawName.includes("etisalat")) slug = "9mobile";
        else return;

        if (!uniqueNetworks.has(slug)) {
          const localInfo = NETWORK_PROVIDERS[slug];
          uniqueNetworks.set(slug, {
            name: p.operator.name,
            slug: slug,
            color: localInfo?.color || "#000000",
            logoUrl: p.operator.logoUrl || localInfo?.logoUrl,
            logo: localInfo?.logo || p.operator.logoUrl
          });
        }
      }
    });

    return Array.from(uniqueNetworks.values()).sort((a, b) => {
      if (a.slug === "mtn") return -1;
      if (b.slug === "mtn") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [productsData]);

  useEffect(() => {
    if (detectedNetwork && selectedNetwork && detectedNetwork !== selectedNetwork) {
      setNetworkMismatch(true);
    } else {
      setNetworkMismatch(false);
    }
  }, [detectedNetwork, selectedNetwork]);

  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0].slug);
    }
  }, [networks, selectedNetwork]);

  // Find matching product for detected network to check cashback rules
  const matchingProduct = useMemo(() => {
    if (!productsData?.products || !selectedNetwork) return null;
    const operatorInfo = networks.find(n => n.slug === selectedNetwork);
    if (!operatorInfo) return null;
    return productsData.products.find(p => 
      p.operator?.name === operatorInfo.name
    );
  }, [productsData, selectedNetwork, networks]);

  // Dynamic Cashback Preview
  const estimatedCashback = useMemo(() => {
    if (!matchingProduct?.has_cashback || !isAmountValid) return 0;
    const percentage = matchingProduct.cashback_percentage || 0;
    return numericAmount * (percentage / 100);
  }, [matchingProduct, numericAmount, isAmountValid]);

  // === HANDLERS ===
  const handleNetworkDetected = useCallback((network: NetworkProvider | null) => {
    setDetectedNetwork(network);
    if (network) {
      const isAvailable = networks.some(n => n.slug === network);
      if (isAvailable && selectedNetwork !== network) {
        setSelectedNetwork(network);
        Haptics.selectionAsync();
      }
    }
  }, [networks, selectedNetwork]);

  const handleNetworkSelect = useCallback((network: NetworkProvider) => {
    Haptics.selectionAsync();
    setSelectedNetwork(network);
  }, []);

  // Construct the Magic Product
  const selectedProduct = useMemo((): Product | null => {
    if (!isAmountValid) return null;
    
    return {
      id: "GENERAL_AIRTIME",
      name: `₦${numericAmount.toLocaleString()} Airtime`,
      code: "GENERAL_AIRTIME",
      productCode: "GENERAL_AIRTIME",
      denomAmount: numericAmount.toString(),
      type: "airtime",
      // Include selected network in the product metadata if needed, 
      // though backend handles routing.
      operator: selectedNetwork ? { name: selectedNetwork } : undefined
    } as unknown as Product;
  }, [numericAmount, isAmountValid, selectedNetwork]);

  const handleProceedToCheckout = useCallback(() => {
    if (!isPhoneValid || !isAmountValid || !selectedProduct) return;
    Haptics.selectionAsync();
    setCheckoutMode("checkout");
    checkoutSheetRef.current?.expand();
  }, [isPhoneValid, isAmountValid, selectedProduct]);

  // === PAYMENT CONFIRMATION ===
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedProduct || !normalizedPhone) return;

    try {
      // General Airtime usually has 0 markup, but we keep the logic structure
      const markup = 0; 

      checkoutSheetRef.current?.close();

      const result = await processPayment({
        product: selectedProduct,
        phoneNumber: normalizedPhone,
        useCashback,
        markupPercent: markup,
        userCashbackBalance: cashbackBalance,
      });

      if (result.success) return;

      if (result.error?.includes("PIN")) {
        setPendingPaymentData({
          product: selectedProduct,
          phoneNumber: normalizedPhone,
          useCashback,
          markupPercent: markup,
        });
        setShowPinModal(true);
      } else {
        // Handle validation errors (e.g. Insufficient Balance) or other failures
        setLastErrorMessage(getUserFriendlyError(result.error || "Payment failed"));
        setCheckoutMode("failed");
        checkoutSheetRef.current?.expand();
      }
    } catch (error: any) {
      setLastErrorMessage(getUserFriendlyError(error.message || "Payment failed"));
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    }
  }, [selectedProduct, normalizedPhone, useCashback, cashbackBalance, processPayment]);

  const handlePinSubmit = useCallback(async (pin: string) => {
    if (!pendingPaymentData) return;
    try {
      setPinError(undefined);
      const result = await submitPIN({
        ...pendingPaymentData,
        pin,
        userCashbackBalance: cashbackBalance
      });

      if (!result.success) {
        setPinError(getUserFriendlyError(result.error || "PIN failed"));
      } else {
        setShowPinModal(false);
      }
    } catch (error: any) {
      setPinError(getUserFriendlyError(error.message || "PIN failed"));
    }
  }, [pendingPaymentData, submitPIN, cashbackBalance]);

  const handleClose = useCallback(() => {
    checkoutSheetRef.current?.close();
    if (checkoutMode === "success") {
      setAmount("");
      // setPhoneNumber(""); // Keep phone number for convenience
      const prefs = require("@/hooks/useAppPreferences").getAppPreferences();
      if (prefs.autoRedirectAfterPurchase) {
        setTimeout(() => router.push("/(tabs)"), 500);
      }
    }
  }, [checkoutMode, router]);

  const handleRetry = useCallback(() => setCheckoutMode("checkout"), []);

  // === CHECKOUT DATA ===
  const checkoutData: CheckoutData | null = selectedProduct ? (() => {
    const markup = 0;
    const priceDetails = calculateFinalPrice(selectedProduct, useCashback, cashbackBalance, markup);

    return {
      productName: selectedProduct.name,
      recipientPhone: normalizedPhone,
      amount: priceDetails.finalSellingPrice,
      originalAmount: undefined,
      network: selectedNetwork || undefined, // Pass selected network for UI logo
      transactionId: lastTransactionId || undefined,
      errorMessage: lastErrorMessage || undefined,
      bonusToEarn: priceDetails.bonusToEarn,
      supplierCost: priceDetails.supplierCost,
      markup: priceDetails.offerDiscount,
      markupPercent: markup,
      faceValue: priceDetails.faceValue,
    };
  })() : null;

  const canProceed = isPhoneValid && isAmountValid && !!selectedProduct;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Airtime Top-up",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Phone Number Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Phone Number</Text>
            <NetworkDetectorInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onNetworkDetected={handleNetworkDetected}
              placeholder="0803 000 0000"
            />
            {networkMismatch && (
              <Text style={[styles.warningText, { color: colors.warning }]}>
                ⚠️ Phone number belongs to {detectedNetwork?.toUpperCase()}, but {selectedNetwork?.toUpperCase()} is selected
              </Text>
            )}
          </View>

          {/* Network Selector */}
          <NetworkSelector
            networks={networks}
            selectedNetwork={selectedNetwork}
            onSelect={handleNetworkSelect}
            detectedNetwork={detectedNetwork}
          />

          {/* Amount Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Amount</Text>
            <View style={[styles.amountInputContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.foreground }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="100 - 50,000"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            
            {/* Validation & Cashback Feedback */}
            <View style={styles.amountFeedback}>
              {!isAmountValid && amount.length > 0 ? (
                <Text style={[styles.feedbackText, { color: colors.destructive }]}>
                  Amount must be between ₦50 and ₦50,000
                </Text>
              ) : isAmountValid ? (
                <Text style={[styles.feedbackText, { color: colors.success }]}>
                  You will earn approx. ₦{estimatedCashback.toFixed(2)} cashback
                </Text>
              ) : null}
            </View>
          </View>

          {/* Quick Amounts (Optional Helper) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>Quick Select</Text>
            <View style={styles.quickGrid}>
              {["100", "200", "500", "1000", "2000", "5000"].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAmount(val);
                  }}
                >
                  <Text style={[styles.quickChipText, { color: colors.textSecondary }]}>₦{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
            <Text style={[styles.balanceAmount, { color: colors.foreground }]}>
              ₦{walletBalance?.toLocaleString() ?? "0.00"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              {
                flex: 1,
                backgroundColor: canProceed ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleProceedToCheckout}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.proceedButtonText,
                {
                  color: canProceed ? colors.primaryForeground : colors.textDisabled,
                },
              ]}
            >
              {isAmountValid 
                ? `Pay ₦${numericAmount.toLocaleString()}` 
                : "Enter Amount"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CheckoutModal
        ref={checkoutSheetRef}
        data={checkoutData}
        mode={checkoutMode}
        walletBalance={walletBalance}
        cashbackBalance={cashbackBalance}
        useCashback={useCashback}
        onUseCashbackChange={setUseCashback}
        onConfirm={handleConfirmPayment}
        onRetry={handleRetry}
        onClose={handleClose}
        isLoading={isTopupPending}
      />

      <PinPadModal
        visible={showPinModal}
        onSubmit={handlePinSubmit}
        onClose={() => setShowPinModal(false)}
        isLoading={isTopupPending}
        error={pinError}
        returnRoute="/airtime"
      />

      <LoadingOverlay visible={isPaymentProcessing} message="Processing purchase..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  backButton: { padding: designTokens.spacing.xs, marginLeft: 8 },
  scrollContent: { paddingVertical: designTokens.spacing.md },
  section: { paddingHorizontal: designTokens.spacing.md, marginBottom: designTokens.spacing.lg },
  sectionTitle: { fontSize: designTokens.fontSize.base, fontWeight: "600", marginBottom: designTokens.spacing.sm },
  warningText: { fontSize: designTokens.fontSize.sm, marginTop: designTokens.spacing.xs },
  
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    paddingHorizontal: designTokens.spacing.md,
    height: 56,
  },
  currencySymbol: {
    fontSize: designTokens.fontSize.xl,
    fontWeight: "600",
    marginRight: designTokens.spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: designTokens.fontSize.xl,
    fontWeight: "600",
    height: "100%",
  },
  amountFeedback: {
    marginTop: 8,
    minHeight: 20,
  },
  feedbackText: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: "500",
  },
  
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: "500",
  },

  footer: { flexDirection: "row", alignItems: "center", padding: designTokens.spacing.md, borderTopWidth: 1, gap: designTokens.spacing.md },
  footerInfo: { alignItems: "flex-start" },
  balanceLabel: { fontSize: designTokens.fontSize.xs },
  balanceAmount: { fontSize: designTokens.fontSize.lg, fontWeight: "600" },
  proceedButton: { flex: 1, paddingVertical: designTokens.spacing.md, borderRadius: designTokens.radius.lg, alignItems: "center", justifyContent: "center" },
  proceedButtonText: { fontSize: designTokens.fontSize.base, fontWeight: "600" },
});