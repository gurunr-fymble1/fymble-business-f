import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

// Menu Button Component integrated to avoid dependency issues
const MenuButton = ({
  title,
  iconName,
  route,
  onClose,
  animation,
  color = "#FF5757",
}) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const navigateToRoute = () => {
    onClose();

    // Wait for the animation to start before navigating
    setTimeout(() => {
      try {
        router.push(route);
      } catch (error) {
        showToast({
          type: "error",
          title: "Navigation error",
          desc: error.message,
        });
      }
    }, 100);
  };

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          { scale: animation },
          {
            translateY: Animated.multiply(animation, 20).interpolate({
              inputRange: [0, 20],
              outputRange: [20, 0],
            }),
          },
        ],
        width: (width - 48) / 2,
        height: 120,
        marginBottom: 16,
      }}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={navigateToRoute}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.buttonContent, { backgroundColor: color }]}>
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={28} color="#FFF" />
            </View>
            <Text style={styles.buttonText} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default MenuButton;

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
  },
});
