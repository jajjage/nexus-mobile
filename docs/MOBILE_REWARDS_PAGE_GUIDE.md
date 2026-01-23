# Mobile Rewards Page Guide (Cashback)

> **Target Audience**: React Native/Expo Mobile Developers
> **Purpose**: Replicate the Cashback Rewards page UI and functionality

---

## Overview

The **Rewards page** displays the user's **cashback balance and history**. It is a simple, read-only page that shows cashback data from the user object.

> [!NOTE]
> This page is **NOT** related to the Referrals system. Referrals have their own separate page at `/dashboard/referrals`.

---

## Page Location & Route

| Web | Mobile Equivalent |
|-----|-------------------|
| `/dashboard/rewards` | `/(tabs)/rewards` or similar |

---

## Data Source

All cashback data comes from the **user object** via `useAuth()` hook. No separate API call is needed.

```typescript
// From useAuth hook
const { user, isLoading } = useAuth();

// Cashback data accessed from user object
const cashbackBalance = user?.cashback?.availableBalance || 0;
const totalEarned = user?.cashback?.totalEarned || 0;
const totalUsed = user?.cashback?.totalRedeemed || 0;
```

### User Cashback Type

```typescript
interface UserCashback {
  availableBalance: number;  // Current balance available to use
  totalEarned: number;       // Lifetime earnings
  totalRedeemed: number;     // Total amount used/redeemed
}

interface User {
  // ... other fields
  cashback?: UserCashback;
}
```

---

## UI Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    REWARDS PAGE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       HEADER: "Cashback Rewards"                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    MAIN CASHBACK CARD (Gradient Background)         │   │
│  │    ┌───────────────────────────────────────────┐    │   │
│  │    │         [Coins Icon]                       │    │   │
│  │    │    "Available Cashback"                    │    │   │
│  │    │        ₦XX,XXX.XX                          │    │   │
│  │    └───────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   TOTAL EARNED     │  │    TOTAL USED      │            │
│  │   [TrendingUp]     │  │    [Gift]          │            │
│  │   ₦XX,XXX.XX       │  │   ₦XX,XXX.XX       │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    SPONSORED OFFERS SECTION                         │   │
│  │    ┌───────────────────────────────────────────┐    │   │
│  │    │  Ad Card 1: "Earn 10% Cashback"           │    │   │
│  │    │  Purple/Pink gradient                      │    │   │
│  │    └───────────────────────────────────────────┘    │   │
│  │    ┌───────────────────────────────────────────┐    │   │
│  │    │  Ad Card 2: "Double Cashback Day"         │    │   │
│  │    │  Blue/Cyan gradient                        │    │   │
│  │    └───────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    HOW IT WORKS SECTION                             │   │
│  │    1. Make a Purchase                               │   │
│  │    2. Earn Cashback                                 │   │
│  │    3. Use Cashback                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Bottom Navigation Bar]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header

```tsx
<View style={styles.header}>
  <Text style={styles.headerTitle}>Cashback Rewards</Text>
</View>
```

### 2. Main Cashback Card (Gradient)

Primary card with gradient background showing available balance.

```tsx
<LinearGradient
  colors={['#e69e19', '#d4891a']}  // Primary color gradient
  style={styles.mainCard}
>
  <View style={styles.iconContainer}>
    <Coins size={40} color="#fff" />
  </View>
  <Text style={styles.cardLabel}>Available Cashback</Text>
  <Text style={styles.cardAmount}>
    ₦{cashbackBalance.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </Text>
</LinearGradient>
```

### 3. Stats Row (2 columns)

```tsx
<View style={styles.statsRow}>
  {/* Total Earned Card */}
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>
      <TrendingUp size={20} color="#e69e19" />
    </View>
    <Text style={styles.statLabel}>Total Earned</Text>
    <Text style={styles.statAmount}>
      ₦{totalEarned.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
    </Text>
  </View>

  {/* Total Used Card */}
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>
      <Gift size={20} color="#e69e19" />
    </View>
    <Text style={styles.statLabel}>Total Used</Text>
    <Text style={styles.statAmount}>
      ₦{totalUsed.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
    </Text>
  </View>
</View>
```

### 4. Sponsored Offers Section

Static promotional cards (currently hardcoded).

```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Sponsored Offers</Text>

  {/* Ad Card 1 */}
  <View style={styles.adCard}>
    <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.adHeader}>
      <Text style={styles.adTitle}>Earn 10% Cashback</Text>
      <Text style={styles.adSubtitle}>On all data purchases this week</Text>
    </LinearGradient>
    <View style={styles.adBody}>
      <Text style={styles.adDescription}>
        Limited time offer for our premium users
      </Text>
      <TouchableOpacity style={styles.learnMoreButton}>
        <Text>Learn More</Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* Ad Card 2 */}
  <View style={styles.adCard}>
    <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.adHeader}>
      <Text style={styles.adTitle}>Double Cashback Day</Text>
      <Text style={styles.adSubtitle}>Earn double cashback on airtime</Text>
    </LinearGradient>
    <View style={styles.adBody}>
      <Text style={styles.adDescription}>
        Special promotion valid until end of month
      </Text>
      <TouchableOpacity style={styles.learnMoreButton}>
        <Text>View Details</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
```

### 5. How It Works Section

```tsx
<View style={styles.howItWorksCard}>
  <Text style={styles.howItWorksTitle}>How Cashback Works</Text>
  <Text style={styles.howItWorksSubtitle}>
    Earn cashback on every transaction
  </Text>

  <View style={styles.stepsList}>
    {/* Step 1 */}
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>1</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Make a Purchase</Text>
        <Text style={styles.stepDescription}>
          Buy airtime, data, or pay bills
        </Text>
      </View>
    </View>

    {/* Step 2 */}
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>2</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Earn Cashback</Text>
        <Text style={styles.stepDescription}>
          Get percentage back as cashback
        </Text>
      </View>
    </View>

    {/* Step 3 */}
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>3</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Use Cashback</Text>
        <Text style={styles.stepDescription}>
          Apply to future purchases
        </Text>
      </View>
    </View>
  </View>
</View>
```

---

## Loading State

Show skeleton placeholders while `isLoading` is true:

```tsx
if (isLoading || !user) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cashback Rewards</Text>
      </View>

      {/* Main card skeleton */}
      <Skeleton style={styles.mainCardSkeleton} />

      {/* Stats row skeleton */}
      <View style={styles.statsRow}>
        <Skeleton style={styles.statCardSkeleton} />
        <Skeleton style={styles.statCardSkeleton} />
      </View>

      {/* Content skeletons */}
      <Skeleton style={styles.contentSkeleton} />
      <Skeleton style={styles.contentSkeleton} />
    </View>
  );
}
```

---

## Complete Screen Implementation

```tsx
// screens/RewardsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, TrendingUp, Gift } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { Skeleton } from '../components/Skeleton';

export function RewardsScreen() {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading || !user) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Cashback Rewards</Text>
        <Skeleton height={180} borderRadius={16} />
        <View style={styles.statsRow}>
          <Skeleton height={100} width="48%" borderRadius={12} />
          <Skeleton height={100} width="48%" borderRadius={12} />
        </View>
        <Skeleton height={200} borderRadius={12} />
      </ScrollView>
    );
  }

  // Extract cashback data from user
  const cashbackBalance = user.cashback?.availableBalance || 0;
  const totalEarned = user.cashback?.totalEarned || 0;
  const totalUsed = user.cashback?.totalRedeemed || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.headerTitle}>Cashback Rewards</Text>

      {/* Main Cashback Card */}
      <LinearGradient
        colors={['#e69e19', '#d4891a']}
        style={styles.mainCard}
      >
        <View style={styles.iconCircle}>
          <Coins size={40} color="#fff" />
        </View>
        <Text style={styles.mainCardLabel}>Available Cashback</Text>
        <Text style={styles.mainCardAmount}>
          ₦{cashbackBalance.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(230, 158, 25, 0.1)' }]}>
            <TrendingUp size={20} color="#e69e19" />
          </View>
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={styles.statAmount}>
            ₦{totalEarned.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(230, 158, 25, 0.1)' }]}>
            <Gift size={20} color="#e69e19" />
          </View>
          <Text style={styles.statLabel}>Total Used</Text>
          <Text style={styles.statAmount}>
            ₦{totalUsed.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Sponsored Offers */}
      <Text style={styles.sectionTitle}>Sponsored Offers</Text>

      {/* Ad Card 1 */}
      <View style={styles.adCard}>
        <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.adGradient}>
          <Text style={styles.adTitle}>Earn 10% Cashback</Text>
          <Text style={styles.adSubtitle}>On all data purchases this week</Text>
        </LinearGradient>
        <View style={styles.adBody}>
          <Text style={styles.adDescription}>
            Limited time offer for our premium users
          </Text>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ad Card 2 */}
      <View style={styles.adCard}>
        <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.adGradient}>
          <Text style={styles.adTitle}>Double Cashback Day</Text>
          <Text style={styles.adSubtitle}>Earn double cashback on airtime</Text>
        </LinearGradient>
        <View style={styles.adBody}>
          <Text style={styles.adDescription}>
            Special promotion valid until end of month
          </Text>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>How Cashback Works</Text>
        <Text style={styles.howItWorksSubtitle}>
          Earn cashback on every transaction
        </Text>

        {[
          { step: 1, title: 'Make a Purchase', desc: 'Buy airtime, data, or pay bills' },
          { step: 2, title: 'Earn Cashback', desc: 'Get percentage back as cashback' },
          { step: 3, title: 'Use Cashback', desc: 'Apply to future purchases' },
        ].map((item) => (
          <View key={item.step} style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{item.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
  },
  mainCardLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainCardAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statIcon: {
    borderRadius: 24,
    padding: 12,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  adCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  adGradient: {
    padding: 24,
  },
  adTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  adSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  adBody: {
    padding: 16,
  },
  adDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  adButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adButtonText: {
    fontWeight: '500',
  },
  howItWorksCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 100, // Space for bottom nav
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  howItWorksSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e69e19',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
});
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Data Source** | `user.cashback` from `useAuth()` hook |
| **API Calls** | None specific - uses existing user profile |
| **Icons Used** | `Coins`, `TrendingUp`, `Gift` from lucide |
| **Dependencies** | `expo-linear-gradient` for gradient cards |
| **Navigation** | Part of bottom tab navigation |

> [!TIP]
> The sponsored offers are currently **static/hardcoded**. In the future, these could be fetched from an API endpoint for dynamic promotions.
