# Mobile Authentication State Guide

> **Target Audience**: React Native/Expo Mobile Developers
> **Purpose**: Comprehensive guide to replicate the web authentication state management in mobile

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication State Architecture](#authentication-state-architecture)
3. [What Makes a User "Logged In"](#what-makes-a-user-logged-in)
4. [What Causes Logout](#what-causes-logout)
5. [Soft Lock Feature](#soft-lock-feature)
6. [Token Refresh Strategy](#token-refresh-strategy)
7. [Mobile Implementation Guide](#mobile-implementation-guide)

---

## Overview

The Nexus app uses a **dual-layer authentication system**:

| Layer | Purpose | Storage |
|-------|---------|---------|
| **AuthContext** | User session state (logged in/out) | Memory + Secure Storage |
| **SoftLockContext** | App lock state (UI interactivity) | Memory + Async Storage |

```
┌────────────────────────────────────────────────────────────┐
│                      APP STATE                             │
├────────────────────────────────────────────────────────────┤
│  isAuthenticated: boolean    ← User has valid session      │
│  isLocked: boolean           ← UI is blocked (soft lock)   │
└────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Soft Lock ≠ Logout**. Soft lock blocks UI interaction but keeps the user authenticated. The user's session tokens remain valid.

---

## Authentication State Architecture

### State Sources

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  AuthContext    │     │  SoftLockContext │     │  API Client    │
│                 │     │                  │     │                │
│ • user          │     │ • isLocked       │     │ • Token refresh│
│ • isLoading     │     │ • isEnabled      │     │ • 401 handling │
│ • isAuthenticated│    │ • lock()         │     │ • Queue mgmt   │
│ • isSessionExpired│   │ • unlock()       │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
```

### Mobile Equivalent

```tsx
// React Native - Create similar context structure

// 1. Auth State (use Zustand or React Context)
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSessionExpired: boolean;
}

// 2. Soft Lock State (separate context)
interface SoftLockState {
  isLocked: boolean;
  isEnabled: boolean;
}
```

---

## What Makes a User "Logged In"

A user is considered **authenticated** when ALL of these conditions are met:

```typescript
const isAuthenticated =
  user !== null &&           // User object exists
  !isSessionExpired &&       // Session not marked as expired
  user.isSuspended === false // User account not suspended
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────┐     ┌─────────────────┐     ┌──────────────────────────────┐
│   Login    │────▶│  POST /auth/    │────▶│  Backend sets httpOnly       │
│   Request  │     │  login          │     │  cookies (access + refresh)  │
└────────────┘     └─────────────────┘     └──────────────────────────────┘
                                                      │
                                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│  1. Store user in AuthContext                                          │
│  2. Cache user in localStorage (web) / SecureStore (mobile)            │
│  3. Store user role for logout redirect                                │
│  4. Reset isSessionExpired to false                                    │
│  5. Redirect based on role + setup status:                             │
│     • Admin → /admin/dashboard                                         │
│     • User without PIN → /setup                                        │
│     • User with PIN → /dashboard                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Mobile Implementation

```tsx
// services/authService.ts
import * as SecureStore from 'expo-secure-store';

export async function login(credentials: LoginRequest) {
  const response = await api.post('/auth/login', credentials);
  const { user } = response.data;

  // Cache user for quick app restarts
  await SecureStore.setItemAsync('auth_user_cache', JSON.stringify(user));
  await SecureStore.setItemAsync('auth_user_role', user.role);

  return user;
}
```

### Session Validation on App Start

```tsx
// On app launch, check if user was previously authenticated
useEffect(() => {
  const checkSession = async () => {
    const cachedUser = await SecureStore.getItemAsync('auth_user_cache');

    if (cachedUser) {
      // User was logged in - validate session with backend
      try {
        const user = await api.get('/user/profile/me');
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Session invalid - clear cache and redirect to login
        await SecureStore.deleteItemAsync('auth_user_cache');
        setIsAuthenticated(false);
      }
    }

    setIsLoading(false);
  };

  checkSession();
}, []);
```

---

## What Causes Logout

### Explicit Logout (User-Initiated)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOGOUT FLOW                                     │
└────────────────────────────────────────────────────────────────────────┘

User taps "Logout"
       │
       ▼
┌──────────────────┐
│ POST /auth/logout│ ─────▶ Backend invalidates refresh token
└──────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  1. Clear user from AuthContext (user = null)                        │
│  2. Clear cached user from storage                                   │
│  3. Clear React Query cache                                          │
│  4. Prevent credential auto-fill                                     │
│  5. Redirect to login based on stored role:                          │
│     • admin/staff → /admin/login                                     │
│     • user/reseller → /login                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Automatic Logout (Session Expiry)

The system automatically logs out users when:

| Trigger | HTTP Status | Action |
|---------|-------------|--------|
| Access token expired + refresh failed | 401 | Clear session, redirect to login |
| Refresh token expired | 401 from `/auth/refresh` | Clear session, redirect to login |
| User account deleted | 404 from `/user/profile/me` | Clear session, redirect to login |
| Account suspended | 403 | Clear session, redirect to login |
| Max refresh attempts (3) exceeded | Multiple 401s | Clear session, redirect to login |

### Token Refresh Decision Tree

```
                     ┌───────────────┐
                     │  API Request  │
                     └───────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Got 401 Error? │
                    └────────┬───────┘
                             │
              Yes ◀──────────┴──────────▶ No
               │                           │
               ▼                           ▼
    ┌─────────────────────┐        ┌─────────────────┐
    │ Is Auth Endpoint?   │        │ Return Response │
    │ (/login, /refresh)  │        └─────────────────┘
    └─────────┬───────────┘
              │
   Yes ◀──────┴──────▶ No
    │                   │
    ▼                   ▼
┌────────────┐   ┌──────────────────┐
│ Reject as  │   │ Already retried? │
│ auth error │   └────────┬─────────┘
└────────────┘            │
                 Yes ◀────┴────▶ No
                  │               │
                  ▼               ▼
           ┌───────────┐  ┌────────────────┐
           │ Expire    │  │ Try Refresh    │
           │ Session   │  │ Token          │
           └───────────┘  └────────┬───────┘
                                   │
                      Success ◀────┴────▶ Failure
                         │                   │
                         ▼                   ▼
                  ┌────────────────┐  ┌───────────────┐
                  │ Retry Original │  │ Check Attempt │
                  │ Request        │  │ Count         │
                  └────────────────┘  └───────┬───────┘
                                              │
                                    < 3 ◀─────┴─────▶ >= 3
                                     │                 │
                                     ▼                 ▼
                              ┌────────────┐   ┌─────────────┐
                              │ Queue and  │   │ Expire      │
                              │ Retry      │   │ Session     │
                              └────────────┘   └─────────────┘
```

### Mobile Implementation

```tsx
// lib/apiClient.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request
        return new Promise((resolve) => {
          refreshSubscribers.push(() => {
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');

        // Process queued requests
        refreshSubscribers.forEach((callback) => callback());
        refreshSubscribers = [];
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Session truly expired
        isRefreshing = false;

        // Trigger logout
        await handleSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

async function handleSessionExpired() {
  await SecureStore.deleteItemAsync('auth_user_cache');
  await SecureStore.deleteItemAsync('auth_user_role');
  // Navigate to login - use your navigation method
}
```

---

## Soft Lock Feature

### What is Soft Lock?

Soft Lock is a **security feature for PWA/mobile apps** that:
- Blocks UI interaction after inactivity
- **Does NOT end the user's session**
- Requires biometric or PIN to unlock
- Only active in PWA mode (standalone) or mobile apps

> [!CAUTION]
> Soft Lock is NOT logout. The user remains authenticated. Their tokens are still valid. Only the UI is locked.

### Soft Lock State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SOFT LOCK STATE                                  │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────┐
          ┌────────│    APP ACTIVE      │◀────────┐
          │        │   isLocked: false  │         │
          │        └─────────┬──────────┘         │
          │                  │                     │
          │     App goes to background             │ Biometric/PIN
          │     (90 second grace period)           │ verified
          │                  │                     │
          │                  ▼                     │
          │        ┌────────────────────┐         │
          └───────▶│    APP LOCKED      │─────────┘
     User returned │   isLocked: true   │
     within grace  └────────────────────┘
     period
```

### Key Behaviors

| Event | Action |
|-------|--------|
| App goes to background | Start 90-second timer |
| App returns within 90s | Cancel timer, stay unlocked |
| App returns after 90s | Show lock screen |
| App restart with soft lock enabled | Show lock screen immediately |
| Lock screen displayed | Prompt biometric (if enrolled) or PIN |
| Successful unlock | Record unlock timestamp, hide lock screen |

### Storage Keys

```typescript
const SOFT_LOCK_ENABLED_KEY = "soft_lock_enabled";      // boolean as string
const SOFT_LOCK_TIMESTAMP_KEY = "soft_lock_timestamp";  // last unlock time
const SOFT_LOCK_STATE_KEY = "soft_lock_state";          // "locked" or null
const LOCK_AFTER_SECONDS = 300;                         // 5 minutes for full timeout
const GRACE_PERIOD_MS = 90000;                          // 90 seconds background grace
```

### Mobile Implementation

```tsx
// context/SoftLockContext.tsx
import { useRef, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRACE_PERIOD_MS = 90000; // 90 seconds

export function useSoftLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize from storage
    const init = async () => {
      const enabled = await AsyncStorage.getItem('soft_lock_enabled');
      const lockState = await AsyncStorage.getItem('soft_lock_state');

      setIsEnabled(enabled === 'true');

      if (enabled === 'true' && lockState === 'locked') {
        setIsLocked(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        // App going to background - start grace period timer
        lockTimeoutRef.current = setTimeout(async () => {
          setIsLocked(true);
          await AsyncStorage.setItem('soft_lock_state', 'locked');
        }, GRACE_PERIOD_MS);
      }

      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // App coming to foreground
        if (lockTimeoutRef.current) {
          // Returned within grace period
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
        }
      }

      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [isEnabled]);

  const unlock = async () => {
    setIsLocked(false);
    await AsyncStorage.setItem('soft_lock_timestamp', Date.now().toString());
    await AsyncStorage.removeItem('soft_lock_state');
  };

  const lock = async () => {
    setIsLocked(true);
    await AsyncStorage.setItem('soft_lock_state', 'locked');
  };

  const setEnabled = async (enabled: boolean) => {
    setIsEnabled(enabled);
    await AsyncStorage.setItem('soft_lock_enabled', enabled ? 'true' : 'false');
  };

  return { isLocked, isEnabled, lock, unlock, setEnabled };
}
```

### Soft Lock Screen Component

```tsx
// components/SoftLockScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSoftLock } from '../context/SoftLockContext';
import { useAuth } from '../hooks/useAuth';

export function SoftLockScreen() {
  const { isLocked, unlock, isEnabled } = useSoftLock();
  const { user, isAuthenticated } = useAuth();

  // Only render if authenticated AND locked AND enabled
  if (!isAuthenticated || !isLocked || !isEnabled) {
    return null;
  }

  const handleBiometricUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Nexus',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      unlock();
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.lockIcon}>
        {/* Lock icon */}
      </View>

      <Text style={styles.userName}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity onPress={handleBiometricUnlock}>
        <Text>Unlock with Biometrics</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowPasscode(true)}>
        <Text>Use Passcode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  // ... other styles
});
```

---

## Token Refresh Strategy

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│  Access Token:  15 minutes (short-lived)                    │
│  Refresh Token: 24 hours (long-lived)                       │
└─────────────────────────────────────────────────────────────┘

Timeline:
─────────────────────────────────────────────────────────────▶

T0: Login
│   ├─ Access Token issued (expires T0 + 15min)
│   └─ Refresh Token issued (expires T0 + 24h)
│
T1: Access Token expires (T0 + 15min)
│   └─ Next API call triggers refresh
│       └─ POST /auth/refresh
│           └─ New Access Token issued
│
T2: Refresh Token expires (T0 + 24h)
    └─ User must login again
```

### Queue Management for Concurrent Requests

When multiple requests fail with 401 simultaneously:

```
Request A ─────▶ 401 ─────▶ Start Refresh
Request B ─────▶ 401 ─────▶ Queue (wait for refresh)
Request C ─────▶ 401 ─────▶ Queue (wait for refresh)

                           │
                           ▼
                    Refresh Complete
                           │
                           ▼
                    Process Queue
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   Retry Request A   Retry Request B   Retry Request C
```

---

## Mobile Implementation Guide

### Complete Auth Provider

```tsx
// context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  markSessionAsExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    // Restore cached user on app start
    const initAuth = async () => {
      try {
        const cachedUser = await SecureStore.getItemAsync('auth_user_cache');
        if (cachedUser) {
          setUserState(JSON.parse(cachedUser));

          // Validate session with backend
          try {
            const freshUser = await authService.getProfile();
            setUserState(freshUser);
            await SecureStore.setItemAsync('auth_user_cache', JSON.stringify(freshUser));
          } catch (error) {
            // Session invalid
            await clearAuthState();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setUser = async (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      await SecureStore.setItemAsync('auth_user_cache', JSON.stringify(newUser));
      await SecureStore.setItemAsync('auth_user_role', newUser.role);
    }
  };

  const clearAuthState = async () => {
    setUserState(null);
    setIsSessionExpired(true);
    await SecureStore.deleteItemAsync('auth_user_cache');
    await SecureStore.deleteItemAsync('auth_user_role');
  };

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    const { user } = response;

    await setUser(user);
    setIsSessionExpired(false);

    // Handle role-based routing
    if (user.role === 'admin') {
      // Navigate to admin dashboard
    } else if (!user.hasPin) {
      // Navigate to setup
    } else {
      // Navigate to dashboard
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      await clearAuthState();
      // Navigate to login
    }
  };

  const markSessionAsExpired = () => {
    clearAuthState();
  };

  const isAuthenticated =
    user !== null &&
    !isSessionExpired &&
    user.isSuspended === false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isSessionExpired,
        login,
        logout,
        setUser,
        markSessionAsExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Complete App Structure

```tsx
// App.tsx
import { AuthProvider } from './context/AuthProvider';
import { SoftLockProvider } from './context/SoftLockContext';
import { SoftLockScreen } from './components/SoftLockScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SoftLockProvider>
          {/* Your navigation/screens */}
          <Navigation />

          {/* Soft lock overlay - renders on top when locked */}
          <SoftLockScreen />
        </SoftLockProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Summary: Key Differences

| Feature | Web Implementation | Mobile Equivalent |
|---------|-------------------|-------------------|
| Token Storage | httpOnly cookies (handled by browser) | Cookies still work with `credentials: 'include'` |
| User Cache | `localStorage` | `expo-secure-store` |
| Soft Lock State | `localStorage` | `AsyncStorage` |
| Background Detection | `document.visibilityState` | `AppState` from React Native |
| Biometric Auth | WebAuthn API | `expo-local-authentication` |
| Session Expired Redirect | `window.location.href` | Navigation API (`router.replace`) |

> [!TIP]
> The authentication tokens are still managed as httpOnly cookies even in mobile. The native WebView/HTTP client handles them automatically. You just need to ensure `credentials: 'include'` is set in your API client.

---

## Related Documentation

- [AUTH_LIFECYCLE_DEEP_ANALYSIS.md](./AUTH_LIFECYCLE_DEEP_ANALYSIS.md) - Deep dive into auth issues and solutions
- [BIOMETRIC_INTEGRATION_QUICKREF.md](./BIOMETRIC_INTEGRATION_QUICKREF.md) - Biometric setup guide
- [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](./MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md) - Transaction verification with biometrics
