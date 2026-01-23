/**
 * Payment Flow State Machine
 * Defines valid states and transitions for the purchase flow
 * Per PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md Section 8
 */

/**
 * All possible states in the purchase flow
 */
export type PurchaseFlowStep =
  | "idle" // No purchase active
  | "checkout" // User reviewing product and amount
  | "processing-biometric" // Attempting biometric authentication
  | "processing-pin" // PIN entry modal shown
  | "processing-transaction" // API call in progress
  | "success" // Transaction succeeded
  | "failed"; // Transaction failed

/**
 * Valid state transitions
 * Maps current state to allowed next states
 */
export const PurchaseFlowTransitions: Record<PurchaseFlowStep, PurchaseFlowStep[]> =
  {
    idle: ["checkout"],
    checkout: ["idle", "processing-biometric", "processing-pin"],
    "processing-biometric": ["processing-transaction", "processing-pin", "idle"],
    "processing-pin": ["processing-transaction", "idle"],
    "processing-transaction": ["success", "failed"],
    success: ["idle"],
    failed: ["checkout", "idle"],
  };

/**
 * Verify if a state transition is valid
 */
export function isValidTransition(
  from: PurchaseFlowStep,
  to: PurchaseFlowStep
): boolean {
  const allowed = PurchaseFlowTransitions[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Complete state for a purchase flow
 */
export interface PurchaseFlowState {
  // Current step
  step: PurchaseFlowStep;

  // Selected product and amount
  selectedProduct: any | null;
  recipientPhone: string;
  amount: number;

  // Price details
  priceDetails: {
    faceValue: number;
    supplierCost: number;
    markup: number;
    sellingPrice: number;
    cashbackUsed: number;
    payableAmount: number;
    bonusToEarn: number;
  } | null;

  // Cashback settings
  useCashback: boolean;

  // User balance and cashback
  walletBalance: number;
  cashbackBalance: number;

  // Result
  transactionId: string | null;
  errorMessage: string | null;
  successMessage: string | null;

  // Loading
  isLoading: boolean;
}

/**
 * Initial state
 */
export const initialPurchaseFlowState: PurchaseFlowState = {
  step: "idle",
  selectedProduct: null,
  recipientPhone: "",
  amount: 0,
  priceDetails: null,
  useCashback: false,
  walletBalance: 0,
  cashbackBalance: 0,
  transactionId: null,
  errorMessage: null,
  successMessage: null,
  isLoading: false,
};

/**
 * Helper to transition state safely
 * Returns null if transition is invalid
 */
export function transitionState(
  currentState: PurchaseFlowState,
  nextStep: PurchaseFlowStep
): PurchaseFlowState | null {
  if (!isValidTransition(currentState.step, nextStep)) {
    console.warn(
      `[PurchaseFlow] Invalid transition: ${currentState.step} → ${nextStep}`
    );
    return null;
  }

  return {
    ...currentState,
    step: nextStep,
    isLoading: nextStep.includes("processing"),
  };
}

/**
 * Reset to initial state
 */
export function resetPurchaseFlow(
  currentState: PurchaseFlowState
): PurchaseFlowState {
  return {
    ...initialPurchaseFlowState,
    walletBalance: currentState.walletBalance,
    cashbackBalance: currentState.cashbackBalance,
  };
}

/**
 * Update purchase details
 */
export function updatePurchaseDetails(
  currentState: PurchaseFlowState,
  details: Partial<PurchaseFlowState>
): PurchaseFlowState {
  return {
    ...currentState,
    ...details,
  };
}

/**
 * Set error state
 */
export function setError(
  currentState: PurchaseFlowState,
  errorMessage: string
): PurchaseFlowState {
  return {
    ...currentState,
    step: "failed",
    errorMessage,
    isLoading: false,
  };
}

/**
 * Set success state
 */
export function setSuccess(
  currentState: PurchaseFlowState,
  transactionId: string,
  successMessage: string
): PurchaseFlowState {
  return {
    ...currentState,
    step: "success",
    transactionId,
    successMessage,
    isLoading: false,
    errorMessage: null,
  };
}

/**
 * Get human-readable step label
 */
export function getStepLabel(step: PurchaseFlowStep): string {
  const labels: Record<PurchaseFlowStep, string> = {
    idle: "Ready",
    checkout: "Review & Confirm",
    "processing-biometric": "Biometric Verification",
    "processing-pin": "PIN Entry",
    "processing-transaction": "Processing Payment",
    success: "Success",
    failed: "Failed",
  };
  return labels[step];
}
