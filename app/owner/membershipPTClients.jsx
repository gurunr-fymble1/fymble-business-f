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
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import MembershipPTSkeleton from "../../components/ui/loaders/membershipPTSkeleton";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import SummaryCard from "../../components/home/finances/SummaryCard";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { getGymRevenueAPI } from "../../services/Api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const SearchBar = React.memo(
  ({ onPress, onChange, query, selectedMonth, selectedYear }) => {
    const searchInputRef = useRef(null);

    return (
      <View style={searchBarStyles.searchContainer}>
        <View style={searchBarStyles.searchBar}>
          <Ionicons name="search-outline" size={18} color={"#666"} />
          <TextInput
            ref={searchInputRef}
            style={searchBarStyles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="#666"
            onChangeText={onChange}
            value={query}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          onPress={onPress}
          style={searchBarStyles.monthPickerButton}
        >
          <Text style={searchBarStyles.monthPickerText}>
            {selectedMonth?.slice(0, 3)} {selectedYear}
          </Text>
          <Ionicons name="calendar-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  }
);

const MembershipPTClientsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Gym Membership");
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);
  const [isMonthSelectorVisible, setIsMonthSelectorVisible] = useState(false);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [monthlyUsers, setMonthlyUsers] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const insets = useSafeAreaInsets();
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
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Authentication error",
        });
        return;
      }

      // Get month and year for the API call
      const monthNumber =
        [
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
        ].indexOf(selectedMonth) + 1;

      // Determine mode based on active tab
      const mode =
        activeTab === "Gym Membership" ? "membership" : "pt_subscription";

      // Fetch revenue data based on tab
      const data = await getGymRevenueAPI(
        gymId,
        mode,
        monthNumber,
        selectedYear
      );

      if (!data || data.status !== 200) {
        throw new Error("Failed to fetch clients");
      }

      // Map backend response to frontend structure
      const mappedClients = data.rows.map((row) => ({
        id: row.id,
        name: row.client_name || "Unknown",
        planName: row.plan_name || "",
        profile: "https://via.placeholder.com/40",
        paymentStatus: row.status.toLowerCase(),
        amount: row.amount,
        date: row.date,
        planType: activeTab,
        planName: row.plan_name || activeTab,
        entitlement_id: row.entitlement_id,
        payment_id: row.payment_id,
        order_id: row.order_id,
        mode: row.mode,
      }));

      setClients(mappedClients);
      setFilteredClients(mappedClients);

      setMonthlyCollection(data.revenue);
      setMonthlyUsers(data.total_users);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showToast({
        type: "error",
        title: "Error fetching clients",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        const role = await getToken("role");
        setUserRole(role);
      };
      initializeData();
      fetchClients();

      // Handle hardware back button
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (userRole !== "owner") {
            router.push("/owner/home");
          } else {
            router.push("/owner/earnings");
          }
          return true;
        }
      );

      return () => backHandler.remove();
    }, [fetchClients, userRole])
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);

      if (query.trim() === "") {
        setFilteredClients(clients);
      } else {
        const filtered = clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            (client.planName &&
              client.planName.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredClients(filtered);
      }
    },
    [clients]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
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
        <View style={styles.clientAvatar}>
          <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.clientInfo}>
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{item.name}</Text>
            <View
              style={[
                styles.paymentTag,
                {
                  backgroundColor: getPaymentStatusColor(item.paymentStatus),
                },
              ]}
            >
              <Text style={styles.paymentTagText}>
                {getPaymentStatusText(item.paymentStatus)}
              </Text>
            </View>
          </View>
          <View style={styles.clientDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{item.planName}</Text>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome5 name="calendar-alt" size={12} color="#666" />
              <Text style={[styles.detailText, { marginLeft: 4 }]}>
                {item.date}
              </Text>
            </View>
            <Text style={styles.amountText}>₹{item.amount}</Text>
          </View>
        </View>
      </View>
    ),
    []
  );

  const MonthlyStatsCards = useMemo(
    () => (
      <View style={styles.statsContainer}>
        <SummaryCard
          title="Total Collection"
          amount={monthlyCollection || 0}
          icon="receipt"
          iconColor="#00A389"
          iconBgColor="#FFFFFF"
          rightImage={require("../../assets/images/finances/collection.png")}
        />
        <SummaryCard
          title="Total Users"
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
    [monthlyCollection, monthlyUsers]
  );

  const TabSelector = useMemo(
    () => (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange("Gym Membership")}
        >
          {activeTab === "Gym Membership" ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTabGradient}
            >
              <Text style={styles.activeTabText}>Gym Membership</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTab}>
              <Text style={styles.tabText}>Gym Membership</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange("PT Subscription")}
        >
          {activeTab === "PT Subscription" ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTabGradient}
            >
              <Text style={styles.activeTabText}>PT Subscription</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTab}>
              <Text style={styles.tabText}>PT Subscription</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    ),
    [activeTab]
  );

  const EmptyMessage = useMemo(() => {
    if (filteredClients.length === 0) {
      return (
        <Text style={styles.noResults}>
          No {activeTab.toLowerCase()} clients found.
        </Text>
      );
    }
    return null;
  }, [filteredClients.length, activeTab]);

  if (isLoading) {
    return <MembershipPTSkeleton priority="high" />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(userRole !== "owner" ? "/owner/home" : "/owner/earnings")}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership & PT Clients</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      {TabSelector}

      {/* Search Bar with Month Picker */}
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search clients..."
          onChange={handleSearch}
          query={searchQuery}
          onPress={() => setIsMonthSelectorVisible(true)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    justifyContent: "space-between",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    marginTop: 15,
    gap: 12,
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
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchBarContainer: {
    backgroundColor: "#F9FAFB",
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

export default MembershipPTClientsPage;
