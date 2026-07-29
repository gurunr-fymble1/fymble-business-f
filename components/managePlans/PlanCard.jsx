import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const PlanCard = ({
  item,
  type,
  onEdit,
  onDelete,
  name,
  showPersonalTrainingBadge = false,
}) => {
  const isCouplePlan = item.is_couple === true;
  const isBuddyPlan = item.plan_for === "buddy";
  const buddyCount = item.buddy_count;
  const [menuVisible, setMenuVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleEdit = () => {
    toggleMenu();
    onEdit(item);
  };

  const handleDelete = () => {
    toggleMenu();
    onDelete(item.id, type === "Plan" ? item.plans : item.batch_name);
  };

  const calculateDiscount = () => {
    if (item.original && item.amount) {
      const original = parseFloat(item.original);
      const discounted = parseFloat(item.amount);
      const discount = ((original - discounted) / original) * 100;
      return discount.toFixed(0);
    }
    return null;
  };

  const hasDiscount =
    item.original &&
    item.amount &&
    parseFloat(item.amount) < parseFloat(item.original);

  return (
    <View
      style={[
        styles.cardContainer,
        type !== "plans" && { width: "100%" },
        type === "plans" && { overflow: "hidden" },
      ]}
    >
      {type === "plans" ? (
        <>
          {/* Plan Card - New Design */}
          <View style={styles.planCard}>
            {/* Blue Header with Plan Name */}
            <LinearGradient
              colors={["#007BFF", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.planCardHeader}
            >
              <Text style={styles.planCardTitle} numberOfLines={1}>
                {name}
              </Text>
              <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Icon name="dots-vertical" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* White Content Area */}
            <View style={styles.planCardContent}>
              {/* Buddy Count Badge - Show for buddy plans */}
              {isBuddyPlan && buddyCount ? (
                <View style={styles.buddyCountBadge}>
                  <Icon name="account-group" size={18} color="#007BFF" />
                  <Text style={styles.buddyCountText}>
                    {buddyCount} Members Plan
                  </Text>
                </View>
              ) : null}

              {/* Bonus, Pause, Duration and Services - Show as bullets */}
              <View style={styles.detailsSection}>
                {/* Duration */}
                <View style={styles.detailRow}>
                  <Icon
                    name="circle"
                    size={6}
                    color="#434343"
                    style={styles.bulletIcon}
                  />
                  <Text style={styles.detailText}>
                    {item.duration} {item.duration === 1 ? "Month" : "Months"}{" "}
                    Plan
                  </Text>
                </View>

                {/* Bonus */}
                {item.bonus && parseInt(item.bonus) > 0 ? (
                  <View style={styles.detailRow}>
                    <Icon
                      name="circle"
                      size={6}
                      color="#434343"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.detailText}>
                      {item.bonus}{" "}
                      {item.bonus_type === "month"
                        ? parseInt(item.bonus) > 1
                          ? "Months"
                          : "Month"
                        : parseInt(item.bonus) > 1
                          ? "Days"
                          : "Day"}{" "}
                      <Text style={styles.bonusHighlight}>Bonus</Text> Available
                    </Text>
                  </View>
                ) : (
                  <View style={styles.detailRow}>
                    <Icon
                      name="circle"
                      size={6}
                      color="#434343"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.detailText}>No Bonus Available</Text>
                  </View>
                )}

                {/* Pause */}
                {item.pause && parseInt(item.pause) > 0 ? (
                  <View style={styles.detailRow}>
                    <Icon
                      name="circle"
                      size={6}
                      color="#434343"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.detailText}>
                      {item.pause}{" "}
                      {item.pause_type === "month"
                        ? parseInt(item.pause) > 1
                          ? "Months"
                          : "Month"
                        : parseInt(item.pause) > 1
                          ? "Days"
                          : "Day"}{" "}
                      <Text style={styles.pauseHighlight}>Pause</Text> Available
                    </Text>
                  </View>
                ) : (
                  <View style={styles.detailRow}>
                    <Icon
                      name="circle"
                      size={6}
                      color="#434343"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.detailText}>No Pause Available</Text>
                  </View>
                )}

                {/* Sessions per Month - For Individual PT and Couple PT */}
                {item.personal_training &&
                (item.plan_for === "individual" ||
                  item.plan_for === "couple") ? (
                  item.sessions_count && parseInt(item.sessions_count) > 0 ? (
                    <View style={styles.detailRow}>
                      <Icon
                        name="circle"
                        size={6}
                        color="#434343"
                        style={styles.bulletIcon}
                      />
                      <Text style={styles.detailText}>
                        {item.sessions_count}{" "}
                        {parseInt(item.sessions_count) > 1
                          ? "Sessions"
                          : "Session"}{" "}
                        <Text style={styles.sessionsHighlight}>Per Month</Text>
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.detailRow}>
                      <Icon
                        name="circle"
                        size={6}
                        color="#434343"
                        style={styles.bulletIcon}
                      />
                      <Text style={styles.detailText}>No Sessions Limit</Text>
                    </View>
                  )
                ) : null}

                {/* Show only first service + more */}
                {item.services && item.services.length > 0 ? (
                  <TouchableOpacity
                    style={styles.detailRow}
                    onPress={() =>
                      item.services.length > 1 && setServicesModalVisible(true)
                    }
                  >
                    <Icon
                      name="circle"
                      size={6}
                      color="#434343"
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {item.services[0]}
                      {item.services.length > 1 && (
                        <Text style={styles.moreText}> +more</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Pricing Section */}
              <View style={styles.newPricingSection}>
                {hasDiscount && (
                  <View style={styles.pricingDiscountBadge}>
                    <Text style={styles.pricingDiscountText}>
                      {calculateDiscount()}% OFF
                    </Text>
                  </View>
                )}
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.newFinalPrice}>
                      ₹{parseFloat(item.amount || item.original).toFixed(0)}
                    </Text>
                    {hasDiscount && (
                      <Text style={styles.newOriginalPrice}>
                        ₹{parseFloat(item.original).toFixed(0)}
                      </Text>
                    )}
                  </View>
                  {item.duration > 1 && (
                    <Text style={styles.newPerMonthPrice}>
                      ₹
                      {(() => {
                        const price = parseFloat(item.amount || item.original);
                        let totalMonths = item.duration;
                        if (item.bonus && parseInt(item.bonus) > 0) {
                          if (item.bonus_type === "month") {
                            totalMonths += parseInt(item.bonus);
                          } else if (item.bonus_type === "day") {
                            totalMonths += parseInt(item.bonus) / 30;
                          }
                        }
                        return Math.round(price / totalMonths).toLocaleString(
                          "en-IN",
                        );
                      })()}{" "}
                      <Text style={{ color: "#8E8E8E", fontSize: 13 }}>
                        / per month
                      </Text>
                    </Text>
                  )}
                </View>
              </View>

              {/* Terms & Conditions Link */}
              {item.description ? (
                <TouchableOpacity
                  onPress={() => setTermsModalVisible(true)}
                  style={styles.newTermsLink}
                >
                  <Text style={styles.newTermsLinkText}>
                    Terms & Conditions
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.newTermsLink} />
              )}
            </View>
          </View>

          {/* Terms & Conditions Modal */}
          <Modal
            visible={termsModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setTermsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Terms & Conditions</Text>
                  <TouchableOpacity
                    onPress={() => setTermsModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#4A5568" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDescriptionText}>
                    {item.description}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseFooterButton}
                  onPress={() => setTermsModalVisible(false)}
                >
                  <Text style={styles.modalCloseFooterButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Services Modal */}
          <Modal
            visible={servicesModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setServicesModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>All Services</Text>
                  <TouchableOpacity
                    onPress={() => setServicesModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#4A5568" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {item.services &&
                    item.services.map((service, index) => (
                      <View key={index} style={styles.serviceModalItem}>
                        <Icon name="check-circle" size={18} color="#10B981" />
                        <Text style={styles.serviceModalText}>{service}</Text>
                      </View>
                    ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseFooterButton}
                  onPress={() => setServicesModalVisible(false)}
                >
                  <Text style={styles.modalCloseFooterButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <>
          {/* Batch Card - Keep Original Design */}
          <View style={[styles.cardHeader, { paddingVertical: 10 }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, { color: "#000000" }]}>
                {name}
              </Text>
            </View>
            <Text
              style={[
                styles.infoText,
                { color: "rgba(7,7,7,0.5)", fontSize: 14 },
              ]}
            >
              {item.timing}
            </Text>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <Icon name="dots-vertical" size={22} color="#4A5568" />
            </TouchableOpacity>
          </View>
          {/* <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon
                  name="clock-outline"
                  size={20}
                  color="#0078FF"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{item.timing}</Text>
              </View>
            </View>
            {item.description ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}
          </View> */}
        </>
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <View style={styles.menuCenteredContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Icon name="pencil" size={20} color="#0078FF" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Icon name="delete" size={20} color="#E53E3E" />
              <Text style={[styles.menuItemText, { color: "#E53E3E" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
    width: 280,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#ddd",
    position: "relative",
    marginVertical: 10,
    marginTop: 0,
  },

  // New Plan Card Styles
  planCard: {
    flex: 1,
  },
  planCardHeader: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  planCardContent: {
    padding: 16,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  pricingSection: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 0,
  },
  finalPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#434343",
  },
  originalPriceStrike: {
    fontSize: 28,
    color: "#999999",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  discountBadge: {
    backgroundColor: "#22C55E",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    position: "absolute",
    top: -5,
    right: 0,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  // Buddy Count Badge
  buddyCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BEE3F8",
    gap: 6,
  },
  buddyCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007BFF",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A202C",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDescriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4A5568",
  },
  modalCloseFooterButton: {
    backgroundColor: "#0078FF",
    margin: 20,
    marginTop: 0,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseFooterButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Original Batch Card Styles
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    // borderWidth: 1,
    // borderColor: "#ddd",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0078FF",
  },
  menuButton: {
    padding: 4,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "500",
    marginLeft: 5,
  },
  description: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
  },

  // Menu Styles
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuCenteredContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
    color: "#4A5568",
  },

  // Subscription Badge Styles
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 0,
    paddingHorizontal: 12,
    paddingRight: 0,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  nutritionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 0,
    paddingHorizontal: 12,
    paddingRight: 0,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  badgeLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  badgeRightSection: {
    alignItems: "flex-end",
    backgroundColor: "#FF5757",
    width: "25%",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  badgeTextContainer: {
    // flex: 1,
  },
  badgeLabelBlack: {
    color: "#000000",
    fontSize: Platform.OS === "ios" ? 11 : 12,
    fontWeight: "600",
  },
  badgeLabelRed: {
    color: "#FF5757",
    fontSize: Platform.OS === "ios" ? 11 : 12,
    fontWeight: "600",
  },
  badgeLabel: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 10 : 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  freeTagRed: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingTop: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  freeTagWhite: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",

    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  originalPriceStrike: {
    color: "#999999",
    fontSize: 16,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  originalPriceTagWhite: {
    color: "#FFFFFF",
    fontSize: 11,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },

  // Bonus and Pause Section
  bonusPauseItem: {
    backgroundColor: "#F7F7F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    minHeight: 33,
  },
  bonusPauseText: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "500",
  },
  bonusPauseTextEmpty: {
    fontSize: 13,
    color: "transparent",
  },
  bonusHighlight: {
    color: "#007BFF",
    fontWeight: "700",
  },
  pauseHighlight: {
    color: "#007BFF",
    fontWeight: "700",
  },
  sessionsHighlight: {
    color: "#007BFF",
    fontWeight: "700",
  },

  // Services Section
  servicesSection: {
    marginBottom: 0,
  },
  serviceText: {
    fontSize: 13,
    color: "#333333",
    marginBottom: 6,
    fontWeight: "400",
    backgroundColor: "#F7F7F7",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  serviceTextEmpty: {
    backgroundColor: "#F7F7F7",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 6,
    minHeight: 33,
  },
  serviceTextClickable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F7",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  serviceTextInner: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "400",
    flex: 1,
    marginRight: 8,
  },
  moreServicesText: {
    fontSize: 13,
    color: "#007BFF",
    fontWeight: "700",
  },

  // Payment Options Section
  paymentOptionsSection: {
    gap: 8,
  },
  paymentOptionBadge: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "flex-start",
  },
  paymentOptionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptySpace: {
    height: 36,
  },
  termsLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignSelf: "center",
  },
  termsLinkText: {
    color: "#007BFF",
    fontSize: 12,
    textDecorationLine: "underline",
  },

  // Services Modal Styles
  serviceModalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceModalText: {
    fontSize: 14,
    color: "#333333",
    marginLeft: 10,
    flex: 1,
  },

  // New styles from gymdetails design
  subscriptionContainer: {
    backgroundColor: "rgba(34,197,94,0.02)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 125,
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  freeBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    position: "absolute",
    top: -10,
    right: 8,
  },
  freeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  subscriptionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  subscriptionItemCentered: {
    justifyContent: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  newBadgeIcon: {
    width: 30,
    height: 30,
  },
  newBadgeTextContainer: {
    flex: 1,
  },
  newBadgeLabelLine1: {
    color: "#000000",
    fontSize: Platform.OS === "ios" ? 12 : 13,
    fontWeight: "700",
  },
  newBadgeLabelLine2: {
    color: "#666666",
    fontSize: Platform.OS === "ios" ? 11 : 12,
    fontWeight: "500",
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 12,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#434343",
    flex: 1,
    lineHeight: 20,
  },
  moreText: {
    color: "#007BFF",
    fontWeight: "700",
  },
  newPricingSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    minHeight: 100,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pricingDiscountBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    position: "absolute",
    top: -12,
    right: 12,
  },
  pricingDiscountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  newFinalPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#434343",
  },
  newOriginalPrice: {
    fontSize: 16,
    color: "rgba(142,142,142,0.6)",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginLeft: 8,
  },
  newPerMonthPrice: {
    fontSize: 15,
    color: "#007BFF",
    marginTop: 4,
    fontWeight: "600",
  },
  newTermsLink: {
    alignSelf: "center",
    marginBottom: 8,
  },
  newTermsLinkText: {
    fontSize: 12,
    color: "#007BFF",
    textDecorationLine: "underline",
  },
});

export default PlanCard;
