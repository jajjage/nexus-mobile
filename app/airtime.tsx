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
    ScrollView,
    StyleSheet,
    Text,
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
    NetworkSelector,
} from "@/components/purchase";
import { PinPadModal } from "@/components/security/PinPadModal";
import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
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
import { getUserFriendlyError } from "@/utils/errors";

// Preset airtime amounts
const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2; // 2 columns with gaps

export default function AirtimeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [pinError, setPinError] = useState<string | undefined>(undefined);

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

      const errorMsg = error instanceof Error ? error.message : "Payment processing failed";
      setLastErrorMessage(getUserFriendlyError(errorMsg));
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    }
  }, [selectedAmount, selectedNetwork, normalizedPhone, useCashback, cashbackBalance, networkProducts, processPayment]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pendingPaymentData) return;

      try {
        setPinError(undefined); // Clear previous error


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
          // Show error in PIN modal instead of closing it
          const friendlyError = getUserFriendlyError(result.error || "PIN verification failed");
          setPinError(friendlyError);
          // Keep modal open so user can retry
        } else {
          // Success - close modal
          setShowPinModal(false);
          setPinError(undefined);
        }
      } catch (error) {

        const errorMsg = error instanceof Error ? error.message : "PIN submission failed";
        const friendlyError = getUserFriendlyError(errorMsg);
        setPinError(friendlyError);
        // Keep modal open so user can retry
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
      // Reset form after success - Keep phone/network for easier repeat transactions
      // setPhoneNumber("");
      // setSelectedNetwork(null);
      // setDetectedNetwork(null);
      setSelectedAmount(null);
      
      // Check if user wants auto-redirect
      const prefs = require("@/hooks/useAppPreferences").getAppPreferences();
      if (prefs.autoRedirectAfterPurchase) {
        setTimeout(() => {
          router.push("/(tabs)");
        }, 500);
      }
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
            // Use finalSellingPrice (after offer discount) as the display amount
            amount: priceDetails.finalSellingPrice,
            // Only show originalAmount (strikethrough) if there's an offer discount
            originalAmount: priceDetails.hasOfferDiscount 
              ? priceDetails.baseSellingPrice 
              : undefined,
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Airtime Top-up</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Wallet Balance</Text>
              <Text style={[styles.balanceAmount, { color: colors.primary }]}>
                ₦{walletBalance?.toLocaleString() ?? "0.00"}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.navigate("/(tabs)/profile/wallet")} 
              style={[styles.addMoneyButton, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.addMoneyText, { color: colors.primary }]}>+ Add Money</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Phone Number</Text>
            <NetworkDetectorInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onNetworkDetected={handleNetworkDetected}
              disabled={false}
            />
            {networkMismatch && (
              <Text style={[styles.warningText, { color: colors.destructive }]}>
                Selected network differs from detected network ({detectedNetwork})
              </Text>
            )}
          </View>

          {/* Network Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Network</Text>
            <NetworkSelector
              selectedNetwork={selectedNetwork}
              onSelect={handleNetworkSelect}
              detectedNetwork={detectedNetwork} networks={[]}            />
          </View>

          {/* Amount Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Amount</Text>
            <View style={styles.amountGrid}>
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountCard,
                    { 
                      width: CARD_WIDTH,
                      backgroundColor: selectedAmount === amount ? colors.primary : colors.card,
                      borderColor: selectedAmount === amount ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => handleAmountSelect(amount)}
                >
                  <Text
                    style={[
                      styles.amountText,
                      { color: selectedAmount === amount ? "#FFFFFF" : colors.foreground }
                    ]}
                  >
                    ₦{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Proceed Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                { opacity: (!isPhoneValid || !selectedNetwork || !selectedAmount) ? 0.5 : 1, backgroundColor: colors.primary }
              ]}
              onPress={handleProceedToCheckout}
              disabled={!isPhoneValid || !selectedNetwork || !selectedAmount}
            >
              <Text style={styles.proceedButton}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
          onClose={() => {
            setShowPinModal(false);
            setPinError(undefined);
          }}
          isLoading={isTopupPending}
          error={pinError}
          returnRoute="/airtime"
        />

      <LoadingOverlay
        visible={isPaymentProcessing}
        message="Processing your airtime purchase..."
      />
    </View>
    </View>
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
  proceedButtonText: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addMoneyButton: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.radius.md,
  },
  addMoneyText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
  },
});
