import React, { useState, useCallback, memo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomDropdown from "../ui/CustomDropdown";
import {
  BONUS_DAY_OPTIONS,
  BONUS_MONTH_OPTIONS,
  PAUSE_DAY_OPTIONS,
  PAUSE_MONTH_OPTIONS,
} from "./planConstants";

const RadioOption = memo(({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.radioOption, selected && styles.radioOptionSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.radioCircle}>
      {selected && <View style={styles.radioSelected} />}
    </View>
    <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
));

const PlanDetailModal = memo(
  ({ visible, onClose, onSave, planLabel, initialData }) => {
    const insets = useSafeAreaInsets();
    const [price, setPrice] = useState("");
    const handlePriceChange = (text) => setPrice(text.replace(/[^0-9]/g, ""));
    const [bonusType, setBonusType] = useState("day");
    const [bonus, setBonus] = useState(null);
    const [pauseType, setPauseType] = useState("day");
    const [pause, setPause] = useState(null);

    useEffect(() => {
      if (visible) {
        setPrice(initialData?.price ? String(initialData.price) : "");
        setBonusType(initialData?.bonusType || "day");
        setBonus(initialData?.bonus ?? null);
        setPauseType(initialData?.pauseType || "day");
        setPause(initialData?.pause ?? null);
      }
    }, [visible, planLabel, initialData]);

    const handleSave = useCallback(() => {
      if (!price || parseInt(price) <= 0) return;
      onSave({
        price: parseInt(price),
        bonusType,
        bonus,
        pauseType,
        pause,
      });
    }, [price, bonusType, bonus, pauseType, pause, onSave]);

    const canSave = price && parseInt(price) > 0;

    return (
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.flex1}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.flex1}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={22} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{planLabel}</Text>
                  <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  {/* Price Input */}
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencySymbol}>&#8377;</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={price}
                        onChangeText={handlePriceChange}
                        placeholder="0"
                        placeholderTextColor="#CBD5E0"
                        keyboardType="numeric"
                        maxLength={7}
                      />
                    </View>
                  </View>

                  {/* Bonus Days */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      Bonus Days{" "}
                      <Text style={styles.optionalText}>(Optional)</Text>
                    </Text>
                    <View style={styles.radioRow}>
                      <RadioOption
                        label="Days"
                        selected={bonusType === "day"}
                        onPress={() => {
                          setBonusType("day");
                          setBonus(null);
                        }}
                      />
                      <RadioOption
                        label="Months"
                        selected={bonusType === "month"}
                        onPress={() => {
                          setBonusType("month");
                          setBonus(null);
                        }}
                      />
                    </View>
                    <CustomDropdown
                      value={bonus}
                      onChange={(option) => setBonus(option.value)}
                      options={
                        bonusType === "day"
                          ? BONUS_DAY_OPTIONS
                          : BONUS_MONTH_OPTIONS
                      }
                      placeholder={bonusType === "day" ? "Add Days" : "Add Months"}
                      small
                    />
                  </View>

                  {/* Pause Days */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      Pause Days{" "}
                      <Text style={styles.optionalText}>(Optional)</Text>
                    </Text>
                    <View style={styles.radioRow}>
                      <RadioOption
                        label="Days"
                        selected={pauseType === "day"}
                        onPress={() => {
                          setPauseType("day");
                          setPause(null);
                        }}
                      />
                      <RadioOption
                        label="Months"
                        selected={pauseType === "month"}
                        onPress={() => {
                          setPauseType("month");
                          setPause(null);
                        }}
                      />
                    </View>
                    <CustomDropdown
                      value={pause}
                      onChange={(option) => setPause(option.value)}
                      options={
                        pauseType === "day"
                          ? PAUSE_DAY_OPTIONS
                          : PAUSE_MONTH_OPTIONS
                      }
                      placeholder={pauseType === "day" ? "Add Days" : "Add Months"}
                      small
                    />
                  </View>

                  <View style={styles.bottomSpacer} />
                </ScrollView>

                {/* Save Button */}
                <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 14 }]}>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      !canSave && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!canSave}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>Set Plans</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex1: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 22,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    marginRight: 2,
  },
  priceInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    minWidth: 50,
    textAlign: "right",
    padding: 0,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 10,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#718096",
  },
  radioRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
  },
  radioOptionSelected: {
    borderColor: "#0078FF",
    backgroundColor: "#EBF8FF",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  radioSelected: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#0078FF",
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
  },
  radioLabelSelected: {
    color: "#0078FF",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default PlanDetailModal;
