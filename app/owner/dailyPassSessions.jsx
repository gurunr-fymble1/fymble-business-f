import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  act,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import MembershipPTSkeleton from "../../components/ui/loaders/membershipPTSkeleton";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import SummaryCard from "../../components/home/finances/SummaryCard";
import CustomDropdown from "../../components/ui/CustomDropdown";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { getGymRevenueAPI, getAvailableSessionsAPI } from "../../services/Api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import HomeSkeleton from "../../components/ui/loaders/homeSkeleton";

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
  },
);

const DailyPassSessions = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [sessions, setSessions] = useState([]);
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

  // Fetch available sessions
  const fetchSessions = useCallback(async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        setIsLoading(false);
        return;
      }
      const response = await getAvailableSessionsAPI(gymId);
      if (response?.status === 200) {
        const activeSessions = response.data.filter(
          (session) => session.isActive,
        );

        setSessions(activeSessions);

        // If preSelectedSession is passed from QR scan, set it
        if (params?.preSelectedSession) {
          const sessionIdFromParam = parseInt(params.preSelectedSession);
          const preSelected = activeSessions.find(
            (s) => s.id === sessionIdFromParam,
          );
          if (preSelected) {
            setSelectedSession(preSelected?.id);
            setSelectedMode(preSelected?.internal);
          } else {
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setIsLoading(false);
    }
  }, [params?.preSelectedSession]);

  const fetchClients = useCallback(async () => {
    if (!selectedSession || !selectedMode) {
      setClients([]);
      setFilteredClients([]);
      setMonthlyCollection(0);
      setMonthlyUsers(0);
      setIsLoading(false);
      return;
    }

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

      // Fetch revenue data for sessions
      const data = await getGymRevenueAPI(
        gymId,
        selectedMode,
        monthNumber,
        selectedYear,
        selectedSession,
      );

      if (!data || data.status !== 200) {
        throw new Error("Failed to fetch clients");
      }

      // Map backend response to frontend structure
      const mappedClients = data.rows.map((row) => ({
        id: row.id,
        name: row.client_name || "Unknown",
        planName: row.plan_name || "",
        packLabel: row.pack_label || "",
        profile: "https://via.placeholder.com/40",
        paymentStatus: row.status.toLowerCase(),
        amount: row.amount,
        date: row.date,
        sessionName: row.session_name || "",
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
  }, [selectedSession, selectedMode, selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        const role = await getToken("role");
        setUserRole(role);
        await fetchSessions();
      };
      initializeData();

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
        },
      );

      return () => backHandler.remove();
    }, [fetchSessions, userRole]),
  );

  useEffect(() => {
    if (selectedSession && selectedMode) {
      fetchClients();
    }
  }, [fetchClients, selectedSession, selectedMode]);

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
              client.planName.toLowerCase().includes(query.toLowerCase())),
        );
        setFilteredClients(filtered);
      }
    },
    [clients],
  );

  const handleSessionChange = (sessionOption) => {
    // CustomDropdown passes the entire option object, extract the value
    const sessionId =
      typeof sessionOption === "object" ? sessionOption.value : sessionOption;

    // Find the selected session and get its mode
    const selectedSessionData = sessions.find((s) => s.id === sessionId);
    if (selectedSessionData) {
      setSelectedSession(sessionId);
      setSelectedMode(selectedSessionData?.internal);
    }
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
      case "awaiting settlement":
        return "#F59E0B";
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
      case "awaiting settlement":
        return "Pending Settlement";
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
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{item.name}</Text>
              {item.packLabel ? (
                <Text style={styles.packLabelText}>{item.packLabel}</Text>
              ) : null}
            </View>
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
            {/* <View style={styles.detailItem}>
              <Text style={styles.detailText}>{item.sessionName}</Text>
            </View> */}
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
    [],
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
    [monthlyCollection, monthlyUsers],
  );

  const sessionOptions = sessions.map((session) => ({
    label: session.name,
    value: session.id,
  }));

  const EmptyMessage = useMemo(() => {
    if (!selectedSession) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="list-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateTitle}>Select a Type</Text>
          <Text style={styles.emptyStateSubtitle}>
            Choose a type from the dropdown to view earnings and clients data
            for that category.
          </Text>
        </View>
      );
    }
    if (filteredClients.length === 0) {
      return (
        <Text style={styles.noResults}>No clients found for this type.</Text>
      );
    }
    return null;
  }, [filteredClients.length, selectedSession]);

  if (isLoading && sessions.length === 0) {
    return <MembershipPTSkeleton priority="high" />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <NewOwnerHeader
        text="Daily Pass & Fitness Classes"
        onBackButtonPress={() =>
          router.push(userRole !== "owner" ? "/owner/home" : "/owner/earnings")
        }
      />

      {/* Dropdown for Sessions */}
      <View style={styles.dropdownContainer}>
        <CustomDropdown
          label="Select Type"
          placeholder="Choose a type"
          value={selectedSession}
          onChange={handleSessionChange}
          options={sessionOptions}
        />
      </View>

      {/* Search Bar with Month Picker */}
      {selectedSession && (
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
      )}

      {/* Client List */}
      <View style={styles.contentContainer}>
        {/* Monthly Stats - Only show for owner and when session is selected */}
        {userRole === "owner" && selectedSession && MonthlyStatsCards}

        {isLoading && selectedSession ? (
          <View style={styles.loaderContainer}>
            <HomeSkeleton />
          </View>
        ) : (
          <Animated.FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderClientRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={EmptyMessage}
          />
        )}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  searchBarContainer: {
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
    fontSize: 16,
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  packLabelText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
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

export default DailyPassSessions;
