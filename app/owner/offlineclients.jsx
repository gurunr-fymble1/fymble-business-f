import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import CustomDropdown from "../../components/ui/CustomDropdown";
import CustomIOSDatePicker from "../../components/ui/CustomIOSDatePicker";
import { showToast } from "../../utils/Toaster";
import { addOfflineClientAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import ConfettiAnimation from "../../components/ConfettiAnimation";

const { width } = Dimensions.get("window");

// Generate duration options (1-24 months)
const generateDurationOptions = () => {
  const options = [];
  for (let i = 1; i <= 24; i++) {
    options.push({
      label: `${i} Month${i > 1 ? "s" : ""}`,
      value: i,
    });
  }
  return options;
};

const DURATION_OPTIONS = generateDurationOptions();

const OfflineClients = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    membershipType: "gym_membership",
    duration: null,
    amountPaid: "",
    admissionFee: "",
    joiningDate: null,
    expiryDate: null,
  });

  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [tempJoiningDate, setTempJoiningDate] = useState(new Date());
  const [tempExpiryDate, setTempExpiryDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const formatDateForDisplay = (date) => {
    if (!date) return "Select Date";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Joining Date Handlers
  const handleJoiningDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowJoiningDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setForm({ ...form, joiningDate: selectedDate });
      }
    } else {
      if (selectedDate) {
        setTempJoiningDate(selectedDate);
      }
    }
  };

  const confirmJoiningDate = () => {
    setForm({ ...form, joiningDate: tempJoiningDate });
    setShowJoiningDatePicker(false);
  };

  const cancelJoiningDate = () => {
    setShowJoiningDatePicker(false);
    setTempJoiningDate(form.joiningDate || new Date());
  };

  const resetJoiningDate = () => {
    setForm({ ...form, joiningDate: null });
    setTempJoiningDate(new Date());
  };

  // Expiry Date Handlers
  const handleExpiryDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowExpiryDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setForm({ ...form, expiryDate: selectedDate });
      }
    } else {
      if (selectedDate) {
        setTempExpiryDate(selectedDate);
      }
    }
  };

  const confirmExpiryDate = () => {
    setForm({ ...form, expiryDate: tempExpiryDate });
    setShowExpiryDatePicker(false);
  };

  const cancelExpiryDate = () => {
    setShowExpiryDatePicker(false);
    setTempExpiryDate(form.expiryDate || new Date());
  };

  const resetExpiryDate = () => {
    setForm({ ...form, expiryDate: null });
    setTempExpiryDate(new Date());
  };

  const formatDateForSQL = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.duration) {
      showToast({
        type: "error",
        title: "Please select duration",
      });
      return;
    }

    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) {
      showToast({
        type: "error",
        title: "Please enter a valid amount",
      });
      return;
    }

    try {
      const gym_id = await getToken("gym_id");

      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID is not available",
        });
        return;
      }

      const payload = {
        gym_id: parseInt(gym_id),
        batch: form.membershipType,
        admission_fees: form.admissionFee ? parseFloat(form.admissionFee) : 0,
        fees: parseFloat(form.amountPaid),
        joining_date: formatDateForSQL(form.joiningDate),
        expiry_date: formatDateForSQL(form.expiryDate),
        duration_months: form.duration,
        mobile_number: params.mobile,
      };

      // Add client_id for request type or uuid for scan type
      if (params.type === "scan" && params.uuid) {
        payload.uuid = params.uuid;
      } else if (params.client_id) {
        payload.client_id = parseInt(params.client_id);
      }

      const response = await addOfflineClientAPI(payload);

      if (response?.status === 200) {
        // Show confetti animation and success modal
        setShowConfetti(true);
        setShowSuccessModal(true);

        showToast({
          type: "success",
          title: "Client added successfully",
        });

        // Navigate back after confetti animation
        setTimeout(() => {
          try {
            setShowConfetti(false);
            setShowSuccessModal(false);
            // Use replace instead of push to prevent back navigation issues
            router.replace("/owner/client");
          } catch (navError) {
            console.error("Navigation error:", navError);
          }
        }, 2500);
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to add client",
        });
      }
    } catch (error) {
      console.error("Error adding offline client:", error);
      showToast({
        type: "error",
        title: "An error occurred",
      });
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 5 }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/clientform")}
        text={"Add Client"}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {params.dp ? (
            <Image source={{ uri: params.dp }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Text style={styles.profileInitial}>
                {params.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{params.name || "Client Name"}</Text>

          {/* Call Buttons */}
          <View style={styles.callButtonsContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(params.mobile)}
            >
              <Ionicons name="call" size={16} color="rgba(0,0,0,0.2)" />
              <Text style={styles.callButtonText}>{params.mobile}</Text>
            </TouchableOpacity>

            {params.alternate && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(params.alternate)}
              >
                <Ionicons name="call" size={16} color="rgba(0,0,0,0.2)" />
                <Text style={styles.callButtonText}>{params.alternate}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Membership Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Membership Type</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() =>
                  setForm({ ...form, membershipType: "gym_membership" })
                }
                activeOpacity={0.7}
              >
                <View style={styles.radioCircle}>
                  {form.membershipType === "gym_membership" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Membership</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() =>
                  setForm({ ...form, membershipType: "personal_training" })
                }
                activeOpacity={0.7}
              >
                <View style={styles.radioCircle}>
                  {form.membershipType === "personal_training" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Personal Training</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration Dropdown */}
          <CustomDropdown
            label="Select Duration (Months)"
            value={form.duration}
            onChange={(option) => setForm({ ...form, duration: option.value })}
            options={DURATION_OPTIONS}
            placeholder="Select duration"
          />

          {/* Amount Paid */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Paid</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={form.amountPaid}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, "");
                setForm({ ...form, amountPaid: numericText });
              }}
              returnKeyType="done"
            />
          </View>

          {/* Admission Fees */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Admission Fees (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Admission Fees(optional)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={form.admissionFee}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, "");
                setForm({ ...form, admissionFee: numericText });
              }}
              returnKeyType="done"
            />
          </View>

          {/* Gym Joining Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Joining Date (Optional)</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 1 }]}
                onPress={() => {
                  if (Platform.OS === "ios") {
                    setTempJoiningDate(form.joiningDate || new Date());
                  }
                  setShowJoiningDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text
                  style={[
                    styles.dateButtonText,
                    !form.joiningDate && styles.placeholderText,
                  ]}
                >
                  {formatDateForDisplay(form.joiningDate)}
                </Text>
              </TouchableOpacity>

              {form.joiningDate && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetJoiningDate}
                >
                  <Ionicons name="close-circle" size={20} color="#E53E3E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Membership Expiry Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Membership Expiry Date (Optional)</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={[styles.dateButton, { flex: 1 }]}
                onPress={() => {
                  if (Platform.OS === "ios") {
                    setTempExpiryDate(form.expiryDate || new Date());
                  }
                  setShowExpiryDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text
                  style={[
                    styles.dateButtonText,
                    !form.expiryDate && styles.placeholderText,
                  ]}
                >
                  {formatDateForDisplay(form.expiryDate)}
                </Text>
              </TouchableOpacity>

              {form.expiryDate && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetExpiryDate}
                >
                  <Ionicons name="close-circle" size={20} color="#E53E3E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* iOS Date Pickers */}
      {Platform.OS === "ios" && (
        <>
          {/* Joining Date Picker */}
          <CustomIOSDatePicker
            visible={showJoiningDatePicker}
            onClose={cancelJoiningDate}
            onConfirm={(date) => {
              setForm({ ...form, joiningDate: date });
              setShowJoiningDatePicker(false);
            }}
            initialDate={tempJoiningDate}
            title="Select Joining Date"
            maximumDate={new Date()}
          />

          {/* Expiry Date Picker */}
          <CustomIOSDatePicker
            visible={showExpiryDatePicker}
            onClose={cancelExpiryDate}
            onConfirm={(date) => {
              setForm({ ...form, expiryDate: date });
              setShowExpiryDatePicker(false);
            }}
            initialDate={tempExpiryDate}
            title="Select Expiry Date"
          />
        </>
      )}

      {/* Android Date Pickers */}
      {Platform.OS === "android" && (
        <>
          {showJoiningDatePicker && (
            <DateTimePicker
              testID="joiningDateTimePicker"
              value={form.joiningDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleJoiningDateChange}
              maximumDate={new Date()}
            />
          )}

          {showExpiryDatePicker && (
            <DateTimePicker
              testID="expiryDateTimePicker"
              value={form.expiryDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleExpiryDateChange}
            />
          )}
        </>
      )}

      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation xpPoints={0} />}

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>
              Client added successfully
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingHorizontal: 0,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    backgroundColor: "#c62828",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  callButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 6,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFD",
  },
  formSection: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0078FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0078FF",
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2D3748",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  dateButtonText: {
    fontSize: 15,
    color: "#2D3748",
  },
  placeholderText: {
    color: "#aaa",
  },
  resetButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 50,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  successModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default OfflineClients;
