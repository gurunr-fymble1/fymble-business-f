import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CustomDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  label,
  error,
  disabled = false,
  small = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState(null);
  const buttonRef = useRef(null);

  const handleSelect = (item) => {
    onChange(item);
    setIsOpen(false);
  };

  const openDropdown = () => {
    if (disabled) return;
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setDropdownLayout({ width, height, px, py });
      setIsOpen(true);
    });
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        ref={buttonRef}
        style={[
          styles.button,
          error && styles.buttonError,
          disabled && styles.buttonDisabled,
          small && { paddingVertical: 8 },
        ]}
        onPress={openDropdown}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.buttonText,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
            small && { fontSize: 14 },
          ]}
        >
          {displayText}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={small ? 14 : 20}
          color={disabled ? "#999" : "#333"}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              dropdownLayout && {
                top: dropdownLayout.py + dropdownLayout.height + 4,
                left: dropdownLayout.px,
                width: dropdownLayout.width,
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    option.value === value && styles.selectedOption,
                    index === options.length - 1 && styles.lastOption,
                  ]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.value === value && styles.selectedOptionText,
                      small && { fontSize: 14 },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  buttonError: {
    borderColor: "#ff3b30",
  },
  buttonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  disabledText: {
    color: "#999",
  },
  errorText: {
    fontSize: 12,
    color: "#ff3b30",
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    maxHeight: 240,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: "#f0f8ff",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default CustomDropdown;
