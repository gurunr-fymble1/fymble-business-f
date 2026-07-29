import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
  NativeModules,
  Platform,
} from "react-native";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const { NavigationMode } = NativeModules;
const isTablet = width >= 786;

const BottomSheetMenu = ({ isVisible, onClose, role }) => {
  const router = useRouter();
  const bottomSheetHeight = height * 0.7;
  const insets = useSafeAreaInsets();
  // Animation values - disabled for testing
  // const slideAnim = useRef(new Animated.Value(bottomSheetHeight)).current;
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  // const contentOpacity = useRef(new Animated.Value(0)).current;

  const menuItems =
    role === "owner"
      ? [
          {
            title: "Add Client & Update Fees",
            icon: require("../../assets/images/header/icon_1.png"),
            route: "/owner/clientform",
          },
          {
            title: "Manage\nPlans",
            icon: require("../../assets/images/header/icon_3.png"),
            route: "/owner/createPlans",
          },
          {
            title: "Manage Trainers",
            icon: require("../../assets/images/header/icon_2.png"),
            route: "/owner/trainerform",
          },
        ]
      : [];

  // Close menu - no animation for testing
  const closeMenu = () => {
    onClose();
  };

  // Don't render when not visible
  if (!isVisible) {
    return null;
  }

  const navigateToRoute = (route) => {
    closeMenu();
    try {
      router.push(route);
    } catch (error) {
      showToast({
        type: "error",
        title: "Navigation error",
        desc: error.message,
      });
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, {}]} pointerEvents="box-none">
      {/* Backdrop overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
        <View style={styles.overlay} />
      </Pressable>

      {/* Bottom sheet */}
      <View
        style={[styles.bottomSheet, { bottom: insets.bottom }]}
        pointerEvents="box-none"
      >
        {/* Handle for dragging down */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <View pointerEvents="box-none">
          <Text style={styles.title}>Quick Links</Text>

          {/* Menu items grid */}
          <View style={styles.menuGrid} pointerEvents="box-none">
            {menuItems.map((item, index) =>
              item.fullWidth ? (
                <View
                  key={`menu-item-${index}`}
                  style={styles.menuItemFullWidth}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuButtonFullWidth,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => navigateToRoute(item.route)}
                  >
                    <Image
                      source={item.icon}
                      style={styles.iconImageFullWidth}
                    />
                    <Text style={styles.menuTextFullWidth}>{item.title}</Text>
                  </Pressable>
                </View>
              ) : (
                <View key={`menu-item-${index}`} style={styles.menuItem}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => navigateToRoute(item.route)}
                  >
                    <Image source={item.icon} style={styles.iconImage} />
                    <Text style={styles.menuText}>{item.title}</Text>
                  </Pressable>
                </View>
              ),
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: isTablet ? 30 : 25,
    borderTopRightRadius: isTablet ? 30 : 25,
    paddingBottom: isTablet ? 50 : 40,
    height: Platform.OS === "ios" ? "33%" : "33%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 20,
  },
  dragHandleContainer: {
    width: "100%",
    height: isTablet ? 40 : 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 6 : 5,
    borderRadius: isTablet ? 4 : 3,
    backgroundColor: "#ccc",
    marginTop: isTablet ? 12 : 10,
  },
  title: {
    fontSize: isTablet ? 20 : 14,
    fontWeight: "500",
    textAlign: "center",
    margin: isTablet ? 20 : 16,
    marginTop: isTablet ? 12 : 10,
    marginBottom: isTablet ? 24 : 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: isTablet ? 24 : 16,
    justifyContent: "space-between",
  },
  menuItem: {
    width: "30%",
    marginBottom: isTablet ? 32 : 24,
    alignItems: "center",
  },
  menuItemFullWidth: {
    width: "100%",
    marginBottom: isTablet ? 32 : 24,
  },
  menuButton: {
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    padding: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  menuButtonFullWidth: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    padding: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 16 : 12,
    borderRadius: isTablet ? 12 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  iconImageFullWidth: {
    width: isTablet ? 50 : 50,
    height: isTablet ? 50 : 50,
    resizeMode: "cover",
    marginLeft: isTablet ? 10 : 6,
    marginRight: isTablet ? 16 : 12,
  },
  menuTextFullWidth: {
    fontSize: isTablet ? 16 : 13,
    fontWeight: "500",
    color: "#333",
  },
  iconImage: {
    width: isTablet ? 70 : 50,
    height: isTablet ? 70 : 50,
    resizeMode: "contain",
    marginBottom: isTablet ? 12 : 8,
  },
  iconImageBig: {
    width: isTablet ? 80 : 80,
    height: isTablet ? 80 : 50,
    resizeMode: "contain",
    marginBottom: isTablet ? 12 : 8,
  },
  menuText: {
    fontSize: isTablet ? 16 : 12,
    fontWeight: "400",
    textAlign: "center",
    color: "#333",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default BottomSheetMenu;
