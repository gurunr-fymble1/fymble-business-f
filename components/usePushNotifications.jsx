import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { getToken, saveToken } from "../utils/auth";
import { updateExpoTokenAPI } from "../services/Api";

const projectId = Constants.expoConfig?.extra?.eas?.projectId;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId) {
  useEffect(() => {
    if (!userId) return;

    registerForPushNotificationsAsync(userId);

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {}
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {});

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && userId) {
        registerForPushNotificationsAsync(userId);
      }
    });

    return () => {
      subscription.remove();
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [userId]);
}

export async function registerForPushNotificationsAsync(userId) {
  // if (Platform.OS === 'android') {
  //     await Notifications.setNotificationChannelAsync('default', {
  //         name: 'default',
  //         importance: Notifications.AndroidImportance.HIGH,
  //         lightColor: '#FF231F7C',
  //         enableVibrate: true,
  //         sound: 'default',
  //     });
  // }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    // Make sure we have a valid projectId
    if (!projectId) {
      console.error("Missing projectId in Constants.expoConfig.extra.eas");
      return null;
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const newToken = expoPushToken.data;
    const oldToken = await getToken("expoPushToken");

    if (newToken !== oldToken) {
      try {
        const payload = {
          expo_token: newToken,
          owner_id: userId,
        };
        const response = await updateExpoTokenAPI(payload);
        if (response?.status === 200) {
          await saveToken("expoPushToken", newToken);
          return newToken;
        } else {
          return null;
        }
      } catch (err) {
        return null;
      }
    } else {
      return newToken;
    }
  } catch (error) {
    return null;
  }
}
