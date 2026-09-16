/**
 * Smile & Specialized 4G Plans Purchase Screen
 * Supports categories: smile, kirani, ratel, alpha
 * ProductType: "plan"
 */

import BottomSheet from "@gorhom/bottom-sheet";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Radio, Smile as SmileIcon, X } from "lucide-react-native";
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
  TextInput,
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
  ProductCard,
} from "@/components/purchase";
import { PinPadModal } from "@/components/security/PinPadModal";
import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useCompletePaymentFlow } from "@/hooks/useCompletePaymentFlow";
import { getAppPreferences } from "@/hooks/useAppPreferences";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useEligibleOffers } from "@/hooks/useUserOffers";
import { useWalletBalance } from "@/hooks/useWalletBalance";
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
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / NUM_COLUMNS;

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: "smile", name: "Smile", slug: "smile", priority: 1, isActive: true },
  { id: "kirani", name: "Kirani", slug: "kirani", priority: 2, isActive: true },
  { id: "ratel", name: "Ratel", slug: "ratel", priority: 3, isActive: true },
  { id: "alpha", name: "Alpha", slug: "alpha", priority: 4, isActive: true },
];

export default function SmileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [recipient, setRecipient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("smile");
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

  // Hooks
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsLoadError,
    refetch: refetchProducts,
  } = useProducts(
    {
      productType: "plan",
      isActive: true,
      perPage: 100,
      limit: 100,
    },
    { retry: 1 }
  );

  const { data: fetchedCategories = [], isLoading: categoriesLoading } =
    useCategories("plan");
  const markupMap = useSupplierMarkupMap();
  const { eligibleIds } = useEligibleOffers();
  const { balance: walletBalance } = useWalletBalance();
  const { user } = useAuth();

  const { processPayment, submitPIN, isLoading: isPaymentProcessing } =
    useCompletePaymentFlow({
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

  // Categories list with default fallback
  const visibleCategories = useMemo(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      return fetchedCategories;
    }
    return DEFAULT_CATEGORIES;
  }, [fetchedCategories]);

  // Ensure selected category is valid
  useEffect(() => {
    if (visibleCategories.length > 0) {
      const isValid = visibleCategories.some(
        (c) => c.slug.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (!isValid) {
        setSelectedCategory(visibleCategories[0].slug);
      }
    }
  }, [visibleCategories, selectedCategory]);

  // Product filtering by selected category
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];

    const targetCategory = selectedCategory.toLowerCase();

    let products = productsData.products.filter(
      (product: Product) => product.productType?.toLowerCase() === "plan"
    );

    products = products.filter((p: Product) => {
      const pCatSlug =
        p.category?.slug?.toLowerCase() ||
        (p as any).categorySlug?.toLowerCase() ||
        "";
      const pCatName = p.category?.name?.toLowerCase() || "";
      const pCatId = p.categoryId?.toLowerCase() || "";
      return (
        pCatSlug === targetCategory ||
        pCatName === targetCategory ||
        pCatId === targetCategory
      );
    });

    // Deduplication
    const seen = new Set<string>();
    products = products.filter((p: Product) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort by price
    products = products.sort((a, b) => {
      const aAmount = getResolvedProductPrice(a);
      const bAmount = getResolvedProductPrice(b);
      return aAmount - bAmount;
    });

    return products;
  }, [productsData, selectedCategory]);

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

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const isRecipientValid = recipient.trim().length >= 4;
  const canProceed = Boolean(isRecipientValid && selectedProduct);

  const handleProceedToCheckout = useCallback(() => {
    if (!isRecipientValid || !selectedProduct) return;
    Keyboard.dismiss();
    setCheckoutMode("checkout");
    setTimeout(() => {
      if (isMountedRef.current) {
        checkoutSheetRef.current?.expand();
      }
    }, 50);
  }, [isRecipientValid, selectedProduct]);

  const handleConfirmPayment = useCallback(() => {
    if (!selectedProduct || !recipient.trim()) return;

    Keyboard.dismiss();
    const supplierId = selectedProduct.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    setPendingPaymentData({
      product: selectedProduct,
      phoneNumber: recipient.trim(),
      useCashback,
      markupPercent: markup,
      userCashbackBalance: cashbackBalance,
      allowOperatorMismatch: true,
      selectedOperatorCode: selectedCategory.toUpperCase(),
    });
    setPinError(undefined);
    checkoutSheetRef.current?.close();
    setShowPinModal(true);
  }, [
    selectedProduct,
    recipient,
    useCashback,
    cashbackBalance,
    markupMap,
    selectedCategory,
  ]);

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
          allowOperatorMismatch: true,
          selectedOperatorCode: pendingPaymentData.selectedOperatorCode,
          pin: pin,
          userCashbackBalance: cashbackBalance,
        });

        if (!result.success) {
          const friendlyError = getUserFriendlyError(
            result.error || "PIN verification failed"
          );
          setPinError(friendlyError);
        } else {
          setShowPinModal(false);
          setPinError(undefined);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "PIN submission failed";
        const friendlyError = getUserFriendlyError(errorMsg);
        setPinError(friendlyError);
      }
    },
    [pendingPaymentData, submitPIN, cashbackBalance, useCashback]
  );

  const handleBiometricPress = useCallback(async () => {
    if (!pendingPaymentData) return;
    setPinError(undefined);
    const result = await processPayment({
      ...pendingPaymentData,
      useBiometric: true,
    });
    if (result.success) {
      setShowPinModal(false);
    } else {
      setPinError(
        getUserFriendlyError(result.error || "Biometric verification failed")
      );
    }
  }, [pendingPaymentData, processPayment]);

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

  const checkoutData: CheckoutData | null = selectedProduct
    ? (() => {
        const supplierId =
          selectedProduct.supplierOffers?.[0]?.supplierId || "";
        const markup = markupMap.get(supplierId) || 0;
        const priceDetails = calculateFinalPrice(
          selectedProduct,
          useCashback,
          cashbackBalance,
          markup
        );

        return {
          productName: selectedProduct.name,
          productType: "plan",
          recipientPhone: recipient.trim(),
          amount: priceDetails.finalSellingPrice,
          originalAmount: priceDetails.hasOfferDiscount
            ? priceDetails.baseSellingPrice
            : undefined,
          network: selectedCategory as any,
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
    [
      selectedProductId,
      handleProductSelect,
      getMarkupPercent,
      isEligibleForOffer,
      user,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Smile & 4G Plans
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        {/* Recipient Input Card */}
        <View style={styles.section}>
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {selectedCategory === "smile"
                ? "Phone Number or Account ID"
                : "Recipient Phone Number"}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                value={recipient}
                onChangeText={setRecipient}
                placeholder={
                  selectedCategory === "smile"
                    ? "e.g. 08012345678 or Account ID"
                    : "e.g. 08012345678"
                }
                placeholderTextColor={colors.textDisabled}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {recipient.length > 0 && (
                <TouchableOpacity
                  onPress={() => setRecipient("")}
                  style={styles.clearButton}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <CategoryTabs
          categories={visibleCategories}
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
                Loading {selectedCategory} plans...
              </Text>
            </View>
          ) : productsError ? (
            <View style={styles.emptyContainer}>
              <Radio size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Unable to load plans right now
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => refetchProducts()}
                disabled={productsFetching}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.retryText, { color: colors.primaryForeground }]}
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SmileIcon size={48} color={colors.textDisabled} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No plans found for {selectedCategory.toUpperCase()}
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textDisabled }]}
              >
                Check back later or select another category.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              numColumns={NUM_COLUMNS}
              extraData={selectedProductId}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={3}
              removeClippedSubviews={Platform.OS === "android"}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Bar */}
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
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Balance
          </Text>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>
            ₦
            {walletBalance.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

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
        isLoading={isPaymentProcessing}
      />

      {/* PIN Pad Modal */}
      <PinPadModal
        visible={showPinModal}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setShowPinModal(false);
          setPinError(undefined);
        }}
        isLoading={isPaymentProcessing}
        error={pinError}
        returnRoute="/smile"
        onBiometricPress={handleBiometricPress}
      />

      <LoadingOverlay
        visible={isPaymentProcessing}
        message="Processing your plan purchase..."
      />
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
    marginBottom: 12,
  },
  inputCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 6,
  },
  gridContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  balanceContainer: {
    marginRight: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  continueButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
