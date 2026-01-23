/**
 * Airtime Purchase Screen
 * Per mobile-airtime-data-guide.md - Complete rewrite
 */

import BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    CheckoutData,
    CheckoutModal,
    CheckoutMode,
    NetworkDetectorInput,
    NetworkSelector,
} from "@/components/purchase";
import { PinPadModal } from "@/components/security/PinPadModal";
import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useBiometricAuth } from "@/hooks/useBiometric";
import { useCompletePaymentFlow } from "@/hooks/useCompletePaymentFlow";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
    NETWORK_PROVIDERS,
    NetworkInfo,
    NetworkProvider,
    isValidNigerianPhone,
    normalizePhoneNumber,
} from "@/lib/detectNetwork";
import { calculateFinalPrice } from "@/lib/price-calculator";
import { Product } from "@/types/product.types";

// Preset airtime amounts
const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2; // 2 columns with gaps

export default function AirtimeScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const router = useRouter();

  // === STATE PER GUIDE SECTION 4 ===
  // Shared
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // Modals
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("checkout");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  // Cashback
  const [useCashback, setUseCashback] = useState(false);

  // Refs
  const checkoutSheetRef = useRef<BottomSheet>(null);

  // === HOOKS ===
  const { data: productsData, isLoading: productsLoading } = useProducts({
    productType: "airtime",
    isActive: true,
  });
  const markupMap = useSupplierMarkupMap();
  const { mutateAsync: topup, isPending: isTopupPending } = useTopup();
  const { processPayment, submitPIN, reset: resetPaymentFlow, isLoading: isPaymentProcessing, currentStep: paymentStep, error: paymentError } = useCompletePaymentFlow({
    onSuccess: (transactionId) => {
      console.log("[AirtimeScreen] Payment successful:", transactionId);
      setLastTransactionId(transactionId);
      setLastErrorMessage(null);
      setCheckoutMode("success");
      checkoutSheetRef.current?.expand();
    },
    onError: (error) => {
      console.error("[AirtimeScreen] Payment failed:", error);
      setLastErrorMessage(error);
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    },
  });
  const { balance: walletBalance } = useWalletBalance();
  const { user } = useAuth();
  const { authenticate, checkBiometricSupport } = useBiometricAuth();

  const cashbackBalance = user?.cashback?.availableBalance || 0;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isPhoneValid = isValidNigerianPhone(normalizedPhone);

  // === NETWORK MISMATCH DETECTION ===
  useEffect(() => {
    if (detectedNetwork && selectedNetwork && detectedNetwork !== selectedNetwork) {
      setNetworkMismatch(true);
    } else {
      setNetworkMismatch(false);
    }
  }, [detectedNetwork, selectedNetwork]);

  // Derive unique networks from products
  const networks = useMemo(() => {
    if (!productsData?.products) return [];

    const uniqueNetworks = new Map<string, NetworkInfo>();

    productsData.products.forEach((p: Product) => {
      if (p.operator && p.operator.name) {
        // Ensure strictly typed slug
        const rawName = p.operator.name.toLowerCase();
        let slug: NetworkProvider;
        
        if (rawName.includes("mtn")) slug = "mtn";
        else if (rawName.includes("glo")) slug = "glo";
        else if (rawName.includes("airtel")) slug = "airtel";
        else if (rawName.includes("9mobile") || rawName.includes("etisalat")) slug = "9mobile";
        else return; // Skip unknown operators

        if (!uniqueNetworks.has(slug)) {
          // Use API data, fallback to local constant for color/logo if missing
          const localInfo = NETWORK_PROVIDERS[slug];
          uniqueNetworks.set(slug, {
            name: p.operator.name,
            slug: slug,
            color: localInfo?.color || "#000000",
            logoUrl: p.operator.logoUrl || localInfo?.logoUrl,
            logo: localInfo?.logo || p.operator.logoUrl // Prioritize local asset
          });
        }
      }
    });

    // Sort: MTN first, then alphabetical
    return Array.from(uniqueNetworks.values()).sort((a, b) => {
      if (a.slug === "mtn") return -1;
      if (b.slug === "mtn") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [productsData]);

  // Auto-select first network
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0].slug);
    }
  }, [networks, selectedNetwork]);

  // Find airtime products for selected network
  const networkProducts = useMemo(() => {
    if (!productsData?.products || !selectedNetwork) return [];
    
    // Find the specific operator name for this network from our derived list
    const operatorInfo = networks.find(n => n.slug === selectedNetwork);
    if (!operatorInfo) return [];

    return productsData.products.filter(
      (p: Product) => p.operator?.name === operatorInfo.name
    );
  }, [productsData, selectedNetwork, networks]);

  // Get markup percent for the first product's supplier
  const getMarkupPercent = (product?: Product) => {
    // No longer used - keeping for compatibility
    return 0; // No markup anymore
  };

  // === HANDLERS ===
  const handleNetworkDetected = useCallback(
    (network: NetworkProvider | null) => {
      setDetectedNetwork(network);

      if (network) {
        // Smart Switch: If detected network exists in our available networks list, select it
        const isAvailable = networks.some(n => n.slug === network);
        if (isAvailable && selectedNetwork !== network) {
          setSelectedNetwork(network);
          Haptics.selectionAsync();
        }
      }
    },
    [networks, selectedNetwork]
  );

  const handleNetworkSelect = useCallback((network: NetworkProvider) => {
    setSelectedNetwork(network);
    setSelectedAmount(null); // Reset amount on network change
  }, []);

  const handleAmountSelect = useCallback((amount: number) => {
    Haptics.selectionAsync();
    setSelectedAmount(amount);
  }, []);

  // Proceed to checkout
  const handleProceedToCheckout = useCallback(() => {
    if (!isPhoneValid || !selectedNetwork || !selectedAmount) return;
    Haptics.selectionAsync();
    setCheckoutMode("checkout");
    checkoutSheetRef.current?.expand();
  }, [isPhoneValid, selectedNetwork, selectedAmount]);

  // === PAYMENT WATERFALL (GUIDE SECTION 4) ===
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedAmount || !selectedNetwork || !normalizedPhone) return;

    try {
      // Find the selected product
      const selectedProduct = networkProducts.find(
        (p: Product) => {
          const supplierId = p.supplierOffers?.[0]?.supplierId || "";
          const markup = markupMap.get(supplierId) || 0;
          const pricecalc = calculateFinalPrice(p, false, 0, markup);
          return pricecalc.payableAmount === selectedAmount;
        }
      );

      if (!selectedProduct) {
        setLastErrorMessage("Product not found. Please try again.");
        return;
      }

      console.log("[AirtimeScreen] Starting payment process for product:", selectedProduct.productCode);

      // Get markup for this product
      const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
      const markup = markupMap.get(supplierId) || 0;

      // Close checkout modal
      checkoutSheetRef.current?.close();

      // Initiate payment flow (handles biometric → PIN → transaction)
      const result = await processPayment({
        product: selectedProduct,
        phoneNumber: normalizedPhone,
        useCashback,
        markupPercent: markup,
        userCashbackBalance: cashbackBalance,
      });

      // If biometric failed or PIN required, show PIN modal
      if (!result.success && result.error?.includes("PIN")) {
        console.log("[AirtimeScreen] Showing PIN modal for verification");
        setPendingPaymentData({
          product: selectedProduct,
          phoneNumber: normalizedPhone,
          useCashback,
          markupPercent: markup,
          amount: selectedAmount,
        });
        setShowPinModal(true);
      }
    } catch (error) {
      console.error("[AirtimeScreen] Payment initiation error:", error);
      const errorMsg = error instanceof Error ? error.message : "Payment processing failed";
      setLastErrorMessage(errorMsg);
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    }
  }, [selectedAmount, selectedNetwork, normalizedPhone, useCashback, cashbackBalance, networkProducts, processPayment]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pendingPaymentData) return;

      try {
        setShowPinModal(false);
        console.log("[AirtimeScreen] Submitting PIN for verification");

        // Submit PIN through the complete payment flow
        const result = await submitPIN({
          product: pendingPaymentData.product,
          phoneNumber: pendingPaymentData.phoneNumber,
          useCashback: pendingPaymentData.useCashback,
          markupPercent: pendingPaymentData.markupPercent,
          pin: pin,
          userCashbackBalance: cashbackBalance,
        });

        if (!result.success) {
          setLastErrorMessage(result.error || "PIN verification failed");
          setCheckoutMode("failed");
          checkoutSheetRef.current?.expand();
        }
      } catch (error) {
        console.error("[AirtimeScreen] PIN submission error:", error);
        const errorMsg = error instanceof Error ? error.message : "PIN submission failed";
        setLastErrorMessage(errorMsg);
        setCheckoutMode("failed");
        checkoutSheetRef.current?.expand();
      }
    },
    [pendingPaymentData, submitPIN, cashbackBalance]
  );

  // Retry after failure
  const handleRetry = useCallback(() => {
    setCheckoutMode("checkout");
  }, []);

  // Close and reset
  const handleClose = useCallback(() => {
    checkoutSheetRef.current?.close();
    if (checkoutMode === "success") {
      // Reset form after success
      setPhoneNumber("");
      setSelectedNetwork(null);
      setDetectedNetwork(null);
      setSelectedAmount(null);
      // Don't use router.back() as there might be no previous screen
      // Just navigate to home tab
      setTimeout(() => {
        router.push("/(tabs)");
      }, 500); // Small delay to let modal close first
    }
  }, [checkoutMode, router]);

  // === CHECKOUT DATA ===
  const checkoutData: CheckoutData | null =
    selectedAmount && selectedNetwork
      ? (() => {
          // Find the product to get price details
          const product = networkProducts.find(
            (p: Product) => {
              const supplierId = p.supplierOffers?.[0]?.supplierId || "";
              const markup = markupMap.get(supplierId) || 0;
              const calc = calculateFinalPrice(p, false, 0, markup);
              return calc.payableAmount === selectedAmount;
            }
          );

          if (!product) return null;

          const supplierId = product.supplierOffers?.[0]?.supplierId || "";
          const markup = markupMap.get(supplierId) || 0;
          const priceDetails = calculateFinalPrice(product, useCashback, cashbackBalance, markup);

          return {
            productName: `₦${selectedAmount.toLocaleString()} Airtime`,
            recipientPhone: normalizedPhone,
            amount: priceDetails.payableAmount,
            originalAmount: priceDetails.baseSellingPrice,
            network: selectedNetwork,
            transactionId: lastTransactionId || undefined,
            errorMessage: lastErrorMessage || undefined,
            bonusToEarn: priceDetails.bonusToEarn,
            supplierCost: priceDetails.supplierCost,
            markup: priceDetails.offerDiscount,
            markupPercent: markup,
            faceValue: priceDetails.faceValue,
          };
        })()
      : null;

  const canProceed = isPhoneValid && selectedNetwork && selectedAmount && !networkMismatch;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Airtime Top-up",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >


          {/* Phone Number Input */}
          <View style={styles.section}>
            <NetworkDetectorInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onNetworkDetected={handleNetworkDetected}
              selectedNetwork={selectedNetwork}
              recentNumbers={user?.recentlyUsedNumbers}
            />

            {/* Network Mismatch Warning */}
            {networkMismatch && (
              <Text style={[styles.warningText, { color: colors.warning }]}>
                ⚠️ Phone number belongs to {detectedNetwork?.toUpperCase()}, but{" "}
                {selectedNetwork?.toUpperCase()} is selected
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

          {/* Amount Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Select Amount
            </Text>

            <View style={styles.amountGrid}>
              {PRESET_AMOUNTS.map((amount) => {
                const isSelected = selectedAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.amountCard,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleAmountSelect(amount)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.amountText,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      ₦{amount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Balance Display */}
          <View style={[styles.balanceCard, { backgroundColor: colors.muted }]}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Wallet Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.foreground }]}>
              ₦{walletBalance.toLocaleString()}
            </Text>
          </View>
        </ScrollView>

        {/* Proceed Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              {
                backgroundColor: canProceed ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleProceedToCheckout}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.proceedText,
                {
                  color: canProceed
                    ? colors.primaryForeground
                    : colors.textDisabled,
                },
              ]}
            >
              {selectedAmount
                ? `Proceed - ₦${selectedAmount.toLocaleString()}`
                : "Select Amount"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Checkout Modal */}
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

      {/* PIN Pad Modal */}
      <PinPadModal
        visible={showPinModal}
        onSubmit={handlePinSubmit}
        onClose={() => setShowPinModal(false)}
        isLoading={isTopupPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    padding: designTokens.spacing.xs,
    marginLeft: -designTokens.spacing.xs,
  },
  scrollContent: {
    paddingBottom: designTokens.spacing.xxl,
  },
  header: {
    alignItems: "center",
    paddingVertical: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: designTokens.spacing.md,
  },
  headerTitle: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: designTokens.spacing.xs,
  },
  headerSubtitle: {
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
    marginBottom: designTokens.spacing.sm,
  },
  warningText: {
    fontSize: designTokens.fontSize.sm,
    marginTop: designTokens.spacing.xs,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.sm,
  },
  amountCard: {
    paddingVertical: designTokens.spacing.lg,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "700",
  },
  balanceCard: {
    marginHorizontal: designTokens.spacing.md,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: designTokens.fontSize.sm,
  },
  balanceAmount: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
  },
  footer: {
    padding: designTokens.spacing.md,
    borderTopWidth: 1,
  },
  proceedButton: {
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
  },
});
