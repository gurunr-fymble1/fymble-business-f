import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import {
  activateNewOfferAPI,
  getIntroOffersStatusAPI,
} from "../../../services/Api";

const IntroOffers = () => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [dailypassOfferActivated, setDailypassOfferActivated] = useState(false);
  const [sessionOfferActivated, setSessionOfferActivated] = useState(false);
  const [showDailypassModal, setShowDailypassModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const loadOfferStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        setIsLoading(false);
        return;
      }

      const data = await getIntroOffersStatusAPI(gymId);

      if (data && data.status === 200) {
        setDailypassOfferActivated(data.dailypass_activated === true);
        setSessionOfferActivated(data.session_activated === true);
      }
    } catch (error) {
      console.error("Error loading offer status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferStatus();
  }, [loadOfferStatus]);

  const handleActivateOffer = async (mode) => {
    setIsActivating(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Authentication error",
        });
        return;
      }

      const data = await activateNewOfferAPI({
        gym_id: gymId,
        mode: mode,
      });

      if (data && data.status === 200) {
        showToast({
          type: "success",
          title:
            data.message ||
            `${mode === "dailypass" ? "₹49 Daily Pass" : "₹99 Session"} offer activated!`,
        });
        if (mode === "dailypass") {
          setShowDailypassModal(false);
        } else {
          setShowSessionModal(false);
        }
        loadOfferStatus();
      } else {
        throw new Error(data?.message || "Failed to activate offer");
      }
    } catch (error) {
      console.error("Error activating offer:", error);
      showToast({
        type: "error",
        title: error.message || "Error activating offer",
      });
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Limited Intro Offers"
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Loading offers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Limited Intro Offers"
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Ionicons name="gift-outline" size={28} color="#007AFF" />
          <Text style={styles.headerTitle}>Activate Special Offers</Text>
          <Text style={styles.headerSubtitle}>
            Attract new customers with ₹49 per Daily Pass & ₹99 per Class for
            the first 50 users
          </Text>
        </View>

        {/* Daily Pass Offer Card */}
        <View style={styles.offerSection}>
          <Text style={styles.sectionTitle}>Daily Pass Offer</Text>

          <Image
            source={require("../../../assets/images/limited49offer.png")}
            style={styles.offerImage}
            resizeMode="contain"
          />

          {dailypassOfferActivated ? (
            <View style={styles.offerActivatedContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.offerActivatedText}>
                You have already opted for the Daily Pass intro offer
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.activateOfferCheckbox}
              activeOpacity={0.7}
              onPress={() => setShowDailypassModal(true)}
            >
              <View style={styles.checkbox} />
              <Text style={styles.activateOfferText}>
                <Text style={styles.clickToText}>Click to</Text> activate ₹49
                Daily Pass special offer
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Session Offer Card */}
        <View style={styles.offerSection}>
          <Text style={styles.sectionTitle}>Fitness Class Offer</Text>

          <Image
            source={require("../../../assets/images/session_offer.png")}
            style={styles.offerImage}
            resizeMode="contain"
          />

          {sessionOfferActivated ? (
            <View style={styles.offerActivatedContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.offerActivatedText}>
                You have already opted for the Sessions intro offer
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.activateOfferCheckbox}
              activeOpacity={0.7}
              onPress={() => setShowSessionModal(true)}
            >
              <View style={styles.checkbox} />
              <Text style={styles.activateOfferText}>
                <Text style={styles.clickToText}>Click to</Text> activate ₹99
                for all Sessions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Daily Pass Modal */}
      <Modal
        visible={showDailypassModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDailypassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="gift-outline" size={32} color="#007AFF" />
              <Text style={styles.modalTitle}>Activate Daily Pass Offer</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                This will activate the{" "}
                <Text style={styles.modalHighlight}>₹49 Daily Pass</Text> offer
                for the{" "}
                <Text style={styles.modalHighlight}>first 50 new users</Text>{" "}
                only.
              </Text>
              <Text style={styles.modalSubText}>
                Irrespective of your current daily pass price, new users will
                see ₹49 as the daily pass price until 50 users have availed this
                offer.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDailypassModal(false)}
                disabled={isActivating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActivateButton,
                  isActivating && styles.modalButtonDisabled,
                ]}
                onPress={() => handleActivateOffer("dailypass")}
                disabled={isActivating}
              >
                {isActivating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActivateButtonText}>Activate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Session Modal */}
      <Modal
        visible={showSessionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="gift-outline" size={32} color="#007AFF" />
              <Text style={styles.modalTitle}>Activate Sessions Offer</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                This will activate the{" "}
                <Text style={styles.modalHighlight}>₹99 Session</Text> offer for
                the{" "}
                <Text style={styles.modalHighlight}>first 50 new users</Text>{" "}
                across all your sessions.
              </Text>
              <Text style={styles.modalSubText}>
                Irrespective of your session prices, new users will see ₹99 for
                all sessions until 50 users have availed this offer.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSessionModal(false)}
                disabled={isActivating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActivateButton,
                  isActivating && styles.modalButtonDisabled,
                ]}
                onPress={() => handleActivateOffer("session")}
                disabled={isActivating}
              >
                {isActivating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActivateButtonText}>Activate</Text>
                )}
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
    backgroundColor: "#F9FAFB",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerInfo: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  offerSection: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  offerImage: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95 * 0.405,
    alignSelf: "center",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },
  activateOfferCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activateOfferText: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
  },
  clickToText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  offerActivatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  offerActivatedText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
    textAlign: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalText: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  modalHighlight: {
    fontWeight: "700",
    color: "#007AFF",
  },
  modalSubText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalActivateButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
  },
  modalActivateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
});

export default IntroOffers;
