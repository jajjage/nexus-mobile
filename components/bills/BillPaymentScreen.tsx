import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  GraduationCap,
  RefreshCw,
  Tv,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PinPadModal } from "@/components/security/PinPadModal";
import { designTokens } from "@/constants/palette";
import { useTheme } from "@/context/ThemeContext";
import {
  useBillPaymentFlow,
  useBillVariations,
  useBillers,
  useValidateBillCustomer,
} from "@/hooks/useBillPayments";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { BillCategoryType, Biller, BillVariation } from "@/types/bill-payment.types";
import { getUserFriendlyError } from "@/utils/errors";

type MeterType = "prepaid" | "postpaid";
type SubscriptionType = "change" | "renew";

interface BillPaymentScreenProps {
  categoryType: BillCategoryType;
}

const formatMoney = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export function BillPaymentScreen({ categoryType }: BillPaymentScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const checkoutSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["58%"], []);

  const isElectricity = categoryType === "electricity";
  const isEducation = categoryType === "education";
  const title = isElectricity ? "Electricity" : isEducation ? "Exam Pins" : "Cable TV";
  const Icon = isElectricity ? Zap : isEducation ? GraduationCap : Tv;

  const [selectedBillerCode, setSelectedBillerCode] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [meterType, setMeterType] = useState<MeterType>("prepaid");
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>("change");
  const [variationCode, setVariationCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [minimumAmount, setMinimumAmount] = useState<number | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<"checkout" | "success" | "failed">(
    "checkout"
  );
  const [isVariationPickerOpen, setIsVariationPickerOpen] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | undefined>();
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);

  const { balance: walletBalance } = useWalletBalance();
  const { data: billers = [], isLoading: billersLoading } = useBillers(categoryType);
  const selectedBiller = useMemo(
    () => billers.find(biller => biller.code === selectedBillerCode),
    [billers, selectedBillerCode]
  );
  const {
    data: variations = [],
    isLoading: variationsLoading,
  } = useBillVariations(
    selectedBillerCode,
    Boolean(
      selectedBillerCode &&
        ((isEducation || !isElectricity) && selectedBiller?.supportsVariations)
    )
  );
  const validateCustomer = useValidateBillCustomer();
  const { processPayment, submitPIN, isLoading: isPaymentProcessing } =
    useBillPaymentFlow({
      onSuccess: (transactionId, _paymentId, payment) => {
        setLastTransactionId(transactionId);
        const tokenPayload = payment.tokenPayload || {};
        const token =
          tokenPayload.token ||
          tokenPayload.pin ||
          tokenPayload.Pin ||
          tokenPayload.Token ||
          tokenPayload.meter_token ||
          tokenPayload.purchased_code ||
          (Array.isArray(tokenPayload.tokens) ? tokenPayload.tokens.join(", ") : null) ||
          (Array.isArray(tokenPayload.cards)
            ? tokenPayload.cards
                .map((card: any) => `${card.Serial || card.serial}: ${card.Pin || card.pin}`)
                .join(", ")
            : null);
        setLastToken(token ? String(token) : null);
        setLastErrorMessage(null);
        setCheckoutMode("success");
        checkoutSheetRef.current?.expand();
      },
      onError: (error) => {
        setLastErrorMessage(getUserFriendlyError(error));
        setCheckoutMode("failed");
        checkoutSheetRef.current?.expand();
      },
    });

  useEffect(() => {
    if (!selectedBillerCode && billers.length > 0) {
      setSelectedBillerCode(billers[0].code);
    }
  }, [billers, selectedBillerCode]);

  useEffect(() => {
    setCustomerName(null);
    setMinimumAmount(null);
    setVariationCode("");
    setAmount("");
    setIsVariationPickerOpen(false);
  }, [selectedBillerCode, subscriptionType]);

  useEffect(() => {
    if (
      (isEducation || (!isElectricity && subscriptionType === "change")) &&
      variations.length > 0
    ) {
      const firstFixed = variations.find(variation => variation.amount);
      if (firstFixed) {
        setVariationCode(firstFixed.code);
        const unitAmount = Number(firstFixed.amount || 0);
        const multiplier = isEducation ? Math.max(Number(quantity) || 1, 1) : 1;
        setAmount(String(unitAmount * multiplier || ""));
      }
    }
  }, [isEducation, isElectricity, quantity, subscriptionType, variations]);

  const selectedVariation = useMemo(
    () => variations.find(variation => variation.code === variationCode),
    [variations, variationCode]
  );

  const numericAmount = Number.parseFloat(amount.replace(/[^0-9.]/g, "") || "0");
  const numericQuantity = Math.max(Number.parseInt(quantity, 10) || 1, 1);
  const isJamb = isEducation && selectedBiller?.code === "jamb";
  const requiresValidation = !isEducation || isJamb;
  const isAmountValid =
    numericAmount > 0 && (!minimumAmount || numericAmount >= minimumAmount);
  const customerLabel = isElectricity
    ? "Meter number"
    : isEducation
      ? "JAMB profile ID"
      : "Smartcard or IUC number";
  const selectedBillerName = selectedBiller?.name || title;
  const canValidate =
    Boolean(selectedBillerCode && customerIdentifier.trim()) &&
    (!isEducation || isJamb) &&
    (isElectricity || isEducation || Boolean(subscriptionType));
  const canPay =
    (requiresValidation ? canValidate : Boolean(selectedBillerCode)) &&
    Boolean(phone.trim()) &&
    isAmountValid &&
    Boolean(!requiresValidation || customerName || selectedBiller?.requiresValidation === false) &&
    (isElectricity ||
      isEducation ||
      subscriptionType === "renew" ||
      Boolean(variationCode)) &&
    (!isEducation || Boolean(variationCode));

  const runValidation = useCallback(async () => {
    if (!canValidate) return;
    Haptics.selectionAsync();

    try {
      const response = await validateCustomer.mutateAsync({
        billerCode: selectedBillerCode,
        customerIdentifier: customerIdentifier.trim(),
        meterType: isElectricity ? meterType : undefined,
        variationCode: isEducation ? variationCode : undefined,
      });

      if (!response.data.isValid) {
        setCustomerName(null);
        setLastErrorMessage("We could not verify this customer details.");
        return;
      }

      setCustomerName(response.data.customerName || "Verified customer");
      setMinimumAmount(response.data.minimumAmount ?? null);

      if (!isElectricity && subscriptionType === "renew" && response.data.renewalAmount) {
        setAmount(String(response.data.renewalAmount));
      }
    } catch (error: any) {
      setCustomerName(null);
      setLastErrorMessage(
        getUserFriendlyError(error.response?.data?.message || error.message)
      );
    }
  }, [
    canValidate,
    customerIdentifier,
    isElectricity,
    meterType,
    selectedBillerCode,
    subscriptionType,
    validateCustomer,
  ]);

  const openCheckout = useCallback(() => {
    if (!canPay) return;
    setCheckoutMode("checkout");
    setLastErrorMessage(null);
    checkoutSheetRef.current?.expand();
  }, [canPay]);

  const buildPaymentData = useCallback(
    () => ({
      billerCode: selectedBillerCode,
      customerIdentifier: isEducation && !isJamb ? phone.trim() : customerIdentifier.trim(),
      meterType: isElectricity ? meterType : undefined,
      amount: numericAmount,
      quantity: isEducation ? numericQuantity : undefined,
      phone: phone.trim(),
      variationCode:
        isEducation || (!isElectricity && subscriptionType === "change")
          ? variationCode
          : undefined,
      subscriptionType: isElectricity || isEducation ? undefined : subscriptionType,
      idempotencyKey: `mobile-${categoryType}-${Date.now()}`,
    }),
    [
      categoryType,
      customerIdentifier,
      isElectricity,
      isEducation,
      isJamb,
      meterType,
      numericAmount,
      numericQuantity,
      phone,
      selectedBillerCode,
      subscriptionType,
      variationCode,
    ]
  );

  const handleConfirmPayment = useCallback(async () => {
    const paymentData = buildPaymentData();
    checkoutSheetRef.current?.close();

    const result = await processPayment(paymentData);
    if (result.success) {
      return;
    }

    if (result.error?.toLowerCase().includes("pin")) {
      setPendingPaymentData(paymentData);
      setTimeout(() => setShowPinModal(true), 450);
      return;
    }

    setLastErrorMessage(getUserFriendlyError(result.error || ""));
    setCheckoutMode("failed");
    checkoutSheetRef.current?.expand();
  }, [buildPaymentData, processPayment]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pendingPaymentData) return;
      setPinError(undefined);

      const result = await submitPIN({ ...pendingPaymentData, pin });
      if (!result.success) {
        setPinError(getUserFriendlyError(result.error || ""));
      }
    },
    [pendingPaymentData, submitPIN]
  );

  const handleVariationSelect = (variation: BillVariation) => {
    Haptics.selectionAsync();
    setVariationCode(variation.code);
    setIsVariationPickerOpen(false);
    if (variation.amount) {
      const multiplier = isEducation ? numericQuantity : 1;
      setAmount(String(Number(variation.amount) * multiplier));
    }
  };

  const renderBillerSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {isElectricity ? "Electricity provider" : isEducation ? "Exam provider" : "Cable provider"}
      </Text>
      {billersLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {billers.map((biller: Biller) => {
              const active = biller.code === selectedBillerCode;
              return (
                <Pressable
                  key={biller.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedBillerCode(biller.code);
                  }}
                  style={[
                    styles.billerChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.billerChipText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {biller.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderConfirmationContent = () => {
    if (checkoutMode === "success") {
      return (
        <View style={styles.sheetContent}>
          <CheckCircle size={52} color={colors.success} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Payment Submitted
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {selectedBillerName} payment for {customerIdentifier}
          </Text>
          <View style={[styles.receiptCard, { backgroundColor: colors.muted }]}>
            <Text style={[styles.receiptAmount, { color: colors.success }]}>
              {formatMoney(numericAmount)}
            </Text>
            {lastTransactionId && (
              <Text style={[styles.receiptRef, { color: colors.textTertiary }]}>
                Ref: {lastTransactionId}
              </Text>
            )}
            {lastToken && (
              <Text style={[styles.receiptRef, { color: colors.foreground }]}>
                Token: {lastToken}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              checkoutSheetRef.current?.close();
              router.back();
            }}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (checkoutMode === "failed") {
      return (
        <View style={styles.sheetContent}>
          <RefreshCw size={48} color={colors.destructive} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Payment Failed
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {lastErrorMessage || "Please check the details and try again."}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setCheckoutMode("checkout")}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const insufficientBalance = numericAmount > walletBalance;

    return (
      <View style={styles.sheetContent}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
          Confirm Payment
        </Text>
        <Text style={[styles.sheetAmount, { color: colors.foreground }]}>
          {formatMoney(numericAmount)}
        </Text>

        <View style={styles.detailsList}>
          <Detail label="Biller" value={selectedBillerName} />
          {(!isEducation || isJamb) && (
            <Detail label={customerLabel} value={customerIdentifier} />
          )}
          {requiresValidation && (
            <Detail label="Customer" value={customerName || "Verified"} />
          )}
          <Detail label="Phone" value={phone} />
          {(isEducation || (!isElectricity && subscriptionType === "change")) && (
            <Detail
              label={isEducation ? "Exam type" : "Bouquet"}
              value={selectedVariation?.name || variationCode}
            />
          )}
          {isEducation && (
            <Detail label="Quantity" value={String(numericQuantity)} />
          )}
          <Detail label="Wallet balance" value={formatMoney(walletBalance)} />
        </View>

        {insufficientBalance && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Insufficient balance. Please add funds.
          </Text>
        )}

        <TouchableOpacity
          disabled={insufficientBalance || isPaymentProcessing}
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                insufficientBalance || isPaymentProcessing
                  ? colors.muted
                  : colors.primary,
            },
          ]}
          onPress={handleConfirmPayment}
        >
          {isPaymentProcessing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Pay {formatMoney(numericAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: isDark ? colors.background : "#EFF1F2" },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <ArrowLeft size={22} color={colors.foreground} />
            </Pressable>
            <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Icon size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pay from your wallet instantly
              </Text>
            </View>
          </View>

          {renderBillerSelector()}

          {!isElectricity && !isEducation && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Payment type
              </Text>
              <View style={styles.segmented}>
                {(["change", "renew"] as SubscriptionType[]).map(type => {
                  const active = subscriptionType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setSubscriptionType(type)}
                      style={[
                        styles.segment,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: active ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {type === "change" ? "Change bouquet" : "Renew"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {isElectricity && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Meter type
              </Text>
              <View style={styles.segmented}>
                {(["prepaid", "postpaid"] as MeterType[]).map(type => {
                  const active = meterType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setMeterType(type)}
                      style={[
                        styles.segment,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: active ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {type[0].toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {(!isEducation || isJamb) && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {customerLabel}
              </Text>
              <TextInput
                value={customerIdentifier}
                onChangeText={setCustomerIdentifier}
                keyboardType="number-pad"
                placeholder={customerLabel}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          )}

          {requiresValidation && (
            <TouchableOpacity
              disabled={!canValidate || validateCustomer.isPending}
              onPress={runValidation}
              style={[
                styles.verifyButton,
                {
                  backgroundColor: canValidate ? `${colors.primary}18` : colors.muted,
                  borderColor: canValidate ? colors.primary : colors.border,
                },
              ]}
            >
              {validateCustomer.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.verifyText, { color: colors.primary }]}>
                  {isEducation ? "Verify profile" : "Verify customer"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {customerName && (
            <View style={[styles.verifiedCard, { backgroundColor: `${colors.success}12` }]}>
              <CheckCircle size={18} color={colors.success} />
              <View style={styles.verifiedTextWrap}>
                <Text style={[styles.verifiedTitle, { color: colors.foreground }]}>
                  {customerName}
                </Text>
                {minimumAmount ? (
                  <Text style={[styles.verifiedSub, { color: colors.textSecondary }]}>
                    Minimum amount: {formatMoney(minimumAmount)}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {(isEducation || (!isElectricity && subscriptionType === "change")) && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {isEducation ? "Exam type" : "Bouquet"}
              </Text>
              {variationsLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.variationList}>
                  <Pressable
                    onPress={() => setIsVariationPickerOpen(open => !open)}
                    style={[
                      styles.variationCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isVariationPickerOpen ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.variationTextWrap}>
                      <Text style={[styles.variationName, { color: colors.foreground }]}>
                        {selectedVariation?.name || `Select ${isEducation ? "exam type" : "bouquet"}`}
                      </Text>
                      {selectedVariation?.amount ? (
                        <Text style={[styles.variationAmount, { color: colors.textSecondary }]}>
                          {formatMoney(Number(selectedVariation.amount))}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronDown
                      size={18}
                      color={isVariationPickerOpen ? colors.primary : colors.textTertiary}
                      style={{ transform: [{ rotate: isVariationPickerOpen ? "180deg" : "0deg" }] }}
                    />
                  </Pressable>

                  {isVariationPickerOpen &&
                    variations.map(variation => {
                      const active = variation.code === variationCode;
                      return (
                        <Pressable
                          key={variation.id}
                          onPress={() => handleVariationSelect(variation)}
                          style={[
                            styles.variationOption,
                            {
                              backgroundColor: active ? `${colors.primary}12` : colors.card,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <View style={styles.variationTextWrap}>
                            <Text style={[styles.variationName, { color: colors.foreground }]}>
                              {variation.name}
                            </Text>
                            {variation.amount ? (
                              <Text style={[styles.variationAmount, { color: colors.textSecondary }]}>
                                {formatMoney(Number(variation.amount))}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                </View>
              )}
            </View>
          )}

          {isEducation && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Quantity
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              editable={!(selectedVariation?.isFixedPrice && Boolean(selectedVariation.amount))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity:
                    selectedVariation?.isFixedPrice && selectedVariation.amount ? 0.8 : 1,
                },
              ]}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="08012345678"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          {lastErrorMessage && !customerName && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {lastErrorMessage}
            </Text>
          )}

          <TouchableOpacity
            disabled={!canPay}
            onPress={openCheckout}
            style={[
              styles.payButton,
              {
                backgroundColor: canPay ? colors.primary : colors.muted,
              },
            ]}
          >
            <Text
              style={[
                styles.payButtonText,
                { color: canPay ? colors.primaryForeground : colors.textDisabled },
              ]}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        ref={checkoutSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        onClose={() => setLastToken(null)}
      >
        <BottomSheetView style={styles.sheetView}>
          {renderConfirmationContent()}
        </BottomSheetView>
      </BottomSheet>

      <PinPadModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        isLoading={isPaymentProcessing}
        error={pinError}
        title="Authorize Payment"
        subtitle={`Enter your PIN to pay ${formatMoney(numericAmount)}`}
        returnRoute={`/${categoryType}`}
      />

      <LoadingOverlay visible={isPaymentProcessing && !showPinModal} />
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  billerChip: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  billerChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  verifyButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyText: {
    fontSize: 14,
    fontWeight: "800",
  },
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  verifiedTextWrap: { flex: 1 },
  verifiedTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  verifiedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  variationList: {
    gap: 8,
  },
  variationCard: {
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variationOption: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  variationTextWrap: { flex: 1, paddingRight: 10 },
  variationName: {
    fontSize: 14,
    fontWeight: "700",
  },
  variationAmount: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  payButton: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  sheetView: {
    flex: 0,
  },
  sheetContent: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md,
    alignItems: "center",
    gap: 10,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sheetAmount: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  detailsList: {
    width: "100%",
    gap: 10,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  detailLabel: {
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  receiptCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  receiptAmount: {
    fontSize: 28,
    fontWeight: "900",
  },
  receiptRef: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
