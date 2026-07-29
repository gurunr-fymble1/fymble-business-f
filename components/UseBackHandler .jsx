import React, { useEffect, useRef } from "react";
import { BackHandler, ToastAndroid } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const useBackHandler = () => {
  const doubleBackPressRef = useRef(false);
  const timeoutRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (doubleBackPressRef.current) {
          // Exit app if back was already pressed recently
          BackHandler.exitApp();
          return true;
        }

        doubleBackPressRef.current = true;
        ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

        // Reset double back press after 2 seconds
        timeoutRef.current = setTimeout(() => {
          doubleBackPressRef.current = false;
        }, 2000);

        return true;
      };

      // Add back press handler
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      // Cleanup function
      return () => {
        backHandler.remove();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [])
  );
};

export default useBackHandler;
