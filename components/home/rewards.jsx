import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import EarnXP from "./EarnXp";
import { showToast } from "../../utils/Toaster";
import { getGymRewardsQuestAPI, postRewardFeed } from "../../services/Api";
import RewardsTabSkeleton from "../ui/loaders/rewardsTabSkeleton";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { getToken } from "../../utils/auth";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Dynamically import the owner rewards component
const CreateRewardsTab = React.lazy(() => import("../../app/owner/rewards"));

const Rewards = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("createRewards");
  const createRewardsRef = useRef(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();

  const fetchRewardDetails = async () => {
    setLoading(true);
    try {
      const response = await getGymRewardsQuestAPI();

      if (response?.status === 200) {
        setQuests(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error fetching rewards",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong 111. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardDetails();
  }, []);

  if (loading && activeTab === "earnXp") {
    return <RewardsTabSkeleton />;
  }

  const tabs = [
    { id: "createRewards", label: "Gym Rewards" },
    { id: "earnXp", label: "User XP Quests" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.customTabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.customTab}
          >
            {activeTab === tab.id ? (
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeCustomTabText}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabButton}>
                <Text style={styles.inactiveCustomTabText}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentContainer}>
        {activeTab === "createRewards" ? (
          <>
            <TouchableOpacity
              style={styles.termsButton}
              onPress={() => setShowTermsModal(true)}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#007AFF"
              />
              <Text style={styles.termsButtonText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <React.Suspense fallback={<RewardsTabSkeleton />}>
              <CreateRewardsTab hideHeader={true} ref={createRewardsRef} />
            </React.Suspense>
          </>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <EarnXP quest={quests} />
          </ScrollView>
        )}

        {activeTab === "createRewards" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (Platform.OS === "ios" || Platform.OS === "android") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              // Trigger the add modal from the CreateRewardsTab component
              if (createRewardsRef.current?.handleOpenAddModal) {
                createRewardsRef.current.handleOpenAddModal();
              }
            }}
          >
            <Ionicons name="add" size={30} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Reward Announcement Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRewardModal}
        onRequestClose={() => setShowRewardModal(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="gift" size={60} color="#007AFF" />
            </View>

            <Text style={styles.alertTitle}>Post Reward Announcement</Text>

            <Text style={styles.alertMessage}>
              Post the reward announcement in your Feed?
            </Text>

            <View style={styles.rewardModalButtons}>
              <TouchableOpacity
                style={styles.rewardCancelButton}
                onPress={() => setShowRewardModal(false)}
              >
                <Text style={styles.rewardCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rewardConfirmButton}
                onPress={async () => {
                  setShowRewardModal(false);
                  try {
                    const gymId = await getToken("gym_id");
                    if (!gymId) {
                      showToast({
                        type: "error",
                        title: "Unable to get gym information",
                      });
                      return;
                    }

                    const payload = {
                      gym_id: Number(gymId),
                    };

                    const response = await postRewardFeed(payload);

                    if (response?.status === 200) {
                      showToast({
                        type: "success",
                        title: "Success",
                        desc:
                          response?.message ||
                          "Reward announcement posted successfully",
                      });
                      router.push("/owner/feed");
                    } else {
                      showToast({
                        type: "error",
                        title: "Failed",
                        desc:
                          response?.message ||
                          "Failed to post reward announcement",
                      });
                    }
                  } catch (error) {
                    console.error("Error posting reward:", error);
                    showToast({
                      type: "error",
                      title: "Error",
                      desc: "An error occurred while posting the announcement",
                    });
                  }
                }}
              >
                <Text style={styles.rewardConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.termsModalHeader}>
              <Ionicons name="information-circle" size={40} color="#007AFF" />
              <Text style={styles.termsModalTitle}>
                Gym Rewards - Terms & Conditions
              </Text>
            </View>

            <ScrollView
              style={styles.termsModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  1. Optional Program
                </Text>
                <Text style={styles.termsSectionText}>
                  This rewards program is entirely optional and not mandatory
                  for gym clients or owners.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  2. Motivational Purpose Only
                </Text>
                <Text style={styles.termsSectionText}>
                  The rewards system is designed solely for motivational
                  purposes to encourage client engagement and fitness progress.
                  It is not a contest, lottery, or any form of gambling.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  3. Owner-Set Rewards
                </Text>
                <Text style={styles.termsSectionText}>
                  All rewards are created, managed, and funded exclusively by
                  individual gym owners to motivate their clients.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  4. XP Points System
                </Text>
                <Text style={styles.termsSectionText}>
                  Rewards are based on XP (experience points) earned by clients
                  through:
                  {"\n"}Gym attendance
                  {"\n"}Completing workouts
                  {"\n"}Following diet plans
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  5. No Platform Contribution
                </Text>
                <Text style={styles.termsSectionText}>
                  Fymble, the app stores (Apple App Store, Google Play Store),
                  and any platform providers do not contribute to, sponsor, or
                  endorse these rewards in any way. All rewards are
                  independently offered by gym owners.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>
                  6. Owner Responsibility
                </Text>
                <Text style={styles.termsSectionText}>
                  Gym owners are solely responsible for fulfilling any rewards
                  they create and promise to their clients.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.termsCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.termsCloseButtonText}>Close</Text>
            </TouchableOpacity>
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
    marginTop: width >= 786 ? 20 : Platform.OS === "ios" ? 15 : 5,
  },
  customTabContainer: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 10,
    gap: 4,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    marginBottom: 0,
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  customTab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeCustomTabText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  inactiveCustomTabText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 150 : 20,
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
    zIndex: 9999,
    ...(Platform.OS === "ios" && {
      shadowOpacity: 0.4,
      shadowRadius: 6,
    }),
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
  },
  infoIcon: {
    width: "10%",
  },
  infoText: {
    fontSize: 12,
    color: "#0154A0",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#0154A0",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#777",
  },
  activeTabText: {
    color: "#0154A0",
    fontWeight: "600",
  },
  badgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    marginTop: 10,
  },
  badgeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgeIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  xpIcon: {
    width: 25,
    height: 25,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "absolute",
    left: 0,
    top: 20,
    fontSize: 12,
  },
  xpText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    position: "relative",
    height: 10,
    marginBottom: 16,
  },
  progressBackground: {
    height: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0154A0",
    borderRadius: 5,
  },
  nextLevelXp: {
    position: "absolute",
    right: 0,
    top: 20,
    fontSize: 14,
    color: "#0154A0",
  },
  nextBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextBadgeText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },
  smallBadgeIcon: {
    width: 45,
    height: 50,
  },
  // New reward cards styling
  rewardsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  rewardsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  rewardCard: {
    width: 145,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  selectedRewardCard: {
    // borderWidth: 2,
    // borderColor: '#0154A0',
  },
  rewardImageContainer: {
    height: 120,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  rewardImageBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
  rewardInfoContainer: {
    padding: 8,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardXpIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardXp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0154A0",
  },
  historyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    marginRight: 12,
  },
  rewardItemTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  rewardItemDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  rewardItemPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 12,
    color: "#0154A0",
    fontWeight: "500",
  },
  monthlyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  monthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  monthName: {
    fontSize: 12,
    fontWeight: "500",
  },
  monthPoints: {
    fontSize: 12,
    fontWeight: "500",
  },
  workoutText: {
    paddingTop: 5,
    color: "rgba(0,0,0,0.3)",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    flex: 1,
  },
  historyPoints: {
    flex: 1,
    textAlign: "center",
  },
  historyReward: {
    flex: 1,
    textAlign: "right",
  },
  rewardTitleNo: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 5,
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredModalContent: {
    width: "60%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  rewardDetailContainer: {
    alignItems: "center",
    paddingBottom: 15,
    borderWidth: 2,
    borderRadius: 25,
    borderColor: "#0154A0",
    overflow: "hidden",
  },
  rewardDetailImage: {
    width: "100%",
    height: 150,
    marginBottom: 16,
  },
  rewardDetailTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  iphoneSection: {
    width: width - 32,
    aspectRatio: 0.9,
    alignSelf: "center",
  },
  contestSection: {
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  topSection: {
    width: "96%",
    aspectRatio: 2.4,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    alignSelf: "center",
  },
  watchImage: {
    width: "100%",
    height: "100%",
  },
  bottomProducts: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 10,
  },
  productItem: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 0.9,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  challengeInfo: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  challengeText: {
    fontSize: width > 400 ? 16 : 14,
    color: "#464646",
    textAlign: "center",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  challengeDate: {
    color: "#FF4444",
    fontWeight: "700",
    fontSize: 16,
  },
  challengeSubtext: {
    fontSize: width > 400 ? 16 : 16,
    color: "#FF5757",
    fontWeight: "600",
    textAlign: "center",
  },
  announcementButton: {
    backgroundColor: "#FFE9A8",
    paddingVertical: width > 400 ? 14 : 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    width: "90%",
    marginTop: 15,
    marginHorizontal: "auto",
  },
  announcementButtonText: {
    color: "#8B5A00",
    fontSize: width > 400 ? 16 : 14,
    fontWeight: "700",
  },
  // Alert Modal Styles
  alertModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIconContainer: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  // Reward Modal Styles
  rewardModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  rewardCancelButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rewardCancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  rewardConfirmButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rewardConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fittbotRewardsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  fittbotRewardsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rewardBoxIcon: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  fittbotRewardsTextContainer: {
    flex: 1,
  },
  fittbotRewardsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  fittbotBrand: {
    color: "#FF5757",
  },
  fittbotRewardsSubtitle: {
    fontSize: 12,
    color: "#454545",
  },
  termsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginRight: 12,
    marginTop: 8,
    marginBottom: 0,
    gap: 4,
  },
  termsButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  termsModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  termsModalHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
    textAlign: "center",
  },
  termsModalContent: {
    maxHeight: 400,
  },
  termsSection: {
    marginBottom: 16,
  },
  termsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  termsSectionText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  termsCloseButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  termsCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Rewards;
