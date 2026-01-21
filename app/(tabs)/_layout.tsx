import { Redirect, Tabs } from 'expo-router';
import { Briefcase, Home, Trophy, User, Users } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { lightColors } from '@/constants/palette';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isReseller = user?.role === 'reseller';

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color={lightColors.primary} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      key={isReseller ? 'reseller' : 'user'}
      screenOptions={{
        tabBarActiveTintColor: lightColors.primary, // #E69E19
        tabBarInactiveTintColor: lightColors.textSecondary, // #525D60
        tabBarStyle: {
          backgroundColor: '#FAFAFA', // card color
          borderTopWidth: 1,
          borderTopColor: '#D4D9DA', // border color
          // Height slightly taller for 5 item grid if needed, but 64 is fine
          height: 64, // h-16
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10, // Smaller font for 5 items
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
      
      {/* Reseller Tab - Only visible for resellers */}
      <Tabs.Screen
        name="reseller"
        options={{
          title: 'Reseller',
          href: isReseller ? '/reseller' : null,
          tabBarIcon: ({ color }) => <Briefcase size={20} color={color} />,
          tabBarItemStyle: { display: isReseller ? 'flex' : 'none' }
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
