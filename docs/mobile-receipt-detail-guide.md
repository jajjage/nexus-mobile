# Mobile Transaction Detail & Share Receipt Guide

This is a **comprehensive step-by-step guide** for implementing the Transaction Detail Screen and Share Receipt functionality in your Expo/React Native mobile app. It covers data fetching, UI layout, helper functions, and native library recommendations.

---

## Overview

The Transaction Detail screen allows users to:
1.  View complete details of a single transaction.
2.  See a styled **Receipt Card** with operator logo, amount, status, and details.
3.  **Share the receipt** as an image to WhatsApp, Instagram, etc.

---

## Step 1: Navigation to Detail Screen

When a user taps a transaction row in the list, navigate to the detail screen, passing the `transactionId`.

```typescript
// From TransactionItem.tsx (List Row)
import { useRouter } from 'expo-router'; // or react-navigation

const router = useRouter();

const navigateToDetail = () => {
  router.push(`/transactions/${transaction.id}`);
};

// In List:
<TouchableOpacity onPress={navigateToDetail}>
  {/* Transaction Row Content */}
</TouchableOpacity>
```

---

## Step 2: Fetching Transaction Data

Use the `useTransaction(id)` hook to fetch the full transaction object.

### Hook Definition (from `useWallet.ts`)
```typescript
// Query Key: ['wallet', 'transactions', transactionId]
export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: walletKeys.transaction(transactionId),
    queryFn: () => walletService.getTransaction(transactionId),
    enabled: !!transactionId,
  });
}
```

### Usage in Detail Screen
```typescript
import { useTransaction } from '@/hooks/useWallet';

function TransactionDetailScreen({ route }) {
  const { id: transactionId } = route.params;

  const { data, isLoading, error } = useTransaction(transactionId);
  const transaction = data?.data;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!transaction) return <NotFoundMessage />;

  return <ReceiptContent transaction={transaction} />;
}
```

---

## Step 3: Understanding the Transaction Object

The `Transaction` object has a **nested `related` field** where status and other details live.

```typescript
interface Transaction {
  id: string;
  direction: "debit" | "credit";
  amount: number;
  balanceAfter: number;
  method: string;
  reference?: string;
  relatedType?: string;         // "topup_request" | "incoming_payment" | etc.
  relatedId?: string;
  related?: {
    status: "pending" | "completed" | "failed" | "reversed" | "cancelled" | "retry";
    recipient_phone?: string;   // For topups
    operatorCode?: string;      // "MTN", "AIRTEL", "GLO", "9MOBILE"
    type?: string;              // "airtime" or "data"
  };
  cashbackUsed: number;
  productCode?: string;         // e.g., "MTN-1GB-30DAY"
  denomAmount: number;          // Face value (e.g., 100 for ₦100 airtime)
  note?: string;
  createdAt: Date;
}
```

> **Critical:** Status is at `transaction.related?.status`, NOT `transaction.status`.

---

## Step 4: Helper Functions

These are essential utilities used throughout the receipt.

### 4.1 Get Status Configuration
Returns color and label based on the transaction status.

```typescript
const getStatusConfig = (status: string, isRefund?: boolean) => {
  if (isRefund) {
    return { color: '#166534', label: 'Refunded', type: 'success' };
  }

  switch (status.toLowerCase()) {
    case 'completed':
    case 'received':
    case 'success':
      return { color: '#166534', label: 'Successful', type: 'success' };
    case 'pending':
      return { color: '#B45309', label: 'Pending', type: 'pending' };
    case 'failed':
    case 'reversed':
      return { color: '#991B1B', label: 'Failed', type: 'failed' };
    case 'cancelled':
      return { color: '#374151', label: 'Cancelled', type: 'cancelled' };
    default:
      return { color: '#374151', label: status, type: 'default' };
  }
};
```

### 4.2 Detect Data vs Airtime
```typescript
const isDataTransaction = (transaction: Transaction): boolean => {
  // Method 1: Check backend's related.type
  if (transaction.related?.type?.toLowerCase() === 'data') {
    return true;
  }
  // Method 2: Check productCode for data patterns
  const productCode = (transaction.productCode || '').toUpperCase();
  const dataPatterns = ['DATA', 'GB', 'MB', 'TB', 'BUNDLE'];
  return dataPatterns.some(pattern => productCode.includes(pattern));
};
```

### 4.3 Get Transaction Type Label
```typescript
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isCredit = transaction.direction === 'credit';
  const relatedStatus = transaction.related?.status?.toLowerCase();

  // Refund detection
  if (isCredit && transaction.relatedType === 'topup_request' &&
      (relatedStatus === 'failed' || relatedStatus === 'reversed')) {
    return 'Refund';
  }

  if (transaction.relatedType === 'topup_request') {
    const isData = isDataTransaction(transaction);
    return isData ? 'Data Purchase' : 'Airtime Purchase';
  }
  if (transaction.relatedType === 'incoming_payment') {
    return 'Incoming Payment';
  }
  return transaction.direction === 'debit' ? 'Withdrawal' : 'Deposit';
};
```

### 4.4 Get Operator Logo URL
```typescript
const getOperatorLogo = (operatorCode?: string): string | undefined => {
  const code = operatorCode?.toLowerCase();
  const logos: Record<string, string> = {
    mtn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg',
    airtel: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg',
    glo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png',
    '9mobile': 'https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg',
  };
  return code ? logos[code] : undefined;
};
```

### 4.5 Format Currency
```typescript
const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
```

### 4.6 Format Date
```typescript
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

### 4.7 Get Main Display Amount
For topups, show product name. For refunds/other, show money amount.

```typescript
const getDisplayAmount = (transaction: Transaction): string => {
  const isCredit = transaction.direction === 'credit';
  const relatedStatus = transaction.related?.status?.toLowerCase();
  const isRefund = isCredit && transaction.relatedType === 'topup_request' &&
                   (relatedStatus === 'failed' || relatedStatus === 'reversed');
  const isTopup = transaction.relatedType === 'topup_request';

  if (isRefund) {
    return formatCurrency(transaction.amount);
  }
  if (isTopup) {
    if (isDataTransaction(transaction)) {
      return transaction.productCode || 'Data Bundle';
    } else {
      const operator = transaction.related?.operatorCode?.toUpperCase() || '';
      const denom = transaction.denomAmount ? `₦${transaction.denomAmount.toLocaleString()}` : '';
      return `${operator} ${denom} Airtime`;
    }
  }
  return formatCurrency(transaction.amount);
};
```

---

## Step 5: Receipt UI Layout

Build the **Receipt Card** component, which is also used for sharing.

### Visual Structure
```
┌──────────────────────────────────────┐
│           [Operator Logo]            │
│                                      │
│        "Airtime Purchase"            │  ← Type Label
│   "Airtime to MTN - 08012345678"     │  ← Description
│                                      │
│          MTN ₦100 Airtime            │  ← Main Amount/Product
│                                      │
│             Successful               │  ← Status (colored)
│         January 20, 2026, 10:30 AM   │  ← Date
│                                      │
├──────────────────────────────────────┤  ← Dashed Separator
│   TRANSACTION DETAILS                │
│                                      │
│   Recipient Phone       08012345678  │
│   Amount Paid               ₦100.00  │
│   Cashback Used             -₦5.00   │  ← (Red)
│   Service              Airtime       │
│                        MTN-100       │
│                                      │
│   Transaction ID                     │
│   abc123-def456-...          [Copy]  │
│                                      │
├──────────────────────────────────────┤
│           nexus-data.com             │  ← Footer Branding
└──────────────────────────────────────┘
```

### React Native Component
```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Toast } from 'react-native-toast-message'; // Or your toast library

interface ReceiptCardProps {
  transaction: Transaction;
}

export function ReceiptCard({ transaction }: ReceiptCardProps) {
  const statusConfig = getStatusConfig(
    transaction.related?.status || 'pending',
    isRefundTransaction(transaction)
  );
  const logoUrl = getOperatorLogo(transaction.related?.operatorCode);

  const copyTransactionId = async () => {
    await Clipboard.setStringAsync(transaction.id);
    Toast.show({ type: 'success', text1: 'Transaction ID copied' });
  };

  return (
    <View style={styles.card}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Operator Logo */}
        <View style={styles.logoContainer}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
          ) : (
            <Text style={styles.placeholderIcon}>#</Text>
          )}
        </View>

        {/* Type Label */}
        <Text style={styles.typeLabel}>
          {getTransactionTypeLabel(transaction)}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {getTransactionDescription(transaction)}
        </Text>

        {/* Main Amount */}
        <Text style={styles.amount}>
          {getDisplayAmount(transaction)}
        </Text>

        {/* Status */}
        <Text style={[styles.status, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>

        {/* Date */}
        <Text style={styles.date}>
          {formatDate(transaction.createdAt)}
        </Text>
      </View>

      {/* Dashed Separator */}
      <View style={styles.separator} />

      {/* Details Section */}
      <View style={styles.details}>
        <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>

        {/* Recipient Phone */}
        {transaction.related?.recipient_phone && (
          <DetailRow
            label="Recipient Phone"
            value={transaction.related.recipient_phone}
          />
        )}

        {/* Amount Paid */}
        <DetailRow
          label="Amount Paid"
          value={formatCurrency(transaction.amount)}
        />

        {/* Cashback Used (for topups) */}
        {transaction.relatedType === 'topup_request' && (
          <DetailRow
            label="Cashback Used"
            value={`-${formatCurrency(transaction.cashbackUsed || 0)}`}
            valueStyle={{ color: '#EF4444' }}
          />
        )}

        {/* Service Type (for topups) */}
        {transaction.relatedType === 'topup_request' && (
          <DetailRow
            label="Service"
            value={isDataTransaction(transaction) ? 'Data Bundle' : 'Airtime'}
            subValue={transaction.productCode}
          />
        )}

        {/* Transaction ID with Copy */}
        <View style={styles.idRow}>
          <Text style={styles.label}>Transaction ID</Text>
          <TouchableOpacity onPress={copyTransactionId}>
            <Text style={styles.copyButton}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.transactionId}>{transaction.id}</Text>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.brandText}>nexus-data.com</Text>
      </View>
    </View>
  );
}

// Detail Row Component
function DetailRow({ label, value, subValue, valueStyle }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.value, valueStyle]}>{value}</Text>
        {subValue && <Text style={styles.subValue}>{subValue}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 250,
    marginBottom: 24,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  separator: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  details: {
    padding: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  subValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  copyButton: {
    fontSize: 12,
    color: '#E69E19', // Primary color
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  brandText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
```

---

## Step 6: Share Receipt as Image

Use **`react-native-view-shot`** to capture the Receipt Card as an image, then share it using **`expo-sharing`**.

### 6.1 Install Dependencies
```bash
npx expo install react-native-view-shot expo-sharing expo-file-system
```

### 6.2 Implementation
```tsx
import React, { useRef, useState } from 'react';
import { View, Button, ActivityIndicator } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

function TransactionDetailScreen({ transaction }) {
  const receiptRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareReceipt = async () => {
    if (!receiptRef.current?.capture) return;

    setIsSharing(true);
    try {
      // 1. Capture the receipt view as an image
      const uri = await receiptRef.current.capture();

      // 2. Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        alert('Sharing is not available on this device');
        return;
      }

      // 3. Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Receipt',
        UTI: 'public.png', // iOS-specific
      });

    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share receipt');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Wrap ReceiptCard with ViewShot */}
      <ViewShot
        ref={receiptRef}
        options={{
          format: 'png',
          quality: 0.9,
          result: 'tmpfile', // Save to a temp file
        }}
      >
        <ReceiptCard transaction={transaction} />
      </ViewShot>

      {/* Share Button */}
      <View style={{ padding: 16 }}>
        {isSharing ? (
          <ActivityIndicator size="large" color="#E69E19" />
        ) : (
          <Button title="Share Receipt" onPress={shareReceipt} />
        )}
      </View>
    </View>
  );
}
```

### 6.3 Alternative: Save to Gallery
```typescript
import * as MediaLibrary from 'expo-media-library';

const saveToGallery = async () => {
  const uri = await receiptRef.current.capture();

  // Request permissions
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access gallery is required');
    return;
  }

  // Save to gallery
  await MediaLibrary.saveToLibraryAsync(uri);
  alert('Receipt saved to gallery!');
};
```

---

## Step 7: Full Detail Screen Implementation

Putting it all together:

```tsx
import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

import { useTransaction } from '@/hooks/useWallet';
import { ReceiptCard } from '@/components/ReceiptCard';

export default function TransactionDetailScreen() {
  const route = useRoute();
  const { id: transactionId } = route.params;
  const receiptRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { data, isLoading, error } = useTransaction(transactionId);
  const transaction = data?.data;

  const shareReceipt = async () => {
    if (!receiptRef.current?.capture) return;
    setIsSharing(true);
    try {
      const uri = await receiptRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E69E19" />
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load transaction</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Capture this view */}
        <ViewShot
          ref={receiptRef}
          options={{ format: 'png', quality: 0.9, result: 'tmpfile' }}
        >
          <ReceiptCard transaction={transaction} />
        </ViewShot>
      </ScrollView>

      {/* Share Button (Fixed at Bottom) */}
      <View style={styles.shareButtonContainer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareReceipt}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 16,
  },
  shareButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  shareButton: {
    backgroundColor: '#E69E19',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## Native Library Summary

| Feature | Library | Install Command |
|---------|---------|-----------------|
| Capture View as Image | `react-native-view-shot` | `npx expo install react-native-view-shot` |
| Native Share Dialog | `expo-sharing` | `npx expo install expo-sharing` |
| Clipboard | `expo-clipboard` | `npx expo install expo-clipboard` |
| Save to Gallery | `expo-media-library` | `npx expo install expo-media-library` |
| Toast Notifications | `react-native-toast-message` | `npm install react-native-toast-message` |

---

## Key Takeaways

1.  **Status is nested**: Always use `transaction.related?.status`.
2.  **Data vs Airtime**: Smart-detect using `related.type` or `productCode` patterns.
3.  **Operator logos**: Hardcoded mapping from `operatorCode` to logo URLs.
4.  **Share workflow**: Capture → Save to temp file → Call native share sheet.
5.  **Colors are hardcoded hex**: Avoid CSS class names for compatibility with image capture.
