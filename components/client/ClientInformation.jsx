import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import FeeHistoryModal from "./FeeHistoryModal";
import {
  addPunchInAPI,
  getInStatusAPI,
  editClientDatesAPI,
} from "../../services/Api";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.iconContainer}>{icon}</View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value || "N/A"}
      </Text>
    </View>
  </View>
);

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

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

const muscleGroups = [
  "Chest",
  "Shoulder",
  "Leg",
  "Back",
  "ABS",
  "Biceps",
  "Cardio",
  "Core",
  "Cycling",
  "Forearms",
  "Treadmill",
  "Triceps",
];

const ClientInformation = ({ client }) => {
  const router = useRouter();
  const [feeHistoryModalVisible, setFeeHistoryModalVisible] = useState(false);
  const [punchInModalVisible, setPunchInModalVisible] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [checkingPunchIn, setCheckingPunchIn] = useState(false);
  const [loadingPunchIn, setLoadingPunchIn] = useState(true);
  const [editDatesModalVisible, setEditDatesModalVisible] = useState(false);
  const [editedStartDate, setEditedStartDate] = useState(null);
  const [editedExpiryDate, setEditedExpiryDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [savingDates, setSavingDates] = useState(false);

  // Check if client is manual entry
  const isManualClient =
    client?.entry_type === "manual" || client?.manual_client;

  // Check gym presence when component mounts
  useEffect(() => {
    if (client?.id) {
      checkGymPresence();
    }
  }, [client?.id]);

  const checkGymPresence = async () => {
    if (!client.id) return;

    setLoadingPunchIn(true);
    try {
      const gymId = await getToken("gym_id");

      const response = await getInStatusAPI(
        client.id,
        gymId,
        isManualClient ? client.id : null,
        client?.import_status ? client?.import_id : null,
      );

      if (response?.status === 200) {
        setIsPunchedIn(response?.attendance_status || false);
      } else {
        setIsPunchedIn(false);
      }
    } catch (error) {
      setIsPunchedIn(false);
    } finally {
      setLoadingPunchIn(false);
    }
  };

  const toggleMuscleSelection = (muscle) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
  };

  const handlePunchIn = async () => {
    setCheckingPunchIn(true);

    try {
      const gymId = await getToken("gym_id");

      const payload = {
        ...(client?.import_status
          ? { import_client_id: client?.import_id }
          : {
              client_id: isManualClient ? null : client.id,
              manual_client_id: isManualClient ? client.id : null,
            }),
        gym_id: gymId,
        muscle: selectedMuscles,
      };

      const response = await addPunchInAPI(payload);

      if (response?.status === 200) {
        setIsPunchedIn(true);
        setPunchInModalVisible(false);
        setSelectedMuscles([]);
        showToast({
          type: "success",
          title: "Success",
          desc: "Client punched in successfully!",
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to punch in.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setCheckingPunchIn(false);
    }
  };

  const handleCallPress = () => {
    if (client.contact) {
      Linking.openURL(`tel:${client.contact}`);
    }
  };

  const handleUpdateFees = () => {
    // Use the unified fee update flow for all client types
    router.push({
      pathname: "/owner/manualFeeUpdate",
      params: {
        clientId: client.id,
        clientName: client.name,
        planId: client.plan_id || "",
        batchId: client.batch_id || "",
        latestMembershipId: client.latest_membership_id || "",
        isManual: isManualClient ? "true" : "false",
        isImport: client.import_status ? "true" : "false",
        import_id: client?.import_status ? client?.import_id : null,
      },
    });
  };

  const handleFeeHistory = () => {
    setFeeHistoryModalVisible(true);
  };

  const handlePunchInPress = () => {
    if (!isPunchedIn) {
      setPunchInModalVisible(true);
    }
  };

  const handleEditDates = () => {
    setEditedStartDate(
      client.starts_at ? new Date(client.starts_at) : new Date(),
    );
    setEditedExpiryDate(
      client.expires_at ? new Date(client.expires_at) : new Date(),
    );
    setEditDatesModalVisible(true);
  };

  const handleDateChange = (type, event, selectedDate) => {
    if (Platform.OS === "android") {
      if (type === "start") {
        setShowStartDatePicker(false);
      } else {
        setShowExpiryDatePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        setTimeout(() => {
          if (type === "start") {
            setEditedStartDate(selectedDate);
          } else {
            setEditedExpiryDate(selectedDate);
          }
        }, 0);
      }
    } else {
      if (selectedDate) {
        if (type === "start") {
          setEditedStartDate(selectedDate);
        } else {
          setEditedExpiryDate(selectedDate);
        }
      }
    }
  };

  const handleSaveDates = async () => {
    setSavingDates(true);
    try {
      const gymId = await getToken("gym_id");

      // Convert to IST (UTC+5:30) before formatting
      const convertToIST = (date) => {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().split("T")[0];
      };

      const payload = {
        client_id: client.id,
        gym_id: gymId,
        starts_at: convertToIST(editedStartDate),
        expires_at: convertToIST(editedExpiryDate),
        latest_membership_id: client?.latest_membership_id,
        // For manual CRM clients, pass manual_client_id
        ...(client?.manual_client || client?.entry_type === "manual"
          ? { manual_client_id: client.id }
          : {}),
      };

      const response = await editClientDatesAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Dates updated successfully!",
        });
        setEditDatesModalVisible(false);

        // Navigate back to allClientsPage and scroll to the client card
        router.push({
          pathname: "/owner/client",
          params: { scrollToClientId: client.id },
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to update dates.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setSavingDates(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  if (!client) return null;

  const startDate = formatExpiryDate(client.starts_at);
  const expiryDate = formatExpiryDate(client.expires_at);
  const isExpiringSoon =
    client.expires_at &&
    new Date(client.expires_at) <=
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {client.dp || client.profile ? (
            <Image
              source={{ uri: client.dp || client.profile }}
              style={styles.profileImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.defaultProfileIcon}>
              <FontAwesome5 name="user" size={40} color="#9CA3AF" />
            </View>
          )}
        </View>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientId}>
          ID: {client.admission_number || client.gym_client_id}
        </Text>

        {/* Action Buttons */}
        <View style={styles.profileButtonsContainer}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallPress}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call Client</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            {!client.is_old_client && (
              <TouchableOpacity
                style={styles.updateFeesButton}
                onPress={handleUpdateFees}
                activeOpacity={0.7}
              >
                <Ionicons name="card-outline" size={18} color="#3B82F6" />
                <Text style={styles.updateFeesButtonText}>Update Fees</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.feeHistoryButton,
                client.is_old_client && styles.fullWidthButton,
              ]}
              onPress={handleFeeHistory}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={18} color="#8B5CF6" />
              <Text style={styles.feeHistoryButtonText}>Fee History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Membership Dates Card */}
      {(startDate || expiryDate) && (
        <View style={styles.membershipDatesCard}>
          <TouchableOpacity
            style={styles.editDatesButton}
            onPress={handleEditDates}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={26} color="#6366F1" />
          </TouchableOpacity>
          <View style={styles.dateRow}>
            {startDate && (
              <View style={styles.dateItem}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color="#10B981"
                />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Joined</Text>
                  <Text style={styles.dateValue}>{startDate}</Text>
                </View>
              </View>
            )}
            {expiryDate && (
              <View style={styles.dateItem}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={isExpiringSoon ? "#F59E0B" : "#6366F1"}
                />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Expires</Text>
                  <Text
                    style={[
                      styles.dateValue,
                      isExpiringSoon && styles.dateValueWarning,
                    ]}
                  >
                    {expiryDate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Membership Details */}
      <SectionHeader title="Membership Details" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={
            <MaterialIcons name="fitness-center" size={22} color="#8B5CF6" />
          }
          label="Plan"
          value={client.training}
        />
        <InfoRow
          icon={<FontAwesome5 name="running" size={20} color="#EC4899" />}
          label="Batch"
          value={client.batch}
        />
        <InfoRow
          icon={
            <Ionicons
              name={
                client.feePaid === "Paid" ? "checkmark-circle" : "close-circle"
              }
              size={22}
              color={client.feePaid === "Paid" ? "#10B981" : "#EF4444"}
            />
          }
          label="Fee Status"
          value={client.feePaid}
        />
      </View>

      {/* Personal Information */}
      <SectionHeader title="Personal Information" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={
            <Ionicons
              name={client.gender === "male" ? "male" : "female"}
              size={22}
              color={client.gender === "male" ? "#3B82F6" : "#EC4899"}
            />
          }
          label="Gender"
          value={client.gender}
        />
      </View>

      {/* Contact Information */}
      <SectionHeader title="Contact Information" />
      <View style={styles.sectionContainer}>
        <InfoRow
          icon={<Ionicons name="call" size={22} color="#10B981" />}
          label="Phone"
          value={client.contact}
        />
        <InfoRow
          icon={<MaterialIcons name="email" size={22} color="#3B82F6" />}
          label="Email"
          value={client.email}
        />
      </View>

      <View style={{ height: 100 }} />

      {/* Fee History Modal */}
      <FeeHistoryModal
        visible={feeHistoryModalVisible}
        onClose={() => setFeeHistoryModalVisible(false)}
        clientId={client.id}
        clientName={client.name}
        isManualClient={isManualClient}
      />

      {/* Punch In Modal */}
      <Modal
        visible={punchInModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPunchInModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPunchInModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Muscle Groups</Text>
                <Text style={styles.modalSubtitle}>
                  Which areas will the client workout today?
                </Text>

                <View style={styles.muscleGroupsContainer}>
                  {muscleGroups.map((muscle) => (
                    <TouchableOpacity
                      key={muscle}
                      style={[
                        styles.muscleGroupItem,
                        selectedMuscles.includes(muscle) &&
                          styles.selectedMuscleGroupItem,
                      ]}
                      onPress={() => toggleMuscleSelection(muscle)}
                    >
                      <Text
                        style={[
                          styles.muscleGroupItemText,
                          selectedMuscles.includes(muscle) &&
                            styles.selectedMuscleGroupItemText,
                        ]}
                      >
                        {muscle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setPunchInModalVisible(false);
                      setSelectedMuscles([]);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalConfirmButton,
                      selectedMuscles.length === 0 &&
                        styles.disabledConfirmButton,
                    ]}
                    onPress={handlePunchIn}
                    disabled={selectedMuscles.length === 0 || checkingPunchIn}
                  >
                    {checkingPunchIn ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Dates Modal */}
      <Modal
        visible={editDatesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditDatesModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setEditDatesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.dateEditModalContent}>
                <Text style={styles.modalTitle}>Edit Membership Dates</Text>

                {/* Start Date */}
                <View style={styles.dateEditGroup}>
                  <Text style={styles.dateEditLabel}>Joined Date</Text>
                  <TouchableOpacity
                    style={styles.dateEditButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text style={styles.dateEditText}>
                      {formatDate(editedStartDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Expiry Date */}
                <View style={styles.dateEditGroup}>
                  <Text style={styles.dateEditLabel}>Expiry Date</Text>
                  <TouchableOpacity
                    style={styles.dateEditButton}
                    onPress={() => setShowExpiryDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text style={styles.dateEditText}>
                      {formatDate(editedExpiryDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* iOS Date Pickers */}
                {Platform.OS === "ios" && showStartDatePicker && (
                  <View style={styles.iosDatePickerContainer}>
                    <View style={styles.iosDatePickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowStartDatePicker(false)}
                      >
                        <Text style={styles.datePickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>
                        Select Joined Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowStartDatePicker(false)}
                      >
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={editedStartDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) =>
                        handleDateChange("start", event, selectedDate)
                      }
                      textColor="#000000"
                    />
                  </View>
                )}

                {Platform.OS === "ios" && showExpiryDatePicker && (
                  <View style={styles.iosDatePickerContainer}>
                    <View style={styles.iosDatePickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowExpiryDatePicker(false)}
                      >
                        <Text style={styles.datePickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>
                        Select Expiry Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowExpiryDatePicker(false)}
                      >
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={editedExpiryDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) =>
                        handleDateChange("expiry", event, selectedDate)
                      }
                      textColor="#000000"
                    />
                  </View>
                )}

                {/* Android Date Pickers */}
                {Platform.OS === "android" && showStartDatePicker && (
                  <DateTimePicker
                    value={editedStartDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) =>
                      handleDateChange("start", event, selectedDate)
                    }
                  />
                )}

                {Platform.OS === "android" && showExpiryDatePicker && (
                  <DateTimePicker
                    value={editedExpiryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) =>
                      handleDateChange("expiry", event, selectedDate)
                    }
                  />
                )}

                {/* Buttons */}
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setEditDatesModalVisible(false);
                      setShowStartDatePicker(false);
                      setShowExpiryDatePicker(false);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleSaveDates}
                    disabled={savingDates}
                  >
                    {savingDates ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.modalConfirmButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  profileSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  clientName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  clientId: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 20,
  },
  profileButtonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 10,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  updateFeesButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
  },
  updateFeesButtonText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "700",
  },
  feeHistoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
  },
  feeHistoryButtonText: {
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "700",
  },
  fullWidthButton: {
    flex: 1,
  },
  punchInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#10B981",
    marginTop: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledPunchInButton: {
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  punchInButtonText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledPunchInButtonText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxHeight: "70%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  muscleGroupsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  muscleGroupItem: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    marginVertical: 6,
  },
  selectedMuscleGroupItem: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  muscleGroupItemText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  selectedMuscleGroupItemText: {
    color: "#FFF",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    flex: 0.45,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    flex: 0.45,
    alignItems: "center",
  },
  disabledConfirmButton: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  membershipDatesCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  editDatesButton: {
    position: "absolute",
    top: -20,
    right: 0,
    zIndex: 1,
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateTextContainer: {
    flexDirection: "column",
  },
  dateLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
  },
  dateValueWarning: {
    color: "#F59E0B",
  },
  dateEditModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dateEditGroup: {
    marginBottom: 20,
  },
  dateEditLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dateEditButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  dateEditText: {
    fontSize: 14,
    color: "#111827",
  },
  iosDatePickerContainer: {
    marginBottom: 16,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  datePickerCancel: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  datePickerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  datePickerDone: {
    fontSize: 16,
    color: "#22426B",
    fontWeight: "600",
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

export default ClientInformation;
