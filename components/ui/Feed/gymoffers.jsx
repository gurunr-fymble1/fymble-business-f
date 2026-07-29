import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome,
  Ionicons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import GymOffersSkeleton from "../loaders/gymOffersSkeleton";
import { useRouter } from "expo-router";
import {
  getGymOffersAPI2,
  updateGymOffersAPI,
  deleteGymOffersAPI,
} from "../../../services/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "membership":
      return "id-card";
    case "guest":
      return "user-friends";
    case "nutrition":
      return "blender";
    case "training":
      return "dumbbell";
    case "apparel":
      return "tshirt";
    default:
      return "tag";
  }
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const GymOffers = ({ onScroll, scrollEventThrottle, headerHeight, role }) => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const insets = useSafeAreaInsets();
  const handleOfferPress = (item) => {
    setSelectedOffer({
      ...item,
      title: item.title || "",
      description: item.description || "",
      validity: item.validity || new Date().toISOString().split("T")[0],
      category: item.category || "membership",
      discount: item.discount || "",
      code: item.code || "",
      tag: item.tag || "Special Offer",
      image: item.image || require("../../../assets/images/offer_card.png"),
    });
    setModalVisible(true);
  };

  const fetchOffers = async () => {
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

      const response = await getGymOffersAPI2(gymId);

      if (response.status === 200) {
        const formattedOffers = response.data.map((offer) => ({
          id: offer.id.toString(),
          title: offer.title,
          subdescription: offer.subdescription || "",
          description: offer.description,
          validity: offer.validity,
          category: offer.category || "membership",
          discount: offer.discount || "0",
          code: offer.code,
          tag: offer.priority === "high" ? "Limited Time" : "Special Offer",
          image: offer.image_url,
        }));

        setOffers(formattedOffers);
      } else {
        showToast({
          type: "error",
          title: "Failed to fetch offers",
          desc: response?.message,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching offers",
        desc: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      setIsLoading(true);
      const response = await deleteGymOffersAPI({
        offer_id: announcementToDelete.id,
        gym_id: await getToken("gym_id"),
      });

      if (response.status === 200) {
        const updatedOffers = offers.filter(
          (a) => a.id !== announcementToDelete.id,
        );

        showToast({
          type: "success",
          title: "Offer Deleted successfully",
        });
        setOffers(updatedOffers);
      } else {
        showToast({
          type: "error",
          title: "Failed to delete offer",
          desc: response?.message,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error deleting offer",
        desc: error.message,
      });
    } finally {
      setDeleteModalVisible(false);
      setAnnouncementToDelete(null);
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setAnnouncementToDelete(null);
  };

  const handleUpdateOffer = async (updatedOffer) => {
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

      const payload = {
        id: updatedOffer.id,
        title: updatedOffer.title,
        description: updatedOffer.description,
        validity: updatedOffer.validity,
        category: updatedOffer.category,
        discount: updatedOffer.discount,
        code: updatedOffer.code,
        priority: updatedOffer.tag === "Limited Time" ? "high" : "low",
        gym_id: gymId,
      };

      const response = await updateGymOffersAPI(payload);

      if (response.status === 200) {
        const updatedOffers = offers.map((offer) =>
          offer.id === updatedOffer.id ? updatedOffer : offer,
        );
        setOffers(updatedOffers);
        setSelectedOffer(null);
        setModalVisible(false);
      } else {
        showToast({
          type: "error",
          title: "Failed to update offer",
          desc: response?.message,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating offer",
        desc: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderOffer = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[
          styles.offerContainer,
          isEven ? styles.offerEven : styles.offerOdd,
        ]}
        onPress={() => handleOfferPress(item)}
        onLongPress={() => {
          setAnnouncementToDelete(item);
          setDeleteModalVisible(true);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.offerImageContainer}>
          <LinearGradient
            colors={["#30818B", "#73C4CB"]}
            style={styles.offerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : require("../../../assets/images/offer_card.png")
              }
              contentFit="cover"
              style={{ width: "100%", height: "55%" }}
            />
            <View style={styles.offerDetails}>
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offerSubtitle}>
                {item.description.length > 70
                  ? `${item.description.slice(0, 70)}...`
                  : item.description}
              </Text>
              <View style={styles.offerValidUntil}>
                <Ionicons
                  name="time-outline"
                  size={responsiveFontSize(14)}
                  color="#FFF"
                />
                <Text style={styles.offerValidText}>
                  Valid until {formatDate(item.validity)}
                </Text>
              </View>
              <View style={styles.offerFooter}>
                {item.code && (
                  <Text style={styles.offerCode}>Code: {item.code}</Text>
                )}
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Entypo
                    name="chevron-right"
                    size={responsiveFontSize(14)}
                    color="#FFF"
                  />
                </View>
              </View>
              <View style={styles.offerBadge}>
                <View style={styles.offerBadgeContainer}>
                  <Image
                    source={require("../../../assets/images/offer_badge.png")}
                    contentFit="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View style={styles.offerBadgeText}>
                    <Text style={styles.offerText1}>SPECIAL</Text>
                    <Text style={styles.offerText2}>OFFER</Text>
                    <Text style={styles.offerDiscount}>{item.discount} %</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay2}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteModalContainer}>
                <View style={styles.deleteModalHeader}>
                  <Ionicons name="warning-outline" size={40} color="#295196" />
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
                    onPress={confirmDelete}
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

  const getImageSource = (imageUrl) => {
    // First check if imageUrl exists and is a string before calling trim()
    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      imageUrl.trim() !== "" &&
      imageUrl !== "null" &&
      imageUrl !== "undefined"
    ) {
      return { uri: imageUrl };
    }
    // Return default image
    return require("../../../assets/images/offer_card.png");
  };
  const renderDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons
                name="close"
                size={responsiveFontSize(24)}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>

          {selectedOffer && (
            <>
              {/* Fixed Image Header */}
              <View style={styles.modalImageContainer}>
                <ImageBackground
                  source={getImageSource(selectedOffer?.image)}
                  style={styles.modalImage}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.modalImageGradient}
                  >
                    <View style={styles.modalOfferTag}>
                      <Text style={styles.modalOfferTagText}>
                        {selectedOffer.tag}
                      </Text>
                    </View>
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedOffer.title}
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                style={[
                  styles.modalDetailsContainer,
                  { paddingBottom: insets.bottom },
                ]}
                contentContainerStyle={styles.modalDetailsContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                {/* Action Buttons at the top of scrollable content */}
                {role !== "trainer" && (
                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setModalVisible(false);
                        router.push({
                          pathname: "/owner/(feed)/addOfferFormPage",
                          params: {
                            offer: JSON.stringify(selectedOffer),
                          },
                        });
                      }}
                    >
                      <MaterialIcons
                        name="edit"
                        size={responsiveFontSize(18)}
                        color="#30818B"
                      />
                      <Text style={styles.actionButtonText}>Edit Offer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteActionButton]}
                      onPress={() => {
                        setModalVisible(false);
                        setAnnouncementToDelete(selectedOffer);
                        setDeleteModalVisible(true);
                      }}
                    >
                      <MaterialIcons
                        name="delete"
                        size={responsiveFontSize(18)}
                        color="#FF4444"
                      />
                      <Text
                        style={[styles.actionButtonText, { color: "#FF4444" }]}
                      >
                        Delete Offer
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <FontAwesome5
                      name={getCategoryIcon(selectedOffer.category)}
                      size={responsiveFontSize(18)}
                      color="#30818B"
                    />
                    <Text style={styles.modalInfoLabel}>Category</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.category.charAt(0).toUpperCase() +
                        selectedOffer.category.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <FontAwesome
                      name="percent"
                      size={responsiveFontSize(18)}
                      color="#30818B"
                    />
                    <Text style={styles.modalInfoLabel}>Discount</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedOffer.discount}
                    </Text>
                  </View>

                  <View style={styles.modalInfoDivider} />

                  <View style={styles.modalInfoItem}>
                    <Ionicons
                      name="calendar"
                      size={responsiveFontSize(18)}
                      color="#30818B"
                    />
                    <Text style={styles.modalInfoLabel}>Valid Until</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDate(selectedOffer.validity)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDescriptionContainer}>
                  <Text style={styles.modalDescriptionTitle}>
                    Offer Details
                  </Text>
                  <Text style={styles.modalDescription}>
                    {selectedOffer.description}
                  </Text>
                </View>
                {selectedOffer.code && (
                  <View style={styles.modalCodeContainer}>
                    <Text style={styles.modalCodeLabel}>Use Code</Text>
                    <View style={styles.modalCodeBox}>
                      <Text style={styles.modalCodeValue}>
                        {selectedOffer.code}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Add some bottom padding for better scrolling */}
                <View style={styles.modalBottomPadding} />
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
    <View style={styles.container} edges={["top"]}>
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.offersContainer]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        ListHeaderComponent={() => (
          <View style={styles.headerInfoContainer}>
            {role !== "trainer" && (
              <View style={styles.addButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  activeOpacity={0.8}
                  onPress={() => router.push("/owner/(feed)/addOfferFormPage")}
                >
                  <LinearGradient
                    colors={["#30818B", "#70C1C7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                  >
                    <MaterialIcons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Offer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            <LinearGradient
              colors={["#30818B", "#70C1C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoHeader}
            >
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Exclusive Offers</Text>
                <Text style={styles.promosubdescription}>
                  Save big on memberships & more
                </Text>
              </View>
              <View style={styles.promoIconContainer}>
                <FontAwesome5
                  name="tags"
                  size={responsiveFontSize(24)}
                  color="#FFF"
                />
              </View>
            </LinearGradient>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5
              name="gift"
              size={responsiveFontSize(50)}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>No Offers Available</Text>
            <Text style={styles.emptysubdescription}>
              Check back soon for new deals
            </Text>
          </View>
        )}
      />
      {renderDetailModal()}
      {renderDeleteConfirmationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  offersContainer: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerInfoContainer: {
    marginVertical: responsiveHeight(2),
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  promosubdescription: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
  },
  promoIconContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    minHeight: responsiveHeight(30),
    maxHeight: responsiveHeight(35),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerDetails: {
    position: "relative",
    // backgroundColor: "#1E2349",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#196A75",
    borderBottomEndRadius: 10,
    height: "45%",
    padding: 10,
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
    borderRadius: responsiveWidth(3),
  },
  offerTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  offerTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  offerBadgeContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 70,
    height: 70,
  },
  offerText1: {
    fontSize: 10,
    fontWeight: 400,
    color: "#A32669",
    textAlign: "center",
  },
  offerBadgeText: {
    position: "absolute",
    top: 3,
    right: 0,
    left: 0,
  },
  offerText2: {
    fontSize: 12,
    fontWeight: 900,
    color: "#D7001D",
    textAlign: "center",
  },
  offerDiscount: {
    color: "#000",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    textAlign: "center",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
    width: "80%",
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(10),
    marginLeft: responsiveWidth(1),
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerCode: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    marginRight: responsiveWidth(1),
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
  emptysubdescription: {
    fontSize: responsiveFontSize(14),
    color: "#999",
    marginTop: responsiveHeight(1),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(4),
  },

  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(4),
    zIndex: 10,
  },

  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    height: responsiveHeight(30),
    width: "100%",
    resizeMode: "contain",
  },
  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: responsiveWidth(4),
  },
  modalOfferTag: {
    position: "absolute",
    top: responsiveHeight(2),
    left: responsiveWidth(4),
    backgroundColor: "#295196",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  modalOfferTagText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  modalTitleContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },
  modalsubdescription: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    opacity: 0.9,
  },
  modalDetailsContainer: {
    flex: 1,
    padding: responsiveWidth(4),
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  modalInfoLabel: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    marginTop: responsiveHeight(0.5),
  },
  modalInfoValue: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
    textAlign: "center",
  },
  modalDescriptionContainer: {
    marginBottom: responsiveHeight(2),
  },
  modalDescriptionTitle: {
    color: "#333",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(1),
  },
  modalDescription: {
    color: "#555",
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
  },
  modalCodeContainer: {
    marginVertical: responsiveHeight(2),
    alignItems: "center",
  },
  modalCodeLabel: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    marginBottom: responsiveHeight(1),
  },
  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    borderStyle: "dashed",
  },
  modalCodeValue: {
    color: "#16d656",
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  claimButton: {
    backgroundColor: "#295196",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#295196",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
  },
  deleteModalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: responsiveWidth(5),
    width: "85%",
    alignItems: "center",
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
    backgroundColor: "#295196",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: responsiveFontSize(14),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: responsiveWidth(6),
    borderTopRightRadius: responsiveWidth(6),
    height: responsiveHeight(85),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    flex: 0,
  },

  modalHeader: {
    position: "absolute",
    top: responsiveHeight(2),
    right: responsiveWidth(4),
    zIndex: 10,
  },

  closeButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalImageContainer: {
    height: responsiveHeight(25), // Reduced height to give more space for scrollable content
    width: "100%",
  },

  modalImage: {
    height: "100%",
    width: "100%",
  },

  modalImageGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    padding: responsiveWidth(4),
  },

  modalOfferTag: {
    position: "absolute",
    top: responsiveHeight(2),
    left: responsiveWidth(4),
    backgroundColor: "#30818B",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },

  modalOfferTagText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },

  modalTitleContainer: {
    marginBottom: responsiveHeight(2),
  },

  modalTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    marginBottom: responsiveHeight(0.5),
  },

  modalSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    opacity: 0.9,
  },

  modalActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(2),
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: responsiveWidth(1),
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  deleteActionButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE6E6",
  },

  actionButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: "600",
    color: "#30818B",
    marginLeft: responsiveWidth(2),
  },

  modalDetailsContainer: {
    flex: 1, // This ensures ScrollView takes remaining space
    backgroundColor: "#FFF",
  },

  modalDetailsContent: {
    padding: responsiveWidth(4),
    paddingBottom: responsiveHeight(4), // Extra padding at bottom
  },

  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },

  modalInfoItem: {
    flex: 1,
    alignItems: "center",
  },

  modalInfoDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },

  modalInfoLabel: {
    color: "#666",
    fontSize: responsiveFontSize(12),
    marginTop: responsiveHeight(0.5),
  },

  modalInfoValue: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
    textAlign: "center",
  },

  modalDescriptionContainer: {
    marginBottom: responsiveHeight(2),
  },

  modalDescriptionTitle: {
    color: "#333",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginBottom: responsiveHeight(1),
  },

  modalDescription: {
    color: "#555",
    fontSize: responsiveFontSize(15),
    lineHeight: responsiveFontSize(22),
  },

  modalCodeContainer: {
    marginVertical: responsiveHeight(2),
    alignItems: "center",
  },

  modalCodeLabel: {
    color: "#333",
    fontSize: responsiveFontSize(14),
    marginBottom: responsiveHeight(1),
  },

  modalCodeBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(1.5),
    borderStyle: "dashed",
  },

  modalCodeValue: {
    color: "#16d656",
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    letterSpacing: 1,
  },

  claimButton: {
    backgroundColor: "#30818B",
    borderRadius: responsiveWidth(3),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginTop: responsiveHeight(2),
    shadowColor: "#30818B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  claimButtonText: {
    color: "#FFF",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  modalBottomPadding: {
    height: responsiveHeight(2),
  },
});

export default GymOffers;
