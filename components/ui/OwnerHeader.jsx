import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getToken, logout, saveToken, deleteToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const OwnerHeader = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [gymName, setGymName] = useState("");
  const [name, Setname] = useState("");
  const router = useRouter();

  const getgymName = async () => {
    const current_name = await getToken("gym_name");
    const name = await getToken("name");
    setGymName(current_name || "");
    Setname(name || "");
  };
  useEffect(() => {
    getgymName();
  }, []);
  const menuItems = [
    {
      icon: "person-outline",
      text: "Your Profile",
      onPress: () => {
        router.push("/owner/ownerprofile");
        setIsMenuVisible(false);
      },
    },
    {
      icon: "nutrition-outline",
      text: "View All Foods",
      onPress: () => {
        router.push("/owner/viewallfoods");
        setIsMenuVisible(false);
      },
    },
    {
      icon: "chatbubble-outline",
      text: "Feedbacks",
      onPress: () => {
        router.push("/owner/feedback");
        setIsMenuVisible(false);
      },
    },
    {
      icon: "log-out-outline",
      text: "Logout",
      onPress: async () => {
        try {
          // Use the proper logout function from auth utils
          await logout();
          // Clear additional secure storage items
          await deleteToken("gym_name");
          await deleteToken("name");
          
          setIsMenuVisible(false);
          
          // Force complete navigation reset - avoid dismissAll() to prevent POP_TO_TOP error
          router.replace("/");
          
          showToast({
            type: "success",
            title: "Logged out successfully",
          });
        } catch (error) {
          showToast({
            type: "error",
            title: "Error logging out",
          });
        }
      },
    },
  ];

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{gymName}</Text>

        <View style={styles.userContainer}>
          <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
            <View style={styles.userProfileContainer}>
              <Text style={styles.username}>{name}</Text>
              <View style={styles.userIconContainer}>
                <Ionicons
                  name="person-circle"
                  size={30}
                  color="#FF5757"
                  style={styles.userIcon}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          visible={isMenuVisible}
          animationType="slide"
          onRequestClose={() => setIsMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setIsMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon} size={24} color="#FF5757" />
                  <Text style={styles.menuItemText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF5757",
  },
  headerTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  userIcon: {
    borderRadius: 50,
    backgroundColor: "#FFDDDD",
    padding: 10,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    color: "white",
    marginRight: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  userIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  userIcon: {
    userIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 70 : 70,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: 250,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
});

export default OwnerHeader;
