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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingOverlay } from "@/components/LoadingOverlay";
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
import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useBiometricAuth } from "@/hooks/useBiometric";
import { useCategories } from "@/hooks/useCategories";
import { useCompletePaymentFlow } from "@/hooks/useCompletePaymentFlow";
import { getAppPreferences } from "@/hooks/useAppPreferences";
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
import {
  calculateFinalPrice,
  getResolvedProductPrice,
} from "@/lib/price-calculator";
import { Product } from "@/types/product.types";
import { getUserFriendlyError } from "@/utils/errors";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / NUM_COLUMNS;

type ProductPurchaseScreenProps = {
  productType?: string;
  title?: string;
  returnRoute?: string;
  processingMessage?: string;
  EmptyIcon?: React.ComponentType<{ size: number; color: string }>;
};

type ProductItemProps = {
  item: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
  markupPercent: number;
  isEligible: boolean;
  isGuest: boolean;
  cardWidth: number;
};

const MemoizedProductItem = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    markupPercent,
    isEligible,
    isGuest,
    cardWidth,
  }: ProductItemProps) => (
    <View style={{ width: cardWidth }}>
      <ProductCard
        product={item}
        isSelected={isSelected}
        onSelect={onSelect}
        markupPercent={markupPercent}
        isEligibleForOffer={isEligible}
        isGuest={isGuest}
      />
    </View>
  ),
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.isEligible === nextProps.isEligible
);

export function ProductPurchaseScreen({
  productType = "data",
  title = "Data Plans",
  returnRoute = "/data",
  processingMessage = "Processing your data purchase...",
  EmptyIcon = Wifi,
}: ProductPurchaseScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showCategories = productType === "data";

  // === STATE PER GUIDE SECTION 4 ===
  // Shared
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>(null);
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // === HOOKS ===
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsLoadError,
    refetch: refetchProducts,
  } = useProducts(
    {
      productType,
      isActive: true,
    },
    { retry: 1 }
  );
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(productType);
  const markupMap = useSupplierMarkupMap();
  const { eligibleIds } = useEligibleOffers();
  const { mutateAsync: topup, isPending: isTopupPending } = useTopup();
  const { balance: walletBalance } = useWalletBalance();
  const { user } = useAuth();
  const { authenticate, checkBiometricSupport } = useBiometricAuth();
  const { processPayment, submitPIN, reset: resetPaymentFlow, isLoading: isPaymentProcessing, currentStep: paymentStep, error: paymentError } = useCompletePaymentFlow({
    onSuccess: (transactionId) => {
      if (!isMountedRef.current) return;
      setLastTransactionId(transactionId);
      setLastErrorMessage(null);
      setCheckoutMode("success");
      // Expand sheet directly to show success (sheet is already closed from handleConfirmPayment)
      checkoutSheetRef.current?.expand();
    },
    onError: (error) => {
      if (!isMountedRef.current) return;
      setLastErrorMessage(error);
      setCheckoutMode("failed");
      // Expand sheet to show failure
      checkoutSheetRef.current?.expand();
    },
  });

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

  // Auto-select first category from DB on load
  useEffect(() => {
    if (showCategories && !selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory, showCategories]);

  // === PRODUCT FILTERING (GUIDE SECTION 4 - FLOW 2) ===
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];

    let products = productsData.products.filter(
      (product: Product) => product.productType === productType
    );

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

    // Step 2: Filter by selected category when this product type uses categories.
    if (showCategories && selectedCategory) {
      products = products.filter(
        (p: Product) =>
          p.category?.slug?.toLowerCase() ===
          (selectedCategory ?? "").toLowerCase()
      );
    }

    // Step 3: Deduplication by product ID
    const seen = new Set<string>();
    products = products.filter((p: Product) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort by denomination amount (small to large)
    products = products.sort((a, b) => {
      const aAmount = getResolvedProductPrice(a);
      const bAmount = getResolvedProductPrice(b);
      return aAmount - bAmount;
    });

    return products;
  }, [productsData, productType, selectedNetwork, selectedCategory, showCategories]);

  // Get markup percent for a product
  const getMarkupPercent = useCallback(
    (product: Product) => {
      if (!product?.supplierOffers?.[0]) return 0;
      const supplierId = product.supplierOffers[0].supplierId || "";
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

  // Calculate display price for a product - SIMPLIFIED (no markup)
  // Priority: discountedPrice from backend > offer calculation > base price
  const getDisplayPrice = useCallback(
    (product: Product) => {
      const priceDetails = calculateFinalPrice(
        product,
        false,
        0,
        0
      );

      return priceDetails.finalSellingPrice;
    },
    []
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
    if (!selectedProduct || !normalizedPhone) return;

    try {
      // Close the checkout sheet immediately - loading overlay will show instead
      // This prevents the checkout modal from showing during payment processing
      checkoutSheetRef.current?.close();
      
      // Get markup for this product
      const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
      const markup = markupMap.get(supplierId) || 0;

      // Initiate payment flow (handles biometric → PIN → transaction)
      const result = await processPayment({
        product: selectedProduct,
        phoneNumber: normalizedPhone,
        useCashback,
        markupPercent: markup,
        userCashbackBalance: cashbackBalance,
      });

      if (result.success) {
        // Success - the onSuccess callback from useCompletePaymentFlow will handle
        // expanding the sheet and showing the success modal
        return;
      }

      // If biometric failed or PIN required, show PIN modal
      if (result.error?.includes("PIN")) {
        setPendingPaymentData({
          product: selectedProduct,
          phoneNumber: normalizedPhone,
          useCashback,
          markupPercent: markup,
        });
        // Wait for BottomSheet close animation (350ms) + buffer
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setShowPinModal(true);
        }, 450);
      } else {
        // Handle validation errors - expand sheet to show error
        setLastErrorMessage(getUserFriendlyError(result.error || "Payment failed"));
        // Wait for Reanimated animation to finish before changing state (400ms)
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setCheckoutMode("failed");
          checkoutSheetRef.current?.expand();
        }, 400);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Payment processing failed";
      setLastErrorMessage(getUserFriendlyError(errorMsg));
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setCheckoutMode("failed");
        checkoutSheetRef.current?.expand();
      }, 400);
    }
  }, [selectedProduct, normalizedPhone, useCashback, cashbackBalance, processPayment, markupMap]);

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
    // Wait for animation to complete before state change
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setCheckoutMode("checkout");
    }, 250);
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
      setSelectedProduct(null);
      
      // Check if user wants auto-redirect
      const prefs = getAppPreferences();
      if (prefs.autoRedirectAfterPurchase) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          router.push("/(tabs)");
        }, 500);
      }
    }
  }, [checkoutMode, router]);

  // === CHECKOUT DATA ===
  const checkoutData: CheckoutData | null =
    selectedProduct && selectedNetwork
      ? (() => {
          const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
          const markup = markupMap.get(supplierId) || 0;
          const priceDetails = calculateFinalPrice(
            selectedProduct,
            useCashback,
            cashbackBalance,
            markup
          );

          return {
            productName: selectedProduct.name,
            productType: selectedProduct.productType,
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

  const canProceed = isPhoneValid && selectedNetwork && selectedProduct;
  const productsLoadErrorMessage = useMemo(() => {
    const status = (productsLoadError as any)?.response?.status;

    if (status === 401 || status === 403) {
      return "Your session could not be verified. Please log in again.";
    }

    return getUserFriendlyError(
      productsLoadError instanceof Error
        ? productsLoadError.message
        : "Please check your connection and try again."
    );
  }, [productsLoadError]);

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <MemoizedProductItem
        item={item}
        isSelected={selectedProduct?.id === item.id}
        onSelect={handleProductSelect}
        markupPercent={getMarkupPercent(item)}
        isEligible={isEligibleForOffer(item)}
        isGuest={!user}
        cardWidth={CARD_WIDTH}
      />
    ),
    [selectedProduct, handleProductSelect, getMarkupPercent, isEligibleForOffer, user]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
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
        {showCategories && (
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
            isLoading={categoriesLoading}
          />
        )}

        {/* Product Grid */}
        <View style={styles.flex}>
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading plans...
              </Text>
            </View>
          ) : productsError ? (
            <View style={styles.emptyContainer}>
              <EmptyIcon size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Unable to load plans right now
              </Text>
              <Text style={[styles.errorText, { color: colors.textDisabled }]}>
                {productsLoadErrorMessage}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => refetchProducts()}
                disabled={productsFetching}
                activeOpacity={0.8}
              >
                {productsFetching ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primaryForeground}
                  />
                ) : (
                  <Text
                    style={[
                      styles.retryText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Retry
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyIcon size={48} color={colors.textDisabled} />
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
              removeClippedSubviews={false}
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
        onClose={() => {
          setShowPinModal(false);
          setPinError(undefined);
        }}
        isLoading={isTopupPending}
        error={pinError}
        returnRoute={returnRoute}
      />

      <LoadingOverlay
        visible={isPaymentProcessing}
        message={processingMessage}
      />
    </View>
  );
}

export default function DataScreen() {
  return <ProductPurchaseScreen />;
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
    marginTop: designTokens.spacing.lg,
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
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    marginHorizontal: designTokens.spacing.lg,
    fontSize: designTokens.fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 120,
    height: 44,
    borderRadius: designTokens.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: designTokens.spacing.lg,
  },
  retryText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "700",
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
