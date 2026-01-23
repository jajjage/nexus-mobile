# Profile Feature - Mobile Implementation Guide

## 📋 Overview

The Profile feature is a comprehensive user account management system with the following sections:

- **Personal Information**: Edit profile details (name, phone, email)
- **Security**: Password, PIN, Passcode, and Biometric management
- **Notifications**: Manage notification preferences by category
- **Wallet**: Bank account and payment method settings
- **Support**: Help center and contact options

---

## 🗂️ Route Structure

```
/dashboard/profile
├── /dashboard/profile/personal-info     (Edit name, phone, email)
├── /dashboard/profile/security          (Security hub - password, PIN, passcode, biometric)
│   ├── /security/password               (Change password)
│   ├── /security/pin                    (Transaction PIN setup/change)
│   ├── /security/passcode               (App passcode setup/change)
│   └── /security/biometric              (Biometric enrollment/management)
├── /dashboard/profile/notifications     (Notification preferences)
├── /dashboard/profile/wallet            (Bank accounts & payment methods)
└── /dashboard/profile/support           (Help & Support)
```

---

## 📱 Routes & Pages Breakdown

### 1. **Profile Hub** (`/dashboard/profile`)

**File**: `src/app/dashboard/profile/page.tsx`

**Purpose**: Main profile hub showing user info and navigation menu

**Components Used**:

- `Avatar` - Display user profile picture
- `Card` - Menu grouping containers
- `Button` - Navigation and logout

**Hooks**:

```typescript
const { user } = useAuth(); // Get current user
const { mutate: logout, isPending: isLoggingOut } = useLogout(); // Logout
const { getStatus: getUpgradeStatus } = useResellerUpgradeStatus(); // Check reseller status
```

**Key Features**:

- Displays user's avatar and full name
- Shows account balance and cashback balance
- Menu groups: Account, Security, Support
- Reseller upgrade promo banner (for non-resellers)
- Logout functionality

**Data Flow**:

```
useAuth() → Get user from AuthContext → Display user info
                                      → Check role for reseller banner
```

---

### 2. **Personal Information** (`/dashboard/profile/personal-info`)

**File**: `src/app/dashboard/profile/personal-info/page.tsx`

**Component**: `EditProfileForm` (`src/components/features/profile/edit-profile-form.tsx`)

**Purpose**: Edit user's name, phone number, and email

**Form Schema**:

```typescript
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional(), // Read-only
});
```

**Hooks**:

```typescript
const { user } = useAuth(); // Get current user data
const { mutate: updateProfile, isPending } = useUpdateProfile(); // Update profile mutation
```

**Services Called**:

- `userService.updateProfile(data)` - Send update to backend

**API Endpoint**:

```
PUT /user/profile/me
Body: {
  fullName: string,
  phoneNumber: string
}
Response: ProfileResponse
```

**Key Features**:

- Pre-fills form with current user data
- Email field is read-only (cannot be changed via profile)
- Form validation with Zod
- Shows loading state during submission
- Success/error toast notifications
- Redirects back to profile page on success

**Data Flow**:

```
EditProfileForm
├── useAuth() → Get user data → Set form defaults
├── useUpdateProfile() → Mutation hook
│   ├── userService.updateProfile()
│   │   └── PUT /user/profile/me
│   ├── onSuccess → Invalidate auth query → Redirect
│   └── onError → Show error toast
└── React Hook Form validation
```

---

### 3. **Security Hub** (`/dashboard/profile/security`)

**File**: `src/app/dashboard/profile/security/page.tsx`

**Purpose**: Central hub for all security settings

**Sections**:

#### A. **Authentication Security**

1. **Password** - Change login password
2. **Transaction PIN** - 6-digit code for transactions

#### B. **App Security**

1. **App Passcode** - 6-digit code for soft-lock/app protection
2. **Biometric** - Fingerprint or Face ID enrollment

**Hooks**:

```typescript
const { label } = useBiometricType(); // Get device biometric type (Face ID, Fingerprint, etc.)
```

**UI Features**:

- Card-based navigation with gradient backgrounds
- Hover animations
- Icon indicators for each security option
- Arrow indicators on hover for mobile UX

---

### 4. **Change Password** (`/dashboard/profile/security/password`)

**File**: `src/app/dashboard/profile/security/password/page.tsx`

**Component**: `ChangePasswordForm`

**Purpose**: Allow users to change their login password

**Form Fields**:

```typescript
{
  currentPassword: string,        // Current password (required)
  newPassword: string,            // New password (min 8 chars, complexity rules)
  confirmPassword: string         // Confirm new password (must match)
}
```

**Hooks**:

```typescript
const { mutate: changePassword, isPending } = useChangePassword();
```

**Services Called**:

- `userService.updatePassword(data)`

**API Endpoint**:

```
POST /password/update-password
Body: {
  currentPassword: string,
  newPassword: string
}
Response: ApiResponse
```

**Validations**:

- Current password must match
- New password must be at least 8 characters
- Passwords must not match
- Password complexity checks

**Key Features**:

- Password strength indicator
- Show/hide password toggle
- Real-time form validation
- Loading state during submission

---

### 5. **Transaction PIN** (`/dashboard/profile/security/pin`)

**File**: `src/app/dashboard/profile/security/pin/page.tsx`

**Component**: `SetTransactionPinForm`

**Purpose**: Set or update 6-digit PIN for transaction verification

**Form Fields**:

```typescript
{
  currentPin?: string,   // Current PIN (if updating)
  newPin: string,        // New PIN (6 digits, numeric only)
  confirmPin: string     // Confirm PIN
}
```

**Hooks**:

```typescript
const { mutate: setPin, isPending } = useSetPin();
```

**Services Called**:

- `userService.setPin(data)`

**API Endpoint**:

```
PUT /user/profile/pin
Body: {
  pin: string,
  currentPin?: string    // Required if updating existing PIN
}
Response: ApiResponse
```

**Validations**:

- PIN must be exactly 6 digits
- PIN must be numeric only
- Cannot reuse current PIN
- Confirm PIN must match

**Key Features**:

- Numeric keypad UI
- PIN display masking
- Clear/backspace functionality
- Set or Update flow based on user state

---

### 6. **App Passcode** (`/dashboard/profile/security/passcode`)

**File**: `src/app/dashboard/profile/security/passcode/page.tsx`

**Component**: `SetPasscodeForm`

**Purpose**: Set or update 6-digit soft-lock passcode for app security

**Form Fields**:

```typescript
{
  currentPasscode?: string,   // Current passcode (if updating)
  newPasscode: string,        // New passcode (6 digits)
  confirmPasscode: string     // Confirm passcode
}
```

**Hooks**:

```typescript
const { mutate: setPasscode, isPending } = useSetPasscode();
```

**Services Called**:

- `userService.setPasscode(data)`

**API Endpoint**:

```
POST /user/profile/passcode
Body: {
  passcode: string,
  currentPassword?: string  // Required if updating
}
Response: ApiResponse
```

**Difference from PIN**:

- **Passcode**: Used for soft-lock (device-only, no backend verification)
- **PIN**: Used for transaction verification (backend verified)

**Key Features**:

- Numeric keypad UI
- Passcode masking
- Used for app unlock flow
- Optional - only required for soft-lock

---

### 7. **Biometric** (`/dashboard/profile/security/biometric`)

**File**: `src/app/dashboard/profile/security/biometric/page.tsx`

**Components**:

- `BiometricRegistration` - Register new device
- `BiometricEnrollments` - List enrolled devices
- `BiometricAuditLogs` - View biometric access history

**Purpose**: Manage WebAuthn biometric enrollments for passwordless authentication

**Hooks**:

```typescript
const { data: enrollments, isLoading } =
  useBiometricEnrollments(isAuthenticated);
const { mutate: register, isPending } = useBiometricRegistration();
const { data: auditLogs, isLoading: logsLoading } = useBiometricAuditLogs();
```

**Services Called**:

- `WebAuthnService.isWebAuthnSupported()` - Check device support
- `WebAuthnService.getRegistrationOptions()` - Get registration challenge
- `WebAuthnService.createCredential(options)` - Create WebAuthn credential
- `biometricService.registerDevice(data)` - Save to backend

**API Endpoints**:

```
GET /biometric/enrollments
  Response: BiometricEnrollment[]

POST /biometric/register
  Body: { deviceName, credentialId, publicKey, ... }
  Response: BiometricDevice

GET /biometric/audit-logs
  Response: BiometricAuditLog[]

DELETE /biometric/enrollments/{enrollmentId}
  Response: ApiResponse
```

**Key Features**:

- WebAuthn (FIDO2) support detection
- Multi-device registration
- Device naming for easy identification
- Audit logs showing access history
- Remove/revoke device capability

**Registration Flow**:

```
User Initiates Registration
├── Check WebAuthn support
├── Get registration options from backend
├── Create credential using device biometric
├── Get device info (browser, OS)
├── Send credential to backend
└── Store enrollment in database
```

---

### 8. **Notifications** (`/dashboard/profile/notifications`)

**File**: `src/app/dashboard/profile/notifications/page.tsx`

**Purpose**: Manage notification preferences by category

**Notification Categories**:

```typescript
{
  id: "all",      label: "All Notifications"
  id: "news",     label: "News"
  id: "updates",  label: "Updates"
  id: "alerts",   label: "Alerts"
  id: "offer",    label: "Offer"
}
```

**Hooks**:

```typescript
const { data: preferencesResponse, isLoading } = useNotificationPreferences();
const { mutate: updatePreference, isPending: isUpdating } =
  useUpdateNotificationPreference();
```

**Services Called**:

- `notificationPreferenceService.getPreferences()`
- `notificationPreferenceService.updatePreference(data)`

**API Endpoints**:

```
GET /notification-preferences
  Response: NotificationPreference[]

PUT /notification-preferences/{category}
  Body: { category: string, subscribed: boolean }
  Response: NotificationPreferencesResponse
```

**Key Features**:

- Toggle switches for each category
- Real-time preference updates
- Master "All Notifications" toggle
- Shows current preference status

**Data Flow**:

```
NotificationsPage
├── useNotificationPreferences() → Fetch all preferences
│   └── Map to state: Record<category, boolean>
├── handleToggle(category)
│   ├── Update local state
│   └── useUpdateNotificationPreference()
│       ├── notificationPreferenceService.updatePreference()
│       │   └── PUT /notification-preferences/{category}
│       └── Show success/error toast
└── Display preferences with switches
```

---

## 🔗 Component Architecture

### Component Hierarchy

```
ProfilePage (/dashboard/profile)
├── Avatar (User profile picture)
├── Card (Menu groups)
│   ├── MenuItem (Account - Personal Info)
│   ├── MenuItem (Account - Wallet)
│   ├── MenuItem (Security)
│   └── MenuItem (Support)
├── BecomeResellerModal
└── BottomNav

EditProfilePage (/personal-info)
└── EditProfileForm
    ├── Form (React Hook Form)
    ├── FormField (Full Name)
    ├── FormField (Phone Number)
    ├── FormField (Email - read-only)
    └── Button (Submit/Cancel)

SecurityPage (/security)
├── SecurityCard (Password)
├── SecurityCard (PIN)
├── SecurityCard (Passcode)
└── SecurityCard (Biometric)

NotificationsPage (/notifications)
├── NotificationCategory
│   ├── Label
│   ├── Description
│   └── Switch (Toggle)
└── Button (Back)
```

---

## 🪝 Hooks Reference

### **Authentication & User**

#### `useAuth()`

```typescript
const { user, isLoading, error, refetch } = useAuth();
```

- Get current user profile
- User data includes: id, email, fullName, phoneNumber, balance, cashback, etc.
- 5-minute cache stale time
- No auto-refetch on mount or window focus

#### `useLogout()`

```typescript
const { mutate: logout, isPending } = useLogout();
```

- Logout user and clear session
- Clears cookies and tokens
- Redirects to login

#### `useUpdateProfile()`

```typescript
const { mutate: updateProfile, isPending } = useUpdateProfile();
```

- Update user profile (name, phone)
- Invalidates auth query on success
- Shows toast notifications

---

### **Security - Password**

#### `useChangePassword()`

```typescript
const { mutate: changePassword, isPending } = useChangePassword();
```

- Mutation to update password
- Validates current password
- Checks password strength
- Shows error/success toast

---

### **Security - PIN**

#### `useSetPin()`

```typescript
const { mutate: setPin, isPending } = useSetPin();
```

- Set or update transaction PIN
- Validates 6-digit format
- Requires current PIN if updating
- Backend: `PUT /user/profile/pin`

---

### **Security - Passcode**

#### `useSetPasscode()`

```typescript
const { mutate: setPasscode, isPending } = useSetPasscode();
```

- Set or update app passcode
- Validates 6-digit numeric format
- Used for soft-lock
- Backend: `POST /user/profile/passcode`

#### `useVerifyPasscode()`

```typescript
const { mutate: verifyPasscode, isPending } = useVerifyPasscode();
```

- Verify passcode for app unlock
- Local verification (stored in localStorage)
- No server call

---

### **Security - Biometric**

#### `useBiometricEnrollments(enabled)`

```typescript
const { data: enrollments, isLoading } = useBiometricEnrollments(true);
```

- List all biometric enrollments for user
- Returns array of registered devices
- Backend: `GET /biometric/enrollments`

#### `useBiometricRegistration()`

```typescript
const { mutate: register, isPending } = useBiometricRegistration();
```

- Register new biometric device
- Uses WebAuthn API
- Returns: BiometricDevice with enrollmentId

#### `useBiometricAuditLogs()`

```typescript
const { data: auditLogs, isLoading } = useBiometricAuditLogs();
```

- Fetch biometric access audit logs
- Shows when biometric was used
- Backend: `GET /biometric/audit-logs`

#### `useBiometricType()`

```typescript
const { label } = useBiometricType();
// Returns: "Face ID" | "Fingerprint" | "Biometric" (fallback)
```

- Detect device's available biometric type
- Used for UI labels

---

### **Notifications**

#### `useNotificationPreferences()`

```typescript
const { data: prefs, isLoading } = useNotificationPreferences();
```

- Query hook to fetch user's notification preferences
- Returns: NotificationPreference[]
- Backend: `GET /notification-preferences`

#### `useUpdateNotificationPreference()`

```typescript
const { mutate: updatePreference, isPending } =
  useUpdateNotificationPreference();
```

- Mutation to update single preference
- Backend: `PUT /notification-preferences/{category}`
- Shows success/error toast

---

## 📡 Services Reference

### **userService**

```typescript
// Get current user profile
getProfile(): Promise<ProfileResponse>

// Update user profile
updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse>

// Update password
updatePassword(data: UpdatePasswordRequest): Promise<ApiResponse>

// Set/update transaction PIN
setPin(data: SetPinRequest): Promise<ApiResponse>

// Set/update app passcode
setPasscode(data: { passcode: string, currentPasscode?: string }): Promise<ApiResponse>
```

---

### **biometricService**

```typescript
// List all biometric enrollments
listEnrollments(): Promise<BiometricDevice[]>

// Register new device
registerDevice(data: {
  deviceName: string,
  credentialId: string,
  publicKey: string,
  // ...
}): Promise<BiometricDevice>

// Remove/revoke enrollment
removeEnrollment(enrollmentId: string): Promise<ApiResponse>

// Get audit logs
getAuditLogs(): Promise<BiometricAuditLog[]>
```

---

### **notificationPreferenceService**

```typescript
// Get all preferences
getPreferences(): Promise<NotificationPreference[]>

// Update single preference
updatePreference(data: UpdateNotificationPreferenceRequest): Promise<NotificationPreferencesResponse>

// Update multiple preferences
updatePreferences(data: NotificationPreference[]): Promise<ApiResponse>
```

---

## 📊 Data Flow Examples

### **Flow 1: Update Profile**

```
User clicks "Save Changes" in EditProfileForm
    ↓
useUpdateProfile() mutation triggered
    ↓
userService.updateProfile({ fullName, phoneNumber })
    ↓
API Call: PUT /user/profile/me
    ↓
Backend validates and updates
    ↓
Response: Updated ProfileResponse
    ↓
onSuccess callback:
├── Invalidate auth query (forces refetch)
├── useAuth() receives new user data
├── Show success toast
└── Redirect to /dashboard/profile
```

---

### **Flow 2: Register Biometric Device**

```
User clicks "Register Device" on Biometric page
    ↓
useBiometricRegistration() mutation triggered
    ↓
Check WebAuthn support
    ↓
Get registration options: POST /biometric/registration-options
    ↓
Create credential using device biometric (local)
    ↓
Gather device info (browser, OS)
    ↓
Register device: POST /biometric/register
    ↓
Backend validates credential and stores
    ↓
Response: BiometricDevice
    ↓
onSuccess:
├── Invalidate biometric enrollments query
├── Show success toast
└── useBiometricEnrollments() refetches
```

---

### **Flow 3: Update Notification Preference**

```
User toggles notification switch (e.g., "News")
    ↓
handleToggle("news")
    ↓
Update local state immediately (optimistic update)
    ↓
useUpdateNotificationPreference() mutation triggered
    ↓
notificationPreferenceService.updatePreference({
  category: "news",
  subscribed: true
})
    ↓
API Call: PUT /notification-preferences/news
    ↓
Backend updates preference
    ↓
Response: NotificationPreferencesResponse
    ↓
onSuccess: Show success toast
onError: Revert local state + Show error toast
```

---

## 🔐 Authentication & Security

### **Protected Routes**

All profile routes require authentication:

- Checked by `useAuth()` hook
- If user is null, component returns early
- Router redirects to login if session expires

### **Token Refresh**

- HTTPOnly cookies store access and refresh tokens
- Automatic token refresh via axios interceptor
- Seamless re-auth on 401 responses

### **PIN vs Passcode**

| Aspect       | PIN                      | Passcode               |
| ------------ | ------------------------ | ---------------------- |
| Purpose      | Transaction verification | Soft-lock (app unlock) |
| Verification | Server-validated         | Client-side only       |
| Backend      | Yes                      | No                     |
| Length       | 6 digits                 | 6 digits               |
| Use Case     | Topup, withdrawals       | App protection         |

---

## 📱 Mobile Considerations

### **Responsive Design**

- All pages use responsive Tailwind classes
- Mobile-first approach
- `pb-20` or `pb-28` padding for bottom nav
- Touch-friendly button sizes (min 44px)

### **Bottom Navigation**

- Profile page accessible from bottom nav
- Sub-pages have back button (header)
- Sticky headers for easy navigation on mobile

### **Biometric on Mobile**

- WebAuthn supported on modern mobile browsers
- Fallback to PIN/Passcode if not supported
- Uses device's native biometric APIs

### **Performance**

- 5-minute cache for user data
- No unnecessary refetches
- Optimistic UI updates for notifications
- Loading states for async operations

---

## 🧪 Testing Checklist

- [ ] User profile loads correctly
- [ ] Edit profile form submits and updates user data
- [ ] Password change validates and updates
- [ ] PIN set/update works with 6-digit validation
- [ ] Passcode set/update works with 6-digit validation
- [ ] Biometric registration works on WebAuthn-supported devices
- [ ] Notification preferences toggle and persist
- [ ] Logout clears session and redirects
- [ ] All forms show validation errors
- [ ] Loading states display during mutations
- [ ] Success/error toasts appear
- [ ] Back navigation works on all sub-pages
- [ ] Responsive design on mobile devices
- [ ] Token refresh works on expired sessions

---

## 🚀 Quick Start for Mobile Developers

### **To Add a New Security Feature**

1. Create page file: `src/app/dashboard/profile/security/[feature]/page.tsx`
2. Create form component: `src/components/features/security/[Feature]Form.tsx`
3. Create hook: `src/hooks/use[Feature].ts` with mutation
4. Add service method: `src/services/[service].service.ts`
5. Add route to security hub: `src/app/dashboard/profile/security/page.tsx`
6. Link component to form component

### **To Modify User Profile**

1. Update `userService.updateProfile()` in `src/services/user.service.ts`
2. Update form schema in `EditProfileForm`
3. Update `UpdateProfileRequest` type if needed
4. Test with `useUpdateProfile()` hook

### **To Add Notification Category**

1. Add category to backend database
2. Update `NOTIFICATION_CATEGORIES` in notifications page
3. Preferences will be queried and displayed automatically

---

## 📝 Type Definitions

See `src/types/` for complete types:

- `user.types.ts` - User-related types
- `api.types.ts` - General API types
- `auth.types.ts` - Authentication types
- `notification-preference.types.ts` - Notification types

---

## 🔗 Related Documentation

- [CODEBASE_ARCHITECTURE.md](CODEBASE_ARCHITECTURE.md) - Architecture overview
- [AUTH_LIFECYCLE_DEEP_ANALYSIS.md](AUTH_LIFECYCLE_DEEP_ANALYSIS.md) - Authentication flow
- [BIOMETRIC_INTEGRATION_QUICKREF.md](BIOMETRIC_INTEGRATION_QUICKREF.md) - Biometric details
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) - Testing approach

---

## 📞 API Summary

| Method | Endpoint                               | Purpose                |
| ------ | -------------------------------------- | ---------------------- |
| GET    | `/user/profile/me`                     | Get user profile       |
| PUT    | `/user/profile/me`                     | Update profile         |
| POST   | `/password/update-password`            | Update password        |
| PUT    | `/user/profile/pin`                    | Set/update PIN         |
| POST   | `/user/profile/passcode`               | Set/update passcode    |
| GET    | `/biometric/enrollments`               | List biometric devices |
| POST   | `/biometric/register`                  | Register device        |
| DELETE | `/biometric/enrollments/{id}`          | Remove device          |
| GET    | `/biometric/audit-logs`                | Get access logs        |
| GET    | `/notification-preferences`            | Get preferences        |
| PUT    | `/notification-preferences/{category}` | Update preference      |

---

**Last Updated**: January 22, 2026
**Version**: 1.0
