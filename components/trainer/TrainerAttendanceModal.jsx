import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axiosInstance from "../../services/axiosInstance";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import MonthSelectorModal from "../home/MonthSelectorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const TrainerAttendanceModal = ({ visible, onClose, trainer = null }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const insets = useSafeAreaInsets();
  // Month selector modal states
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Helper function to convert month name to number
  const getMonthNumber = (monthName) => {
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
    return months.indexOf(monthName) + 1;
  };

  // Helper function to convert month number to name
  const getMonthName = (monthNumber) => {
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
    return months[monthNumber - 1];
  };

  // Initialize with current month
  useEffect(() => {
    const currentMonth = getMonthName(new Date().getMonth() + 1);
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (visible && trainer && selectedMonth) {
      fetchTrainerAttendance();
    }
  }, [visible, trainer, selectedMonth, selectedYear]);

  const fetchTrainerAttendance = async () => {
    if (!trainer?.trainer_id) return;

    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const response = await axiosInstance.get(
        `/trainer-attendance/monthly/${trainer.trainer_id}`,
        {
          params: {
            gym_id: gymId,
            month: getMonthNumber(selectedMonth),
            year: selectedYear,
          },
        }
      );

      if (response?.data?.status === 200) {
        setAttendanceData(response.data);
      } else {
        showToast({
          type: "error",
          title: "Failed to fetch attendance data",
        });
      }
    } catch (error) {
      console.error("Error fetching trainer attendance:", error);
      showToast({
        type: "error",
        title: "Error fetching trainer attendance data",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "N/A") return timeString || "N/A";

    try {
      const [hours, minutes] = timeString.split("T")[1].split(":");
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString || "N/A";
    }
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
  };

  const handleSelectYear = (year) => {
    setSelectedYear(year);
  };

  const handleApplyMonthYear = () => {
    setShowMonthSelector(false);
  };

  const toggleCardExpansion = (itemDate) => {
    setExpandedCardId(expandedCardId === itemDate ? null : itemDate);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch (error) {
      return dateString || "Unknown Date";
    }
  };

  const renderAttendanceItem = ({ item }) => {
    const isExpanded = expandedCardId === item.date;
    const hasMultipleSessions =
      item.punch_sessions && item.punch_sessions.length > 1;
    const latestSession =
      item.punch_sessions && item.punch_sessions.length > 0
        ? item.punch_sessions[item.punch_sessions.length - 1]
        : null;

    return (
      <View style={styles.modernAttendanceItem}>
        <View style={styles.attendanceMainContent}>
          <View style={styles.modernProfileContainer}>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              {hasMultipleSessions && (
                <Text style={styles.sessionCountText}>
                  {String(item.session_count)} sessions
                </Text>
              )}
            </View>
          </View>

          <View style={styles.modernTimeContainer}>
            {latestSession && (
              <>
                <View style={styles.modernTimeCard}>
                  <View style={styles.modernTimeHeader}>
                    <View
                      style={[
                        styles.modernStatusDot,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <Text style={styles.modernTimeTitle}>Entry</Text>
                  </View>
                  <Text style={styles.modernTimeValue}>
                    {formatTime(latestSession.punch_in) || "N/A"}
                  </Text>
                </View>

                <View style={styles.modernTimeCard}>
                  <View style={styles.modernTimeHeader}>
                    <View
                      style={[
                        styles.modernStatusDot,
                        {
                          backgroundColor: latestSession.punch_out
                            ? "#EF4444"
                            : "#94A3B8",
                        },
                      ]}
                    />
                    <Text style={styles.modernTimeTitle}>Exit</Text>
                  </View>
                  <Text
                    style={[
                      styles.modernTimeValue,
                      !latestSession.punch_out && styles.modernPendingText,
                    ]}
                  >
                    {formatTime(latestSession.punch_out) || "Pending"}
                  </Text>
                </View>
              </>
            )}

            {item.total_hours > 0 && (
              <View style={styles.totalHoursCard}>
                <Text style={styles.totalHoursText}>
                  {String(item.total_hours)}h
                </Text>
              </View>
            )}
          </View>

          {hasMultipleSessions && (
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleCardExpansion(item.date)}
            >
              <Ionicons
                name="chevron-down-outline"
                size={20}
                color={isExpanded ? "#7b2cbf" : "#94A3B8"}
                style={[
                  styles.dropdownArrow,
                  isExpanded && styles.dropdownArrowExpanded,
                ]}
              />
            </TouchableOpacity>
          )}
        </View>

        {isExpanded && hasMultipleSessions && (
          <View style={styles.expandedSessionsContainer}>
            <Text style={styles.allSessionsTitle}>All Sessions:</Text>
            {item.punch_sessions.map((session, idx) => (
              <View key={`${item.date}-${idx}`} style={styles.sessionRow}>
                <Text style={styles.sessionNumber}>
                  Session {String(idx + 1)}
                </Text>
                <View style={styles.sessionTimeContainer}>
                  <View style={styles.sessionTimeItem}>
                    <Text style={styles.sessionTimeLabel}>In:</Text>
                    <Text style={styles.sessionTimeValue}>
                      {formatTime(session.punch_in) || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.sessionTimeItem}>
                    <Text style={styles.sessionTimeLabel}>Out:</Text>
                    <Text
                      style={[
                        styles.sessionTimeValue,
                        !session.punch_out && styles.sessionPendingText,
                      ]}
                    >
                      {formatTime(session.punch_out) || "Pending"}
                    </Text>
                  </View>

                  <View style={styles.sessionTimeItem}>
                    <Text style={styles.sessionTimeLabel}>Duration:</Text>
                    <Text style={styles.sessionDurationValue}>
                      {String(session.duration_hours)}h
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {(!item.punch_sessions || item.punch_sessions.length === 0) && (
          <View style={styles.noSessionsContainer}>
            <Text style={styles.noSessionsText}>No attendance recorded</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>No Attendance Data</Text>
      <Text style={styles.emptySubtitle}>
        No attendance records found for {selectedMonth} {String(selectedYear)}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />

      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View>
          <View style={[styles.headerContent]}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Trainer Monthly Attendance</Text>
              {trainer && (
                <Text style={styles.headerSubtitle}>
                  {String(trainer.full_name || "")}
                </Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Month Selector Button */}
        <View style={styles.monthSelectorSection}>
          <TouchableOpacity
            style={styles.monthSelectorButton}
            onPress={() => setShowMonthSelector(true)}
          >
            <View style={styles.monthSelectorContent}>
              <Ionicons name="calendar-outline" size={20} color="#7b2cbf" />
              <Text style={styles.monthSelectorText}>
                {selectedMonth} {String(selectedYear)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Attendance List */}
        <View style={styles.attendanceSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7b2cbf" />
              <Text style={styles.loadingText}>Loading attendance data...</Text>
            </View>
          ) : (
            <FlatList
              data={attendanceData?.daily_records || []}
              keyExtractor={(item) => item.date}
              renderItem={renderAttendanceItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.attendanceList}
              ListEmptyComponent={renderEmptyComponent}
            />
          )}
        </View>
      </View>

      {/* Month Selector Modal */}
      <MonthSelectorModal
        visible={showMonthSelector}
        onClose={() => setShowMonthSelector(false)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectMonth={handleSelectMonth}
        onSelectYear={handleSelectYear}
        handleApply={handleApplyMonthYear}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.9)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  monthSelectorSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthSelectorButton: {
    padding: 16,
  },
  monthSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
  attendanceSection: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  attendanceList: {
    paddingBottom: 20,
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    flexDirection: "column",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  attendanceMainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateSection: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  sessionCountText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    fontStyle: "italic",
  },
  noSessionsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noSessionsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  modernTimeContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  modernTimeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 75,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimeTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  totalHoursCard: {
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#7b2cbf",
  },
  totalHoursText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7b2cbf",
  },
  dropdownButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownArrow: {
    transform: [{ rotate: "0deg" }],
  },
  dropdownArrowExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  expandedSessionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    width: "100%",
  },
  allSessionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    minWidth: 60,
  },
  sessionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sessionTimeItem: {
    alignItems: "center",
    minWidth: 50,
  },
  sessionTimeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  sessionTimeValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E293B",
  },
  sessionPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  sessionDurationValue: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7b2cbf",
  },
});

export default TrainerAttendanceModal;
