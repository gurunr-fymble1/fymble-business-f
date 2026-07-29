import React, { useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const useBackHandler = ({
  onFirstBackPress,
  onBackPress,
  exitApp = true,
  message = 'Press back again to exit',
  delay = 2000,
}) => {
  const doubleBackPressRef = useRef(false);
  const timeoutRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (doubleBackPressRef.current) {
          if (onBackPress) {
            onBackPress();
          }
          if (exitApp) {
            BackHandler.exitApp();
          }
          return true;
        }

        doubleBackPressRef.current = true;

        // 👇 Trigger first back press callback
        if (onFirstBackPress) {
          onFirstBackPress();
        } else {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        }

        timeoutRef.current = setTimeout(() => {
          doubleBackPressRef.current = false;
        }, delay);

        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => {
        backHandler.remove();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [exitApp, onBackPress, onFirstBackPress, message, delay])
  );
};

export default useBackHandler;
