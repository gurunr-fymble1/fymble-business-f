import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { getUpcomingBookingsAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";

const { width } = Dimensions.get("window");

const MembershipBookings = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("membership");
  const tabScrollRef = useRef(null);
  const [bookingsData, setBookingsData] = useState({});
  const [totalBookings, setTotalBookings] = useState(0);

  const tabs = [
    { id: "membership", label: "Individual" },
    { id: "couple_membership", label: "Couple" },
    { id: "buddy_membership", label: "Buddy" },
    { id: "pt", label: "Individual PT" },
    { id: "couple_pt", label: "Couple PT" },
    { id: "buddy_pt", label: "Buddy PT" },
  ];

  const getBookingsForTab = () => {
    return bookingsData[activeTab] || [];
  };

  const getTotalBookingsCount = () => {
    return totalBookings;
  };

  const hasBookingsForTab = (tabId) => {
    return bookingsData[tabId] && bookingsData[tabId].length > 0;
  };

  const categorizeBookings = (data) => {
    const categorized = {
      membership: [],
      couple_membership: [],
      buddy_membership: [],
      pt: [],
      couple_pt: [],
      buddy_pt: [],
    };

    data.forEach((item) => {
      // Skip if client is null
      if (!item.client) return;

      const { client, plan, id } = item;
      const { plan_for, personal_training, duration, booking_date } = plan;

      // Create booking object
      const booking = {
        id: id,
        name: client.name,
        phone: client.contact,
        duration: `${duration} ${duration === 1 ? "Month" : "Months"}`,
        avatar: client.dp,
        client_id: client.client_id,
        bookingDate: booking_date,
      };

      // Categorize based on plan_for and personal_training
      if (personal_training) {
        if (plan_for === "individual") {
          categorized.pt.push(booking);
        } else if (plan_for === "couple") {
          categorized.couple_pt.push(booking);
        } else if (plan_for === "buddy") {
          categorized.buddy_pt.push(booking);
        }
      } else {
        if (plan_for === "individual") {
          categorized.membership.push(booking);
        } else if (plan_for === "couple") {
          categorized.couple_membership.push(booking);
        } else if (plan_for === "buddy") {
          categorized.buddy_membership.push(booking);
        }
      }
    });

    return categorized;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const handleCallPress = (phone) => {
    const phoneNumber = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const fetchUpcomingBookings = async () => {
    try {
      const gym_id = await getToken("gym_id");
      const response = await getUpcomingBookingsAPI(gym_id);

      if (response?.status === 200) {
        setTotalBookings(response?.total_bookings || 0);
        const categorized = categorizeBookings(response?.data || []);
        setBookingsData(categorized);
      }
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
    }
  };

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/owner/bookings" enabled={true} />
      <NewOwnerHeader
        text="Upcoming Bookings"
        onBackButtonPress={() => router.push("/owner/bookings")}
      />

      {/* Total Bookings Count */}
      <View style={styles.totalBookingsContainer}>
        <Text style={styles.totalBookingsText}>
          Total Bookings:{" "}
          <Text style={styles.totalBookingsCount}>
            {getTotalBookingsCount()}
          </Text>
        </Text>
      </View>

      {/* Tabs Section */}
      <View style={styles.tabsSection}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.id);
                // Auto-scroll to keep selected tab visible
                const tabWidth = 120;
                let scrollX = 0;

                if (index === 0) {
                  scrollX = 0;
                } else if (index >= tabs.length - 2) {
                  scrollX = (tabs.length - 3) * tabWidth;
                } else {
                  scrollX = (index - 1) * tabWidth;
                }

                tabScrollRef.current?.scrollTo({
                  x: Math.max(0, scrollX),
                  animated: true,
                });
              }}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {hasBookingsForTab(tab.id) && <View style={styles.tabDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {tabs.map((tab) => (
            <View
              key={tab.id}
              style={[
                styles.paginationDot,
                activeTab === tab.id && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.bookingsContainer}>
          {getBookingsForTab().length > 0 ? (
            getBookingsForTab().map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingCardContent}>
                  <Image
                    source={{ uri: booking.avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingName}>{booking.name}</Text>
                    <Text style={styles.bookingPlan}>
                      Plan: {booking.duration}
                    </Text>
                    <Text style={styles.bookingDate}>
                      Booked on: {formatDate(booking.bookingDate)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallPress(booking.phone)}
                  >
                    <Ionicons name="call" size={20} color="#0078FF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No bookings for this category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  totalBookingsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalBookingsText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  totalBookingsCount: {
    fontSize: 16,
    color: "#0078FF",
    fontWeight: "700",
  },
  tabsSection: {
    paddingVertical: 12,
    paddingBottom: 4,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  tabsScrollContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    minWidth: 100,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#E8F4FD",
    borderColor: "#0078FF",
    borderWidth: 2,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#0078FF",
    fontWeight: "600",
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0078FF",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  paginationDotActive: {
    backgroundColor: "#0078FF",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bookingsContainer: {
    paddingTop: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  bookingCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  bookingPlan: {
    fontSize: 14,
    color: "#0078FF",
    marginBottom: 4,
    fontWeight: "600",
  },
  bookingDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3D9FF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default MembershipBookings;
