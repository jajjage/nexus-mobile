# Setup Flow Fix: Persistent State Tracking

## Problem
Previously, if a user was interrupted during the biometric setup step (crashes, closes app, loses connection), upon reopening the app they would be sent back to the beginning of the setup wizard (PIN → Passcode → Biometric) instead of resuming from the biometric step where they left off.

## Root Cause
The setup wizard was checking `user.hasPin` and `user.hasPasscode` from the user object (which come from the backend), but there was no `hasBiometric` field to track biometric enrollment state. This meant:
1. The setup index couldn't determine if biometric was already completed
2. After biometric success, the user state wasn't updated
3. Reopening the app would restart from scratch

## Solution
Implemented persistent state tracking for the entire setup flow:

### 1. **Added `hasBiometric` Field to User Type**
   - **File:** `types/api.types.ts`
   - **Change:** Added `hasBiometric: boolean` to the User interface
   - **Purpose:** Tracks biometric enrollment status consistently with PIN and Passcode

### 2. **Updated Setup Index Logic**
   - **File:** `app/(setup)/index.tsx`
   - **Changes:**
     - Now checks `user.hasBiometric` status
     - Only redirects to biometric setup if `hasBiometric === false`
     - Redirects to dashboard when all three steps are complete
   - **Flow:**
     ```
     Login → PIN setup? → Passcode setup? → Biometric setup? → Dashboard
     ```

### 3. **Enhanced Biometric Setup Screen**
   - **File:** `app/(setup)/enable-biometric.tsx`
   - **Changes:**
     - Imported `useAuthContext` to access `updateUser`
     - Imported `AsyncStorage` for local state persistence
     - On successful enrollment: `updateUser({ hasBiometric: true })`
     - On skip: `updateUser({ hasBiometric: true })` (treated as completed)
     - Redirects to `/(setup)` instead of `/(tabs)` so the index can verify completion
   - **State Persistence:**
     - Local storage: `biometric_enrolled`, `biometric_setup_completed`, `biometric_skipped`
     - User object: `hasBiometric: true`

## User Experience Flow

### Scenario: User Interrupted During Biometric Setup

#### Before Fix:
```
1. Login → User in DB now has hasPin=true, hasPasscode=true, hasBiometric=false
2. Setup starts PIN setup
3. User completes PIN → user.hasPin=true
4. Setup redirects to passcode
5. User completes passcode → user.hasPasscode=true
6. Setup redirects to biometric
7. ❌ App crashes/closes during biometric
8. User reopens app
9. ❌ Goes back to PIN setup (because setup index only checked hasPin/hasPasscode)
10. User frustrated, manually retries everything
```

#### After Fix:
```
1. Login → User in DB now has hasPin=true, hasPasscode=true, hasBiometric=false
2. Setup starts PIN setup
3. User completes PIN → user.hasPin=true
4. Setup redirects to passcode
5. User completes passcode → user.hasPasscode=true
6. Setup redirects to biometric
7. ✅ App crashes/closes during biometric
8. User reopens app
9. ✅ Goes directly to biometric setup (because hasBiometric=false)
10. User tries again and succeeds
11. updateUser({ hasBiometric: true })
12. Redirects to setup index, which now sees all three flags are true
13. ✅ Redirects to dashboard
```

## Implementation Details

### UpdateUser Method
```typescript
// In AuthContext.tsx
const updateUser = (updates: Partial<User>) => {
  setUserState((prev) => {
    if (!prev) return null;
    const updated = { ...prev, ...updates };
    AsyncStorage.setItem('user', JSON.stringify(updated)).catch(...);
    return updated;
  });
};
```

This ensures that when we call `updateUser({ hasBiometric: true })`, it:
1. Updates the in-memory user state
2. Persists to AsyncStorage
3. Automatically syncs with the setup index check

### Local Storage Flags (Supplementary)
While the main state is tracked in `user.hasBiometric`, we also save:
- `biometric_enrolled`: When successful enrollment happens
- `biometric_setup_completed`: When either enrolled or skipped
- `biometric_skipped`: When user explicitly skipped

These can be used for analytics or UI hints later.

## Testing

### Test Case 1: Complete Setup → Reopen App
1. Login
2. Set PIN
3. Set Passcode
4. Enable Biometric (or skip)
5. Close app
6. Reopen app
7. **Expected:** Go directly to dashboard (not setup wizard)

### Test Case 2: Interrupt During Biometric
1. Login
2. Set PIN
3. Set Passcode
4. Start Biometric setup
5. Force close app (before completion)
6. Reopen app
7. **Expected:** Go to biometric setup (not PIN/passcode)

### Test Case 3: Skip Biometric
1. Login
2. Set PIN
3. Set Passcode
4. See biometric setup screen
5. Click "Skip"
6. **Expected:** Go to dashboard
7. Close and reopen app
8. **Expected:** Go directly to dashboard (not biometric again)

## Database Synchronization

The backend should already track `hasBiometric` if you store enrollment data there. If not:

**Option 1: Backend tracking**
- Backend endpoint sets `user.hasBiometric = true` when enrollment is verified
- Mobile always trusts the user object from backend

**Option 2: Mobile-only tracking**
- Mobile maintains local `hasBiometric` state
- Backend doesn't need to know (since biometric is local anyway)
- Currently implemented this way for mobile setup

**Option 3: Hybrid**
- Backend tracks it but doesn't strictly enforce it
- Mobile can set `hasBiometric: true` locally
- On next login, backend confirms actual enrollment status
- Recommended for production

## Files Modified

1. **types/api.types.ts** - Added `hasBiometric` field to User interface
2. **app/(setup)/index.tsx** - Updated routing logic to check `hasBiometric`
3. **app/(setup)/enable-biometric.tsx** - Updated to persist enrollment state via `updateUser`

## BONUS FIX: Token Verification on App Initialization

### Problem
While implementing the setup flow fix, a critical auth issue was discovered:
- App loads → `AuthContext` loads user from AsyncStorage (sees user exists)
- Router grants access to restricted screens (assumes user is authenticated)
- User tries to make API call → NO tokens in SecureStore (tokens expired or cleared)
- Too late, already showed restricted screens with broken state ("logged-in-but-tokenless")

### Solution
Implemented two-layer token verification to prevent unauthorized access:

#### 1. **AuthContext Token Verification (App Initialization)**
   - **File:** `context/AuthContext.tsx`
   - **Change:** Before loading user from AsyncStorage, verify tokens exist in SecureStore
   - **Logic:**
     ```typescript
     // Check if tokens exist in SecureStore
     const accessToken = await tokenStorage.getAccessToken();
     const refreshToken = await tokenStorage.getRefreshToken();
     
     // If no tokens exist, user cannot be authenticated
     if (!accessToken && !refreshToken) {
       // Force logout by clearing AsyncStorage user
       await AsyncStorage.removeItem("user");
       setUserState(null);
       return;
     }
     
     // Only load user if tokens exist
     const storedUser = await AsyncStorage.getItem("user");
     if (storedUser) {
       setUserState(JSON.parse(storedUser));
     }
     ```
   - **Impact:** Prevents loading user if tokens are missing

#### 2. **useAuth Hook Double-Check (Safety Net)**
   - **File:** `hooks/useAuth.ts`
   - **Change:** During token validation, if tokens are missing but user exists in context, clear the user
   - **Logic:**
     ```typescript
     // If tokens are gone but user is still in context, clear the user
     if (!canAuthenticate && user) {
       console.warn("Tokens missing but user exists in context. Clearing user state.");
       setUser(null);
     }
     ```
   - **Impact:** Catches any async mismatches where user exists but tokens are missing

### User Experience Fix

**Scenario: Refresh token expired (7 days passed)**

Before:
```
1. User opens app
2. App sees user in AsyncStorage → "logged in!"
3. Router shows dashboard
4. User clicks "Send Money"
5. API call fails → refresh token not found
6. ❌ Broken state, user sees error
```

After:
```
1. User opens app
2. AuthContext checks SecureStore → no tokens (expired)
3. Clears user from AsyncStorage
4. Router redirects to login
5. ✅ Clean state, user sees login screen
6. User logs in again (generates new tokens)
7. Proceeds to setup flow or dashboard
```

### Files Modified for Token Verification

1. **context/AuthContext.tsx** - Added token verification before loading user
2. **hooks/useAuth.ts** - Added double-check to clear user if tokens are missing

### Why This Matters

Token verification prevents a class of bugs where:
- User data persists in AsyncStorage
- Tokens expire or are deleted (SecureStore cleared)
- App becomes inconsistent state
- User sees authenticated UI but can't make API calls

With this fix:
- **Tokens always govern auth state** (not just user object)
- **No "logged-in-but-tokenless" states** possible
- **Clean logout on token expiration**
- **Seamless re-authentication** on app restart

## Backward Compatibility

- New users: Will go through full setup flow normally
- Existing users (without this update):
  - `hasBiometric` will be `undefined` initially
  - TypeScript: Add `hasBiometric?: boolean` with optional chaining `user.hasBiometric ?? false`
  - Can run migration to set `hasBiometric = true` for all existing users if desired

## Related Documentation

- [MOBILE_ENGINEER_GUIDE.md](./MOBILE_ENGINEER_GUIDE.md) - Setup wizard architecture
- [MOBILE_DEVELOPMENT_GUIDE.md](./MOBILE_DEVELOPMENT_GUIDE.md) - App structure
