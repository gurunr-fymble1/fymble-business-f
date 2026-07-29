import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/Ionicons";

const EnhancedPicker = ({
  label,
  placeholder,
  items,
  onValueChange,
  value,
  error,
}) => {
  // Create a reference to the picker
  const pickerRef = useRef(null);

  // Function to open the picker when arrow is clicked
  const openPicker = () => {
    if (pickerRef.current) {
      // For iOS, we need to call togglePicker differently
      if (Platform.OS === "ios") {
        pickerRef.current.togglePicker(true);
      } else {
        pickerRef.current.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.pickerContainer}>
        <RNPickerSelect
          ref={pickerRef}
          placeholder={
            placeholder || { label: "Select an option", value: null }
          }
          onValueChange={onValueChange}
          items={items}
          value={value}
          useNativeAndroidPickerStyle={false}
          fixAndroidTouchableBug={true}
          Icon={() => (
            <TouchableOpacity
              onPress={openPicker}
              style={styles.iconTouchable}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="chevron-down" size={22} color="#22426B" />
            </TouchableOpacity>
          )}
          pickerProps={{
            mode: "dropdown",
            itemStyle: {
              color: "#000000",
            },
          }}
          style={pickerStyles}
          // iOS specific props for better functionality
          modalProps={{
            animationType: "slide",
          }}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22426B",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#22426B",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    position: "relative",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
  iconTouchable: {
    padding: 5, // Add padding for better touch area
    justifyContent: "center",
    alignItems: "center",
  },
});

// Enhanced picker styles with better iOS support
const pickerStyles = {
  inputIOS: {
    paddingVertical: 16,
    paddingHorizontal: 15,
    color: "#333",
    fontSize: 16,
    paddingRight: 50, // More space for the icon
    backgroundColor: "transparent",
    minHeight: 50, // Ensure adequate touch area
  },
  inputAndroid: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    color: "#333",
    fontSize: 16,
    paddingRight: 50, // More space for the icon
    backgroundColor: "transparent",
  },
  placeholder: {
    color: "#888",
    fontSize: 16,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 5 : 5,
    right: 12,
    height: Platform.OS === "ios" ? 50 : 46,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
};

export default EnhancedPicker;
