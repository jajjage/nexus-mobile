import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Tabs, useSegments } from 'expo-router';
import { Briefcase, Home, Trophy, User, Users } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors, isDark } = useTheme();
  const isReseller = user?.role === 'reseller';
  const segments = useSegments();
  
  // Hide tab bar when on profile sub-screens (not the index)
  const isProfileSubScreen = segments.length > 2 && segments[1] === 'profile';

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[TabLayout] Not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect to setup if incomplete
  if (user && (!user.hasPin || !user.hasPasscode)) {
    console.log('[TabLayout] User incomplete setup, redirecting to setup:', JSON.stringify({
      hasPin: user.hasPin,
      hasPasscode: user.hasPasscode,
      userId: user.userId
    }, null, 2));
    return <Redirect href="/(setup)" />;
  }

  console.log('[TabLayout] User setup complete, rendering tabs');

  return (
    <Tabs
      key={isReseller ? 'reseller' : 'user'}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: isProfileSubScreen ? { display: 'none' } : {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: useClientOnlyValue(false, false),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="referral"
        options={{
          title: 'Referral',
          tabBarIcon: ({ color }) => <Users size={20} color={color} />,
        }}
      />
      
      {/* Reseller Hub Tab */}
      <Tabs.Screen
        name="reseller"
        options={{
          title: 'Reseller',
          href: isReseller ? '/reseller' : null,
          tabBarIcon: ({ color }) => <Briefcase size={20} color={color} />,
          tabBarItemStyle: { display: isReseller ? 'flex' : 'none' },
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color }) => <Trophy size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      {/* Hide the old 'two' tab */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

