# Nexus Mobile Development Guide

A comprehensive guide for building a React Native Expo mobile app that mirrors the Nexus web app.

---

## 1. Project Setup

### Initialize Expo Project

```bash
npx create-expo-app@latest nexus-mobile --template tabs
cd nexus-mobile
```

### Essential Packages

```bash
# Core dependencies
npx expo install expo-secure-store expo-local-authentication expo-device
npx expo install @tanstack/react-query axios

# Navigation & UI
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-safe-area-context react-native-screens

# Forms & validation
npm install react-hook-form zod @hookform/resolvers
```

### Recommended Folder Structure

```
nexus-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/             # Login, Register screens
│   ├── (tabs)/             # Main app tabs
│   └── _layout.tsx
├── components/
│   ├── ui/                 # Button, Card, Input, etc.
│   └── features/           # Domain-specific components
├── hooks/                  # Custom hooks (reuse from web)
├── services/               # API services (adapted for mobile)
├── lib/
│   ├── api-client.ts       # Mobile-specific API client
│   └── secure-store.ts     # Token storage wrapper
├── context/                # Auth, Theme contexts
├── types/                  # TypeScript types (copy from web)
└── constants/
    └── theme.ts            # Colors, typography
```

---

## 2. Design System

### Color Tokens

Convert HSL from web to hex for React Native:

```typescript
// constants/theme.ts
export const colors = {
  light: {
    background: "#FAFAFA", // hsl(0, 0%, 98%)
    foreground: "#2E3039", // hsl(240, 10%, 20%)
    card: "#FAFAFA",
    primary: "#D4A017", // hsl(39, 80%, 50%) - amber/gold
    primaryForeground: "#FFFDF7",
    secondary: "#D4D6D9", // hsl(192, 10%, 85%)
    muted: "#E8E9EA", // hsl(192, 5%, 92%)
    mutedForeground: "#52575F",
    destructive: "#E53935", // hsl(0, 80%, 55%)
    border: "#D4D6D9",
    ring: "#D4A017",
  },
  dark: {
    background: "#1A2329", // hsl(192, 20%, 12%)
    foreground: "#F5E6C8", // hsl(39, 90%, 90%)
    card: "#1A2329",
    primary: "#D4A017",
    primaryForeground: "#FFFDF7",
    secondary: "#2E3639", // hsl(192, 10%, 25%)
    muted: "#242C30", // hsl(192, 5%, 18%)
    mutedForeground: "#C9A85C",
    destructive: "#D32F2F",
    border: "#2E3639",
    ring: "#D4A017",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

---

## 3. Mobile Authentication API

> **IMPORTANT:** Mobile does NOT use cookies. Tokens are returned in response body and stored in SecureStore.

### Endpoints

| Endpoint                      | Method | Purpose               |
| ----------------------------- | ------ | --------------------- |
| `/api/v1/mobile/auth/login`   | POST   | Login, returns tokens |
| `/api/v1/mobile/auth/refresh` | POST   | Refresh access token  |

### Login Request/Response

```typescript
// Request
interface MobileLoginRequest {
  email: string;
  password: string;
  deviceId: string; // From expo-device
  totpCode?: string; // Optional 2FA
  backupCode?: string; // Optional backup code
}

// Response
interface MobileLoginResponse {
  id: string,
  email: string,
  role: string,
  accessToken: string,
  refreshToken: string
}
```
### Refresh Request/Response

```tyepescript
// Request
interface MobileRefreshRequest {
   refreshToken: string
}
// Response
interface MobileRefreshResponse{
  id: string,
  email: string,
  role: string,
  accessToken: string,
  refreshToken: string
}
```
### Secure Token Storage

```typescript
// lib/secure-store.ts
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "nexus_access_token";
const REFRESH_TOKEN_KEY = "nexus_refresh_token";

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
```

### Mobile API Client

```typescript
// lib/api-client.ts
import axios, { AxiosInstance } from "axios";
import { tokenStorage } from "./secure-store";

const BASE_URL = "https://your-api.com/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request: Add Authorization header
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Handle 401, refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        const { data } = await axios.post(`${BASE_URL}/mobile/auth/refresh`, {
          refreshToken,
        });

        await tokenStorage.setAccessToken(data.accessToken);
        if (data.refreshToken) {
          await tokenStorage.setRefreshToken(data.refreshToken);
        }

        failedQueue.forEach(({ resolve }) => resolve());
        failedQueue = [];
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        isRefreshing = false;
        await tokenStorage.clearTokens();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 4. Biometric Authentication

Mobile uses `expo-local-authentication` instead of WebAuthn:

```typescript
// hooks/useBiometric.ts
import * as LocalAuthentication from "expo-local-authentication";

export function useBiometricAuth() {
  const authenticate = async (): Promise<boolean> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to continue",
      fallbackLabel: "Use PIN",
    });

    return result.success;
  };

  return { authenticate };
}
```

---

## 5. Reusable Code from Web

### ✅ Can Reuse As-Is

| File                    | Notes                     |
| ----------------------- | ------------------------- |
| `types/*.types.ts`      | All TypeScript interfaces |
| `lib/network-utils.ts`  | Phone network detection   |
| `hooks/useProducts.ts`  | Uses React Query          |
| `hooks/useWallet.ts`    | Pure data fetching        |
| `hooks/useReferrals.ts` | Pure data fetching        |
| `services/*.service.ts` | Change apiClient import   |

### ⚠️ Needs Adaptation

| Web Code                        | Mobile Equivalent           |
| ------------------------------- | --------------------------- |
| `useBiometric.ts` (WebAuthn)    | `expo-local-authentication` |
| `SoftLockContext.tsx`           | Use `AppState` API          |
| `useClipboard.ts`               | `expo-clipboard`            |
| `useForegroundNotifications.ts` | `expo-notifications`        |

### ❌ Web-Only (don't copy)

- `api-client.ts` - Rewrite for mobile
- `credential-manager.service.ts` - Web Credential API
- `useSyncFcmOnMount.ts` - Web FCM

---

## 6. Component Mapping

| Web (shadcn/ui) | React Native                 |
| --------------- | ---------------------------- |
| `Button`        | `Pressable` + styling        |
| `Card`          | `View` with shadow           |
| `Input`         | `TextInput`                  |
| `Dialog`        | `Modal`                      |
| `Sheet`         | `react-native-bottom-sheet`  |
| `Toast/Sonner`  | `react-native-toast-message` |

---

## 7. App State (Background/Foreground)

Replace `document.visibilityState` with React Native `AppState`:

```typescript
// hooks/useAppState.ts
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppStateChange(
  onForeground: () => void,
  onBackground: () => void
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        onForeground();
      } else if (
        appState.current === "active" &&
        nextState.match(/inactive|background/)
      ) {
        onBackground();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground, onBackground]);
}
```

---

## 8. Quick Start Checklist

- [ ] Initialize Expo project with tabs template
- [ ] Install dependencies (SecureStore, LocalAuth, React Query)
- [ ] Copy `types/` folder from web
- [ ] Create mobile `api-client.ts` with token handling
- [ ] Create `secure-store.ts` for token storage
- [ ] Set up AuthContext with mobile login flow
- [ ] Copy and adapt services (change apiClient import)
- [ ] Build UI components matching web design system
- [ ] Implement navigation matching web app structure
