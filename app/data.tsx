/**
 * Data Purchase Screen
 * Per mobile-airtime-data-guide.md - Complete rewrite
 */

import BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Wifi } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CategoryTabs,
  CheckoutData,
  CheckoutModal,
  CheckoutMode,
  NetworkDetectorInput,
  NetworkSelector,
  ProductCard,
} from "@/components/purchase";
import { PinPadModal } from "@/components/security/PinPadModal";
import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useBiometricAuth } from "@/hooks/useBiometric";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useEligibleOffers } from "@/hooks/useUserOffers";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
  NETWORK_PROVIDERS,
  NetworkInfo,
  NetworkProvider,
  isValidNigerianPhone,
  normalizePhoneNumber,
} from "@/lib/detectNetwork";
import { Product } from "@/types/product.types";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / NUM_COLUMNS;

export default function DataScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const router = useRouter();

  // === STATE PER GUIDE SECTION 4 ===
  // Shared
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    productType: "data",
    isActive: true,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const markupMap = useSupplierMarkupMap();
  const { eligibleIds } = useEligibleOffers();
  const { mutateAsync: topup, isPending: isTopupPending } = useTopup();
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

  // Auto-select first network on load
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0].slug);
    }
  }, [networks, selectedNetwork]);

  // === PRODUCT FILTERING (GUIDE SECTION 4 - FLOW 2) ===
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];

    let products = productsData.products;

    // Step 1: Filter by selected network
    if (selectedNetwork) {
      // Find the specific operator name for this network from our derived list
      const operatorInfo = networks.find(n => n.slug === selectedNetwork);
      
      if (operatorInfo) {
        products = products.filter((p: Product) =>
          p.operator?.name === operatorInfo.name
        );
      }
    }

    // Step 2: Filter by selected category
    if (selectedCategory !== "all") {
      products = products.filter(
        (p: Product) =>
          p.category?.slug?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Step 3: Deduplication by product ID
    const seen = new Set<string>();
    products = products.filter((p: Product) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return products;
  }, [productsData, selectedNetwork, selectedCategory]);

  // Get markup percent for a product
  const getMarkupPercent = useCallback(
    (product: Product) => {
      if (!product?.supplierOffers?.[0]) return 0;
      const supplierId = product.supplierOffers[0].supplierId;
      return markupMap.get(supplierId) || 0;
    },
    [markupMap]
  );

  // Check if user is eligible for an offer
  const isEligibleForOffer = useCallback(
    (product: Product) => {
      if (!product.activeOffer?.id) return false;
      return eligibleIds.has(product.activeOffer.id);
    },
    [eligibleIds]
  );

  // Calculate display price for a product
  const getDisplayPrice = useCallback(
    (product: Product) => {
      const supplierPrice = product.supplierOffers?.[0]?.supplierPrice
        ? parseFloat(product.supplierOffers[0].supplierPrice.toString())
        : parseFloat(product.denomAmount);

      const markupPercent = getMarkupPercent(product);
      let sellingPrice = supplierPrice + supplierPrice * (markupPercent / 100);

      // Apply discount if eligible
      if (product.activeOffer && isEligibleForOffer(product)) {
        if (product.discountedPrice) {
          return product.discountedPrice;
        }
        const { discountType, discountValue } = product.activeOffer;
        if (discountType === "percentage") {
          sellingPrice = sellingPrice * (1 - discountValue / 100);
        } else if (discountType === "fixed_amount") {
          sellingPrice = sellingPrice - discountValue;
        }
      }

      return sellingPrice;
    },
    [getMarkupPercent, isEligibleForOffer]
  );

  // === HANDLERS ===
  const handleNetworkDetected = useCallback(
    (network: NetworkProvider | null) => {
      setDetectedNetwork(network); // Updates state

      if (network) {
        // Smart Switch: If detected network exists in our available networks list, select it
        const isAvailable = networks.some(n => n.slug === network);
        if (isAvailable && selectedNetwork !== network) {
          setSelectedNetwork(network);
          setSelectedProduct(null); // Reset product
          Haptics.selectionAsync();
        }
      }
    },
    [networks, selectedNetwork]
  );

  const handleNetworkSelect = useCallback((network: NetworkProvider) => {
    Haptics.selectionAsync();
    setSelectedNetwork(network);
    setSelectedProduct(null); // Reset product on network change
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
    setSelectedProduct(null); // Reset product on category change
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    Haptics.selectionAsync();
    setSelectedProduct(product);
  }, []);

  // Proceed to checkout
  const handleProceedToCheckout = useCallback(() => {
    if (!isPhoneValid || !selectedNetwork || !selectedProduct) return;
    Haptics.selectionAsync();
    setCheckoutMode("checkout");
    checkoutSheetRef.current?.expand();
  }, [isPhoneValid, selectedNetwork, selectedProduct]);

  // === PAYMENT WATERFALL (GUIDE SECTION 4) ===
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedProduct) return;

    const displayPrice = getDisplayPrice(selectedProduct);

    // Store pending payment data
    const paymentData = {
      amount: displayPrice,
      productCode: selectedProduct.productCode,
      recipientPhone: normalizedPhone,
      useCashback,
    };
    setPendingPaymentData(paymentData);

    // Close checkout modal
    checkoutSheetRef.current?.close();

    // Step A: Biometric Check
    try {
      const biometricSupport = await checkBiometricSupport();

      if (biometricSupport.hasHardware && biometricSupport.isEnrolled) {
        const success = await authenticate();

        if (success) {
          // Biometric succeeded - call API
          await executeTransaction({
            ...paymentData,
            verificationToken: "biometric-success",
          });
          return;
        }
      }

      // Step B: Fallback to PIN
      if (!user?.hasPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        alert("Please set a transaction PIN in settings to continue.");
        return;
      }
      setShowPinModal(true);
    } catch (error) {
      console.error("Biometric error:", error);
      if (!user?.hasPin) {
        alert("Please set a transaction PIN in settings to continue.");
        return;
      }
      setShowPinModal(true);
    }
  }, [
    selectedProduct,
    getDisplayPrice,
    normalizedPhone,
    useCashback,
    authenticate,
    checkBiometricSupport,
  ]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pendingPaymentData) return;
      setShowPinModal(false);
      await executeTransaction({ ...pendingPaymentData, pin });
    },
    [pendingPaymentData]
  );

  const executeTransaction = async (paymentData: any) => {
    try {
      const response = await topup(paymentData);

      // Step D: Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastTransactionId(response.data?.transactionId || "N/A");
      setLastErrorMessage(null);
      setCheckoutMode("success");
      checkoutSheetRef.current?.expand();
    } catch (error: any) {
      // Step D: Error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg =
        error?.response?.data?.message || "Transaction failed. Please try again.";
      setLastErrorMessage(errorMsg);
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    }
  };

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
      setSelectedProduct(null);
      router.back();
    }
  }, [checkoutMode, router]);

  // === CHECKOUT DATA ===
  const checkoutData: CheckoutData | null =
    selectedProduct && selectedNetwork
      ? {
          productName: selectedProduct.name,
          recipientPhone: normalizedPhone,
          amount: getDisplayPrice(selectedProduct),
          network: selectedNetwork,
          transactionId: lastTransactionId || undefined,
          errorMessage: lastErrorMessage || undefined,
          bonusToEarn:
            selectedProduct.has_cashback
              ? getDisplayPrice(selectedProduct) *
                ((selectedProduct.cashback_percentage || 0) / 100)
              : 0,
        }
      : null;

  const canProceed = isPhoneValid && selectedNetwork && selectedProduct && !networkMismatch;

  // Render product item
  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={{ width: CARD_WIDTH }}>
        <ProductCard
          product={item}
          isSelected={selectedProduct?.id === item.id}
          onSelect={handleProductSelect}
          markupPercent={getMarkupPercent(item)}
          isEligibleForOffer={isEligibleForOffer(item)}
          isGuest={!user}
        />
      </View>
    ),
    [selectedProduct, handleProductSelect, getMarkupPercent, isEligibleForOffer, user]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Data Plans", // Updated to match screenshot
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


        {/* Phone Number Input */}
        <View style={styles.section}>
          <NetworkDetectorInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={handleNetworkDetected}
            selectedNetwork={selectedNetwork}
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

        {/* Category Tabs */}
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
          isLoading={categoriesLoading}
        />

        {/* Product Grid */}
        <View style={styles.flex}>
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading plans...
              </Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Wifi size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {selectedNetwork
                  ? "No plans found for this network"
                  : "Select a network to see available plans"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={NUM_COLUMNS}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer with Continue Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.foreground }]}>
              ₦{walletBalance.toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
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
                styles.continueText,
                {
                  color: canProceed
                    ? colors.primaryForeground
                    : colors.textDisabled,
                },
              ]}
            >
              {selectedProduct
                ? `Continue - ₦${getDisplayPrice(selectedProduct).toLocaleString()}`
                : "Select a Plan"}
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
  header: {
    alignItems: "center",
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: designTokens.spacing.sm,
  },
  headerTitle: {
    fontSize: designTokens.fontSize.xl,
    fontWeight: "700",
    marginBottom: designTokens.spacing.xs,
  },
  headerSubtitle: {
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  },
  warningText: {
    fontSize: designTokens.fontSize.sm,
    marginTop: designTokens.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: designTokens.spacing.md,
  },
  loadingText: {
    fontSize: designTokens.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: designTokens.spacing.md,
    padding: designTokens.spacing.xl,
  },
  emptyText: {
    fontSize: designTokens.fontSize.base,
    textAlign: "center",
  },
  gridContent: {
    padding: designTokens.spacing.md,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: designTokens.spacing.md,
    borderTopWidth: 1,
    gap: designTokens.spacing.md,
  },
  footerInfo: {
    alignItems: "flex-start",
  },
  balanceLabel: {
    fontSize: designTokens.fontSize.xs,
  },
  balanceAmount: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
  },
  continueButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
});
