import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { showToast } from "../../utils/Toaster";
import CustomDropdown from "../ui/CustomDropdown";
const { width, height } = Dimensions.get("window");

// Helper function to generate dropdown options
const generateOptions = (start, end, type) => {
  const options = [];
  for (let i = start; i <= end; i++) {
    options.push({
      label: `${i} ${type}${i > 1 ? "s" : ""}`,
      value: i,
    });
  }
  return options;
};

// Dropdown options
const DURATION_OPTIONS = generateOptions(1, 24, "Month");
const BONUS_DAY_OPTIONS = generateOptions(1, 30, "Day");
const BONUS_MONTH_OPTIONS = generateOptions(1, 12, "Month");
const PAUSE_DAY_OPTIONS = generateOptions(1, 30, "Day");
const PAUSE_MONTH_OPTIONS = generateOptions(1, 12, "Month");

// Buddy count options (2 to 15)
const BUDDY_COUNT_OPTIONS = [];
for (let i = 2; i <= 15; i++) {
  BUDDY_COUNT_OPTIONS.push({
    label: `${i} Members`,
    value: i,
  });
}

// Sessions per month options (1 to 30)
const SESSIONS_COUNT_OPTIONS = [];
for (let i = 1; i <= 30; i++) {
  SESSIONS_COUNT_OPTIONS.push({
    label: `${i} Session${i > 1 ? "s" : ""}/Month`,
    value: i,
  });
}

// Plan For options
const PLAN_FOR_OPTIONS = [
  { id: "individual", label: "Individual", icon: "account" },
  { id: "couple", label: "Couple", icon: "account-multiple" },
  { id: "buddy", label: "Buddy", icon: "account-group" },
];

const MEMBERSHIP_SERVICES = [
  "Access to Gym Floor",
  "Cardio Equipment Access",
  "Strength Training Equipment",
  "Free Weights Area",
  "Functional Training Zone",
  "Group Fitness Classes",
  "Yoga Classes",
  "Zumba Classes",
  "Gymnastics",
  "Spinning/Cycling Classes",
  "Aerobics Classes",
  "CrossFit Classes",
  "HIIT Group Sessions",
  "Locker & Changing Room",
  "Shower Facilities",
  "Sauna & Steam Room",
  "Swimming Pool Access",
  "Parking Facility",
  "Towel Service",
  "Water & Refreshments",
  "Wi-Fi Access",
  "Fitness Assessment",
  "Diet Consultation",
  "Guest Passes",
  "24/7 Gym Access",
];

const PERSONAL_TRAINING_SERVICES = [
  "One-on-One Personal Training",
  "Small Group Personal Training",
  "Strength Training Coaching",
  "Weight Loss Coaching",
  "Muscle Building Coaching",
  "Fat Loss & Toning Programs",
  "Body Transformation Coaching",
  "Functional Training Coaching",
  "Mobility & Flexibility Training",
  "Corrective Exercise Training",
  "Posture Correction Coaching",
  "Endurance Training",
  "HIIT Personal Training",
  "Circuit Training Coaching",
  "Sports-Specific Training",
  "Athletic Performance Coaching",
  "Powerlifting Coaching",
  "Olympic Lifting Coaching",
  "Kettlebell Coaching",
  "TRX Suspension Training",
  "Boxing / Kickboxing Conditioning",
  "Nutrition Counseling",
  "Meal Planning",
  "Diet & Supplement Guidance",
  "Calorie & Macro Tracking",
  "Lifestyle & Habit Coaching",
  "Online Check-in / Accountability Coaching",
];

const EntityModal = ({
  visible,
  onClose,
  onSave,
  entityType,
  isEditMode = false,
  initialData = {},
  //   styles,
  insets,
}) => {
  const isPlan = entityType === "plans";

  const [name, setName] = useState(
    isPlan ? initialData.plans || "" : initialData.batch_name || "",
  );

  const [originalAmount, setOriginalAmount] = useState(
    isPlan && initialData.original ? String(initialData.original) : "",
  );

  const [discountedAmount, setDiscountedAmount] = useState(
    isPlan && initialData.amount ? String(initialData.amount) : "",
  );

  const [discountPercentage, setDiscountPercentage] = useState("");

  const [duration, setDuration] = useState(
    isPlan && initialData.duration ? initialData.duration : null,
  );

  const [bonus, setBonus] = useState(
    isPlan && initialData.bonus ? initialData.bonus : null,
  );

  const [bonusType, setBonusType] = useState(
    isPlan && initialData.bonus_type ? initialData.bonus_type : "day",
  );

  const [pause, setPause] = useState(
    isPlan && initialData.pause ? initialData.pause : null,
  );

  const [pauseType, setPauseType] = useState(
    isPlan && initialData.pause_type ? initialData.pause_type : "day",
  );

  const [pauseInfoVisible, setPauseInfoVisible] = useState(false);

  const [personalTraining, setPersonalTraining] = useState(
    initialData.personal_training,
  );

  const [services, setServices] = useState(initialData.services || []);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState("");

  const [timing, setTiming] = useState(
    !isPlan && initialData.timing ? initialData.timing : "",
  );

  const [description, setDescription] = useState(initialData.description || "");

  // Determine initial planFor value from is_couple or plan_for
  const getInitialPlanFor = () => {
    if (initialData.plan_for) {
      return initialData.plan_for;
    }
    if (initialData.is_couple) {
      return "couple";
    }
    return "individual";
  };

  const [planFor, setPlanFor] = useState(getInitialPlanFor());
  const [buddyCount, setBuddyCount] = useState(initialData.buddy_count || null);
  const [sessionsCount, setSessionsCount] = useState(initialData.sessions_count || null);

  // Reset form when modal is opened/closed or entity type changes
  useEffect(() => {
    if (visible) {
      setName(isPlan ? initialData.plans || "" : initialData.batch_name || "");
      setOriginalAmount(
        isPlan && initialData.original ? String(initialData.original) : "",
      );
      setDiscountedAmount(
        isPlan && initialData.amount ? String(initialData.amount) : "",
      );

      // Calculate discount percentage from original and discounted amounts
      let calculatedDiscountPercentage = "";
      if (isPlan && initialData.original && initialData.amount) {
        const original = parseFloat(initialData.original);
        const discounted = parseFloat(initialData.amount);
        if (discounted < original) {
          calculatedDiscountPercentage = (
            ((original - discounted) / original) *
            100
          ).toFixed(2);
        }
      }
      setDiscountPercentage(calculatedDiscountPercentage);

      setDuration(isPlan && initialData.duration ? initialData.duration : null);
      setBonus(isPlan && initialData.bonus ? initialData.bonus : null);
      setBonusType(
        isPlan && initialData.bonus_type ? initialData.bonus_type : "day",
      );
      setPause(isPlan && initialData.pause ? initialData.pause : null);
      setPauseType(
        isPlan && initialData.pause_type ? initialData.pause_type : "day",
      );
      setPersonalTraining(initialData.personal_training || false);
      setServices(initialData.services || []);
      setTiming(!isPlan && initialData.timing ? initialData.timing : "");
      setDescription(initialData.description || "");
      // Set planFor based on plan_for or is_couple
      if (initialData.plan_for) {
        setPlanFor(initialData.plan_for);
      } else if (initialData.is_couple) {
        setPlanFor("couple");
      } else {
        setPlanFor("individual");
      }
      setBuddyCount(initialData.buddy_count || null);
      setSessionsCount(initialData.sessions_count || null);

      // Set initial load complete after a small delay to allow all states to settle
      setTimeout(() => {
        setInitialLoadComplete(true);
      }, 100);
    } else {
      setInitialLoadComplete(false);
    }
  }, [visible, entityType, initialData, isPlan]);

  // Clear services when switching between membership and personal training
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (visible && initialLoadComplete) {
      setServices([]);
    }
  }, [personalTraining]);

  // Add custom services
  const handleAddCustomServices = () => {
    Keyboard.dismiss();

    if (!customServiceInput.trim()) {
      showToast({
        type: "error",
        title: "Please enter service names",
      });
      return;
    }

    // Split by comma and trim whitespace
    const newServices = customServiceInput
      .split(",")
      .map((service) => service.trim())
      .filter((service) => service.length > 0 && !services.includes(service));

    if (newServices.length > 0) {
      setServices([...services, ...newServices]);
      setCustomServiceInput("");
      showToast({
        type: "success",
        title: `${newServices.length} service${
          newServices.length > 1 ? "s" : ""
        } added`,
      });
    } else {
      showToast({
        type: "info",
        title: "Services already added or invalid",
      });
    }
  };

  const handleSave = useCallback(() => {
    Keyboard.dismiss();

    // Validate required fields
    if (!name.trim()) {
      showToast({
        type: "error",
        title: `Please enter ${isPlan ? "plan" : "batch"} name`,
      });
      return;
    }

    if (isPlan && (!originalAmount.trim() || !duration)) {
      showToast({
        type: "error",
        title: "Please fill in all required fields",
      });
      return;
    }

    // Validate original amount is a valid number
    if (isPlan && originalAmount.trim()) {
      const amountNum = parseFloat(originalAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        showToast({
          type: "error",
          title: "Original amount must be a valid number greater than 0",
        });
        return;
      }
    }

    // Validate discounted amount if provided
    if (isPlan && discountedAmount.trim()) {
      const discountedNum = parseFloat(discountedAmount);
      if (isNaN(discountedNum) || discountedNum <= 0) {
        showToast({
          type: "error",
          title: "Final amount must be a valid number greater than 0",
        });
        return;
      }

      // Final amount should not be more than original amount
      const originalNum = parseFloat(originalAmount);
      if (discountedNum > originalNum) {
        showToast({
          type: "error",
          title: "Final amount cannot be more than original amount",
        });
        return;
      }
    }

    if (!isPlan && !timing.trim()) {
      showToast({
        type: "error",
        title: "Please enter batch timing",
      });
      return;
    }

    // Validate services
    if (isPlan && services.length === 0) {
      showToast({
        type: "error",
        title: "Please select at least one service",
      });
      return;
    }

    // Create payload based on entity type
    const payload = isPlan
      ? {
          plans: name,
          original: originalAmount,
          amount: discountedAmount || null,
          duration: duration,
          bonus: bonus || null,
          bonus_type: bonus ? bonusType : null,
          pause: pause || null,
          pause_type: pause ? pauseType : null,
          description: description,
          personal_training: personalTraining,
          services: services || [],
          is_couple: planFor === "couple",
          plan_for: planFor,
          buddy_count: planFor === "buddy" ? buddyCount : null,
          sessions_count:
            personalTraining && (planFor === "individual" || planFor === "couple")
              ? sessionsCount
              : null,
          ...(isEditMode && initialData.id ? { id: initialData.id } : {}),
        }
      : {
          ...(isEditMode ? { batch_id: initialData.id } : {}),
          batch_name: name,
          timing: timing,
          description: description,
        };

    onSave(payload);
  }, [
    name,
    originalAmount,
    discountedAmount,
    duration,
    bonus,
    bonusType,
    pause,
    pauseType,
    timing,
    description,
    personalTraining,
    services,
    planFor,
    buddyCount,
    sessionsCount,
    isPlan,
    isEditMode,
    initialData,
    onSave,
  ]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? "Edit" : "Create New"} {isPlan ? "Plan" : "Batch"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.formContainer,
              { paddingBottom: insets.bottom + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
          >
            {/* Plan-specific fields */}
            {isPlan && (
              <>
                {/* Plan Type Radio Buttons */}
                <View style={styles.radioGroup}>
                  <Text style={styles.inputLabel}>Plan Type</Text>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setPersonalTraining(false)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {!personalTraining ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Membership</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setPersonalTraining(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {personalTraining ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Personal Training</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Plan For - Tab Style */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plan For</Text>
                  <View style={styles.planForTabsContainer}>
                    {PLAN_FOR_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.planForTab,
                          planFor === option.id && styles.planForTabActive,
                        ]}
                        onPress={() => {
                          setPlanFor(option.id);
                          // Reset buddy count when switching away from buddy
                          if (option.id !== "buddy") {
                            setBuddyCount(null);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.planForTabText,
                            planFor === option.id &&
                              styles.planForTabTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Buddy Count Dropdown - Shows only when Buddy is selected */}
                {planFor === "buddy" && (
                  <CustomDropdown
                    label="Number of Members"
                    value={buddyCount}
                    onChange={(option) => setBuddyCount(option.value)}
                    options={BUDDY_COUNT_OPTIONS}
                    placeholder="Select number of members (2-15)"
                  />
                )}

                {/* Sessions Count (for Individual PT and Couple PT only) */}
                {personalTraining &&
                  (planFor === "individual" || planFor === "couple") && (
                    <CustomDropdown
                      label="Number of Sessions per Month (Optional)"
                      value={sessionsCount}
                      onChange={(option) => setSessionsCount(option.value)}
                      options={SESSIONS_COUNT_OPTIONS}
                      placeholder="Select sessions per month"
                    />
                  )}

                {/* Plan Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plan Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter plan name"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                  />
                </View>

                {/* Duration */}
                <CustomDropdown
                  label="Plan Duration"
                  value={duration}
                  onChange={(option) => setDuration(option.value)}
                  options={DURATION_OPTIONS}
                  placeholder="Select plan duration"
                />

                {/* Bonus/Offer Duration */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Bonus/Offer Duration{" "}
                    <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>

                  {/* Bonus Type Radio Buttons */}
                  <View style={styles.bonusTypeRadioContainer}>
                    <TouchableOpacity
                      style={styles.bonusTypeRadioOption}
                      onPress={() => {
                        setBonusType("day");
                        setBonus(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {bonusType === "day" ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Days</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bonusTypeRadioOption}
                      onPress={() => {
                        setBonusType("month");
                        setBonus(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {bonusType === "month" ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Months</Text>
                    </TouchableOpacity>
                  </View>

                  <CustomDropdown
                    value={bonus}
                    onChange={(option) => setBonus(option.value)}
                    options={
                      bonusType === "day"
                        ? BONUS_DAY_OPTIONS
                        : BONUS_MONTH_OPTIONS
                    }
                    placeholder={`Select bonus duration in ${
                      bonusType === "day" ? "days" : "months"
                    }`}
                  />
                </View>

                {/* Pause Duration */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelWithInfo}>
                    <Text style={styles.inputLabel}>
                      Pause Duration{" "}
                      <Text style={styles.optionalText}>(Optional)</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPauseInfoVisible(true)}
                      style={styles.infoIcon}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#0078FF"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Pause Type Radio Buttons */}
                  <View style={styles.bonusTypeRadioContainer}>
                    <TouchableOpacity
                      style={styles.bonusTypeRadioOption}
                      onPress={() => {
                        setPauseType("day");
                        setPause(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {pauseType === "day" ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Days</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bonusTypeRadioOption}
                      onPress={() => {
                        setPauseType("month");
                        setPause(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {pauseType === "month" ? (
                          <View style={styles.radioSelected} />
                        ) : null}
                      </View>
                      <Text style={styles.radioLabel}>Months</Text>
                    </TouchableOpacity>
                  </View>

                  <CustomDropdown
                    value={pause}
                    onChange={(option) => setPause(option.value)}
                    options={
                      pauseType === "day"
                        ? PAUSE_DAY_OPTIONS
                        : PAUSE_MONTH_OPTIONS
                    }
                    placeholder={`Select pause duration in ${
                      pauseType === "day" ? "days" : "months"
                    }`}
                  />
                </View>

                {/* Original Amount and Discount Percentage Row */}
                <View style={styles.inputGroup}>
                  <View style={styles.amountRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Original Amount</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter original amount"
                        placeholderTextColor="#aaa"
                        keyboardType="decimal-pad"
                        value={originalAmount}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9.]/g, "");
                          const parts = numericText.split(".");
                          const validText =
                            parts.length > 2
                              ? parts[0] + "." + parts.slice(1).join("")
                              : numericText;
                          setOriginalAmount(validText);
                        }}
                        returnKeyType="next"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>
                        Discount %{" "}
                        <Text style={styles.optionalText}>(Optional)</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: "#E8F5E9" }]}
                        placeholder="0"
                        placeholderTextColor="#aaa"
                        keyboardType="decimal-pad"
                        value={discountPercentage}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9.]/g, "");
                          const parts = numericText.split(".");
                          let validText =
                            parts.length > 2
                              ? parts[0] + "." + parts.slice(1).join("")
                              : numericText;

                          // Limit to 100%
                          const percentValue = parseFloat(validText);
                          if (!isNaN(percentValue) && percentValue > 100) {
                            validText = "100";
                          }

                          // Calculate discounted amount
                          let newDiscountedAmount = "";
                          if (
                            originalAmount &&
                            validText &&
                            !isNaN(parseFloat(validText))
                          ) {
                            const original = parseFloat(originalAmount);
                            const discount = parseFloat(validText);
                            newDiscountedAmount = (
                              original -
                              (original * discount) / 100
                            ).toFixed(2);
                          }

                          setDiscountPercentage(validText);
                          setDiscountedAmount(newDiscountedAmount);
                        }}
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                </View>

                {/* Final Amount (After Discount) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Final Amount (After Discount)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: "#E3F2FD" },
                      originalAmount &&
                        discountedAmount &&
                        parseFloat(discountedAmount) >
                          parseFloat(originalAmount) &&
                        styles.errorBorder,
                    ]}
                    placeholder="Auto-calculated or enter manually"
                    placeholderTextColor="#aaa"
                    keyboardType="decimal-pad"
                    value={discountedAmount}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9.]/g, "");
                      const parts = numericText.split(".");
                      const validText =
                        parts.length > 2
                          ? parts[0] + "." + parts.slice(1).join("")
                          : numericText;

                      // Calculate discount percentage
                      let newDiscountPercentage = "";
                      if (
                        originalAmount &&
                        validText &&
                        !isNaN(parseFloat(validText))
                      ) {
                        const original = parseFloat(originalAmount);
                        const discounted = parseFloat(validText);
                        if (discounted < original) {
                          newDiscountPercentage = (
                            ((original - discounted) / original) *
                            100
                          ).toFixed(2);
                        }
                      }

                      setDiscountedAmount(validText);
                      setDiscountPercentage(newDiscountPercentage);
                    }}
                    returnKeyType="next"
                  />

                  {/* Error Display - Show only when discounted > original */}
                  {originalAmount &&
                  discountedAmount &&
                  parseFloat(discountedAmount) > parseFloat(originalAmount) ? (
                    <View style={styles.errorDisplayContainer}>
                      <Icon name="alert-circle" size={16} color="#E53E3E" />
                      <Text style={styles.errorDisplayText}>
                        Final amount cannot be more than original amount
                      </Text>
                    </View>
                  ) : null}

                  {/* Price Display - Show when both amounts are entered and valid */}
                  {originalAmount &&
                  discountedAmount &&
                  parseFloat(discountedAmount) < parseFloat(originalAmount) ? (
                    <View style={styles.priceDisplayContainer}>
                      <View style={styles.priceDisplayRow}>
                        <Text style={styles.strikethroughPrice}>
                          ₹{parseFloat(originalAmount).toFixed(2)}
                        </Text>
                        <Icon
                          name="arrow-right"
                          size={16}
                          color="#48BB78"
                          style={styles.arrowIcon}
                        />
                        <Text style={styles.discountedPrice}>
                          ₹{parseFloat(discountedAmount).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.savingsBadge}>
                        <Icon name="tag" size={12} color="#38A169" />
                        <Text style={styles.savingsText}>
                          Save ₹
                          {(
                            parseFloat(originalAmount) -
                            parseFloat(discountedAmount)
                          ).toFixed(2)}{" "}
                          (
                          {(
                            ((parseFloat(originalAmount) -
                              parseFloat(discountedAmount)) /
                              parseFloat(originalAmount)) *
                            100
                          ).toFixed(0)}
                          % off)
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Services */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Services Included</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setServicesModalVisible(true)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {services.length > 0
                        ? `${services.length} service${
                            services.length > 1 ? "s" : ""
                          } selected`
                        : "Select services"}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#4A5568" />
                  </TouchableOpacity>

                  {services.length > 0 ? (
                    <View style={styles.selectedServicesWrapper}>
                      <Text style={styles.selectedServicesLabel}>
                        Selected Services:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        contentContainerStyle={styles.selectedServicesContent}
                      >
                        {services.map((service) => (
                          <TouchableOpacity
                            key={service}
                            style={styles.serviceTag}
                            onPress={() => {
                              setServices(
                                services.filter((s) => s !== service),
                              );
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={styles.serviceTagText}
                              numberOfLines={1}
                            >
                              {service}
                            </Text>
                            <Icon
                              name="close"
                              size={12}
                              color="#0078FF"
                              style={styles.serviceTagIcon}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Terms & Conditions(Optional)
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter description"
                    placeholderTextColor="#aaa"
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}

            {/* Batch-specific fields */}
            {!isPlan && (
              <>
                {/* Batch Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Batch Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter batch name"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                  />
                </View>

                {/* Batch Timing */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Batch Timing{" "}
                    <Text style={styles.inputLabelMuted}>(Ex: 7AM - 9AM)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter batch timing"
                    placeholderTextColor="#aaa"
                    value={timing}
                    onChangeText={setTiming}
                    returnKeyType="next"
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter description"
                    placeholderTextColor="#aaa"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditMode ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Services Selection Modal */}
      <Modal
        visible={servicesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setServicesModalVisible(false)}
      >
        <View style={styles.servicesModalContainer}>
          <View style={styles.servicesModalContent}>
            <View style={styles.servicesModalHeader}>
              <Text style={styles.servicesModalTitle}>Select Services</Text>
              <TouchableOpacity
                onPress={() => setServicesModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Custom Service Input */}
            <View style={styles.customServiceContainer}>
              <TextInput
                style={styles.customServiceInput}
                placeholder="Service 1, Service 2, ..."
                placeholderTextColor="#aaa"
                value={customServiceInput}
                onChangeText={setCustomServiceInput}
                returnKeyType="done"
                onSubmitEditing={handleAddCustomServices}
              />
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={handleAddCustomServices}
              >
                <Text style={styles.addServiceButtonText}>Add Services</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                personalTraining
                  ? PERSONAL_TRAINING_SERVICES
                  : MEMBERSHIP_SERVICES
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => {
                    if (services.includes(item)) {
                      setServices(services.filter((s) => s !== item));
                    } else {
                      setServices([...services, item]);
                    }
                  }}
                >
                  <View style={styles.checkboxContainer}>
                    <Icon
                      name={
                        services.includes(item)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={20}
                      color={services.includes(item) ? "#0078FF" : "#CBD5E0"}
                    />
                  </View>
                  <Text style={styles.serviceOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.servicesList}
            />

            <View
              style={[
                styles.servicesModalFooter,
                { paddingBottom: insets.bottom },
              ]}
            >
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => setServices([])}
              >
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setServicesModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>
                  Done ({services.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pause Info Modal */}
      <Modal
        visible={pauseInfoVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPauseInfoVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPauseInfoVisible(false)}>
          <View style={styles.infoModalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.infoModalContent}>
                <View style={styles.infoModalHeader}>
                  <Ionicons
                    name="information-circle"
                    size={32}
                    color="#0078FF"
                  />
                  <TouchableOpacity
                    onPress={() => setPauseInfoVisible(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoModalTitle}>Pause Membership</Text>
                <Text style={styles.infoModalDescription}>
                  If this option is given, users can pause their membership for
                  the specified duration and resume it one time. This allows
                  members to temporarily suspend their membership without losing
                  their remaining days.
                </Text>
                <TouchableOpacity
                  style={styles.infoModalButton}
                  onPress={() => setPauseInfoVisible(false)}
                >
                  <Text style={styles.infoModalButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2D3748",
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#718096",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#F7FAFC",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0078FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0078FF",
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2D3748",
  },
  bonusTypeRadioContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  bonusTypeRadioOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#F7FAFC",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveButton: {
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#4A5568",
  },
  servicesModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  servicesModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  servicesModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  servicesModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
  },
  servicesList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  checkboxContainer: {
    marginRight: 16,
  },
  serviceOptionText: {
    fontSize: 15,
    color: "#2D3748",
  },
  servicesModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  clearAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E53E3E",
  },
  clearAllButtonText: {
    color: "#E53E3E",
    fontSize: 14,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#0078FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    marginVertical: 2,
    flexShrink: 0,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: "#BEE3F8",
  },
  serviceTagText: {
    fontSize: 13,
    color: "#0078FF",
    fontWeight: "500",
    marginRight: 6,
  },
  selectedServicesWrapper: {
    marginTop: 12,
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    padding: 12,
  },
  selectedServicesLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 8,
  },
  selectedServicesContent: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  serviceTagIcon: {
    marginLeft: 4,
  },
  inputLabelMuted: {
    fontSize: 13,
    fontWeight: "400",
    color: "#718096",
  },
  errorBorder: {
    borderColor: "#E53E3E",
    borderWidth: 1.5,
  },
  errorDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#FFF5F5",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FEB2B2",
  },
  errorDisplayText: {
    fontSize: 13,
    color: "#E53E3E",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  priceDisplayContainer: {
    marginTop: 12,
    backgroundColor: "#F0FFF4",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  priceDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  strikethroughPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#A0AEC0",
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#38A169",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6FFFA",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38A169",
    marginLeft: 4,
  },
  labelWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoIcon: {
    padding: 2,
  },
  infoModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 12,
  },
  infoModalDescription: {
    fontSize: 15,
    color: "#4A5568",
    lineHeight: 22,
    marginBottom: 20,
  },
  infoModalButton: {
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  infoModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7FAFC",
    padding: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleSubLabel: {
    fontSize: 13,
    color: "#0078FF",
    fontWeight: "600",
    marginTop: 4,
  },
  toggleButtonContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#0078FF",
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#718096",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  customServiceContainer: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    alignItems: "stretch",
  },
  customServiceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  addServiceButton: {
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  addServiceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Plan For Tab Styles (matching manageplans.jsx design)
  planForTabsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  planForTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  planForTabActive: {
    backgroundColor: "#E8F4FD",
    borderColor: "#007BFF",
    borderWidth: 2,
  },
  planForTabText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  planForTabTextActive: {
    color: "#007BFF",
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
});

export default EntityModal;
