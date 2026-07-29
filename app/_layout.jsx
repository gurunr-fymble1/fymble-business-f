import "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, ErrorBoundary } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";

import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";
import { Platform, View, Text, AppState, LogBox } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationProvider } from "../context/NavigationContext";
import * as Notifications from "expo-notifications";
import { getToken } from "../utils/auth";
import { NoInternetScreen } from "../components/NoInternetScreen";
import { MaintenanceScreen } from "../components/MaintenanceScreen";
import { AppRedirectScreen } from "../components/AppRedirectScreen";
import { useNetworkStatusExpo } from "../hooks/useNetworkStatus";
import { useAppModal } from "../hooks/useAppModal";
import * as Updates from "expo-updates";

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  "VirtualizedLists should never be nested",
  "Non-serializable values were found",
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may already be hidden
});

// Global error handlers for production safety
if (typeof ErrorUtils !== "undefined") {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("Global Error Handler:", error, "isFatal:", isFatal);
    // Log to your error tracking service (e.g., Sentry)
    if (!isFatal) {
      // Continue app execution for non-fatal errors
      return;
    }
  });
}

// Catch unhandled promise rejections
// Note: React Native doesn't support window.addEventListener
// Use ErrorUtils.setGlobalHandler instead (already configured above)

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const channel =
        notification?.request?.content?.data?.channel || "default";

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldHandleActionButtons: true,
        vibrate: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    } catch (error) {
      console.error("Notification handler error:", error);
      return {
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
  },
});

async function configureNotificationChannels() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#FF231F7C",
        enableVibrate: true,
        sound: "default",
        enableLights: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.error("Failed to configure notification channels:", error);
  }
}

export default function RootLayout() {
  const [role, setRole] = useState("owner");
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isConnected, isRetrying, retryConnection } = useNetworkStatusExpo();
  const { showModal, modalType, message, redirectUrl } = useAppModal();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Pacifico_400Regular,
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      // Continue with app even if custom fonts fail
    }
  }, [error]);

  // Configure notification channels once
  useEffect(() => {
    configureNotificationChannels();
  }, []);

  // Check for OTA updates on app launch
  useEffect(() => {
    async function checkForUpdates() {
      try {
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.log("Update check failed:", error);
      }
    }
    checkForUpdates();
  }, []);

  // Wait for navigation to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auth check with proper error handling
  useEffect(() => {
    if (loaded && isNavigationReady) {
      const checkInitialAuth = async () => {
        try {
          const token = await getToken("access_token");
          if (!token) {
            // Ensure navigation is ready before replacing
            setTimeout(() => {
              try {
                router.replace("/");
              } catch (navError) {
                console.error("Navigation error:", navError);
              }
            }, 100);
          }
        } catch (error) {
          console.error("Auth check error:", error);
          // Don't crash the app, just log the error
        } finally {
          setIsCheckingAuth(false);
        }
      };
      checkInitialAuth();
    }
  }, [loaded, isNavigationReady]);

  // Hide splash screen when ready
  useEffect(() => {
    if (loaded && !isCheckingAuth) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch((err) => {
          console.log("Splash screen already hidden");
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loaded, isCheckingAuth]);

  // Show nothing while fonts are loading
  if (!loaded) {
    return null;
  }

  if (isConnected === false) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NoInternetScreen onRetry={retryConnection} isRetrying={isRetrying} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  if (showModal && modalType === "maintenance") {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <MaintenanceScreen message={message} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  if (showModal && modalType === "redirect") {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AppRedirectScreen message={message} redirectUrl={redirectUrl} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <NavigationProvider>
            <View style={{ zIndex: 999999 }}>
              <Toast topOffset={70} />
            </View>
            <Stack>
              <Stack.Screen
                name="owner/(tabs)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(diet)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(workout)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/(sessions)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/(digital)"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/(feed)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              {/* <Stack.Screen name="owner/(tabs)/manageClients" options={{ headerShown: false }} /> */}
              <Stack.Screen
                name="shimmerExamples"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="index"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="forgotpassword"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="register"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="changepassword"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="verificationowner"
                options={{ headerShown: false, gestureEnabled: false }}
              />

              <Stack.Screen
                name="owner/allclients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/Help"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/createPlans"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/gymdetails"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/assigntrainer"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assigntrainerpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assignworkoutpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assigndietpage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/assignplans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientdata"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientform"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/diet"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/gymdata"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageplans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/trainerform"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/workout_schedule"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/selectgym"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/ownerprofile"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/feedback"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/rewards"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/viewallfoods"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/addEnquiry"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageNutritionAndWorkoutTemplate"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/gymPlans"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientEstimate"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientEstimatePage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/unpaidMembers"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/paidMembersReceiptListPage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manageClients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/clientsManagement"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/client/[id]"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/rateus"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="owner/OtpVerification"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/allClientsPage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/importClients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/membershipPTClients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/dailyPassUsers"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/blockedUsers"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/royaltyUsers"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/referralsEarnings"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/deleteaccount"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/birthdayClientsPage"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manualClientImport"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/biometric"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/offlineclients"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/biometric-request"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/gympics"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/membershipBookings"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/quickplansetup"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/settings"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/agreement"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="registerDigital"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/dailyPassSessions"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="owner/editgymdetails"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/editpersonaldetails"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/editpaymentdetails"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/addnewgym"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manualClientEntry"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="owner/manualFeeUpdate"
                options={{ headerShown: false, gestureEnabled: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </NavigationProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
