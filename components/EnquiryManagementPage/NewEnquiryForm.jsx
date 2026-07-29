import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Switch,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import {
  createValidationSchema,
  validateForm,
  validationRules,
} from "../../utils/validation";
import { showToast } from "../../utils/Toaster";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomTimePicker from "../ui/CustomTimePicker";
import { getFormattedTime } from "../../utils/time";
import { getPlansandBatchesAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import EstimateModal from "./EstimateModal.jsx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 786;

const enquiryFormSchema = createValidationSchema({
  name: {
    validations: [
      { rule: validationRules.required, message: "Name is required" },
      {
        rule: validationRules.maxLength(50),
        message: "Name must be less than 50 characters",
      },
      {
        rule: validationRules.minLength(2),
        message: "Name must be more than 2 characters",
      },
    ],
  },
  contact: {
    validations: [
      { rule: validationRules.required, message: "Contact is required" },
      {
        rule: validationRules.phone,
        message: "Please enter a valid phone number",
      },
    ],
  },
  email: {
    validations: [
      {
        rule: validationRules.email,
        message: "Please enter a valid email address",
      },
    ],
  },
  startTime: {
    validations: [
      {
        rule: validationRules.required,
        message: "Start time is required",
      },
    ],
  },
  endTime: {
    validations: [
      {
        rule: validationRules.required,
        message: "End time is required",
      },
    ],
  },
});

function NewEnquiryForm({ addNewEnquiry }) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    convenientTime: "",
    email: "",
    message: "",
    startTime: getFormattedTime(new Date().getTime()),
    endTime: getFormattedTime(new Date().getTime()),
    // Estimate fields
    plan_id: "",
    fees: "",
    admission_fees: "",
    fees_type: "membership",
    discount: "",
    discount_type: "amount",
    gst_percentage: "18",
    gst_type: "inclusive",
  });

  const [formErrors, setFormErrors] = useState({});
  const [generateEstimate, setGenerateEstimate] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [estimateData, setEstimateData] = useState(null);
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Picker modal states
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showGstTypePicker, setShowGstTypePicker] = useState(false);

  // Store actual Date objects for the pickers
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());

  const insets = useSafeAreaInsets();
  // GST and discount calculation options
  const discountTypeOptions = [
    { label: "Amount (₹)", value: "amount" },
    { label: "Percentage (%)", value: "percentage" },
  ];

  const gstTypeOptions = [
    { label: "No GST", value: "no_gst" },
    { label: "Inclusive", value: "inclusive" },
    { label: "Exclusive", value: "exclusive" },
  ];

  // Fetch plans and batches
  const fetchPlansAndBatches = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);
      if (response?.status === 200) {
        setPlans(response.data.plans);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching plans",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (generateEstimate) {
      fetchPlansAndBatches();
    }
  }, [generateEstimate]);

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!formData.fees || !formData.discount) return 0;
    const fees = parseFloat(formData.fees) || 0;
    const discount = parseFloat(formData.discount) || 0;

    if (formData.discount_type === "percentage") {
      return (fees * discount) / 100;
    } else {
      return discount;
    }
  };

  // Calculate discounted fee
  const calculateDiscountedFee = () => {
    if (!formData.fees || formData.fees === 0) return 0;
    const fees = parseFloat(formData.fees) || 0;
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, fees - discountAmount);
  };

  // Calculate GST amount
  const calculateGstAmount = () => {
    if (formData.gst_type === "no_gst" || !formData.gst_percentage) return 0;
    const baseAmount =
      calculateDiscountedFee() + (parseFloat(formData.admission_fees) || 0);
    const gstPercentage = parseFloat(formData.gst_percentage) || 0;

    if (formData.gst_type === "inclusive") {
      // For inclusive GST: GST = (Total Amount × GST%) ÷ (100 + GST%)
      return (baseAmount * gstPercentage) / (100 + gstPercentage);
    } else {
      // For exclusive GST: GST = (Base Amount × GST%) ÷ 100
      return (baseAmount * gstPercentage) / 100;
    }
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    const baseAmount =
      calculateDiscountedFee() + (parseFloat(formData.admission_fees) || 0);

    if (formData.gst_type === "no_gst") {
      return baseAmount;
    } else if (formData.gst_type === "exclusive") {
      // For exclusive GST: Total = Base Amount + GST
      return baseAmount + calculateGstAmount();
    } else {
      // For inclusive GST: Total = Base Amount (GST is already included)
      return baseAmount;
    }
  };

  // Helper functions for picker labels
  const getSelectedPlanLabel = () => {
    if (!formData.plan_id) return "Select Training Plan";
    const selectedPlan = plans.find((plan) => plan.id == formData.plan_id); // Use loose equality for string/number comparison
    return selectedPlan
      ? `${selectedPlan.plans} - ₹${selectedPlan.amount}`
      : "Select Training Plan";
  };

  const getSelectedGstTypeLabel = () => {
    const selectedGstType = gstTypeOptions.find(
      (option) => option.value === formData.gst_type
    );
    return selectedGstType ? selectedGstType.label : "Select GST Type";
  };

  // Reset form function
  const resetForm = () => {
    const currentTime = new Date();
    setFormData({
      name: "",
      contact: "",
      convenientTime: "",
      email: "",
      message: "",
      startTime: getFormattedTime(currentTime.getTime()),
      endTime: getFormattedTime(currentTime.getTime()),
      // Reset estimate fields
      plan_id: "",
      fees: "",
      admission_fees: "",
      fees_type: "membership",
      discount: "",
      discount_type: "amount",
      gst_percentage: "18",
      gst_type: "inclusive",
    });
    setStartTimeDate(currentTime);
    setEndTimeDate(currentTime);
    setFormErrors({});
    setGenerateEstimate(false);
  };

  const handleChange = (name, value) => {
    setFormData((prevForm) => {
      const updatedForm = { ...prevForm, [name]: value };

      // If plan is selected, populate the amount
      if (name === "plan_id") {
        const selectedPlan = plans.find((plan) => plan.id == value); // Use loose equality for string/number comparison
        if (selectedPlan) {
          updatedForm.fees = selectedPlan.amount
            ? selectedPlan.amount.toString()
            : "";
        }
      }

      return updatedForm;
    });
  };

  // Updated time change handlers
  const handleStartTimeChange = (selectedTime) => {
    if (selectedTime) {
      // Convert ISO string to Date object if needed
      const timeDate =
        typeof selectedTime === "string"
          ? new Date(selectedTime)
          : selectedTime;
      setStartTimeDate(timeDate);
      handleChange("startTime", getFormattedTime(timeDate.getTime()));
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (selectedTime) => {
    if (selectedTime) {
      // Convert ISO string to Date object if needed
      const timeDate =
        typeof selectedTime === "string"
          ? new Date(selectedTime)
          : selectedTime;
      setEndTimeDate(timeDate);
      handleChange("endTime", getFormattedTime(timeDate.getTime()));
    }
    setShowEndTimePicker(false);
  };

  const handleSubmit = async () => {
    const { isValid, errors } = validateForm(formData, enquiryFormSchema);

    if (isValid) {
      let SDate = formData.startTime;
      let EDate = formData.endTime;
      let time = `${SDate} - ${EDate}`;

      let data = {
        ...formData,
        convenientTime: time,
        status: "pending",
        statusReason: "",
      };

      // Clean up data
      delete data.startTime;
      delete data.endTime;

      // If generating estimate, add estimate-specific data
      if (generateEstimate && formData.plan_id) {
        data.plan_id = parseInt(formData.plan_id);
        data.fees = parseFloat(formData.fees) || 0;
        data.admission_fees = parseFloat(formData.admission_fees) || 0;
        data.fees_type = "membership"; // Always default to membership
        data.discount = calculateDiscountAmount();
        data.discount_type = formData.discount_type;
        data.gst_percentage = parseFloat(formData.gst_percentage) || 18;
        data.gst_type = formData.gst_type;
      }

      let response = await addNewEnquiry(data);

      if (response?.status === 400) {
        showToast({
          type: "error",
          title: response?.message,
          visibilityTime: 1500,
        });
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response?.message,
          visibilityTime: 1500,
        });

        // If estimate was generated, show the estimate modal
        if (generateEstimate && response?.data?.estimate) {
          const estimate = response.data.estimate;

          // Transform estimate data for Receipt modal
          const estimateForModal = {
            name: estimate.client_name || formData.name,
            contact: estimate.client_contact || formData.contact,
            email: estimate.client_email || formData.email,
            gymName: estimate.gym_name,
            gymLogo: estimate.gym_logo,
            gymAddress: estimate.gym_location,
            paymentMethod: "To Be Determined",
            invoice_number: estimate.estimate_number,
            gst_number: estimate.gst_number,
            bankDetails: estimate.bank_details,
            IFSC: estimate.ifsc_code,
            branch: estimate.branch,
            account_holder_name: estimate.account_holder_name,
            upi_id: estimate.upi_id,
            items: [
              {
                date:
                  estimate.estimate_date ||
                  new Date().toISOString().split("T")[0],
                description: estimate.plan_description || "Gym Membership Plan",
                amount: estimate.fees || 0,
              },
            ],
            admissionFee: estimate.admission_fees || 0,
            fees: estimate.fees || 0,
            discount: estimate.discount || 0,
            discountedFees: estimate.discounted_fees || estimate.fees || 0,
            gstPercentage: estimate.gst_percentage || 0,
            gstType: estimate.gst_type || "no_gst",
            total: estimate.total_amount || estimate.fees || 0,
          };

          setEstimateData(estimateForModal);
          setShowEstimateModal(true);

          // Don't reset form immediately - let user see the estimate first
        } else if (generateEstimate) {
          // Reset form if no estimate was generated
          resetForm();
        } else {
          // Reset form for regular enquiry submission
          resetForm();
        }
      }
    } else {
      setFormErrors(errors);

      // You can also show an alert with the first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast({
          type: "error",
          title: firstError,
          visibilityTime: 1500,
        });
      }
    }
  };

  // Validate a single field on blur
  const validateField = (fieldName) => {
    if (!enquiryFormSchema[fieldName]) return;

    const fieldSchema = {
      [fieldName]: enquiryFormSchema[fieldName],
    };

    const { errors } = validateForm(formData, fieldSchema);

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: errors[fieldName] || null,
    }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={[styles.formContainer, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formField}>
          <Text style={styles.label}>
            Client Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            placeholder="Enter client name"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.label}>
            Contact <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.contact}
            onChangeText={(text) => handleChange("contact", text)}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.label}>
            Convenient Time (from-to) <Text style={styles.required}>*</Text>
          </Text>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color="#888888"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.input2,
                  !formData.startTime && styles.placeholderText,
                ]}
              >
                {formData.startTime ? formData?.startTime : "Select Start Time"}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#888888" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#888888"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.input2,
                  !formData.endTime && styles.placeholderText,
                ]}
              >
                {formData.endTime ? formData.endTime : "Select End Time"}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#888888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Time Pickers */}
        <CustomTimePicker
          visible={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
          onConfirm={handleStartTimeChange}
          initialTime={startTimeDate}
        />
        <CustomTimePicker
          visible={showEndTimePicker}
          onClose={() => setShowEndTimePicker(false)}
          onConfirm={handleEndTimeChange}
          initialTime={endTimeDate}
        />

        <View style={styles.formField}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => handleChange("message", text)}
            placeholder="Enter message or notes"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Generate Estimate Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleHeader}>
            <MaterialCommunityIcons name="receipt" size={20} color="#007AFF" />
            <Text style={styles.toggleLabel}>Generate Estimate</Text>
            <Switch
              value={generateEstimate}
              onValueChange={setGenerateEstimate}
              trackColor={{ false: "#e0e0e0", true: "#007AFF" }}
              thumbColor={generateEstimate ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        </View>

        {/* Expandable Fee Details Section */}
        {generateEstimate && (
          <View style={styles.expandableSection}>
            <Text style={styles.sectionTitle}>Fee Details</Text>

            {/* Training Plan Selection */}
            <View style={styles.formField}>
              <Text style={styles.label}>
                Training Plan <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerContainerWithIcon}
                onPress={() => setShowPlanPicker(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !formData.plan_id && styles.placeholderText,
                  ]}
                >
                  {getSelectedPlanLabel()}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {/* Fees */}
            <View style={styles.formField}>
              <Text style={styles.label}>
                Fees <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.fees}
                onChangeText={(text) => handleChange("fees", text)}
                placeholder="Enter fees amount"
                keyboardType="numeric"
              />
            </View>

            {/* Admission Fees */}
            <View style={styles.formField}>
              <Text style={styles.label}>Admission Fees</Text>
              <TextInput
                style={styles.input}
                value={formData.admission_fees}
                onChangeText={(text) => handleChange("admission_fees", text)}
                placeholder="Enter admission fees (optional)"
                keyboardType="numeric"
              />
            </View>

            {/* Discount */}
            <View style={styles.formField}>
              <Text style={styles.label}>Discount</Text>

              {/* Discount Type Radio Buttons */}
              <View style={styles.radioButtonContainer}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => handleChange("discount_type", "amount")}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.discount_type === "amount" &&
                        styles.selectedRadio,
                    ]}
                  >
                    {formData.discount_type === "amount" && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Amount (₹)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => handleChange("discount_type", "percentage")}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.discount_type === "percentage" &&
                        styles.selectedRadio,
                    ]}
                  >
                    {formData.discount_type === "percentage" && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Percentage (%)</Text>
                </TouchableOpacity>
              </View>

              {/* Discount Input */}
              <TextInput
                style={styles.input}
                value={formData.discount}
                onChangeText={(text) => handleChange("discount", text)}
                placeholder={
                  formData.discount_type === "amount"
                    ? "Enter discount amount"
                    : "Enter discount percentage"
                }
                keyboardType="numeric"
              />
            </View>

            {/* GST Type */}
            <View style={styles.formField}>
              <Text style={styles.label}>GST Type</Text>
              <TouchableOpacity
                style={styles.pickerContainerWithIcon}
                onPress={() => setShowGstTypePicker(true)}
              >
                <Text style={styles.pickerText}>
                  {getSelectedGstTypeLabel()}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {/* GST Percentage */}
            {formData.gst_type !== "no_gst" && (
              <View style={styles.formField}>
                <Text style={styles.label}>GST Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gst_percentage}
                  onChangeText={(text) => handleChange("gst_percentage", text)}
                  placeholder="Enter GST percentage"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Amount Summary */}
            {formData.fees && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Amount Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fees:</Text>
                  <Text style={styles.summaryValue}>₹{formData.fees || 0}</Text>
                </View>
                {formData.admission_fees && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Admission Fees:</Text>
                    <Text style={styles.summaryValue}>
                      ₹{formData.admission_fees}
                    </Text>
                  </View>
                )}
                {formData.discount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Discount ({formData.discount_type === "amount" ? "₹" : ""}
                      {formData.discount}
                      {formData.discount_type === "percentage" ? "%" : ""}):
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -₹{calculateDiscountAmount().toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>After Discount:</Text>
                  <Text style={styles.summaryValue}>
                    ₹{calculateDiscountedFee()}
                  </Text>
                </View>
                {formData.gst_type !== "no_gst" && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      GST ({formData.gst_percentage}%):
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₹{calculateGstAmount().toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.summaryLabel, styles.totalLabel]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue]}>
                    ₹{calculateTotalAmount().toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            {
              marginBottom: insets.bottom,
              flexDirection: "row",
              justifyContent: "center",
            },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#030A15", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.submitButton,
              isLoading && styles.disabledButton,
              generateEstimate && { width: isTablet ? "80%" : "90%" },
            ]}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? "Processing..."
                : generateEstimate
                ? "Submit & Generate Estimate"
                : "Submit Details"}
            </Text>
            <MaterialCommunityIcons
              name={generateEstimate ? "send" : "send"}
              size={16}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Estimate Modal */}
        {estimateData && (
          <EstimateModal
            visible={showEstimateModal}
            onClose={() => {
              setShowEstimateModal(false);
              setEstimateData(null);
              resetForm();
            }}
            estimate={estimateData}
            gymData={{
              name: estimateData.gymName,
              logo: estimateData.gymLogo,
              location: estimateData.gymAddress,
              gst_number: estimateData.gst_number,
              account_holdername: estimateData.account_holder_name,
              account_number: estimateData.bankDetails,
              account_ifsccode: estimateData.IFSC,
              account_branch: estimateData.branch,
              upi_id: estimateData.upi_id,
            }}
            RedButtonText=""
          />
        )}

        {/* Plan Picker Modal */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPlanPicker}
          onRequestClose={() => setShowPlanPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowPlanPicker(false)}>
            <View style={styles.pickerModalContainer}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowPlanPicker(false)}>
                      <Text style={styles.pickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select Training Plan</Text>
                    <TouchableOpacity onPress={() => setShowPlanPicker(false)}>
                      <Text style={styles.pickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScrollView}>
                    {plans.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.pickerOption,
                          formData.plan_id === plan.id &&
                            styles.selectedPickerOption,
                        ]}
                        onPress={() => {
                          handleChange("plan_id", plan.id);
                          setShowPlanPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.plan_id === plan.id &&
                              styles.selectedPickerOptionText,
                          ]}
                        >
                          {plan.plans} - ₹{plan.amount}
                        </Text>
                        {formData.plan_id === plan.id && (
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* GST Type Picker Modal */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={showGstTypePicker}
          onRequestClose={() => setShowGstTypePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowGstTypePicker(false)}>
            <View style={styles.pickerModalContainer}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowGstTypePicker(false)}
                    >
                      <Text style={styles.pickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select GST Type</Text>
                    <TouchableOpacity
                      onPress={() => setShowGstTypePicker(false)}
                    >
                      <Text style={styles.pickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={[
                      styles.pickerScrollView,
                      { paddingBottom: insets.bottom },
                    ]}
                  >
                    {gstTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.pickerOption,
                          formData.gst_type === option.value &&
                            styles.selectedPickerOption,
                        ]}
                        onPress={() => {
                          handleChange("gst_type", option.value);
                          setShowGstTypePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.gst_type === option.value &&
                              styles.selectedPickerOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {formData.gst_type === option.value && (
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default NewEnquiryForm;

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 14,
    marginBottom: 20,
    color: "#007AFF",
  },
  formField: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    color: "#171A1F",
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 5,
    padding: 12,
    fontSize: isTablet ? 16 : 12,
    backgroundColor: "#fff",
    marginRight: 1,
    minHeight: isTablet ? 48 : undefined,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  toggleSection: {
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 10,
  },
  expandableSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingBottom: 10,
  },
  doubleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  halfInputGroup: {
    flex: 1,
  },
  pickerContainerWithIcon: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: 15,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: isTablet ? 48 : 48,
  },
  pickerText: {
    fontSize: isTablet ? 16 : 14,
    color: "#2C3E50",
    flex: 1,
  },
  placeholderText: {
    color: "#888888",
  },
  summarySection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  discountText: {
    color: "#e74c3c",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
  },
  radioButtonContainer: {
    flexDirection: "row",
    marginBottom: 15,
    paddingVertical: 5,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    paddingVertical: 5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectedRadio: {
    borderColor: "#007AFF",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  radioText: {
    fontSize: 14,
    color: "#333",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: isTablet ? 12 : 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    width: "60%",
    minHeight: isTablet ? 48 : undefined,
  },
  disabledButton: {
    backgroundColor: "#95a5a6",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
    marginRight: 8,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 15,
    height: isTablet ? 48 : 40,
    borderWidth: 0.5,
    borderColor: "#bdc3c7",
    marginRight: 1,
    flex: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input2: {
    flex: 1,
    fontSize: isTablet ? 16 : 12,
    color: "#333333",
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  placeholderText: {
    color: "#888888",
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  // Custom picker modal styles
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedPickerOption: {
    backgroundColor: "#f8f9fa",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedPickerOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
