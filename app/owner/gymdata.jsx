import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import PrizeMemberCard from "../../components/prize/PrizeMemberCard";

import PrizeSkeleton from "../../components/ui/loaders/prizeSkeleton";

import { getPrizeListAPI, updateGivenPrizeAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import NoDataComponent from "../../utils/noDataComponent";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const Prizes = () => {
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [activePrizes, setActivePrizes] = useState([]);
  const [prizeHistory, setPrizeHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailHistoryModalVisible, setDetailHistoryModalVisible] =
    useState(false);
  const [selectedHistoryReward, setSelectedHistoryReward] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleGiftAction = (item) => {
    setSelectedPrize(item);
    setModalVisible(true);
  };
  const [activeTab, setActiveTab] = useState("Active Prize");
  const insets = useSafeAreaInsets();
  const filterValidPrizes = (prizes) => {
    return prizes.filter(
      (prize) =>
        prize &&
        prize.gift !== null &&
        prize.gift !== undefined &&
        prize.gift.trim() !== "" &&
        prize.client_name &&
        prize.client_name.trim() !== "",
    );
  };

  const confirmGiftGiven = async () => {
    const today = new Date().toISOString().split(".")[0];
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

      const payload = {
        reward_id: selectedPrize.id,
      };
      const response = await updateGivenPrizeAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Prize list updated successfully",
        });
        getPrizeList();
        setModalVisible(false);
        setSelectedPrize(null);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch Prize lists",
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

  const getPrizeList = async () => {
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
      const response = await getPrizeListAPI(gymId, status);
      if (response?.status === 200) {
        const data = Array.isArray(response?.data) ? response.data : [];

        const validData = filterValidPrizes(data);

        if (status === "pending") {
          setActivePrizes(validData);
          setPrizeHistory([]);
        } else {
          setPrizeHistory(validData);
          setActivePrizes([]);
        }
      } else {
        setActivePrizes([]);
        setPrizeHistory([]);
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch Prize lists",
        });
      }
    } catch (error) {
      setActivePrizes([]);
      setPrizeHistory([]);
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      getPrizeList();
    }, [status, activeTab]),
  );
  const showDetailsAlert = (item) => {
    setSelectedReward(item);
    setDetailModalVisible(true);
  };

  const showHistoryDetailsAlert = (item) => {
    setSelectedHistoryReward(item);
    setDetailHistoryModalVisible(true);
  };

  const handleActiveTab = (tab) => {
    setActiveTab(tab);
    if (tab == "Active Prize") {
      setStatus("pending");
    } else {
      setStatus("given");
    }
  };

  const tabs = ["Active Prize", "Given Prize"];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProfileImage = (member) => {
    return member?.image_url || member?.client_name?.charAt(0) || "U";
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleActiveTab(tab)}
              style={styles.tab}
            >
              {activeTab === tab ? (
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Text style={styles.activeTabText}>{tab}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTabButton}>
                  <Text style={styles.tabText}>{tab}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <PrizeSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleActiveTab(tab)}
            style={styles.tab}
          >
            {activeTab === tab ? (
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeTabText}>{tab}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabButton}>
                <Text style={styles.tabText}>{tab}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.termsButton}
        onPress={() => setShowTermsModal(true)}
      >
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.termsButtonText}>Terms & Conditions</Text>
      </TouchableOpacity>

      {activeTab === "Active Prize" && (
        <ScrollView style={styles.container}>
          {activePrizes && activePrizes.length > 0 ? (
            <View style={styles.cardGrid}>
              {activePrizes.map((member) => (
                <PrizeMemberCard
                  key={member.id}
                  member={member}
                  onButtonClick={() => handleGiftAction(member)}
                  onCardClick={() => showDetailsAlert(member)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.ZeroDataContainer}>
              <NoDataComponent icon="gift" iconColor="#0d2b5cff" />
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === "Given Prize" && (
        <ScrollView style={styles.container}>
          {prizeHistory && prizeHistory.length > 0 ? (
            <View style={styles.cardGrid}>
              {prizeHistory.map((member) => (
                <PrizeMemberCard
                  key={member.id}
                  member={member}
                  onButtonClick={() => showHistoryDetailsAlert(member)}
                  onCardClick={() => showHistoryDetailsAlert(member)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.ZeroDataContainer}>
              <NoDataComponent icon="gift" iconColor="#0d2b5cff" />
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.enhancedModalContent,
              { paddingBottom: insets.bottom + 5 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="gift" size={32} color="#FF5757" />
              </View>
              <Text style={styles.enhancedModalTitle}>
                Confirm Prize Delivery
              </Text>
            </View>

            <View style={styles.memberInfoContainer}>
              {selectedPrize?.image_url ? (
                <Image
                  source={{ uri: getProfileImage(selectedPrize) }}
                  style={styles.memberAvatar}
                />
              ) : (
                <View style={styles.avatarRound}>
                  <Text style={styles.avatarText}>
                    {selectedPrize?.client_name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {selectedPrize?.client_name}
                </Text>
                <Text style={styles.memberSubtitle}>Prize Recipient</Text>
              </View>
            </View>

            <View style={styles.prizeInfoBox}>
              <Text style={styles.prizeLabel}>Prize Item</Text>
              <Text style={styles.prizeValue}>{selectedPrize?.gift}</Text>
            </View>

            <Text style={styles.confirmationText}>
              Have you delivered this prize to the member?
            </Text>

            <View style={styles.enhancedModalButtons}>
              <TouchableOpacity
                style={[styles.enhancedModalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={18} color="#666" />
                <Text style={styles.cancelButtonText}>Not Yet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.enhancedModalButton, styles.confirmButton]}
                onPress={confirmGiftGiven}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Yes, Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <View
            style={[
              styles.enhancedDetailModalContainer,
              { paddingBottom: insets.bottom + 5 },
            ]}
          >
            <View style={styles.enhancedDetailModalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.detailModalHeader}>
                <View style={styles.headerLeft}>
                  {selectedReward?.image_url ? (
                    <Image
                      source={{ uri: getProfileImage(selectedReward) }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.avatarRound}>
                      <Text style={styles.avatarText}>
                        {selectedReward?.client_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailMemberName}>
                      {selectedReward?.client_name}
                    </Text>
                    <View style={styles.statusBadge}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color="#FF5757"
                      />
                      <Text style={styles.statusText}>Pending Delivery</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <FontAwesome5 name="star" size={16} color="#FFD700" />
                  <Text style={styles.pointsText}>{selectedReward?.xp} XP</Text>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Achievement Details</Text>
                </View>
                <View style={styles.achievementCard}>
                  <View style={styles.achievementRow}>
                    <Text style={styles.achievementLabel}>Achieved On</Text>
                    <Text style={styles.achievementValue}>
                      {formatDate(selectedReward?.achieved_date)}
                    </Text>
                  </View>
                  <View style={styles.achievementRow}>
                    <Text style={styles.achievementLabel}>Points Earned</Text>
                    <View style={styles.pointsRow}>
                      <FontAwesome5 name="star" size={14} color="#FFD700" />
                      <Text style={styles.achievementValue}>
                        {selectedReward?.xp} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Prize Information</Text>
                </View>
                <View style={styles.prizeCard}>
                  <View style={styles.prizeHeader}>
                    <MaterialCommunityIcons
                      name="gift-outline"
                      size={24}
                      color="#FF5757"
                    />
                    <Text style={styles.prizeTitle}>
                      {selectedReward?.gift}
                    </Text>
                  </View>
                  <Text style={styles.prizeDescription}>
                    Reward earned for exceptional performance and dedication to
                    fitness goals.
                  </Text>
                  <View style={styles.deliveryStatus}>
                    <MaterialCommunityIcons
                      name="truck-delivery"
                      size={16}
                      color="#FF9800"
                    />
                    <Text style={styles.deliveryText}>Awaiting Delivery</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.enhancedCloseButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.enhancedCloseButtonText}>
                  Close Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailHistoryModalVisible}
        onRequestClose={() => setDetailHistoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailHistoryModalVisible(false)}
        >
          <View style={[styles.enhancedDetailModalContainer]}>
            <View
              style={[
                styles.enhancedDetailModalContent,
                { paddingBottom: insets.bottom + 5 },
              ]}
            >
              <View style={styles.modalHandle} />

              <View style={styles.detailModalHeader}>
                <View style={styles.headerLeft}>
                  {selectedHistoryReward?.image_url ? (
                    <Image
                      source={{ uri: getProfileImage(selectedHistoryReward) }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.avatarRound}>
                      <Text style={styles.avatarText}>
                        {selectedHistoryReward?.client_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailMemberName}>
                      {selectedHistoryReward?.client_name}
                    </Text>
                    <View style={[styles.statusBadge, styles.completedBadge]}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={[styles.statusText, styles.completedText]}>
                        Delivered
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <FontAwesome5 name="star" size={16} color="#FFD700" />
                  <Text style={styles.pointsText}>
                    {selectedHistoryReward?.xp} XP
                  </Text>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="timeline"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Timeline</Text>
                </View>
                <View style={styles.timelineContainer}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIcon}>
                      <MaterialCommunityIcons
                        name="trophy"
                        size={16}
                        color="#FF5757"
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>
                        Achievement Unlocked
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(selectedHistoryReward?.achieved_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineIcon, styles.deliveredIcon]}>
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#4CAF50"
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Prize Delivered</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(selectedHistoryReward?.given_date)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={20}
                    color="#FF5757"
                  />
                  <Text style={styles.sectionTitle}>Prize Information</Text>
                </View>
                <View style={styles.prizeCard}>
                  <View style={styles.prizeHeader}>
                    <MaterialCommunityIcons
                      name="gift-outline"
                      size={24}
                      color="#FF5757"
                    />
                    <Text style={styles.prizeTitle}>
                      {selectedHistoryReward?.gift}
                    </Text>
                  </View>
                  <Text style={styles.prizeDescription}>
                    Successfully delivered reward for outstanding fitness
                    achievement.
                  </Text>
                  <View
                    style={[styles.deliveryStatus, styles.completedDelivery]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text
                      style={[
                        styles.deliveryText,
                        styles.completedDeliveryText,
                      ]}
                    >
                      Successfully Delivered
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.enhancedCloseButton}
                onPress={() => setDetailHistoryModalVisible(false)}
              >
                <Text style={styles.enhancedCloseButtonText}>
                  Close Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.termsModalHeader}>
              <Ionicons name="information-circle" size={40} color="#FF5757" />
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
    backgroundColor: "#F7F7F7",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    marginTop: Platform.OS === "ios" ? 35 : 15,
    marginHorizontal: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tabText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
    paddingHorizontal: 20,
  },

  ZeroDataContainer: {
    paddingVertical: 70,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  enhancedModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: responsiveWidth(6),
    width: responsiveWidth(85),
    maxHeight: responsiveHeight(70),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: responsiveHeight(3),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  enhancedModalTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  memberInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 15,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  avatarRound: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: responsiveFontSize(18),
    fontWeight: "600",
    color: "#ff5757",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#333",
  },
  memberSubtitle: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginTop: 2,
  },
  prizeInfoBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  prizeLabel: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  prizeValue: {
    fontSize: responsiveFontSize(16),
    color: "#333",
    fontWeight: "bold",
    marginTop: 4,
  },
  confirmationText: {
    fontSize: responsiveFontSize(16),
    textAlign: "center",
    color: "#333",
    marginBottom: responsiveHeight(3),
    lineHeight: 24,
  },
  enhancedModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  enhancedModalButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveHeight(1.8),
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#FF5757",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  enhancedDetailModalContainer: {
    width: "100%",
    backgroundColor: "transparent",
  },
  enhancedDetailModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: responsiveWidth(5),
    width: "100%",
    maxHeight: responsiveHeight(80),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: responsiveHeight(3),
  },
  headerLeft: {
    flexDirection: "row",
    flex: 1,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#FF5757",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  detailMemberName: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: "flex-start",
    gap: 4,
  },
  completedBadge: {
    backgroundColor: "#F1F8E9",
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    color: "#FF5757",
    fontWeight: "500",
  },
  completedText: {
    color: "#4CAF50",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    color: "#FF8F00",
  },
  sectionContainer: {
    marginBottom: responsiveHeight(2.5),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
  },
  achievementCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
  },
  achievementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementLabel: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    fontWeight: "500",
  },
  achievementValue: {
    fontSize: responsiveFontSize(14),
    color: "#333",
    fontWeight: "600",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prizeCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: responsiveWidth(4),
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  prizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  prizeTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  prizeDescription: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedDelivery: {
    gap: 6,
  },
  deliveryText: {
    fontSize: responsiveFontSize(13),
    color: "#FF9800",
    fontWeight: "500",
  },
  completedDeliveryText: {
    color: "#4CAF50",
  },
  timelineContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: responsiveWidth(4),
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deliveredIcon: {
    backgroundColor: "#F1F8E9",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    color: "#333",
  },
  timelineDate: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 15,
    marginVertical: 8,
  },
  enhancedCloseButton: {
    backgroundColor: "#FF5757",
    padding: responsiveHeight(2),
    borderRadius: 15,
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enhancedCloseButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
  },

  // Legacy styles for compatibility
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(4),
  },
  title: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#FF5757",
  },
  toggleButton: {
    backgroundColor: "#FF5757",
    padding: responsiveWidth(2),
    borderRadius: 8,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: responsiveWidth(4),
  },
  // prizeCard: {
  //   backgroundColor: "white",
  //   borderRadius: 12,
  //   padding: responsiveWidth(4),
  //   marginBottom: responsiveHeight(2),
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   elevation: 3,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeName: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: 4,
  },
  prizeDate: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    marginBottom: 4,
  },
  prizeDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    width: "30%",
  },
  giftContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "65%",
  },
  giftText: {
    marginLeft: 4,
    fontSize: responsiveFontSize(14),
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#FF5757",
    padding: 6,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFontSize(16),
    color: "#666",
    marginTop: responsiveHeight(4),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(4),
  },
  emptySubText: {
    fontSize: responsiveFontSize(14),
    color: "#666",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(10),
  },
  viewMoreText: {
    color: "#FF5757",
    fontSize: responsiveFontSize(12),
  },
  prizeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  completedButton: {
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  termsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
    marginBottom: 8,
    gap: 4,
  },
  termsButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  termsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#FF5757",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#FF5757",
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

export default Prizes;
