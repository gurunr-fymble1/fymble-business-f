import { Stack } from "expo-router";
import React from "react";

export default function DietLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="personalTemplate"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="dietVariant"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="addTemplateCategoryPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="addFoodListPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      {/* <Stack.Screen name="myListedFoodLogs" options={{ headerShown: false }} />
      <Stack.Screen name="todayFoodLogPage" options={{ headerShown: false }} />
      <Stack.Screen name="reportPage" options={{ headerShown: false }} />
      <Stack.Screen name="allfoods" options={{ headerShown: false }} />
      <Stack.Screen
        name="addTemplateCategoryPage"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="logDiet" options={{ headerShown: false }} />
      <Stack.Screen name="sampleTemplate" options={{ headerShown: false }} />
      <Stack.Screen name="addFoodListPage" options={{ headerShown: false }} />
      <Stack.Screen
        name="manualFoodSelector"
        options={{ headerShown: false }}
      /> */}
    </Stack>
  );
}
