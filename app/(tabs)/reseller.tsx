import { lightColors } from '@/constants/palette';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';
import { Store } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResellerScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Security check: if not a reseller, redirect to home
  // This handles manual navigation attempts
  if (user?.role !== 'reseller') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Store size={32} color={lightColors.primary} />
        </View>
        <Text style={styles.title}>Reseller Hub</Text>
        <Text style={styles.description}>
          Welcome to your reseller dashboard. Tools and analytics coming soon.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: lightColors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: lightColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
