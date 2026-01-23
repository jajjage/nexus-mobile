# Mobile Referrals Page Guide

> **Target Audience**: React Native/Expo Mobile Developers
> **Purpose**: Replicate the Referrals page UI and functionality

---

## Overview

The **Referrals page** allows users to:
- View their referral stats (invited friends, earnings)
- Share their referral link/code
- Claim referral bonuses
- Withdraw referral earnings to wallet
- View list of invited friends

> [!IMPORTANT]
> The referrals feature is currently behind a feature flag (`REFERRALS_ENABLED = false`). When disabled, it shows a "Coming Soon" placeholder.

---

## Page Route

| Web | Mobile Equivalent |
|-----|-------------------|
| `/dashboard/referrals` | `/(tabs)/referrals` or `/referrals` |

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    REFERRALS PAGE                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HEADER                                              │   │
│  │  Title: "Referrals"                                  │   │
│  │  Subtitle: "Earn rewards by referring friends"       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REFERRAL ACTION CARD (Yellow/Amber themed)         │   │
│  │  - Claim Bonus button (if pending)                  │   │
│  │  - Withdraw buttons (if balance available)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STATS CARDS (4 columns on desktop, 2x2 on mobile)  │   │
│  │  [Invited Friends] [Inviter Earnings]               │   │
│  │  [Signup Bonus]    [Withdrawable]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REFERRAL LINK SECTION                              │   │
│  │  - Referral link input (read-only)                  │   │
│  │  - Copy & Share buttons                             │   │
│  │  - QR Code (optional)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REFERRALS TABLE                                    │   │
│  │  - List of invited friends with status & earnings   │   │
│  │  - Pagination                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Bottom Navigation Bar]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Hooks Used

### Query Hooks (Data Fetching)

| Hook | Purpose | API Endpoint |
|------|---------|--------------|
| `useReferralStatsV2()` | Get comprehensive referral stats | `GET /dashboard/referrals/stats-v2` |
| `useAvailableBalanceV2(type)` | Get withdrawable balance | `GET /dashboard/referrals/available-balance-v2?type=referrer\|referred` |
| `useReferralLink()` | Get user's referral link/code | `GET /dashboard/referrals/link` |
| `useReferralsList(params)` | Get paginated list of referrals | `GET /dashboard/referrals/list-with-details` |

### Mutation Hooks (Actions)

| Hook | Purpose | API Endpoint |
|------|---------|--------------|
| `useClaimReferralBonusV2()` | Claim signup bonus | `POST /dashboard/referrals/claim-v2` |
| `useRequestWithdrawalV2()` | Withdraw earnings to wallet | `POST /dashboard/referrals/withdraw-v2` |
| `useRegenerateReferralCode()` | Generate new referral code | `POST /dashboard/referrals/link/regenerate` |
| `useDeactivateReferralLink()` | Deactivate referral link | `POST /dashboard/referrals/link/deactivate` |

---

## TypeScript Types

```typescript
// ============= Stats Types =============

interface ReferrerStats {
  totalReferralsInvited: number;  // Total friends invited
  claimedReferrals: number;       // Friends who claimed
  pendingClaimReferrals: number;  // Friends waiting to claim
  totalReferrerEarnings: number;  // Lifetime earnings as referrer
  pendingReferrerAmount: number;  // Available to withdraw
  withdrawnReferrerAmount: number;
}

interface ReferredStats {
  referrerName: string;           // Who referred this user
  referralStatus: 'pending' | 'claimed' | 'cancelled';
  totalReferredEarnings: number;
  pendingReferredAmount: number;  // Available to withdraw
  withdrawnReferredAmount: number;
  claimedAt: string | null;       // ISO Date
}

interface ReferralStatsV2 {
  referrerStats: ReferrerStats;
  referredStats: ReferredStats | null;  // null if not referred
}

// ============= Balance Types =============

interface AvailableBalanceV2 {
  totalAvailable: number;  // Amount available to withdraw
  claimCount: number;      // Number of contributors
}

interface WithdrawalRequestV2 {
  amount: number;
  userType: 'referrer' | 'referred';
}

// ============= Link Types =============

interface ReferralLinkData {
  referralCode: string;     // e.g., "JOHND123"
  shortCode: string;        // Same as referralCode
  referralLink: string;     // Full URL: https://app.com/register?code=...
  qrCodeUrl: string;        // QR code image URL
  sharingMessage: string;   // Pre-filled share message
}

// ============= List Types =============

interface ReferredUserData {
  userId: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  isVerified: boolean;
  profilePictureUrl: string | null;
}

interface Referral {
  referralId: string;
  referrerUserId: string;
  referredUserId: string;
  status: 'pending' | 'claimed' | 'cancelled';
  rewardAmount: number;
  referralCode: string | null;
  referralCompletedAt: string | null;
  createdAt: string;
  referredUser?: ReferredUserData;
}

interface ReferralListResponse {
  referrals: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GetReferralsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'claimed' | 'cancelled';
}
```

---

## Component 1: Referral Action Card

Shows claim/withdraw actions based on user's referral state.

### When to Show

```typescript
const canClaimBonus = referredStats?.referralStatus === 'pending';
const hasReferrerBalance = referrerBalance?.totalAvailable > 0;
const hasReferredBalance = referredBalance?.totalAvailable > 0;

// Hide card if nothing to act on
if (!canClaimBonus && !hasReferrerBalance && !hasReferredBalance) {
  return null;
}
```

### UI States

| State | Display |
|-------|---------|
| User can claim bonus | Show "Claim Bonus" button |
| User has referrer earnings | Show "Withdraw Earnings" button |
| User has signup bonus available | Show "Withdraw Bonus" button |

### Mobile Implementation

```tsx
function ReferralActionCard() {
  const { data: stats } = useReferralStatsV2();
  const { data: referrerBalance } = useAvailableBalanceV2('referrer');
  const { data: referredBalance } = useAvailableBalanceV2('referred');
  const { mutate: claimBonus, isPending: isClaiming } = useClaimReferralBonusV2();

  const [showWithdrawalModal, setShowWithdrawalModal] = useState<
    'referrer' | 'referred' | null
  >(null);

  const canClaimBonus = stats?.referredStats?.referralStatus === 'pending';
  const referrerAmount = referrerBalance?.totalAvailable || 0;
  const referredAmount = referredBalance?.totalAvailable || 0;

  if (!canClaimBonus && referrerAmount === 0 && referredAmount === 0) {
    return null;
  }

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.giftIcon}>
          <Gift size={20} color="#d97706" />
        </View>
        <Text style={styles.actionTitle}>
          {canClaimBonus ? 'Claim Your Reward' : 'Available Rewards'}
        </Text>
      </View>

      <Text style={styles.actionSubtitle}>
        {canClaimBonus
          ? `You were referred by ${stats?.referredStats?.referrerName}. Claim your signup bonus now!`
          : 'Collect your referral earnings.'}
      </Text>

      {/* Balances Display */}
      <View style={styles.balancesRow}>
        {(canClaimBonus || referredAmount > 0) && (
          <View>
            <Text style={styles.balanceLabel}>Signup Bonus</Text>
            <Text style={styles.balanceAmount}>
              ₦{(referredAmount || 250).toLocaleString()}
            </Text>
          </View>
        )}
        {referrerAmount > 0 && (
          <View>
            <Text style={styles.balanceLabel}>Referral Earnings</Text>
            <Text style={styles.balanceAmount}>
              ₦{referrerAmount.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {canClaimBonus && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => claimBonus()}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Gift size={16} color="#fff" />
                <Text style={styles.claimButtonText}>Claim Bonus</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {referredAmount > 0 && !canClaimBonus && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setShowWithdrawalModal('referred')}
          >
            <Wallet size={16} />
            <Text>Withdraw Bonus</Text>
          </TouchableOpacity>
        )}

        {referrerAmount > 0 && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => setShowWithdrawalModal('referrer')}
          >
            <Wallet size={16} color="#fff" />
            <Text style={styles.claimButtonText}>Withdraw Earnings</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        visible={showWithdrawalModal !== null}
        userType={showWithdrawalModal || 'referrer'}
        onClose={() => setShowWithdrawalModal(null)}
      />
    </View>
  );
}
```

---

## Component 2: Referral Stats Cards

4 stat cards showing referral metrics.

### Stats Displayed

| Card | Data Source | Icon |
|------|-------------|------|
| Invited Friends | `referrerStats.totalReferralsInvited` | `Users` |
| Inviter Earnings | `referrerStats.totalReferrerEarnings` | `TrendingUp` |
| Signup Bonus | `referredStats.totalReferredEarnings` | `Banknote` |
| Withdrawable | `referrerBalance + referredBalance` | `Clock` |

### Mobile Implementation

```tsx
function ReferralStatsCards() {
  const { data: stats, isLoading: isLoadingStats } = useReferralStatsV2();
  const { data: referrerBalance } = useAvailableBalanceV2('referrer');
  const { data: referredBalance } = useAvailableBalanceV2('referred');

  const totalWithdrawable =
    (referrerBalance?.totalAvailable || 0) +
    (referredBalance?.totalAvailable || 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);

  if (isLoadingStats) {
    return (
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={100} style={styles.statCard} />
        ))}
      </View>
    );
  }

  const referrer = stats?.referrerStats;
  const referred = stats?.referredStats;

  return (
    <View style={styles.statsGrid}>
      {/* Invited Friends */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>Invited Friends</Text>
          <Users size={16} color="#6b7280" />
        </View>
        <Text style={styles.statValue}>
          {referrer?.totalReferralsInvited || 0}
        </Text>
        <Text style={styles.statSubtext}>
          {referrer?.claimedReferrals || 0} claimed, {referrer?.pendingClaimReferrals || 0} pending
        </Text>
      </View>

      {/* Inviter Earnings */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>Inviter Earnings</Text>
          <TrendingUp size={16} color="#6b7280" />
        </View>
        <Text style={styles.statValue}>
          {formatCurrency(referrer?.totalReferrerEarnings || 0)}
        </Text>
        <Text style={styles.statSubtext}>Lifetime earnings</Text>
      </View>

      {/* Signup Bonus */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>Signup Bonus</Text>
          <Banknote size={16} color="#6b7280" />
        </View>
        <Text style={styles.statValue}>
          {formatCurrency(referred?.totalReferredEarnings || 0)}
        </Text>
        <Text style={styles.statSubtext}>
          {referred ? `Referred by ${referred.referrerName}` : 'Not referred'}
        </Text>
      </View>

      {/* Withdrawable */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>Withdrawable</Text>
          <Clock size={16} color="#6b7280" />
        </View>
        <Text style={[styles.statValue, { color: '#d97706' }]}>
          {formatCurrency(totalWithdrawable)}
        </Text>
        <Text style={styles.statSubtext}>Claimed rewards ready</Text>
      </View>
    </View>
  );
}
```

---

## Component 3: Referral Link Section

Shows user's referral link with copy/share functionality.

### Features

- Read-only input showing full referral link
- Referral code badge
- Copy to clipboard button
- Native share button (uses `Share` API)
- Optional QR code display
- Regenerate code option (with confirmation)

### Mobile Implementation

```tsx
function ReferralLinkSection() {
  const { data: linkData, isLoading, refetch } = useReferralLink();
  const { mutate: regenerateCode, isPending: isRegenerating } = useRegenerateReferralCode();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!linkData?.referralLink) return;
    await Clipboard.setStringAsync(linkData.referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!linkData) return;
    try {
      await Share.share({
        message: linkData.sharingMessage || `Use my code ${linkData.referralCode} to join!`,
        url: linkData.referralLink,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Referral Code?',
      'This will invalidate your current referral link. Any old links shared will no longer work.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => regenerateCode(undefined, { onSuccess: () => refetch() }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.linkCard}>
        <Skeleton height={24} width={150} />
        <Skeleton height={48} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (!linkData) {
    return (
      <View style={styles.linkCard}>
        <Text style={styles.noLinkText}>No referral link active.</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <ActivityIndicator />
          ) : (
            <Text>Generate Referral Link</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.linkCard}>
      <View style={styles.linkHeader}>
        <View>
          <Text style={styles.linkTitle}>Your Referral Link</Text>
          <Text style={styles.linkSubtitle}>
            Share this link to earn rewards when friends sign up.
          </Text>
        </View>
        <TouchableOpacity onPress={handleRegenerate}>
          <RefreshCw size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Link Input */}
      <View style={styles.linkInputContainer}>
        <TextInput
          style={styles.linkInput}
          value={linkData.referralLink}
          editable={false}
        />
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>Code: {linkData.referralCode}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.linkActions}>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopy}
          disabled={isCopied}
        >
          <Copy size={16} />
          <Text>{isCopied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={16} color="#fff" />
          <Text style={{ color: '#fff' }}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      {linkData.qrCodeUrl && (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: linkData.qrCodeUrl }}
            style={styles.qrCode}
          />
        </View>
      )}
    </View>
  );
}
```

---

## Component 4: Referrals Table

Paginated list of invited friends.

### Table Columns

| Column | Data |
|--------|------|
| Friend | `referredUser.fullName` or `referredUser.email` |
| Date Joined | `createdAt` formatted |
| Status | Badge: claimed (green), pending (amber), cancelled (red) |
| Earnings | `rewardAmount` |

### Mobile Implementation (FlatList)

```tsx
function ReferralsTable() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useReferralsList({ page, limit: 10 });

  const referrals = response?.referrals || [];
  const pagination = response?.pagination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: Referral }) => (
    <View style={styles.referralRow}>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName}>
          {item.referredUser?.fullName || item.referredUser?.email || 'User Joined'}
        </Text>
        <Text style={styles.referralEmail}>{item.referredUser?.email}</Text>
      </View>
      <Text style={styles.referralDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>
          {item.status === 'claimed' ? 'Success' : item.status}
        </Text>
      </View>
      <Text style={styles.referralAmount}>₦{item.rewardAmount}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.tableCard}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (referrals.length === 0) {
    return (
      <View style={styles.tableCard}>
        <Text style={styles.emptyText}>
          No referrals yet. Share your link to get started!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tableCard}>
      <Text style={styles.tableTitle}>Invited Friends</Text>
      <Text style={styles.tableSubtitle}>Track status of people you've invited.</Text>

      <FlatList
        data={referrals}
        keyExtractor={(item) => item.referralId}
        renderItem={renderItem}
        scrollEnabled={false}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
          >
            <Text>Previous</Text>
          </TouchableOpacity>
          <Text>Page {page} of {pagination.totalPages}</Text>
          <TouchableOpacity
            onPress={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            style={[styles.pageButton, page >= pagination.totalPages && styles.pageButtonDisabled]}
          >
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

---

## Component 5: Withdrawal Modal

Modal for withdrawing referral earnings to wallet.

### Features

- Shows available balance
- Amount input with validation (min ₦100, max ₦1,000,000)
- Cannot exceed available balance
- Transfers to main wallet

### Mobile Implementation

```tsx
function WithdrawalModal({
  visible,
  userType,
  onClose,
}: {
  visible: boolean;
  userType: 'referrer' | 'referred';
  onClose: () => void;
}) {
  const { data: balance, isLoading } = useAvailableBalanceV2(userType);
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawalV2();

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const availableAmount = balance?.totalAvailable || 0;

  useEffect(() => {
    if (visible) {
      setAmount(availableAmount.toString());
      setError('');
    }
  }, [visible, availableAmount]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      setError('Minimum withdrawal is ₦100');
      return;
    }
    if (numAmount > 1000000) {
      setError('Maximum withdrawal is ₦1,000,000');
      return;
    }
    if (numAmount > availableAmount) {
      setError('Amount exceeds available balance');
      return;
    }

    requestWithdrawal(
      { userType, amount: numAmount },
      {
        onSuccess: () => {
          onClose();
          setAmount('');
        },
      }
    );
  };

  const title = userType === 'referrer'
    ? 'Withdraw Referral Earnings'
    : 'Withdraw Signup Bonus';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>
            Transfer your earnings to your main wallet balance.
          </Text>

          {/* Available Balance */}
          <View style={styles.balanceDisplay}>
            <Text>Available to Withdraw:</Text>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.balanceValue}>
                ₦{availableAmount.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Amount Input */}
          <Text style={styles.inputLabel}>Amount to Withdraw</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />
          <Text style={styles.inputHint}>Minimum withdrawal amount is ₦100.</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Actions */}
          <TouchableOpacity
            style={[styles.confirmButton, (isPending || availableAmount < 100) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isPending || availableAmount < 100}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

---

## Component 6: Verification Reminder (Coming Soon)

Shows when referrals feature is disabled or user needs verification.

```tsx
function VerificationReminder() {
  return (
    <View style={styles.comingSoonContainer}>
      <View style={styles.sparkleIcon}>
        <Sparkles size={48} color="#8B5CF6" />
      </View>

      <Text style={styles.comingSoonTitle}>Coming Soon</Text>
      <Text style={styles.comingSoonText}>
        Our referral program is launching soon! You'll be able to earn
        rewards by referring friends and unlock exclusive bonuses.
      </Text>

      <TouchableOpacity style={styles.disabledButton} disabled>
        <Clock size={16} />
        <Text>Feature Coming Soon</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text>Back to Dashboard</Text>
      </TouchableOpacity>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Sparkles size={20} color="#8B5CF6" />
        <View>
          <Text style={styles.infoTitle}>What to expect?</Text>
          <Text style={styles.infoText}>
            Invite friends, earn cashback rewards, and get bonus perks when
            they make their first purchase!
          </Text>
        </View>
      </View>
    </View>
  );
}
```

---

## Complete Page Implementation

```tsx
// screens/ReferralsScreen.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useReferralStatsV2 } from '../hooks/useReferrals';

// Components
import { ReferralActionCard } from '../components/referrals/ReferralActionCard';
import { ReferralStatsCards } from '../components/referrals/ReferralStatsCards';
import { ReferralLinkSection } from '../components/referrals/ReferralLinkSection';
import { ReferralsTable } from '../components/referrals/ReferralsTable';
import { VerificationReminder } from '../components/referrals/VerificationReminder';
import { Skeleton } from '../components/Skeleton';

export function ReferralsScreen() {
  const { isLoading: isAuthLoading } = useAuth();
  const { error } = useReferralStatsV2();

  // Check if verification required (403 error)
  const isVerificationRequired = (error as any)?.response?.status === 403;

  // Loading state
  if (isAuthLoading) {
    return (
      <ScrollView style={styles.container}>
        <Skeleton height={40} width="33%" />
        <Skeleton height={120} style={{ marginTop: 16 }} />
        <Skeleton height={200} style={{ marginTop: 16 }} />
      </ScrollView>
    );
  }

  // Verification required / Coming Soon
  if (isVerificationRequired) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Referrals</Text>
          <Text style={styles.subtitle}>Earn rewards by referring friends</Text>
        </View>
        <VerificationReminder />
      </ScrollView>
    );
  }

  // Main content
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Referrals</Text>
        <Text style={styles.subtitle}>Earn rewards by referring friends</Text>
      </View>

      {/* Action Card (Claim/Withdraw) */}
      <ReferralActionCard />

      {/* Stats Cards */}
      <ReferralStatsCards />

      {/* Referral Link */}
      <ReferralLinkSection />

      {/* Referrals List */}
      <ReferralsTable />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
```

---

## API Service

```typescript
// services/referralService.ts
import { api } from '../lib/apiClient';

export const referralService = {
  // Stats
  getReferralStatsV2: () =>
    api.get('/dashboard/referrals/stats-v2'),

  // Balance
  getAvailableBalanceV2: (userType: 'referrer' | 'referred') =>
    api.get('/dashboard/referrals/available-balance-v2', { params: { type: userType } }),

  // Link
  getReferralLink: () =>
    api.get('/dashboard/referrals/link'),

  regenerateReferralCode: () =>
    api.post('/dashboard/referrals/link/regenerate'),

  deactivateReferralLink: () =>
    api.post('/dashboard/referrals/link/deactivate'),

  // List
  getReferrals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/dashboard/referrals/list-with-details', { params }),

  // Actions
  claimReferralBonusV2: () =>
    api.post('/dashboard/referrals/claim-v2'),

  requestWithdrawalV2: (data: { amount: number; userType: 'referrer' | 'referred' }) =>
    api.post('/dashboard/referrals/withdraw-v2', data),

  // Public (for registration)
  validateReferralCode: (code: string) =>
    api.get('/referral/code/validate', { params: { code } }),
};
```

---

## Summary

| Component | Hooks Used | Purpose |
|-----------|------------|---------|
| `ReferralActionCard` | `useReferralStatsV2`, `useAvailableBalanceV2`, `useClaimReferralBonusV2` | Claim/withdraw actions |
| `ReferralStatsCards` | `useReferralStatsV2`, `useAvailableBalanceV2` | Display 4 stat cards |
| `ReferralLinkSection` | `useReferralLink`, `useRegenerateReferralCode` | Copy/share referral link |
| `ReferralsTable` | `useReferralsList` | Paginated list of referrals |
| `WithdrawalModal` | `useAvailableBalanceV2`, `useRequestWithdrawalV2` | Withdraw to wallet |
| `VerificationReminder` | None | Coming soon placeholder |

### Icons Used

- `Gift`, `Wallet`, `Users`, `TrendingUp`, `Banknote`, `Clock`
- `Copy`, `Share2`, `RefreshCw`
- `Sparkles` (for coming soon)

### Dependencies

- `expo-clipboard` - For copy functionality
- `react-native` Share API - For native sharing
- `@tanstack/react-query` - For data fetching hooks
