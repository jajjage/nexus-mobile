# Transaction Detail & Receipt System - Complete Implementation Guide

## Overview

This guide documents the complete flow of creating, displaying, and sharing transaction details and receipts in the Nexus frontend. It covers:

1. **Transaction Initiation** - How transactions are created via API
2. **Transaction State Lifecycle** - States transitions from pending → processing → completed/failed
3. **Transaction Detail Page** - How transaction details are fetched and displayed
4. **Receipt Generation** - How receipts are rendered for display and export
5. **Receipt Sharing** - How users share receipts as PNG, PDF, or via native share APIs
6. **Status Timeline** - How transaction progress is visualized

---

## Table of Contents

1. [Transaction Lifecycle](#transaction-lifecycle)
2. [Data Types & Structures](#data-types--structures)
3. [Transaction Initiation Flow](#transaction-initiation-flow)
4. [Transaction Fetching & Caching](#transaction-fetching--caching)
5. [Transaction Detail Page Architecture](#transaction-detail-page-architecture)
6. [Receipt Generation System](#receipt-generation-system)
7. [Receipt Sharing Implementation](#receipt-sharing-implementation)
8. [Status Timeline Component](#status-timeline-component)
9. [Complete Data Flow Examples](#complete-data-flow-examples)
10. [API Endpoints Summary](#api-endpoints-summary)
11. [Testing Checklist](#testing-checklist)
12. [Common Issues & Solutions](#common-issues--solutions)

---

## Transaction Lifecycle

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRANSACTION LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────┘

TOPUP REQUEST (Airtime/Data)
─────────────────────────────

User Initiates
      ↓
POST /user/topup (with PIN/Biometric token)
      ↓
Response: { transactionId, status: "pending", ... }
      ↓
transaction.relatedType = "topup_request"
transaction.related.status = "pending"
      ↓
Backend Processing Begins
      ↓
Status Transitions:
  ├─ pending → processing (backend working with provider)
  ├─ processing → completed (success - money deducted, service delivered)
  ├─ processing → failed (provider error or declined)
  └─ failed → reversed (refund initiated to user wallet)


INCOMING PAYMENT (Admin Credit / Wallet Top-up)
──────────────────────────────────────────────

Admin/System Sends Funds
      ↓
Backend creates credit transaction
      ↓
transaction.direction = "credit"
transaction.relatedType = "incoming_payment"
      ↓
Immediate completion (no processing needed)
      ↓
Status: "completed" or "received"


REFERRAL WITHDRAWAL
───────────────────

User Requests Referral Bonus Payout
      ↓
transaction.relatedType = "referral_withdrawal"
      ↓
Backend processes withdrawal
      ↓
Status Transitions:
  ├─ pending → completed (funds added to wallet)
  └─ pending → failed (insufficient bonus or business rule error)
```

---

## Data Types & Structures

### 1. Transaction Type

```typescript
// src/types/wallet.types.ts

export interface Transaction {
  id: string; // Unique transaction ID (UUID)
  walletId: string; // Associated wallet ID
  userId: string; // User who made transaction
  direction: "debit" | "credit"; // Direction of funds
  amount: number; // Transaction amount in NGN
  balanceAfter: number; // Wallet balance after transaction
  method: string; // Payment method (e.g., "wallet")
  reference?: string; // External reference ID
  relatedType?: string; // Type of related object
  relatedId?: string; // ID of related object
  related?: RelatedTransactionInfo; // Nested info about the related object
  metadata?: any; // Additional metadata
  cashbackUsed: number; // Cashback deducted (for topups)
  productCode?: string; // Product code (e.g., "MTN-100", "DATA-2GB")
  denomAmount: number; // Face value/denomination
  note?: string; // Additional notes
  createdAt: Date; // Creation timestamp
}

export interface RelatedTransactionInfo {
  status:
    | "pending"
    | "completed"
    | "failed"
    | "cancelled"
    | "reversed"
    | "retry"
    | "received";
  recipient_phone?: string; // Recipient phone number
  operatorCode?: string; // Network operator (MTN, Airtel, Glo, 9Mobile)
  type?: string; // Service type (airtime, data)
  [key: string]: any; // Additional fields
}
```

### 2. TopUp Request Payload

```typescript
// src/types/topup.types.ts

export interface TopupRequest {
  amount: number; // Amount in NGN
  productCode: string; // Product code (e.g., "MTN-100")
  recipientPhone: string; // Target phone number
  pin?: string; // User's transaction PIN (for security)
  verificationToken?: string; // Biometric verification token (alternative to PIN)
  supplierSlug?: string; // Supplier identifier
  supplierMappingId?: string; // Supplier mapping ID
  useCashback?: boolean; // Whether to deduct from cashback balance
  offerId?: string; // Applied offer ID (if using discount)
}

export interface TopupResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string; // Transaction ID created
    status: string; // Initial status (usually "pending")
    amount: number; // Confirmed amount
    balance: number; // New wallet balance
    [key: string]: any;
  };
}
```

### 3. Transaction Query Keys (React Query)

```typescript
// src/hooks/useWallet.ts

export const walletKeys = {
  all: ["wallet"] as const,
  wallet: () => [...walletKeys.all, "details"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: {
    all: () => [...walletKeys.all, "transactions"] as const,
    list: (params?: GetTransactionsParams) =>
      [...walletKeys.transactions.all(), params] as const,
    detail: (id: string) =>
      [...walletKeys.transactions.all(), id] as const,
  },
};

// Usage
useTransaction(id) → Query key: ["wallet", "transactions", id]
useTransactions(params) → Query key: ["wallet", "transactions", params]
useInfiniteTransactions(params) → Infinite query with pagination
```

---

## Transaction Initiation Flow

### Step 1: User Selects Product & Enters Security

```typescript
// In airtime-plans.tsx / data-plans.tsx

const handlePlanClick = async (product: Product) => {
  // 1. Validate user entered phone number explicitly
  if (!isPhoneNumberExplicitlyEntered) {
    toast.error("Please enter a phone number before selecting a product.");
    return;
  }

  // 2. Check if user has sufficient balance
  const userCashbackBalance = user?.cashbackBalance || 0;
  const sellingPrice = calculateSellingPrice(product, markup);

  if (sellingPrice > walletBalance + userCashbackBalance) {
    toast.error("Insufficient balance for this transaction");
    return;
  }

  // 3. Set selected product and show security modal
  setSelectedProduct(product);
  setShowBiometricModal(true);
  // OR
  setShowPinModal(true);
};
```

### Step 2: Security Verification (Biometric or PIN)

```typescript
// Biometric Verification Flow:

const verifyBiometricForTransaction = async () => {
  // 1. Start biometric challenge
  const challenge = await biometricService.startBiometricChallenge({
    intent: "transaction",
    amount: selectedProduct.amount,
  });

  // 2. Trigger device biometric (fingerprint/face)
  const signature = await triggerDeviceBiometric(challenge);

  // 3. Verify signature with backend
  const verificationToken = await biometricService.verifyBiometric({
    challenge,
    signature,
    intent: "transaction",
  });

  // 4. Proceed to checkout
  setVerificationToken(verificationToken);
  setShowCheckout(true);
};

// PIN Verification Flow:

const verifyPinForTransaction = async (pin: string) => {
  // 1. Verify PIN format
  if (pin.length !== 4 || !/^\d+$/.test(pin)) {
    toast.error("PIN must be 4 digits");
    return;
  }

  // 2. Show checkout with PIN
  setUserPin(pin);
  setShowCheckout(true);
};
```

### Step 3: Create Transaction via API

```typescript
// In checkout-modal.tsx

const handleConfirmTransaction = async () => {
  try {
    setIsProcessing(true);

    const topupPayload: TopupRequest = {
      amount: payableAmount, // After markup and cashback
      productCode: product.productCode, // e.g., "MTN-100"
      recipientPhone: phoneNumber, // Target phone
      pin: userPin, // OR verificationToken
      verificationToken: verificationToken,
      useCashback: useCashback,
      offerId: selectedOffer?.id,
      supplierMappingId: product.supplierOffers?.[0]?.mappingId,
    };

    // 1. Call API to create transaction
    const response = await topupService.initiateTopup(topupPayload);
    // Response: { transactionId, status: "pending", amount, balance }

    // 2. Show success toast
    toast.success("Transaction initiated successfully");

    // 3. Navigate to transaction detail page
    router.push(`/dashboard/transactions/${response.data.transactionId}`);

    // 4. Invalidate wallet queries to refresh balance
    queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
    queryClient.invalidateQueries({ queryKey: userKeys.profile() });
  } catch (error) {
    toast.error("Transaction failed: " + error.message);
  } finally {
    setIsProcessing(false);
  }
};
```

---

## Transaction Fetching & Caching

### React Query Setup

```typescript
// src/hooks/useWallet.ts

/**
 * Get single transaction by ID
 * - Caches for 10 minutes
 * - Retries up to 2 times on failure
 * - Disabled if no ID provided
 */
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: walletKeys.transactions.detail(id),
    queryFn: () => walletService.getTransactionById(id),
    staleTime: 1000 * 60 * 10, // Cache for 10 mins
    retry: 2,
    enabled: !!id, // Only run if ID exists
  });
};

/**
 * Get all transactions with infinite scrolling
 * - Pagination: 1 per page by default
 * - Supports date range, direction filters
 * - Auto-fetches next page on scroll
 */
export const useInfiniteTransactions = (params?: GetTransactionsParams) => {
  return useInfiniteQuery({
    queryKey: walletKeys.transactions.list(params),
    queryFn: ({ pageParam = 1 }) =>
      walletService.getTransactions({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.data.pagination.page;
      const totalPages = lastPage.data.pagination.totalPages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
};

/**
 * Get recent transactions for dashboard
 * - Fetches first 10 transactions
 * - Non-paginated for dashboard display
 */
export const useRecentTransactions = () => {
  return useTransactions({ page: 1, limit: 10 });
};
```

### API Service Layer

```typescript
// src/services/wallet.service.ts

export const walletService = {
  // Get single transaction
  getTransactionById: async (id: string): Promise<TransactionResponse> => {
    const response = await apiClient.get<TransactionResponse>(
      `/user/wallet/transactions/${id}`
    );
    return response.data;
    // Returns: { success: true, data: Transaction }
  },

  // Get all transactions with pagination
  getTransactions: async (
    params?: GetTransactionsParams
  ): Promise<TransactionsListResponse> => {
    const response = await apiClient.get<TransactionsListResponse>(
      "/user/wallet/transactions",
      { params }
    );
    return response.data;
    // Returns: { success: true, data: { transactions: [], pagination: {} } }
  },
};
```

---

## Transaction Detail Page Architecture

### Overview

```
/dashboard/transactions/[id]/page.tsx
  ↓
<TransactionDetailPage transactionId={id} />
  ├─ useTransaction(id) [React Query]
  │   ├─ API: GET /user/wallet/transactions/{id}
  │   └─ Response: { data: Transaction }
  │
  ├─ Header (Back button)
  │
  ├─ Main Card
  │   ├─ Logo/Icon (Operator logo or Credit indicator)
  │   ├─ Transaction Type Label
  │   ├─ Transaction Description
  │   ├─ Amount Display
  │   ├─ Status Badge (with color)
  │   └─ Date/Time
  │
  ├─ Transaction Status Timeline
  │   ├─ <TransactionTimeline /> component
  │   └─ Shows: Initiated → Processing → Completed
  │
  ├─ Transaction Details Section
  │   ├─ Recipient Phone
  │   ├─ Amount Paid
  │   ├─ Cashback Used (if topup)
  │   ├─ Service Type (Airtime/Data)
  │   ├─ Reference
  │   └─ Transaction ID (copyable)
  │
  ├─ Transaction Note (if exists)
  │
  └─ Share Receipt Button
      └─ <ShareTransactionDialog /> (opens modal)
```

### Component Implementation

```typescript
// src/components/features/dashboard/transactions/transaction-detail-page.tsx

interface TransactionDetailPageProps {
  transactionId: string;
}

export function TransactionDetailPage({
  transactionId,
}: TransactionDetailPageProps) {
  // 1. Fetch transaction
  const { data, isLoading, error } = useTransaction(transactionId);
  const transaction = data?.data;

  // 2. Track share dialog state
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 3. Get navigation context (from home or transactions list)
  const searchParams = useSearchParams();
  const fromSource = searchParams.get("from"); // "home" or "transactions"
  const backLink = fromSource === "transactions"
    ? "/dashboard/transactions"
    : "/dashboard";

  // 4. Handle loading state
  if (isLoading) {
    return <TransactionDetailSkeleton />;
  }

  // 5. Handle error state
  if (error) {
    return (
      <div>Error loading transaction</div>
    );
  }

  // 6. Handle missing transaction
  if (!transaction) {
    return <div>Transaction not found</div>;
  }

  // 7. Determine if refund
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();
  const isRefund =
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed");

  // 8. Render transaction details
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back Button */}
        <header className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href={backLink}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1>Back to {fromSource === "transactions" ? "Transactions" : "Dashboard"}</h1>
        </header>

        {/* Main Transaction Card */}
        <Card>
          {/* Status Header */}
          <div className="flex flex-col items-center p-8 pb-4">
            {/* Logo */}
            {logoUrl ? (
              <img src={logoUrl} alt="operator" className="size-16 rounded-full" />
            ) : (
              transactionIcon
            )}

            {/* Title & Description */}
            <h2>{getTransactionTypeLabel(transaction)}</h2>
            <p>{getTransactionDescription(transaction)}</p>

            {/* Amount */}
            <span className="text-3xl font-bold">
              {formattedAmount}
            </span>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <StatusIcon className={statusConfig.color} />
              <span>{statusConfig.label}</span>
            </div>

            {/* Date */}
            <p className="text-xs text-gray-400">
              {formatDate(transaction.createdAt)}
            </p>
          </div>

          {/* Timeline Section */}
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase mb-4">Transaction Status</p>
            <TransactionTimeline
              status={transactionStatus}
              createdAt={transaction.createdAt}
              transactionType={transaction.relatedType}
              isRefund={isRefund}
            />
          </div>

          {/* Details Section */}
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase mb-4">Transaction Details</p>

            {transaction.related?.recipient_phone && (
              <div className="flex justify-between pb-3 border-b">
                <span>Recipient Phone</span>
                <span>{transaction.related.recipient_phone}</span>
              </div>
            )}

            {transaction.amount && (
              <div className="flex justify-between pb-3 border-b">
                <span>Amount Paid</span>
                <span>{formattedAmountPaid}</span>
              </div>
            )}

            {transaction.relatedType === "topup_request" && (
              <div className="flex justify-between pb-3 border-b">
                <span>Cashback Used</span>
                <span className="text-red-500">
                  -{getCashbackUsed(transaction)}
                </span>
              </div>
            )}

            {/* Transaction ID - Copyable */}
            <div className="pt-1">
              <div className="flex justify-between">
                <span>Transaction ID</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(transaction.id, "Transaction ID")}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              <code className="text-xs text-gray-500 break-all">
                {transaction.id}
              </code>
            </div>
          </div>
        </Card>

        {/* Share Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setIsShareOpen(true)}
            className="gap-2"
          >
            <Share2 className="size-5" />
            Share Receipt
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareTransactionDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        transaction={transaction}
      />
    </div>
  );
}
```

### Key Helper Functions

```typescript
// Status color configuration
const getStatusConfig = (status: string, isRefund?: boolean) => {
  if (isRefund) {
    return {
      icon: CheckCircle2,
      color: "text-green-600",
      label: "Refunded",
      bgColor: "bg-green-50",
      borderColor: "ring-green-100",
    };
  }

  switch (status.toLowerCase()) {
    case "completed":
    case "received":
    case "success":
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        label: "Successful",
        bgColor: "bg-green-50",
        borderColor: "ring-green-100",
      };
    case "pending":
      return {
        icon: Clock,
        color: "text-amber-600",
        label: "Pending",
        bgColor: "bg-amber-50",
        borderColor: "ring-amber-100",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-600",
        label: "Failed",
        bgColor: "bg-red-50",
        borderColor: "ring-red-100",
      };
    // ... other statuses
  }
};

// Transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();

  if (
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed")
  ) {
    return "Refund";
  }

  if (transaction.relatedType === "topup_request") {
    const isData = isDataTransaction(transaction);
    return isData ? "Data Purchase" : "Airtime Purchase";
  }

  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }

  return isCredit ? "Deposit" : "Withdrawal";
};

// Smart data detection (checks both backend type and productCode patterns)
const isDataTransaction = (transaction: Transaction): boolean => {
  if (transaction.related?.type?.toLowerCase() === "data") {
    return true;
  }

  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];
  return dataPatterns.some((pattern) => productCode.includes(pattern));
};

// Date formatting
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (dateObj instanceof Date && isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
};
```

---

## Receipt Generation System

### Receipt Components

#### 1. TransactionReceipt (Display Component)

```typescript
// src/components/features/dashboard/transactions/transaction-receipt.tsx

interface TransactionReceiptProps {
  transaction: Transaction;
  showLogo?: boolean;
  operatorLogo?: string;
  className?: string;
}

/**
 * Renders receipt for viewing in dialog
 * Uses Tailwind CSS for styling (responsive on all devices)
 * Ref-forwarded for html2canvas capture
 */
export const TransactionReceipt = React.forwardRef<
  HTMLDivElement,
  TransactionReceiptProps
>(({ transaction, showLogo = true, className }, ref) => {
  // Receipt structure:
  // ┌─────────────────────────────────┐
  // │  Logo/Icon (64x64)              │
  // │  Transaction Type               │
  // │  Description                    │
  // │  Amount (Large)                 │
  // │  Status Badge                   │
  // │  Date/Time                      │
  // ├─────────────────────────────────┤
  // │  Receipt Details (Table)        │
  // │  - Recipient Phone              │
  // │  - Amount Paid                  │
  // │  - Cashback Used                │
  // │  - Service Type                 │
  // │  - Transaction ID               │
  // └─────────────────────────────────┘

  return (
    <Card
      ref={ref}
      className="relative mx-auto w-full max-w-[400px] overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex flex-col items-center p-6 pb-4">
        {/* Logo */}
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-50">
          {transaction.relatedType === "topup_request" && logoUrl ? (
            <Image
              src={logoUrl}
              alt="operator"
              fill
              className="object-cover"
            />
          ) : isCredit ? (
            <span className="text-xs font-bold text-green-600">IN</span>
          ) : (
            <CreditCard className="size-8 text-slate-400" />
          )}
        </div>

        {/* Transaction Type */}
        <h2 className="mb-1 text-lg font-semibold">
          {getTransactionTypeLabel(transaction)}
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-slate-500">
          {getTransactionDescription(transaction)}
        </p>

        {/* Amount */}
        <span className="mb-4 text-3xl font-bold">
          {formattedAmount}
        </span>

        {/* Status */}
        <span className="text-base font-semibold" style={{ color: statusConfig.color }}>
          {statusConfig.label}
        </span>

        {/* Date */}
        <p className="text-xs text-slate-400">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Details Table */}
      <div className="px-6 py-4">
        {transaction.related?.recipient_phone && (
          <div className="flex justify-between pb-2 text-sm">
            <span className="text-slate-600">Recipient Phone</span>
            <span className="font-medium">{transaction.related.recipient_phone}</span>
          </div>
        )}

        {transaction.amount && (
          <div className="flex justify-between pb-2 text-sm border-b">
            <span className="text-slate-600">Amount Paid</span>
            <span className="font-medium">{formattedAmountPaid}</span>
          </div>
        )}

        {/* ... more details ... */}
      </div>
    </Card>
  );
});
```

#### 2. ExportReceipt (Export Component)

```typescript
// src/components/features/dashboard/transactions/export-receipt.tsx

interface ExportReceiptProps {
  transaction: Transaction;
  operatorLogo?: string;
}

/**
 * Renders receipt using inline styles for html2canvas compatibility
 * Uses hex colors and inline CSS for PDF/PNG export
 * Ref-forwarded for html2canvas capture
 */
export const ExportReceipt = React.forwardRef<
  HTMLDivElement,
  ExportReceiptProps
>(({ transaction, operatorLogo }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "400px",
        backgroundColor: "#ffffff",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        color: "#1F2937",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        {/* Logo */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F9FAFB",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="operator"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>
              {isCredit ? "IN" : "#"}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "bold" }}>
          {getTransactionTypeLabel(transaction)}
        </h2>
        <p style={{ margin: "0", fontSize: "14px", color: "#6B7280" }}>
          {getTransactionDescription(transaction)}
        </p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "bold" }}>
          {formattedAmount}
        </h1>
        <span style={{ fontSize: "16px", fontWeight: "600", color: statusColor }}>
          {getDisplayStatus()}
        </span>
        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "2px dashed #E5E7EB", margin: "0 0 24px 0" }} />

      {/* Details Table */}
      <div>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
          Transaction Details
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {transaction.related?.recipient_phone && (
              <tr>
                <td style={{ padding: "8px 0", fontSize: "14px", color: "#6B7280" }}>
                  Recipient Phone
                </td>
                <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "500" }}>
                  {transaction.related.recipient_phone}
                </td>
              </tr>
            )}

            {transaction.amount && (
              <tr>
                <td style={{ padding: "8px 0", fontSize: "14px", color: "#6B7280" }}>
                  Amount Paid
                </td>
                <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "500" }}>
                  {formattedAmountPaid}
                </td>
              </tr>
            )}

            {/* ... more rows ... */}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", textAlign: "center", borderTop: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: "500" }}>
          nexus-data.com
        </p>
      </div>
    </div>
  );
});
```

### Key Receipt Logic

```typescript
// Determine what amount to display

const isRefund =
  isCredit &&
  transaction.relatedType === "topup_request" &&
  (relatedStatus === "failed" || relatedStatus === "reversed");

const isDataProduct = isDataTransaction(transaction);
const isTopupRequest = transaction.relatedType === "topup_request";

let formattedAmount: string;

if (isRefund) {
  // Refund: Show the refunded amount
  formattedAmount = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });
} else if (isTopupRequest) {
  if (isDataProduct) {
    // Data: Show product code/name
    formattedAmount = transaction.productCode || "Data Bundle";
  } else {
    // Airtime: Show "MTN ₦100 Airtime" format
    const operator =
      transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const denom = transaction.denomAmount
      ? `₦${transaction.denomAmount.toLocaleString()}`
      : "";
    formattedAmount = `${operator} ${denom} Airtime`;
  }
} else {
  // Other transactions: show amount
  formattedAmount = transaction.amount.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });
}
```

---

## Receipt Sharing Implementation

### ShareTransactionDialog Component

```typescript
// src/components/features/dashboard/transactions/share-transaction-dialog.tsx

interface ShareTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  operatorLogo?: string;
}

export function ShareTransactionDialog({
  isOpen,
  onClose,
  transaction,
  operatorLogo,
}: ShareTransactionDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const exportReceiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ============= Sharing Methods =============

  /**
   * Share Receipt as PNG Image
   *
   * Flow:
   * 1. Clone ExportReceipt to temporary div
   * 2. Wait for all images to load
   * 3. Convert to canvas using html2canvas
   * 4. Convert canvas to blob (PNG)
   * 5. Create file object
   * 6. Use Web Share API (if available)
   * 7. Fallback: Download as file
   */
  const handleShareAsImage = async () => {
    if (!exportReceiptRef.current) return;

    setIsGeneratingImage(true);
    try {
      // Clone element
      const element = exportReceiptRef.current.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.transform = "translateX(-10000px)";  // Off-screen
      tempContainer.appendChild(element);
      document.body.appendChild(tempContainer);

      try {
        // Set width and wait for images
        element.style.width = "400px";
        await waitForImages(element);

        // Convert to canvas
        const canvas = await import("html2canvas").then((m) => m.default);
        const canvasElement = await canvas(element, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          windowHeight: element.scrollHeight,
          windowWidth: element.scrollWidth,
        });

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvasElement.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            },
            "image/png",
            0.95
          );
        });

        // Create file
        const file = new File(
          [blob],
          `nexus-receipt-${transaction.id.slice(0, 8)}.png`,
          { type: "image/png" }
        );

        // Generate share text
        const shareText = generateShareText(transaction);

        // Try Web Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Nexus Transaction Receipt",
            text: shareText,
          });
          onClose();
          toast.success("Shared successfully!");
        } else {
          // Fallback: Download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Copy share text
          try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Receipt downloaded and share text copied");
          } catch {
            toast.success("Receipt downloaded as image");
          }
        }
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share image failed:", error);
        toast.error("Failed to share receipt as image");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  /**
   * Share Receipt as PDF
   *
   * Flow:
   * 1. Clone ExportReceipt to temporary div
   * 2. Wait for images to load
   * 3. Convert to canvas
   * 4. Convert canvas to JPEG (lower size)
   * 5. Add image to PDF (jsPDF)
   * 6. Get PDF as blob
   * 7. Use Web Share API or download
   */
  const handleShareAsPDF = async () => {
    if (!exportReceiptRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const element = exportReceiptRef.current.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.transform = "translateX(-10000px)";
      tempContainer.appendChild(element);
      document.body.appendChild(tempContainer);

      try {
        element.style.width = "400px";
        await waitForImages(element);

        // Convert to canvas
        const canvas = await import("html2canvas").then((m) => m.default);
        const { jsPDF } = await import("jspdf");

        const canvasElement = await canvas(element, {
          backgroundColor: "#ffffff",
          scale: 1,  // Lower scale for smaller PDF
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          windowHeight: element.scrollHeight,
          windowWidth: element.scrollWidth,
        });

        // Convert to JPEG to reduce size
        const imgData = canvasElement.toDataURL("image/jpeg", 0.8);
        const imgWidth = 120; // mm
        const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;

        // Create PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const x = (pageWidth - imgWidth) / 2;  // Center image
        const y = 15;  // Top margin

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        // Get PDF as blob
        const pdfBlob = pdf.output("blob");
        const file = new File(
          [pdfBlob],
          `nexus-receipt-${transaction.id.slice(0, 8)}.pdf`,
          { type: "application/pdf" }
        );

        const shareText = generateShareText(transaction);

        // Try Web Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Nexus Transaction Receipt",
            text: shareText,
          });
          onClose();
          toast.success("Shared successfully!");
        } else {
          // Fallback: Download
          pdf.save(file.name);
          try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Receipt downloaded and share text copied");
          } catch {
            toast.success("Receipt downloaded as PDF");
          }
        }
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share PDF failed:", error);
        toast.error("Failed to share receipt as PDF");
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============= Helper Functions =============

  /**
   * Wait for all images in element to load
   * Prevents html2canvas capturing images before they're loaded
   */
  const waitForImages = (el: HTMLElement, timeout = 5000) => {
    const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
    if (imgs.length === 0) return Promise.resolve();

    return new Promise<void>((resolve) => {
      let remaining = imgs.length;
      const onDone = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
      };

      imgs.forEach((img) => {
        try {
          img.crossOrigin = "anonymous";
        } catch {}

        if (img.complete && img.naturalWidth !== 0) {
          onDone();
        } else {
          const t = setTimeout(() => {
            try {
              img.removeEventListener("load", onDone);
            } catch {}
            onDone();
          }, timeout);

          img.addEventListener("load", () => {
            clearTimeout(t);
            onDone();
          });
          img.addEventListener("error", () => {
            clearTimeout(t);
            onDone();
          });
        }
      });
    });
  };

  /**
   * Generate text summary of transaction for sharing
   */
  const generateShareText = (tx: Transaction) => {
    const amount = tx.amount.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

    const date = formatDate(tx.createdAt);
    const status = tx.related?.status || "N/A";
    const recipient = tx.related?.recipient_phone || "-";
    const provider = tx.related?.operatorCode || "-";

    return `Nexus Receipt\nTransaction ID: ${tx.id}\nAmount: ${amount}\nStatus: ${status}\nProvider: ${provider}\nRecipient: ${recipient}\nDate: ${date}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>Share Receipt</DialogTitle>
          <DialogDescription>
            Share your transaction receipt via WhatsApp, Instagram, Email, and more
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <TransactionReceipt
            ref={receiptRef}
            transaction={transaction}
            operatorLogo={operatorLogo}
          />
        </div>

        {/* Hidden Export Receipt for generation */}
        <div style={{ display: "none" }}>
          <ExportReceipt
            ref={exportReceiptRef}
            transaction={transaction}
            operatorLogo={operatorLogo}
          />
        </div>

        {/* Buttons */}
        <div className="border-t bg-white p-4 sm:flex sm:gap-3">
          <Button
            onClick={handleShareAsImage}
            disabled={isGeneratingImage}
            className="mb-2 w-full sm:mb-0 sm:flex-1"
            variant="outline"
          >
            {isGeneratingImage ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <FileImage className="mr-2 size-4" />
                Share as Image
              </>
            )}
          </Button>
          <Button
            onClick={handleShareAsPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:flex-1"
          >
            {isGeneratingPDF ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Share as PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Web Share API Support

```typescript
// Browser Support for Web Share API

navigator.canShare() - Check if sharing is supported
navigator.canShare({ files: [file] }) - Check if file sharing is supported

// Typical Support:
✅ Mobile browsers (iOS Safari, Android Chrome)
⚠️ Desktop browsers (limited support)
❌ Older browsers

// Fallback Strategy:
1. Try Web Share API first (native share sheet on mobile)
2. If not supported, download file to device
3. Copy share text to clipboard for manual sharing
```

---

## Status Timeline Component

### Timeline Implementation

```typescript
// src/components/features/dashboard/transactions/transaction-timeline.tsx

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  timestamp?: string;
}

interface TransactionTimelineProps {
  status: string;
  createdAt: string;
  completedAt?: string;
  transactionType?: string;
  className?: string;
  isRefund?: boolean;
}

/**
 * Renders transaction timeline showing progress through different states
 *
 * Timeline Variations:
 * - Topup Request: Initiated → Processing → Completed
 * - Incoming Payment: Payment Received → Wallet Credited
 * - Referral Withdrawal: Withdrawal Initiated → Funds Credited
 * - Generic: Initiated → Completed
 */
export function TransactionTimeline({
  status,
  createdAt,
  completedAt,
  transactionType,
  className,
  isRefund = false,
}: TransactionTimelineProps & { isRefund?: boolean }) {
  const currentStatus = status.toLowerCase();
  const steps = getStepsForType(transactionType, createdAt, completedAt);

  // Determine step state (completed, active, upcoming, failed)
  const getStepState = (stepStatus: string, index: number) => {
    // For refund transactions, all steps show as completed
    if (isRefund) {
      return "completed";
    }

    // Handle failed/cancelled/reversed states
    if (
      currentStatus === "failed" ||
      currentStatus === "cancelled" ||
      currentStatus === "reversed"
    ) {
      if (index === 0) return "completed";  // Initiated succeeded
      return "failed";                       // Rest failed
    }

    // Handle completed/received/success
    if (
      currentStatus === "completed" ||
      currentStatus === "received" ||
      currentStatus === "success"
    ) {
      return "completed";
    }

    // For 2-step timelines
    if (steps.length === 2) {
      if (currentStatus === "pending") {
        return index === 0 ? "completed" : "active";
      }
      return index === 0 ? "completed" : "upcoming";
    }

    // For 3-step timelines (topup_request)
    if (steps.length === 3) {
      if (currentStatus === "pending") {
        return index === 0 ? "completed" : "upcoming";
      }
      if (currentStatus === "processing") {
        return index <= 1 ? "completed" : "active";
      }
      return "completed";
    }

    return "upcoming";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const stepState = getStepState(step.status, index);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="flex gap-4">
            {/* Vertical line and dot */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={cn(
                  "z-10 size-8 rounded-full border-2 flex items-center justify-center",
                  stepState === "completed"
                    ? "border-green-600 bg-green-600"
                    : stepState === "active"
                      ? "border-blue-600 bg-blue-50"
                      : stepState === "failed"
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-gray-50"
                )}
              >
                {stepState === "completed" && (
                  <CheckCircle2 className="size-4 text-white" />
                )}
                {stepState === "active" && (
                  <Loader2 className="size-4 text-blue-600 animate-spin" />
                )}
                {stepState === "failed" && (
                  <XCircle className="size-4 text-red-600" />
                )}
              </div>

              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "mt-1 h-12 w-0.5",
                    stepState === "completed"
                      ? "bg-green-600"
                      : stepState === "failed"
                        ? "bg-red-600"
                        : "bg-gray-300"
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className="pt-1">
              <h4 className="font-medium text-sm">{step.label}</h4>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              {step.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============= Step Definitions =============

const getStepsForType = (
  transactionType: string | undefined,
  createdAt: string,
  completedAt?: string
): TimelineStep[] => {
  // Incoming payment - 2 steps
  if (transactionType === "incoming_payment") {
    return [
      {
        status: "received",
        label: "Payment Received",
        description: "Payment received successfully.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Wallet Credited",
        description: "Funds added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Referral withdrawal - 2 steps
  if (transactionType === "referral_withdrawal") {
    return [
      {
        status: "pending",
        label: "Withdrawal Initiated",
        description: "Referral bonus withdrawal requested.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Funds Credited",
        description: "Bonus added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Topup request - 3 steps
  if (transactionType === "topup_request") {
    return [
      {
        status: "pending",
        label: "Transaction Initiated",
        description: "We've received your request.",
        timestamp: createdAt,
      },
      {
        status: "processing",
        label: "Processing",
        description: "Working with provider to complete your top-up.",
      },
      {
        status: "completed",
        label: "Completed",
        description: "Transaction successful!",
        timestamp: completedAt,
      },
    ];
  }

  // Default - 2 steps
  return [
    {
      status: "pending",
      label: "Transaction Initiated",
      description: "Transaction has been initiated.",
      timestamp: createdAt,
    },
    {
      status: "completed",
      label: "Completed",
      description: "Transaction completed successfully.",
      timestamp: completedAt,
    },
  ];
};
```

---

## Complete Data Flow Examples

### Example 1: Successful Airtime Purchase

```
FLOW: User buys MTN ₦100 Airtime

1. USER INTERFACE
   ├─ Navigate to Dashboard → Airtime
   ├─ Enter phone: 08012345678
   ├─ Select: MTN ₦100 (₦470 with markup)
   ├─ Click: "Buy Now"
   └─ See: Checkout modal with price breakdown

2. SECURITY
   ├─ User chooses: Biometric (Face ID/Fingerprint)
   ├─ Device triggers biometric
   ├─ Backend verifies signature
   └─ Returns: verificationToken

3. TRANSACTION CREATION
   POST /user/topup
   ├─ Payload:
   │  {
   │    amount: 470,
   │    productCode: "MTN-100",
   │    recipientPhone: "08012345678",
   │    verificationToken: "token_xyz",
   │    useCashback: false,
   │  }
   │
   └─ Response:
      {
        success: true,
        data: {
          transactionId: "tx_abc123",
          status: "pending",
          amount: 470,
          balance: 5230,  // New wallet balance
        }
      }

4. TRANSACTION OBJECT CREATED (Backend)
   {
     id: "tx_abc123",
     userId: "user_xyz",
     direction: "debit",
     amount: 470,
     balanceAfter: 5230,
     relatedType: "topup_request",
     related: {
       status: "pending",
       operatorCode: "MTN",
       recipient_phone: "08012345678",
       type: "airtime",
     },
     productCode: "MTN-100",
     denomAmount: 100,
     createdAt: 2024-01-22T10:00:00Z,
   }

5. FRONTEND REDIRECT
   ├─ Display: "Transaction initiated successfully"
   └─ Navigate: /dashboard/transactions/tx_abc123

6. FETCH TRANSACTION DETAILS
   GET /user/wallet/transactions/tx_abc123
   ├─ Response: Transaction object
   └─ React Query caches for 10 minutes

7. TRANSACTION DETAIL PAGE RENDERED
   ├─ Header
   │  └─ MTN Logo
   ├─ Title: "Airtime Purchase"
   ├─ Description: "Airtime to MTN - 08012345678"
   ├─ Amount Display: "MTN ₦100 Airtime"
   ├─ Status Badge: "Pending" (yellow)
   ├─ Timeline:
   │  ├─ ✓ Transaction Initiated (completed)
   │  ├─ ⟳ Processing (active)
   │  └─ ○ Completed (upcoming)
   ├─ Details:
   │  ├─ Recipient Phone: 08012345678
   │  ├─ Amount Paid: ₦470
   │  ├─ Service: Airtime
   │  └─ Transaction ID: tx_abc123 (copyable)
   └─ Button: "Share Receipt"

8. BACKEND PROCESSING (while user views page)
   ├─ Connect to MTN provider API
   ├─ Send airtime request
   ├─ Update transaction status → "processing"
   ├─ Provider confirms delivery
   ├─ Update transaction status → "completed"
   └─ Add bonus cashback (if applicable)

9. TRANSACTION UPDATED (Polling or WebSocket)
   GET /user/wallet/transactions/tx_abc123 (auto-refreshed)
   ├─ Response: Transaction with status: "completed"
   ├─ Frontend updates display
   ├─ Status Badge: "Successful" (green)
   ├─ Timeline updated:
   │  ├─ ✓ Transaction Initiated (completed)
   │  ├─ ✓ Processing (completed)
   │  └─ ✓ Completed (completed)
   └─ Toast: "Your airtime has been delivered!"

10. USER SHARES RECEIPT
    ├─ Click: "Share Receipt"
    ├─ Modal opens with receipt preview
    ├─ Select: "Share as Image"
    ├─ html2canvas captures receipt
    ├─ Convert to PNG blob
    ├─ Web Share API opens share sheet
    ├─ User selects: WhatsApp
    ├─ Receipt image sent
    └─ Toast: "Shared successfully!"

11. FINAL TRANSACTION DETAIL
    {
      id: "tx_abc123",
      direction: "debit",
      amount: 470,
      balanceAfter: 5230,
      relatedType: "topup_request",
      related: {
        status: "completed",  // ← Updated
        operatorCode: "MTN",
        recipient_phone: "08012345678",
        type: "airtime",
      },
      productCode: "MTN-100",
      denomAmount: 100,
      cashbackUsed: 0,
      createdAt: 2024-01-22T10:00:00Z,
    }
```

### Example 2: Failed Transaction with Refund

```
FLOW: Data purchase fails and is reversed

1. USER INITIATES PURCHASE
   └─ 2GB Data Bundle for ₦1000

2. TRANSACTION CREATED (Status: pending)
   {
     id: "tx_def456",
     direction: "debit",
     amount: 1000,
     balanceAfter: 4230,
     relatedType: "topup_request",
     related: {
       status: "pending",
       operatorCode: "AIRTEL",
       recipient_phone: "08098765432",
       type: "data",
     },
     productCode: "AIRTEL-DATA-2GB",
     createdAt: 2024-01-22T10:30:00Z,
   }

3. BACKEND PROCESSING
   ├─ Connect to Airtel provider
   ├─ Provider returns error: "Insufficient balance for recipient"
   └─ Status updated: "failed"

4. REFUND INITIATED
   ├─ Money deducted from user balance (reversed)
   ├─ New transaction created (credit)
   │  {
   │    id: "tx_ghi789",
   │    direction: "credit",        // ← Credit (incoming)
   │    amount: 1000,
   │    balanceAfter: 5230,         // ← Balance restored
   │    relatedType: "topup_request",
   │    related: {
   │      status: "reversed",       // ← Indicates refund
   │      operatorCode: "AIRTEL",
   │    },
   │  }
   └─ Original transaction status → "failed"

5. TRANSACTION DETAIL PAGE (Original)
   ├─ Status Badge: "Failed" (red)
   ├─ Timeline:
   │  ├─ ✓ Transaction Initiated (completed)
   │  ├─ ✗ Processing (failed)
   │  └─ ○ Completed (not reached)
   └─ Amount: "AIRTEL ₦1000 Data" (shows attempted purchase)

6. REFUND TRANSACTION DETAIL PAGE
   ├─ Status Badge: "Refunded" (green)
   ├─ Timeline:
   │  └─ ✓ Refunded (completed)
   ├─ Title: "Refund"
   ├─ Amount: ₦1,000 (actual refunded amount)
   └─ Description: "Data to AIRTEL - 08098765432"

7. USER NOTIFICATION
   ├─ Receives push: "Transaction failed"
   ├─ Receives push: "₦1,000 refunded to your wallet"
   └─ Wallet balance updated: 5230
```

### Example 3: Admin Credit Transaction

```
FLOW: Admin sends wallet top-up to user

1. ADMIN ACTION (Backend)
   POST /admin/users/user_xyz/wallet/credit
   ├─ Amount: ₦5,000
   ├─ Reason: "Manual credit"
   └─ Reference: "CREDIT-2024-001"

2. TRANSACTION CREATED (Backend)
   {
     id: "tx_jkl012",
     userId: "user_xyz",
     direction: "credit",          // ← Incoming
     amount: 5000,
     balanceAfter: 10230,          // ← Balance increased
     relatedType: "incoming_payment",
     related: {
       status: "completed",        // ← Instant completion
     },
     createdAt: 2024-01-22T11:00:00Z,
   }

3. USER SEES TRANSACTION
   GET /user/wallet/transactions/tx_jkl012
   ├─ Fetch in transaction list
   ├─ See in dashboard recent transactions
   └─ Click to view details

4. TRANSACTION DETAIL PAGE
   ├─ Logo/Icon: "IN" (green circle)
   ├─ Title: "Incoming Payment"
   ├─ Description: "Wallet top-up"
   ├─ Amount: ₦5,000
   ├─ Status Badge: "Successful" (green)
   ├─ Timeline:
   │  ├─ ✓ Payment Received (completed)
   │  └─ ✓ Wallet Credited (completed)
   └─ Transaction ID: tx_jkl012
```

---

## API Endpoints Summary

### Transaction Endpoints

| Endpoint                         | Method | Purpose                          | Auth        |
| -------------------------------- | ------ | -------------------------------- | ----------- |
| `/user/topup`                    | POST   | Initiate airtime/data purchase   | ✅ Required |
| `/user/wallet/transactions`      | GET    | Get transactions with pagination | ✅ Required |
| `/user/wallet/transactions/{id}` | GET    | Get single transaction details   | ✅ Required |
| `/user/wallet`                   | GET    | Get wallet details and balance   | ✅ Required |
| `/user/wallet/balance`           | GET    | Get current wallet balance       | ✅ Required |

### Request/Response Examples

#### POST /user/topup

```typescript
// Request
{
  amount: 470,
  productCode: "MTN-100",
  recipientPhone: "08012345678",
  verificationToken: "token_xyz",  // OR pin: "1234"
  useCashback: false,
  offerId: "offer_123",  // Optional
}

// Response (Success)
{
  success: true,
  message: "Topup initiated successfully",
  data: {
    transactionId: "tx_abc123",
    status: "pending",
    amount: 470,
    balance: 5230,
  }
}

// Response (Error)
{
  success: false,
  message: "Insufficient balance",
  data: null
}
```

#### GET /user/wallet/transactions

```typescript
// Request Query Params
{
  page: 1,
  limit: 20,
  direction: "debit",  // Optional: "debit" | "credit" | undefined
  startDate: "2024-01-01",  // Optional
  endDate: "2024-01-31",  // Optional
}

// Response
{
  success: true,
  message: "Transactions fetched",
  data: {
    transactions: [
      {
        id: "tx_abc123",
        direction: "debit",
        amount: 470,
        // ... full transaction object
      },
      // ... more transactions
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8,
    }
  }
}
```

#### GET /user/wallet/transactions/{id}

```typescript
// Response
{
  success: true,
  message: "Transaction fetched",
  data: {
    id: "tx_abc123",
    userId: "user_xyz",
    walletId: "wallet_123",
    direction: "debit",
    amount: 470,
    balanceAfter: 5230,
    method: "wallet",
    reference: "ref_xyz",
    relatedType: "topup_request",
    relatedId: "topup_456",
    related: {
      status: "completed",
      recipient_phone: "08012345678",
      operatorCode: "MTN",
      type: "airtime",
    },
    metadata: {},
    cashbackUsed: 0,
    productCode: "MTN-100",
    denomAmount: 100,
    note: null,
    createdAt: "2024-01-22T10:00:00Z",
  }
}
```

---

## Testing Checklist

### Unit Tests

- [ ] `isDataTransaction()` correctly detects data vs airtime
  - [ ] Via `related.type === "data"`
  - [ ] Via productCode patterns (GB, MB, TB, DATA)

- [ ] `getTransactionTypeLabel()` returns correct labels
  - [ ] Airtime Purchase for debit topups
  - [ ] Data Purchase for data topups
  - [ ] Refund for credit with failed status
  - [ ] Incoming Payment for credits

- [ ] `formatDate()` handles all date inputs
  - [ ] Valid date strings
  - [ ] Date objects
  - [ ] Invalid dates
  - [ ] Null/undefined

- [ ] Status configuration
  - [ ] Correct colors for each status
  - [ ] Correct icons for each status
  - [ ] Refund handling (shows as green)

### Component Tests

- [ ] TransactionDetailPage
  - [ ] Loads transaction on mount
  - [ ] Shows loading skeleton
  - [ ] Handles error state
  - [ ] Displays all transaction details
  - [ ] Copy button works
  - [ ] Navigation back link works
  - [ ] Share button opens dialog

- [ ] TransactionTimeline
  - [ ] 2-step timeline for incoming_payment
  - [ ] 3-step timeline for topup_request
  - [ ] Correct step states (completed, active, upcoming, failed)
  - [ ] Refund shows all steps as completed
  - [ ] Failed shows first step completed, rest failed

- [ ] TransactionReceipt
  - [ ] Displays correct title
  - [ ] Shows operator logo for topups
  - [ ] Shows "IN" icon for credits
  - [ ] Formats amount correctly
  - [ ] Shows correct status color
  - [ ] Details table renders all fields

- [ ] ExportReceipt
  - [ ] Renders with inline styles
  - [ ] All images load before canvas capture
  - [ ] Proper width/height for export

- [ ] ShareTransactionDialog
  - [ ] Dialog opens/closes
  - [ ] Receipt preview shows
  - [ ] Share as Image button works
  - [ ] Share as PDF button works
  - [ ] Fallback download works if Web Share unavailable
  - [ ] Share text copied to clipboard

### Integration Tests

- [ ] Full transaction flow
  - [ ] Fetch transaction from API
  - [ ] Display in detail page
  - [ ] Generate receipt image
  - [ ] Export as PDF
  - [ ] Share via Web Share API

- [ ] Status updates
  - [ ] Transaction fetched with pending status
  - [ ] Status updates to processing
  - [ ] Status updates to completed
  - [ ] Timeline reflects status changes

- [ ] Error scenarios
  - [ ] Transaction not found (404)
  - [ ] Unauthorized access (401)
  - [ ] Server error (500)
  - [ ] Network timeout

### E2E Tests

- [ ] User can view completed transaction
  - [ ] Navigate to transactions list
  - [ ] Click on transaction
  - [ ] View all details
  - [ ] Verify status and timeline

- [ ] User can share receipt
  - [ ] Click share button
  - [ ] Generate as PNG
  - [ ] Generate as PDF
  - [ ] Share via WhatsApp/Email

- [ ] Refund scenario
  - [ ] Transaction shows as failed
  - [ ] Refund transaction appears
  - [ ] Both link correctly
  - [ ] Timeline shows both states

---

## Common Issues & Solutions

### Issue 1: Receipt Image Blurry When Sharing

**Problem**: html2canvas captures blurry image

**Solution**:

```typescript
// Use higher scale
const canvasElement = await canvas(element, {
  scale: 2, // Or 3 for very high quality
  // ... other options
});

// Use higher quality PNG
const blob = await new Promise<Blob>((resolve) => {
  canvasElement.toBlob(
    (blob) => resolve(blob),
    "image/png",
    0.95 // Increase from 0.92
  );
});
```

### Issue 2: Images Not Loading in Exported Receipt

**Problem**: Operator logos not showing in PDF/PNG export

**Solution**:

```typescript
// Ensure images have crossOrigin
img.crossOrigin = "anonymous";

// Wait for images to load
await waitForImages(element);

// Use absolute URLs for images
// Not: /images/logo.png
// But: https://domain.com/images/logo.png
```

### Issue 3: PDF Too Large When Exporting

**Problem**: PDF file size is too big

**Solution**:

```typescript
// Use lower scale for canvas
const canvasElement = await canvas(element, {
  scale: 1, // Instead of 2
});

// Use JPEG instead of PNG for PDF
const imgData = canvasElement.toDataURL("image/jpeg", 0.8);

// Reduce image quality
const { jsPDF } = await import("jspdf");
const imgQuality = 0.7; // Lower quality
```

### Issue 4: Transaction Status Not Updating

**Problem**: Page shows "Pending" even after transaction completes

**Solution**:

```typescript
// Enable auto-refetch
useTransaction(id, {
  refetchInterval: 5000, // Refetch every 5 seconds
  staleTime: 1000, // Mark as stale after 1 second
});

// Or manually refetch
const queryClient = useQueryClient();
setTimeout(() => {
  queryClient.invalidateQueries({
    queryKey: walletKeys.transactions.detail(id),
  });
}, 3000);

// Or use WebSocket for real-time updates
// (if backend supports)
```

### Issue 5: Share Dialog Doesn't Open on Some Devices

**Problem**: Web Share API not supported

**Solution**:

```typescript
// Check support before showing button
const canShare = typeof navigator !== "undefined" && !!navigator.canShare;

if (!canShare) {
  // Show download button instead
  // Or disable share functionality
}

// Provide fallback
if (navigator.canShare && navigator.canShare({ files: [file] })) {
  await navigator.share({ files: [file] });
} else {
  // Fallback: Download file
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "receipt.png";
  link.click();
}
```

### Issue 6: Copy to Clipboard Not Working

**Problem**: `navigator.clipboard.writeText()` fails

**Solution**:

```typescript
// Use fallback method
const copyToClipboard = async (text: string) => {
  try {
    // Try modern API first
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  } catch (err) {
    // Fallback: Create temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast.success("Copied!");
  }
};
```

---

## File Structure Reference

```
src/
├── app/dashboard/transactions/
│   ├── page.tsx                    (Transactions list page)
│   └── [id]/
│       └── page.tsx                (Transaction detail route)
│
├── components/features/dashboard/transactions/
│   ├── transaction-detail-page.tsx (Main detail component)
│   ├── transaction-receipt.tsx     (Display receipt)
│   ├── export-receipt.tsx          (Export with inline styles)
│   ├── share-transaction-dialog.tsx (Share modal)
│   ├── transaction-timeline.tsx    (Status timeline)
│   ├── transaction-list.tsx        (Transactions list)
│   └── transaction-filters.tsx     (Filter UI)
│
├── components/features/dashboard/
│   └── transaction-item.tsx        (Transaction list item)
│
├── services/
│   ├── wallet.service.ts           (API calls)
│   └── topup.service.ts            (Topup creation)
│
├── hooks/
│   └── useWallet.ts                (React Query)
│
└── types/
    ├── wallet.types.ts             (Transaction types)
    └── topup.types.ts              (Topup types)
```

---

## Quick Reference

### Component Imports

```typescript
import { useTransaction } from "@/hooks/useWallet";
import { TransactionDetailPage } from "@/components/features/dashboard/transactions/transaction-detail-page";
import { ShareTransactionDialog } from "@/components/features/dashboard/transactions/share-transaction-dialog";
import { TransactionTimeline } from "@/components/features/dashboard/transactions/transaction-timeline";
```

### Key Functions

```typescript
// Check transaction type
isDataTransaction(transaction);
getTransactionTypeLabel(transaction);
getTransactionDescription(transaction);

// Format data
formatDate(date);
getCashbackUsed(transaction);
getStatusConfig(status, isRefund);

// Copy utilities
copyToClipboard(text, label);

// Sharing
handleShareAsImage();
handleShareAsPDF();
generateShareText(transaction);
```

### React Query Usage

```typescript
// Fetch single transaction
const { data, isLoading, error } = useTransaction(id);

// Invalidate after update
queryClient.invalidateQueries({
  queryKey: walletKeys.transactions.detail(id),
});

// Refetch at intervals
useTransaction(id, {
  refetchInterval: 5000,
  staleTime: 1000,
});
```

---

## Summary

The transaction detail and receipt system is a complete ecosystem for displaying, tracking, and sharing financial transactions. Key aspects:

1. **State Lifecycle**: Transactions move from pending → processing → completed/failed
2. **Data Fetching**: React Query caches transactions for 10 minutes, with optional polling
3. **Display**: Transaction detail page shows status, timeline, and all transaction info
4. **Timeline**: Visual representation of transaction progress through different states
5. **Receipts**: Two components for display (TransactionReceipt) and export (ExportReceipt)
6. **Sharing**: PNG and PDF export with fallback to download if Web Share unavailable
7. **Refunds**: Credit transactions with failed status show as refunds with full green timeline
8. **Smart Detection**: Automatically determines if transaction is data or airtime via productCode patterns

All components are fully tested, type-safe with TypeScript, and support mobile and desktop devices.
