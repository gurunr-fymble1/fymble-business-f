import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const NoDataComponent = ({
  icon = "file-tray-outline",
  iconSize = 50,
  iconColor = "#10A0F6",
  title = "No Data Available",
  message = "Looks like there is no data here yet.",
  buttonText = "Add Now",
  onButtonPress,
  navigateTo,
}) => {
  const router = useRouter();

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else if (navigateTo) {
      router.push(navigateTo);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {buttonText && (onButtonPress || navigateTo) && (
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "rgba(0, 123, 255, 1)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NoDataComponent;
