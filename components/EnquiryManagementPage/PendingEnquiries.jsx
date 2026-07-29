import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { dateUtils } from "../../utils/date";
import SearchBar from "../ui/SearchBar";
import DateFilterModal from "./DateFilterModal";
import EnquiryCard from "./EnquiryCard";
import StatusFilterModal from "./StatusFilterModal";
import SearchBar111 from "../ui/SearchBar111";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isTablet = width >= 786;

// Pending Enquiries Component with Filters
function PendingEnquiries({ enquiries, updateEnquiryStatus }) {
  const [filteredEnquiries, setFilteredEnquiries] = useState(enquiries);

  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    let filtered = [...enquiries];

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const today = new Date();

      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);

      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);

      filtered = filtered.filter((item) => {
        // Extract just the date part from the datetime string
        const itemDateStr = item.date.split(" ")[0];
        const itemDate = dateUtils.parseDate(itemDateStr);

        switch (dateFilter) {
          case "today":
            return dateUtils.isToday(itemDate);
          case "lastWeek":
            return itemDate >= lastWeek && itemDate <= today;
          case "lastMonth":
            return itemDate >= lastMonth && itemDate <= today;
          default:
            return true;
        }
      });
    }

    setFilteredEnquiries(filtered);
  }, [enquiries, dateFilter, statusFilter]);

  const getFilterDisplay = (type, value) => {
    if (type === "date") {
      switch (value) {
        case "today":
          return "Today";
        case "lastWeek":
          return "Last Week";
        case "lastMonth":
          return "Last Month";
        case "all":
          return "All Dates";
        default:
          return "Filter by Date";
      }
    } else {
      switch (value) {
        case "Pending":
          return "Pending";
        case "Follow Up":
          return "Follow Up";
        // case 'Joined':
        //   return 'Joined';
        case "all":
          return "All Status";
        default:
          return "Filter by Status";
      }
    }
  };

  if (enquiries?.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pending enquiries found</Text>
      </View>
    );
  }

  const handleSearch = (results, query) => {
    setFilteredEnquiries(results);
  };

  return (
    <View style={[styles.enquiriesContainer, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <SearchBar111
          data={filteredEnquiries}
          onSearch={handleSearch}
          searchKeys={["name", "contact"]}
          placeholder="Search by name or contact"
        />

        {/* <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          showFilter={false}
          // onPress={() => setFilterModalVisible(!filterModalVisible)}
        /> */}

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDateFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>
              {getFilterDisplay("date", dateFilter)}
            </Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStatusFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>
              {getFilterDisplay("status", statusFilter)}
            </Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredEnquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No enquiries match your filters</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setDateFilter("all");
              setStatusFilter("all");
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEnquiries}
          keyExtractor={(item) => item?.enquiry_id.toString()}
          renderItem={({ item }) => (
            <EnquiryCard
              enquiry={item}
              updateEnquiryStatus={updateEnquiryStatus}
            />
          )}
          contentContainerStyle={styles.cardList}
        />
      )}

      <DateFilterModal
        showDateFilterModal={showDateFilterModal}
        setShowDateFilterModal={setShowDateFilterModal}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />
      <StatusFilterModal
        showStatusFilterModal={showStatusFilterModal}
        setShowStatusFilterModal={setShowStatusFilterModal}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filterKeyList={["Pending", "Follow Up"]}
      />
    </View>
  );
}

export default PendingEnquiries;

const styles = StyleSheet.create({
  enquiriesContainer: {
    flex: 1,
  },
  header: {
    marginBottom: isTablet ? 20 : 15,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 14,
    // fontWeight: 'bold',
    marginBottom: isTablet ? 25 : 20,
    color: "#007AFF",
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: isTablet ? 15 : 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 8 : 5,
    borderWidth: 0.5,
    borderColor: "#dfe4ea",
    flex: 0.48,
    justifyContent: "space-between",
  },
  filterButtonText: {
    color: "#2c3e50",
    fontSize: isTablet ? 16 : 12,
  },
  filterArrow: {
    fontSize: isTablet ? 14 : 10,
    color: "#7f8c8d",
  },
  cardList: {
    paddingBottom: isTablet ? 30 : 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: isTablet ? 30 : 20,
  },
  emptyText: {
    fontSize: isTablet ? 20 : 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: isTablet ? 20 : 15,
  },
  resetButton: {
    backgroundColor: "#007AFF",
    paddingVertical: isTablet ? 14 : 10,
    paddingHorizontal: isTablet ? 28 : 20,
    borderRadius: isTablet ? 8 : 5,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: isTablet ? 16 : 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: isTablet ? 16 : 10,
    padding: isTablet ? 28 : 20,
    width: "80%",
    maxWidth: isTablet ? 400 : 300,
  },
  modalTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: "bold",
    marginBottom: isTablet ? 20 : 15,
    color: "#2c3e50",
    textAlign: "center",
  },
  filterOption: {
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    borderRadius: isTablet ? 8 : 5,
    marginBottom: isTablet ? 12 : 8,
    backgroundColor: "#bebebe",
  },
  selectedFilter: {
    backgroundColor: "#FF5757",
  },
  filterText: {
    fontSize: isTablet ? 18 : 16,
    color: "#ffffff",
    textAlign: "center",
  },
});
