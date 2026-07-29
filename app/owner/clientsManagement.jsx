import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  TextInput,
} from "react-native";
import * as Animatable from "react-native-animatable";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
} from "@expo/vector-icons";
import { DataTable, Badge, Checkbox } from "react-native-paper";
import { getToken } from "../../utils/auth";
import {
  fetchImportDataAPI,
  ImportDataAPI,
  sendIntimationsAPI,
} from "../../services/Api";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import PaginationControls from "../../components/ui/PaginationControls";
import ImportResultModal from "../../components/client/ImportResultModal";
import GetGymClientDataInstructionModal from "../../components/client/GetGymClientDataInstructionModal";
import ImportClientsSkeleton from "../../components/ui/loaders/importClientsSkeleton";
import { showToast } from "../../utils/Toaster";
import RNPickerSelect from "react-native-picker-select";
const ActionButton = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionButtonText}>{title}</Text>
    <FontAwesome5
      name={icon}
      size={16}
      color="#fff"
      style={{ marginLeft: 8 }}
    />
  </TouchableOpacity>
);

const EmptyState = () => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons
      name="account-search-outline"
      size={80}
      color="#D1D5DB"
    />
    <Text style={styles.emptyStateTitle}>No clients found</Text>
    <Text style={styles.emptyStateDescription}>
      Try adjusting your search or filter criteria.
    </Text>
  </View>
);

const FilterModal = ({
  visible,
  onClose,
  filters,
  setFilters,
  applyFilters,
  resetFilters,
}) => {
  const handleApply = () => {
    applyFilters();
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    onClose();
  };

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const smsOptions = [
    { label: "All", value: "all" },
    { label: "Sent", value: "sent" },
    { label: "Unsent", value: "unsent" },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.centeredView}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.modalView}>
              <View style={modalStyles.header}>
                <Text style={modalStyles.headerTitle}>Filter Clients</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={modalStyles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={modalStyles.filterSection}>
                <Text style={modalStyles.sectionTitle}>Client Status</Text>
                <View style={modalStyles.pickerContainer}>
                  <RNPickerSelect
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                    items={statusOptions}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={filterPickerStyles}
                    placeholder={{}}
                    Icon={() => (
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    )}
                    useNativeAndroidPickerStyle={false}
                    fixAndroidTouchableBug={true}
                  />
                </View>
              </View>

              <View style={modalStyles.divider} />

              <View style={modalStyles.filterSection}>
                <Text style={modalStyles.sectionTitle}>SMS Status</Text>
                <View style={modalStyles.pickerContainer}>
                  <RNPickerSelect
                    value={filters.sms}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, sms: value }))
                    }
                    items={smsOptions}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={filterPickerStyles}
                    placeholder={{}}
                    Icon={() => (
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    )}
                    useNativeAndroidPickerStyle={false}
                    fixAndroidTouchableBug={true}
                  />
                </View>
              </View>

              <View style={modalStyles.actionButtons}>
                <TouchableOpacity
                  style={modalStyles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={modalStyles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={modalStyles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

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

const ClientsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const itemsPerPage = 25;
  const flatListRef = useRef(null);
  const isUpdatingSelectAll = useRef(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [instructionModalVisible, setInstructionModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    sms: "all",
  });

  const applyFilters = () => {
    setFiltersApplied(!(filters.status === "all" && filters.sms === "all"));
    setCurrentPage(1);
    setSelectedClients([]);
    setSelectAll(false);
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      sms: "all",
    });
    setFiltersApplied(false);
    setCurrentPage(1);
    setSelectedClients([]);
    setSelectAll(false);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSmsStatus =
        filters.sms === "all" ||
        (filters.sms === "sent" && client.sms_status) ||
        (filters.sms === "unsent" && !client.sms_status);

      const matchesActiveStatus =
        filters.status === "all" ||
        (filters.status === "active" && client.status === "active") ||
        (filters.status === "inactive" && client.status === "inactive");

      const matchesSearch =
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.admission_number
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        client.contact?.includes(searchQuery);

      return matchesSmsStatus && matchesActiveStatus && matchesSearch;
    });
  }, [clients, filters, searchQuery]);

  const getPaginatedClients = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, itemsPerPage]);

  const fetchClients = async () => {
    const gymId = await getToken("gym_id");
    if (!gymId) {
      showToast({
        type: "error",
        title: "Failed to fetch clients",
      });
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetchImportDataAPI(gymId);
      if (response.status === 200) {
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
        title: "Failed to fetch clients",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectAll && !isUpdatingSelectAll.current) {
      const currentPageClients = getPaginatedClients();
      setSelectedClients(currentPageClients.map((client) => client.import_id));
    }
  }, [selectAll, getPaginatedClients]);

  useEffect(() => {
    if (isUpdatingSelectAll.current) return;

    const currentPageClients = getPaginatedClients();
    if (currentPageClients.length === 0) return;

    const allSelected =
      currentPageClients.length > 0 &&
      currentPageClients.every((client) =>
        selectedClients.includes(client.import_id)
      );

    if (allSelected !== selectAll) {
      isUpdatingSelectAll.current = true;
      setSelectAll(allSelected);
      setTimeout(() => {
        isUpdatingSelectAll.current = false;
      }, 0);
    }
  }, [selectedClients, getPaginatedClients, selectAll]);

  const toggleSelectClient = (clientId) => {
    setSelectedClients((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleImport = async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
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
          // fetchClients();
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

      // Use SAF (Storage Access Framework) to save file
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        showToast({
          type: "error",
          title: "Storage permission is required to save the file",
        });
        return;
      }

      // Create file in the selected directory
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Write the Excel data to the file using SDK 54 File API
      const file = new FileSystem.File(fileUri);
      await file.write(excelBuffer, { encoding: FileSystem.EncodingType.Base64 });

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

  const toggleSelectAll = useCallback(() => {
    isUpdatingSelectAll.current = true;

    if (!selectAll) {
      const currentPageClients = getPaginatedClients();
      setSelectedClients(currentPageClients.map((client) => client.import_id));
      setSelectAll(true);
    } else {
      setSelectedClients([]);
      setSelectAll(false);
    }
    setTimeout(() => {
      isUpdatingSelectAll.current = false;
    }, 0);
  }, [selectAll, getPaginatedClients]);

  const handleSendSMS = async () => {
    if (selectedClients.length === 0) {
      showToast({
        type: "error",
        title: "No clients selected",
      });
      return;
    }
    const gymId = await getToken("gym_id");
    try {
      setLoading(true);
      const payload = {
        gym_id: gymId,
        import_ids: selectedClients,
      };
      const response = await sendIntimationsAPI(payload);
      if (response.status === 200) {
        showToast({
          type: "success",
          title: response?.message || "SMS sent successfully",
        });
        fetchClients();
        setSelectedClients([]);
        setSelectAll(false);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to send SMS",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to send SMS",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > Math.ceil(filteredClients.length / itemsPerPage)) {
      return;
    }
    setCurrentPage(page);
    setSelectedClients([]);
    setSelectAll(false);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / itemsPerPage)
  );

  const renderPaginationInfo = () => {
    const start = Math.min(
      (currentPage - 1) * itemsPerPage + 1,
      filteredClients.length
    );
    const end = Math.min(currentPage * itemsPerPage, filteredClients.length);
    const total = filteredClients.length;

    return (
      <Text style={paginationStyles.infoText}>
        Showing {start} - {end} of {total} clients
      </Text>
    );
  };

  const renderClientRow = ({ item, index }) => {
    const isSelected = selectedClients.includes(item.import_id);
    const showCheckbox =
      filtersApplied && filters.sms === "unsent" && !item.sms_status;

    return (
      <View
        style={[
          styles.clientRow,
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
        ]}
      >
        {showCheckbox ? (
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => toggleSelectClient(item.import_id)}
              color="#22426B"
            />
          </View>
        ) : (
          <View style={styles.clientIndex}>
            <Text style={styles.clientNumber}>
              {(currentPage - 1) * itemsPerPage + index + 1}
            </Text>
          </View>
        )}

        <View style={styles.clientInfo}>
          <View style={styles.nameContainer}>
            {item.verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#10B981"
                style={styles.verifiedIcon}
              />
            )}
            <Text
              style={styles.clientName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome name="id-card" size={12} color="#666" />
            <Text style={styles.detailText}>
              {item.admission_number || `ABC00${index + 1}`}
              {"   "}
            </Text>
            <FontAwesome name="phone" size={12} color="#666" />
            <Text style={styles.detailText}>{item.contact}</Text>
          </View>
        </View>
        <View style={styles.clientStatus}>
          <Badge
            style={{
              backgroundColor: item.status === "active" ? "#10B981" : "#F59E0B",
              marginRight: 5,
              width: "45",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            {item.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <Badge
            style={{
              backgroundColor: item.sms_status ? "#22426B" : "#EF4444",
              width: "45",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            {item.sms_status ? "Sent" : "Unsent"}
          </Badge>
        </View>
      </View>
    );
  };

  const SearchSection = useMemo(
    () => (
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search clients..."
          onChange={setSearchQuery}
          query={searchQuery}
          onPress={() => setFilterModalVisible(true)}
        />
      </View>
    ),
    [searchQuery, setSearchQuery, setFilterModalVisible]
  );

  const unsentSmsFilter = filters.sms === "unsent";
  const showSelectAll = filtersApplied && unsentSmsFilter;

  const unsentClientsCount = useMemo(() => {
    return getPaginatedClients().filter((client) => !client.sms_status).length;
  }, [getPaginatedClients]);

  return (
    <SafeAreaView style={styles.container}>
      <Animatable.View animation="fadeIn" style={styles.content}>
        <View style={styles.searchAndActionsContainer}>
          <View style={styles.searchContainer}>{SearchSection}</View>

          {showSelectAll && unsentClientsCount > 0 && (
            <View style={styles.actionsWrapper}>
              <TouchableOpacity
                style={styles.selectAllContainer}
                onPress={toggleSelectAll}
              >
                <Checkbox
                  status={selectAll ? "checked" : "unchecked"}
                  onPress={toggleSelectAll}
                  color="#22426B"
                />
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>

              <ActionButton
                title={`Send SMS (${selectedClients.length})`}
                icon="paper-plane"
                onPress={handleSendSMS}
              />
            </View>
          )}
        </View>

        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title
            style={[{ flex: 0.6 }, styles.tableTitle]}
            textStyle={{ color: "#000000" }}
          >
            {showSelectAll ? "" : "S No."}
          </DataTable.Title>
          <DataTable.Title
            style={{ flex: 2, color: "#000000" }}
            textStyle={{ color: "#000000" }}
          >
            Client Info
          </DataTable.Title>
          <DataTable.Title style={{ flex: 1 }} textStyle={{ color: "#000000" }}>
            Status
          </DataTable.Title>
        </DataTable.Header>

        {isLoading ? (
          <ImportClientsSkeleton priority="high" />
        ) : filteredClients.length > 0 ? (
          <View style={styles.flatListContainer}>
            <FlatList
              data={getPaginatedClients()}
              keyExtractor={(item) => item.import_id.toString()}
              renderItem={renderClientRow}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ref={flatListRef}
            />
          </View>
        ) : (
          <EmptyState />
        )}

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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.overlayText}>Sending SMS...</Text>
        </View>
      )}

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

      <View style={styles.floatingActionContainer}>
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={() => {
            setInstructionModalVisible(true);
          }}
        >
          <Ionicons
            name="cloud-download-outline"
            color="#fff"
            size={20}
          ></Ionicons>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ClientsManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#22426B",
    minWidth: 130,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  flatListContainer: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
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
  clientRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  evenRow: {
    backgroundColor: "#FFFFFF",
  },
  oddRow: {
    backgroundColor: "#F9FAFB",
  },
  checkboxContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  clientIndex: {
    flex: 0.6,
    justifyContent: "center",
  },
  clientNumber: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  clientInfo: {
    flex: 2,
    justifyContent: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  verifiedIcon: {
    marginRight: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  clientDetail: {
    fontSize: 14,
    color: "#6B7280",
  },
  clientContact: {
    flex: 2,
    justifyContent: "center",
  },
  clientStatus: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: "80%",
  },
  searchAndActionsContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  actionsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 4,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
  },
  floatingActionContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 130 : 80,
    right: 20,
    zIndex: 1000,
  },
  floatingActionButton: {
    height: 60,
    width: 60,
    borderRadius: 100,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22426B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderwidth: 1,
    borderColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

const paginationStyles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: Platform.OS === "ios" ? 35 : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  infoText: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "left",
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  closeButton: {
    fontSize: 16,
    color: "#000",
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22426B",
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    minHeight: 50,
  },
  // picker: {
  //   height: 50,
  //   width: "100%",
  //   color: "#4B5563",
  // },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22426B",
    width: "48%",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#22426B",
    fontWeight: "500",
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#22426B",
    width: "48%",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  tableTitle: {
    color: "#000000",
  },
});

const filterPickerStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0,
    borderRadius: 8,
    color: "#4B5563",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: 50,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 8,
    color: "#4B5563",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: 50,
  },
  placeholder: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 5 : 5,
    right: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
