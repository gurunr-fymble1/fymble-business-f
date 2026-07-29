import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  TouchableOpacity,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import AnnouncementsSkeleton from "../loaders/announcementsSkeleton";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  deleteGymAnnouncementsAPI,
  getGymAnnouncementsAPI2,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * ANNOUNCEMENT_ICONS.length);
  return ANNOUNCEMENT_ICONS[randomIndex];
};

const GymAnnouncements = ({
  onScroll,
  scrollEventThrottle,
  headerHeight,
  currentTime,
}) => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [optionsPosition, setOptionsPosition] = useState({ top: 0, right: 0 });
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const { refresh } = useLocalSearchParams();

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const response = await getGymAnnouncementsAPI2(gymId);

      if (response.status === 200) {
        // Transform the API response to match our component's expected format
        const formattedAnnouncements = response.data.map((announcement) => ({
          id: announcement.id.toString(),
          title: announcement.title,
          content: announcement.description,
          date: announcement.datetime.split("T")[0],
          time: new Date(announcement.datetime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          priority: announcement.priority || "medium",
          icon:
            announcement.priority === "high"
              ? "alert-circle"
              : announcement.priority === "medium"
                ? "notifications"
                : "notifications-circle",
        }));

        setAnnouncements(formattedAnnouncements);
      } else {
        showToast({
          type: "error",
          title: "Failed to fetch announcements",
          desc: response?.message,
        });
        setAnnouncements(dummyAnnouncements);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching announcements",
        desc: error.message,
      });
      setAnnouncements(dummyAnnouncements);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentTime, refresh]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const refreshAnnouncements = () => {
    fetchAnnouncements();
  };

  const handleAnnouncementDelete = async (announcement_id) => {
    try {
      const gymId = await getToken("gym_id");

      let payload = {
        gym_id: gymId,
        announcement_id: announcement_id,
      };

      const response = await deleteGymAnnouncementsAPI(payload);

      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Announcement deleted successfully",
        });
        refreshAnnouncements();
        setDeleteModalVisible(false);
      }
    } catch {}
  };

  // Pass refresh function to parent if needed
  useEffect(() => {
    if (router.params) {
      router.params.refreshAnnouncements = refreshAnnouncements;
    }
  }, [router.params]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#FF5757";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const handleAnnouncementPress = (item) => {
    setSelectedAnnouncement(item);
    setModalVisible(true);
  };

  const handleOptionsPress = (item, event) => {
    setSelectedItemForOptions(item);
    setOptionsVisible(true);
  };

  const handleEditPress = (item) => {
    setOptionsVisible(false);

    // Create a payload that matches what the backend expects
    const announcementPayload = {
      id: item.id,
      title: item.title,
      content: item.description || item.content,
      datetime: item.datetime || new Date().toISOString(),
      priority: item.priority,
    };

    router.push({
      pathname: "/owner/(feed)/addNewAnnouncementFormPage",
      params: {
        announcement: JSON.stringify(announcementPayload),
        refreshAnnouncements: refreshAnnouncements,
      },
    });
  };

  const handleDeletePress = (item) => {
    setOptionsVisible(false);
    setAnnouncementToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (announcementToDelete) {
      try {
        setIsLoading(true);
        // Call the delete API here if available
        // await deleteAnnouncementAPI(announcementToDelete.id);

        // Update the UI optimistically
        const updatedAnnouncements = announcements.filter(
          (a) => a.id !== announcementToDelete.id,
        );
        setAnnouncements(updatedAnnouncements);
        setDeleteModalVisible(false);
        setAnnouncementToDelete(null);
      } catch (error) {
        showToast({
          type: "error",
          title: "Failed to delete announcement. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setAnnouncementToDelete(null);
  };

  const renderAnnouncement = ({ item }) => (
    <TouchableOpacity
      style={styles.announcementContainer}
      onPress={() => handleAnnouncementPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.announcementHeader}>
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.icon}
            size={responsiveFontSize(24)}
            color="#FF5757"
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <View style={styles.dateTimeContainer}>
            <FontAwesome
              name="calendar"
              size={responsiveFontSize(12)}
              color="#666"
            />
            <Text style={styles.dateTimeText}>{formatDate(item.date)}</Text>
            <FontAwesome
              name="clock-o"
              size={responsiveFontSize(12)}
              color="#666"
              style={styles.timeIcon}
            />
            <Text style={styles.dateTimeText}>{item.time}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "rgba(255, 255, 255, 0)",
            padding: 10,
            paddingRight: 4,
          }}
          onPress={(event) => handleOptionsPress(item, event)}
        >
          <Ionicons size={16} name="ellipsis-vertical" />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 14 }}>
        <View>
          <Text style={{ color: "#666", lineHeight: 20 }}>
            {item.content.length > 99
              ? item.content.slice(0, 100) + "..."
              : item.content}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOptionsModal = () => {
    return (
      <Modal
        visible={optionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
          <View style={styles.optionsModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsModalContainer}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleEditPress(selectedItemForOptions)}
                >
                  <MaterialIcons name="edit" size={20} color="#333" />
                  <Text style={styles.optionText}>Edit Announcement</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleDeletePress(selectedItemForOptions)}
                >
                  <MaterialIcons name="delete" size={20} color="#FF5757" />
                  <Text style={[styles.optionText, { color: "#FF5757" }]}>
                    Delete Announcement
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
      style={{ flex: 1, width: "100%", backgroundColor: "pink" }}
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  {selectedAnnouncement && (
                    <MaterialIcons
                      name={selectedAnnouncement.icon}
                      size={responsiveFontSize(30)}
                      color="#FF5757"
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={responsiveFontSize(24)}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {selectedAnnouncement && (
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {selectedAnnouncement.title}
                  </Text>

                  <View style={styles.modalDateContainer}>
                    <View style={styles.dateTimeBox}>
                      <FontAwesome
                        name="calendar"
                        size={responsiveFontSize(14)}
                        color="#666"
                      />
                      <Text style={styles.modalDateText}>
                        {formatDate(selectedAnnouncement.date)}
                      </Text>
                      <FontAwesome
                        name="clock-o"
                        size={responsiveFontSize(14)}
                        color="#666"
                        style={styles.timeIcon}
                      />
                      <Text style={styles.modalDateText}>
                        {selectedAnnouncement.time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.modalContentText}>
                    {selectedAnnouncement.content}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteModalContainer}>
                <View style={styles.deleteModalHeader}>
                  <Ionicons name="warning-outline" size={40} color="#FF5757" />
                  <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
                </View>
                <Text style={styles.deleteModalText}>
                  Are you sure you want to delete this announcement?
                  {announcementToDelete && (
                    <Text style={styles.deleteModalHighlight}>
                      {' "'}
                      {announcementToDelete.title}
                      {'"'}
                    </Text>
                  )}
                </Text>
                <Text style={styles.deleteModalSubtext}>
                  This action cannot be undone.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.cancelButton]}
                    onPress={cancelDelete}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteButton]}
                    onPress={() =>
                      handleAnnouncementDelete(announcementToDelete.id)
                    }
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  if (isLoading && announcements.length === 0) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.announcementsContainer]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View style={styles.headerInfoContainer}>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push("/owner/(feed)/addNewAnnouncementFormPage")
                }
              >
                <LinearGradient
                  colors={["#FF5757", "#FF5757"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                >
                  <MaterialIcons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Post Announcement</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={responsiveFontSize(24)}
                color="#FF5757"
              />
              <Text style={styles.infoText}>
                Latest announcements from your gym
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={responsiveFontSize(50)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>No Announcements</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for gym updates
            </Text>
          </View>
        )}
      />
      {renderDetailModal()}
      {renderOptionsModal()}
      {renderDeleteConfirmationModal()}
    </View>
  );
};

const ANNOUNCEMENT_ICONS = [
  "announcement",
  "campaign",
  "notifications",
  "info",
  "warning",
];

const dummyAnnouncements = [
  {
    id: "1",
    title: "Gym Maintenance",
    content:
      "The gym will be closed for maintenance on Saturday from 2 PM to 6 PM.",
    date: "2023-06-15",
    time: "10:30 AM",
    priority: "high",
    icon: "warning",
  },
  {
    id: "2",
    title: "New Equipment Arrival",
    content:
      "We have added new cardio machines in the gym. Come check them out!",
    date: "2023-06-14",
    time: "3:45 PM",
    priority: "medium",
    icon: "fitness-center",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  headerInfoContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  addButtonContainer: {
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  infoText: {
    marginLeft: 8,
    color: "#666666",
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  announcementsContainer: {
    paddingBottom: 20,
  },
  announcementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  announcementDate: {
    fontSize: 12,
    color: "#999999",
    marginTop: 4,
  },
  announcementContent: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    lineHeight: 20,
  },
  optionsButton: {
    padding: 8,
    margin: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    margin: -8,
  },
  modalContent: {
    flex: 1,
  },
  modalDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  dateTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  modalDateText: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 6,
    marginRight: 12,
  },
  timeIcon: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },
  modalContentText: {
    fontSize: 15,
    color: "#444444",
    lineHeight: 22,
  },
  deleteModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    alignItems: "center",
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 8,
  },
  deleteModalHighlight: {
    fontWeight: "bold",
    color: "#333333",
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: "#FF5757",
    marginBottom: 20,
    textAlign: "center",
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#FF5757",
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelText: {
    color: "#666666",
  },
  confirmText: {
    color: "#FFFFFF",
  },
  menuContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    marginLeft: 12,
    color: "#333333",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 4,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  highPriority: {
    backgroundColor: "#FF5757",
  },
  mediumPriority: {
    backgroundColor: "#FFB74D",
  },
  lowPriority: {
    backgroundColor: "#4CAF50",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
    marginLeft: 4,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  shadowProp: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Delete modal styles
  deleteModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: responsiveWidth(5),
    width: "85%",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  deleteModalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(1),
  },
  deleteModalText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    textAlign: "center",
    marginBottom: responsiveHeight(1),
  },
  deleteModalHighlight: {
    fontWeight: "bold",
  },
  deleteModalSubtext: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    textAlign: "center",
    marginBottom: responsiveHeight(3),
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalButton: {
    borderRadius: 8,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
  },
  deleteButton: {
    backgroundColor: "#FF5757",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
  },
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  announcementsContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerInfoContainer: {
    marginVertical: responsiveHeight(2),
  },
  infoBox: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    marginLeft: responsiveWidth(3),
    fontSize: responsiveFontSize(14),
    color: "#333",
    flex: 1,
  },
  announcementContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: responsiveWidth(3),
    marginBottom: responsiveHeight(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  priorityIndicator: {
    width: responsiveWidth(1),
    height: responsiveHeight(6),
    borderRadius: responsiveWidth(0.5),
    marginRight: responsiveWidth(3),
  },
  iconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(3),
  },
  headerTextContainer: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveHeight(0.5),
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginLeft: responsiveWidth(1),
  },
  timeIcon: {
    marginLeft: responsiveWidth(3),
  },
  announcementContent: {
    padding: responsiveWidth(4),
    fontSize: responsiveFontSize(14),
    color: "#555",
    lineHeight: responsiveFontSize(20),
  },
  readMoreText: {
    fontSize: responsiveFontSize(12),
    color: "#6f6f6f",
    fontWeight: "500",
    textAlign: "right",
    paddingRight: responsiveWidth(4),
    paddingBottom: responsiveWidth(2),
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(10),
  },
  emptyTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
    marginTop: responsiveHeight(2),
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#999",
    marginTop: responsiveHeight(1),
  },
  // Menu styles
  menuButton: {
    padding: responsiveWidth(2),
  },
  menuContainer: {
    position: "absolute",
    right: responsiveWidth(3),
    top: responsiveHeight(8),
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveWidth(3),
  },
  menuText: {
    fontSize: responsiveFontSize(14),
    color: "#333",
    marginLeft: responsiveWidth(2),
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  deleteText: {
    color: "#FF3B30",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(4),
    width: "100%",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(4),
    width: responsiveWidth(80),
    maxHeight: responsiveHeight(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: responsiveWidth(2),
  },
  modalContent: {
    padding: responsiveWidth(4),
  },
  modalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveHeight(1.5),
  },
  modalDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(1.5),
  },
  priorityTag: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(4),
  },
  priorityText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "500",
  },
  dateTimeBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalDateText: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginLeft: responsiveWidth(1),
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: responsiveHeight(1.5),
  },
  modalContentText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    lineHeight: responsiveFontSize(24),
  },
  addButtonContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  // Options modal styles
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: responsiveHeight(1),
    width: responsiveWidth(70),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
  },
  optionText: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    marginLeft: responsiveWidth(3),
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginHorizontal: responsiveWidth(5),
  },
});

export default GymAnnouncements;
