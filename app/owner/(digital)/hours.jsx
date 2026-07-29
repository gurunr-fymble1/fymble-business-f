import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "../../../utils/Toaster";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import CustomTimePicker from "../../../components/ui/CustomTimePicker";
import { updateServicesAndHours } from "../../../services/Api";
import { getToken } from "../../../utils/auth";

const { width } = Dimensions.get("window");

const DAYS = [
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

const buildInitialSchedule = () => {
  const schedule = {};
  DAYS.forEach((d) => {
    schedule[d.key] = { enabled: true, open_time: DEFAULT_OPEN, close_time: DEFAULT_CLOSE };
  });
  return schedule;
};

// Extract "HH:MM" from an ISO string like "2026-07-06T06:00:00.000"
const isoToHHMM = (iso) => {
  if (!iso) return null;
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

// Convert "HH:MM" (24h) to "hh:mm AM/PM"
const formatDisplay = (hhmm) => {
  if (!hhmm) return "Select";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Convert "HH:MM" to a fake ISO string the CustomTimePicker can parse as initialTime
const hhmmToIso = (hhmm) => {
  if (!hhmm) return undefined;
  return `2000-01-01T${hhmm}:00.000`;
};

const OperatingHours = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const [schedule, setSchedule] = useState(buildInitialSchedule);

  // "Apply to all except Sunday" checkbox
  const [applyAllExceptSunday, setApplyAllExceptSunday] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState({
    show: false,
    weekday: null,
    type: "", // "open" | "close"
  });

  const toggleDay = (weekday) => {
    setSchedule((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], enabled: !prev[weekday].enabled },
    }));
  };

  const updateDayTime = (weekday, field, hhmm) => {
    setSchedule((prev) => {
      const updated = { ...prev, [weekday]: { ...prev[weekday], [field]: hhmm } };

      // If checkbox is on, propagate Mon's time to Tue–Sat (keys 0–5)
      if (applyAllExceptSunday && weekday === 0) {
        for (let i = 1; i <= 5; i++) {
          updated[i] = { ...updated[i], [field]: hhmm };
        }
      }

      return updated;
    });
  };

  const handleApplyAllToggle = (value) => {
    setApplyAllExceptSunday(value);
    if (value) {
      // Copy Monday's times to Tue–Sat, also enable those days
      setSchedule((prev) => {
        const mon = prev[0];
        const updated = { ...prev };
        for (let i = 1; i <= 5; i++) {
          updated[i] = {
            enabled: mon.enabled,
            open_time: mon.open_time,
            close_time: mon.close_time,
          };
        }
        return updated;
      });
    }
  };

  const onTimeChange = (selectedTime) => {
    const { weekday, type } = showTimePicker;
    if (weekday === null || !type) return;

    const hhmm = isoToHHMM(selectedTime);
    if (hhmm) {
      const field = type === "open" ? "open_time" : "close_time";
      updateDayTime(weekday, field, hhmm);
    }
    setShowTimePicker({ show: false, weekday: null, type: "" });
  };

  const handleSave = async () => {
    // Build payload: only enabled days
    const data = [];
    DAYS.forEach((d) => {
      const entry = schedule[d.key];
      if (entry.enabled) {
        if (!entry.open_time || !entry.close_time) {
          return; // will be caught by validation below
        }
        data.push({
          weekday: d.key,
          open_time: entry.open_time,
          close_time: entry.close_time,
        });
      }
    });

    // Validate: at least one day enabled
    if (data.length === 0) {
      showToast({ type: "error", title: "Please enable at least one day" });
      return;
    }

    // Validate: all enabled days have times
    const enabledDays = DAYS.filter((d) => schedule[d.key].enabled);
    const missingTimes = enabledDays.some(
      (d) => !schedule[d.key].open_time || !schedule[d.key].close_time
    );
    if (missingTimes) {
      showToast({ type: "error", title: "Please set times for all enabled days" });
      return;
    }

    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Gym ID is not available" });
        setLoading(false);
        return;
      }

      const payload = {
        gym_id: gymId,
        data_type: "operating_hours",
        data,
      };

      const response = await updateServicesAndHours(payload);

      if (response?.status === 200) {
        showToast({ type: "success", title: "Operating hours saved successfully!" });
        setTimeout(() => router.push("/owner/home"), 500);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to save operating hours",
        });
      }
    } catch (error) {
      console.error("Save operating hours error:", error);
      showToast({ type: "error", title: "Failed to save operating hours. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const isDayEditable = (weekday) => {
    // When checkbox is on, only Mon (0) and Sun (6) are individually editable
    if (applyAllExceptSunday && weekday >= 1 && weekday <= 5) return false;
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Operating Hours"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#0154A0" />
          <Text style={styles.infoText}>
            Set your gym's operating hours for each day. Toggle off days when the gym is closed.
          </Text>
        </View>

        {/* Apply-all checkbox */}
        <TouchableOpacity
          style={styles.applyAllRow}
          onPress={() => handleApplyAllToggle(!applyAllExceptSunday)}
          activeOpacity={0.7}
        >
          <View style={styles.applyAllLeft}>
            <Ionicons
              name={applyAllExceptSunday ? "checkbox" : "square-outline"}
              size={22}
              color={applyAllExceptSunday ? "#0154A0" : "#999"}
            />
            <Text style={styles.applyAllText}>
              Use Monday hours for all weekdays (Mon–Sat)
            </Text>
          </View>
        </TouchableOpacity>

        {/* Day-by-day rows */}
        {DAYS.map((day) => {
          const entry = schedule[day.key];
          const editable = isDayEditable(day.key);
          const locked = !editable && entry.enabled;

          return (
            <View
              key={day.key}
              style={[
                styles.dayCard,
                !entry.enabled && styles.dayCardDisabled,
                locked && styles.dayCardLocked,
              ]}
            >
              {/* Day header row */}
              <View style={styles.dayHeader}>
                <View style={styles.dayLabelRow}>
                  <Switch
                    value={entry.enabled}
                    onValueChange={() => {
                      if (editable) toggleDay(day.key);
                    }}
                    disabled={!editable}
                    trackColor={{ false: "#E0E0E0", true: "#81B4E0" }}
                    thumbColor={entry.enabled ? "#0154A0" : "#CCC"}
                  />
                  <Text
                    style={[
                      styles.dayLabel,
                      !entry.enabled && styles.dayLabelDisabled,
                    ]}
                  >
                    {day.label}
                  </Text>
                  {locked && (
                    <View style={styles.lockedBadge}>
                      <Ionicons name="link" size={12} color="#0154A0" />
                      <Text style={styles.lockedBadgeText}>Linked to Mon</Text>
                    </View>
                  )}
                </View>
                {!entry.enabled && (
                  <Text style={styles.closedLabel}>Closed</Text>
                )}
              </View>

              {/* Time row (only when enabled) */}
              {entry.enabled && (
                <View style={styles.timeRow}>
                  {/* Open Time */}
                  <TouchableOpacity
                    style={[styles.timeButton, !editable && styles.timeButtonLocked]}
                    onPress={() => {
                      if (!editable) return;
                      setShowTimePicker({ show: true, weekday: day.key, type: "open" });
                    }}
                    activeOpacity={editable ? 0.7 : 1}
                  >
                    <Ionicons name="time-outline" size={16} color="#0154A0" />
                    <Text style={styles.timeButtonText}>
                      {formatDisplay(entry.open_time)}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.timeSeparator}>to</Text>

                  {/* Close Time */}
                  <TouchableOpacity
                    style={[styles.timeButton, !editable && styles.timeButtonLocked]}
                    onPress={() => {
                      if (!editable) return;
                      setShowTimePicker({ show: true, weekday: day.key, type: "close" });
                    }}
                    activeOpacity={editable ? 0.7 : 1}
                  >
                    <Ionicons name="time-outline" size={16} color="#0154A0" />
                    <Text style={styles.timeButtonText}>
                      {formatDisplay(entry.close_time)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: 10 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#030A15", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Operating Hours</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <CustomTimePicker
        visible={showTimePicker.show}
        onClose={() =>
          setShowTimePicker({ show: false, weekday: null, type: "" })
        }
        onConfirm={onTimeChange}
        initialTime={
          showTimePicker.weekday !== null && showTimePicker.type
            ? hhmmToIso(
                schedule[showTimePicker.weekday]?.[
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
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#01579B",
    lineHeight: 20,
  },
  applyAllRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  applyAllLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  applyAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dayCardDisabled: {
    backgroundColor: "#FAFAFA",
    borderColor: "#EEEEEE",
  },
  dayCardLocked: {
    backgroundColor: "#F5F9FF",
    borderColor: "#D0E3F5",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  dayLabelDisabled: {
    color: "#AAA",
  },
  closedLabel: {
    fontSize: 13,
    color: "#F44336",
    fontWeight: "500",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F2FC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 11,
    color: "#0154A0",
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  timeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  timeButtonLocked: {
    backgroundColor: "#EEF4FB",
    borderColor: "#D0E3F5",
  },
  timeButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  timeSeparator: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default OperatingHours;
