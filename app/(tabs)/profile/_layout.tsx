import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        animation: "slide_from_right",
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: "none", // Prevent animation when going back to main profile
        }}
      />
      <Stack.Screen
        name="personal-info"
        options={{
          title: "Personal Information",
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          title: "Security Information",
        }}
      />
      <Stack.Screen
        name="security/password"
        options={{
          title: "Change Password",
        }}
      />
      <Stack.Screen
        name="security/pin"
        options={{
          title: "Transaction PIN",
        }}
      />
      <Stack.Screen
        name="security/passcode"
        options={{
          title: "App Passcode",
        }}
      />
      <Stack.Screen
        name="security/biometric"
        options={{
          title: "Biometric Devices",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notification Preferences",
        }}
      />
      <Stack.Screen
        name="wallet"
        options={{
          title: "Payment Methods",
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: "Support & Help",
        }}
      />
    </Stack>
  );
}
