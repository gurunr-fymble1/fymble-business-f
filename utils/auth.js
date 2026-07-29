import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const saveToken = async (key, value) => {
  if (Platform.OS === "web") {
    return localStorage.setItem(key, value);
  } else {
    return await SecureStore.setItemAsync(key, value);
  }
};

export const getToken = async (key) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const deleteToken = async (key) => {
  if (Platform.OS === "web") {
    return localStorage.removeItem(key);
  } else {
    return await SecureStore.deleteItemAsync(key);
  }
};

export const logout = async () => {
  try {
    // List of all possible tokens and user data to clear
    const tokensToDelete = [
      "access_token",
      "refresh_token",
      "owner_id",
      "trainer_id",
      "role",
      "gym_id",
      "gym_name",
      "name",
      "gym_logo",
    ];

    // Clear all tokens
    for (const token of tokensToDelete) {
      await deleteToken(token);
    }

    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
};

export const logoutWithNavigation = async (router) => {
  try {
    const success = await logout();
    if (success) {
      router.dismissAll();
      router.replace("/");
    }
    return success;
  } catch (error) {
    console.error("Error during logout with navigation:", error);
    return false;
  }
};
