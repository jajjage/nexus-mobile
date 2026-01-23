# Profile Feature - Quick Reference

## Route Map

| Screen | Route | File | Purpose |
|--------|-------|------|---------|
| Profile Hub | `/(tabs)/profile/` | `index.tsx` | Main navigation hub |
| Personal Info | `/personal-info` | `personal-info.tsx` | Edit name, email, phone |
| Security Hub | `/security` | `security.tsx` | Security menu |
| Change Password | `/security/password` | `password.tsx` | Update login password |
| Transaction PIN | `/security/pin` | `pin.tsx` | Set/update 4-digit PIN |
| App Passcode | `/security/passcode` | `passcode.tsx` | Set/update 6-digit code |
| Biometric | `/security/biometric` | `biometric.tsx` | Manage devices |
| Notifications | `/notifications` | `notifications.tsx` | Toggle preferences |
| Payment Methods | `/wallet` | `wallet.tsx` | Manage payment methods |
| Support | `/support` | `support.tsx` | Help & FAQs |

## Hooks to Use

```typescript
// Personal Info
import { useUpdateProfile } from "@/hooks/useUser";
const updateProfile = useUpdateProfile();
updateProfile.mutate({ fullName, email, phoneNumber });

// Password
import { useUpdatePassword } from "@/hooks/useUser";
const updatePassword = useUpdatePassword();
updatePassword.mutate({ currentPassword, newPassword });

// Transaction PIN
import { useSetPin } from "@/hooks/usePin";
const setPin = useSetPin();
setPin.mutate({ pin: "1234" });

// App Passcode
import { useSetPasscode } from "@/hooks/usePasscode";
const setPasscode = useSetPasscode();
setPasscode.mutate({ passcode: "123456" });

// Biometric Management
import { useBiometricManagement, useBiometricRevoke, useBiometricAuditLog } from "@/hooks/useBiometricManagement";
const enrollments = useBiometricManagement();
const revokeDevice = useBiometricRevoke();
const auditLog = useBiometricAuditLog();

// Notifications
import { useNotificationPreferences, useUpdateNotificationPreference } from "@/hooks/useNotificationPreferences";
const prefs = useNotificationPreferences();
const updatePref = useUpdateNotificationPreference();
updatePref.mutate({ type: "push", enabled: true });
```

## Common Patterns

### Form with Validation (Zod + React Hook Form)
```typescript
const schema = z.object({
  field: z.string().min(3, "Min 3 chars")
});

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { field: "" }
});

<Input
  label="Field"
  value={value}
  onChangeText={onChange}
  error={errors.field?.message}
/>
```

### Mutation with Toast
```typescript
const mutation = useMutation({
  mutationFn: (data) => userService.update(data),
  onSuccess: () => {
    toast.success("Updated!");
    router.back();
  },
  onError: (error) => {
    toast.error(error.response?.data?.message);
  }
});

mutation.mutate(data);
```

### Loading State
```typescript
<Button
  disabled={mutation.isPending}
  onPress={handleSubmit(onSubmit)}
>
  {mutation.isPending ? <ActivityIndicator /> : "Save"}
</Button>
```

## Data Flows

### Edit Profile
1. User navigates to Personal Info
2. Form pre-populates with current user data
3. User edits fields (validation on blur/submit)
4. Submit triggers `useUpdateProfile()` mutation
5. On success: cache invalidates, toast shows, back to hub
6. On error: toast shows error message, form stays open

### Set Transaction PIN
1. User navigates to Transaction PIN
2. If PIN already set, shows status badge
3. User enters 4-digit PIN
4. User confirms PIN
5. Submit triggers `useSetPin()` mutation
6. On success: `user.hasPin` updated, toast shows, back to security
7. On error: show error message, keep form open

### Biometric Registration
1. User navigates to Biometric Management
2. Lists all currently enrolled devices
3. User taps "Register Device"
4. Triggers WebAuthn flow (native API)
5. Device captures biometric
6. Sends verification payload to backend
7. On success: device added to list
8. On error: error modal with retry

## UI Color System

```typescript
const profileColors = {
  primary: "#E69E19",        // Nexus gold
  background: "#F9FAFB",     // Light gray
  text: "#1F2937",           // Dark gray
  textSecondary: "#6B7280",  // Medium gray
  border: "#E5E7EB",         // Border gray
  error: "#E63636",          // Red
  success: "#22c55e",        // Green
};
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "PIN must be 4 digits" | Invalid format | Enter exactly 4 numbers |
| "Passcode must be 6 digits" | Invalid format | Enter exactly 6 numbers |
| "Passwords do not match" | Mismatch | Re-enter confirm password |
| "New password must be different" | Same as current | Use a new password |
| "Invalid email address" | Bad format | Check email format |
| "Failed to register device" | Backend error | Try again or contact support |

## Mobile Testing

```bash
# Test on iOS simulator
npm run ios

# Test on Android emulator
npm run android

# Test on web
npm run web

# Test specific screen
# 1. Start dev server
npx expo start --clear
# 2. Go to Profile tab
# 3. Navigate through screens
```

## Debugging Tips

1. **Form not validating?**
   - Check Zod schema matches field names
   - Verify `resolver: zodResolver(schema)` is set

2. **Mutation not firing?**
   - Check `mutationFn` function doesn't have errors
   - Verify data passed to `mutate()` is correct

3. **Cache not updating?**
   - Check `queryClient.invalidateQueries()` is called
   - Verify query key matches actual cache key

4. **Biometric flow failing?**
   - Check device supports WebAuthn
   - Verify backend registration endpoint is available
   - Check network connectivity

5. **Toast not showing?**
   - Verify `sonner-native` package is installed
   - Check `<Toaster />` is rendered in app layout

---

## Quick Copy-Paste Examples

### Navigate to Profile
```tsx
router.push("/(tabs)/profile/");
```

### Navigate to Security
```tsx
router.push("/(tabs)/profile/security");
```

### Check if user has PIN set
```tsx
if (user?.hasPin) {
  // Show "Update PIN" instead of "Set PIN"
}
```

### Handle biometric error
```tsx
catch (error: any) {
  const message = error.response?.data?.message || "Registration failed";
  toast.error(message);
}
```

---

**Last Updated**: January 22, 2026  
**Profile Feature Status**: ✅ Complete and tested
