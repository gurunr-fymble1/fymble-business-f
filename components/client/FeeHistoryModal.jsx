import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getFeeHistoryAPI, updateFeeEntryAPI, deleteFeeEntryAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

// Helper function to format date in Indian format (1st Nov 25)
const formatDate = (sqlDate) => {
  if (!sqlDate) return "N/A";

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

// Helper to format date as YYYY-MM-DD for API
const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FeeHistoryModal = ({ visible, onClose, clientId, clientName, isManualClient = false }) => {
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gymId, setGymId] = useState(null);
  const insets = useSafeAreaInsets();

  // Action menu state
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editJoinedAt, setEditJoinedAt] = useState(new Date());
  const [editExpiresAt, setEditExpiresAt] = useState(new Date());
  const [showJoinedPicker, setShowJoinedPicker] = useState(false);
  const [showExpiresPicker, setShowExpiresPicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (visible && clientId) {
      fetchFeeHistory();
    }
  }, [visible, clientId]);

  const fetchFeeHistory = async () => {
    setLoading(true);
    try {
      const storedGymId = await getToken("gym_id");
      setGymId(storedGymId);

      if (!storedGymId) {
        showToast({
          type: "error",
          title: "Gym ID not available",
        });
        setLoading(false);
        return;
      }

      // For manual clients, the client_id in FittbotGymMembership is "manual_{id}"
      const effectiveClientId = isManualClient ? `manual_${clientId}` : clientId;
      const response = await getFeeHistoryAPI(effectiveClientId, storedGymId);

      if (response?.status === 200) {
        const historyData = response?.data || [];
        setFeeHistory(historyData);
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to fetch fee history",
        });
        setFeeHistory([]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching fee history",
      });
      setFeeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionMenu = (item) => {
    setSelectedItem(item);
    setActionMenuVisible(true);
  };

  const handleCloseActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedItem(null);
  };

  const handleEditPress = () => {
    if (selectedItem) {
      setEditAmount(String(selectedItem.amount));
      setEditJoinedAt(new Date(selectedItem.joined_at));
      setEditExpiresAt(new Date(selectedItem.expires_at));
      setActionMenuVisible(false);
      setEditModalVisible(true);
    }
  };

  const handleDeletePress = () => {
    setActionMenuVisible(false);
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this fee entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleConfirmDelete,
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem || !gymId) return;

    setLoading(true);
    try {
      const response = await deleteFeeEntryAPI(selectedItem.id, gymId);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Fee entry deleted successfully",
        });
        fetchFeeHistory();
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to delete entry",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error deleting entry",
      });
    } finally {
      setLoading(false);
      setSelectedItem(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !gymId) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast({
        type: "error",
        title: "Please enter a valid amount",
      });
      return;
    }

    setUpdating(true);
    try {
      const response = await updateFeeEntryAPI(
        selectedItem.id,
        gymId,
        amount,
        formatDateForAPI(editJoinedAt),
        formatDateForAPI(editExpiresAt)
      );

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Fee entry updated successfully",
        });
        setEditModalVisible(false);
        setSelectedItem(null);
        fetchFeeHistory();
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to update entry",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating entry",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleJoinedDateChange = (event, date) => {
    setShowJoinedPicker(Platform.OS === "ios");
    if (date) {
      setEditJoinedAt(date);
    }
  };

  const handleExpiresDateChange = (event, date) => {
    setShowExpiresPicker(Platform.OS === "ios");
    if (date) {
      setEditExpiresAt(date);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="receipt-text"
                size={20}
                color="#3B82F6"
              />
              <Text style={styles.headerTitle}>Fee History</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading fee history...</Text>
            </View>
          ) : feeHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={60}
                color="#CBD5E0"
              />
              <Text style={styles.emptyTitle}>No Fee History</Text>
              <Text style={styles.emptySubtitle}>
                No payment records found for this client.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {feeHistory.map((item, index) => (
                <View key={item.id} style={styles.historyCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.planBadge}>
                      <MaterialCommunityIcons
                        name="ticket"
                        size={14}
                        color="#8B5CF6"
                      />
                      <Text style={styles.planName}>{item.plan_name}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
                      {/* Only show edit/delete menu for type="normal" entries */}
                      {item.type === "normal" && (
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={() => handleOpenActionMenu(item)}
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Dates Row */}
                  <View style={styles.datesContainer}>
                    <View style={styles.dateItem}>
                      <MaterialCommunityIcons
                        name="calendar-check"
                        size={14}
                        color="#10B981"
                      />
                      <View style={styles.dateTextContainer}>
                        <Text style={styles.dateLabel}>Joined</Text>
                        <Text style={styles.dateValue}>
                          {formatDate(item.joined_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dateDivider} />

                    <View style={styles.dateItem}>
                      <MaterialCommunityIcons
                        name="calendar-clock"
                        size={14}
                        color="#6366F1"
                      />
                      <View style={styles.dateTextContainer}>
                        <Text style={styles.dateLabel}>Expires</Text>
                        <Text style={styles.dateValue}>
                          {formatDate(item.expires_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseActionMenu}
      >
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={handleCloseActionMenu}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEditPress}>
              <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionItem} onPress={handleDeletePress}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editOverlay}>
          <View style={[styles.editContainer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Fee Entry</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowJoinedPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                <Text style={styles.dateInputText}>{formatDate(editJoinedAt)}</Text>
              </TouchableOpacity>
            </View>

            {showJoinedPicker && (
              <DateTimePicker
                value={editJoinedAt}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleJoinedDateChange}
              />
            )}

            {/* Expires Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expires Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowExpiresPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#6B7280" />
                <Text style={styles.dateInputText}>{formatDate(editExpiresAt)}</Text>
              </TouchableOpacity>
            </View>

            {showExpiresPicker && (
              <DateTimePicker
                value={editExpiresAt}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleExpiresDateChange}
              />
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, updating && styles.saveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "60%",
    maxHeight: "85%",
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  planName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dateDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "700",
  },
  // Action Menu Styles
  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  // Edit Modal Styles
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  editContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dateInputText: {
    fontSize: 16,
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default FeeHistoryModal;
