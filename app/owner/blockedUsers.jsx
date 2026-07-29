import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { FetchBlockedUsersAPI, UnblockUserAPI } from "../../services/Api";

import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import WorkoutScheduleSkeleton from "../../components/ui/loaders/workoutScheduleSkeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { get } from "lodash";

const { width, height } = Dimensions.get("window");

const BlockedUsersPage = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selectedBlockedUser, setSelectedBlockedUser] = useState(null);
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const getBlockedUsers = async () => {
    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }
      const role = await getToken("role");
      const response = await FetchBlockedUsersAPI(gymId, role);

      if (response?.status === 200) {
        setBlockedUsers(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to fetch blocked users",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = (user) => {
    setSelectedBlockedUser(user);
    setUnblockModalVisible(true);
  };

  const confirmUnblockUser = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const payload = {
        user_id: gymId,
        gym_id: gymId,
        blocked_user_id:
          selectedBlockedUser.role == "client"
            ? selectedBlockedUser.client_id
            : selectedBlockedUser.gym_id,
        user_role: "owner",
        blocked_user_role: selectedBlockedUser.role,
      };

      const response = await UnblockUserAPI(payload);
      if (response?.status === 200) {
        await getBlockedUsers();
        showToast({
          type: "success",
          title: "Success",
          desc: "User unblocked successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setUnblockModalVisible(false);
      setSelectedBlockedUser(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getBlockedUsers();
    }, [])
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {loading ? (
        <WorkoutScheduleSkeleton />
      ) : (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={() => router.push("/owner/feed")}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blocked Users</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.safeArea} edges={["top"]}>
              {blockedUsers.length === 0 ? (
                <View style={styles.noBlockedUsersContainer}>
                  <MaterialIcons name="block" size={50} color="#CBD5E0" />
                  <Text style={styles.noBlockedUsersText}>
                    No blocked users
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={blockedUsers}
                  keyExtractor={(item) =>
                    item.role === "client"
                      ? item.client_id.toString()
                      : item.gym_id.toString()
                  }
                  renderItem={({ item }) => (
                    <View style={styles.blockedUserItem}>
                      <View>
                        <Text style={styles.blockedUserName}>{item.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.unblockButton}
                        onPress={() => handleUnblockUser(item)}
                      >
                        <Text style={styles.unblockButtonText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  contentContainerStyle={styles.blockedUsersList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>

          {unblockModalVisible && (
            <View style={styles.overlay}>
              <View style={styles.confirmModalContainer}>
                <View style={styles.confirmHeader}>
                  <Text style={styles.confirmTitle}>Unblock User</Text>
                </View>
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmQuestion}>
                    Are you sure you want to unblock {selectedBlockedUser?.name}
                    ? Their posts will appear in your feed again.
                  </Text>

                  <View style={styles.confirmButtonRow}>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.cancelButton]}
                      onPress={() => setUnblockModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        styles.confirmUnblockButton,
                      ]}
                      onPress={confirmUnblockUser}
                    >
                      <Text style={styles.confirmUnblockButtonText}>
                        Yes, Unblock
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,

    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  noBlockedUsersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noBlockedUsersText: {
    marginTop: 12,
    fontSize: 16,
    color: "#777",
  },
  blockedUsersList: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  blockedUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  unblockButton: {
    backgroundColor: "#1DA1F2",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unblockButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  confirmContent: {
    padding: 16,
  },
  confirmQuestion: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "center",
    marginVertical: 20,
  },
  confirmButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  confirmUnblockButton: {
    backgroundColor: "#1DA1F2",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmUnblockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default BlockedUsersPage;
