import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";

const { width, height } = Dimensions.get("window");

const TodaysAttendanceModal = ({ visible, onClose, insets }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTodaysAttendance();
    }
  }, [visible]);

  const fetchTodaysAttendance = async () => {
    try {
      setLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      const response = await axiosInstance.get(
        `/trainer-attendance/today/${gymId}`
      );
      if (response?.data?.status === 200) {
        const attendance = response.data.trainers || [];
        setAttendanceData(attendance);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to load attendance data",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodaysAttendance();
    setRefreshing(false);
  };

  const getStatusColor = (trainer) => {
    if (trainer.is_currently_active) return "#10B981";
    if (trainer.status === "completed") return "#EF4444";
    if (trainer.status === "absent") return "#FF5757";
    return "#94A3B8";
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "N/A") return timeString;

    try {
      // Check if it's already a full ISO string or just time
      const time = timeString.includes("T")
        ? new Date(timeString)
        : new Date(`1970-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const AttendanceItem = ({ item, formatTime }) => {
    const [expanded, setExpanded] = useState(false);
    const punchSessions = item.punch_sessions || [];
    const latestSession = punchSessions[punchSessions.length - 1];

    return (
      <View style={styles.modernAttendanceItem}>
        <TouchableOpacity
          onPress={() => punchSessions.length > 1 && setExpanded(!expanded)}
          style={styles.attendanceMainContent}
        >
          <View style={styles.modernProfileContainer}>
            <View style={styles.modernAvatarWrapper}>
              <LinearGradient
                colors={["#e5383b", "#7b2cbf"]}
                style={styles.modernAvatarGradient}
              >
                {item.profile_image ? (
                  <Image
                    source={{ uri: item.profile_image }}
                    style={styles.modernAvatar}
                  />
                ) : (
                  <View style={styles.modernAvatarDefault}>
                    <Text style={styles.modernAvatarText}>
                      {item.full_name
                        ? item.full_name.charAt(0).toUpperCase()
                        : "T"}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
            <View style={styles.modernNameSection}>
              <Text style={styles.modernMemberName} numberOfLines={1}>
                {item.full_name || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.modernTimeContainer}>
            <View style={styles.modernTimeCard}>
              <View style={styles.modernTimeHeader}>
                <View
                  style={[
                    styles.modernStatusDot,
                    { backgroundColor: "#10B981" },
                  ]}
                />
                <Text style={styles.modernTimeTitle}>Last Entry</Text>
              </View>
              <Text style={styles.modernTimeValue}>
                {formatTime(latestSession?.punch_in) || "N/A"}
              </Text>
            </View>

            <View style={styles.modernTimeCard}>
              <View style={styles.modernTimeHeader}>
                <View
                  style={[
                    styles.modernStatusDot,
                    {
                      backgroundColor: latestSession?.punch_out
                        ? "#EF4444"
                        : "#94A3B8",
                    },
                  ]}
                />
                <Text style={styles.modernTimeTitle}>Last Exit</Text>
              </View>
              <Text
                style={[
                  styles.modernTimeValue,
                  !latestSession?.punch_out && styles.modernPendingText,
                ]}
              >
                {formatTime(latestSession?.punch_out) || "Pending"}
              </Text>
            </View>

            {punchSessions.length > 1 && (
              <View style={styles.expandIcon}>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748B"
                />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {expanded && punchSessions.length > 1 && (
          <View style={styles.expandedContent}>
            {punchSessions.map((session, sessionIndex) => (
              <View
                key={sessionIndex}
                style={[
                  styles.sessionItem,
                  sessionIndex === punchSessions.length - 1 &&
                    styles.lastSessionItem,
                ]}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionNumber}>
                    Session {sessionIndex + 1}
                  </Text>
                </View>
                <View style={styles.sessionTimes}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Entry</Text>
                    <Text style={styles.timeValue}>
                      {formatTime(session.punch_in) || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Exit</Text>
                    <Text
                      style={[
                        styles.timeValue,
                        !session.punch_out && styles.pendingText,
                      ]}
                    >
                      {formatTime(session.punch_out) || "Pending"}
                    </Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Duration</Text>
                    <Text style={styles.timeValue}>
                      {session.duration_hours
                        ? `${session.duration_hours}h`
                        : "0.0h"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderAttendanceItem = ({ item, index }) => (
    <AttendanceItem item={item} formatTime={formatTime} />
  );

  const renderEmpty = () => (
    <View style={styles.modernEmptyState}>
      <View style={styles.modernEmptyIcon}>
        <Text style={styles.modernEmptyIconText}>👥</Text>
      </View>
      <Text style={styles.modernEmptyTitle}>No Trainers Today</Text>
      <Text style={styles.modernEmptySubtitle}>
        Trainers will appear here once they check in
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.modernFooterLoader}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.modernLoadingText}>Loading...</Text>
      </View>
    );
  };

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
      <View style={[styles.modernHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.modernHeaderContent}>
          <TouchableOpacity style={styles.modernBackButton} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color="#000000" />
          </TouchableOpacity>
          <View style={styles.modernHeaderInfo}>
            <Text style={styles.modernHeaderTitle}>
              Today's Trainer Attendance
            </Text>
            <View style={styles.modernStatsRow}>
              <View style={styles.modernStatBadge}>
                <Text style={styles.modernStatNumber}>
                  {attendanceData.length}
                </Text>
                <Text style={styles.modernStatLabel}>Present</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.modernContent, { paddingBottom: insets.bottom }]}>
        <FlatList
          data={attendanceData}
          keyExtractor={(item, index) => `${item.trainer_id || index}-${index}`}
          renderItem={renderAttendanceItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.modernList,
            attendanceData.length === 0 && styles.modernEmptyList,
          ]}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#667eea", "#764ba2"]}
              tintColor="#667eea"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.modernSeparator} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modernHeader: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modernHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernBackButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modernBackIcon: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  modernHeaderInfo: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  modernStatsRow: {
    flexDirection: "row",
    gap: 16,
  },
  modernStatBadge: {
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modernStatNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 16,
  },
  modernStatLabel: {
    fontSize: 12,
    color: "rgba(0,0,0,0.8)",
    marginTop: 2,
  },
  modernContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modernList: {
    padding: 16,
  },
  modernEmptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "column",
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  attendanceMainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernAvatarWrapper: {
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modernAvatarDefault: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7b2cbf",
  },
  modernNameSection: {
    flex: 1,
  },
  modernMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modernTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modernTimeCard: {
    alignItems: "center",
    minWidth: 60,
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
    fontWeight: "500",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
  },
  modernSeparator: {
    height: 12,
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#F1F5F9",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modernEmptyIconText: {
    fontSize: 32,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  modernFooterLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modernLoadingText: {
    fontSize: 14,
    color: "#64748B",
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedContent: {
    backgroundColor: "#F8F9FA",
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
  },
  sessionItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  sessionTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeItem: {
    alignItems: "center",
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  pendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
  },
  lastSessionItem: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
});

export default TodaysAttendanceModal;
