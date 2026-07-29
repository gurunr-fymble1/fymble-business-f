import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Swiper from "react-native-swiper";
import CustomCalendar from "../../../components/ui/CustomCalendar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getToken } from "../../../utils/auth";
import { getSessionsBookings } from "../../../services/Api";
import { showToast } from "../../../utils/Toaster";

const SessionBookings = () => {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Daily Pass");
  const [expandedSessions, setExpandedSessions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsData, setBookingsData] = useState(null);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Fetch bookings data
  useEffect(() => {
    fetchBookingsData();
  }, [selectedDate]);

  const fetchBookingsData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not available",
        });
        return;
      }

      // Format date as YYYY-MM-DD in Indian timezone (avoid UTC conversion)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const response = await getSessionsBookings(gymId, formattedDate);

      if (response?.status === 200) {
        setBookingsData(response.data);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Error fetching bookings",
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showToast({
        type: "error",
        title: "Error fetching bookings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push("/owner/bookings");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  // Calendar data from API response - map to expected format
  const calendarClientData =
    bookingsData?.next_30_days?.map((item) => ({
      expectedDate: item.date,
      expectedCount: item.total_expected_count,
    })) || [];

  // Get data from API response or use empty defaults
  const dailyPassData = bookingsData?.dailypass || { expectedCount: 0 };
  const personalTrainerSessions = bookingsData?.pt_sessions || [];
  const otherSessions = bookingsData?.all_sessions || [];

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatBookingDate = (dateString) => {
    const date = new Date(dateString);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();

    return `${dayName}, ${monthName} ${day}`;
  };

  const renderDailyPassContent = () => (
    <View style={styles.contentSection}>
      {/* Title and Total Count Card */}
      <View style={styles.headerCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Daily Pass</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {dailyPassData?.bookings?.length || 0} Bookings
            </Text>
            <Ionicons name="chevron-up" size={16} color="#007BFF" />
          </View>
        </View>
      </View>

      {/* Bookings List */}
      {!dailyPassData?.bookings || dailyPassData.bookings.length === 0 ? (
        <View style={styles.slotsCard}>
          <Text style={styles.noBookingsText}>No bookings for this date</Text>
        </View>
      ) : (
        <View style={styles.bookingsListContainer}>
          {dailyPassData.bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingItemCard}>
              <View style={styles.bookingItemLeft}>
                {booking.dp ? (
                  <Image
                    source={{ uri: booking.dp }}
                    style={styles.bookingAvatar}
                  />
                ) : (
                  <View style={[styles.bookingAvatar, styles.defaultAvatar]}>
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingNameRow}>
                    <Text
                      style={styles.bookingName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {booking.name}
                    </Text>
                    {booking.headcount > 1 && (
                      <View style={styles.groupPassBadge}>
                        <Ionicons name="people" size={12} color="#007BFF" />
                        <Text style={styles.groupPassText}>Group Pass</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.bookingDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.bookingDate}>
                      {formatBookingDate(booking.created_at)} (Booked on)
                    </Text>
                  </View>
                  {booking.pack_label ? (
                    <View style={styles.packLabelRow}>
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color="#10B981"
                      />
                      <Text style={styles.packLabelText}>
                        {booking.pack_label}
                      </Text>
                    </View>
                  ) : null}
                  {booking.headcount > 1 && (
                    <View style={styles.headcountRow}>
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color="#007BFF"
                      />
                      <Text style={styles.headcountText}>
                        {booking.headcount} people
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.bookingItemRight}>
                <Text style={styles.bookingPrice}>₹{booking.price}</Text>
                {booking.is_cancelled && (
                  <View style={styles.cancelledBadge}>
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                    <Text style={styles.cancelledText}>Cancelled</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderPersonalTrainerContent = () => (
    <View style={styles.contentSection}>
      {/* Title and Total Count Card */}
      <View style={styles.headerCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>PT Sessions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {personalTrainerSessions.reduce(
                (sum, session) => sum + session.expectedCount,
                0,
              )}{" "}
              Bookings
            </Text>
            <Ionicons name="chevron-down" size={16} color="#007BFF" />
          </View>
        </View>
      </View>

      {/* Trainer Sessions List */}
      {personalTrainerSessions.length === 0 ? (
        <View style={styles.slotsCard}>
          <Text style={styles.noBookingsText}>
            No PT sessions booked for this date
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          {personalTrainerSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <TouchableOpacity
                style={styles.sessionHeader}
                onPress={() => toggleSessionExpansion(`trainer-${session.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeaderLeft}>
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.trainerAvatarText}>
                      {session.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.sessionName}>{session.name}</Text>
                </View>
                <View style={styles.sessionHeaderRight}>
                  <Text style={styles.sessionExpectedCount}>
                    {session.expectedCount} Bookings
                  </Text>
                  <Ionicons
                    name={
                      expandedSessions[`trainer-${session.id}`]
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#007BFF"
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded Content - Show bookings grouped by slot */}
              {expandedSessions[`trainer-${session.id}`] && (
                <View style={styles.expandedContent}>
                  {session.bookings && session.bookings.length > 0 ? (
                    <>
                      {/* Group bookings by time slot */}
                      {session.slots.map((slot, slotIdx) => {
                        const slotBookings = session.bookings.filter(
                          (booking) => booking.time === slot.time,
                        );

                        if (slotBookings.length === 0) return null;

                        return (
                          <View key={slotIdx} style={styles.slotSection}>
                            {slotBookings.map((booking) => (
                              <View
                                key={booking.booking_id}
                                style={styles.sessionBookingCard}
                              >
                                <View style={styles.bookingItemLeft}>
                                  {booking.dp ? (
                                    <Image
                                      source={{ uri: booking.dp }}
                                      style={styles.bookingAvatar}
                                    />
                                  ) : (
                                    <View
                                      style={[
                                        styles.bookingAvatar,
                                        styles.defaultAvatar,
                                      ]}
                                    >
                                      <Ionicons
                                        name="person"
                                        size={24}
                                        color="#9CA3AF"
                                      />
                                    </View>
                                  )}
                                  <View style={styles.bookingInfo}>
                                    <Text style={styles.bookingName}>
                                      {booking.name}
                                    </Text>
                                    <View style={styles.bookingDateRow}>
                                      <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color="#6B7280"
                                      />
                                      <Text style={styles.bookingDate}>
                                        {formatBookingDate(booking.created_at)}{" "}
                                        (Booked on)
                                      </Text>
                                    </View>
                                    {booking.pack_label ? (
                                      <View style={styles.packLabelRow}>
                                        <Ionicons
                                          name="pricetag-outline"
                                          size={14}
                                          color="#10B981"
                                        />
                                        <Text style={styles.packLabelText}>
                                          {booking.pack_label}
                                        </Text>
                                      </View>
                                    ) : null}
                                    <View style={styles.bookingSlotRow}>
                                      <Ionicons
                                        name="time-outline"
                                        size={14}
                                        color="#007BFF"
                                      />
                                      <Text style={styles.bookingSlot}>
                                        {slot.time}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                <Text style={styles.bookingPrice}>
                                  ₹{booking.price}
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </>
                  ) : (
                    <Text style={styles.noBookingsText}>
                      No bookings available
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Check if offers are enabled (from view_bookings API - new_offer table)
  const isDailyPassEnabled = bookingsData?.dailypass_offer?.is_enabled || false;
  const isSessionEnabled = bookingsData?.session_offer?.is_enabled || false;

  // Get remaining counts from API, hardcode the rest
  const dailyPassRemainingCount =
    bookingsData?.dailypass_offer?.remaining_count || 0;
  const sessionRemainingCount =
    bookingsData?.session_offer?.remaining_count || 0;

  // Hardcoded values
  const TOTAL_PASS_COUNT = 50;
  const DAILYPASS_PRICE = 49;
  const SESSION_PRICE = 99;

  // Calculate progress percentages
  const dailyPassProgress = (dailyPassRemainingCount / TOTAL_PASS_COUNT) * 100;
  const sessionProgress = (sessionRemainingCount / TOTAL_PASS_COUNT) * 100;

  // Render Daily Pass Card
  const renderDailyPassCard = () => (
    <View style={styles.offerCard}>
      <View style={styles.offerCardHeader}>
        <Text style={responsiveStyles.offerCardTitle}>Daily Gym Pass</Text>
        <View style={styles.offerCardPriceContainer}>
          <MaskedView
            maskElement={
              <Text style={responsiveStyles.offerCardPriceMask}>
                ₹{DAILYPASS_PRICE}
              </Text>
            }
          >
            <LinearGradient
              colors={["#FF6900", "#C6262C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text
                style={[responsiveStyles.offerCardPriceMask, { opacity: 0 }]}
              >
                ₹{DAILYPASS_PRICE}
              </Text>
            </LinearGradient>
          </MaskedView>
          <Text style={responsiveStyles.offerCardPriceUnit}>/day</Text>
        </View>
      </View>

      <View style={styles.passCountContainer}>
        <Text style={responsiveStyles.passCountMain}>
          {dailyPassRemainingCount}
        </Text>
        <Text style={responsiveStyles.passCountDivider}>
          {" "}
          / {TOTAL_PASS_COUNT} passes remaining
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={["#0154A0", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${dailyPassProgress}%` }]}
          />
        </View>
      </View>

      <Text style={responsiveStyles.offerCardDescription}>
        Limited offer for the first {TOTAL_PASS_COUNT} users. Every new user
        booking reduces the pass count
      </Text>
    </View>
  );

  // Render Session Booking Card
  const renderSessionCard = () => (
    <View style={styles.offerCard}>
      <View style={styles.offerCardHeader}>
        <Text style={responsiveStyles.offerCardTitle}>
          Fitness Class Booking
        </Text>
        <View style={styles.offerCardPriceContainer}>
          <MaskedView
            maskElement={
              <Text style={responsiveStyles.offerCardPriceMask}>
                ₹{SESSION_PRICE}
              </Text>
            }
          >
            <LinearGradient
              colors={["#FF6900", "#C6262C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text
                style={[responsiveStyles.offerCardPriceMask, { opacity: 0 }]}
              >
                ₹{SESSION_PRICE}
              </Text>
            </LinearGradient>
          </MaskedView>
          <Text style={responsiveStyles.offerCardPriceUnit}>/Per Class</Text>
        </View>
      </View>

      <View style={styles.passCountContainer}>
        <Text style={responsiveStyles.passCountMain}>
          {sessionRemainingCount}
        </Text>
        <Text style={responsiveStyles.passCountDivider}>
          {" "}
          / {TOTAL_PASS_COUNT} passes remaining
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={["#0154A0", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${sessionProgress}%` }]}
          />
        </View>
      </View>

      <Text style={responsiveStyles.offerCardDescription}>
        Limited offer for the first {TOTAL_PASS_COUNT} users. Every new user
        booking reduces the pass count
      </Text>
    </View>
  );

  // Render Offer Cards with conditional logic
  const renderOfferCards = () => {
    // If neither is enabled, don't render anything
    if (!isDailyPassEnabled && !isSessionEnabled) {
      return null;
    }

    // If both are enabled, show carousel
    if (isDailyPassEnabled && isSessionEnabled) {
      return (
        <View style={styles.carouselContainer}>
          <Swiper
            autoplay
            autoplayTimeout={4}
            showsPagination
            loop
            dotStyle={styles.swiperDot}
            activeDotStyle={styles.swiperActiveDot}
            paginationStyle={styles.swiperPagination}
          >
            <View style={styles.swiperSlide}>{renderDailyPassCard()}</View>
            <View style={styles.swiperSlide}>{renderSessionCard()}</View>
          </Swiper>
        </View>
      );
    }

    // If only daily pass is enabled
    if (isDailyPassEnabled) {
      return (
        <View style={styles.singleCardContainer}>{renderDailyPassCard()}</View>
      );
    }

    // If only session is enabled
    if (isSessionEnabled) {
      return (
        <View style={styles.singleCardContainer}>{renderSessionCard()}</View>
      );
    }

    return null;
  };

  const renderOtherSessionsContent = () => (
    <View style={styles.contentSection}>
      {/* Title and Total Count Card */}
      <View style={styles.headerCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>All Fitness Classes</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {otherSessions.reduce(
                (sum, session) => sum + session.expectedCount,
                0,
              )}{" "}
              Bookings
            </Text>
            <Ionicons name="chevron-down" size={16} color="#007BFF" />
          </View>
        </View>
      </View>

      {/* Other Sessions List */}
      {otherSessions.length === 0 ? (
        <View style={styles.slotsCard}>
          <Text style={styles.noBookingsText}>
            No Fitness Classes booked for this date
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          {otherSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <TouchableOpacity
                style={styles.sessionHeader}
                onPress={() => toggleSessionExpansion(`other-${session.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeaderLeft}>
                  <View style={styles.sessionIconContainer}>
                    {session.icon && session.icon.startsWith("http") ? (
                      <Image
                        source={{ uri: session.icon }}
                        style={styles.sessionIconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.sessionIconText}>
                        {session.icon || "🏋️"}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.sessionName}>{session.name}</Text>
                </View>
                <View style={styles.sessionHeaderRight}>
                  <Text style={styles.sessionExpectedCount}>
                    {session.expectedCount} Bookings
                  </Text>
                  <Ionicons
                    name={
                      expandedSessions[`other-${session.id}`]
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#007BFF"
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded Content - Show bookings grouped by slot */}
              {expandedSessions[`other-${session.id}`] && (
                <View style={styles.expandedContent}>
                  {session.bookings && session.bookings.length > 0 ? (
                    <>
                      {/* Group bookings by time slot */}
                      {session.slots.map((slot, slotIdx) => {
                        const slotBookings = session.bookings.filter(
                          (booking) => booking.time === slot.time,
                        );

                        if (slotBookings.length === 0) return null;

                        return (
                          <View key={slotIdx} style={styles.slotSection}>
                            {slotBookings.map((booking) => (
                              <View
                                key={booking.booking_id}
                                style={styles.sessionBookingCard}
                              >
                                <View style={styles.bookingItemLeft}>
                                  {booking.dp ? (
                                    <Image
                                      source={{ uri: booking.dp }}
                                      style={styles.bookingAvatar}
                                    />
                                  ) : (
                                    <View
                                      style={[
                                        styles.bookingAvatar,
                                        styles.defaultAvatar,
                                      ]}
                                    >
                                      <Ionicons
                                        name="person"
                                        size={24}
                                        color="#9CA3AF"
                                      />
                                    </View>
                                  )}
                                  <View style={styles.bookingInfo}>
                                    <Text style={styles.bookingName}>
                                      {booking.name}
                                    </Text>
                                    <View style={styles.bookingDateRow}>
                                      <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color="#6B7280"
                                      />
                                      <Text style={styles.bookingDate}>
                                        {formatBookingDate(booking.created_at)}{" "}
                                        (Booked on)
                                      </Text>
                                    </View>
                                    {booking.pack_label ? (
                                      <View style={styles.packLabelRow}>
                                        <Ionicons
                                          name="pricetag-outline"
                                          size={14}
                                          color="#10B981"
                                        />
                                        <Text style={styles.packLabelText}>
                                          {booking.pack_label}
                                        </Text>
                                      </View>
                                    ) : null}
                                    <View style={styles.bookingSlotRow}>
                                      <Ionicons
                                        name="time-outline"
                                        size={14}
                                        color="#007BFF"
                                      />
                                      <Text style={styles.bookingSlot}>
                                        {slot.time}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                <Text style={styles.bookingPrice}>
                                  ₹{booking.price}
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </>
                  ) : (
                    <Text style={styles.noBookingsText}>
                      No bookings available
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Responsive font sizes
  const responsiveFontSize = (baseSize, smallSize = null) => {
    if (smallSize && screenWidth < 380) return smallSize;
    if (screenWidth < 380) return baseSize * 0.85;
    return baseSize;
  };

  const getResponsiveStyles = () => ({
    passCountMain: {
      fontSize: responsiveFontSize(30, 24),
      fontWeight: "700",
      color: "#1F2937",
    },
    passCountDivider: {
      fontSize: responsiveFontSize(20, 16),
      fontWeight: "500",
      color: "#6B7280",
    },
    offerCardTitle: {
      fontSize: responsiveFontSize(18, 16),
      fontWeight: "700",
      color: "#1F2937",
    },
    offerCardPriceMask: {
      fontSize: responsiveFontSize(32, 28),
      fontWeight: "700",
    },
    offerCardPriceUnit: {
      fontSize: responsiveFontSize(14, 12),
      fontWeight: "500",
      color: "#C6262C",
    },
    offerCardDescription: {
      fontSize: responsiveFontSize(12, 11),
      fontWeight: "400",
      color: "#6B7280",
      textAlign: "center",
      lineHeight: responsiveFontSize(15, 14),
    },
  });

  const responsiveStyles = getResponsiveStyles();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 5 }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/bookings")}
        text="Daily Pass & Fitness Classes Bookings"
      />

      <ScrollView style={styles.scrollView} nestedScrollEnabled>
        {/* Offer Cards - Conditional Rendering */}
        {renderOfferCards()}

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            clientData={calendarClientData}
          />
        </View>

        {/* Selected Date and Today's Expected Count */}
        <View style={styles.topCardsContainer}>
          <View style={styles.topCard}>
            <Text style={styles.topCardLabel}>Selected Date</Text>
            <Text style={styles.topCardValue}>{formatSelectedDate()}</Text>
          </View>
          <View style={styles.topCard}>
            <Text style={styles.topCardLabel}>Today's Bookings</Text>
            <Text style={styles.topCardValue}>
              {bookingsData?.total_expected_count || 0} Bookings
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {["Daily Pass", "PT Sessions", "All Classes"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
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
                <View style={styles.inactiveTab}>
                  <Text style={styles.inactiveTabText}>{tab}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loaderText}>Loading bookings...</Text>
          </View>
        ) : (
          <>
            {/* Content based on active tab */}
            {activeTab === "Daily Pass" && renderDailyPassContent()}
            {activeTab === "PT Sessions" && renderPersonalTrainerContent()}
            {activeTab === "All Classes" && renderOtherSessionsContent()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SessionBookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  calendarContainer: {
    marginTop: 8,
    marginBottom: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeTabText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  inactiveTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  topCardsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  topCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  topCardLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  topCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
  },
  contentSection: {
    marginBottom: 20,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  slotsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007BFF",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  bookingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dailyPassBookingCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "31%",
    paddingHorizontal: 8,
  },
  bookingTime: {
    fontSize: 10,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 4,
    textAlign: "center",
  },
  bookingCount: {
    fontSize: 10,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
  },
  sessionsContainer: {
    gap: 12,
    paddingBottom: 150,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trainerAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sessionIconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  sessionIconImage: {
    width: 50,
    height: 50,
  },
  sessionIconText: {
    fontSize: 20,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  sessionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionExpectedCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007BFF",
  },
  expandedContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  expandedDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  noBookingsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007BFF",
  },
  bookingsListContainer: {
    gap: 12,
    paddingBottom: 150,
  },
  bookingItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  bookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
  },
  defaultAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  bookingInfo: {
    flex: 1,
  },
  bookingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flexShrink: 1,
  },
  groupPassBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  groupPassText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#007BFF",
  },
  headcountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  headcountText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007BFF",
  },
  bookingDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  packLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  packLabelText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#10B981",
  },
  bookingDate: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
  },
  bookingItemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  cancelledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EF4444",
  },
  slotSection: {
    marginBottom: 8,
  },
  bookingSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  bookingSlot: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007BFF",
  },
  sessionBookingCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  // Offer Cards Styles
  carouselContainer: {
    height: 210,
    marginVertical: 10,
  },
  swiperSlide: {
    flex: 1,
    paddingHorizontal: 2,
    paddingBottom: 25,
  },
  swiperDot: {
    backgroundColor: "#E5E7EB",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  swiperActiveDot: {
    backgroundColor: "#0154A0",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  swiperPagination: {
    bottom: 0,
  },
  singleCardContainer: {
    marginVertical: 10,
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  offerCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  offerCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  offerCardPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  offerCardPriceMask: {
    fontSize: 32,
    fontWeight: "700",
  },
  offerCardPriceUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C6262C",
  },
  passCountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  passCountMain: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1F2937",
  },
  passCountDivider: {
    fontSize: 20,
    fontWeight: "500",
    color: "#6B7280",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  offerCardDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 15,
  },
});
