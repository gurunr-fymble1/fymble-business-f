import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const NewOwnerHeader = ({ onBackButtonPress, text, rightElement }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safeArea, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackButtonPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{text}</Text>
        </View>

        {rightElement || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

export default NewOwnerHeader;
