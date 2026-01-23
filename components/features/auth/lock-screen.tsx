import { useAuth } from '@/hooks/useAuth';
import { useVerifyPasscode } from '@/hooks/usePasscode';
import { useSecurityVerification } from '@/hooks/useSecurityVerification';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Lock } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const { user } = useAuth();
  const verifyPasscode = useVerifyPasscode();
  
  const { startVerification, showPinPad, handlePinSubmit, isVerifying, verificationError, setVerificationError } = useSecurityVerification({
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
  const biometricIcon = Platform.OS === 'ios' ? 'face-id' : 'fingerprint';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F8F8F8', zIndex: 9999 }]}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Lock Icon */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230, 158, 25, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Lock size={40} color="#E69E19" />
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 50 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {/* Biometric Icon */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230, 158, 25, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <FontAwesome name={biometricIcon as any} size={40} color="#E69E19" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 24, textAlign: 'center' }}>
            Tap to unlock with {Platform.OS === 'ios' ? 'Face ID' : 'fingerprint'}
          </Text>
        </View>

        {/* Unlock Button */}
        {!showPinPad && (
          <>
            <TouchableOpacity 
              onPress={() => startVerification()}
              style={{ 
                backgroundColor: '#E69E19', 
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
              <FontAwesome name={biometricIcon as any} size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Unlock with {Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => startVerification()}>
              <Text style={{ color: '#E69E19', fontSize: 14, fontWeight: '600' }}>
                Use Passcode Instead
              </Text>
            </TouchableOpacity>
          </>
        )}

        {showPinPad && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#E63636', marginBottom: 20, minHeight: 20, fontSize: 14 }}>
              {verificationError}
            </Text>
            <TouchableOpacity 
              onPress={() => startVerification()}
              style={{ 
                backgroundColor: '#E69E19', 
                paddingVertical: 14, 
                paddingHorizontal: 32, 
                borderRadius: 10,
                width: '100%',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Retry Authentication
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
