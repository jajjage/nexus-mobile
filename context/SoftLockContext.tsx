import { LockScreen } from '@/components/features/auth/lock-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuthContext } from './AuthContext';

// Storage keys for soft lock state
const SOFT_LOCK_ENABLED_KEY = "soft_lock_enabled";
const SOFT_LOCK_STATE_KEY = "soft_lock_state";

interface SoftLockContextType {
  isLocked: boolean;
  isEnabled: boolean;
  lock: () => void;
  unlock: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

const SoftLockContext = createContext<SoftLockContextType | undefined>(undefined);

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function SoftLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(true); // Default to enabled
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const enabledValue = await AsyncStorage.getItem(SOFT_LOCK_ENABLED_KEY);
        const lockState = await AsyncStorage.getItem(SOFT_LOCK_STATE_KEY);
        
        // If no value stored, default to enabled
        const enabled = enabledValue === null ? true : enabledValue === 'true';
        setIsEnabledState(enabled);
        
        // If app was closed while locked (and user is logged in), restore lock state
        if (enabled && lockState === 'locked' && user) {
          setIsLocked(true);
        }
      } catch (e) {
        console.error('[SoftLock] Failed to initialize from storage', e);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!isEnabled || !isInitialized) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background
        backgroundTime.current = Date.now();
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground
        if (backgroundTime.current) {
          const timeInBackground = Date.now() - backgroundTime.current;
          // Only lock if user is logged in and soft lock is enabled
          if (timeInBackground > LOCK_TIMEOUT && user && isEnabled) {
            setIsLocked(true);
            // Persist lock state
            AsyncStorage.setItem(SOFT_LOCK_STATE_KEY, 'locked').catch(console.error);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, isEnabled, isInitialized]);

  const lock = async () => {
    setIsLocked(true);
    await AsyncStorage.setItem(SOFT_LOCK_STATE_KEY, 'locked');
  };

  const unlock = async () => {
    setIsLocked(false);
    backgroundTime.current = null;
    await AsyncStorage.removeItem(SOFT_LOCK_STATE_KEY);
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
      {children}
      {isLocked && isEnabled && <LockScreen onUnlock={unlock} />}
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
