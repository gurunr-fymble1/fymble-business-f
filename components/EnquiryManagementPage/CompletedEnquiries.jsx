import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Dimensions,
} from "react-native";
import { dateUtils } from "../../utils/date";
import SearchBar from "../ui/SearchBar";
import DateFilterModal from "./DateFilterModal";
import StatusFilterModal from "./StatusFilterModal";
import SearchBar111 from "../ui/SearchBar111";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isTablet = width >= 786;

// Completed Enquiries Component
function CompletedEnquiries({ enquiries }) {
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
        // case 'Pending':
        //   return 'Pending';
        // case 'Follow Up':
        //   return 'Follow Up';
        case "Joined":
          return "Joined";
        case "Rejected":
          return "Rejected";
        case "all":
          return "All Status";
        default:
          return "Filter by Status";
      }
    }
  };

  if (enquiries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No completed enquiries found</Text>
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
          keyExtractor={(item) => item?.enquiry_id}
          renderItem={({ item }) => (
            <View key={item.enquiry_id} style={styles.card}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "Joined"
                    ? styles.statusJoined
                    : styles.statusRejected,
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {/* <Text style={styles.cardSubtitle}>{item.contact}</Text> */}
                <View style={styles.callRow}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() =>
                      Linking.openURL(`tel:${"+91"}${item.contact}`)
                    }
                  >
                    <Ionicons name="call" size={14} color="#007AFF" />
                    <Text style={styles.cardSubtitle2}>{item.contact}</Text>
                  </TouchableOpacity>
                </View>

                {item.email ? (
                  // <Text style={styles.cardSubtitle}>{item.email}</Text>
                  <View style={styles.callRow}>
                    <TouchableOpacity style={styles.callButton}>
                      <Ionicons name="mail" size={14} color="#007AFF" />
                      <Text style={styles.cardSubtitle2}>{item.email}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {item.message ? (
                  <View style={styles.callRow}>
                    <View style={styles.callButton}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#007AFF"
                      />
                      <Text style={styles.cardMessage}>{item.message}</Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.statusInfo}>
                  {/* <Text style={styles.statusLabel}>
                  Status: <Text style={styles.statusValue}>{item.status}</Text>
                </Text> */}
                  {item.statusReason ? (
                    <View style={styles.callRow}>
                      <View style={styles.callButton}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#939393"
                        />
                        <Text style={styles.cardSubtitle2}>
                          {item.statusReason}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
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
        filterKeyList={["Joined", "Rejected"]}
      />
    </View>
  );
}

export default CompletedEnquiries;

const styles = StyleSheet.create({
  enquiriesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 14,
    // fontWeight: 'bold',
    marginBottom: isTablet ? 25 : 20,
    color: "#007AFF",
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
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 14 : 10,
    paddingHorizontal: isTablet ? 20 : 15,
    marginBottom: isTablet ? 18 : 15,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: isTablet ? 14 : 10,
    right: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 5 : 3,
    paddingHorizontal: isTablet ? 10 : 8,
    borderRadius: isTablet ? 14 : 12,
    padding: "auto",
    color: "#fff",
  },
  statusJoined: {
    backgroundColor: "#34C759",
  },
  statusRejected: {
    backgroundColor: "#FF834E",
  },
  statusText: {
    fontSize: isTablet ? 13 : 10,
    // fontWeight: 'bold',
    color: "#fff",
  },
  cardContent: {
    marginTop: isTablet ? 8 : 5,
  },
  cardTitle: {
    fontSize: isTablet ? 18 : 14,
    // fontWeight: 'bold',
    color: "#2c3e50",
    marginBottom: isTablet ? 8 : 5,
  },
  cardSubtitle: {
    fontSize: isTablet ? 15 : 12,
    color: "#7f8c8d",
    marginBottom: isTablet ? 4 : 2,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  cardMessage: {
    fontSize: isTablet ? 15 : 12,
    color: "#34495e",
    // marginTop: 8,
    // marginBottom: 5,
    marginLeft: isTablet ? 8 : 5,
  },
  statusInfo: {
    marginTop: isTablet ? 14 : 10,
    paddingTop: isTablet ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  statusLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "500",
    color: "#34495e",
    marginBottom: isTablet ? 4 : 2,
  },
  statusValue: {
    fontWeight: "normal",
    paddingLeft: isTablet ? 8 : 5,
  },
  header: {
    marginBottom: isTablet ? 20 : 15,
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
  cardSubtitle2: {
    fontSize: isTablet ? 15 : 12,
    color: "#404040",
    marginBottom: isTablet ? 4 : 2,
    marginLeft: isTablet ? 8 : 5,
  },
  callRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  callButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 4,
    // paddingHorizontal: 12,
    // borderRadius: 12,
    // backgroundColor: '#7affce',
    // marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
