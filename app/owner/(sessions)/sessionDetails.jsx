import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { getToken } from "../../../utils/auth";
import {
  addIndividualSessionsAPI,
  getOneSessionsAPI,
} from "../../../services/Api";
import { showToast } from "../../../utils/Toaster";
import { Image } from "expo-image";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_TAB_MINUTES = [0, 15, 30, 45];
const SLOT_HOURS_24 = Array.from({ length: 18 }, (_, index) => index + 6);

const getFullDayName = (shortDay) => {
  const dayMap = {
    Sun: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };
  return dayMap[shortDay] || shortDay;
};

const formatTimeSlot = (hour24, minute) => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const paddedHour = String(hour12).padStart(2, "0");
  const paddedMinute = String(minute).padStart(2, "0");
  return `${paddedHour}:${paddedMinute} ${period}`;
};

const TIME_SLOTS_BY_MINUTE = SLOT_TAB_MINUTES.reduce((acc, minute) => {
  acc[minute] = SLOT_HOURS_24.map((hour24) => formatTimeSlot(hour24, minute));
  return acc;
}, {});

const SessionDetails = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const sessionName = params?.sessionName || "Session";
  const trainerId = params?.trainerId || null;
  const scrollViewRef = useRef(null);
  const hasTrainerId =
    trainerId !== null &&
    trainerId !== undefined &&
    trainerId !== "null" &&
    trainerId !== "";
  const isPilatesSession = ["pilates", "plilates"].includes(
    sessionName?.toLowerCase?.().trim?.() || "",
  );
  const isPremiumPricingSession = hasTrainerId || isPilatesSession;
  const pricingOptions = useMemo(
    () => (isPremiumPricingSession ? [99, 199, 299] : [90, 130, 180]),
    [isPremiumPricingSession],
  );
  const maxAllowedPrice = isPremiumPricingSession ? 499 : 249;

  // Set Price tab state
  const [isSessionEnabled, setIsSessionEnabled] = useState(false);
  const [finalPrice, setFinalPrice] = useState(pricingOptions[1]);
  const [pricingStrategy, setPricingStrategy] = useState("strategy_2");
  const [customPrice, setCustomPrice] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [durationType, setDurationType] = useState("every_week");
  const [scheduleType, setScheduleType] = useState("default");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customSchedule, setCustomSchedule] = useState({});
  const [selectedSlotMinuteTab, setSelectedSlotMinuteTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [isSessionSaved, setIsSessionSaved] = useState(false);

  // Calculate final price from selected strategy
  useEffect(() => {
    if (pricingStrategy === "custom") {
      setFinalPrice(customPrice ? parseInt(customPrice, 10) : 0);
      return;
    }

    if (pricingStrategy === "strategy_1") {
      setFinalPrice(pricingOptions[0]);
    } else if (pricingStrategy === "strategy_2") {
      setFinalPrice(pricingOptions[1]);
    } else {
      setFinalPrice(pricingOptions[2]);
    }
  }, [pricingStrategy, customPrice, pricingOptions]);

  // Fetch session data on component mount
  useEffect(() => {
    const fetchSessionData = async () => {
      setIsFetchingData(true);
      try {
        const gymId = await getToken("gym_id");
        const sessionId = params?.sessionId || null;

        if (!gymId) {
          setIsFetchingData(false);
          return;
        }

        const response = await getOneSessionsAPI(gymId, sessionId, trainerId);

        // Populate form if session is enabled
        if (response?.data?.enabled) {
          const data = response.data;
          const existingFinalPrice = parseInt(
            data.discount_price || data.price || 0,
            10,
          );
          setIsSessionEnabled(data.enabled);
          setFinalPrice(existingFinalPrice || 0);
          setDurationType(data.duration_type || "every_week");
          setScheduleType(data.schedule_type || "default");
          setIsSessionSaved(true);
          setIsEditingSession(false);
          if (existingFinalPrice === pricingOptions[0]) {
            setPricingStrategy("strategy_1");
            setCustomPrice("");
          } else if (existingFinalPrice === pricingOptions[1]) {
            setPricingStrategy("strategy_2");
            setCustomPrice("");
          } else if (existingFinalPrice === pricingOptions[2]) {
            setPricingStrategy("strategy_3");
            setCustomPrice("");
          } else {
            setPricingStrategy("custom");
            setCustomPrice(
              existingFinalPrice ? existingFinalPrice.toString() : "",
            );
          }

          // Set time slots based on schedule type
          if (data.schedule_type === "default") {
            setSelectedDays(data.selected_days || []);
            setSelectedSlots(data.time_slots || []);
            setCustomSchedule({});
          } else if (data.schedule_type === "custom") {
            const customSched = data.custom_schedule || {};
            setCustomSchedule(customSched);
            // Extract selected days from custom_schedule keys
            setSelectedDays(Object.keys(customSched));
            setSelectedSlots([]);
          }
        } else {
          setIsEditingSession(true);
          setIsSessionSaved(false);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchSessionData();
  }, [params?.sessionId, params?.trainerId, pricingOptions]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push("/owner/(sessions)/availableSessions");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const handleDayToggle = useCallback((day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, []);

  const handleSlotToggle = useCallback((slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }, []);

  const handleCustomSlotToggle = useCallback((day, slot) => {
    setCustomSchedule((prev) => {
      const daySlots = prev[day] || [];
      const newDaySlots = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: newDaySlots };
    });
  }, []);

  const handleEdit = () => {
    setIsEditingSession(true);
    setIsSessionSaved(false);
  };

  const handleCustomPriceChange = useCallback(
    (value) => {
      const onlyDigits = value.replace(/[^0-9]/g, "");
      if (!onlyDigits) {
        setCustomPrice("");
        return;
      }

      const numericValue = parseInt(onlyDigits, 10);
      if (numericValue > maxAllowedPrice) {
        Alert.alert("Error", `Maximum price allowed is Rs ${maxAllowedPrice}`);
        return;
      }

      setCustomPrice(onlyDigits);
    },
    [maxAllowedPrice],
  );

  const handleSave = useCallback(async () => {
    try {
      if (!finalPrice || finalPrice <= 0) {
        Alert.alert("Error", "Please enter a valid price");
        return;
      }
      if (finalPrice > maxAllowedPrice) {
        Alert.alert("Error", `Maximum price allowed is Rs ${maxAllowedPrice}`);
        return;
      }
      if (selectedDays.length === 0) {
        Alert.alert("Error", "Please select at least one day");
        return;
      }
      if (scheduleType === "default" && selectedSlots.length === 0) {
        Alert.alert("Error", "Please select at least one time slot");
        return;
      }
      if (scheduleType === "custom") {
        const hasSlots = selectedDays.some(
          (day) => customSchedule[day]?.length > 0,
        );
        if (!hasSlots) {
          Alert.alert("Error", "Please select time slots for at least one day");
          return;
        }
      }

      setIsLoading(true);

      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      const payload = {
        session_name: sessionName,
        enabled: isSessionEnabled,
        price: finalPrice,
        discount_percentage: null,
        discount_price: finalPrice,
        duration_type: durationType,
        schedule_type: scheduleType,
        selected_days: selectedDays,
        time_slots: scheduleType === "default" ? selectedSlots : null,
        custom_schedule: scheduleType === "custom" ? customSchedule : null,
        session_id: params?.sessionId || null,
        trainer_id: trainerId,
        gym_id: gymId,
      };
      const response = await addIndividualSessionsAPI(payload);
      if (response?.status === 200) {
        setIsSessionSaved(true);
        setIsEditingSession(false);
        showToast({
          type: "success",
          title: "Session Added Successfully",
        });
        setTimeout(() => {
          router.push("/owner/(sessions)/availableSessions");
        }, 1000);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Error Adding Session",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Error Adding Session",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDays,
    scheduleType,
    selectedSlots,
    customSchedule,
    sessionName,
    isSessionEnabled,
    finalPrice,
    durationType,
    trainerId,
    maxAllowedPrice,
  ]);

  const visibleTimeSlots = useMemo(
    () => TIME_SLOTS_BY_MINUTE[selectedSlotMinuteTab] || [],
    [selectedSlotMinuteTab],
  );

  const SlotMinuteTabs = useMemo(
    () => (
      <View style={styles.slotTabContainer}>
        {SLOT_TAB_MINUTES.map((minute) => {
          const label = `:${String(minute).padStart(2, "0")} slots`;
          const isActive = selectedSlotMinuteTab === minute;
          return (
            <TouchableOpacity
              key={minute}
              style={[
                styles.slotTabButton,
                isActive && styles.slotTabButtonActive,
              ]}
              onPress={() => setSelectedSlotMinuteTab(minute)}
            >
              <Text
                style={[
                  styles.slotTabText,
                  isActive && styles.slotTabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [selectedSlotMinuteTab],
  );

  const DayChips = useMemo(
    () => (
      <View style={styles.daysContainer}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayChip,
              selectedDays.includes(day) && styles.dayChipSelected,
            ]}
            onPress={() => handleDayToggle(day)}
          >
            <Text
              style={[
                styles.dayChipText,
                selectedDays.includes(day) && styles.dayChipTextSelected,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [selectedDays, handleDayToggle],
  );

  const SelectedDaysDisplay = useMemo(() => {
    if (selectedDays.length === 0) return null;
    return (
      <View style={styles.selectedDaysSection}>
        <Text style={styles.selectedDaysTitle}>Selected Days</Text>
        <View style={styles.selectedDaysContainer}>
          {selectedDays.map((day) => (
            <View key={day} style={styles.selectedDayChip}>
              <Text style={styles.selectedDayText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [selectedDays]);

  const DefaultScheduleSlots = useMemo(
    () => (
      <>
        <Text style={styles.sectionTitle}>Select Time for All Days</Text>
        {SlotMinuteTabs}
        <View style={styles.timeSlotsContainer}>
          {visibleTimeSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[
                styles.timeSlot,
                selectedSlots.includes(slot) && styles.timeSlotSelected,
              ]}
              onPress={() => handleSlotToggle(slot)}
            >
              <Ionicons
                name={selectedSlots.includes(slot) ? "time" : "time-outline"}
                size={16}
                color={selectedSlots.includes(slot) ? "#FFF" : "#007AFF"}
              />
              <Text
                style={[
                  styles.timeSlotText,
                  selectedSlots.includes(slot) && styles.timeSlotTextSelected,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
    [SlotMinuteTabs, visibleTimeSlots, selectedSlots, handleSlotToggle],
  );

  const CustomScheduleSlots = useMemo(
    () => (
      <>
        <Text style={styles.sectionTitle}>Select Time by Day</Text>
        {SlotMinuteTabs}
        {selectedDays.map((day) => (
          <View key={day}>
            <Text style={styles.customDayTitle}>{getFullDayName(day)}</Text>
            <View style={styles.timeSlotsContainer}>
              {visibleTimeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    customSchedule[day]?.includes(slot) &&
                      styles.timeSlotSelected,
                  ]}
                  onPress={() => handleCustomSlotToggle(day, slot)}
                >
                  <Ionicons
                    name={
                      customSchedule[day]?.includes(slot)
                        ? "time"
                        : "time-outline"
                    }
                    size={16}
                    color={
                      customSchedule[day]?.includes(slot) ? "#FFF" : "#007AFF"
                    }
                  />
                  <Text
                    style={[
                      styles.timeSlotText,
                      customSchedule[day]?.includes(slot) &&
                        styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </>
    ),
    [
      SlotMinuteTabs,
      visibleTimeSlots,
      selectedDays,
      customSchedule,
      handleCustomSlotToggle,
    ],
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 5 }]}>
      <NewOwnerHeader
        onBackButtonPress={() =>
          router.push("/owner/(sessions)/availableSessions")
        }
        text={sessionName}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.tabContent}
        contentContainerStyle={styles.setPriceContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {isFetchingData ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Loading session details...</Text>
          </View>
        ) : (
          <>
            <View style={styles.toggleSection}>
              <Text style={styles.toggleTitle}>{sessionName} Booking</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isSessionEnabled && styles.toggleButtonActive,
                ]}
                onPress={() => setIsSessionEnabled(!isSessionEnabled)}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    isSessionEnabled && styles.toggleCircleActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {hasTrainerId && (
              <View style={styles.trainingFocusCard}>
                <Text style={styles.trainingFocusTitle}>Training Focus</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trainingFocusChipContainer}
                >
                  {[
                    "Strength",
                    "Core",
                    "CrossFit",
                    "Cardio",
                    "HIIT",
                    "Functional",
                  ].map((focus) => (
                    <View key={focus} style={styles.trainingFocusChip}>
                      <Text style={styles.trainingFocusChipText}>{focus}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {isSessionEnabled && !isEditingSession && isSessionSaved ? (
              <>
                {/* Read-only Display */}
                <TouchableOpacity
                  style={styles.finalPriceCardWrapper}
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <View style={styles.finalPriceCardBadges}>
                    <View style={styles.finalPriceBadgeSolid}>
                      <Text style={styles.finalPriceBadgeText}>
                        Final Price
                      </Text>
                    </View>
                  </View>
                  <View style={styles.finalPriceCard}>
                    <View style={styles.finalPriceContent}>
                      <View style={styles.finalPriceLeft}>
                        <Ionicons name="calendar" size={24} color="#007AFF" />
                        <Text style={styles.finalPriceLabel}>
                          Final Class Price
                        </Text>
                      </View>
                      <View style={styles.finalPriceRight}>
                        <Text style={styles.finalPriceAmountBlue}>
                          ₹ {finalPrice}
                        </Text>
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Display selected days */}
                <Text style={styles.sectionTitle}>Selected Days</Text>
                <View style={styles.selectedDaysContainer}>
                  {selectedDays.map((day) => (
                    <View key={day} style={styles.selectedDayChipReadOnly}>
                      <Text style={styles.selectedDayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Display schedule type and slots */}
                <Text style={styles.sectionTitle}>
                  {scheduleType === "default"
                    ? "Time Slots (All Days)"
                    : "Custom Schedule"}
                </Text>
                {scheduleType === "default" ? (
                  <View style={styles.selectedSlotsContainer}>
                    {selectedSlots.map((slot) => (
                      <View key={slot} style={styles.selectedSlotChipReadOnly}>
                        <Ionicons name="time" size={16} color="#FFF" />
                        <Text style={styles.selectedSlotText}>{slot}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <>
                    {selectedDays.map((day) => (
                      <View key={day} style={styles.customDaySection}>
                        <Text style={styles.customDayTitleReadOnly}>
                          {getFullDayName(day)}
                        </Text>
                        <View style={styles.selectedSlotsContainer}>
                          {customSchedule[day]?.map((slot) => (
                            <View
                              key={slot}
                              style={styles.selectedSlotChipReadOnly}
                            >
                              <Ionicons name="time" size={16} color="#FFF" />
                              <Text style={styles.selectedSlotText}>
                                {slot}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {/* Display duration type */}
                <Text style={styles.sectionTitle}>Booking Available For</Text>
                <View style={styles.durationDisplayCard}>
                  <Ionicons name="calendar-outline" size={20} color="#22C55E" />
                  <Text style={styles.durationDisplayText}>
                    {durationType === "every_week" ? "Every Week" : "This Week"}
                  </Text>
                </View>
              </>
            ) : isSessionEnabled ? (
              <>
                {/* Editing Mode */}
                <Text style={styles.sectionTitle}>Select Pricing Strategy</Text>
                <View style={styles.pricingOptionsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.pricingOptionCard,
                      pricingStrategy === "strategy_1" &&
                        styles.pricingOptionCardSelected,
                    ]}
                    onPress={() => {
                      setPricingStrategy("strategy_1");
                      setCustomPrice("");
                    }}
                  >
                    <View>
                      <Text style={styles.pricingOptionAmount}>
                        ₹{pricingOptions[0]}
                        <Text style={styles.pricingPerDay}>/session</Text>
                      </Text>
                      <Text style={styles.pricingOptionSubtext}>
                        Attracts New Clients
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pricingRadio,
                        pricingStrategy === "strategy_1" &&
                          styles.pricingRadioSelected,
                      ]}
                    >
                      {pricingStrategy === "strategy_1" && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pricingOptionCard,
                      styles.pricingOptionCardRecommended,
                      { backgroundColor: "#EDFAF2", borderColor: "#E5E7EB" },
                      pricingStrategy === "strategy_2" &&
                        styles.pricingOptionCardSelected,
                    ]}
                    onPress={() => {
                      setPricingStrategy("strategy_2");
                      setCustomPrice("");
                    }}
                  >
                    <View style={styles.recommendedBadge}>
                      {/* <Ionicons name="flame" size={14} color="#FFFFFF" style={styles.recommendedBadgeIcon} /> */}
                      <Text style={styles.recommendedBadgeText}>
                        Recommended
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.pricingOptionAmount}>
                        ₹{pricingOptions[1]}
                        <Text style={styles.pricingPerDay}>/session</Text>
                      </Text>
                      <Text style={styles.pricingOptionSubtext}>
                        Most Popular
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pricingRadio,
                        pricingStrategy === "strategy_2" &&
                          styles.pricingRadioSelected,
                      ]}
                    >
                      {pricingStrategy === "strategy_2" && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pricingOptionCard,
                      pricingStrategy === "strategy_3" &&
                        styles.pricingOptionCardSelected,
                    ]}
                    onPress={() => {
                      setPricingStrategy("strategy_3");
                      setCustomPrice("");
                    }}
                  >
                    <View>
                      <Text style={styles.pricingOptionAmount}>
                        ₹{pricingOptions[2]}
                        <Text style={styles.pricingPerDay}>/session</Text>
                      </Text>
                      <Text style={styles.pricingOptionSubtext}>
                        Attracts Premium Clients
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pricingRadio,
                        pricingStrategy === "strategy_3" &&
                          styles.pricingRadioSelected,
                      ]}
                    >
                      {pricingStrategy === "strategy_3" && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.pricingOrRow}>
                  <View style={styles.pricingOrLine} />
                  <Text style={styles.pricingOrText}>OR</Text>
                  <View style={styles.pricingOrLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.customPricingCard,
                    pricingStrategy === "custom" &&
                      styles.pricingOptionCardSelected,
                  ]}
                  onPress={() => setPricingStrategy("custom")}
                  activeOpacity={0.9}
                >
                  <View style={styles.rupeeImage}>
                    <Image
                      source={require("../../../assets/images/sessions/session_rs.png")}
                      style={{ width: 30, height: 30 }}
                    />
                  </View>
                  <View style={styles.customPricingLeft}>
                    <Text style={styles.customPricingTitle}>
                      Set Custom Price
                    </Text>
                    {pricingStrategy === "custom" && (
                      <View style={styles.customInputWrap}>
                        <Text style={styles.customInputCurrency}> ₹</Text>
                        <TextInput
                          style={styles.customPriceInput}
                          placeholder="Enter amount"
                          placeholderTextColor="#9CA3AF"
                          value={customPrice}
                          onChangeText={handleCustomPriceChange}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.pricingRadio,
                      pricingStrategy === "custom" &&
                        styles.pricingRadioSelected,
                    ]}
                  >
                    {pricingStrategy === "custom" && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>

                <Text style={styles.selectedPriceText}>
                  Selected Price: ₹ {finalPrice || 0}/session
                </Text>
                <Text style={styles.maxPriceHint}>
                  The Maximum Session price allowed is{" "}
                  <Text
                    style={{ color: "#22C55E", fontSize: 14, fontWeight: 600 }}
                  >
                    ₹{maxAllowedPrice}
                  </Text>
                </Text>

                <Text style={styles.sectionTitle}>Select Days</Text>
                {DayChips}
                {SelectedDaysDisplay}

                <Text style={styles.sectionTitle}>Booking Available For</Text>
                <View style={styles.durationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.durationButton,
                      durationType === "every_week" &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => setDurationType("every_week")}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        durationType === "every_week" && styles.checkboxActive,
                      ]}
                    >
                      {durationType === "every_week" && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.durationText,
                        durationType === "every_week" &&
                          styles.durationTextActive,
                      ]}
                    >
                      Every Week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.durationButton,
                      durationType === "this_week" &&
                        styles.durationButtonActive,
                    ]}
                    onPress={() => setDurationType("this_week")}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        durationType === "this_week" && styles.checkboxActive,
                      ]}
                    >
                      {durationType === "this_week" && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.durationText,
                        durationType === "this_week" &&
                          styles.durationTextActive,
                      ]}
                    >
                      This Week
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Choose Schedule</Text>

                <View style={styles.scheduleTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.scheduleTypeButton,
                      scheduleType === "default" &&
                        styles.scheduleTypeButtonActive,
                    ]}
                    onPress={() => setScheduleType("default")}
                  >
                    <Text
                      style={[
                        styles.scheduleTypeText,
                        scheduleType === "default" &&
                          styles.scheduleTypeTextActive,
                      ]}
                    >
                      Default Schedule
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.scheduleTypeButton,
                      scheduleType === "custom" &&
                        styles.scheduleTypeButtonActive,
                    ]}
                    onPress={() => setScheduleType("custom")}
                  >
                    <Text
                      style={[
                        styles.scheduleTypeText,
                        scheduleType === "custom" &&
                          styles.scheduleTypeTextActive,
                      ]}
                    >
                      Custom Schedule
                    </Text>
                  </TouchableOpacity>
                </View>

                {scheduleType === "default"
                  ? DefaultScheduleSlots
                  : CustomScheduleSlots}

                <TouchableOpacity
                  style={styles.saveButtonWrapper}
                  onPress={handleSave}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isLoading
                        ? ["#9CA3AF", "#9CA3AF"]
                        : ["#007BFF", "#007BFF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Confirm Price</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SessionDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  setPriceContent: {
    paddingBottom: 100,
  },
  toggleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#007AFF",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  trainingFocusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
  },
  trainingFocusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 12,
  },
  trainingFocusChipContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  trainingFocusChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 4,
  },
  trainingFocusChipText: {
    fontSize: 12,
    color: "#2C2C2C",
  },
  priceInputSection: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  priceInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#2C2C2C",
    flex: 1,
    marginRight: 12,
  },
  priceValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginLeft: 8,
  },
  priceValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    minWidth: 60,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    minHeight: 36,
  },
  discountValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
  },
  discountValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
    minWidth: 60,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    minHeight: 36,
  },
  percentSymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginLeft: 8,
  },
  finalPriceCardWrapper: {
    marginBottom: 16,
    position: "relative",
  },
  finalPriceCardBadges: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: -8,
    zIndex: 2,
  },
  finalPriceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#158BE8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  finalPriceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  discountOffBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  discountOffText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  finalPriceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  finalPriceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  finalPriceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  finalPriceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  finalPriceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  pricingOptionsWrap: {
    gap: 10,
    marginBottom: 12,
  },
  pricingOptionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingOptionCardRecommended: {
    position: "relative",
  },
  pricingOptionCardSelected: {
    borderColor: "#A7CCFF",
    backgroundColor: "#F3F8FF",
  },
  recommendedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#22C55E",
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 3,
  },
  recommendedBadgeIcon: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pricingOptionAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2A2A2A",
    lineHeight: 26,
  },
  pricingPerDay: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  pricingOptionSubtext: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
  pricingRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#60A5FA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pricingRadioSelected: {
    backgroundColor: "#1278FF",
    borderColor: "#1278FF",
  },
  pricingOrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    marginBottom: 16,
  },
  pricingOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  pricingOrText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  customPricingCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rupeeImage: {
    width: 40,
    height: 40,
    backgroundColor: "#F4F4F4",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  customPricingLeft: {
    flex: 1,
    marginRight: 12,
  },
  customPricingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  customInputWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: 150,
    paddingHorizontal: 10,
  },
  customInputCurrency: {
    fontSize: 16,
    color: "#9CA3AF",
    marginRight: 8,
  },
  customPriceInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#111827",
  },
  selectedPriceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  maxPriceHint: {
    fontSize: 12,
    color: "#474A48",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 6,
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dayChipSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  dayChipTextSelected: {
    color: "#FFFFFF",
  },
  selectedDaysSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  selectedDaysTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  selectedDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedDayChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  selectedDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  durationContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  durationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  durationButtonActive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: "#22C55E",
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  durationTextActive: {
    color: "#374151",
  },
  scheduleTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  scheduleTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  scheduleTypeButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  scheduleTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  scheduleTypeTextActive: {
    color: "#FFFFFF",
  },
  slotTabContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  slotTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  slotTabButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  slotTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  slotTabTextActive: {
    color: "#FFFFFF",
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
    width: "31%",
    justifyContent: "center",
  },
  timeSlotSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  timeSlotTextSelected: {
    color: "#FFFFFF",
  },
  customDayTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 10,
  },
  saveButtonWrapper: {
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#030A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  finalPriceBadgeSolid: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    elevation: 2,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  finalPriceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  finalPriceAmountBlue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  selectedDayChipReadOnly: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  selectedSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  selectedSlotChipReadOnly: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    gap: 6,
  },
  selectedSlotText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  customDaySection: {
    marginBottom: 16,
  },
  customDayTitleReadOnly: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 10,
  },
  durationDisplayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  durationDisplayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
});
