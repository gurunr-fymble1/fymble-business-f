import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CustomIOSDatePicker = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
  title = "Select Date",
  minimumDate,
  maximumDate,
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  const yearScrollRef = useRef(null);
  const hasScrolled = useRef(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (visible) {
      hasScrolled.current = false;
      const date = initialDate && initialDate instanceof Date && !isNaN(initialDate.getTime())
        ? initialDate
        : new Date();

      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
      setShouldScroll(true);
    } else {
      setShouldScroll(false);
    }
  }, [visible, initialDate]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = minimumDate ? minimumDate.getFullYear() : currentYear - 100;
    const endYear = maximumDate ? maximumDate.getFullYear() : currentYear + 50;
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const years = generateYears();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Check if a date is valid based on min/max constraints
  const isDateValid = (year, month, day) => {
    const testDate = new Date(year, month, day);

    if (minimumDate && testDate < minimumDate) {
      return false;
    }

    if (maximumDate) {
      // Set to end of day for maximumDate to allow selecting the max date itself
      const maxDateEndOfDay = new Date(maximumDate);
      maxDateEndOfDay.setHours(23, 59, 59, 999);
      if (testDate > maxDateEndOfDay) {
        return false;
      }
    }

    return true;
  };

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);

    // Validate before confirming
    if (!isDateValid(selectedYear, selectedMonth, selectedDay)) {
      // Prevent confirming invalid dates
      return;
    }

    onConfirm(selectedDate);
    onClose();
  };

  // Scroll to selected item after state is updated
  useEffect(() => {
    if (shouldScroll && !hasScrolled.current) {
      hasScrolled.current = true;
      const itemHeight = 44;

      setTimeout(() => {
        // Scroll to selected month
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTo({
            y: selectedMonth * itemHeight,
            animated: false,
          });
        }

        // Scroll to selected day
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTo({
            y: (selectedDay - 1) * itemHeight,
            animated: false,
          });
        }

        // Scroll to selected year
        const yearIndex = years.indexOf(selectedYear);
        if (yearIndex >= 0 && yearScrollRef.current) {
          yearScrollRef.current.scrollTo({
            y: yearIndex * itemHeight,
            animated: false,
          });
        }

        setShouldScroll(false);
      }, 300);
    }
  }, [shouldScroll, selectedMonth, selectedDay, selectedYear, years]);

  const renderPicker = (data, selectedValue, onSelect, unit, scrollRef) => {
    const itemHeight = 44;
    const visibleItems = 5;
    const containerHeight = itemHeight * visibleItems;

    return (
      <View style={[styles.pickerColumn, { height: containerHeight }]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingVertical: containerHeight / 2 - itemHeight / 2,
          }}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
            const newValue = data[index];
            if (newValue !== undefined) {
              onSelect(newValue);
            }
          }}
        >
          {data.map((item, index) => {
            const isSelected = item === selectedValue;

            // Check if this date would be valid
            let isDisabled = false;
            if (unit === "month") {
              // Check if month with current day and year is valid
              const testDay = Math.min(selectedDay, getDaysInMonth(item, selectedYear));
              isDisabled = !isDateValid(selectedYear, item, testDay);
            } else if (unit === "day") {
              // Check if day with current month and year is valid
              isDisabled = !isDateValid(selectedYear, selectedMonth, item);
            } else if (unit === "year") {
              // Check if year with current month and day is valid
              const testDay = Math.min(selectedDay, getDaysInMonth(selectedMonth, item));
              isDisabled = !isDateValid(item, selectedMonth, testDay);
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  { height: itemHeight },
                  isSelected && styles.selectedItem,
                ]}
                onPress={() => {
                  if (!isDisabled) {
                    onSelect(item);
                    scrollRef.current?.scrollTo({
                      y: index * itemHeight,
                      animated: true,
                    });
                  }
                }}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.pickerText,
                    isSelected && styles.selectedText,
                    isDisabled && styles.disabledText,
                  ]}
                >
                  {unit === "month" ? months[item] : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.selectionIndicator} pointerEvents="none" />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {renderPicker(
              Array.from({ length: 12 }, (_, i) => i),
              selectedMonth,
              setSelectedMonth,
              "month",
              monthScrollRef
            )}
            {renderPicker(days, selectedDay, setSelectedDay, "day", dayScrollRef)}
            {renderPicker(years, selectedYear, setSelectedYear, "year", yearScrollRef)}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerButton: {
    minWidth: 60,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
  },
  cancelText: {
    fontSize: 17,
    color: "#007AFF",
  },
  confirmText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  pickerColumn: {
    flex: 1,
    position: "relative",
  },
  pickerItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 20,
    color: "#999999",
  },
  selectedItem: {
    backgroundColor: "transparent",
  },
  selectedText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000000",
  },
  disabledText: {
    color: "#CCCCCC",
    textDecorationLine: "line-through",
  },
  selectionIndicator: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E5E5",
    transform: [{ translateY: -22 }],
    backgroundColor: "rgba(0, 122, 255, 0.05)",
  },
});

export default CustomIOSDatePicker;
