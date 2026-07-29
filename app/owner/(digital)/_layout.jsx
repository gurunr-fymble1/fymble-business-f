import { Stack } from "expo-router";

export default function DigitalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="services"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="hours"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="account"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}
