import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import EnhancedPicker from "./EnhancedPicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FilterModal = ({
  visible,
  onClose,
  plans,
  batches,
  filters,
  setFilters,
  applyFilters,
  resetFilters,
}) => {
  const handleApply = () => {
    applyFilters();
    onClose();
  };
  const insets = useSafeAreaInsets();

  const handleReset = () => {
    resetFilters();
  };

  const handleOutsidePress = () => {
    onClose();
  };

  const handleContentPress = (e) => {
    e.stopPropagation();
  };

  const renderPlanItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        selectedPlan?.id === item.id && styles.selectedItem,
      ]}
      onPress={() => setSelectedPlan(item)}
    >
      <Text
        style={[
          styles.filterItemText,
          selectedPlan?.id === item.id && styles.selectedItemText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBatchItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        selectedBatch?.id === item.id && styles.selectedItem,
      ]}
      onPress={() => setSelectedBatch(item)}
    >
      <Text
        style={[
          styles.filterItemText,
          selectedBatch?.id === item.id && styles.selectedItemText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const handleValueChange = (value) => {};

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <View
              style={[styles.modalView, { paddingBottom: insets.bottom + 10 }]}
            >
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Filter</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <EnhancedPicker
                label={"Select Batch"}
                placeholder={{ label: "Select an option", value: null }}
                items={batches.map((batch) => ({
                  label: batch.batch_name,
                  value: batch.id,
                }))}
                value={filters.batch}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, batch: value }))
                }
              />

              <EnhancedPicker
                label={"Select Plan"}
                placeholder={{ label: "Select an option", value: null }}
                items={plans.map((plan) => ({
                  label: plan.plans,
                  value: plan.id,
                }))}
                value={filters.training}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, training: value }))
                }
              />

              <EnhancedPicker
                label={"Select Aim"}
                placeholder={{ label: "Select an option", value: null }}
                items={[
                  { label: "Weight Gain", value: "weight_gain" },
                  { label: "Weight Loss", value: "weight_loss" },
                  { label: "Maintain", value: "maintain" },
                ]}
                value={filters.aim}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, aim: value }))
                }
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22426B", // Dark purple color to match your theme
  },
  closeButton: {
    fontSize: 20,
    color: "#22426B",
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22426B",
    marginBottom: 10,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#22426B", // Purple when selected
  },
  filterItemText: {
    fontSize: 14,
    color: "#333",
  },
  selectedItemText: {
    color: "#fff", // White text when selected
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22426B",
    width: "48%",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#22426B",
    fontWeight: "600",
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#22426B",
    width: "48%",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

const pickerStyles = {
  inputIOS: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    color: "#000",
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: "#ec0000",
    borderRadius: 20,
    paddingHorizontal: 10,
    // paddingVertical: 8,
    marginBottom: 10,
    color: "#b60e0e",
    backgroundColor: "#585858",
  },
};

export default FilterModal;
