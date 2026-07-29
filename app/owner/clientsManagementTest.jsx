import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { DataTable, Searchbar } from "react-native-paper";
import OwnerHeader from "../../components/ui/OwnerHeader";

import { getToken } from "../../utils/auth";
import { fetchImportDataAPI } from "../../services/Api";
import ClientRow from "../../components/client/ClientRow";
import FilterModalForUnverifiedUser from "../../components/client/FilterModal2";
import NavigationBarVersion2 from "../../components/navbars/NavigationBarVersion2";
import { showToast } from "../../utils/Toaster";

// Action Button Component
const ActionButton = ({ title, icon, onPress, color, disabled }) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { backgroundColor: color },
      disabled && styles.disabledButton,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <FontAwesome5 name={icon} size={16} color="#FFF" />
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Empty State Component
const EmptyState = ({ activeTab }) => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons
      name="message-text-outline"
      size={80}
      color="#D1D5DB"
    />
    <Text style={styles.emptyStateTitle}>
      No {activeTab.toLowerCase()} messages found
    </Text>
    <Text style={styles.emptyStateDescription}>
      {activeTab === "Sent"
        ? "No sent messages found for your clients."
        : "You haven't created any messages to send yet."}
    </Text>
  </View>
);

// SearchBar with Filter Button
const SearchBarWithFilterButton = ({
  placeholder,
  value,
  onChangeText,
  onClearText,
  onFilterPress,
  selectedMonth,
  selectedYear,
}) => (
  <View style={styles.searchAndFilterContainer}>
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        style={styles.searchBar}
        iconColor="#6B7280"
        onClear={onClearText}
      />
    </View>
    <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
      <FontAwesome5 name="filter" size={16} color="#FFF" />
      {selectedMonth && selectedYear && (
        <Text
          style={styles.filterButtonText}
        >{`${selectedMonth}/${selectedYear}`}</Text>
      )}
    </TouchableOpacity>
  </View>
);

// Pagination Controls
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => (
  <View style={paginationStyles.controls}>
    <TouchableOpacity
      style={[
        paginationStyles.pageButton,
        currentPage === 1 && paginationStyles.disabledButton,
      ]}
      onPress={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <Ionicons
        name="chevron-back"
        size={16}
        color={currentPage === 1 ? "#9CA3AF" : "#4F46E5"}
      />
    </TouchableOpacity>

    <View style={paginationStyles.pageIndicator}>
      <Text style={paginationStyles.pageText}>
        {currentPage} of {totalPages}
      </Text>
    </View>

    <TouchableOpacity
      style={[
        paginationStyles.pageButton,
        currentPage === totalPages && paginationStyles.disabledButton,
      ]}
      onPress={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      <Ionicons
        name="chevron-forward"
        size={16}
        color={currentPage === totalPages ? "#9CA3AF" : "#4F46E5"}
      />
    </TouchableOpacity>
  </View>
);

// Main Component
const ClientsManagement = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("Sent");
  const [status, setStatus] = useState("active"); // For filtering active/inactive clients
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsProgress, setSmsProgress] = useState({ sent: 0, total: 0 });
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [localSelectedMonth, setLocalSelectedMonth] = useState(null);
  const [localSelectedYear, setLocalSelectedYear] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedClients, setPaginatedClients] = useState([]);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const itemsPerPage = 10;
  const flatListRef = useRef(null);

  // Filter clients based on active tab, search query, and status
  const filteredClients = clients.filter((client) => {
    const matchesTab =
      activeTab === "Sent"
        ? client.smsStatus === "sent"
        : client.smsStatus !== "sent";
    const matchesStatus = client.status === status;
    const matchesSearch =
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact?.includes(searchQuery);

    return matchesTab && matchesStatus && matchesSearch;
  });

  // Calculate total pages for pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / itemsPerPage),
  );

  // Handle pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedClients(filteredClients.slice(startIndex, endIndex));

    // Scroll to top when page changes
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage, filteredClients, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fetch clients data
  const fetchClients = async () => {
    const gymId = await getToken("gym_id");
    try {
      setIsLoading(true);
      const response = await fetchImportDataAPI(gymId);
      if (response.status === 200) {
        // Let's assume the API returns clients with a smsStatus field
        // If it doesn't, you'll need to modify this accordingly
        setClients(response?.all_clients || []);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch clients",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to fetch clients",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Reset pagination when tab or status changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]);
    setIsSelectAll(false);
  }, [activeTab, status]);

  // Handle tab change
  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle filter change
  const handleFilterChange = (newStatus) => {
    setStatus(newStatus);
    setFilterModalVisible(false);
  };

  // Handle search query change
  const handleQueryChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Clear search query
  const handleClearText = () => {
    setSearchQuery("");
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedClients.map((client) => client.import_id));
    }
    setIsSelectAll(!isSelectAll);
  };

  // Toggle select single item
  const toggleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle sending SMS
  const handleSendSMS = async () => {
    if (selectedItems.length === 0) return;

    try {
      setSendingSMS(true);
      setSmsProgress({ sent: 0, total: selectedItems.length });

      // Simulate sending SMS (replace with actual API call)
      for (let i = 0; i < selectedItems.length; i++) {
        // Simulate API call to send SMS
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update progress
        setSmsProgress({ sent: i + 1, total: selectedItems.length });
      }

      // Refresh data after sending all SMS
      await fetchClients();

      // Clear selections
      setSelectedItems([]);
      setIsSelectAll(false);

      showToast({
        type: "success",
        title: "All messages sent successfully!",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: error.message || "Failed to send messages",
      });
    } finally {
      setSendingSMS(false);
    }
  };

  // Handle month selection
  const handleMonthSelection = (month) => {
    setLocalSelectedMonth(month);
  };

  // Handle year selection
  const handleYearSelection = (year) => {
    setLocalSelectedYear(year);
  };

  // Apply date filter
  const handleApply = () => {
    // Apply the filter logic here
    setShowMonthModal(false);
  };

  // Render pagination info
  const renderPaginationInfo = () => (
    <Text style={paginationStyles.info}>
      Showing {paginatedClients.length} of {filteredClients.length} clients
    </Text>
  );

  // Render pagination loader
  const renderPaginationLoader = () => {
    if (!paginationLoading) return null;
    return (
      <View style={paginationStyles.loaderContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
        <Text style={paginationStyles.loaderText}>Loading more...</Text>
      </View>
    );
  };

  // Render user item
  const renderUserItem = ({ item, index }) => (
    <ClientRow
      client={item}
      index={index}
      isSelected={selectedItems.includes(item.import_id)}
      onToggleSelect={() => toggleSelectItem(item.import_id)}
      selectable={activeTab === "Unsent"}
    />
  );

  // Custom List Header Component
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <NavigationBarVersion2
        tabs={["Sent", "Unsent"]}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      <SearchBarWithFilterButton
        placeholder="Search by name or contact"
        value={searchQuery}
        onChangeText={handleQueryChange}
        onClearText={handleClearText}
        onFilterPress={() => setFilterModalVisible(true)}
        selectedMonth={localSelectedMonth}
        selectedYear={localSelectedYear}
      />

      {activeTab === "Unsent" && paginatedClients.length > 0 && (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={toggleSelectAll}
            disabled={sendingSMS || paginatedClients.length === 0}
          >
            <FontAwesome5
              name={isSelectAll ? "check-square" : "square"}
              size={18}
              color="#10A0F6"
            />
            <Text style={styles.selectButtonText}>
              {isSelectAll ? "Unselect All" : "Select All"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (selectedItems.length === 0 || sendingSMS) &&
                styles.disabledButton,
            ]}
            onPress={handleSendSMS}
            disabled={selectedItems.length === 0 || sendingSMS}
          >
            {sendingSMS ? (
              <Text style={styles.sendButtonText}>
                Sending {smsProgress.sent}/{smsProgress.total}
              </Text>
            ) : (
              <>
                <FontAwesome5 name="paper-plane" size={16} color="white" />
                <Text style={styles.sendButtonText}>
                  Send ({selectedItems.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {sendingSMS && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${(smsProgress.sent / smsProgress.total) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Sending messages... {smsProgress.sent}/{smsProgress.total}
          </Text>
        </View>
      )}

      <DataTable style={styles.dataTable}>
        <DataTable.Header style={styles.tableHeader}>
          {activeTab === "Unsent" && (
            <DataTable.Title style={{ flex: 0.5 }}></DataTable.Title>
          )}
          <DataTable.Title style={{ flex: 0.5 }}>S No.</DataTable.Title>
          <DataTable.Title style={{ flex: 2 }}>Client Info</DataTable.Title>
          <DataTable.Title style={{ flex: 2 }}>Contact</DataTable.Title>
          <DataTable.Title style={{ flex: 1.5 }}>Status</DataTable.Title>
        </DataTable.Header>
      </DataTable>
    </View>
  );

  // Render no data component
  const NoDataComponent = ({ title }) => <EmptyState activeTab={activeTab} />;

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <OwnerHeader />

      <Animatable.View animation="fadeIn" style={styles.content}>
        <Text style={styles.pageTitle}>Messages Management</Text>

        <FlatList
          ref={flatListRef}
          data={paginatedClients}
          keyExtractor={(item) => item.import_id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 10 }}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            paginationLoading ? (
              renderPaginationLoader()
            ) : (
              <NoDataComponent title={`No ${activeTab} Messages Found`} />
            )
          }
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          initialNumToRender={itemsPerPage}
          maxToRenderPerBatch={itemsPerPage}
          windowSize={itemsPerPage}
        />

        {/* Pagination section */}
        {filteredClients.length > 0 && (
          <View style={paginationStyles.footer}>
            {renderPaginationInfo()}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </View>
        )}
      </Animatable.View>

      {/* Filter Modal */}
      <FilterModalForUnverifiedUser
        visible={filterModalVisible}
        onDismiss={() => setFilterModalVisible(false)}
        activeStatus={status}
        onStatusChange={handleFilterChange}
      />
    </View>
  );
};

// Main styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  searchAndFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    height: 48,
  },
  filterButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  filterButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "500",
  },
  dataTable: {
    marginBottom: 8,
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  selectButtonText: {
    marginLeft: 8,
    color: "#10A0F6",
    fontWeight: "500",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  sendButtonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "500",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

// Pagination styles
const paginationStyles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  info: {
    fontSize: 12,
    color: "#6B7280",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    marginHorizontal: 8,
  },
  pageText: {
    fontSize: 12,
    color: "#4B5563",
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#6B7280",
  },
});

export default ClientsManagement;
