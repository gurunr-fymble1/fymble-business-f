import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showToast } from "../../utils/Toaster";

const { width } = Dimensions.get("window");

const RadialMenu = ({ isVisible, onClose, role }) => {
  const router = useRouter();

  const containerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnimations = useRef([]);
  const closeButtonAnim = useRef(new Animated.Value(0)).current;

  const menuItems =
    role === "owner"
      ? [
          {
            title: "Client Management",
            iconName: "people",
            route: "/owner/clientform",
            labelPosition: { left: -30, bottom: -5 },
          },
          {
            title: "Trainer Setup",
            iconName: "person",
            route: "/owner/trainerform",
            labelPosition: { left: -30, bottom: -0 },
          },
          {
            title: "Manage Template",
            iconName: "list-circle-outline",
            route: "/owner/manageNutritionAndWorkoutTemplate",
            labelPosition: { left: -20, bottom: -0 },
          },
          {
            title: "Gym Plans",
            iconName: "restaurant-outline",
            route: "/owner/gymPlans",
            labelPosition: { left: 5, bottom: -0 },
          },
          {
            title: "Assignments",
            iconName: "swap-horizontal-outline",
            route: "/owner/assigntrainer",
            labelPosition: { left: 0, bottom: -2 },
          },
          {
            title: "Membership",
            iconName: "pricetag-outline",
            route: "/owner/manageplans",
            labelPosition: { right: -20, bottom: -4 },
          },
          {
            title: "Rewards",
            iconName: "star-outline",
            route: "/owner/rewards",
            labelPosition: { right: -30, bottom: 2 },
          },
          {
            title: "Prizes",
            iconName: "medal-outline",
            route: "/owner/gymdata",
            labelPosition: { right: -35, bottom: 6 },
          },
          {
            title: "Add Enquires",
            iconName: "person-add-outline",
            route: "/owner/addEnquiry",
            labelPosition: { right: -20, bottom: -2 },
          },
        ]
      : [];

  useEffect(() => {
    if (buttonAnimations.current.length !== menuItems.length) {
      buttonAnimations.current = menuItems.map(() => new Animated.Value(0));
    }
  }, [menuItems.length]);

  useEffect(() => {
    if (isVisible) {
      containerAnim.setValue(0);
      closeButtonAnim.setValue(0);
      buttonAnimations.current.forEach((anim) => anim.setValue(0));

      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(closeButtonAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      Animated.stagger(
        30,
        buttonAnimations.current.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 80,
            friction: 7,
            useNativeDriver: true,
          }),
        ),
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(containerAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(closeButtonAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        ...buttonAnimations.current.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible && containerAnim._value === 0) {
    return null;
  }

  const navigateToRoute = (route) => {
    onClose();
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

  const radius = width * 0.4;
  const startAngle = 50;
  const endAngle = -650;

  return (
    <View
      style={{ position: "absolute", bottom: 0, right: 0, left: 0, top: 0 }}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {isVisible && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[styles.overlay, { flex: 1, opacity: containerAnim }]}
          />
        </Pressable>
      )}

      <View style={styles.menuContainer}>
        <Animated.View
          style={[
            styles.closeButtonWrapper,
            {
              opacity: closeButtonAnim,
              transform: [{ scale: closeButtonAnim }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
        </Animated.View>

        {menuItems.map((item, index) => {
          const angle =
            startAngle +
            (index / (menuItems.length - 1)) * (endAngle - startAngle);

          const x = radius * Math.cos(angle);
          const y = -radius * Math.sin(angle) + 270;

          const animation = buttonAnimations.current[index] || containerAnim;
          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          });

          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, x],
          });

          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, y],
          });

          const opacity = animation;

          return (
            <Animated.View
              key={`radial-item-${index}`}
              style={[
                styles.buttonWrapper,
                {
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  { backgroundColor: getColorForIndex(index) },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => navigateToRoute(item.route)}
              >
                <Ionicons name={item.iconName} size={24} color="#FFF" />
              </Pressable>
              <Animated.View
                style={[
                  styles.labelContainer,
                  {
                    position: "absolute",
                    minWidth: 60,
                    maxWidth: 150,
                    ...item.labelPosition,
                  },
                ]}
              >
                <Text style={styles.labelText} numberOfLines={1}>
                  {item.title}
                </Text>
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const getColorForIndex = (index) => {
  const colors = [
    "#FF5757",
    "#FF7A57",
    "#FF9E57",
    "#FFB657",
    "#F28B82",
    "#EA80FC",
    "#7C4DFF",
    "#3F51B5",
    "#4DB6AC",
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 99,
  },
  menuContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    paddingBottom: 30,
  },
  buttonWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 100,
    marginBottom: 150,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    bottom: -5,
  },
  closeButton: {
    width: 65,
    height: 65,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    color: "white",
    backgroundColor: "#FF5757",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  labelContainer: {
    marginTop: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
});

export default RadialMenu;
