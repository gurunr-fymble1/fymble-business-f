import {
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { exportClientsToExcel } from "../../../components/client/excelUtils";
import FeeDetailsModal from "../../../components/client/FeeDetailsModal";
import FeeStatusModal from "../../../components/client/FeeStatusModal";
import ReceiptModal from "../../../components/client/Receipt";
import { paymentOptions } from "../../../components/home/data";
import FilterModal from "../../../components/home/newbies/FilterModal";

import HeaderComponent from "../../../components/ui/Header/HeaderComponent";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import MenuItems from "../../../components/ui/Header/tabs";
import { useNavigation } from "../../../context/NavigationContext";
import {
  deleteFeeStatusAPI,
  getTrainerAssignedClientsAPI,
  getFeeDetailsAPI,
  getPlansandBatchesAPI,
  getProfileDataAPI,
  updateFeeStatusAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { dateUtils } from "../../../utils/date";
import { showToast } from "../../../utils/Toaster";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import AllClientsSkeleton from "../../../components/ui/loaders/allClientsSkeleton";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;
const BOTTOM_NAV_HEIGHT = 80;

const gstTypeOptions = [
  { label: "Inclusive", value: "inclusive" },
  { label: "Exclusive", value: "exclusive" },
  { label: "No GST", value: "no_gst" },
];

const SearchBar = React.memo(({ onPress, onChange, query, placeholder }) => {
  const searchInputRef = useRef(null);

  return (
    <View style={searchBarStyles.searchContainer}>
      <View style={searchBarStyles.searchBar}>
        <Ionicons name="search-outline" size={18} color={"#666"} />
        <TextInput
          ref={searchInputRef}
          style={searchBarStyles.searchInput}
          placeholder="Search trainees..."
          placeholderTextColor="#666"
          onChangeText={onChange}
          value={query}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity onPress={onPress} style={searchBarStyles.filterButton}>
        <Ionicons size={20} name="filter-outline" />
      </TouchableOpacity>
    </View>
  );
});

const ClientListPage = () => {
  const { is_active } = useLocalSearchParams();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    batch: "",
    training: "",
    aim: "",
    feePaid: "",
  });

  const [activeFilter, setActiveFilter] = useState("trainees");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeDetailsModalVisible, setFeeDetailsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originalFee, setOriginalFee] = useState(0);
  const [discountedFee, setDiscountedFee] = useState(0);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");

  const [gstType, setGstType] = useState("no_gst");
  const [gstPercentage, setGstPercentage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showBadgeSummary, setShowBadgeSummary] = useState(false);
  const [activeTabHeader, setActiveTabHeader] = useState("Trainees");
  const tabScrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [gymName, setGymName] = useState("");
  const [gymData, setGymData] = useState(null);
  const router = useRouter();
  const flatListRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);
  const [role, setRole] = useState("trainer");
  const [trainerPermissions, setTrainerPermissions] = useState(false);

  useEffect(() => {
    if (is_active === "true") {
      setActiveFilter("Paid");
    } else {
      setActiveFilter("All Trainees");
    }
  }, [is_active]);

  const [profile, setProfile] = useState("");

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  const {
    panHandlers,
    SwipeIndicator,
    isSwipeActive,
    isEnabled: swipeEnabled,
    swipeAnimatedValue,
    resetSwipe,
    debug,
    temporarilyDisableSwipe,
  } = useEdgeSwipe({
    onSwipeComplete: toggleSideNav,
    isEnabled: true,
    isBlocked: isSideNavVisible,
    config: {
      edgeSwipeThreshold: 30,
      swipeMinDistance: 50,
      swipeMinVelocity: 0.3,
      preventIOSBackSwipe: true,
    },
  });

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const trainerId = await getToken("trainer_id");
      if (!gymId && !trainerId) {
        showToast({
          type: "error",
          title: "Gym Id or trainer Id not available",
        });
        return;
      }

      const response = await getTrainerAssignedClientsAPI(gymId, trainerId);
      if (response?.status === 200) {
        if (response?.trainer_permissions) {
          setTrainerPermissions(
            response.trainer_permissions.can_view_client_data,
          );
        }

        if (response?.gym_data) {
          setGymData(response.gym_data);
          setGymName(response.gym_data.name);
        }

        const data = response?.data.map((client, index) => ({
          id: client.client_id || index + 1,
          name: client.name || "N/A",
          age: client.age || "N/A",
          place: client.location || "N/A",
          batch: client.batch || "N/A",
          batch_id: client.batch_id || "N/A",
          training: client.training_type || "N/A",
          training_id: client.training_id || "N/A",
          feePaid: client.status === "active" ? "Paid" : "Not Paid",
          profile: client.profile || "",
          goal: client.goals || "N/A",
          contact: client.contact || "N/A",
          email: client.email || "N/A",
          lifestyle: client.lifestyle || "N/A",
          medical_issues: client.medical_issues || "N/A",
          bmi: client.bmi,
          joined_date: client.joined_date,
          gym_id: gymId,
          gym_client_id: client.gym_client_id || "",
          location: client.location || "",
          gender: client.gender || "",
          height: client.height || "N/A",
          weight: client.weight || "N/A",
          is_old_client: client.is_old_client || false,
          admission_number: client.admission_number || "",
          data_sharing: client.data_sharing || false,
          manual_client: client.manual_client || false,
          entry_type: client.entry_type || null,
        }));

        setClients(data);
        setFilteredClients(data);
        setIsLoading(false);
      } else if (response?.status === 201) {
        setClients([]);
        setFilteredClients([]);
        setIsLoading(false);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching clients",
      });
      setIsLoading(false);
    }
  }, []);

  const fetchPlansAndBatches = useCallback(async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);

      if (response?.status === 200) {
        setPlans(response.data.plans);
        setBatches(response.data.batches);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching plans and batches",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlansAndBatches();
      fetchClients();
      getToken("role").then((role) => {
        setRole(role);
      });
    }, [fetchPlansAndBatches, fetchClients]),
  );

  const getActiveTab = () => {
    return "Trainees";
  };

  const activeTab = getActiveTab();

  const handleHeaderTabChange = useCallback(
    (tab) => {
      setActiveTabHeader(tab);
      scrollY.setValue(0);
    },
    [scrollY],
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);

      const filterClients = () => {
        let filtered = clients;

        if (query.trim() !== "") {
          filtered = clients.filter(
            (client) =>
              (client.name &&
                client.name.toLowerCase().includes(query.toLowerCase())) ||
              (client.contact && client.contact.includes(query)),
          );
        }

        if (activeFilter === "Paid") {
          filtered = filtered.filter((client) => client.feePaid === "Paid");
        } else if (activeFilter === "Unpaid") {
          filtered = filtered.filter((client) => client.feePaid === "Not Paid");
        }

        if (filters.batch) {
          filtered = filtered.filter(
            (client) => client.batch_id === filters.batch,
          );
        }

        if (filters.training) {
          filtered = filtered.filter(
            (client) => client.training_id === filters.training,
          );
        }

        if (filters.aim) {
          filtered = filtered.filter((client) => client.goal === filters.aim);
        }

        setFilteredClients(filtered);
      };

      filterClients();
    },
    [clients, activeFilter, filters],
  );

  const applyStatusFilter = useCallback(
    (status) => {
      setActiveFilter(status);

      const query = searchQuery.trim();
      let filtered = clients;

      if (query !== "") {
        filtered = clients.filter(
          (client) =>
            (client.name &&
              client.name.toLowerCase().includes(query.toLowerCase())) ||
            (client.contact && client.contact.includes(query)),
        );
      }

      if (status === "Paid") {
        filtered = filtered.filter((client) => client.feePaid === "Paid");
      } else if (status === "Unpaid") {
        filtered = filtered.filter((client) => client.feePaid === "Not Paid");
      }

      setFilteredClients(filtered);
    },
    [clients, searchQuery],
  );

  const applyFilters = useCallback(() => {
    let filtered = [...clients];

    if (filters.name) {
      filtered = filtered.filter((client) =>
        client.name.toLowerCase().includes(filters.name.toLowerCase()),
      );
    }

    if (filters.batch) {
      filtered = filtered.filter((client) => client.batch_id === filters.batch);
    }

    if (filters.training) {
      filtered = filtered.filter(
        (client) => client.training_id === filters.training,
      );
    }

    if (filters.aim) {
      filtered = filtered.filter((client) => client.goal === filters.aim);
    }

    if (filters.feePaid !== "") {
      filtered = filtered.filter(
        (client) => client.feePaid === filters.feePaid,
      );
    }

    setFilteredClients(filtered);
    setFilterModalVisible(false);
  }, [clients, filters]);

  const resetFilters = useCallback(() => {
    setFilters({
      name: "",
      batch: "",
      training: "",
      aim: "",
      feePaid: "",
    });
    setFilteredClients(clients);
    setFilterModalVisible(false);
  }, [clients]);

  const toggleFeeStatus = useCallback((client) => {
    setSelectedClient(client);
    if (client.is_old_client == false) {
      openFeeDetailsModal(client);
    }
  }, []);

  const openFeeDetailsModal = useCallback(async (client) => {
    try {
      const response = await getFeeDetailsAPI(client.training_id);
      if (response?.status === 200) {
        setSelectedClient(client);
        setOriginalFee(response?.data?.amount || 0);
        setSelectedPlan(response?.data);
        setDiscountedFee(response.data.amount || 0);
        setGstType("no_gst");
        setGstPercentage("");
        setFeeDetailsModalVisible(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Could not fetch fee details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch fee details",
      });
    }
  }, []);

  const handleOriginalFee = useCallback((value) => {
    if (value) {
      setOriginalFee(value);
      setDiscountedFee(0);
    }
  }, []);

  const updateFeeStatus = useCallback(async () => {
    if (selectedClient) {
      try {
        const finalFee = discountedFee ? discountedFee : originalFee;

        const gstAmount =
          gstType === "no_gst" || !gstPercentage
            ? 0
            : (finalFee * parseFloat(gstPercentage)) / 100;

        const totalAmount =
          gstType === "no_gst"
            ? finalFee
            : gstType === "exclusive"
              ? finalFee + gstAmount
              : finalFee;
        const payload = {
          client_id: selectedClient.id,
          gym_id: selectedClient.gym_id,
          type: "fees",
          plan_id: selectedPlan.id,
          fees: discountedFee ? discountedFee : originalFee,
          payment_method: selectedPaymentOption,
          payment_reference_number: paymentReferenceNumber,
          gst_type: gstType,
          gst_percentage:
            gstType !== "no_gst" ? parseFloat(gstPercentage) || 0 : 0,
          total_amount: totalAmount,
        };

        const response = await updateFeeStatusAPI(payload);

        if (response?.status === 200) {
          await fetchClients();
          setFeeModalVisible(false);
          setSnackbarMessage(
            `Fee status for ${selectedClient.name} updated successfully`,
          );
          showToast({
            type: "success",
            title: `Fee status for ${selectedClient?.name} updated successfully`,
          });
          setSnackbarVisible(true);
          setSelectedClient(null);
          applyStatusFilter(activeFilter);
          router.push("/owner/paidMembersReceiptListPage");
        } else {
          showToast({
            type: "error",
            title: response?.message,
          });
        }
      } catch (error) {
        setSnackbarMessage("Failed to update fee status");
        setSnackbarVisible(true);
      }
    }
  }, [
    selectedClient,
    discountedFee,
    originalFee,
    selectedPaymentOption,
    paymentReferenceNumber,
    gstType,
    gstPercentage,
    fetchClients,
    applyStatusFilter,
    activeFilter,
  ]);

  const deleteFeeStatus = useCallback(async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await deleteFeeStatusAPI(selectedClient.id, gymId);

      if (response?.status === 200) {
        await fetchClients();
        setFeeModalVisible(false);
        setSnackbarMessage(
          `Fee status for ${selectedClient.name} updated successfully`,
        );
        setSnackbarVisible(true);
        setSelectedClient(null);
        applyStatusFilter(activeFilter);
      }
    } catch (error) {
      setSnackbarMessage("Failed to update fee status");
      setSnackbarVisible(true);
    }
  }, [selectedClient, fetchClients, applyStatusFilter, activeFilter]);

  const handlePhoneCall = useCallback((phoneNumber) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          showToast({
            type: "error",
            title: "Phone calls not supported on this device",
          });
        }
      })
      .catch((err) => {
        showToast({
          type: "error",
          title: "Failed to open dialer",
        });
      });
  }, []);

  // Updated renderClientRow
  const renderClientRow = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: `/owner/client/${item.id}`,
            params: {
              client: encodeURIComponent(JSON.stringify(item)),
              role: role,
              trainerPermissions: String(trainerPermissions),
            },
          })
        }
      >
        <View
          style={[
            styles.clientCard,
            item?.is_old_client && { backgroundColor: "#f5f5f5" },
          ]}
        >
          <View style={styles.clientAvatar}>
            <Image
              source={{ uri: item.profile }}
              resizeMode="contain"
              style={styles.profileImage}
            />
          </View>
          <View style={styles.clientInfo}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  flexWrap: "wrap",
                  flex: 1,
                }}
              >
                <Text style={styles.clientName}>{item.name}</Text>
                {item.data_sharing && (
                  <View style={styles.dataSharingBadge}>
                    <Ionicons name="share-social" size={10} color="#FFFFFF" />
                    <Text style={styles.dataSharingBadgeText}>Shared</Text>
                  </View>
                )}
              </View>

              {item.is_old_client && (
                <Text style={[styles.detailText, { marginRight: 25 }]}>
                  Inactive
                </Text>
              )}
            </View>
            <View style={styles.clientDetails}>
              <View style={[styles.detailItem, { width: 90 }]}>
                <FontAwesome5 name="clock" size={12} color="#666" />
                <Text style={styles.detailText}>
                  {item.batch || "No Batch"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <FontAwesome5 name="dumbbell" size={12} color="#666" />
                <Text style={styles.detailText}>
                  {item.training || "No Plan"}
                </Text>
              </View>
            </View>
          </View>

          {/* Mobile button instead of status button */}
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => handlePhoneCall(item.contact)}
          >
            <FontAwesome name="phone" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [handlePhoneCall, role, trainerPermissions],
  );

  const handleExport = useCallback(async () => {
    try {
      await exportClientsToExcel(filteredClients, "clients");
    } catch (error) {
      showToast({
        type: "error",
        title: "Export error",
        desc: error.message || "Unknown error creating Excel file",
      });
    }
  }, [filteredClients]);

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const SearchSection = useMemo(
    () => (
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search trainees..."
          onChange={handleSearch}
          query={searchQuery}
          onPress={handleFilterPress}
        />
      </View>
    ),
    [searchQuery, handleSearch, handleFilterPress],
  );

  const getProfileData = async () => {
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      const trainerId = await getToken("trainer_id");
      const userRole = await getToken("role");
      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "GymID or OwnerID not found",
        });
        return;
      }

      const response = await getProfileDataAPI(
        gymId,
        ownerId,
        null,
        trainerId,
        userRole,
      );
      setProfileData(response?.data?.owner_data);
      setGymLogo(response?.data?.gym_data?.logo);
      setGymName(response?.data?.gym_data?.name || "Gym");
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      getProfileData();
    }, []),
  );

  //   const FilterTabs = useMemo(
  //     () => (
  //       <View style={styles.filterTabsContainer}>
  //         <TouchableOpacity
  //           style={[
  //             styles.filterTab,
  //             activeFilter === "All Trainees" && styles.activeFilterTab,
  //           ]}
  //           onPress={() => applyStatusFilter("All Trainees")}
  //         >
  //           <Text
  //             style={[
  //               styles.filterTabText,
  //               activeFilter === "All Trainees" && styles.activeFilterTabText,
  //             ]}
  //           >
  //             All Trainees
  //           </Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[
  //             styles.filterTab,
  //             activeFilter === "Paid" && styles.activeFilterTab,
  //           ]}
  //           onPress={() => applyStatusFilter("Paid")}
  //         >
  //           <Text
  //             style={[
  //               styles.filterTabText,
  //               activeFilter === "Paid" && styles.activeFilterTabText,
  //             ]}
  //           >
  //             Paid
  //           </Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[
  //             styles.filterTab,
  //             activeFilter === "Unpaid" && styles.activeFilterTab,
  //           ]}
  //           onPress={() => applyStatusFilter("Unpaid")}
  //         >
  //           <Text
  //             style={[
  //               styles.filterTabText,
  //               activeFilter === "Unpaid" && styles.activeFilterTabText,
  //             ]}
  //           >
  //             Unpaid
  //           </Text>
  //         </TouchableOpacity>
  //         <TouchableOpacity
  //           style={[styles.filterTab, { flexDirection: "row" }]}
  //           onPress={handleExport}
  //         >
  //           <Ionicons name="cloud-upload-outline" size={18} color="#1F2937" />
  //           <Text style={styles.filterTabText}> Export</Text>
  //         </TouchableOpacity>
  //       </View>
  //     ),
  //     [activeFilter, applyStatusFilter, handleExport]
  //   );

  const EmptyMessage = useMemo(() => {
    if (filteredClients.length === 0) {
      return (
        <Text style={styles.noResults}>
          No trainees match your search or filters.
        </Text>
      );
    }
    return null;
  }, [filteredClients.length]);

  const ClientsFlatList = useMemo(
    () => (
      <Animated.FlatList
        ref={flatListRef}
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClientRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.flatListContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + 70 },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {SearchSection}
            {/* {FilterTabs} */}
            {EmptyMessage}
          </View>
        }
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        stickyHeaderIndices={[0]}
      />
    ),
    [
      filteredClients,
      renderClientRow,
      SearchSection,
      //   FilterTabs,
      EmptyMessage,
      scrollY,
    ],
  );

  // Updated renderContent - removed Import Clients case
  const renderContent = () => {
    if (clients.length === 0) {
      return (
        <View style={styles.noFeedContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={60}
            color="#CBD5E0"
          />
          <Text style={styles.noFeedTitle}>No Trainees to Show</Text>
          <Text style={styles.noFeedSubtitle}>
            Add Trainees to View their Realtime Workout and Diet progress and
            Much more.
          </Text>
        </View>
      );
    }
    return ClientsFlatList;
  };

  return (
    <View style={styles.container} {...panHandlers}>
      {isLoading ? (
        <AllClientsSkeleton priority="high" />
      ) : (
        <>
          <View style={styles.customHeader}>
            <View style={styles.topRow}>
              <View style={styles.companyContainer}>
                <TouchableOpacity onPress={toggleSideNav}>
                  <Ionicons
                    name="menu-outline"
                    size={isTablet ? 36 : 28}
                    color={"#000"}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.logoText, isTablet && styles.logoTextTablet]}
                >
                  <Text style={styles.logoFirstPart}>Fymble</Text>
                  <Text style={styles.logoSecondPart}> Business</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.profileSection}
                onPress={() => router.push("/owner/ownerprofile")}
              >
                <View style={styles.profileContent}>
                  <Text
                    style={[
                      styles.gymNameText,
                      isTablet && styles.gymNameTextTablet,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {gymName?.length > 16
                      ? gymName.substring(0, 16) + "..."
                      : gymName}
                  </Text>
                  <View
                    style={[
                      styles.profileIcon,
                      isTablet && styles.profileIconTablet,
                    ]}
                  >
                    <Image
                      source={{ uri: gymLogo }}
                      style={[
                        styles.profileImage,
                        isTablet && styles.profileImageTablet,
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {isMenuVisible && (
              <View style={styles.menuDropdown}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {isSideNavVisible && (
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              color1={"#022950"}
              color2={"#0154A0"}
              profileData={profileData}
              gymLogo={gymLogo}
            />
          )}

          <View style={styles.contentContainer}>{renderContent()}</View>

          <FilterModal
            visible={filterModalVisible}
            plans={plans}
            batches={batches}
            onClose={() => setFilterModalVisible(false)}
            applyFilters={applyFilters}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
          />

          <FeeStatusModal
            visible={feeModalVisible}
            onClose={() => setFeeModalVisible(false)}
            selectedClient={selectedClient}
            onMarkPaid={updateFeeStatus}
            onMarkUnpaid={deleteFeeStatus}
          />
          <SwipeIndicator />

          <FeeDetailsModal
            visible={feeDetailsModalVisible}
            onClose={() => setFeeDetailsModalVisible(false)}
            originalFee={originalFee}
            discountedFee={discountedFee}
            setDiscountedFee={setDiscountedFee}
            selectedPaymentOption={selectedPaymentOption}
            setSelectedPaymentOption={setSelectedPaymentOption}
            paymentOptions={paymentOptions}
            plans={plans}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            handleOriginalFee={handleOriginalFee}
            setShowReceiptModal={setShowReceiptModal}
            paymentReferenceNumber={paymentReferenceNumber}
            setPaymentReferenceNumber={setPaymentReferenceNumber}
            gstType={gstType}
            setGstType={setGstType}
            gstPercentage={gstPercentage}
            setGstPercentage={setGstPercentage}
            gstTypeOptions={gstTypeOptions}
          />

          <ReceiptModal
            visible={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false);
              setFeeDetailsModalVisible(true);
            }}
            onsubmit={() => {
              setShowReceiptModal(false);
              updateFeeStatus();
            }}
            RedButtonText={"Save"}
            onShare={() => {}}
            onDownload={() => {}}
            gymData={gymData}
            invoice={{
              name: selectedClient?.name || "Client Name",
              address: "Address",
              contact: selectedClient?.contact || "Mobile number",
              paymentMethod: selectedPaymentOption,
              paymentReferenceNumber: paymentReferenceNumber,
              bankDetails: "Acc no:",
              discount:
                originalFee > 0
                  ? ((originalFee - discountedFee) / originalFee) * 100
                  : 0,
              total: originalFee,
              discountedFee: discountedFee,
              gymName: gymData?.name || " Gym Name",
              gymAddress: gymData?.location || "Gym Address",
              gstType: gstType,
              gstPercentage:
                gstType !== "no_gst" ? parseFloat(gstPercentage) || 0 : 0,
              items: [
                {
                  date: dateUtils.getCurrentDateFormatted(),
                  description: selectedPlan?.plans || "Description",
                  method: selectedPaymentOption,
                  amount: originalFee || 0,
                },
              ],
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    paddingTop: 0,
    paddingBottom: 0,
  },
  customHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  logoTextTablet: {
    fontSize: 22,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#666",
    fontWeight: "bold",
  },
  profileSection: {
    padding: 4,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gymNameText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
  },
  gymNameTextTablet: {
    fontSize: 18,
  },
  profileIcon: {
    width: 46,
    height: 46,
    borderRadius: 25,
    overflow: "hidden",
  },
  profileIconTablet: {
    width: 45,
    height: 45,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileImageTablet: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  menuDropdown: {
    position: "absolute",
    top: 90,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemText: {
    fontSize: 14,
    color: "#374151",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1F2937",
  },
  searchBarContainer: {
    backgroundColor: "#F9FAFB",
  },
  listHeaderContainer: {
    backgroundColor: "#F9FAFB",
    paddingBottom: 20,
    zIndex: 10,
  },
  filterTabsContainer: {
    flexDirection: "row",
    marginVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeFilterTab: {
    backgroundColor: "#e6e6e6",
    borderColor: "#d1d1d1",
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeFilterTabText: {
    color: "#1F2937",
    fontWeight: "600",
  },
  searchAndActionsContainer: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchBar: {
    elevation: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    flex: 1,
  },
  actionsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  dataTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    elevation: 2,
  },
  nameColumn: {
    flex: 1.5,
  },
  ageColumn: {
    flex: 0.5,
    justifyContent: "center",
  },
  placeColumn: {
    flex: 1,
  },
  feeColumn: {
    flex: 0.5,
    justifyContent: "center",
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
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noFeedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    color: "#1F2937",
  },
  noFeedSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "600",
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  // Updated phone button styles
  phoneButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  statusIndicator: {
    width: 25,
    height: 25,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statusPaid: {
    backgroundColor: "#10B981",
  },
  statusUnpaid: {
    backgroundColor: "#EF4444",
  },
  dataSharingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
    marginLeft: 4,
  },
  dataSharingBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
});

export default ClientListPage;

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
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
