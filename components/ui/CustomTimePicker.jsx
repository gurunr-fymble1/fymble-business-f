import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const CustomTimePicker = ({ visible, onClose, onConfirm, initialTime }) => {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState("AM");

  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  useEffect(() => {
    if (visible && initialTime) {
      let hour, minute;

      // Check if initialTime is an ISO string
      if (typeof initialTime === 'string' && initialTime.includes('T')) {
        // Parse time directly from ISO string
        const timeMatch = initialTime.match(/T(\d{2}):(\d{2})/);
        if (timeMatch) {
          hour = parseInt(timeMatch[1]);
          minute = parseInt(timeMatch[2]);
        }
      } else {
        // Fallback to Date parsing
        const date = new Date(initialTime);
        hour = date.getHours();
        minute = date.getMinutes();
      }

      const isPM = hour >= 12;

      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;

      // Round minute to nearest quarter
      const nearestMinute = minutes.reduce((prev, curr) =>
        Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
      );

      setSelectedHour(hour);
      setSelectedMinute(nearestMinute);
      setPeriod(isPM ? "PM" : "AM");

      // Scroll to initial positions after a brief delay
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: (hour - 1) * 50,
          animated: false,
        });
        const minuteIndex = minutes.indexOf(nearestMinute);
        minuteScrollRef.current?.scrollTo({
          y: minuteIndex * 50,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialTime]);

  const handleConfirm = () => {
    // Create date string with user-selected time (IST)
    const now = new Date();
    let hour = selectedHour;

    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    // Create a simple ISO date string without timezone offset
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hourStr = String(hour).padStart(2, "0");
    const minuteStr = String(selectedMinute).padStart(2, "0");

    // Return ISO string without timezone (assumes IST)
    const dateString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00.000`;

    onConfirm(dateString);
    onClose();
  };

  const renderPickerItem = (value, isSelected, onPress) => (
    <TouchableOpacity
      key={value}
      style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.pickerItemText,
          isSelected && styles.selectedPickerItemText,
        ]}
      >
        {String(value).padStart(2, "0")}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Time</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Time Display */}
            <View style={styles.timeDisplay}>
              <Text style={styles.displayTime}>
                {String(selectedHour).padStart(2, "0")}:
                {String(selectedMinute).padStart(2, "0")} {period}
              </Text>
            </View>

            {/* Picker Container */}
            <View style={styles.pickerContainer}>
              {/* Time Pickers Section with Indicator */}
              <View style={styles.timePickersWrapper}>
                <View style={styles.selectionIndicator} />

                {/* Hour Picker */}
                <View style={styles.column}>
                  <Text style={styles.columnLabel}>Hour</Text>
                  <ScrollView
                    ref={hourScrollRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.y / 50
                      );
                      setSelectedHour(hours[index]);
                    }}
                  >
                    <View style={styles.scrollPadding} />
                    {hours.map((hour) =>
                      renderPickerItem(hour, hour === selectedHour, () =>
                        setSelectedHour(hour)
                      )
                    )}
                    <View style={styles.scrollPadding} />
                  </ScrollView>
                </View>

                {/* Separator */}
                <View style={styles.separator}>
                  <Text style={styles.separatorText}>:</Text>
                </View>

                {/* Minute Picker */}
                <View style={styles.column}>
                  <Text style={styles.columnLabel}>Minute</Text>
                  <ScrollView
                    ref={minuteScrollRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.y / 50
                      );
                      setSelectedMinute(minutes[index]);
                    }}
                  >
                    <View style={styles.scrollPadding} />
                    {minutes.map((minute) =>
                      renderPickerItem(minute, minute === selectedMinute, () =>
                        setSelectedMinute(minute)
                      )
                    )}
                    <View style={styles.scrollPadding} />
                  </ScrollView>
                </View>
              </View>

              {/* Period Picker (AM/PM) */}
              <View style={styles.periodColumn}>
                <Text style={styles.columnLabel}>Period</Text>
                <View style={styles.periodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      period === "AM" && styles.selectedPeriodButton,
                    ]}
                    onPress={() => setPeriod("AM")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        period === "AM" && styles.selectedPeriodText,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      period === "PM" && styles.selectedPeriodButton,
                    ]}
                    onPress={() => setPeriod("PM")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        period === "PM" && styles.selectedPeriodText,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  timeDisplay: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#F8F9FA",
  },
  displayTime: {
    fontSize: 30,
    fontWeight: "700",
    color: "#3498db",
    letterSpacing: 2,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  timePickersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  selectionIndicator: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#FFF5F2",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3498db",
    zIndex: 0,
  },
  column: {
    flex: 1,
    alignItems: "center",
    zIndex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  scrollView: {
    height: 200,
  },
  scrollPadding: {
    height: 75,
  },
  pickerItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  selectedPickerItem: {
    // Selected styling handled by indicator
  },
  pickerItemText: {
    fontSize: 20,
    color: "#999",
    fontWeight: "400",
  },
  selectedPickerItemText: {
    fontSize: 24,
    color: "#3498db",
    fontWeight: "700",
  },
  separator: {
    paddingHorizontal: 8,
    paddingTop: 20,
    zIndex: 1,
  },
  separatorText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3498db",
  },
  periodColumn: {
    alignItems: "center",
    paddingLeft: 10,
    zIndex: 1,
  },
  periodContainer: {
    marginTop: 8,
  },
  periodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    marginVertical: 6,
    minWidth: 60,
    alignItems: "center",
  },
  selectedPeriodButton: {
    backgroundColor: "#3498db",
  },
  periodText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  selectedPeriodText: {
    color: "#FFF",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    backgroundColor: "#3498db",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default CustomTimePicker;
