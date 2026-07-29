import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import RenderAboutToExpirePage from "../../components/home/AboutToExpirePage";
import { showToast } from "../../utils/Toaster";
import {
  GetReceiptForPaidMembers,
  SendReceiptsToPaidMembers,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import ReceiptModal from "../../components/client/Receipt";
import { useRouter } from "expo-router";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../components/home/finances/TabHeader";
import SearchBarWithFilterButton from "../../components/ui/SearchBarWithMonthFilter";
import MonthSelectorModal from "../../components/home/MonthSelectorModal";
import Icon from "react-native-vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const monthList = [
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

const PaidMembersReceiptListPage = () => {
  const date = new Date();
  const [showInvoice, SetShowInvoice] = useState(false);
  const [receiptData, setReceiptData] = useState({ send: [], unsend: [] });
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const router = useRouter();
  const [viewMode, setViewMode] = useState("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedMonth, setLocalSelectedMonth] = useState(
    monthList[date.getMonth()]
  );
  const [localSelectedYear, setLocalSelectedYear] = useState(
    date.getFullYear()
  );
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [backendCurrentPage, setBackendCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const backendItemsPerPage = 25;
  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [frontendCurrentPage, setFrontendCurrentPage] = useState(1);
  const frontendItemsPerPage = 25;
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [selectedUnsentItems, setSelectedUnsentItems] = useState(new Set());
  const [isSending, setIsSending] = useState(false);

  const handleOpenAboutToExpireModal = () => {
    setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
  };

  const fetchReceiptData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID is not found",
        });
        return;
      }

      let response;

      if (viewMode === "monthly") {
        response = await GetReceiptForPaidMembers(
          gym_id,
          localSelectedMonth,
          localSelectedYear
        );
      } else {
        response = await GetReceiptForPaidMembers(
          gym_id,
          null,
          null,
          backendCurrentPage,
          backendItemsPerPage
        );
      }

      if (response?.status === 200) {
        setReceiptData(response?.data || { send: [], unsend: [] });

        if (response?.data?.pagination) {
          setPaginationInfo(response.data.pagination);
        } else {
          setPaginationInfo(null);
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch receipt data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, localSelectedMonth, localSelectedYear, backendCurrentPage]);

  useFocusEffect(
    useCallback(() => {
      fetchReceiptData();
    }, [fetchReceiptData])
  );

  useEffect(() => {
    let dataToFilter = [];

    if (activeTab === "All") {
      const sentWithStatus = (receiptData?.send || []).map((item) => ({
        ...item,
        status: "sent",
      }));
      const unsentWithStatus = (receiptData?.unsend || []).map((item) => ({
        ...item,
        status: "unsent",
      }));
      dataToFilter = [...sentWithStatus, ...unsentWithStatus];

      dataToFilter.sort((a, b) => {
        const dateA = new Date(a.payment_date || a.created_at || 0);
        const dateB = new Date(b.payment_date || b.created_at || 0);
        return dateB - dateA;
      });
    } else if (activeTab === "Sent") {
      dataToFilter = receiptData?.send || [];
    } else if (activeTab === "Unsent") {
      dataToFilter = receiptData?.unsend || [];
    }

    const filtered =
      dataToFilter.length > 0
        ? dataToFilter.filter(
            (user) =>
              user.client_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              user.client_contact?.includes(searchQuery)
          )
        : [];

    setFilteredAndSearchedUsers(filtered);
    setFrontendCurrentPage(1);

    setSelectedUnsentItems(new Set());
  }, [activeTab, receiptData, searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setFrontendCurrentPage(1);
    setBackendCurrentPage(1);
    setSelectedUnsentItems(new Set());
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [viewMode]);

  const handleMonthSelection = useCallback((month) => {
    setLocalSelectedMonth(month);
  }, []);

  const handleYearSelection = useCallback((year) => {
    setLocalSelectedYear(year);
  }, []);

  const handleApplyMonthFilter = useCallback(() => {
    setShowMonthModal(false);
  }, []);

  const handleViewModeToggle = () => {
    setViewMode(viewMode === "monthly" ? "all" : "monthly");
  };

  const handleBackendPageChange = (page) => {
    setBackendCurrentPage(page);
  };

  const tabs = [
    { id: "All", label: "All" },
    { id: "Sent", label: "Sent" },
    { id: "Unsent", label: "Unsent" },
  ];

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const getItemId = useCallback((item) => {
    return item.receipt_id || item.id || item.invoice_number || item.client_id;
  }, []);

  const handleSelectUnsentItem = useCallback((itemId) => {
    setSelectedUnsentItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllUnsent = useCallback(() => {
    const unsentItems = filteredAndSearchedUsers.filter(
      (item) => item.status === "unsent"
    );

    const allUnsentIds = unsentItems.map((item) => getItemId(item));
    const areAllSelected =
      allUnsentIds.length > 0 &&
      allUnsentIds.every((id) => selectedUnsentItems.has(id));

    if (areAllSelected) {
      setSelectedUnsentItems(new Set());
    } else {
      setSelectedUnsentItems(new Set(allUnsentIds));
    }
  }, [filteredAndSearchedUsers, selectedUnsentItems, getItemId]);

  const handleSendSelected = useCallback(async () => {
    if (selectedUnsentItems.size === 0) {
      showToast({
        type: "warning",
        title: "No items selected",
      });
      return;
    }

    Alert.alert(
      "Send Receipts",
      `Are you sure you want to send ${selectedUnsentItems.size} receipt(s)?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          style: "default",
          onPress: async () => {
            setIsSending(true);
            try {
              const selectedIds = Array.from(selectedUnsentItems);
              const response = await SendReceiptsToPaidMembers(selectedIds);
              if (response?.status == 200) {
                showToast({
                  type: "success",
                  title: `${selectedUnsentItems.size} receipt(s) sent successfully`,
                });
              } else {
                throw new Error(response?.detail || "Failed to send receipts");
              }
              setSelectedUnsentItems(new Set());
              fetchReceiptData();
            } catch (error) {
              showToast({
                type: "error",
                title: "Failed to send receipts",
              });
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  }, [selectedUnsentItems, fetchReceiptData]);

  const getPaginationData = () => {
    if (viewMode === "all" && paginationInfo) {
      let totalPages, totalItems;

      if (activeTab === "All") {
        totalPages = Math.max(
          paginationInfo.total_pages_sent || 1,
          paginationInfo.total_pages_unsent || 1
        );
        totalItems =
          (paginationInfo.total_sent || 0) + (paginationInfo.total_unsent || 0);
      } else if (activeTab === "Sent") {
        totalPages = paginationInfo.total_pages_sent;
        totalItems = paginationInfo.total_sent;
      } else {
        totalPages = paginationInfo.total_pages_unsent;
        totalItems = paginationInfo.total_unsent;
      }

      return {
        currentPage: backendCurrentPage,
        totalPages: Math.max(1, totalPages),
        totalItems,
        onPageChange: handleBackendPageChange,
        allUsers: filteredAndSearchedUsers,
        isPaginated: false,
      };
    } else {
      return {
        currentPage: frontendCurrentPage,
        totalPages: Math.max(
          1,
          Math.ceil(filteredAndSearchedUsers.length / frontendItemsPerPage)
        ),
        totalItems: filteredAndSearchedUsers.length,
        onPageChange: setFrontendCurrentPage,
        allUsers: filteredAndSearchedUsers,
        isPaginated: true,
      };
    }
  };

  const paginationData = getPaginationData();

  const hasSelectableUnsentItems =
    activeTab === "All" &&
    filteredAndSearchedUsers.some((item) => item.status === "unsent");

  const renderZeroDataState = () => {
    let message = "";
    if (activeTab === "All") {
      message = "No receipts found";
    } else if (activeTab === "Sent") {
      message = "No sent receipts found";
    } else {
      message = "No unsent receipts found";
    }

    return (
      <View style={styles.zeroDataContainer}>
        <Icon name="inbox" size={60} color="#C0C0C0" />
        <Text style={styles.zeroDataTitle}>{message}</Text>
        <Text style={styles.zeroDataSubtitle}>
          {viewMode === "monthly"
            ? `No data available for ${localSelectedMonth} ${localSelectedYear}`
            : "Try adjusting your search or filter criteria"}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <NewOwnerHeader
        text={"Receipt List"}
        onBackButtonPress={() => {
          router.push("/owner/home");
        }}
      />

      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "monthly" && styles.activeViewMode,
          ]}
          onPress={() => setViewMode("monthly")}
        >
          <Icon
            name="calendar"
            size={16}
            color={viewMode === "monthly" ? "#fff" : "#10A0F6"}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === "monthly" && styles.activeViewModeText,
            ]}
          >
            Monthly View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "all" && styles.activeViewMode,
          ]}
          onPress={() => setViewMode("all")}
        >
          <Icon
            name="list"
            size={16}
            color={viewMode === "all" ? "#fff" : "#10A0F6"}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === "all" && styles.activeViewModeText,
            ]}
          >
            All Receipts
          </Text>
        </TouchableOpacity>
      </View>

      <TabHeader
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabPress}
      />

      <View style={styles.searchAndFilterContainer}>
        <SearchBarWithFilterButton
          placeholder="Search by name or contact"
          style={styles.searchContainer}
          inputStyle={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClearText={handleClearSearch}
          onFilterPress={() => setShowMonthModal(true)}
          selectedMonth={localSelectedMonth}
          selectedYear={localSelectedYear}
          showFilter={viewMode === "monthly"}
          ref={searchInputRef}
        />
      </View>

      {hasSelectableUnsentItems && (
        <View style={styles.selectionActionsContainer}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAllUnsent}
          >
            <Text style={styles.selectAllText}>
              {filteredAndSearchedUsers
                .filter((item) => item.status === "unsent")
                .every((item) => selectedUnsentItems.has(getItemId(item)))
                ? "Deselect All Unsent"
                : "Select All Unsent"}
            </Text>
          </TouchableOpacity>

          {selectedUnsentItems.size > 0 && (
            <TouchableOpacity
              style={[
                styles.sendButton,
                isSending && styles.sendButtonDisabled,
              ]}
              onPress={handleSendSelected}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={16} color="#fff" />
              )}
              <Text style={styles.sendButtonText}>
                {isSending
                  ? "Sending..."
                  : `Send (${selectedUnsentItems.size})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <MonthSelectorModal
        visible={showMonthModal}
        onClose={() => setShowMonthModal(false)}
        onSelectMonth={handleMonthSelection}
        selectedMonth={localSelectedMonth}
        selectedYear={localSelectedYear}
        onSelectYear={handleYearSelection}
        handleApply={handleApplyMonthFilter}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10A0F6" />
          <Text style={styles.loadingText}>
            Loading {viewMode === "monthly" ? "Monthly" : "All"} Receipt Data...
          </Text>
        </View>
      ) : filteredAndSearchedUsers.length === 0 ? (
        renderZeroDataState()
      ) : (
        <RenderAboutToExpirePage
          isAboutToExpireModalOpen={isAboutToExpireModalOpen}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
          SetShowInvoice={SetShowInvoice}
          showInvoice={showInvoice}
          setShowModifyModal={setShowModifyModal}
          showModifyModal={showModifyModal}
          onUpdateDiscount={(id, newDiscount, newFee, newDescription) => {}}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchInvoiceData={fetchReceiptData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          heading={viewMode === "monthly" ? "Monthly Receipts" : "All Receipts"}
          title={"Receipt"}
          isLoading={isLoading}
          flatListRef={flatListRef}
          allUsers={paginationData.allUsers}
          currentPage={paginationData.currentPage}
          setCurrentPage={paginationData.onPageChange}
          itemsPerPage={
            viewMode === "all" ? backendItemsPerPage : frontendItemsPerPage
          }
          localSelectedMonth={
            viewMode === "monthly" ? localSelectedMonth : null
          }
          localSelectedYear={viewMode === "monthly" ? localSelectedYear : null}
          paginationInfo={viewMode === "all" ? paginationInfo : null}
          viewMode={viewMode}
          selectedUnsentItems={selectedUnsentItems}
          onSelectUnsentItem={handleSelectUnsentItem}
          showCheckboxes={activeTab === "All"}
          getItemId={getItemId}
        />
      )}

      <ReceiptModal
        visible={showInvoice}
        onClose={() => {
          SetShowInvoice(false);
        }}
        gymData={particularInvoiceData}
        invoice={{
          id: particularInvoiceData?.invoice_number,
          name: particularInvoiceData?.client_name || "Client Name",
          address:
            particularInvoiceData?.gym_location ||
            "228 Park Avenue, New York, USA",
          contact: particularInvoiceData?.client_contact || "+1 123 456 7890",
          paymentMethod: particularInvoiceData?.payment_method,
          paymentReferenceNumber:
            particularInvoiceData?.payment_reference_number,
          bankDetails: particularInvoiceData?.bank_details,
          IFSC: particularInvoiceData?.ifsc_code,
          account_holder_name: particularInvoiceData?.account_holder_name,
          branch: particularInvoiceData?.branch,
          discount:
            particularInvoiceData?.fees > 0
              ? ((particularInvoiceData?.fees -
                  particularInvoiceData?.discounted_fees) /
                  particularInvoiceData?.fees) *
                100
              : 0,
          total: particularInvoiceData?.fees,
          gymName: particularInvoiceData?.gym_name || "Fitness Gym",
          gymAddress:
            particularInvoiceData?.gym_location ||
            "123 Fitness St, Gym City, USA",
          gstType: particularInvoiceData?.gst_type,
          gstPercentage:
            particularInvoiceData?.gst_type !== "no_gst"
              ? parseFloat(particularInvoiceData?.gst_percentage) || 0
              : 0,
          items: [
            {
              date: particularInvoiceData?.payment_date,
              description:
                particularInvoiceData?.plan_description || "Gym Membership",
              method: particularInvoiceData?.payment_method,
              amount: particularInvoiceData?.fees || 0,
            },
          ],
        }}
      />
    </View>
  );
};

export default PaidMembersReceiptListPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  viewModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10A0F6",
    backgroundColor: "#fff",
  },
  activeViewMode: {
    backgroundColor: "#10A0F6",
  },
  viewModeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#10A0F6",
  },
  activeViewModeText: {
    color: "#fff",
  },
  searchAndFilterContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    borderRadius: 8,
    height: 50,
  },
  searchInput: {
    fontSize: 16,
  },
  selectionActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#10A0F6",
  },
  selectAllText: {
    color: "#10A0F6",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10A0F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  zeroDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  zeroDataTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  zeroDataSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
