import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Gift, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RewardsScreen() {
  const { user, isLoading, refetch: refetchUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchUser();
    setRefreshing(false);
  }, [refetchUser]);

  // Loading state
  if (isLoading || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.padding}>
           <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cashback Rewards</Text>
           <Skeleton height={180} borderRadius={16} />
           <View style={styles.statsRow}>
             <Skeleton height={100} width="48%" borderRadius={12} />
             <Skeleton height={100} width="48%" borderRadius={12} />
           </View>
           <Skeleton height={200} borderRadius={12} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  // Extract cashback data from user
  const cashbackBalance = user.cashback?.availableBalance || 0;
  const totalEarned = user.cashback?.totalEarned || 0;
  const totalUsed = user.cashback?.totalRedeemed || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cashback Rewards</Text>

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
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(230, 158, 25, 0.2)' : 'rgba(230, 158, 25, 0.1)' }]}>
              <TrendingUp size={20} color="#e69e19" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Earned</Text>
            <Text style={[styles.statAmount, { color: colors.foreground }]}>
              ₦{totalEarned.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(230, 158, 25, 0.2)' : 'rgba(230, 158, 25, 0.1)' }]}>
              <Gift size={20} color="#e69e19" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Used</Text>
            <Text style={[styles.statAmount, { color: colors.foreground }]}>
              ₦{totalUsed.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Sponsored Offers */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sponsored Offers</Text>

        {/* Ad Card 1 */}
        <View style={[styles.adCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.adGradient}>
            <Text style={styles.adTitle}>Earn 10% Cashback</Text>
            <Text style={styles.adSubtitle}>On all data purchases this week</Text>
          </LinearGradient>
          <View style={styles.adBody}>
            <Text style={[styles.adDescription, { color: colors.textSecondary }]}>
              Limited time offer for our premium users
            </Text>
            <TouchableOpacity style={[styles.adButton, { borderColor: colors.border }]}>
              <Text style={[styles.adButtonText, { color: colors.foreground }]}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ad Card 2 */}
        <View style={[styles.adCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.adGradient}>
            <Text style={styles.adTitle}>Double Cashback Day</Text>
            <Text style={styles.adSubtitle}>Earn double cashback on airtime</Text>
          </LinearGradient>
          <View style={styles.adBody}>
            <Text style={[styles.adDescription, { color: colors.textSecondary }]}>
              Special promotion valid until end of month
            </Text>
            <TouchableOpacity style={[styles.adButton, { borderColor: colors.border }]}>
              <Text style={[styles.adButtonText, { color: colors.foreground }]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.howItWorksTitle, { color: colors.foreground }]}>How Cashback Works</Text>
          <Text style={[styles.howItWorksSubtitle, { color: colors.textSecondary }]}>
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
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  padding: {
    padding: 16,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    borderRadius: 24,
    padding: 12,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
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
    marginTop: 8,
  },
  adCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
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
    fontSize: 14,
    marginBottom: 12,
  },
  adButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adButtonText: {
    fontWeight: '500',
  },
  howItWorksCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  howItWorksSubtitle: {
    fontSize: 14,
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
  },
});
