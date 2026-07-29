import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomIOSDatePicker from "../../components/ui/CustomIOSDatePicker";
import {
  getPlansandBatchesAPI,
  updateFeeStatusAPI,
  updateFeeStatusImportAPI,
} from "../../services/Api";
import { updateManualClientFeeStatusAPI } from "../../services/manualClientApi";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width } = Dimensions.get("window");
const isTablet = width >= 786;

const ManualFeeUpdate = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse client data from params
  const clientId = params.clientId ? parseInt(params.clientId) : null;
  const importId = params.import_id ? parseInt(params.import_id) : null;
  const clientName = params.clientName || "";
  const clientPlanId = params.planId ? parseInt(params.planId) : null;
  const clientBatchId = params.batchId ? parseInt(params.batchId) : null;
  const latestMembershipId = params.latestMembershipId
    ? parseInt(params.latestMembershipId)
    : null;
  const isManual = params.isManual === "true";
  const isImport = params.isImport === "true";

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gymId, setGymId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedPlan, setSelectedPlan] = useState(clientPlanId);
  const [selectedBatch, setSelectedBatch] = useState(clientBatchId);
  const [selectedPlanCategory, setSelectedPlanCategory] =
    useState("gym_membership");
  const [startDate, setStartDate] = useState(new Date());
  const [expiresAt, setExpiresAt] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [showDiscount, setShowDiscount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const planScrollViewRef = useRef(null);

  const paymentMethodOptions = [
    { label: "Cash", value: "cash" },
    { label: "UPI", value: "upi" },
    { label: "Card", value: "card" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Cheque", value: "cheque" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-calculate expiry date based on plan duration
  useEffect(() => {
    if (selectedPlan && startDate) {
      const plan = plans.find((p) => p.id === selectedPlan);
      if (plan?.duration) {
        const expiry = new Date(startDate);
        expiry.setMonth(expiry.getMonth() + parseInt(plan.duration));
        setExpiresAt(expiry);
      }
    }
  }, [selectedPlan, startDate, plans]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const storedGymId = await getToken("gym_id");
      setGymId(storedGymId);

      if (storedGymId) {
        const response = await getPlansandBatchesAPI(storedGymId);
        if (response?.status === 200) {
          setPlans(response.data?.plans || []);
          setBatches(response.data?.batches || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast({
        type: "error",
        title: "Failed to load data",
        desc: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanAmount = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    return plan?.amount || 0;
  };

  const getTotalAmount = () => {
    const planAmount = getPlanAmount();
    const discount = parseFloat(discountAmount) || 0;
    return Math.max(0, planAmount - discount);
  };

  const formatDateForSQL = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date) => {
    if (!date) return "Select date";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleDateChange = (type, event, selectedDate) => {
    if (Platform.OS === "android") {
      if (type === "start") {
        setShowStartDatePicker(false);
      } else {
        setShowExpiryDatePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        setTimeout(() => {
          if (type === "start") {
            setStartDate(selectedDate);
          } else {
            setExpiresAt(selectedDate);
          }
        }, 0);
      }
    } else {
      if (selectedDate) {
        if (type === "start") {
          setStartDate(selectedDate);
        } else {
          setExpiresAt(selectedDate);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      showToast({
        type: "error",
        title: "Please select a plan",
      });
      return;
    }

    if (!startDate || !expiresAt) {
      showToast({
        type: "error",
        title: "Please select both dates",
      });
      return;
    }

    setLoading(true);
    try {
      const joined_at = formatDateForSQL(startDate);
      const expires_at = formatDateForSQL(expiresAt);
      const discount_value = parseFloat(discountAmount) || 0;
      const total_amount = getTotalAmount();

      if (isManual || isImport) {
        const payload = {
          manual_client_id: isManual ? clientId : importId,
          gym_id: parseInt(gymId),
          plan_id: selectedPlan,
          batch_id: selectedBatch || null,
          fees: getPlanAmount(),
          total_amount,
          discount_amount: discount_value,
          payment_method: paymentMethod,
          joined_at,
          expires_at,
        };

        const response = isManual
          ? await updateManualClientFeeStatusAPI(payload)
          : await updateFeeStatusImportAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Fee status updated successfully!",
          });
          router.push({
            pathname: "/owner/client",
            params: { scrollToClientId: clientId },
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: response?.detail || "Failed to update fee status",
          });
        }
      } else {
        const payload = {
          client_id: clientId,
          gym_id: parseInt(gymId),
          type: "fees",
          plan_id: selectedPlan,
          batch_id: selectedBatch || null,
          fees: total_amount,
          total_amount,
          payment_method: paymentMethod,
          payment_reference_number: null,
          gst_type: "no_gst",
          gst_percentage: 0,
          membership_id: latestMembershipId || null,
          joined_date: joined_at,
          expires_at,
        };

        const response = await updateFeeStatusAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Fee status updated successfully!",
          });
          router.push({
            pathname: "/owner/client",
            params: { scrollToClientId: clientId },
          });
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc: response?.message || "Failed to update fee status",
          });
        }
      }
    } catch (error) {
      console.error("Error updating fee status:", error);
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const planOptions = plans.map((p) => ({
    label: `${p.plans} - ₹${p.amount}`,
    value: p.id,
  }));

  const batchOptions = batches.map((b) => ({
    label: b.batch_name,
    value: b.id,
  }));

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0078FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HardwareBackHandler onBackPress={() => false} />

      {/* Header with Client Name */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Update Fees</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {clientName}
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Plan Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Plan & Batch</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Plan <Text style={styles.required}>*</Text>
            </Text>

            {/* Plan Category Radio Buttons */}
            <View style={styles.planTypeRadioContainer}>
              <TouchableOpacity
                style={styles.planTypeRadioButton}
                onPress={() => {
                  setSelectedPlanCategory("gym_membership");
                  setSelectedPlan(null);
                }}
              >
                <View style={styles.radioButton}>
                  {selectedPlanCategory === "gym_membership" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.planTypeRadioText,
                    selectedPlanCategory === "gym_membership" &&
                      styles.planTypeRadioTextActive,
                  ]}
                >
                  Membership
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.planTypeRadioButton}
                onPress={() => {
                  setSelectedPlanCategory("personal_training");
                  setSelectedPlan(null);
                }}
              >
                <View style={styles.radioButton}>
                  {selectedPlanCategory === "personal_training" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.planTypeRadioText,
                    selectedPlanCategory === "personal_training" &&
                      styles.planTypeRadioTextActive,
                  ]}
                >
                  Personal Training
                </Text>
              </TouchableOpacity>
            </View>

            {/* Plan Cards */}
            <View style={styles.planCategoryContainer}>
              <ScrollView
                ref={planScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.planCardsScroll}
              >
                {plans
                  .filter((plan) =>
                    selectedPlanCategory === "gym_membership"
                      ? !plan.personal_training
                      : plan.personal_training
                  )
                  .map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        selectedPlanCategory === "personal_training" &&
                          styles.planCardPT,
                        selectedPlan === plan.id &&
                          (selectedPlanCategory === "gym_membership"
                            ? styles.planCardSelected
                            : styles.planCardSelectedPT),
                      ]}
                      onPress={() => setSelectedPlan(plan.id)}
                    >
                      {selectedPlan === plan.id ? (
                        <View
                          style={
                            selectedPlanCategory === "gym_membership"
                              ? styles.planCardSelectedBadge
                              : styles.planCardSelectedBadgePT
                          }
                        >
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color="#fff"
                          />
                        </View>
                      ) : null}
                      <Text
                        style={[
                          styles.planCardDuration,
                          selectedPlan === plan.id &&
                            styles.planCardDurationSelected,
                        ]}
                      >
                        {plan.plans || ""}
                      </Text>
                      <View style={styles.planCardPriceContainer}>
                        {plan.original > plan.amount ? (
                          <Text style={styles.planCardOriginalPrice}>
                            ₹{plan.original || 0}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.planCardPrice,
                            selectedPlan === plan.id &&
                              styles.planCardPriceSelected,
                          ]}
                        >
                          ₹{plan.amount || 0}
                        </Text>
                      </View>

                      <View style={styles.planCardBonusBadge}>
                        <Text style={styles.planCardBonusText}>
                          {plan.duration} Month {plan.bonus ? "+" : ""}
                          {plan.bonus || ""} {plan.bonus_type || ""}
                        </Text>
                      </View>

                      {plan.pause ? (
                        <View style={styles.planCardPauseInfo}>
                          <MaterialCommunityIcons
                            name="pause-circle-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text style={styles.planCardPauseText}>
                            {plan.pause} {plan.pause_type || ""} pause
                          </Text>
                        </View>
                      ) : null}
                      {plan.is_couple ? (
                        <View style={styles.planCardCoupleBadge}>
                          <MaterialCommunityIcons
                            name="account-multiple"
                            size={12}
                            color="#EC4899"
                          />
                          <Text style={styles.planCardCoupleText}>
                            Couple Plan
                          </Text>
                        </View>
                      ) : null}
                      {plan.is_buddy ? (
                        <View style={styles.planCardBuddyBadge}>
                          <MaterialCommunityIcons
                            name="account-group"
                            size={12}
                            color="#8B5CF6"
                          />
                          <Text style={styles.planCardBuddyText}>
                            Buddy Plan
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Batch</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                value={selectedBatch}
                onValueChange={setSelectedBatch}
                items={batchOptions}
                placeholder={{
                  label: "Choose a batch (optional)",
                  value: null,
                }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#6B7280"
                    style={styles.pickerIcon}
                  />
                )}
                pickerProps={{
                  itemStyle: {
                    color: "#000000",
                  },
                }}
              />
            </View>
          </View>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Period</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.label}>
                Start Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#0078FF" />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.label}>
                Expiry Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowExpiryDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#0078FF" />
                <Text style={styles.dateText}>{formatDate(expiresAt)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {Platform.OS === "ios" ? (
            <>
              <CustomIOSDatePicker
                visible={showStartDatePicker}
                onClose={() => setShowStartDatePicker(false)}
                onConfirm={(date) => {
                  setStartDate(date);
                  setShowStartDatePicker(false);
                }}
                initialDate={startDate || new Date()}
                title="Select Start Date"
              />
              <CustomIOSDatePicker
                visible={showExpiryDatePicker}
                onClose={() => setShowExpiryDatePicker(false)}
                onConfirm={(date) => {
                  setExpiresAt(date);
                  setShowExpiryDatePicker(false);
                }}
                initialDate={expiresAt || new Date()}
                title="Select Expiry Date"
              />
            </>
          ) : (
            <>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) =>
                    handleDateChange("start", event, selectedDate)
                  }
                />
              )}

              {showExpiryDatePicker && (
                <DateTimePicker
                  value={expiresAt || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) =>
                    handleDateChange("expiry", event, selectedDate)
                  }
                />
              )}
            </>
          )}
        </View>

        {/* Fee Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          {/* Plan Amount Display */}
          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Plan Amount</Text>
              <Text style={styles.amountValue}>₹{getPlanAmount()}</Text>
            </View>

            {/* Add Discount Toggle */}
            {!showDiscount ? (
              <TouchableOpacity
                style={styles.addDiscountButton}
                onPress={() => setShowDiscount(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#0078FF" />
                <Text style={styles.addDiscountText}>Add Discount</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.discountSection}>
                <View style={styles.discountHeader}>
                  <Text style={styles.discountLabel}>Discount</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDiscount(false);
                      setDiscountAmount("0");
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.discountInputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.discountInput}
                    value={discountAmount}
                    onChangeText={setDiscountAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{getTotalAmount()}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                items={paymentMethodOptions}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#6B7280"
                    style={styles.pickerIcon}
                  />
                )}
                pickerProps={{
                  itemStyle: {
                    color: "#000000",
                  },
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.submitButtonText}>Confirm Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  required: {
    color: "#EF4444",
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  pickerIcon: {
    marginRight: 16,
    marginTop: Platform.OS === "ios" ? 0 : 0,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
  },
  dateText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  amountCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addDiscountButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  addDiscountText: {
    fontSize: 14,
    color: "#0078FF",
    fontWeight: "600",
  },
  discountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  discountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  discountLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  discountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    fontSize: 16,
    color: "#6B7280",
    marginRight: 6,
  },
  discountInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 14,
    fontWeight: "600",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: "#D1D5DB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10B981",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0078FF",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  planTypeRadioContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  planTypeRadioButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0078FF",
  },
  planTypeRadioText: {
    fontSize: isTablet ? 15 : 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  planTypeRadioTextActive: {
    color: "#0078FF",
    fontWeight: "600",
  },
  planCategoryContainer: {
    marginBottom: 12,
  },
  planCardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  planCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  planCardPT: {
    borderColor: "#FED7AA",
  },
  planCardSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  planCardSelectedPT: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  planCardSelectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#6366F1",
    borderRadius: 12,
  },
  planCardSelectedBadgePT: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#F59E0B",
    borderRadius: 12,
  },
  planCardDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  planCardDurationSelected: {
    color: "#6366F1",
  },
  planCardPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planCardOriginalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  planCardPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
  },
  planCardPriceSelected: {
    color: "#6366F1",
  },
  planCardBonusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  planCardBonusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#16A34A",
  },
  planCardPauseInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  planCardPauseText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  planCardCoupleBadge: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  planCardCoupleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EC4899",
    marginLeft: 4,
  },
  planCardBuddyBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  planCardBuddyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 4,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingRight: 40,
    color: "#111827",
    fontWeight: "500",
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 40,
    color: "#111827",
    fontWeight: "500",
  },
  placeholder: {
    color: "#9CA3AF",
  },
  iconContainer: {
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
};

export default ManualFeeUpdate;
