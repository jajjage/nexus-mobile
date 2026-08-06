import { LockScreen } from '@/components/features/auth/lock-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useAuthContext } from './AuthContext';

// Storage keys for soft lock state
const SOFT_LOCK_ENABLED_KEY = "soft_lock_enabled";
const SOFT_LOCK_STATE_KEY = "soft_lock_state";
const LAST_ACTIVE_TIME_KEY = "soft_lock_last_active_time";

interface SoftLockContextType {
  isLocked: boolean;
  isEnabled: boolean;
  lock: () => void;
  unlock: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

const SoftLockContext = createContext<SoftLockContextType | undefined>(undefined);

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes inactivity timeout

export function SoftLockProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading, isSessionExpired } = useAuthContext();
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(true); // Default to enabled
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const hasInitialLockCheckDone = useRef(false);

  // Initialize from storage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const enabledValue = await AsyncStorage.getItem(SOFT_LOCK_ENABLED_KEY);
        const enabled = enabledValue === null ? true : enabledValue === 'true';
        setIsEnabledState(enabled);

        // Check if explicit lock state or elapsed inactivity time requires lock
        if (enabled) {
          const lockState = await AsyncStorage.getItem(SOFT_LOCK_STATE_KEY);
          const lastActiveStr = await AsyncStorage.getItem(LAST_ACTIVE_TIME_KEY);
          
          if (lockState === 'locked') {
            setIsLocked(true);
          } else if (lastActiveStr) {
            const lastActive = parseInt(lastActiveStr, 10);
            if (!isNaN(lastActive) && Date.now() - lastActive > LOCK_TIMEOUT) {
              setIsLocked(true);
              await AsyncStorage.setItem(SOFT_LOCK_STATE_KEY, 'locked');
            }
          }
        }
      } catch (e) {
        console.error('[SoftLock] Failed to initialize from storage', e);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  // Handle Cold Start Locking (only if timeout expired or explicitly locked)
  useEffect(() => {
    if (isAuthLoading || !isInitialized) return;
    if (hasInitialLockCheckDone.current) return;
    hasInitialLockCheckDone.current = true;
  }, [isAuthLoading, isInitialized]);

  useEffect(() => {
    if (!isEnabled || !isInitialized) return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background -> record timestamp
        const now = Date.now();
        backgroundTime.current = now;
        await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, now.toString()).catch(console.error);
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground
        if (backgroundTime.current) {
          const timeInBackground = Date.now() - backgroundTime.current;
          // Only lock if background time exceeds timeout, user is logged in, and soft lock enabled
          if (timeInBackground > LOCK_TIMEOUT && user && !isSessionExpired && isEnabled) {
            setIsLocked(true);
            await AsyncStorage.setItem(SOFT_LOCK_STATE_KEY, 'locked').catch(console.error);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, isSessionExpired, isEnabled, isInitialized]);

  const lock = async () => {
    setIsLocked(true);
    await AsyncStorage.setItem(SOFT_LOCK_STATE_KEY, 'locked');
  };

  const unlock = async () => {
    setIsLocked(false);
    backgroundTime.current = null;
    await AsyncStorage.removeItem(SOFT_LOCK_STATE_KEY);
    await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
  };

  const setEnabled = async (enabled: boolean) => {
    setIsEnabledState(enabled);
    await AsyncStorage.setItem(SOFT_LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
    
    // If disabling, also unlock if currently locked
    if (!enabled && isLocked) {
      setIsLocked(false);
      await AsyncStorage.removeItem(SOFT_LOCK_STATE_KEY);
    }
  };

  return (
    <SoftLockContext.Provider value={{ isLocked, isEnabled, lock, unlock, setEnabled }}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
      {isLocked && isEnabled && !isSessionExpired && user ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" collapsable={false}>
          <LockScreen onUnlock={unlock} />
        </View>
      ) : null}
    </SoftLockContext.Provider>
  );
}

export function useSoftLock() {
  const context = useContext(SoftLockContext);
  if (context === undefined) {
    throw new Error('useSoftLock must be used within a SoftLockProvider');
  }
  return context;
}
