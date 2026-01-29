import { useAuthContext } from "@/context/AuthContext";
import { authKeys } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { useBiometricRegistration } from '@/hooks/useBiometricRegistration';
import { useBiometricType } from '@/hooks/useBiometricType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, Fingerprint, ScanFace } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EnableBiometricScreen() {
  const { checkBiometricSupport } = useBiometricAuth();
  const { registerBiometric, isLoading: isEnrolling, error } = useBiometricRegistration();
  const { label, isAvailable } = useBiometricType();
  const theme = useTheme();
  const { updateUser, user, setIsLocalBiometricSetup } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<'checking' | 'ready' | 'success' | 'error'>('checking');

  // Check device support on mount
  useEffect(() => {
    async function check() {
      try {
        const { hasHardware, isEnrolled } = await checkBiometricSupport();
        
        if (!hasHardware || !isEnrolled) {
          // Device doesn't support or user hasn't enrolled biometric
          console.warn('[EnableBiometric] Device not ready for biometric');
          setState('error');
          return;
        }
        
        setState('ready');
      } catch (err) {
        console.error('[EnableBiometric] Error checking support:', err);
        setState('error');
      }
    }
    check();
  }, []);

  const handleEnable = async () => {
    try {
      console.log('[EnableBiometric] Starting enrollment');
      const result = await registerBiometric();
      
      if (result.success && result.enrolled) {
        // Mark biometric as completed for this user
        console.log('[EnableBiometric] Enrollment successful, updating user state');
        
        // Invalidate queries to ensure we have fresh data (e.g. pin/passcode status)
        console.log('[EnableBiometric] Invalidating user query...');
        await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
        console.log('[EnableBiometric] Query invalidated. Current user state:', JSON.stringify({
           hasPin: user?.hasPin,
           hasPasscode: user?.hasPasscode,
           hasBiometric: user?.hasBiometric,
           userId: user?.userId
        }, null, 2));
        
        updateUser({ hasBiometric: true });
        
        // Save to local storage as well for quick reference
        await AsyncStorage.setItem('biometric_enrolled', 'true');
        await AsyncStorage.setItem('biometric_setup_completed', 'true');
        setIsLocalBiometricSetup(true);
        
        setState('success');
        // Redirect directly to dashboard - all setup is complete
        console.log('[EnableBiometric] Redirecting directly to dashboard');
        router.replace('/(tabs)');
      } else {
        setState('error');
        Alert.alert('Enrollment Failed', result.message);
      }
    } catch (err: any) {
      console.error('[EnableBiometric] Enrollment error:', err);
      setState('error');
      Alert.alert('Error', err.message || 'Biometric enrollment failed');
    }
  };

  const handleSkip = async () => {
    try {
      console.log('[EnableBiometric] User skipped biometric');
      
      // Invalidate queries to ensure we have fresh data
      console.log('[EnableBiometric] ID:SKIP Invalidating user query...');
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      console.log('[EnableBiometric] ID:SKIP Query invalidated. Current user state:', JSON.stringify({
           hasPin: user?.hasPin,
           hasPasscode: user?.hasPasscode,
           hasBiometric: user?.hasBiometric
        }, null, 2));
      
      // Mark biometric as skipped (don't show again)
      updateUser({ hasBiometric: true }); // Set to true so we don't ask again
      await AsyncStorage.setItem('biometric_setup_completed', 'true');
      await AsyncStorage.setItem('biometric_skipped', 'true');
      setIsLocalBiometricSetup(true);
      // Go directly to dashboard
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[EnableBiometric] Error during skip:', err);
      // Even on error, proceed to dashboard - biometric is optional
      router.replace('/(tabs)');
    }
  };

  if (state === 'checking') {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Checking biometric support...</Text>
      </SafeAreaView>
    );
  }

  if (state === 'error' && !isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ marginBottom: 24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230, 158, 25, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <AlertCircle size={40} color={theme.colors.notification} />
          </View>
          
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12, textAlign: 'center' }}>
            Biometric Not Available
          </Text>
          <Text style={{ color: theme.colors.text, marginBottom: 32, textAlign: 'center', opacity: 0.7 }}>
            Your device doesn't have biometric authentication set up. You can continue to use PIN for security.
          </Text>
          
          <TouchableOpacity
            onPress={handleSkip}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text style={{ color: '#FFFDF7', fontSize: 16, fontWeight: '600' }}>Continue to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'success') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ marginBottom: 24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <CheckCircle2 size={40} color="#4CAF50" />
          </View>
          
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12, textAlign: 'center' }}>
            Biometric Enabled!
          </Text>
          <Text style={{ color: theme.colors.text, marginBottom: 32, textAlign: 'center', opacity: 0.7 }}>
            Your {label} has been successfully set up. You can now use it to unlock your app and verify transactions.
          </Text>
          
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.text, marginTop: 16, opacity: 0.6 }}>Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ marginBottom: 24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230, 50, 50, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <AlertCircle size={40} color={theme.colors.notification} />
          </View>
          
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12, textAlign: 'center' }}>
            Enrollment Failed
          </Text>
          <Text style={{ color: theme.colors.text, marginBottom: 32, textAlign: 'center', opacity: 0.7 }}>
            {error?.message || 'There was an error setting up biometric authentication. You can try again or continue with PIN.'}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity
              onPress={handleEnable}
              disabled={isEnrolling}
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                opacity: isEnrolling ? 0.5 : 1,
              }}
            >
              {isEnrolling ? (
                <ActivityIndicator size="small" color="#FFFDF7" />
              ) : (
                <Text style={{ color: '#FFFDF7', fontSize: 14, fontWeight: '600' }}>Try Again</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSkip}
              style={{
                flex: 1,
                backgroundColor: theme.colors.border,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Ready state - show enrollment prompt
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ marginBottom: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230, 158, 25, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
          {label === 'Face ID' ? (
            <ScanFace size={40} color={theme.colors.primary} />
          ) : (
            <Fingerprint size={40} color={theme.colors.primary} />
          )}
        </View>
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12, textAlign: 'center' }}>
          Enable {label}
        </Text>
        <Text style={{ fontSize: 16, color: theme.colors.text, marginBottom: 40, textAlign: 'center', opacity: 0.7 }}>
          Use {label} for faster and more secure access to your account and to verify transactions.
        </Text>
        
        <TouchableOpacity
          onPress={handleEnable}
          disabled={isEnrolling}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            width: '100%',
            marginBottom: 16,
            opacity: isEnrolling ? 0.6 : 1,
          }}
        >
          {isEnrolling ? (
            <ActivityIndicator size="small" color="#FFFDF7" />
          ) : (
            <Text style={{ color: '#FFFDF7', fontWeight: '600', fontSize: 16 }}>Enable {label}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          disabled={isEnrolling}
          style={{
            paddingVertical: 16,
            alignItems: 'center',
            width: '100%',
            opacity: isEnrolling ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 16, opacity: 0.7 }}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
