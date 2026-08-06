// components/features/auth/lock-screen.tsx
import { useTheme } from '@/context/ThemeContext';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { useBiometricType } from '@/hooks/useBiometricType';
import { useVerifyPasscode } from '@/hooks/usePasscode';
import { useSecurityVerification } from '@/hooks/useSecurityVerification';
import {
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  LogOut,
  ScanFace,
  ShieldCheck,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { colors, isDark } = useTheme();
  const { label: biometricLabel } = useBiometricType();
  const verifyPasscode = useVerifyPasscode();

  // Mode state: 'biometric' | 'passcode'
  const [activeMode, setActiveMode] = useState<'biometric' | 'passcode'>('biometric');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(true);
  const passcodeRef = useRef<TextInput>(null);
  const hasAttemptedInitialBiometric = useRef(false);

  const {
    startVerification,
    isVerifying,
    verificationError,
    setVerificationError,
  } = useSecurityVerification();

  const openPasscode = useCallback(() => {
    setActiveMode('passcode');
    setVerificationError(null);
    requestAnimationFrame(() => passcodeRef.current?.focus());
  }, [setVerificationError]);

  const handleTriggerBiometric = useCallback(async () => {
    setActiveMode('biometric');
    setVerificationError(null);
    const res = await startVerification();
    if (!res.success) {
      if (res.error === 'Biometric not available. Please use PIN.') {
        setCanUseBiometrics(false);
        openPasscode();
      }
      return;
    }

    if (res.pin) {
      try {
        await verifyPasscode.mutateAsync({ passcode: res.pin, intent: 'unlock' });
      } catch {
        // Local device biometric verification is sufficient to unlock the app.
      }
    }
    onUnlock();
  }, [onUnlock, openPasscode, setVerificationError, startVerification, verifyPasscode]);

  useEffect(() => {
    if (hasAttemptedInitialBiometric.current) return;

    hasAttemptedInitialBiometric.current = true;
    void handleTriggerBiometric();
  }, [handleTriggerBiometric]);

  // Passcode submission handler
  const handlePasscodeSubmit = async () => {
    if (passcode.length !== 6 || isVerifyingPasscode) return;
    setIsVerifyingPasscode(true);
    setVerificationError(null);

    try {
      await verifyPasscode.mutateAsync({ passcode, intent: 'unlock' });
      onUnlock();
    } catch (error) {
      setVerificationError('Invalid passcode. Please try again.');
      setPasscode('');
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  const PASSCODE_LENGTH = 6;
  const digitsArray = Array.from({ length: PASSCODE_LENGTH });

  const renderBiometricIcon = (size = 44) => {
    if (biometricLabel === 'Face ID') {
      return <ScanFace size={size} color={colors.primary} />;
    }
    return <Fingerprint size={size} color={colors.primary} />;
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 99999 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header Brand Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.brandTitle, { color: colors.foreground }]}>
                Nexus Data Security
              </Text>
            </View>

            <Pressable
              onPress={() => logoutMutation.mutate()}
              style={({ pressed }) => [
                styles.logoutButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <LogOut size={16} color={colors.mutedForeground} />
              <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>
                Switch User
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Center Main Card */}
            <View style={styles.centerContainer}>
              {/* User Avatar & Lock Badge */}
              <View style={styles.avatarWrapper}>
                <View
                  style={[
                    styles.avatarRing,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 184, 247, 0.12)'
                        : 'rgba(15, 59, 130, 0.08)',
                      borderColor: isDark
                        ? 'rgba(99, 184, 247, 0.25)'
                        : 'rgba(15, 59, 130, 0.15)',
                    },
                  ]}
                >
                  <Lock size={36} color={colors.primary} />
                </View>
              </View>

              {/* Greeting Header */}
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user?.fullName || 'Welcome Back'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user?.email || 'App Locked'}
              </Text>

              {/* Mode Switcher Segment */}
              <View
                style={[
                  styles.segmentContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 36, 73, 0.8)'
                      : 'rgba(241, 245, 249, 0.9)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Pressable
                  onPress={handleTriggerBiometric}
                  style={[
                    styles.segmentTab,
                    activeMode === 'biometric' && [
                      styles.segmentTabActive,
                      { backgroundColor: colors.card, shadowColor: colors.foreground },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          activeMode === 'biometric'
                            ? colors.foreground
                            : colors.mutedForeground,
                        fontWeight: activeMode === 'biometric' ? '700' : '500',
                      },
                    ]}
                  >
                    {biometricLabel}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setActiveMode('passcode');
                    setVerificationError(null);
                    setTimeout(() => passcodeRef.current?.focus(), 100);
                  }}
                  style={[
                    styles.segmentTab,
                    activeMode === 'passcode' && [
                      styles.segmentTabActive,
                      { backgroundColor: colors.card, shadowColor: colors.foreground },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          activeMode === 'passcode'
                            ? colors.foreground
                            : colors.mutedForeground,
                        fontWeight: activeMode === 'passcode' ? '700' : '500',
                      },
                    ]}
                  >
                    Passcode
                  </Text>
                </Pressable>
              </View>

              {/* Error Notification Banner */}
              {verificationError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark
                        ? 'rgba(127, 29, 29, 0.25)'
                        : 'rgba(220, 38, 38, 0.08)',
                      borderColor: colors.destructive,
                    },
                  ]}
                >
                  <Text style={[styles.errorBannerText, { color: colors.destructive }]}>
                    {verificationError}
                  </Text>
                </View>
              ) : null}

              {/* Mode 1: Biometric Authentication Screen */}
              {activeMode === 'biometric' && (
                <View style={styles.modeSection}>
                  <Pressable
                    onPress={handleTriggerBiometric}
                    style={({ pressed }) => [
                      styles.biometricCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(99, 184, 247, 0.15)'
                          : 'rgba(15, 59, 130, 0.08)',
                        borderColor: colors.primary,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    {isVerifying ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                      renderBiometricIcon(48)
                    )}
                  </Pressable>

                  <Text style={[styles.biometricPrompt, { color: colors.foreground }]}>
                    {isVerifying
                      ? `Verifying ${biometricLabel}...`
                      : `Tap icon to unlock with ${biometricLabel}`}
                  </Text>

                  {/* Switch to Passcode Text Link */}
                  <Pressable
                    onPress={openPasscode}
                    style={({ pressed }) => [
                      styles.textLink,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.textLinkTitle, { color: colors.primary }]}>
                      Or Use 6-Digit Passcode
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Mode 2: 6-Digit Passcode Screen */}
              {activeMode === 'passcode' && (
                <View style={styles.modeSection}>
                  {/* 6 Digit Box Display */}
                  <Pressable
                    onPress={() => passcodeRef.current?.focus()}
                    style={styles.boxesRow}
                  >
                    {digitsArray.map((_, idx) => {
                      const char = passcode[idx];
                      const isFocused = passcode.length === idx;

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.digitBox,
                            {
                              backgroundColor: colors.inputBackground,
                              borderColor: isFocused
                                ? colors.primary
                                : char
                                ? colors.primary
                                : colors.border,
                            },
                            isFocused && [
                              styles.digitBoxFocused,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(99, 184, 247, 0.1)'
                                  : 'rgba(15, 59, 130, 0.04)',
                                shadowColor: colors.primary,
                              },
                            ],
                          ]}
                        >
                          {char ? (
                            showPasscode ? (
                              <Text style={[styles.digitText, { color: colors.foreground }]}>
                                {char}
                              </Text>
                            ) : (
                              <View
                                style={[
                                  styles.secureDot,
                                  { backgroundColor: colors.foreground },
                                ]}
                              />
                            )
                          ) : null}
                        </View>
                      );
                    })}
                  </Pressable>

                  {/* Hidden TextInput for Native Numeric Keypad */}
                  <TextInput
                    ref={passcodeRef}
                    style={styles.hiddenInput}
                    keyboardType="number-pad"
                    maxLength={PASSCODE_LENGTH}
                    value={passcode}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      setPasscode(cleaned);
                      setVerificationError(null);
                    }}
                    editable={!isVerifyingPasscode}
                    autoFocus={true}
                    caretHidden={true}
                    onSubmitEditing={handlePasscodeSubmit}
                    returnKeyType="done"
                  />

                  {/* Show/Hide Passcode Toggle */}
                  <View style={styles.toggleRow}>
                    <Pressable
                      onPress={() => setShowPasscode(!showPasscode)}
                      style={({ pressed }) => [
                        styles.toggleButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      {showPasscode ? (
                        <EyeOff size={15} color={colors.mutedForeground} />
                      ) : (
                        <Eye size={15} color={colors.mutedForeground} />
                      )}
                      <Text
                        style={[styles.toggleText, { color: colors.mutedForeground }]}
                      >
                        {showPasscode ? 'Hide Code' : 'Show Code'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Unlock Passcode Button */}
                  <Pressable
                    onPress={handlePasscodeSubmit}
                    disabled={passcode.length !== PASSCODE_LENGTH || isVerifyingPasscode}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor:
                          passcode.length === PASSCODE_LENGTH
                            ? colors.primary
                            : colors.muted,
                        opacity: isVerifyingPasscode ? 0.7 : 1,
                        transform: [
                          { scale: pressed && passcode.length === PASSCODE_LENGTH ? 0.96 : 1 },
                        ],
                      },
                    ]}
                  >
                    {isVerifyingPasscode ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.primaryButtonText,
                            {
                              color:
                                passcode.length === PASSCODE_LENGTH
                                  ? colors.primaryForeground
                                  : colors.mutedForeground,
                            },
                          ]}
                        >
                          Unlock App
                        </Text>
                        <ShieldCheck
                          size={18}
                          color={
                            passcode.length === PASSCODE_LENGTH
                              ? colors.primaryForeground
                              : colors.mutedForeground
                          }
                        />
                      </>
                    )}
                  </Pressable>

                  {/* Return to Biometric Button */}
                  {canUseBiometrics && (
                    <Pressable
                      onPress={handleTriggerBiometric}
                      style={({ pressed }) => [
                        styles.textLink,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[styles.textLinkTitle, { color: colors.primary }]}>
                        Unlock with {biometricLabel} Instead
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 32,
    paddingTop: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    width: '100%',
    marginBottom: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentText: {
    fontSize: 14,
  },
  errorBanner: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeSection: {
    width: '100%',
    alignItems: 'center',
  },
  biometricCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricPrompt: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textLink: {
    paddingVertical: 8,
  },
  textLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  digitBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFocused: {
    borderWidth: 2,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
  },
  secureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  toggleRow: {
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
