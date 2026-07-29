import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform } from "react-native";
import TabNavigator from "../../../components/layout/TabNavigator";
import BottomSheetMenu from "../../../components/layout/MenuSlider";
import { getToken } from "../../../utils/auth";
import { useRouter } from "expo-router";

export default function TabLayout() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.spring(buttonAnimation, {
      toValue: isMenuVisible ? 1 : 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isMenuVisible]);

  // Check authentication when this layout mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken("access_token");
        if (!token) {
          setTimeout(() => {
            router.replace("/");
          }, 100);
        }
      } catch (error) {
        console.error("Tab auth check error:", error);
      }
    };
    checkAuth();
  }, []);

  const rotateButton = buttonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const scaleButton = buttonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const toggleMenu = () => {
    setIsMenuVisible((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  return (
    <>
      <TabNavigator
        isSliderVisible={isMenuVisible}
        toggleSlider={toggleMenu}
        rotateButton={rotateButton}
        scaleButton={scaleButton}
      />

      <BottomSheetMenu
        isVisible={isMenuVisible}
        onClose={closeMenu}
        role="owner"
      />
    </>
  );
}
