// import React from "react";
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import { Image } from "expo-image";
// import { Feather } from "@expo/vector-icons";
// import TopPageBar from "../ui/TopPageBar";

// const LiveDistribution = ({ USERS }) => {
//   const renderUserCard = (item, index) => (
//     <View key={index} style={styles.userCard}>
//       <View style={styles.userInfo}>
//         <Image
//           source={item?.profile}
//           style={styles.avatar}
//           contentFit="cover"
//           transition={200}
//         />
//         <Text style={styles.userName}>{item?.name}</Text>
//       </View>
//       <TouchableOpacity style={styles.shareButton}>
//         <Feather name="external-link" size={18} color="black" />
//       </TouchableOpacity>
//     </View>
//   );
//   const displayUsers = USERS?.slice(0, 6);

//   return (
//     <View style={styles.container}>
//       <TopPageBar
//         title={"Live Distribution"}
//         addColorLeft={"rgba(41, 126, 179, 0.158)"}
//         addColorRight={"rgba(24, 50, 67, 0.135)"}
//         rightSideComponent={<View style={styles.statusIndicator} />}
//       />

//       <View style={styles.listContainer}>
//         <View style={styles.listContent}>
//           {displayUsers?.map((user, index) => renderUserCard(user, index))}
//           {(USERS || Demo_USERS).length > 6 && (
//             <View style={styles.moreUsersIndicator}>
//               <Text style={styles.moreUsersText}>
//                 +{(USERS || Demo_USERS).length - 6} more users
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: "100%",
//     backgroundColor: "#ffffff",
//     marginVertical: 10,
//   },
//   statusIndicator: {
//     width: 11,
//     height: 11,
//     borderRadius: 8,
//     backgroundColor: "#2ECC71",
//   },
//   listContainer: {
//     width: "100%",
//     paddingHorizontal: 5,
//   },
//   listContent: {
//     padding: 10,
//     paddingBottom: 20,
//   },
//   userCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#FFF",
//     borderRadius: 12,
//     marginBottom: 10,
//     padding: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   userInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 24,
//     marginRight: 16,
//   },
//   userName: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#333",
//   },
//   shareButton: {
//     padding: 8,
//   },
//   moreUsersIndicator: {
//     backgroundColor: "#F5F5F5",
//     borderRadius: 12,
//     padding: 15,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   moreUsersText: {
//     fontSize: 14,
//     color: "#666",
//     fontWeight: "500",
//   },
// });

// export default LiveDistribution;

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import TopPageBar from "../ui/TopPageBar";
import { addPunchOutAPI } from "../../services/clientApi";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const DEFAULT_AVATAR = require("../../assets/images/user_1.png");

const LiveDistribution = ({ USERS }) => {
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [viewMoreModalVisible, setViewMoreModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePunchOut = async (user) => {
    const gymId = await getToken("gym_id");
    setLoading(true);

    try {
      const payload = {
        gym_id: parseInt(gymId),
      };

      // For manual clients, use manual_client_id (client_id will be string like "manual_10")
      // For regular clients, client_id is a number
      if (user?.manual_client_id) {
        payload.manual_client_id = parseInt(user.manual_client_id);
      } else if (user?.client_id && typeof user.client_id === "number") {
        payload.client_id = user.client_id;
      } else if (user?.import_client_id) {
        payload.import_client_id = parseInt(user.import_client_id);
      }

      const response = await addPunchOutAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "User punched out successfully",
        });
        setConfirmModalVisible(false);
        setSelectedUser(null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch out",
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

  const handleShareButtonPress = (user) => {
    setSelectedUser(user);
    setConfirmModalVisible(true);
  };

  const renderUserCard = (item, index) => (
    <View key={index} style={styles.userCard}>
      <View style={styles.userInfo}>
        <Image
          source={item?.profile || DEFAULT_AVATAR}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <Text style={styles.userName}>{item?.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => handleShareButtonPress(item)}
      >
        <Feather name="external-link" size={18} color="black" />
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={confirmModalVisible}
      onRequestClose={() => setConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmTitle}>Punch Out Confirmation</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to punch out {selectedUser?.name}?
          </Text>

          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => {
                setConfirmModalVisible(false);
                setSelectedUser(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, styles.yesButton]}
              onPress={() => handlePunchOut(selectedUser)}
              disabled={loading}
            >
              <Text style={styles.yesButtonText}>
                {loading ? "Processing..." : "Yes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderViewMoreModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={viewMoreModalVisible}
      onRequestClose={() => setViewMoreModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.viewMoreModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Active Members</Text>
            <TouchableOpacity
              onPress={() => setViewMoreModalVisible(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
            {USERS?.map((user, index) => (
              <View key={index} style={styles.modalUserCard}>
                <View style={styles.userInfo}>
                  <Image
                    source={user?.profile || DEFAULT_AVATAR}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                  />
                  <Text style={styles.userName}>{user?.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    setViewMoreModalVisible(false);
                    handleShareButtonPress(user);
                  }}
                >
                  <Feather name="external-link" size={18} color="black" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const displayUsers = USERS?.slice(0, 5); // Changed to 5 to show "View More" when > 5

  return (
    <View style={styles.container}>
      <TopPageBar
        title={"Live Distribution"}
        addColorLeft={"rgba(41, 126, 179, 0.158)"}
        addColorRight={"rgba(24, 50, 67, 0.135)"}
        rightSideComponent={<View style={styles.statusIndicator} />}
      />

      <View style={styles.listContainer}>
        <View style={styles.listContent}>
          {displayUsers?.map((user, index) => renderUserCard(user, index))}

          {USERS && USERS.length > 5 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setViewMoreModalVisible(true)}
            >
              <Text style={styles.viewMoreText}>
                View More ({USERS.length - 5} more users)
              </Text>
              <Feather name="chevron-right" size={18} color="#2ECC71" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderConfirmationModal()}
      {renderViewMoreModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#ffffff",
    marginVertical: 10,
  },
  statusIndicator: {
    width: 11,
    height: 11,
    borderRadius: 8,
    backgroundColor: "#2ECC71",
  },
  listContainer: {
    width: "100%",
    paddingHorizontal: 5,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 24,
    marginRight: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  shareButton: {
    padding: 8,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9F4",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "500",
    marginRight: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  yesButton: {
    backgroundColor: "#FF6B6B",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  yesButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  // View More Modal Styles
  viewMoreModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    maxHeight: "80%",
    position: "absolute",
    bottom: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 20,
  },
  modalUserCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
});

export default LiveDistribution;
