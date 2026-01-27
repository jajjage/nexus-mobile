import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyPasscode } from '@/hooks/usePasscode';
import { useSecurityVerification } from '@/hooks/useSecurityVerification';
import { Fingerprint, Lock, ScanFace } from 'lucide-react-native';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const verifyPasscode = useVerifyPasscode();
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [hasAttemptedBiometric, setHasAttemptedBiometric] = useState(false);
  
  const { startVerification, showPinPad, isVerifying, verificationError, setVerificationError, closePinPad, openPinPad } = useSecurityVerification({
    onBiometricSuccess: onUnlock,
    onPinSubmit: async (pin) => {
      try {
        await verifyPasscode.mutateAsync({ passcode: pin, intent: 'unlock' });
        onUnlock();
      } catch (error) {
        setVerificationError('Invalid passcode');
      }
    }
  });

  useEffect(() => {
    // Attempt biometric unlock on mount only once
    if (!hasAttemptedBiometric) {
      setHasAttemptedBiometric(true);
      startVerification();
    }
  }, []);

  // Get biometric icon based on platform
  const BiometricIcon = ({ size = 40 }: { size?: number }) => 
    Platform.OS === 'ios' ? 
      <ScanFace size={size} color={colors.primary} /> : 
      <Fingerprint size={size} color={colors.primary} />;


  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999 }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Lock Icon */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `rgba(230, 158, 25, 0.15)`, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Lock size={40} color={colors.primary} />
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 50 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {/* Biometric Icon */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <TouchableOpacity 
            onPress={() => startVerification()}
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `rgba(230, 158, 25, 0.15)`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}
          >
            <BiometricIcon size={40} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 24, textAlign: 'center' }}>
            Tap to unlock with biometric
          </Text>
        </View>

        {/* Unlock Button */}
        {!showPinPad && (
          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => startVerification()}
              style={{ 
                backgroundColor: colors.primary, 
                paddingVertical: 12, 
                paddingHorizontal: 20, 
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <BiometricIcon size={20} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                Unlock with Biometric
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => openPinPad()}
              style={{
                paddingVertical: 12,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                Use Passcode Instead
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showPinPad && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {verificationError && (
              <Text style={{ color: colors.destructive, marginBottom: 20, fontSize: 14 }}>
                {verificationError}
              </Text>
            )}
            <TextInput
              style={{
                width: '100%',
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.card,
                fontSize: 18,
                letterSpacing: 2,
                textAlign: 'center',
              }}
              placeholder="Enter 6-digit passcode"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              value={passcodeInput}
              onChangeText={(text) => {
                setPasscodeInput(text);
                setVerificationError(null);
              }}
              editable={!isVerifyingPasscode}
            />
            <TouchableOpacity 
              onPress={async () => {
                if (passcodeInput.length === 6) {
                  setIsVerifyingPasscode(true);
                  try {
                    await verifyPasscode.mutateAsync({ passcode: passcodeInput, intent: 'unlock' });
                    onUnlock();
                  } catch (error) {
                    setVerificationError('Invalid passcode');
                    setIsVerifyingPasscode(false);
                  }
                } else {
                  setVerificationError('Please enter 6 digits');
                }
              }}
              disabled={passcodeInput.length !== 6 || isVerifyingPasscode}
              style={{ 
                backgroundColor: passcodeInput.length === 6 ? colors.primary : colors.muted, 
                paddingVertical: 14, 
                paddingHorizontal: 32, 
                borderRadius: 10,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 12,
                opacity: (passcodeInput.length === 6 && !isVerifyingPasscode) ? 1 : 0.6
              }}
            >
              {isVerifyingPasscode && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ color: passcodeInput.length === 6 ? '#fff' : colors.mutedForeground, fontWeight: '600', fontSize: 16 }}>
                {isVerifyingPasscode ? 'Unlocking...' : 'Unlock'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setPasscodeInput('');
                setVerificationError(null);
                setIsVerifyingPasscode(false);
                closePinPad();
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Back to Biometric
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
