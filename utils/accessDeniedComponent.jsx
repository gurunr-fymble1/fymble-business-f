import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const AccessDeniedComponent = ({
  icon = "lock-closed",
  iconSize = 60,
  iconColor = "#FF6B6B",
  title = "Access Denied",
  message = "This client hasn’t granted you permission to view their workout and diet reports. Ask them to open the Fymble app and switch on 'Data Sharing' in My Gym page.Once they enable it, their daily stats will appear here automatically",
  buttonText = "Go Back",
  onButtonPress,
  navigateTo,
  showButton = true,
  customIcon = null,
}) => {
  const router = useRouter();

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else if (navigateTo) {
      router.push(navigateTo);
    } else {
      router.back();
    }
  };

  const renderIcon = () => {
    if (customIcon) {
      return customIcon;
    }

    if (icon === "shield-lock" || icon === "no-accounts" || icon === "block") {
      return <MaterialIcons name={icon} size={iconSize} color={iconColor} />;
    }

    return <Ionicons name={icon} size={iconSize} color={iconColor} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {showButton && buttonText && (onButtonPress || navigateTo || true) && (
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Ionicons
            name="arrow-back"
            size={16}
            color="#FFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 25,
  },
  button: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AccessDeniedComponent;
