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
  Keyboard,
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
  PortedNumberBypass,
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
import { useNetworkAutoDetectionPreference } from "@/hooks/useNetworkAutoDetectionPreference";
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
import { Product, ProductCategory } from "@/types/product.types";
import { getUserFriendlyError } from "@/utils/errors";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - CARD_GAP) / NUM_COLUMNS;

const DEFAULT_NETWORKS: NetworkInfo[] = [
  NETWORK_PROVIDERS.mtn,
  NETWORK_PROVIDERS.airtel,
  NETWORK_PROVIDERS.glo,
  NETWORK_PROVIDERS["9mobile"],
].filter(Boolean) as NetworkInfo[];

type ProductPurchaseScreenProps = {
  productType?: string;
  title?: string;
  returnRoute?: string;
  processingMessage?: string;
  EmptyIcon?: React.ComponentType<{ size: number; color: string }>;
};

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
  // Shared - pre-initialize with default MTN so initial frame renders immediately (0ms)
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkProvider | null>("mtn");
  const [detectedNetwork, setDetectedNetwork] = useState<NetworkProvider | null>(null);
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
      perPage: 100,
      limit: 100,
    },
    { retry: 1 }
  );
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(productType);
  const markupMap = useSupplierMarkupMap();
  const { eligibleIds } = useEligibleOffers();
  const { mutateAsync: topup, isPending: isTopupPending } = useTopup();
  const { balance: walletBalance } = useWalletBalance();
  const { user } = useAuth();
  const { isAutoDetectionEnabled, setIsAutoDetectionEnabled } =
    useNetworkAutoDetectionPreference();
  const { authenticate, checkBiometricSupport } = useBiometricAuth();
  const { processPayment, submitPIN, reset: resetPaymentFlow, isLoading: isPaymentProcessing, currentStep: paymentStep, error: paymentError } = useCompletePaymentFlow({
    onSuccess: (transactionId) => {
      if (!isMountedRef.current) return;
      setLastTransactionId(transactionId);
      setLastErrorMessage(null);
      setCheckoutMode("success");
      checkoutSheetRef.current?.expand();
    },
    onError: (error) => {
      if (!isMountedRef.current) return;
      setLastErrorMessage(error);
      setCheckoutMode("failed");
      checkoutSheetRef.current?.expand();
    },
  });

  const cashbackBalance = user?.cashback?.availableBalance || 0;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isPhoneValid = isValidNigerianPhone(normalizedPhone);

  // Derive unique networks from products (falls back to DEFAULT_NETWORKS instantly)
  const networks = useMemo(() => {
    if (!productsData?.products?.length) return DEFAULT_NETWORKS;

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

    if (uniqueNetworks.size === 0) return DEFAULT_NETWORKS;

    // Sort: MTN first, then alphabetical
    return Array.from(uniqueNetworks.values()).sort((a, b) => {
      if (a.slug === "mtn") return -1;
      if (b.slug === "mtn") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [productsData]);

  // Auto-select first network on load if not selected
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      setSelectedNetwork(networks[0].slug);
    }
  }, [networks, selectedNetwork]);

  // === CATEGORY FILTERING BY SELECTED NETWORK & PRODUCT AVAILABILITY ===
  const visibleCategories = useMemo(() => {
    if (!categories.length) return [];
    if (!productsData?.products?.length) return categories;

    const productsForNetwork = productsData.products.filter((p: Product) => {
      if (p.productType?.toLowerCase() !== productType?.toLowerCase()) return false;
      if (p.isActive === false) return false;

      if (selectedNetwork) {
        const pOpName = p.operator?.name?.toLowerCase() || "";
        const opSlug = selectedNetwork.toLowerCase();

        let matches = false;
        if (opSlug === "9mobile") {
          matches = pOpName.includes("9mobile") || pOpName.includes("etisalat");
        } else {
          matches = pOpName.includes(opSlug);
        }
        if (!matches) return false;
      }
      return true;
    });

    const activeCategoryIdentifiers = new Set<string>();
    productsForNetwork.forEach((p: Product) => {
      if (p.category?.slug) activeCategoryIdentifiers.add(p.category.slug.toLowerCase());
      if (p.category?.name) activeCategoryIdentifiers.add(p.category.name.toLowerCase());
      if (p.categoryId) activeCategoryIdentifiers.add(p.categoryId.toLowerCase());
    });

    const filtered = categories.filter((c: ProductCategory) =>
      activeCategoryIdentifiers.has(c.slug.toLowerCase()) ||
      activeCategoryIdentifiers.has(c.name.toLowerCase()) ||
      activeCategoryIdentifiers.has(c.id.toLowerCase())
    );

    return filtered.length > 0 ? filtered : categories;
  }, [categories, productsData, productType, selectedNetwork]);

  // Auto-select first valid category when visibleCategories or selectedNetwork changes
  useEffect(() => {
    if (showCategories && visibleCategories.length > 0) {
      const isCurrentValid = visibleCategories.some(
        (c) =>
          c.slug.toLowerCase() === selectedCategory?.toLowerCase() ||
          c.id.toLowerCase() === selectedCategory?.toLowerCase()
      );
      if (!selectedCategory || !isCurrentValid) {
        setSelectedCategory(visibleCategories[0].slug);
      }
    }
  }, [visibleCategories, selectedCategory, showCategories]);

  // === PRODUCT FILTERING (GUIDE SECTION 4 - FLOW 2) ===
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];

    let products = productsData.products.filter(
      (product: Product) => product.productType?.toLowerCase() === productType?.toLowerCase()
    );

    // Step 1: Filter by selected network
    if (selectedNetwork) {
      const operatorInfo = networks.find(n => n.slug === selectedNetwork);
      if (operatorInfo) {
        products = products.filter((p: Product) => {
          const pOpName = p.operator?.name?.toLowerCase() || "";
          const opName = operatorInfo.name?.toLowerCase() || "";
          const opSlug = operatorInfo.slug?.toLowerCase() || "";
          return pOpName.includes(opSlug) || opName.includes(pOpName) || pOpName === opName;
        });
      }
    }

    // Step 2: Filter by selected category
    if (showCategories && selectedCategory) {
      products = products.filter(
        (p: Product) =>
          p.category?.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryId === selectedCategory
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

  const getMarkupPercent = useCallback(
    (product: Product) => {
      if (!product?.supplierOffers?.[0]) return 0;
      const supplierId = product.supplierOffers[0].supplierId || "";
      return markupMap.get(supplierId) || 0;
    },
    [markupMap]
  );

  const isEligibleForOffer = useCallback(
    (product: Product) => {
      if (!product.activeOffer?.id) return false;
      return eligibleIds.has(product.activeOffer.id);
    },
    [eligibleIds]
  );

  // === HANDLERS ===
  const handleNetworkDetected = useCallback(
    (network: NetworkProvider | null) => {
      setDetectedNetwork(network);

      if (isAutoDetectionEnabled && network) {
        const isAvailable = networks.some(n => n.slug === network);
        if (isAvailable && selectedNetwork !== network) {
          setSelectedNetwork(network);
          setSelectedProduct(null);
        }
      }
    },
    [isAutoDetectionEnabled, networks, selectedNetwork]
  );

  const handleNetworkSelect = useCallback((network: NetworkProvider) => {
    setSelectedNetwork(network);
    setSelectedProduct(null);
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  // Proceed to checkout (triggered when user touches the Continue button)
  const handleProceedToCheckout = useCallback(() => {
    if (!isPhoneValid || !selectedNetwork || !selectedProduct) return;
    Keyboard.dismiss();
    setCheckoutMode("checkout");
    setTimeout(() => {
      if (isMountedRef.current) {
        checkoutSheetRef.current?.expand();
      }
    }, 50);
  }, [isPhoneValid, selectedNetwork, selectedProduct]);

  // === PAYMENT WATERFALL ===
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedProduct || !normalizedPhone) return;

    try {
      Keyboard.dismiss();
      checkoutSheetRef.current?.close();
      
      const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
      const markup = markupMap.get(supplierId) || 0;

      const result = await processPayment({
        product: selectedProduct,
        phoneNumber: normalizedPhone,
        useCashback,
        markupPercent: markup,
        userCashbackBalance: cashbackBalance,
        allowOperatorMismatch: !isAutoDetectionEnabled,
        selectedOperatorCode: selectedNetwork?.toUpperCase(),
      });

      if (result.success) {
        return;
      }

      if (result.error?.includes("PIN")) {
        setPendingPaymentData({
          product: selectedProduct,
          phoneNumber: normalizedPhone,
          useCashback,
          markupPercent: markup,
          allowOperatorMismatch: !isAutoDetectionEnabled,
          selectedOperatorCode: selectedNetwork?.toUpperCase(),
        });
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setShowPinModal(true);
        }, 450);
      } else {
        setLastErrorMessage(getUserFriendlyError(result.error || "Payment failed"));
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
  }, [selectedProduct, normalizedPhone, useCashback, cashbackBalance, processPayment, markupMap, isAutoDetectionEnabled, selectedNetwork]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pendingPaymentData) return;
      try {
        setPinError(undefined);

        const result = await submitPIN({
          product: pendingPaymentData.product,
          phoneNumber: pendingPaymentData.phoneNumber,
          useCashback,
          markupPercent: pendingPaymentData.markupPercent,
          allowOperatorMismatch: pendingPaymentData.allowOperatorMismatch,
          selectedOperatorCode: pendingPaymentData.selectedOperatorCode,
          pin: pin,
          userCashbackBalance: cashbackBalance,
        });

        if (!result.success) {
          const friendlyError = getUserFriendlyError(result.error || "PIN verification failed");
          setPinError(friendlyError);
        } else {
          setShowPinModal(false);
          setPinError(undefined);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "PIN submission failed";
        const friendlyError = getUserFriendlyError(errorMsg);
        setPinError(friendlyError);
      }
    },
    [pendingPaymentData, submitPIN, cashbackBalance, useCashback]
  );

  const handleRetry = useCallback(() => {
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setCheckoutMode("checkout");
    }, 250);
  }, []);

  const handleClose = useCallback(() => {
    checkoutSheetRef.current?.close();
    if (checkoutMode === "success") {
      setSelectedProduct(null);
      
      const prefs = getAppPreferences();
      if (prefs.autoRedirectAfterPurchase) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          router.back();
        }, 300);
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
            amount: priceDetails.finalSellingPrice,
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

  const selectedProductPrice = useMemo(() => {
    if (!selectedProduct) return null;
    const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    const priceDetails = calculateFinalPrice(
      selectedProduct,
      false,
      0,
      markup
    );
    return priceDetails.finalSellingPrice;
  }, [selectedProduct, markupMap]);

  const canProceed = Boolean(isPhoneValid && selectedNetwork && selectedProduct);

  const selectedProductId = selectedProduct?.id;

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={{ width: CARD_WIDTH }}>
        <ProductCard
          product={item}
          isSelected={selectedProductId === item.id}
          onSelect={handleProductSelect}
          markupPercent={getMarkupPercent(item)}
          isEligibleForOffer={isEligibleForOffer(item)}
          isGuest={!user}
        />
      </View>
    ),
    [selectedProductId, handleProductSelect, getMarkupPercent, isEligibleForOffer, user]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Clean Custom Header (Slides in/out seamlessly with the screen) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        {/* Phone Number Input & Ported Number Option */}
        <View style={styles.section}>
          <NetworkDetectorInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={handleNetworkDetected}
            autoDetectEnabled={isAutoDetectionEnabled}
          />
          <PortedNumberBypass
            enabled={!isAutoDetectionEnabled}
            onChange={(bypassEnabled) => {
              setIsAutoDetectionEnabled(!bypassEnabled);
            }}
          />
        </View>

        {/* Network Selector */}
        <NetworkSelector
          networks={networks}
          selectedNetwork={selectedNetwork}
          onSelect={handleNetworkSelect}
          detectedNetwork={isAutoDetectionEnabled ? detectedNetwork : null}
        />

        {/* Category Tabs */}
        {showCategories && (
          <CategoryTabs
            categories={visibleCategories}
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
              extraData={selectedProductId}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              initialNumToRender={12}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Floating/Fixed Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Balance
          </Text>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>
            ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: canProceed
                ? colors.primary
                : isDark
                ? "#334155"
                : "#E2E8F0",
            },
          ]}
          onPress={handleProceedToCheckout}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                color: canProceed
                  ? colors.primaryForeground
                  : colors.textDisabled,
              },
            ]}
          >
            {selectedProduct && selectedProductPrice !== null
              ? `Continue - ₦${Math.round(selectedProductPrice).toLocaleString()}`
              : "Select a Plan"}
          </Text>
        </TouchableOpacity>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 24,
  },
  backButton: {
    padding: designTokens.spacing.xs,
    marginLeft: -designTokens.spacing.xs,
  },
  section: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: 10,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: designTokens.spacing.xxl,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: designTokens.spacing.xl,
    gap: designTokens.spacing.md,
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    paddingBottom: 24,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  balanceContainer: {
    justifyContent: "center",
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  continueButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
