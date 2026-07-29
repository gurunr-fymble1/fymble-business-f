import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToast } from "../../utils/Toaster";
import { addManualImportsAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";

const ManualClientImport = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState([
    {
      id: 1,
      fullName: "",
      mobile: "",
      email: "",
      location: "",
      gender: "",
      feeStatus: "active",
      admissionNumber: "",
      expiryDate: null,
      showDatePicker: false,
    },
  ]);

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(null);

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const addNewClient = () => {
    const newClient = {
      id: clients.length + 1,
      fullName: "",
      mobile: "",
      email: "",
      location: "",
      gender: "",
      feeStatus: "active",
      admissionNumber: "",
      expiryDate: null,
      showDatePicker: false,
    };
    setClients([...clients, newClient]);
  };

  const removeClient = (id) => {
    if (clients.length === 1) {
      showToast({
        type: "error",
        title: "At least one client is required",
      });
      return;
    }
    setClients(clients.filter((client) => client.id !== id));
  };

  const updateClient = (id, field, value) => {
    setClients(
      clients.map((client) =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };

  const handleDateChange = (id, event, selectedDate) => {
    if (Platform.OS === "android") {
      // Close picker first for Android
      setClients((prevClients) =>
        prevClients.map((client) =>
          client.id === id ? { ...client, showDatePicker: false } : client
        )
      );
      // Then update date if user confirmed
      if (event.type === "set" && selectedDate) {
        setTimeout(() => {
          setClients((prevClients) =>
            prevClients.map((client) =>
              client.id === id
                ? { ...client, expiryDate: selectedDate }
                : client
            )
          );
        }, 0);
      }
    } else {
      // For iOS, just update the date while picker is still open
      if (selectedDate) {
        updateClient(id, "expiryDate", selectedDate);
      }
    }
  };

  const handleIOSDatePickerDone = (id) => {
    updateClient(id, "showDatePicker", false);
  };

  const handleIOSDatePickerCancel = (id) => {
    updateClient(id, "showDatePicker", false);
  };

  const handleGenderSelect = (value) => {
    if (selectedClientIndex !== null) {
      updateClient(clients[selectedClientIndex].id, "gender", value);
    }
    setShowGenderModal(false);
    setSelectedClientIndex(null);
  };

  const validateAndSubmit = async () => {
    try {
      const invalidClients = clients.filter(
        (client) =>
          !client.fullName ||
          !client.mobile ||
          !client.email ||
          !client.location ||
          !client.gender ||
          !client.feeStatus
      );

      if (invalidClients.length > 0) {
        showToast({
          type: "error",
          title: "Please fill all required fields for all clients",
        });
        return;
      }

      // Validate mobile numbers
      const invalidMobile = clients.filter(
        (client) => !/^\d{10}$/.test(client.mobile)
      );
      if (invalidMobile.length > 0) {
        showToast({
          type: "error",
          title: "Mobile number must be 10 digits",
        });
        return;
      }

      // Validate email
      const invalidEmail = clients.filter(
        (client) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)
      );
      if (invalidEmail.length > 0) {
        showToast({
          type: "error",
          title: "Please enter valid email addresses",
        });
        return;
      }

      const gymId = await getToken("gym_id");

      // Prepare payload
      const clientsData = clients.map((client) => {
        let expiryDateIST = null;
        if (client.expiryDate) {
          const date = new Date(client.expiryDate);
          // Convert to IST (UTC+5:30)
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(date.getTime() + istOffset);
          expiryDateIST = istDate.toISOString().split("T")[0];
        }

        return {
          full_name: client.fullName,
          mobile: client.mobile,
          email: client.email,
          location: client.location,
          gender: client.gender,
          fee_status: client.feeStatus,
          admission_number: client.admissionNumber || null,
          expiry_date: expiryDateIST,
        };
      });

      const payload = {
        import_type: "manual",
        clients: clientsData,
        gym_id: gymId,
      };

      const response = await addManualImportsAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: `${clients.length} client(s) imported successfully`,
        });

        router.back();
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to import clients",
        });
      }
    } catch (error) {
      console.error("Error in validateAndSubmit:", error);
      showToast({
        type: "error",
        title: "An error occurred while processing the data",
      });
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manual Client Addition</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {clients.map((client, index) => (
            <View key={client.id} style={styles.clientCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Client {index + 1}</Text>
                {clients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeClient(client.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={"#aaa"}
                  value={client.fullName}
                  onChangeText={(text) =>
                    updateClient(client.id, "fullName", text)
                  }
                />
              </View>

              {/* Mobile */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Mobile <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={"#aaa"}
                  value={client.mobile}
                  onChangeText={(text) =>
                    updateClient(client.id, "mobile", text)
                  }
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  placeholderTextColor={"#aaa"}
                  autoCapitalize="none"
                  value={client.email}
                  onChangeText={(text) =>
                    updateClient(client.id, "email", text)
                  }
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Location <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter location"
                  value={client.location}
                  onChangeText={(text) =>
                    updateClient(client.id, "location", text)
                  }
                  placeholderTextColor={"#aaa"}
                />
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Gender <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setSelectedClientIndex(index);
                    setShowGenderModal(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      !client.gender && styles.placeholderText,
                    ]}
                  >
                    {client.gender
                      ? client.gender.charAt(0).toUpperCase() +
                        client.gender.slice(1)
                      : "Select gender"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Fee Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Fee Status <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      updateClient(client.id, "feeStatus", "active")
                    }
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        client.feeStatus === "active" &&
                          styles.radioCircleSelected,
                      ]}
                    >
                      {client.feeStatus === "active" && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Active</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      updateClient(client.id, "feeStatus", "inactive")
                    }
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        client.feeStatus === "inactive" &&
                          styles.radioCircleSelected,
                      ]}
                    >
                      {client.feeStatus === "inactive" && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Admission Number (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admission Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter admission number"
                  value={client.admissionNumber}
                  onChangeText={(text) =>
                    updateClient(client.id, "admissionNumber", text)
                  }
                  placeholderTextColor={"#aaa"}
                />
              </View>

              {/* Expiry Date (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expiry Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() =>
                    updateClient(client.id, "showDatePicker", true)
                  }
                >
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text
                    style={[
                      styles.dateText,
                      !client.expiryDate && styles.placeholderText,
                    ]}
                  >
                    {client.expiryDate
                      ? formatDate(client.expiryDate)
                      : "Select expiry date"}
                  </Text>
                </TouchableOpacity>

                {/* iOS Date Picker Modal */}
                {Platform.OS === "ios" && client.showDatePicker && (
                  <Modal
                    visible={client.showDatePicker}
                    transparent={true}
                    animationType="fade"
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.datePickerModal}>
                        <View style={styles.datePickerHeader}>
                          <TouchableOpacity
                            onPress={() => handleIOSDatePickerCancel(client.id)}
                          >
                            <Text style={styles.datePickerCancel}>Cancel</Text>
                          </TouchableOpacity>
                          <Text style={styles.datePickerTitle}>
                            Select Expiry Date
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleIOSDatePickerDone(client.id)}
                          >
                            <Text style={styles.datePickerDone}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={client.expiryDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) =>
                            handleDateChange(client.id, event, selectedDate)
                          }
                          // minimumDate={new Date()}
                          textColor="#000000"
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {/* Android Date Picker */}
                {Platform.OS === "android" && client.showDatePicker && (
                  <DateTimePicker
                    value={client.expiryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) =>
                      handleDateChange(client.id, event, selectedDate)
                    }
                    // minimumDate={new Date()}
                  />
                )}
              </View>
            </View>
          ))}

          {/* Add New Client Button */}
          <TouchableOpacity style={styles.addButton} onPress={addNewClient}>
            <Ionicons name="add-circle-outline" size={24} color="#22426B" />
            <Text style={styles.addButtonText}>Add Another Client</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={validateAndSubmit}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitButtonText}>
              Add {clients.length} Client{clients.length > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Gender Selection Modal */}
        <Modal
          visible={showGenderModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.genderModal}>
              <Text style={styles.genderModalTitle}>Select Gender</Text>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.genderOption}
                  onPress={() => handleGenderSelect(option.value)}
                >
                  <Text style={styles.genderOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.genderCancelButton}
                onPress={() => {
                  setShowGenderModal(false);
                  setSelectedClientIndex(null);
                }}
              >
                <Text style={styles.genderCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#22426B",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22426B",
  },
  radioLabel: {
    fontSize: 14,
    color: "#374151",
  },
  dateButton: {
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
  dateText: {
    fontSize: 14,
    color: "#111827",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22426B",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22426B",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#22426B",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  genderModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  genderModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  genderOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  genderCancelButton: {
    paddingVertical: 14,
    marginTop: 8,
  },
  genderCancelText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "600",
  },
  datePickerModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerCancel: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  datePickerDone: {
    fontSize: 16,
    color: "#22426B",
    fontWeight: "600",
  },
});

export default ManualClientImport;
