import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  BackHandler,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getAvailableSessionsAPI, addSessionsAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import SessionCardsSkeleton from "../../../components/ui/loaders/sessionCardsSkeleton";
import { showToast } from "../../../utils/Toaster";
import { Image } from "expo-image";

const AvailableSessions = () => {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [tempSessions, setTempSessions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSessionSelection = (sessionId) => {
    setTempSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId
          ? { ...session, isActive: !session.isActive }
          : session,
      ),
    );
  };

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        setLoading(false);
        return;
      }
      const response = await getAvailableSessionsAPI(gymId);
      if (response?.status === 200) {
        setSessions(response.data || []);
        setTempSessions(response.data || []);
      } else {
        showToast({
          type: "error",
          title: "Error fetching Sessions",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching Sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push("/owner/home");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const handleOpenModal = () => {
    setTempSessions([...sessions]);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setTempSessions([...sessions]);
    setIsModalVisible(false);
  };

  const handleSaveSelections = async () => {
    try {
      const gymId = await getToken("gym_id");
      const activeSessionIds = tempSessions
        .filter((session) => session.isActive)
        .map((session) => session.id);

      const payload = {
        gym_id: gymId,
        sessions: activeSessionIds,
      };

      const response = await addSessionsAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Sessions updated successfully",
        });
        setIsModalVisible(false);
        fetchAllSessions(); // Refresh the sessions list
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update sessions",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong",
      });
    }
  };

  const handleCardPress = (item) => {
    if (item.name === "Daily Pass") {
      router.push("/owner/dailyPassUsers");
    } else if (item.name === "Personal Trainer") {
      router.push({
        pathname: "/owner/(sessions)/availableTrainers",
        params: { sessionId: item.id },
      });
    } else {
      // Redirect all other sessions to sessionDetails with session name
      router.push({
        pathname: "/owner/(sessions)/sessionDetails",
        params: { sessionName: item.name, sessionId: item.id },
      });
    }
  };

  const renderSessionCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handleCardPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSessionOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sessionOption,
        item.isActive && styles.sessionOptionActive,
      ]}
      onPress={() => toggleSessionSelection(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.sessionOptionImage} />
      <View style={styles.sessionOptionContent}>
        <Text
          style={[
            styles.sessionOptionText,
            item.isActive && styles.sessionOptionTextActive,
          ]}
        >
          {item.name}
        </Text>
      </View>
      <View style={styles.checkboxContainer}>
        {item.isActive ? (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color="#CCC" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 5 }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Daily Pass & Fitness Classes"}
      />

      {loading ? (
        <SessionCardsSkeleton />
      ) : (
        <FlatList
          data={sessions.filter((session) => session.isActive)}
          renderItem={renderSessionCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Fixed Bottom Bar with Two Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.addSessionsButton}
          activeOpacity={0.8}
          onPress={handleOpenModal}
        >
          <View style={styles.addSessionsIcon}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.addSessionsButtonText}>Fitness Class</Text>
        </TouchableOpacity>
      </View>

      {/* Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <View
            style={[styles.modalContainer, { paddingBottom: insets.bottom }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Available Classes</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 35 }}
            >
              <FlatList
                data={tempSessions}
                renderItem={renderSessionOption}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSelections}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    padding: 10,
    paddingBottom: 120,
    marginTop: 10,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 115,
    resizeMode: "contain",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  introOffersButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  addSessionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 8,
  },
  addSessionsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  introOffersIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  addSessionsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    padding: 16,
  },
  sessionOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  sessionOptionActive: {
    backgroundColor: "#E8F4FF",
    borderColor: "#007AFF",
  },
  sessionOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  sessionOptionContent: {
    flex: 1,
  },
  sessionOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  sessionOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default AvailableSessions;
