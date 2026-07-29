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
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from "react-native";
import { exportClientsToExcel } from "../../components/client/excelUtils";
import FeeDetailsModal from "../../components/client/FeeDetailsModal";
import FeeStatusModal from "../../components/client/FeeStatusModal";
import ReceiptModal from "../../components/client/Receipt";
import { paymentOptions } from "../../components/home/data";
import FilterModal from "../../components/home/newbies/FilterModal";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { Paths, Directory, File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import ImportResultModal from "../../components/client/ImportResultModal";
import GetGymClientDataInstructionModal from "../../components/client/GetGymClientDataInstructionModal";

import AllClientsSkeleton from "../../components/ui/loaders/allClientsSkeleton";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import {
  deleteFeeStatusAPI,
  getClientsAPI,
  getFeeDetailsAPI,
  getPlansandBatchesAPI,
  updateFeeStatusAPI,
  ImportDataAPI,
  getGymImportDataAPI,
  addImportDetailsAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import { dateUtils } from "../../utils/date";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const BOTTOM_NAV_HEIGHT = 80;

const gstTypeOptions = [
  { label: "Inclusive", value: "inclusive" },
  { label: "Exclusive", value: "exclusive" },
  { label: "No GST", value: "no_gst" },
];

const SearchBar = React.memo(({ onPress, onChange, query }) => {
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
      <TouchableOpacity onPress={onPress} style={searchBarStyles.filterButton}>
        <Ionicons size={20} name="filter-outline" />
      </TouchableOpacity>
    </View>
  );
});

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Helper function to generate color based on name
const getColorFromName = (name) => {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#ef4444",
  ];
  if (!name) return colors[0];
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
};

// Helper function to format date in Indian format (1st Nov 25)
const formatExpiryDate = (sqlDate) => {
  if (!sqlDate) return null;

  const date = new Date(sqlDate);
  const day = date.getDate();
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
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${day}${getOrdinal(day)} ${month} ${year}`;
};

const AllClientsPage = ({ hideBackButton = false }) => {
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

  const [activeFilter, setActiveFilter] = useState("All Clients");
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
  const [gymData, setGymData] = useState(null);
  const router = useRouter();
  const flatListRef = useRef(null);
  const [role, setRole] = useState("owner");
  const [trainerPermissions, setTrainerPermissions] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [instructionModalVisible, setInstructionModalVisible] = useState(false);
  const [importedClientModalVisible, setImportedClientModalVisible] =
    useState(false);
  const [selectedImportedClient, setSelectedImportedClient] = useState(null);
  const [checkStatus, setCheckStatus] = useState(false);
  const [importStatus, setImportStatus] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importDetailsModalVisible, setImportDetailsModalVisible] =
    useState(false);
  const [importMethodModalVisible, setImportMethodModalVisible] =
    useState(false);
  const [importDetails, setImportDetails] = useState({
    totalClients: "",
    activeClients: "",
    inactiveClients: "",
    totalEnquiries: "",
    totalFollowups: "",
  });
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (is_active === "true") {
      setActiveFilter("Paid");
      // Apply the Paid filter immediately
      applyStatusFilter("Paid");
    } else {
      setActiveFilter("All Clients");
    }
  }, [is_active, clients]);

  useEffect(() => {
    if (importDetails.totalClients && importDetails.activeClients) {
      const total = parseInt(importDetails.totalClients) || 0;
      const active = parseInt(importDetails.activeClients) || 0;
      const inactive = total - active;
      setImportDetails((prev) => ({
        ...prev,
        inactiveClients: inactive >= 0 ? inactive.toString() : "0",
      }));
    }
  }, [importDetails.totalClients, importDetails.activeClients]);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const trainerId = await getToken("trainer_id");
      const role = await getToken("role");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      setRole(role);

      const requestRole = role === "trainer" ? "trainer" : null;

      const response = await getClientsAPI(gymId, requestRole, trainerId);

      if (response?.status === 200) {
        if (response?.gym_data) {
          setGymData(response.gym_data);
        }

        if (response?.trainer_permissions) {
          setTrainerPermissions(
            response.trainer_permissions.can_view_client_data,
          );
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
          import_status: client.import_status || false,
          map_client_id: client.map_client_id,
          expires_at: client.expires_at || null,
          starts_at: client.starts_at || null,
          latest_membership_id: client.latest_membership_id || null,
          manual_client: client.manual_client || false,
          entry_type: client.entry_type || null,
          dp: client.dp || null,
          import_id: client.import_id || null,
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
    }, [fetchPlansAndBatches, fetchClients]),
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
            (client.contact && client.contact.includes(query)) ||
            (client.admission_number &&
              client.admission_number
                .toLowerCase()
                .includes(query.toLowerCase())) ||
            (client.gym_client_id &&
              client.gym_client_id
                .toLowerCase()
                .includes(query.toLocaleLowerCase())),
        );
      }

      if (status === "Paid") {
        filtered = filtered.filter((client) => client.feePaid === "Paid");
      } else if (status === "Unpaid") {
        filtered = filtered.filter((client) => client.feePaid === "Not Paid");
      } else if (status === "Imported") {
        filtered = filtered.filter((client) => client.import_status === true);
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

  const getImportDescriptionStatus = async () => {
    setCheckStatus(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Failed to fetch import details",
        });
        return false;
      }
      const response = await getGymImportDataAPI(gymId);
      if (response?.status === 200) {
        setImportStatus(response?.eligibility);
        setImportData(response?.import_data);
        return response?.eligibility;
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Could not fetch import details",
        });
        return false;
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Failed to fetch import details",
      });
      return false;
    } finally {
      setCheckStatus(false);
    }
  };

  const handleImportButtonClick = async () => {
    const imported = await getImportDescriptionStatus();
    if (imported === false) {
      setImportDetailsModalVisible(true);
    } else {
      setImportMethodModalVisible(true);
    }
  };

  const handleImportDetailsSubmit = async () => {
    if (
      !importDetails.totalClients ||
      !importDetails.activeClients ||
      !importDetails.totalEnquiries ||
      !importDetails.totalFollowups
    ) {
      showToast({
        type: "error",
        title: "Please fill all required fields",
      });
      return;
    }

    try {
      const gymId = await getToken("gym_id");
      const payload = {
        gym_id: gymId,
        total_clients: parseInt(importDetails.totalClients),
        active_clients: parseInt(importDetails.activeClients),
        inactive_clients: parseInt(importDetails.inactiveClients),
        total_enquiries: parseInt(importDetails.totalEnquiries),
        total_followups: parseInt(importDetails.totalFollowups),
      };

      const response = await addImportDetailsAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Import details saved successfully",
        });
        setImportDetailsModalVisible(false);
        setImportMethodModalVisible(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to save import details",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Failed to save import details",
      });
    }
  };

  const handleMethodSelection = (method) => {
    setImportMethodModalVisible(false);
    if (method === "excel") {
      setInstructionModalVisible(true);
    } else if (method === "manual") {
      router.push("/owner/manualClientImport");
    }
  };

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

  const renderClientRow = useCallback(
    ({ item }) => {
      // Safety check - if item is invalid, return null
      if (!item || typeof item !== "object") {
        console.warn("[renderClientRow] Invalid item:", item);
        return null;
      }

      try {
        const isActive = item.feePaid === "Paid";
        const expiryDate = isActive ? formatExpiryDate(item.expires_at) : null;
        const profileUri = item.dp || item.profile;
        // Check if membership is expired (today > expires_at)
        let isExpired = false;
        let isExpiringSoon = false;

        try {
          if (item.expires_at) {
            const expiryDateObj = new Date(item.expires_at);
            const today = new Date(new Date().setHours(0, 0, 0, 0));
            isExpired = expiryDateObj < today;
            isExpiringSoon =
              isActive &&
              !isExpired &&
              expiryDateObj <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }
        } catch (dateError) {
          console.warn(
            "[renderClientRow] Date parsing error:",
            dateError,
            item.expires_at,
          );
        }

        return (
          <TouchableOpacity
            onPress={() => {
              // Prevent non-owners from clicking
              // if (role !== "owner") {
              //   return;
              // }

              // If imported client, show the modal instead of navigating
              // if (item.import_status === true) {
              //   setSelectedImportedClient(item);
              //   setImportedClientModalVisible(true);
              //   return;
              // }

              // Otherwise, navigate to client details
              router.push({
                pathname: `/owner/client/${item.id}`,
                params: {
                  client: JSON.stringify(item),
                  role: role,
                  trainerPermissions: trainerPermissions,
                },
              });
            }}
            // disabled={role !== "owner"}
          >
            <View
              style={[
                styles.clientCard,
                item?.is_old_client && styles.inactiveClientCard,
              ]}
            >
              {/* Left Accent for Inactive */}
              {item?.is_old_client && <View style={styles.inactiveAccent} />}

              {/* Avatar */}
              <View style={styles.clientAvatar}>
                {profileUri && profileUri !== "" && !item.import_status ? (
                  <Image
                    source={{ uri: profileUri }}
                    resizeMode="cover"
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.initialsAvatar,
                      { backgroundColor: getColorFromName(item.name) },
                    ]}
                  >
                    <Text style={styles.initialsText}>
                      {getInitials(item.name)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Client Info */}
              <View style={styles.clientInfo}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientNameRow}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {item.name.length > 20
                        ? `${item.name.substring(0, 20)}...`
                        : item.name}
                    </Text>
                    {item.data_sharing && (
                      <View style={styles.dataSharingBadge}>
                        <Ionicons
                          name="share-social"
                          size={9}
                          color="#FFFFFF"
                        />
                        <Text style={styles.dataSharingBadgeText}>Shared</Text>
                      </View>
                    )}
                    {/* {item.import_status && (
                      <View style={styles.importedBadge}>
                        <Ionicons
                          name="cloud-download"
                          size={9}
                          color="#FFFFFF"
                        />
                        <Text style={styles.importedBadgeText}>Imported</Text>
                      </View>
                    )} */}
                  </View>

                  {item.is_old_client && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactive</Text>
                    </View>
                  )}
                </View>

                {/* Details Row */}
                <View style={styles.clientDetailsRow}>
                  <View style={styles.detailItemNew}>
                    <FontAwesome5 name="id-card" size={11} color="#64748B" />
                    <Text style={styles.detailTextNew} numberOfLines={1}>
                      {item.admission_number || item.gym_client_id}
                    </Text>
                  </View>
                  <View style={styles.detailItemNew}>
                    <FontAwesome name="phone" size={11} color="#64748B" />
                    <Text style={styles.detailTextNew}>{item.contact}</Text>
                  </View>
                </View>

                {/* Expiry Date */}
                {item.expires_at && (
                  <View style={styles.expiryRow}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={
                        isExpired
                          ? "#EF4444"
                          : isExpiringSoon
                            ? "#F59E0B"
                            : "#64748B"
                      }
                    />
                    <Text
                      style={[
                        styles.expiryText,
                        isExpired && styles.expiryTextExpired,
                        isExpiringSoon &&
                          !isExpired &&
                          styles.expiryTextWarning,
                      ]}
                    >
                      {isExpired
                        ? `Expired: ${formatExpiryDate(item.expires_at)}`
                        : `Expires: ${expiryDate}`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Status Indicator */}
              {!item.is_old_client && (
                <View style={styles.statusButton}>
                  {item.feePaid === "Paid" && !isExpired ? (
                    <View style={[styles.statusIndicator, styles.statusPaid]}>
                      <FontAwesome name="check" size={12} color="white" />
                    </View>
                  ) : (
                    <View style={[styles.statusIndicator, styles.statusUnpaid]}>
                      <FontAwesome name="times" size={12} color="white" />
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      } catch (renderError) {
        console.error(
          "[renderClientRow] Render error:",
          renderError,
          "Item:",
          item?.id,
          item?.name,
        );
        return null;
      }
    },
    [toggleFeeStatus, role, trainerPermissions],
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

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ],
        copyToCacheDirectory: true,
      });

      if (result) {
        setIsLoading(true);
        const formData = new FormData();
        const gymId = await getToken("gym_id");
        formData.append("gym_id", gymId);

        const fileUri = result.assets[0].uri;
        const fileType = result.assets[0].mimeType;
        const fileName = result.assets[0].name;

        const fileBlob = {
          uri: fileUri,
          type: fileType || "application/octet-stream",
          name: fileName,
        };

        formData.append("file", fileBlob);

        const response = await ImportDataAPI(formData);

        if (response?.status == 200) {
          setImportResult(response);
          setImportModalVisible(true);
          fetchClients();
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Unable to import clients",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to import file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCorruptedData = async () => {
    try {
      if (
        !importResult ||
        !importResult.corrupted_rows ||
        importResult.corrupted_rows.length === 0
      ) {
        return;
      }

      const corruptedData = importResult.corrupted_rows.map((item) => ({
        Row: item.row,
        Name: item.data.Name || "",
        Contact: item.data.Contact || "",
        Email: item.data.Email || "",
        Location: item.data.Location || "",
        Gender: item.data.Gender || "",
        Status: item.data.Status || "",
        AdmissionNumber: item.data.AdmissionNumber || "",
        Errors: item.errors.join(", "),
      }));

      const worksheet = XLSX.utils.json_to_sheet(corruptedData);

      const widths = [
        { wch: 5 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 30 },
        { wch: 40 },
      ];

      worksheet["!cols"] = widths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Corrupted Data");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const fileName = `corrupted_data_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      if (Platform.OS === "android") {
        // Android: Use Storage Access Framework to save directly
        const permissions =
          await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          showToast({
            type: "error",
            title: "Storage permission is required to save the file",
          });
          return;
        }

        // Create file in the selected directory
        const fileUri =
          await FileSystemLegacy.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );

        // Write the Excel data to the file
        await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
      } else {
        // iOS: Use expo-sharing (iOS requires user interaction to save files)
        const file = new File(Paths.cache, fileName);
        await file.create();
        await file.write(excelBuffer);

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          showToast({
            type: "error",
            title: "Sharing is not available on this device",
          });
          return;
        }

        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Save Corrupted Data",
          UTI: "com.microsoft.excel.xlsx",
        });
      }

      showToast({
        type: "success",
        title: "Error report saved successfully",
      });

      // Close the import result modal after successful save
      setImportModalVisible(false);
    } catch (error) {
      showToast({
        type: "error",
        title: error.message || "Failed to export error report",
      });
    }
  };

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const SearchSection = useMemo(
    () => (
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search clients..."
          onChange={handleSearch}
          query={searchQuery}
          onPress={handleFilterPress}
        />
      </View>
    ),
    [searchQuery, handleSearch, handleFilterPress],
  );

  const FilterTabs = useMemo(
    () => (
      <View style={styles.filterTabsContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "All Clients" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("All Clients")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "All Clients" && styles.activeFilterTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "Paid" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("Paid")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "Paid" && styles.activeFilterTabText,
            ]}
          >
            Paid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "Unpaid" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("Unpaid")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "Unpaid" && styles.activeFilterTabText,
            ]}
          >
            Unpaid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "Imported" && styles.activeFilterTab,
          ]}
          onPress={() => applyStatusFilter("Imported")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "Imported" && styles.activeFilterTabText,
            ]}
          >
            Imported
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [activeFilter, applyStatusFilter],
  );

  const EmptyMessage = useMemo(() => {
    if (filteredClients.length === 0) {
      return (
        <Text style={styles.noResults}>
          No clients match your search or filters.
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
        keyExtractor={(item, index) => {
          // Use unique_id if available, otherwise combine entry_type + id for uniqueness
          if (item?.unique_id) return item.unique_id;
          const prefix = item?.manual_client
            ? "manual"
            : item?.import_status
              ? "import"
              : "client";
          return `${prefix}_${item?.id || index}_${index}`;
        }}
        renderItem={renderClientRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.flatListContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + 70 },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {SearchSection}
            {FilterTabs}
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
    [filteredClients, renderClientRow, SearchSection, FilterTabs, EmptyMessage],
  );

  if (isLoading) {
    return <AllClientsSkeleton priority="high" />;
  }

  if (clients.length === 0) {
    return (
      <View style={styles.container}>
        {!hideBackButton && (
          <HardwareBackHandler routePath="/owner/client" enabled={true} />
        )}
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {!hideBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/owner/client")}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.headerTitle,
              hideBackButton && styles.headerTitleNoBack,
            ]}
          >
            All Clients
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleImportButtonClick}
              disabled={checkStatus}
            >
              <Text style={styles.headerActionButtonText}>
                {checkStatus ? "Loading..." : "Import"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleExport}
            >
              <Text style={styles.headerActionButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noFeedContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={60}
            color="#CBD5E0"
          />
          <Text style={styles.noFeedTitle}>No Clients to Show</Text>
          <Text style={styles.noFeedSubtitle}>
            Add Clients to View their Fee status, Realtime Workout and Diet
            progress and Much more.
          </Text>
          <TouchableOpacity
            style={styles.noFeedRefreshButton}
            onPress={() => router.push("/owner/clientform")}
          >
            <MaterialCommunityIcons
              name="account-group-outline"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.noFeedButtonText}>Add Clients</Text>
          </TouchableOpacity>
        </View>

        <GetGymClientDataInstructionModal
          handleImport={handleImport}
          setIsLoading={setIsLoading}
          visible={instructionModalVisible}
          onClose={() => setInstructionModalVisible(false)}
        />

        <ImportResultModal
          visible={importModalVisible}
          onDismiss={() => setImportModalVisible(false)}
          importResult={importResult}
          onDownloadCorrupted={handleExportCorruptedData}
        />

        <Modal
          visible={importDetailsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setImportDetailsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.importModalContainer}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <View style={styles.importModalOverlay} />
            </TouchableWithoutFeedback>

            <View
              style={[
                styles.importDetailsModal,
                { paddingBottom: insets.bottom },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.importModalHeader}>
                <Text style={styles.importModalTitle}>Import Client Data</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setImportDetailsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.importFormContainer,
                  { paddingBottom: insets.bottom + 20 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.importDetailsSubtitle}>
                  Please provide your gym's current statistics
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Total Number of Clients *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total clients"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={importDetails.totalClients}
                    onChangeText={(text) =>
                      setImportDetails((prev) => ({
                        ...prev,
                        totalClients: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Number of Active Clients *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter active clients"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={importDetails.activeClients}
                    onChangeText={(text) =>
                      setImportDetails((prev) => ({
                        ...prev,
                        activeClients: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Number of Inactive Clients
                  </Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    placeholder="Auto-calculated"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={importDetails.inactiveClients}
                    editable={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Total Number of Enquiries *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total enquiries"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={importDetails.totalEnquiries}
                    onChangeText={(text) =>
                      setImportDetails((prev) => ({
                        ...prev,
                        totalEnquiries: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Total Number of Followups *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total followups"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={importDetails.totalFollowups}
                    onChangeText={(text) =>
                      setImportDetails((prev) => ({
                        ...prev,
                        totalFollowups: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setImportDetailsModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleImportDetailsSubmit}
                  >
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Import Method Selection Modal */}
        <Modal
          visible={importMethodModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImportMethodModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.methodSelectionModal}>
              <Text style={styles.methodSelectionTitle}>
                Choose Import Method
              </Text>
              <Text style={styles.methodSelectionSubtitle}>
                How would you like to import your clients?
              </Text>

              <TouchableOpacity
                style={styles.methodCard}
                onPress={() => handleMethodSelection("excel")}
              >
                <View style={styles.methodIconContainer}>
                  <MaterialCommunityIcons
                    name="microsoft-excel"
                    size={40}
                    color="#22426B"
                  />
                </View>
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodCardTitle}>Import via Excel</Text>
                  <Text style={styles.methodCardDescription}>
                    Upload an Excel file with your client data
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#22426B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.methodCard}
                onPress={() => handleMethodSelection("manual")}
              >
                <View style={styles.methodIconContainer}>
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={40}
                    color="#22426B"
                  />
                </View>
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodCardTitle}>Import Manually</Text>
                  <Text style={styles.methodCardDescription}>
                    Enter client details manually one by one
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#22426B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.methodCancelButton}
                onPress={() => setImportMethodModalVisible(false)}
              >
                <Text style={styles.methodCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {!hideBackButton && (
        <HardwareBackHandler routePath="/owner/client" enabled={true} />
      )}
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {!hideBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/owner/client")}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.headerTitle,
            hideBackButton && styles.headerTitleNoBack,
          ]}
        >
          All Clients
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleImportButtonClick}
            disabled={checkStatus}
          >
            <Text style={styles.headerActionButtonText}>
              {checkStatus ? "Loading..." : "Import"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleExport}
          >
            <Text style={styles.headerActionButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>{ClientsFlatList}</View>

      {/* Modals */}
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

      <ImportResultModal
        visible={importModalVisible}
        onDismiss={() => setImportModalVisible(false)}
        importResult={importResult}
        onDownloadCorrupted={handleExportCorruptedData}
      />

      <GetGymClientDataInstructionModal
        handleImport={handleImport}
        setIsLoading={setIsLoading}
        visible={instructionModalVisible}
        onClose={() => setInstructionModalVisible(false)}
      />

      {/* Imported Client Modal */}
      <Modal
        visible={importedClientModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImportedClientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.importedClientModal}>
            <View style={styles.importedModalIconContainer}>
              <Ionicons name="cloud-download" size={60} color="#22426B" />
            </View>

            <Text style={styles.importedModalTitle}>
              Client Not Registered Yet
            </Text>

            <Text style={styles.importedModalClientName}>
              {selectedImportedClient?.name}
            </Text>

            <Text style={styles.importedModalDescription}>
              This client was imported from your records but hasn't registered
              on the Fymble app yet.
            </Text>

            <View style={styles.importedModalInfoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#22426B"
              />
              <Text style={styles.importedModalInfoText}>
                Ask them to download the Fymble app and register with your gym
                to:
              </Text>
            </View>

            <View style={styles.importedModalFeaturesList}>
              <View style={styles.importedModalFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.importedModalFeatureText}>
                  Access their workout and diet data
                </Text>
              </View>
              <View style={styles.importedModalFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.importedModalFeatureText}>
                  Update fee status and payments
                </Text>
              </View>
              <View style={styles.importedModalFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.importedModalFeatureText}>
                  Track progress and attendance
                </Text>
              </View>
            </View>

            <View style={styles.importedModalButtonContainer}>
              {selectedImportedClient?.contact &&
                selectedImportedClient.contact !== "N/A" && (
                  <TouchableOpacity
                    style={styles.importedModalCallButton}
                    onPress={() => {
                      const phoneNumber = selectedImportedClient.contact;
                      Linking.openURL(`tel:${phoneNumber}`);
                    }}
                  >
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.importedModalCallButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              <TouchableOpacity
                style={[
                  styles.importedModalCloseButton,
                  selectedImportedClient?.contact &&
                    selectedImportedClient.contact !== "N/A" &&
                    styles.importedModalCloseButtonFlex,
                ]}
                onPress={() => setImportedClientModalVisible(false)}
              >
                <Text style={styles.importedModalCloseButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Details Modal */}
      <Modal
        visible={importDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImportDetailsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.importModalContainer}
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.importModalOverlay} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.importDetailsModal,
              { paddingBottom: insets.bottom },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import Client Data</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImportDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.importFormContainer,
                { paddingBottom: insets.bottom + 20 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.importDetailsSubtitle}>
                Please provide your gym's current statistics
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Total Number of Clients *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total clients"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={importDetails.totalClients}
                  onChangeText={(text) =>
                    setImportDetails((prev) => ({
                      ...prev,
                      totalClients: text.replace(/[^0-9]/g, ""),
                    }))
                  }
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Number of Active Clients *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter active clients"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={importDetails.activeClients}
                  onChangeText={(text) =>
                    setImportDetails((prev) => ({
                      ...prev,
                      activeClients: text.replace(/[^0-9]/g, ""),
                    }))
                  }
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Number of Inactive Clients
                </Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="Auto-calculated"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={importDetails.inactiveClients}
                  editable={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Total Number of Enquiries *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total enquiries"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={importDetails.totalEnquiries}
                  onChangeText={(text) =>
                    setImportDetails((prev) => ({
                      ...prev,
                      totalEnquiries: text.replace(/[^0-9]/g, ""),
                    }))
                  }
                  returnKeyType="next"
                />
              </View>

              <View style={[styles.inputContainer]}>
                <Text style={styles.inputLabel}>
                  Total Number of Followups *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total followups"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={importDetails.totalFollowups}
                  onChangeText={(text) =>
                    setImportDetails((prev) => ({
                      ...prev,
                      totalFollowups: text.replace(/[^0-9]/g, ""),
                    }))
                  }
                  returnKeyType="done"
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setImportDetailsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleImportDetailsSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Import Method Selection Modal */}
      <Modal
        visible={importMethodModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImportMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.methodSelectionModal}>
            <Text style={styles.methodSelectionTitle}>
              Choose Import Method
            </Text>
            <Text style={styles.methodSelectionSubtitle}>
              How would you like to import your clients?
            </Text>

            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => handleMethodSelection("excel")}
            >
              <View style={styles.methodIconContainer}>
                <MaterialCommunityIcons
                  name="microsoft-excel"
                  size={40}
                  color="#22426B"
                />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={styles.methodCardTitle}>Import via Excel</Text>
                <Text style={styles.methodCardDescription}>
                  Upload an Excel file with your client data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#22426B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => handleMethodSelection("manual")}
            >
              <View style={styles.methodIconContainer}>
                <MaterialCommunityIcons
                  name="account-edit"
                  size={40}
                  color="#22426B"
                />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={styles.methodCardTitle}>Import Manually</Text>
                <Text style={styles.methodCardDescription}>
                  Enter client details manually one by one
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#22426B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodCancelButton}
              onPress={() => setImportMethodModalVisible(false)}
            >
              <Text style={styles.methodCancelButtonText}>Cancel</Text>
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
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerTitleNoBack: {
    textAlign: "left",
    marginLeft: 0,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#22426B",
    backgroundColor: "transparent",
  },
  headerActionButtonText: {
    color: "#22426B",
    fontSize: 13,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
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
    paddingHorizontal: 0,
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeFilterTab: {
    backgroundColor: "#007AFF",
  },
  filterTabText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  inactiveClientCard: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  inactiveAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#EF4444",
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#F9FAFB",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  clientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    maxWidth: 140,
  },
  clientDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
  detailItemNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  detailTextNew: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  expiryText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  expiryTextWarning: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  expiryTextExpired: {
    color: "#EF4444",
    fontWeight: "600",
  },
  inactiveBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusButton: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  statusPaid: {
    backgroundColor: "#10B981",
  },
  statusUnpaid: {
    backgroundColor: "#EF4444",
  },
  statusImported: {
    backgroundColor: "#22426B",
  },
  importedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22426B",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
    marginLeft: 4,
  },
  importedBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  importedClientModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  importedModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  importedModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  importedModalClientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22426B",
    textAlign: "center",
    marginBottom: 16,
  },
  importedModalDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  importedModalInfoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  importedModalInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1F2937",
    marginLeft: 8,
    lineHeight: 18,
  },
  importedModalFeaturesList: {
    width: "100%",
    marginBottom: 24,
  },
  importedModalFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 8,
  },
  importedModalFeatureText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 10,
    flex: 1,
  },
  importedModalButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  importedModalCallButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
  },
  importedModalCallButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  importedModalCloseButton: {
    backgroundColor: "#22426B",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  importedModalCloseButtonFlex: {
    width: "auto",
    flex: 1,
  },
  importedModalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  importModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  importModalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  importDetailsModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  importModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  importModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
  },
  closeButton: {
    padding: 4,
  },
  importFormContainer: {
    padding: 20,
    flexGrow: 1,
  },
  importDetailsSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  disabledInput: {
    backgroundColor: "#F7FAFC",
    color: "#718096",
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingBottom: 200,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#2D3748",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0078FF",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  methodSelectionModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  methodSelectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  methodSelectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  methodIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  methodCardDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  methodCancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    marginTop: 8,
  },
  methodCancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
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

export default AllClientsPage;
