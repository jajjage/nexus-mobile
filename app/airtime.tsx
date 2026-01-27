/**
 * Airtime Purchase Screen
 * Dynamic Products + Complete Payment Flow
 */

import BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  NETWORK_PROVIDERS,
  NetworkInfo,
  NetworkProvider,
  isValidNigerianPhone,
  normalizePhoneNumber,
} from "@/lib/detectNetwork";
import { calculateFinalPrice } from "@/lib/price-calculator";
import { Product } from "@/types/product.types";
import { getUserFriendlyError } from "@/utils/errors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2; // 2 columns with gaps

export default function AirtimeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // === STATE ===
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  
  // Dynamic Product Selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals & Flows
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("checkout");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [useCashback, setUseCashback] = useState(false);

  const checkoutSheetRef = useRef<BottomSheet>(null);

  // === DATA HOOKS ===
  const { data: productsData, isLoading: productsLoading } = useProducts({
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

  // === NETWORK LOGIC ===
  useEffect(() => {
    setNetworkMismatch(!!detectedNetwork && !!selectedNetwork && detectedNetwork !== selectedNetwork);
  }, [detectedNetwork, selectedNetwork]);

  // Derive unique networks from loaded products
  const networks = useMemo(() => {
    if (!productsData?.products) return [];
    const uniqueNetworks = new Map<string, NetworkInfo>();

    productsData.products.forEach((p: Product) => {
      if (p.operator?.name) {
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

  // Auto-select first network
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0].slug);
    }
  }, [networks, selectedNetwork]);

  // === PRODUCT FILTERING ===
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    let products = productsData.products;

    // Filter by Network
    if (selectedNetwork) {
      const operatorInfo = networks.find(n => n.slug === selectedNetwork);
      if (operatorInfo) {
        products = products.filter(p => p.operator?.name === operatorInfo.name);
      }
    }

    // Sort by Amount
    return products.sort((a, b) => {
      const amountA = parseFloat(a.denomAmount || "0");
      const amountB = parseFloat(b.denomAmount || "0");
      return amountA - amountB;
    });
  }, [productsData, selectedNetwork, networks]);

  // === HANDLERS ===
  const handleNetworkDetected = useCallback((network: NetworkProvider | null) => {
    setDetectedNetwork(network);
    if (network) {
      const isAvailable = networks.some(n => n.slug === network);
      if (isAvailable && selectedNetwork !== network) {
        setSelectedNetwork(network);
        setSelectedProduct(null);
        Haptics.selectionAsync();
      }
    }
  }, [networks, selectedNetwork]);

  const handleNetworkSelect = useCallback((network: NetworkProvider) => {
    setSelectedNetwork(network);
    setSelectedProduct(null);
    Haptics.selectionAsync();
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    Haptics.selectionAsync();
  }, []);

  const handleProceedToCheckout = useCallback(() => {
    if (!isPhoneValid || !selectedNetwork || !selectedProduct) return;
    Haptics.selectionAsync();
    setCheckoutMode("checkout");
    checkoutSheetRef.current?.expand();
  }, [isPhoneValid, selectedNetwork, selectedProduct]);

  // === PAYMENT CONFIRMATION ===
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedProduct || !normalizedPhone) return;

    try {
      const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
      const markup = markupMap.get(supplierId) || 0;

      checkoutSheetRef.current?.close();

      const result = await processPayment({
        product: selectedProduct,
        phoneNumber: normalizedPhone,
        useCashback,
        markupPercent: markup,
        userCashbackBalance: cashbackBalance,
      });

      if (!result.success && result.error?.includes("PIN")) {
        setPendingPaymentData({
          product: selectedProduct,
          phoneNumber: normalizedPhone,
          useCashback,
          markupPercent: markup,
        });
        setShowPinModal(true);
      }
    } catch (error: any) {
      setLastErrorMessage(getUserFriendlyError(error.message || "Payment failed"));
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    }
  }, [selectedProduct, normalizedPhone, useCashback, cashbackBalance, processPayment, markupMap]);

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
      setSelectedProduct(null);
      const prefs = require("@/hooks/useAppPreferences").getAppPreferences();
      if (prefs.autoRedirectAfterPurchase) {
        setTimeout(() => router.push("/(tabs)"), 500);
      }
    }
  }, [checkoutMode, router]);

  const handleRetry = useCallback(() => setCheckoutMode("checkout"), []);

  // === CHECKOUT DATA ===
  const checkoutData: CheckoutData | null = selectedProduct && selectedNetwork ? (() => {
    const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    const priceDetails = calculateFinalPrice(selectedProduct, useCashback, cashbackBalance, markup);

    return {
      productName: selectedProduct.name || `₦${parseFloat(selectedProduct.denomAmount).toLocaleString()} Airtime`,
      recipientPhone: normalizedPhone,
      amount: priceDetails.finalSellingPrice,
      originalAmount: priceDetails.hasOfferDiscount ? priceDetails.baseSellingPrice : undefined,
      network: selectedNetwork,
      transactionId: lastTransactionId || undefined,
      errorMessage: lastErrorMessage || undefined,
      bonusToEarn: priceDetails.bonusToEarn,
      supplierCost: priceDetails.supplierCost,
      markup: priceDetails.offerDiscount,
      markupPercent: markup,
      faceValue: priceDetails.faceValue,
    };
  })() : null;

  const canProceed = isPhoneValid && selectedNetwork && selectedProduct && !networkMismatch;

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

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Phone */}
        <View style={[styles.section, { marginTop: 0, marginBottom: designTokens.spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Phone Number</Text>
          <NetworkDetectorInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={handleNetworkDetected}
          />
          {networkMismatch && (
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              Selected network differs from detected network ({detectedNetwork})
            </Text>
          )}
        </View>

        {/* Network */}
        <NetworkSelector
          networks={networks}
          selectedNetwork={selectedNetwork}
          onSelect={handleNetworkSelect}
          detectedNetwork={detectedNetwork}
        />

        {/* Product Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Amount</Text>
          {productsLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : filteredProducts.length === 0 ? (
            <Text style={{ color: colors.textSecondary, padding: 20, textAlign: 'center' }}>
              {selectedNetwork ? "No plans available." : "Select a network."}
            </Text>
          ) : (
            <View style={styles.amountGrid}>
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                const amount = parseFloat(product.denomAmount || "0");
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.amountCard,
                      { 
                        width: CARD_WIDTH,
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        shadowColor: isSelected ? colors.primary : "transparent",
                        shadowOffset: { width: 0, height: isSelected ? 4 : 0 },
                        shadowOpacity: isSelected ? 0.3 : 0,
                        shadowRadius: isSelected ? 8 : 0,
                        elevation: isSelected ? 5 : 0,
                      }
                    ]}
                    onPress={() => handleProductSelect(product)}
                  >
                    <Text style={[styles.amountText, { color: isSelected ? "#FFFFFF" : colors.foreground, fontSize: isSelected ? designTokens.fontSize.xl : designTokens.fontSize.lg }]}>
                      ₦{amount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
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
            {selectedProduct
              ? `Continue - ₦${parseFloat(selectedProduct.denomAmount).toLocaleString()}`
              : "Select Amount"}
          </Text>
        </TouchableOpacity>
      </View>

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
  scrollContent: { paddingTop: -designTokens.spacing.md, paddingBottom: designTokens.spacing.xxl * 2 },
  section: { paddingHorizontal: designTokens.spacing.md, marginBottom: designTokens.spacing.md },
  sectionTitle: { fontSize: designTokens.fontSize.base, fontWeight: "600", marginBottom: designTokens.spacing.sm },
  warningText: { fontSize: designTokens.fontSize.sm, marginTop: designTokens.spacing.xs },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: designTokens.spacing.sm },
  amountCard: { paddingVertical: designTokens.spacing.lg, borderRadius: designTokens.radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  amountText: { fontSize: designTokens.fontSize.lg, fontWeight: "700" },
  footer: { flexDirection: "row", alignItems: "center", padding: designTokens.spacing.md, borderTopWidth: 1, gap: designTokens.spacing.md },
  footerInfo: { alignItems: "flex-start" },
  balanceLabel: { fontSize: designTokens.fontSize.xs },
  balanceAmount: { fontSize: designTokens.fontSize.lg, fontWeight: "600" },
  proceedButton: { flex: 1, paddingVertical: designTokens.spacing.md, borderRadius: designTokens.radius.lg, alignItems: "center", justifyContent: "center" },
  proceedButtonText: { fontSize: designTokens.fontSize.base, fontWeight: "600" },
});
