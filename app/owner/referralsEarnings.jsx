import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Image,
  Animated,
  Share,
} from "react-native";
import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import MembershipPTSkeleton from "../../components/ui/loaders/membershipPTSkeleton";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import SummaryCard from "../../components/home/finances/SummaryCard";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { getGymReferralsAPI } from "../../services/Api";

const { width, height } = Dimensions.get("window");

const ReferralsEarnings = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);
  const [isMonthSelectorVisible, setIsMonthSelectorVisible] = useState(false);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [monthlyUsers, setMonthlyUsers] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [referralCode, setReferralCode] = useState("");

  // Initialize month and year
  useEffect(() => {
    const currentDate = new Date();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (!selectedMonth) {
      setSelectedMonth(months[currentDate.getMonth()]);
    }
    if (!selectedYear) {
      setSelectedYear(currentDate.getFullYear());
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const ownerID = await getToken("owner_id");

      if (!ownerID) {
        showToast({
          type: "error",
          title: "Authentication error",
        });
        return;
      }

      // Fetch referral data
      const response = await getGymReferralsAPI(ownerID);

      if (!response || response.status !== 200) {
        throw new Error("Failed to fetch referral data");
      }

      const data = response.data;

      // Update referral code
      if (data.referral_code) {
        setReferralCode(data.referral_code);
      }

      // Set totals
      setMonthlyCollection(data.total_cash || 0);
      setMonthlyUsers(data.total_count || 0);

      // Map monthly_data to clients list
      const mappedClients =
        data.monthly_data?.map((monthData, index) => ({
          id: index,
          name: monthData.month_year,
          planName: "Referral Earnings",
          profile: "https://via.placeholder.com/40",
          paymentStatus: monthData.status.replace(" ", "_").toLowerCase(),
          amount: monthData.cash,
          date: monthData.month_year,
          planType: "Referral",
        })) || [];

      setClients(mappedClients);
      setFilteredClients(mappedClients);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      showToast({
        type: "error",
        title: "Error fetching referral data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        const role = await getToken("role");
        setUserRole(role);
      };
      initializeData();
      fetchClients();
    }, [fetchClients]),
  );

  const handleShareReferral = async () => {
    try {
      const message = `Join Fymble Business and grow your gym!

Use my referral code *${referralCode}* to get started.

📱 Download Fymble Business:
Android: https://play.google.com/store/apps/details?id=com.fittbot.fittbot_business&hl=en
iOS: https://apps.apple.com/in/app/fittbot-business/id6747059115`;

      await Share.share({
        message: message,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to share referral code",
      });
    }
  };

  const handleMonthYearApply = (monthName, yearNumber) => {
    // Update state with the new values from modal
    setSelectedMonth(monthName);
    setSelectedYear(yearNumber);
    setIsMonthSelectorVisible(false);
    // fetchClients will be called automatically via the useEffect dependency
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#10B981"; // Green
      case "deposited":
        return "#10B981";
      case "initiated":
        return "#F59E0B"; // Yellow
      case "pending":
        return "#EF4444"; // Red
      case "not_initiated":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "initiated":
        return "Initiated";
      case "pending":
        return "Pending";
      case "not_initiated":
        return "Not Initiated";
      case "deposited":
        return "Deposited";
      default:
        return status;
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderClientRow = useCallback(
    ({ item }) => (
      <View style={styles.clientCard}>
        <View style={styles.clientInfo}>
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{item.name}</Text>
            <View
              style={[
                styles.paymentTag,
                { backgroundColor: getPaymentStatusColor(item.paymentStatus) },
              ]}
            >
              <Text style={styles.paymentTagText}>
                {getPaymentStatusText(item.paymentStatus)}
              </Text>
            </View>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.amountText}>₹{item.amount}</Text>
          </View>
        </View>
      </View>
    ),
    [],
  );

  const MonthlyStatsCards = useMemo(
    () => (
      <View style={styles.statsContainer}>
        <SummaryCard
          title="Total Earnings"
          amount={monthlyCollection || 0}
          icon="receipt"
          iconColor="#00A389"
          iconBgColor="#FFFFFF"
          rightImage={require("../../assets/images/finances/collection.png")}
        />
        <SummaryCard
          title="Total Referrals"
          amount={monthlyUsers || 0}
          icon="people"
          iconColor="#4A90E2"
          iconBgColor="#FFFFFF"
          rightImage={require("../../assets/images/client/people.png")}
          width={true}
          isAmount={false}
        />
      </View>
    ),
    [monthlyCollection, monthlyUsers],
  );

  const EmptyMessage = useMemo(() => {
    if (filteredClients.length === 0) {
      return <Text style={styles.noResults}>No referral clients found.</Text>;
    }
    return null;
  }, [filteredClients.length]);

  if (isLoading) {
    return <MembershipPTSkeleton priority="high" />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Referrals & Earnings</Text>
      </View>

      {/* Referral Code Section */}
      <View style={styles.referralCard}>
        <Text style={styles.referralTitle}>My Referral Code</Text>
        <View style={styles.referralContainer}>
          <View style={styles.referralCodeBox}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareReferral}
          >
            <Ionicons name="paper-plane" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 16,
          }}
        >
          Share this code with other gym owners to earn ₹1000 for each
          successful referral.
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "#FF5757",
            lineHeight: 16,
          }}
        >
          Amount will only be credited after atleast 10 of the referred gym's
          clients subscribe to Fymble Premium.
        </Text>
      </View>

      {/* Client List */}
      <View style={styles.contentContainer}>
        {/* Monthly Stats - Only show for owner */}
        {userRole === "owner" && MonthlyStatsCards}

        <Animated.FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClientRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          ListHeaderComponent={EmptyMessage}
        />
      </View>

      {/* Month Selector Modal */}
      <MonthSelectorModal
        visible={isMonthSelectorVisible}
        onClose={() => setIsMonthSelectorVisible(false)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectMonth={setSelectedMonth}
        onSelectYear={setSelectedYear}
        handleApply={handleMonthYearApply}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingBottom: 0,
    gap: 12,
  },
  searchBarContainer: {
    backgroundColor: "#F9FAFB",
    marginTop: 12,
  },
  contentContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
    fontSize: 16,
    paddingHorizontal: 16,
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  paymentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  paymentTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 0,
  },
  planInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "500",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  referralCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  referralContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#0891B2",
  },
  referralCodeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0891B2",
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: "#0891B2",
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

const searchBarStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
    height: 40,
  },
  monthPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthPickerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginRight: 4,
  },
});

export default ReferralsEarnings;
