import { Stack } from "expo-router";
import React from "react";

export default function FeedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="addOfferFormPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="addNewAnnouncementFormPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}
