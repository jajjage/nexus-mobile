# Profile Feature Implementation Guide

## Overview
Complete implementation of the Profile feature for Nexus Mobile (iOS/Android/Web), including personal info management, security hub, biometric device management, notification preferences, payment methods, and support.

**Status**: ✅ COMPLETE - All screens, routes, hooks, and forms implemented

---

## Architecture

### Route Structure
```
app/(tabs)/profile.tsx                    # Redirect to hub
  └── app/(tabs)/profile/
      ├── _layout.tsx                    # Stack navigator with 8 sub-routes
      ├── index.tsx                      # Profile hub (main screen)
      ├── personal-info.tsx              # Edit personal info
      ├── notifications.tsx              # Notification preferences
      ├── wallet.tsx                     # Payment methods (placeholder)
      ├── support.tsx                    # Support & FAQ
      └── security/
          ├── password.tsx               # Change password
          ├── pin.tsx                    # Transaction PIN
          ├── passcode.tsx               # App passcode
          └── biometric.tsx              # Biometric devices management
```

### Navigation Flow
```
Profile Tab (/(tabs)/profile.tsx)
  ↓ [Redirect]
Profile Hub (/(tabs)/profile/)
  ├─ Personal Information (/(tabs)/profile/personal-info)
  ├─ Security Hub (/(tabs)/profile/security)
  │   ├─ Change Password (/(tabs)/profile/security/password)
  │   ├─ Transaction PIN (/(tabs)/profile/security/pin)
  │   ├─ App Passcode (/(tabs)/profile/security/passcode)
  │   └─ Biometric Devices (/(tabs)/profile/security/biometric)
  ├─ Notifications (/(tabs)/profile/notifications)
  ├─ Payment Methods (/(tabs)/profile/wallet)
  └─ Support & Help (/(tabs)/profile/support)
```

---

## Implementation Details

### 1. **Profile Hub Screen** (`index.tsx`)
**Purpose**: Main profile dashboard with navigation menu

**Features**:
- User avatar with initials
- User info display (name, email)
- Navigation menu (5 items):
  - Personal Information
  - Security & Privacy
  - Notifications
  - Payment Methods
  - Help & Support
- Logout button with confirmation

**Props**: None (uses hooks)

**Hooks Used**:
- `useAuth()` - Get current user
- `useLogout()` - Logout mutation

**UI Components**:
- Pressable (menu items)
- Custom avatar display
- Logout button with error handling

---

### 2. **Personal Info Screen** (`personal-info.tsx`)
**Purpose**: Edit user profile information

**Form Fields**:
1. Full Name (2+ characters)
2. Email (valid email format)
3. Phone Number (10+ digits)

**Validation**:
- Uses `zod` schema validation
- react-hook-form with zodResolver

**Hooks Used**:
- `useUpdateProfile()` - Mutation hook
- Form control via `react-hook-form`

**Behavior**:
- Pre-fills with current user data
- Shows loading state during submission
- Toast notification on success/error
- Auto-redirects back after 1.5s success

---

### 3. **Security Hub Screen** (`security/security.tsx`)
**Purpose**: Security options navigation

**Menu Items** (4):
1. **Password** - Change login password
   - Badge: None
   - Route: `security/password`

2. **Transaction PIN** - 4-digit purchase PIN
   - Badge: "✓ Set" or "Not Set"
   - Route: `security/pin`

3. **App Passcode** - 6-digit soft lock code
   - Badge: "✓ Set" or "Not Set"
   - Route: `security/passcode`

4. **Biometric Devices** - Manage fingerprint/face ID
   - Badge: None
   - Route: `security/biometric`

**UI Elements**:
- Info banner explaining security importance
- Menu items with icons and status badges
- Colored badges (green "✓ Set", gray "Not Set")

---

### 4. **Change Password Screen** (`security/password.tsx`)
**Purpose**: Update login password

**Form Fields**:
1. Current Password (8+ chars)
2. New Password (8+ chars, 1 uppercase, 1 lowercase, 1 number)
3. Confirm Password (must match)

**Validation Rules**:
- Current password ≠ new password
- Passwords must match
- New password must meet complexity requirements

**Hooks Used**:
- `useUpdatePassword()` - Mutation hook

**Error Handling**:
- Form validation errors displayed inline
- API errors shown via toast

---

### 5. **Transaction PIN Screen** (`security/pin.tsx`)
**Purpose**: Set/update 4-digit transaction PIN

**Form Fields**:
1. PIN (exactly 4 digits, number-only keyboard)
2. Confirm PIN (exactly 4 digits, number-only keyboard)

**Validation**:
- Exactly 4 digits required
- Numeric input only
- Must match confirmation

**Hooks Used**:
- `useSetPin()` - Mutation hook

**Status Display**:
- Info section showing PIN purpose
- Current status: "PIN is currently set" (if user already has PIN)

---

### 6. **App Passcode Screen** (`security/passcode.tsx`)
**Purpose**: Set/update 6-digit app lock passcode

**Form Fields**:
1. Current Passcode (only if updating; 6 digits, hidden)
2. New Passcode (6 digits, hidden)
3. Confirm Passcode (6 digits, hidden)

**Validation**:
- Exactly 6 digits required
- Numeric input only
- Must match confirmation

**Hooks Used**:
- `useSetPasscode()` - Mutation hook

**Features**:
- Conditional current passcode field (only shown on update)
- Secure input with masking
- Info section explaining usage

---

### 7. **Biometric Devices Screen** (`security/biometric.tsx`)
**Purpose**: Manage registered WebAuthn devices

**Features**:
- **List Enrollments**:
  - Shows all active devices with status
  - Device icon by platform (iOS, Android, macOS, Windows)
  - Device name, platform, attachment type
  - Verification count and dates
  - Remove button

- **Device Information**:
  - Enrolled date/time
  - Last verified date/time
  - Verification count
  - Status: Active (green check) or Revoked

- **Empty State**:
  - Icon + message when no devices
  - Hint to register first device

- **Revoked Devices Section**:
  - Separate section showing disabled devices
  - Read-only (no remove button)

**Hooks Used**:
- `useBiometricEnrollments()` - Query
- `useDeleteBiometricEnrollment()` - Mutation
- `useBiometricAuditLogs()` - Query (future use)

**UI Elements**:
- Device cards with platform icons
- Status badges (green for active, gray for revoked)
- Info banner and footer explaining biometrics

---

### 8. **Notifications Preferences Screen** (`notifications.tsx`)
**Purpose**: Configure notification preferences

**Preference Groups**:

1. **Transactions** (2 items)
   - Purchase Confirmations
   - Receipt Notifications

2. **Account** (3 items)
   - Password Changes
   - Login Notifications
   - Security Alerts

3. **Promotions** (3 items)
   - Special Offers
   - Cashback Alerts
   - Referral Bonuses

**UI Elements**:
- Grouped toggle switches
- Each with label and description
- Color-coded toggles (primary color when enabled)
- Info footer with security note

**Hooks Used**:
- `useNotificationPreferences()` - Query
- `useUpdateNotificationPreference()` - Mutation

**Behavior**:
- Real-time toggle updates
- Shows loading state during update
- Toast notifications on success/error

---

### 9. **Payment Methods Screen** (`wallet.tsx`)
**Purpose**: Manage bank accounts and payment cards

**Status**: Placeholder (coming soon)

**Features** (planned):
- Bank account linking
- Saved payment cards
- Wallet balance display
- Transaction history

**Current Implementation**:
- Coming soon UI with feature list
- Prepared structure for future enhancement

---

### 10. **Support & Help Screen** (`support.tsx`)
**Purpose**: User support resources and FAQ

**Sections**:

1. **Contact Methods** (4 cards):
   - Email Support (support@nexus.ng)
   - Phone (Call Us)
   - Live Chat
   - Help Center

2. **FAQ** (4 items):
   - Password reset process
   - Forgotten PIN recovery
   - Biometric setup guide
   - Data encryption info

3. **Support Hours**: 9AM - 6PM WAT, Mon-Fri

**UI Elements**:
- Contact cards with icons
- FAQ items with collapsible answers
- Info banner with support hours

---

## Hooks & Services

### New Hooks Created

**`useBiometricManagement.ts`** - Biometric device management
```typescript
export function useBiometricEnrollments()
export function useDeleteBiometricEnrollment()
export function useBiometricAuditLogs(limit, offset)
export function useBiometricRegistration()
```

### Existing Hooks Used
```typescript
// Auth & User
useAuth()              // from hooks/useAuth.ts
useLogout()            // from hooks/useAuth.ts
useUpdateProfile()     // from hooks/useUser.ts
useUpdatePassword()    // from hooks/useUser.ts
useSetPin()            // from hooks/usePin.ts
useSetPasscode()       // from hooks/usePasscode.ts

// Notifications
useNotificationPreferences()      // from hooks/useNotificationPreferences.ts
useUpdateNotificationPreference() // from hooks/useNotificationPreferences.ts
```

### Services Used
```typescript
// User Service
userService.updateProfile(data)
userService.updatePassword(data)
userService.setPin(data)
userService.setPasscode(data)

// Biometric Service
biometricService.listEnrollments()
biometricService.revokeEnrollment(enrollmentId, reason)
biometricService.getAuditLog(limit, offset)

// Notification Preference Service
notificationPreferenceService.getPreferences()
notificationPreferenceService.updatePreference(data)
```

---

## Form Validation Schemas

### Personal Info
```typescript
z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\d{10,}$/)
})
```

### Change Password
```typescript
z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword)
 .refine(data => data.currentPassword !== data.newPassword)
```

### Transaction PIN
```typescript
z.object({
  pin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string()
}).refine(data => data.pin === data.confirmPin)
```

### App Passcode
```typescript
z.object({
  passcode: z.string().regex(/^\d{6}$/),
  confirmPasscode: z.string()
}).refine(data => data.passcode === data.confirmPasscode)
```

---

## Styling & Theme

### Color Palette
- **Primary**: `lightColors.primary` (Nexus gold #E69E19)
- **Background**: `lightColors.background` (white/light gray)
- **Text**: `lightColors.text` (dark gray/black)
- **Gray**: `lightColors.gray2`, `lightColors.gray3`
- **Success**: `#22c55e` (green)
- **Error**: `#e63636` (red)
- **Info Background**: `#f0f7ff` (light blue)

### Responsive Design
- Uses `useSafeAreaInsets()` for safe area handling
- Responsive padding (16px base)
- Mobile-first design approach

---

## Data Flows

### Update Profile Flow
```
Component (personal-info.tsx)
  ↓ [form submission]
useUpdateProfile() hook
  ↓ [mutation]
userService.updateProfile()
  ↓ [API call]
PUT /user/profile/me
  ↓ [response]
Query invalidation + cache update
  ↓ [success toast]
Router.back() after 1.5s
```

### Change Password Flow
```
Component (security/password.tsx)
  ↓ [form submission]
useUpdatePassword() hook
  ↓ [mutation]
userService.updatePassword()
  ↓ [API call]
POST /password/update-password
  ↓ [response]
Toast notification
  ↓ [success or error]
Router.back() or show error
```

### Delete Biometric Device Flow
```
Component (security/biometric.tsx)
  ↓ [user presses remove]
useDeleteBiometricEnrollment() hook
  ↓ [mutation]
biometricService.revokeEnrollment(enrollmentId)
  ↓ [API call]
DELETE /biometric/enrollments/:enrollmentId
  ↓ [response]
Query invalidation (enrollments + audit logs)
  ↓ [success toast + UI update]
```

### Update Notification Preference Flow
```
Component (notifications.tsx)
  ↓ [user toggles switch]
useUpdateNotificationPreference() hook
  ↓ [mutation]
notificationPreferenceService.updatePreference()
  ↓ [API call]
PUT /notification-preferences/:preferenceType
  ↓ [response]
Toast notification
  ↓ [immediate UI update with switch disabled during loading]
```

---

## Error Handling

### Form Validation Errors
- Displayed inline below input field
- User-friendly messages from zod schema
- Form submission disabled until fixed

### API Errors
- Caught in mutation onError callbacks
- Extracted message from `error.response?.data?.message`
- Shown via `toast.error(message)`
- User stays on screen to retry

### Network Errors
- Handled by React Query retry logic
- Automatic retry up to 3 times
- Eventually shows toast if all retries fail

### Loading States
- All buttons disabled during mutation
- ActivityIndicator shown in button
- Input fields optionally disabled

---

## Testing Checklist

### Personal Info Screen
- [ ] All fields pre-populate with current user data
- [ ] Form validation works (test invalid email, short name, etc)
- [ ] API error shown on failure
- [ ] Success toast appears on success
- [ ] Auto-redirect after success
- [ ] Loading state works during submission

### Password Change
- [ ] Current password required
- [ ] New password complexity validated
- [ ] Passwords must match
- [ ] Current ≠ new validation works
- [ ] Success/error flow works

### PIN/Passcode Screens
- [ ] Number-only keyboard
- [ ] Max length enforced (4/6 digits)
- [ ] Status displayed if already set
- [ ] Update vs set button text changes
- [ ] Success notification shown

### Biometric Devices
- [ ] Enrollments load and display
- [ ] Platform icons correct
- [ ] Status badge correct (active/revoked)
- [ ] Remove button works
- [ ] Empty state shown when no devices
- [ ] Verification count and dates display

### Notifications
- [ ] All preferences load
- [ ] Toggles update immediately
- [ ] API call made on toggle
- [ ] Toast shown on success/error
- [ ] Disabled state during loading

---

## Mobile Considerations

1. **Safe Area**: All screens use `useSafeAreaInsets()` for notch/cutout handling
2. **Keyboard**: Input screens use appropriate keyboard types (email, number-pad, etc)
3. **Touch Targets**: Minimum 44px for buttons/interactive elements
4. **ScrollView**: All screens scrollable for devices with limited screen space
5. **Loading States**: ActivityIndicator used instead of disabling (better UX)
6. **Gestures**: Back button on Android handled by Expo Router

---

## Future Enhancements

1. **Biometric Registration**: Add "Add New Device" button with WebAuthn flow
2. **Payment Methods**: Implement full wallet management
3. **Audit Logs**: Display biometric audit history in biometric screen
4. **Profile Picture**: Allow user to upload/change avatar
5. **Security Audit**: Show login history and active sessions
6. **Two-Factor Authentication**: Add 2FA option
7. **Data Export**: GDPR compliance - allow users to export data

---

## File Structure
```
app/(tabs)/
  ├── profile.tsx                    # Redirect to hub
  └── profile/
      ├── _layout.tsx                # Stack navigator
      ├── index.tsx                  # Hub (277 lines)
      ├── personal-info.tsx          # Edit form (151 lines)
      ├── notifications.tsx          # Preference toggles (249 lines)
      ├── wallet.tsx                 # Placeholder (87 lines)
      ├── support.tsx                # FAQ & contact (221 lines)
      └── security/
          ├── password.tsx           # Change password (165 lines)
          ├── pin.tsx                # Transaction PIN (165 lines)
          ├── passcode.tsx           # App passcode (200 lines)
          └── biometric.tsx          # Devices management (326 lines)

hooks/
  └── useBiometricManagement.ts      # New hook (87 lines)
```

---

## Summary
✅ Complete implementation of all profile features with:
- 10 screens (hub + 9 feature screens)
- 4 security forms with validation
- Biometric device management
- Notification preferences
- Support resources
- Professional UI with proper styling
- Error handling and loading states
- Mobile-responsive design
- Full integration with backend APIs
