import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyPasscode } from '@/hooks/usePasscode';
import { useSecurityVerification } from '@/hooks/useSecurityVerification';
import { Fingerprint, Lock, ScanFace } from 'lucide-react-native';

import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const verifyPasscode = useVerifyPasscode();
  const [passcodeInput, setPasscodeInput] = useState('');
  
  const { startVerification, showPinPad, isVerifying, verificationError, setVerificationError, closePinPad } = useSecurityVerification({
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
    // Attempt biometric unlock on mount
    startVerification();
  }, [startVerification]);

  // Get biometric icon based on platform
  const BiometricIcon = Platform.OS === 'ios' ? () => <ScanFace size={40} color={colors.primary} /> : () => <Fingerprint size={40} color={colors.primary} />;


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
            <BiometricIcon />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 24, textAlign: 'center' }}>
            Tap to unlock with biometric
          </Text>
        </View>

        {/* Unlock Button */}
        {!showPinPad && (
          <>
            <TouchableOpacity 
              onPress={() => startVerification()}
              style={{ 
                backgroundColor: colors.primary, 
                paddingVertical: 14, 
                paddingHorizontal: 40, 
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 20,
                width: '100%'
              }}
            >
              <BiometricIcon />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Unlock with Biometric
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPasscodeInput('')}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Use Passcode Instead
              </Text>
            </TouchableOpacity>
          </>
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
            />
            <TouchableOpacity 
              onPress={() => {
                if (passcodeInput.length === 6) {
                  verifyPasscode.mutateAsync({ passcode: passcodeInput, intent: 'unlock' });
                } else {
                  setVerificationError('Please enter 6 digits');
                }
              }}
              disabled={passcodeInput.length !== 6 || isVerifying}
              style={{ 
                backgroundColor: passcodeInput.length === 6 ? colors.primary : colors.muted, 
                paddingVertical: 14, 
                paddingHorizontal: 32, 
                borderRadius: 10,
                width: '100%',
                alignItems: 'center',
                marginBottom: 12
              }}
            >
              <Text style={{ color: passcodeInput.length === 6 ? '#fff' : colors.mutedForeground, fontWeight: '600', fontSize: 16 }}>
                Unlock
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setPasscodeInput('');
                setVerificationError(null);
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
