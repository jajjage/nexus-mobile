import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="set-passcode" />
      <Stack.Screen name="enable-biometric" />
    </Stack>
  );
}
