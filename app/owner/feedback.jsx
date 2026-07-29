import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFeedbacksAPI } from "../../services/Api";

import { getToken } from "../../utils/auth";
import ReviewCard from "../../components/feedback/ReviewCard";
import { useRouter } from "expo-router";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import GymOffersSkeleton from "../../components/ui/loaders/gymOffersSkeleton";

const { width, height } = Dimensions.get("window");

const Feedback = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [allFeedbacks, setAllFeedbacks] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={index}
        name={index < rating ? "star" : "star-o"}
        size={16}
        color={index < rating ? "#FFD700" : "#BDC3C7"}
        style={{ marginRight: 2 }}
      />
    ));
  };

  const getFeedbacks = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Something went wrong, please try again.",
        });
        return;
      }
      const response = await getFeedbacksAPI(gymId);

      if (response?.status === 200) {
        setAllFeedbacks(response?.data);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch feedbacks",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFeedbacks();
  }, []);

  const renderFeedbackItem = ({ item }) => (
    <ReviewCard
      quote={item.tag || ""}
      description={item.feedback || ""}
      userName={item.client_name}
      userLocation={item.timing.split("T")[0]}
      rating={item.ratings}
      userImage={item.client_image}
      id={item.feedback_id}
    />
  );

  const FeedbackDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Feedback Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="close" size={24} color="#FF5757" />
            </TouchableOpacity>
          </View>

          {selectedFeedback && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.detailRow}>
                  <FontAwesome name="user" size={16} color="#FF5757" />
                  <Text style={styles.detailText}>
                    {selectedFeedback.client_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome name="calendar" size={16} color="#FF5757" />
                  <Text style={styles.detailText}>
                    {selectedFeedback.timing.split("T")[0]} at{" "}
                    {selectedFeedback.timing.split("T")[1]}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome name="tag" size={16} color="#FF5757" />
                  <Text style={styles.detailText}>{selectedFeedback.tag}</Text>
                </View>
                <View style={[styles.stars, { marginVertical: 10 }]}>
                  {renderStars(selectedFeedback.ratings)}
                </View>
              </View>
              <ScrollView
                style={styles.contentScrollView}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.contentText}>
                  {selectedFeedback.feedback}
                </Text>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return <GymOffersSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        text={"Users Feedback"}
        onBackButtonPress={() => router.push("/owner/home")}
      />

      <FlatList
        data={allFeedbacks}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item.feedback_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.noFeedContainer}>
            <MaterialCommunityIcons
              name="message-text-outline"
              size={80}
              color="#CBD5E0"
            />
            <Text style={styles.noFeedTitle}>No Feedbacks to Show</Text>
          </View>
        }
      />

      <FeedbackDetailModal />
    </View>
  );
};

export default Feedback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  listContainer: {
    padding: width * 0.05,
  },
  name: {
    fontSize: width * 0.035,
    color: "#636E72",
  },
  date: {
    fontSize: width * 0.032,
    color: "#B2BEC3",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 87, 87, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#FF5757",
    fontSize: width * 0.032,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: width * 0.05,
    maxHeight: height * 0.8,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: width * 0.035,
    color: "#636E72",
    marginLeft: 10,
  },
  contentScrollView: {
    maxHeight: height * 0.4,
    marginTop: 15,
  },
  contentText: {
    fontSize: width * 0.038,
    color: "#2D3436",
    lineHeight: 24,
  },
  feedbackTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: width * 0.04,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  modalTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#2D3436",
  },
  closeButton: {
    padding: 5,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F7F7F7",
  },
  noFeedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 250,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4299E1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
});
