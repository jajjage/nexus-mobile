# Biometric Toggle Fix - Visual Guide

## Problem vs Solution

### BEFORE: Hidden Button Problem
```
┌─────────────────────────────────────────┐
│ User has iPhone with Biometric enabled  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ user.hasBiometric = true (globally)     │
└─────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │  Check: Is button    │
         │  hidden if           │
         │  hasBiometric=true?  │
         │                      │
         │  YES → BUTTON HIDDEN │
         └──────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ User opens Android app                  │
│ NO biometric registered on Android yet  │
│                                         │
│ Expected: [+ Add Biometric] button      │
│ Actual:   (Button is HIDDEN) ❌         │
│                                         │
│ User can't enable biometric on Android! │
└─────────────────────────────────────────┘
```

### AFTER: Device-Specific Toggle
```
┌─────────────────────────────────────────┐
│ User has iPhone with Biometric enabled  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ enrollments = [                         │
│   { id: '1', platform: 'ios', ... },   │
│   { id: '2', platform: 'android', ... }│
│ ]                                       │
└─────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │  Check: Current device│
         │  enrollment exists?   │
         │                       │
         │ Platform.OS='android' │
         │ android enrollment?   │
         │ NO → TOGGLE OFF       │
         └──────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ User opens Android app                  │
│ NO biometric registered on Android      │
│                                         │
│ Expected: [◯ OFF] Toggle button         │
│ Actual:   [◯ OFF] Toggle button ✅      │
│                                         │
│ User taps toggle → Registers Android    │
│ Toggle becomes [● ON]                   │
└─────────────────────────────────────────┘
```

---

## Device Detection Logic

```
enrollments Array:
┌──────────────────────────────────────────────────────────────┐
│ [                                                            │
│   {                                                          │
│     id: 'enroll-1',                                          │
│     platform: 'ios',        ← Different platform             │
│     is_active: true,                                         │
│     device_name: 'iPhone 15 Pro',                            │
│   },                                                         │
│   {                                                          │
│     id: 'enroll-2',                                          │
│     platform: 'android',    ← Current device!               │
│     is_active: false,       ← Not enrolled yet              │
│     device_name: 'Samsung Galaxy',                           │
│   }                                                          │
│ ]                                                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ enrollments.find(e =>                 │
        │   e.is_active &&                      │
        │   e.platform === Platform.OS          │
        │ )                                      │
        │                                       │
        │ Platform.OS = "android"               │
        │ Find: is_active=true && platform=     │
        │       "android"                       │
        │ Result: NOT FOUND (undefined)         │
        └───────────────────────────────────────┘
                            ↓
            currentDeviceEnrollment = undefined
                            ↓
          isCurrentDeviceBiometricEnabled = false
                            ↓
              ┌──────────────────────┐
              │ Toggle shows as OFF   │
              │ [◯─ OFF]             │
              └──────────────────────┘
```

---

## Toggle State Machine

```
                        ┌─────────────────────┐
                        │ Initial State       │
                        │ Toggle OFF          │
                        └──────────┬──────────┘
                                   │
                                   │ User taps toggle
                                   ↓
                        ┌─────────────────────┐
                        │ Loading State       │
                        │ [spinner]           │
                        │ setToggling(true)   │
                        └──────────┬──────────┘
                                   │
            ┌──────────────────────┴──────────────────────┐
            │                                             │
            ↓ SUCCESS                                     ↓ ERROR
    ┌──────────────────────┐               ┌──────────────────────┐
    │ Biometric Enabled    │               │ Failed to Toggle     │
    │ [● ON]               │               │ Show error alert     │
    │ Update: enrollments  │               │ Reset: Toggle OFF    │
    │ Refetch data         │               │ [◯─ OFF]             │
    └──────────────────────┘               └──────────────────────┘
            │                                             │
            │                                             │
            └──────────────────────┬──────────────────────┘
                                   │
                        ┌─────────────────────┐
                        │ Ready for next      │
                        │ toggle action       │
                        └─────────────────────┘
```

---

## User Flow Diagram

### Scenario: Enable Biometric on Android After Having It on iOS

```
START
  │
  ├─→ [Open Profile] → [Security] → [Biometric]
  │
  ├─→ Load enrollments from backend
  │   enrollments: [
  │     { id: '1', platform: 'ios', is_active: true },
  │     { id: '2', platform: 'android', is_active: false }
  │   ]
  │
  ├─→ Render "This Device" section
  │   Platform.OS = 'android'
  │   currentDeviceEnrollment = undefined (no active android)
  │   isCurrentDeviceBiometricEnabled = false
  │
  ├─→ Show toggle as OFF [◯─ OFF]
  │   "Not enabled on this device"
  │
  ├─→ User taps toggle
  │
  ├─→ handleToggleBiometric()
  │   ├─→ setTogglingBiometric(true)
  │   ├─→ Check: isCurrentDeviceBiometricEnabled? NO
  │   ├─→ Go to ENABLE path
  │   └─→ Call registerBiometric()
  │
  ├─→ BiometricRegistration Hook
  │   ├─→ Show native fingerprint dialog
  │   ├─→ User authenticates with fingerprint
  │   ├─→ Generate WebAuthn attestation
  │   ├─→ POST /api/biometric/register
  │
  ├─→ Backend Response
  │   ├─→ Verify attestation
  │   ├─→ Create enrollment
  │   ├─→ Return success
  │
  ├─→ Handle Success
  │   ├─→ updateUser({ hasBiometric: true })
  │   ├─→ refetch() → Refresh enrollments
  │   ├─→ New enrollments: [
  │   │     { id: '1', platform: 'ios', is_active: true },
  │   │     { id: '2', platform: 'android', is_active: true } ← NEW!
  │   │   ]
  │   ├─→ currentDeviceEnrollment = { id: '2', ... }
  │   ├─→ isCurrentDeviceBiometricEnabled = true
  │   ├─→ Re-render toggle as ON [●─ ON]
  │   ├─→ Show success alert
  │   └─→ setTogglingBiometric(false)
  │
  ├─→ User sees
  │   ├─→ Toggle now ON [●─ ON]
  │   ├─→ Status: "Enabled on this device"
  │   ├─→ Device appears in "Registered Devices" list
  │   └─→ Both iOS and Android show in device list
  │
  └─→ END

✅ Success: User has biometric on both iOS and Android!
```

---

## Data Structure

### enrollments Array Element
```typescript
{
  id: string;                          // Unique enrollment ID
  platform: "ios" | "android";         // Device platform
  device_name: string;                 // "iPhone 15 Pro" or "Samsung Galaxy"
  authenticator_attachment: string;    // "platform" | "cross-platform"
  enrolled_at: string;                 // ISO datetime
  last_verified_at: string | null;     // Last use time
  verification_count: number;          // Times used for auth
  is_active: boolean;                  // true = enrolled, false = revoked
}
```

### Detection Logic
```typescript
// Current device's enrollment
const currentDeviceEnrollment = enrollments?.find(e => 
  e.is_active &&              // Must be active/enrolled
  e.platform === Platform.OS  // Must match current platform
);

// Enrollment exists? = biometric enabled on this device
const isCurrentDeviceBiometricEnabled = !!currentDeviceEnrollment;
// true  = toggle should show ON
// false = toggle should show OFF
```

---

## Component Lifecycle

```
┌──────────────────────────────────┐
│ BiometricDevicesScreen Mounted   │
└──────────────────┬───────────────┘
                   │
         ┌─────────┴─────────┐
         │ Fetch enrollments │
         │ useBiometricEnr.. │
         └────────┬──────────┘
                  │
          ┌───────▼────────┐
          │ Compute state  │
          │ current = find │
          │ enabled =      │
          │ !!current      │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │ Render UI      │
          │ Toggle = ON/OFF│
          │ Devices list   │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │ User interaction
          │ [Tap toggle]   │
          └───────┬────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
    Enable              Disable
   (OFF→ON)             (ON→OFF)
       │                     │
    Register           Revoke
   Biometric          Biometric
       │                     │
    API Call            API Call
       │                     │
    Refetch          Refetch
  Enrollments       Enrollments
       │                     │
       └──────────┬──────────┘
                  │
          ┌───────▼────────┐
          │ Re-compute     │
          │ state & render │
          │ Update UI      │
          └───────┬────────┘
                  │
        ┌─────────▼────────┐
        │ Ready for next   │
        │ toggle action    │
        └──────────────────┘
```

---

## Toggle Button Appearance

### OFF State (Not Enabled on This Device)
```
┌────────────────────────────────────┐
│ This Device                        │
├────────────────────────────────────┤
│ 📱 Fingerprint                     │
│    Not enabled on this device      │
│                              [◯─]  │
│                             GRAY   │
└────────────────────────────────────┘

Color: #ccc (gray)
Dot position: LEFT side
Background: #f5f5f5
```

### ON State (Enabled on This Device)
```
┌────────────────────────────────────┐
│ This Device                        │
├────────────────────────────────────┤
│ 📱 Face ID                         │
│    Enabled on this device          │
│                              [─●]  │
│                             GREEN  │
└────────────────────────────────────┘

Color: #22c55e (green)
Dot position: RIGHT side
Background: #e8f5e9 (light green)
```

---

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Detection** | Global `hasBiometric` flag | Current device platform check |
| **Toggle** | Hidden if enrolled elsewhere | Always visible |
| **UX** | Two buttons (Add/Remove) | One button (Toggle ON/OFF) |
| **Multi-device** | Confusing state | Clear per-device control |
| **Visual** | Yellow "Add" button | Green/Gray toggle switch |

---

## Summary

```
OLD LOGIC:
  if (user.hasBiometric) hide_button()
  
  Problem: Hides button even on new device

NEW LOGIC:
  if (current_device_enrolled) show_toggle_ON()
  else show_toggle_OFF()
  
  Benefit: Always shows toggle, device-specific state
```

The fix enables users to independently manage biometric authentication on each of their devices without conflicts or hidden UI elements.
