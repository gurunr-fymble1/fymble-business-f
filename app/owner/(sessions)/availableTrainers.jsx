import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  BackHandler,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import * as ImagePicker from "expo-image-picker";
import { getToken } from "../../../utils/auth";
import { getTrainersAPI } from "../../../services/Api";
import { showToast } from "../../../utils/Toaster";
import SessionCardsSkeleton from "../../../components/ui/loaders/sessionCardsSkeleton";

const AvailableTrainers = () => {
  const insets = useSafeAreaInsets();
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useLocalSearchParams();
  const fetchTrainers = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getTrainersAPI(gymId);
      if (response?.status === 200) {
        const personalTrainers = response?.data?.trainers?.filter(
          (trainer) => trainer.personal_trainer === true
        );
        setTrainers(personalTrainers);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching trainers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push("/owner/(sessions)/availableSessions");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const renderTrainerCard = ({ item }) => {
    const defaultImage = require("../../../assets/images/sessions/trainer.png");

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: "/owner/(sessions)/sessionDetails",
            params: {
              trainerId: item.trainer_id,
              sessionId: params.sessionId,
              sessionName: `${item.full_name?.split(" ")[0]}'s Sessions`,
            },
          });
        }}
      >
        <Image
          source={
            item?.profile_image ? { uri: item.profile_image } : defaultImage
          }
          style={styles.trainerImage}
        />
        {item?.experience && (
          <View style={styles.experienceBadge}>
            <Text style={styles.experienceText}>
              {item?.experience ? `${item.experience} Yrs Experience` : "N/A"}
            </Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.trainerName} numberOfLines={1}>
            {item?.full_name || "Unknown"}
          </Text>
          <Text
            style={styles.specialization}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item?.specializations && item.specializations.length > 0
              ? item.specializations.join(", ")
              : "Specialization Not Mentioned"}
          </Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.sessionButton}>
              <Text style={styles.sessionButtonText}>60 Mins</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                router.push({
                  pathname: "/owner/(sessions)/sessionDetails",
                  params: {
                    trainerId: item.trainer_id,
                    sessionId: params.sessionId,
                    sessionName: `${item.full_name?.split(" ")[0]}'s Sessions`,
                  },
                });
              }}
            >
              <Text style={styles.profileButtonText}>View Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 5 }]}>
      <NewOwnerHeader
        onBackButtonPress={() =>
          router.push("/owner/(sessions)/availableSessions")
        }
        text={"Personal Trainers"}
      />
      {isLoading ? (
        <SessionCardsSkeleton />
      ) : trainers.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="person-add-outline" size={80} color="#CCC" />
          <Text style={styles.emptyStateTitle}>No Trainers Found</Text>
          <Text style={styles.emptyStateMessage}>
            Create your first trainer to start offering personal training sessions.
          </Text>
          <TouchableOpacity
            style={styles.createTrainerButton}
            onPress={() => router.push("/owner/trainerform")}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.createTrainerButtonText}>Create Trainer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trainers}
          renderItem={renderTrainerCard}
          keyExtractor={(item) => item.trainer_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default AvailableTrainers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    padding: 10,
    paddingBottom: 100,
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
    overflow: "visible",
    position: "relative",
  },
  trainerImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    resizeMode: "cover",
  },
  experienceBadge: {
    position: "absolute",
    top: 110,
    right: 10,
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  experienceText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#007AFF",
  },
  menuButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dropdownOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 999,
    minWidth: 120,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  cardContent: {
    padding: 12,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  specialization: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sessionButton: {
    backgroundColor: "#FFF",
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  sessionButtonText: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "600",
  },
  profileButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  profileButtonText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
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
    maxHeight: "85%",
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
  imageUploadContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFF",
    color: "#333",
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  createTrainerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  createTrainerButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
});
