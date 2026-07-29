import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import CustomTimePicker from "../../components/ui/CustomTimePicker";
import { updateGymBasicDetailsAPI } from "../../services/Api";
import { getToken, saveToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const { height } = Dimensions.get("window");

const WEEKDAYS = [
  { key: 0, label: "Monday", short: "Mon" },
  { key: 1, label: "Tuesday", short: "Tue" },
  { key: 2, label: "Wednesday", short: "Wed" },
  { key: 3, label: "Thursday", short: "Thu" },
  { key: 4, label: "Friday", short: "Fri" },
  { key: 5, label: "Saturday", short: "Sat" },
  { key: 6, label: "Sunday", short: "Sun" },
];

const DEFAULT_OPEN = "06:00";
const DEFAULT_CLOSE = "22:00";

const buildScheduleFromAPI = (apiHours) => {
  const schedule = {};
  WEEKDAYS.forEach((d) => {
    schedule[d.key] = { enabled: false, open_time: DEFAULT_OPEN, close_time: DEFAULT_CLOSE };
  });
  if (Array.isArray(apiHours)) {
    apiHours.forEach((h) => {
      if (h.weekday !== undefined && h.weekday !== null) {
        schedule[h.weekday] = { enabled: true, open_time: h.open_time, close_time: h.close_time };
      }
    });
  }
  return schedule;
};

const isoToHHMM = (iso) => {
  if (!iso) return null;
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

const formatHHMM = (hhmm) => {
  if (!hhmm) return "Select";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const hhmmToIso = (hhmm) => {
  if (!hhmm) return undefined;
  return `2000-01-01T${hhmm}:00.000`;
};

const scheduleToPayload = (schedule) => {
  const data = [];
  WEEKDAYS.forEach((d) => {
    const entry = schedule[d.key];
    if (entry.enabled && entry.open_time && entry.close_time) {
      data.push({ weekday: d.key, open_time: entry.open_time, close_time: entry.close_time });
    }
  });
  return data;
};

const services = [
  "General Fitness",
  "Weight Training",
  "Cardio",
  "Personal Training",
  "Group Classes",
  "Yoga",
  "Pilates",
  "CrossFit",
  "Swimming",
  "Martial Arts",
  "Dance Classes",
  "Zumba",
  "Aerobics",
  "Physiotherapy",
  "Nutrition Counseling",
  "Sports Training",
  "Other",
];

const EditGymDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [gymID, setGymID] = useState(null);

  const [editData, setEditData] = useState({
    gymName: "",
    gym_contact_number: "",
    services: [],
    hoursSchedule: buildScheduleFromAPI([]),
    applyAllExceptSunday: false,
    address_street: "",
    address_area: "",
    address_city: "",
    address_state: "",
    address_pincode: "",
  });

  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState({
    show: false,
    weekday: null,
    type: "",
  });

  useEffect(() => {
    if (params?.gymData) {
      try {
        const gymData = JSON.parse(params.gymData);
        setGymID(params.gymID);

        let servicesData = gymData?.services || [];
        if (typeof servicesData === "string") {
          try {
            servicesData = JSON.parse(servicesData);
          } catch (e) {
            servicesData = servicesData
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        }
        if (!Array.isArray(servicesData)) {
          servicesData = [];
        }

        setEditData({
          gymName: gymData?.name || "",
          gym_contact_number: gymData?.contact_number || "",
          services: servicesData,
          hoursSchedule: buildScheduleFromAPI(gymData?.operating_hours),
          applyAllExceptSunday: false,
          address_street: gymData?.address?.street || "",
          address_area: gymData?.address?.area || "",
          address_city: gymData?.address?.city || "",
          address_state: gymData?.address?.state || "",
          address_pincode: gymData?.address?.pincode || "",
        });
      } catch (error) {
        showToast({ type: "error", title: "Failed to load gym data" });
        router.replace({ pathname: "/owner/ownerprofile", params: { activeTab: "gym" } });
      }
    }
  }, []);

  const toggleService = (service) => {
    const currentServices = editData.services || [];
    if (currentServices.includes(service)) {
      setEditData((prev) => ({
        ...prev,
        services: currentServices.filter((s) => s !== service),
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        services: [...currentServices, service],
      }));
    }
  };

  const toggleScheduleDay = (weekday) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      sched[weekday] = { ...sched[weekday], enabled: !sched[weekday].enabled };
      return { ...prev, hoursSchedule: sched };
    });
  };

  const updateScheduleTime = (weekday, field, hhmm) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      sched[weekday] = { ...sched[weekday], [field]: hhmm };
      if (prev.applyAllExceptSunday && weekday === 0) {
        for (let i = 1; i <= 5; i++) {
          sched[i] = { ...sched[i], [field]: hhmm };
        }
      }
      return { ...prev, hoursSchedule: sched };
    });
  };

  const handleApplyAllToggle = (value) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      if (value) {
        const mon = sched[0];
        for (let i = 1; i <= 5; i++) {
          sched[i] = { enabled: mon.enabled, open_time: mon.open_time, close_time: mon.close_time };
        }
      }
      return { ...prev, applyAllExceptSunday: value, hoursSchedule: sched };
    });
  };

  const isDayEditable = (weekday) => {
    if (editData.applyAllExceptSunday && weekday >= 1 && weekday <= 5) return false;
    return true;
  };

  const onTimeChange = (selectedTime) => {
    const { weekday, type } = showTimePicker;
    if (weekday === null || weekday === undefined || !type) return;
    const hhmm = isoToHHMM(selectedTime);
    if (hhmm) {
      const field = type === "open" ? "open_time" : "close_time";
      updateScheduleTime(weekday, field, hhmm);
    }
    setShowTimePicker({ show: false, weekday: null, type: "" });
  };

  const handleSave = async () => {
    const hoursPayload = scheduleToPayload(editData.hoursSchedule);

    if (hoursPayload.length === 0) {
      showToast({ type: "error", title: "Please enable at least one day" });
      return;
    }

    try {
      setIsSaving(true);
      const owner_id = await getToken("owner_id");

      if (!owner_id || !gymID) {
        showToast({ type: "error", title: "Something went wrong. Please try again later" });
        return;
      }

      const payload = {
        owner_id: parseInt(owner_id),
        gym_id: parseInt(gymID),
        name: editData.gymName,
        contact_number: editData.gym_contact_number,
        services: editData.services,
        operating_hours: hoursPayload,
        address: {
          street: editData.address_street,
          area: editData.address_area,
          city: editData.address_city,
          state: editData.address_state,
          pincode: editData.address_pincode,
        },
      };

      const response = await updateGymBasicDetailsAPI(payload);
      if (response?.status === 200) {
        if (editData.gymName) {
          await saveToken("gym_name", editData.gymName);
        }
        showToast({ type: "success", title: "Gym details updated successfully" });
        router.replace({ pathname: "/owner/ownerprofile", params: { activeTab: "gym" } });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update gym details",
        });
      }
    } catch (error) {
      showToast({ type: "error", title: "Failed to update gym details" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.replace({ pathname: "/owner/ownerprofile", params: { activeTab: "gym" } });
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler onBackPress={handleCancel} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Gym Details</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gym Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gym Name</Text>
            <TextInput
              style={styles.input}
              value={editData.gymName}
              onChangeText={(text) => setEditData({ ...editData, gymName: text })}
              placeholder="Enter your gym name"
              placeholderTextColor={"#AAA"}
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={editData.gym_contact_number}
              onChangeText={(text) => setEditData({ ...editData, gym_contact_number: text })}
              placeholder="Enter gym contact number"
              placeholderTextColor={"#AAA"}
              keyboardType="phone-pad"
            />
          </View>

          {/* Services */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Services</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowServicesModal(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  !editData.services?.length && styles.placeholderText,
                ]}
              >
                {editData.services?.length > 0
                  ? `${editData.services.length} services selected`
                  : "Select services"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#3498db" />
            </TouchableOpacity>

            {editData.services?.length > 0 && (
              <View style={styles.selectedServicesContainer}>
                {editData.services.slice(0, 3).map((service) => (
                  <View key={service} style={styles.servicePill}>
                    <Text style={styles.servicePillText}>{service}</Text>
                  </View>
                ))}
                {editData.services.length > 3 && (
                  <View style={styles.servicePill}>
                    <Text style={styles.servicePillText}>
                      +{editData.services.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operating Hours</Text>

            {/* Apply-all checkbox */}
            <TouchableOpacity
              style={styles.applyAllRow}
              onPress={() => handleApplyAllToggle(!editData.applyAllExceptSunday)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={editData.applyAllExceptSunday ? "checkbox" : "square-outline"}
                size={20}
                color={editData.applyAllExceptSunday ? "#3498db" : "#999"}
              />
              <Text style={styles.applyAllText}>
                Use Monday hours for all weekdays (Mon–Sat)
              </Text>
            </TouchableOpacity>

            {WEEKDAYS.map((day) => {
              const entry = editData.hoursSchedule[day.key];
              if (!entry) return null;
              const editable = isDayEditable(day.key);
              const locked = !editable && entry.enabled;

              return (
                <View
                  key={day.key}
                  style={[
                    styles.scheduleDayCard,
                    !entry.enabled && styles.scheduleDayCardDisabled,
                    locked && styles.scheduleDayCardLocked,
                  ]}
                >
                  <View style={styles.scheduleDayHeader}>
                    <View style={styles.scheduleDayLabelRow}>
                      <Switch
                        value={entry.enabled}
                        onValueChange={() => {
                          if (editable) toggleScheduleDay(day.key);
                        }}
                        disabled={!editable}
                        trackColor={{ false: "#E0E0E0", true: "#81B4E0" }}
                        thumbColor={entry.enabled ? "#3498db" : "#CCC"}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                      <Text style={[styles.scheduleDayLabel, !entry.enabled && styles.scheduleDayLabelDisabled]}>
                        {day.label}
                      </Text>
                      {locked && (
                        <View style={styles.lockedBadge}>
                          <Ionicons name="link" size={10} color="#3498db" />
                          <Text style={styles.lockedBadgeText}>Mon</Text>
                        </View>
                      )}
                    </View>
                    {!entry.enabled && <Text style={styles.closedLabel}>Closed</Text>}
                  </View>

                  {entry.enabled && (
                    <View style={styles.scheduleTimeRow}>
                      <TouchableOpacity
                        style={[styles.scheduleTimeBtn, !editable && styles.scheduleTimeBtnLocked]}
                        onPress={() => {
                          if (!editable) return;
                          setShowTimePicker({ show: true, weekday: day.key, type: "open" });
                        }}
                        activeOpacity={editable ? 0.7 : 1}
                      >
                        <Ionicons name="time-outline" size={14} color="#3498db" />
                        <Text style={styles.scheduleTimeBtnText}>{formatHHMM(entry.open_time)}</Text>
                      </TouchableOpacity>

                      <Text style={styles.scheduleTimeSep}>to</Text>

                      <TouchableOpacity
                        style={[styles.scheduleTimeBtn, !editable && styles.scheduleTimeBtnLocked]}
                        onPress={() => {
                          if (!editable) return;
                          setShowTimePicker({ show: true, weekday: day.key, type: "close" });
                        }}
                        activeOpacity={editable ? 0.7 : 1}
                      >
                        <Ionicons name="time-outline" size={14} color="#3498db" />
                        <Text style={styles.scheduleTimeBtnText}>{formatHHMM(entry.close_time)}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Address */}
          <Text style={styles.sectionTitle}>Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={editData.address_street}
              onChangeText={(text) => setEditData({ ...editData, address_street: text })}
              placeholder="Enter street address"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Area</Text>
            <TextInput
              style={styles.input}
              value={editData.address_area}
              onChangeText={(text) => setEditData({ ...editData, address_area: text })}
              placeholder="Enter area"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={editData.address_city}
                onChangeText={(text) => setEditData({ ...editData, address_city: text })}
                placeholder="Enter city"
                placeholderTextColor={"#AAA"}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={editData.address_state}
                onChangeText={(text) => setEditData({ ...editData, address_state: text })}
                placeholder="Enter state"
                placeholderTextColor={"#AAA"}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={editData.address_pincode}
              onChangeText={(text) => setEditData({ ...editData, address_pincode: text })}
              placeholder="Enter pincode"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Services Selection Modal */}
      <Modal
        visible={showServicesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Services</Text>
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {services.map((service) => {
                const isSelected = editData.services?.includes(service);
                return (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceOption,
                      isSelected && styles.serviceOptionSelected,
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    <Text
                      style={[
                        styles.serviceOptionText,
                        isSelected && styles.serviceOptionTextSelected,
                      ]}
                    >
                      {service}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#3498db" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowServicesModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>
                Done ({editData.services?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CustomTimePicker */}
      <CustomTimePicker
        visible={showTimePicker.show}
        onClose={() => setShowTimePicker({ show: false, weekday: null, type: "" })}
        onConfirm={onTimeChange}
        initialTime={
          showTimePicker.weekday !== null && showTimePicker.weekday !== undefined && showTimePicker.type
            ? hhmmToIso(
                editData.hoursSchedule?.[showTimePicker.weekday]?.[
                  showTimePicker.type === "open" ? "open_time" : "close_time"
                ]
              )
            : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 34,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginTop: 10,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 0.48,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  selectorText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  selectedServicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  servicePill: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  servicePillText: {
    fontSize: 12,
    color: "#3498db",
    fontWeight: "500",
  },
  // Schedule day styles
  applyAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  applyAllText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  scheduleDayCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  scheduleDayCardDisabled: {
    backgroundColor: "#FAFAFA",
    borderColor: "#EEEEEE",
  },
  scheduleDayCardLocked: {
    backgroundColor: "#F5F9FF",
    borderColor: "#D0E3F5",
  },
  scheduleDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleDayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  scheduleDayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  scheduleDayLabelDisabled: {
    color: "#AAA",
  },
  closedLabel: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedBadgeText: {
    fontSize: 10,
    color: "#3498db",
    fontWeight: "500",
  },
  scheduleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  scheduleTimeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    gap: 6,
  },
  scheduleTimeBtnLocked: {
    backgroundColor: "#EEF4FB",
    borderColor: "#D0E3F5",
  },
  scheduleTimeBtnText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  scheduleTimeSep: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  bottomSpacing: {
    height: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#bbb",
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    padding: 15,
    maxHeight: height * 0.45,
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  serviceOptionSelected: {
    backgroundColor: "#E3F2FD",
  },
  serviceOptionText: {
    fontSize: 14,
    color: "#333",
  },
  serviceOptionTextSelected: {
    color: "#3498db",
    fontWeight: "500",
  },
  modalDoneButton: {
    backgroundColor: "#3498db",
    margin: 15,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalDoneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EditGymDetails;
