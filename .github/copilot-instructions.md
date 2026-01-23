# Nexus Mobile - AI Coding Instructions

## Project Overview
**Nexus Mobile** is a React Native Expo app (iOS/Android/Web) that mirrors the Nexus Data web platform—a financial services platform for airtime, data purchases, and wallet management with biometric security and reseller capabilities.

**Tech Stack:** React Native 0.81 + Expo 54 + TypeScript + React Query + NativeWind (TailwindCSS)

---

## Architecture Overview

### Directory Structure & Responsibilities
- **`app/`** – Expo Router file-based routing (entry: `_layout.tsx`). Organize routes by domain in group folders: `(auth)`, `(tabs)`, `(setup)`, `(onboarding)`.
- **`context/`** – Global state: `AuthContext` (user + token state), `SoftLockContext` (app locking), `ThemeContext` (dark/light).
- **`hooks/`** – Reusable logic with React Query integration. Pattern: `use*Query` for data fetching, `use*Mutation` for mutations. Export query key builders (e.g., `authKeys`).
- **`services/`** – Thin API wrappers (e.g., `authService.login()`, `walletService.getBalance()`). Always use `apiClient` from `lib/api-client.ts`.
- **`lib/`** – Cross-cutting utilities: `api-client.ts` (Axios with token refresh), `secure-store.ts` (SecureStore wrapper).
- **`types/`** – TypeScript interfaces for API responses and domain models (mirrored from web backend).
- **`components/ui/`** – Gluestack UI library components (Button, Card, Input, etc.).
- **`constants/`** – Design tokens (colors, spacing) using Nexus gold theme (#E69E19).

### Data Flow Pattern
1. **Component** → calls hook (e.g., `useAuth()`)
2. **Hook** → uses React Query (manages cache + loading/error states) → calls service
3. **Service** → uses `apiClient` (handles auth headers + token refresh) → API endpoint
4. **Auth Context** → stores user & tokens; `AsyncStorage` persists across sessions

**Example:** Login flow
```tsx
// Component
const { login, isLoading } = useAuth();
await login({ email, password });  // Redirects to dashboard on success

// hooks/useAuth.ts
export function useAuth() {
  const { setUser } = useAuthContext();
  const loginMutation = useMutation({
    mutationFn: (creds) => authService.login(creds),
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/(tabs)/dashboard');
    }
  });
}

// services/auth.service.ts
export const authService = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post('/mobile/auth/login', data);
    const { accessToken, refreshToken } = response.data.data;
    await tokenStorage.setAccessToken(accessToken);
    // ... return user data
  }
}
```

---

## Critical Workflows & DevOps

### Development Commands
```bash
npm start           # Start Expo dev server (choose platform interactively)
npm run android     # Launch Android emulator
npm run ios        # Launch iOS simulator
npm run web        # Start web build

# Debugging
expo start --dev-client    # Use custom dev client (faster hot reload)
```

### Build & Distribution
```bash
eas build --platform android    # Cloud build for Android
eas build --platform ios        # Cloud build for iOS
```

**Config Files:**
- `eas.json` – EAS build config (credentials, profiles)
- `app.json` – Expo config (permissions, build settings, icons)
- `google-services.json` (Android) & `GoogleService-Info.plist` (iOS) – Firebase configs

### Testing & Linting
Currently no test suite configured. Add tests to `components/__tests__/` when implementing new features.

---

## Core Patterns & Conventions

### Authentication & Token Management
- **Token Storage:** `lib/secure-store.ts` wraps `expo-secure-store` (platform-native encryption). Tokens survive app restarts, `expo start --clear`, and app rebuilds.
- **Token Verification on App Start:** `AuthContext` checks SecureStore for tokens during init. If tokens are missing → user is cleared from AsyncStorage → router redirects to login. **Prevents "logged-in-but-tokenless" state.**
- **Token Refresh:** `apiClient` intercepts 401 responses and auto-refreshes via `POST /mobile/auth/refresh` with refresh token.
- **Login State:** Checked via `useAuth()` hook (queries `GET /api/auth/me`); only available if tokens exist.
- **Logout:** `authService.logout()` calls `tokenStorage.clearTokens()` to clear both access and refresh tokens.

**Critical:** `AuthContext` + `useAuth()` work together:
- `AuthContext` loads user from AsyncStorage but verifies tokens exist in SecureStore first
- `useAuth()` double-checks tokens and clears user if tokens are missing (async mismatch safety)
- This prevents broken states where user exists but has no credentials

**When adding auth features:** Always persist tokens in `tokenStorage`, never in `AsyncStorage` or context alone.

### Security Setup Wizard (Sequential)
After new user login, guide through:
1. **Transaction PIN** – 4-digit code for confirming purchases. Check `user.hasPin`; API: `POST /api/auth/pin`.
2. **App Passcode** – 6-digit soft lock code. Check `user.hasPasscode`; API: `POST /api/auth/passcode`.
3. **Biometrics** – FaceID/TouchID. Use `expo-local-authentication`. Check device support first.
4. **Done** – Set `is_setup_done` flag and redirect to dashboard.

**Files to reference:** `docs/MOBILE_ENGINEER_GUIDE.md`, `context/SoftLockContext.tsx`.

### Soft Lock (App Background Lock)
- **Trigger:** App backgrounded > 5 mins (configurable).
- **Implementation:** `SoftLockContext` listens to `AppState` changes.
- **Storage:** Passcode verified against server or local `AsyncStorage` (depends on security policy).
- **Component:** Show `LockScreen` when `isSoftLocked` is true.

### React Query Caching
- **Query Keys:** Use factory functions (e.g., `authKeys.currentUser()`) for consistency.
- **Stale Time:** 3 minutes by default; 0 for real-time data (transactions, balance).
- **Garbage Collection:** 7 minutes (data is removed from cache).
- **Refetching:** Automatic on window focus; manual via `queryClient.invalidateQueries()`.

**Pattern:**
```typescript
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.lists(),
    queryFn: () => walletService.getTransactions(),
    staleTime: 0,  // Always fresh for financial data
  });
}
```

### Forms & Validation
- **Library:** `react-hook-form` + `zod` (schema validation).
- **Pattern:** Define `schema` in `types/`, use `useForm(resolver: zodResolver(schema))`.
- **Example:**
```typescript
// types/auth.types.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Component
const { control, handleSubmit } = useForm({
  resolver: zodResolver(loginSchema),
});
```

### Styling
- **Tailwind CSS** via `NativeWind` (applies Tailwind utilities to RN components).
- **Colors:** Import from `constants/Colors.ts` (Nexus gold theme, light/dark variants).
- **Responsive:** Use `className="px-4 sm:px-8"` (NativeWind breakpoints).
- **UI Components:** Pre-built in `components/ui/` (Button, Card, Input via Gluestack).

---

## Integration Points & External Dependencies

### Firebase (Push Notifications & Logging)
- **Config:** `GoogleService-Info.plist` (iOS), `google-services.json` (Android).
- **Setup:** `config/firebase.config.ts` initializes SDK.
- **Usage:** `services/mobile-notification.service.ts` handles FCM token registration.
- **Sync on Mount:** `hooks/useSyncFcmOnMount.ts` auto-registers device on app launch.

### API Endpoints (Nexus Backend)
**Base URL:** `process.env.EXPO_PUBLIC_AUTH_URL` (e.g., `http://10.152.118.138:3000/api/v1`)

**Key Endpoints:**
- `POST /mobile/auth/login` – Authenticate user
- `GET /api/auth/me` – Fetch current user profile
- `POST /mobile/auth/refresh` – Refresh access token
- `POST /api/auth/pin` – Set transaction PIN
- `POST /api/auth/passcode` – Set app passcode
- `GET /api/wallet` – Get wallet balance
- `GET /api/transactions` – List user transactions
- See `services/*.service.ts` for full endpoint list.

### Biometric Authentication
- **Library:** `expo-local-authentication`.
- **Flow:** Check device support → Prompt user → Store preference in `AsyncStorage` → Verify on subsequent launches.
- **File:** `services/biometric.service.ts`, `hooks/useBiometric.ts`.

### Notifications
- **Inbound (FCM):** `services/mobile-notification.service.ts` listens for background/foreground messages.
- **Outbound (Local):** `expo-notifications` for scheduling alerts.
- **Preferences:** User can configure notification settings via `useNotificationPreferences()`.

---

## Common Pitfalls & Best Practices

1. **Token Management:** Never log tokens to console or store in `AsyncStorage` alone. Always use `tokenStorage.setAccessToken()`.
2. **Async Storage vs. Secure Store:** Use `SecureStore` for secrets (tokens, PINs); `AsyncStorage` for non-sensitive state.
3. **React Query Invalidation:** After mutations (login, logout, purchase), call `queryClient.invalidateQueries()` to refetch affected data.
4. **Error Handling:** Wrap mutations with error handlers; show user-friendly toasts (use `sonner-native`).
5. **Permissions:** Declare in `app.json`; request at runtime using `expo-permissions` or `expo-contacts` APIs.
6. **Performance:** Use `useMemo` for expensive computations; lazy-load screens via Expo Router's `lazy` option.
7. **Testing Biometrics:** Biometric APIs only work on physical devices or properly configured simulators; mock in unit tests.
8. **Debugging Networking:** Enable network inspector via `expo-dev-client`; check token refresh in Axios interceptors.

---

## File Reference Guide

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with theme provider, Auth context, React Query setup |
| `context/AuthContext.tsx` | User & token state management |
| `lib/api-client.ts` | Axios instance with auth header + token refresh interceptor |
| `lib/secure-store.ts` | Token storage wrapper |
| `hooks/useAuth.ts` | Auth hook (login, logout, profile fetching) |
| `services/auth.service.ts` | Login, register, logout API calls |
| `types/api.types.ts` | Common API response types |
| `types/auth.types.ts` | Login/register request & response types |
| `constants/Colors.ts` | Nexus color palette (light/dark) |
| `docs/MOBILE_DEVELOPMENT_GUIDE.md` | Setup & project structure guide |
| `docs/MOBILE_ENGINEER_GUIDE.md` | Setup wizard & state architecture deep-dive |

---

## Profile Feature (Implemented Jan 22, 2026)

Complete user account management system with 11 screens:

**Route Structure:**
```
/(tabs)/profile/                    → Profile hub (navigation)
├── personal-info                   → Edit name, email, phone
├── security                        → Security menu
│   ├── password                    → Change password
│   ├── pin                         → Set/update transaction PIN
│   ├── passcode                    → Set/update app passcode
│   └── biometric                   → Manage biometric devices
├── notifications                   → Toggle notification preferences
├── wallet                          → Manage payment methods
└── support                         → Help & FAQs
```

**Key Hooks:**
- `useUpdateProfile()` – Update name, email, phone
- `useUpdatePassword()` – Change login password
- `useSetPin()` – Set/update transaction PIN (4-digit)
- `useSetPasscode()` – Set/update app passcode (6-digit)
- `useBiometricManagement()` – List enrolled devices
- `useBiometricRevoke()` – Remove biometric device
- `useNotificationPreferences()` – Fetch/update notification settings

**Key Services:**
- `userService.updateProfile()`, `.updatePassword()`, `.setPin()`, `.setPasscode()`
- `biometricService.listEnrollments()`, `.revokeEnrollment()`, `.getAuditLog()`
- `notificationPreferenceService.getPreferences()`, `.updatePreference()`

**Important Patterns:**
- All forms use Zod validation + React Hook Form
- Mutations with toast notifications (success/error)
- Query invalidation on mutation success
- Loading states with ActivityIndicator
- Proper error handling with user-friendly messages
- Biometric devices use WebAuthn (native API)

**Reference Documentation:**
- `docs/PROFILE_FEATURE_IMPLEMENTATION_COMPLETE.md` – Full implementation guide
- `docs/PROFILE_FEATURE_QUICK_REFERENCE.md` – Developer quick reference

---

## Documentation Links
- **Expo Docs:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org
- **React Query:** https://tanstack.com/query
- **Gluestack UI:** https://gluestack.io
- **NativeWind:** https://www.nativewind.dev

---

## When Stuck
1. Check corresponding web implementation in `src/` or backend docs.
2. Review `docs/` folder for architecture decisions.
3. Search `hooks/` and `services/` for similar patterns.
4. Test API calls directly via Postman using bearer token from `tokenStorage`.

---

## Communication Style
- **Keep responses concise.** Only provide detailed explanations when complexity warrants it or when explicitly asked.
- **No comprehensive summaries unless requested.** Confirm task completion briefly and move on.
- **Focus on implementation.** Execute changes rather than describing them.
- **Respect user preferences.** If user indicates something is not needed, don't include it.
