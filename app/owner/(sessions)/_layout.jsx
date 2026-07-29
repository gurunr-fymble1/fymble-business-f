import { Stack } from "expo-router";

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="availableSessions"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="availableTrainers"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="sessionDetails"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}
