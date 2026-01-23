# Token Lifecycle Explanation

## Overview
The app uses a **two-token system** with automatic refresh:
- **Access Token**: 15 minutes (short-lived, used for API requests)
- **Refresh Token**: 7 days (long-lived, used to get new access tokens)

This provides security (if access token is compromised, damage is limited to 15 min) and convenience (user doesn't need to log in for 7 days).

---

## How Tokens Are Saved

### 1. **Storage Location: SecureStore** (`lib/secure-store.ts`)
```typescript
const ACCESS_TOKEN_KEY = "nexus_access_token";
const REFRESH_TOKEN_KEY = "nexus_refresh_token";

export const tokenStorage = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
};
```

**Why SecureStore?**
- Platform-native encryption (Keychain on iOS, Keystore on Android)
- Survives app restarts and `expo start --clear`
- Not accessible to other apps
- Tokens are NEVER stored in plain AsyncStorage

### 2. **Login Flow** (`services/auth.service.ts`)
```typescript
login: async (data: LoginRequest): Promise<MobileAuthResponse> => {
  const response = await apiClient.post("/mobile/auth/login", data);
  
  const authData = response.data.data;
  const { accessToken, refreshToken } = authData;
  
  // Immediately save both tokens
  if (accessToken && typeof accessToken === 'string') {
    await tokenStorage.setAccessToken(accessToken);
  }
  
  if (refreshToken && typeof refreshToken === 'string') {
    await tokenStorage.setRefreshToken(refreshToken);
  }
  
  return authData;
}
```

**Timeline:**
1. User logs in with email + password
2. Backend validates and returns both tokens
3. App saves BOTH tokens to SecureStore
4. User is now authenticated for 15 min (access token) + 7 days (refresh token)

---

## How Tokens Are Used

### 3. **Request Interceptor** (`lib/api-client.ts`)
Every API request automatically includes the access token:

```typescript
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Flow:**
- `GET /api/wallet` → Check SecureStore → Add `Authorization: Bearer <accessToken>`
- Backend validates token (JWT signature, expiry, etc.)
- If valid → Request succeeds
- If expired/invalid → Backend returns 401

---

## How Tokens Are Refreshed

### 4. **Response Interceptor** (`lib/api-client.ts`)
When a 401 happens, the interceptor automatically refreshes:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = await tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call refresh endpoint
      const response = await axios.post(`${BASE_URL}/mobile/auth/refresh`, {
        refreshToken,
      });
      
      const authData = response.data.data;
      
      // Save NEW access token
      if (authData.accessToken) {
        await tokenStorage.setAccessToken(authData.accessToken);
      }
      
      // Save NEW refresh token (if backend rotated it)
      if (authData.refreshToken) {
        await tokenStorage.setRefreshToken(authData.refreshToken);
      }
      
      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
      return apiClient(originalRequest);
    }
  }
);
```

**Timeline Example:**
1. User makes request at 14:55 (5 min before token expires)
2. Access token is still valid ✓
3. Request succeeds

---

1. User makes request at 15:10 (10 min after token issued, but only 5 min valid)
2. Access token expired ✗
3. Backend returns 401
4. **Interceptor kicks in automatically:**
   - Retrieves refresh token from SecureStore
   - POSTs to `/mobile/auth/refresh`
   - Backend validates refresh token (still valid for 6 days 23 hours 50 min)
   - Backend returns NEW access token
   - App saves new access token
   - Original request is retried with new token
5. Request succeeds transparently (user doesn't notice)

---

## When Refresh Token Fails

If the refresh token is also invalid/expired:

```typescript
catch (refreshError: any) {
  console.error("[api-client] Token refresh failed");
  await tokenStorage.clearTokens();
  
  // Notify AuthContext that session has expired
  onSessionExpired?.();
}
```

**This happens when:**
- Refresh token expired (> 7 days old)
- User was logged out from another device
- Backend invalidated the token
- Server rejected the token

**Result:**
- Both tokens are cleared from SecureStore
- User is logged out
- Redirected to login screen
- User must log in again

---

## Token Validation on App Start

### 5. **AuthContext Initialization** (`context/AuthContext.tsx`)
```typescript
useEffect(() => {
  const loadUser = async () => {
    // Check if tokens exist
    const accessToken = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();
    
    // If no tokens, user is logged out
    if (!accessToken && !refreshToken) {
      console.log("No tokens found, user is logged out");
      await userStorage.clearAll();
      setUserState(null);
      return;
    }
    
    // Tokens exist, restore user from SecureStore
    const storedUser = await userStorage.getUser<User>();
    if (storedUser) {
      console.log("Restored user from SecureStore");
      setUserState(storedUser);
    }
  };
  loadUser();
}, []);
```

**App Start Scenarios:**

**Scenario 1: User logged in 2 days ago**
- Access token: EXPIRED (15 min expiry)
- Refresh token: VALID (4 days 23 hours left)
- App restores user ✓
- Next API call → 401 → Auto-refresh with refresh token → ✓ Works

**Scenario 2: User logged in 8 days ago**
- Access token: EXPIRED (15 min expiry)
- Refresh token: EXPIRED (8 days > 7 day limit)
- App clears tokens and logs out user
- Redirects to login screen

**Scenario 3: User logged out manually**
- Access token: Cleared
- Refresh token: Cleared
- App shows login screen

---

## Summary: Token Lifecycle Timeline

```
LOGIN (Day 0, Time 0:00)
  ↓
[Save to SecureStore]
  Access Token: Valid until 0:15
  Refresh Token: Valid until Day 7
  ↓
API REQUESTS (0:01 to 0:14)
  ├─ Authorization: Bearer <access_token>
  └─ All succeed ✓
  ↓
API REQUEST AT 0:16 (Access token expired)
  ├─ Authorization header rejected (401)
  ├─ Interceptor retrieves refresh token
  ├─ POST /mobile/auth/refresh with refresh token
  ├─ Backend returns NEW access token
  ├─ [Save new access token to SecureStore]
  ├─ Retry original request with new token
  └─ Request succeeds ✓
  ↓
APP BACKGROUNDED (0:17)
  └─ SoftLock triggers after 5 min (app locks at 0:22)
  ↓
APP FOREGROUND (Day 2, 10:00)
  ├─ AuthContext checks SecureStore
  ├─ Access token exists? Yes (but expired)
  ├─ Refresh token exists? Yes (valid for 4 days 23 hours)
  ├─ Restore user ✓
  ├─ First API call → 401 → Auto-refresh → ✓
  └─ User continues seamlessly
  ↓
APP FOREGROUND (Day 7, 0:01)
  ├─ AuthContext checks SecureStore
  ├─ Access token exists? Yes (but expired)
  ├─ Refresh token exists? No (expired 1 day ago)
  ├─ Clear tokens, logout user
  └─ Redirect to login screen ✗
```

---

## Key Points

| Aspect | Access Token | Refresh Token |
|--------|--------------|---------------|
| Lifetime | 15 minutes | 7 days |
| Purpose | Use with API requests | Get new access token |
| Storage | SecureStore (encrypted) | SecureStore (encrypted) |
| Sent to Backend | Every request | Only for refresh requests |
| If Compromised | Attacker has 15 min window | ⚠️ Attacker has 7 days - rotate immediately |
| Expiry Handling | Auto-refresh via interceptor | Manual logout + re-login |

---

## Current Issue: Token Refresh Not Working

**Symptoms:**
- Access token expires
- API returns 401
- Refresh token exists and is valid
- But refresh endpoint call fails

**Debug Steps:**
1. Check logs for `[api-client] Attempting token refresh...`
2. Check if `POST /mobile/auth/refresh` endpoint is being called
3. Check if backend is returning 200 with new tokens
4. Verify refresh token is being sent in request body

**Fix in Progress:**
- Added detailed logging to api-client.ts
- Logs show exact endpoint being called
- Logs show refresh response data
- If refresh fails, logs show error details

---

## Files to Reference

- `lib/secure-store.ts` - Token storage
- `lib/api-client.ts` - Token usage & refresh
- `services/auth.service.ts` - Login flow
- `context/AuthContext.tsx` - Token validation on app start
- `hooks/useAuth.ts` - Auth state management
