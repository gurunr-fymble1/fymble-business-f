import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { WINDOW_WIDTH, WINDOW_HEIGHT } from "../../utils/dimensions";

const FilterModal = ({
  visible,
  onClose,
  filters,
  setFilters,
  applyFilters,
  resetFilters,
  batches,
  plans,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FF5757" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Filter Clients</Text>

          {/* <TextInput
            placeholder="Filter by Name"
            style={styles.textInput}
            value={filters.name}
            onChangeText={(value) =>
              setFilters((prev) => ({ ...prev, name: value }))
            }
            placeholderTextColor="#999"
          /> */}

          <RNPickerSelect
            placeholder={{ label: "Select Batch", value: "" }}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, batch: value }))
            }
            items={batches.map((batch) => ({
              label: batch.batch_name,
              value: batch.id,
            }))}
            pickerProps={{
              itemStyle: {
                color: "#000000",
              },
            }}
            style={pickerStyles}
          />

          <RNPickerSelect
            placeholder={{ label: "Select Training Type", value: "" }}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, training: value }))
            }
            items={plans.map((plan) => ({
              label: plan.plans,
              value: plan.id,
            }))}
            pickerProps={{
              itemStyle: {
                color: "#000000",
              },
            }}
            style={pickerStyles}
          />

          <RNPickerSelect
            placeholder={{ label: "Select Aim", value: "" }}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, aim: value }))
            }
            items={[
              { label: "Weight Gain", value: "Weight Gain" },
              { label: "Weight Loss", value: "Weight Loss" },
            ]}
            pickerProps={{
              itemStyle: {
                color: "#000000",
              },
            }}
            style={pickerStyles}
          />

          <RNPickerSelect
            placeholder={{ label: "Select Fee Status", value: "" }}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, feePaid: value }))
            }
            items={[
              { label: "Paid", value: "Paid" },
              { label: "Pending", value: "Not Paid" },
            ]}
            pickerProps={{
              itemStyle: {
                color: "#000000",
              },
            }}
            style={pickerStyles}
          />

          <View style={styles.modalButtonContainer}>
            <Button
              mode="contained"
              onPress={applyFilters}
              style={styles.filterButton}
              labelStyle={styles.buttonLabel}
            >
              Apply
            </Button>
            <Button
              mode="outlined"
              onPress={resetFilters}
              style={styles.resetButton}
              labelStyle={styles.buttonLabel}
            >
              Reset
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: WINDOW_WIDTH * 0.05,
  },
  modalContent: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { WINDOW_WIDTH: 0, WINDOW_HEIGHT: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: WINDOW_WIDTH * 0.05,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FF5757",
    textAlign: "center",
  },
  modalMessage: {
    fontSize: WINDOW_WIDTH * 0.04,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  textInput: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffeeee",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffeeee",
    fontSize: WINDOW_WIDTH * 0.04,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#FF5757",
  },
  resetButton: {
    flex: 1,
    borderColor: "#FF5757",
  },
  updateButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#FF5757",
  },
  cancelButton: {
    flex: 1,
    borderColor: "#FF5757",
  },
  buttonLabel: {
    fontSize: WINDOW_WIDTH * 0.04,
  },
});

const pickerStyles = {
  inputIOS: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    color: "#000",
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    color: "#000",
  },
};
