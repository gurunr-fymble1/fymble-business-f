import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MonthlyPriceInput from "./MonthlyPriceInput";
import DailyPassCard from "./DailyPassCard";
import { PLAN_CATEGORIES } from "./planConstants";
import { getSessionsPreviewAPI, setupSessionAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_HOURS_24 = Array.from({ length: 18 }, (_, i) => i + 5);
const SLOT_TAB_MINUTES = [0, 15, 30, 45];

const formatTimeSlot = (hour24, minute) => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

// Parse API session packs → DailyPassCard-compatible items
const parseSessionPacks = (packs, categoryConfig) => {
  if (!packs || !Array.isArray(packs)) return [];
  return packs.map((p) => ({
    label: p.label,
    price: p.customer_price,
    extraPercent: p.extra_percent,
    earnMore: p.extra_amount,
    potentialRevenue: p.monthly_equivalent,
  }));
};

const SessionSetupView = memo(({ category, sessionId, onSetPrice }) => {
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [acknowledged, setAcknowledged] = useState(true);
  const [slotsExpanded, setSlotsExpanded] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedMinuteTab, setSelectedMinuteTab] = useState(0);
  const [slotsWarning, setSlotsWarning] = useState(false);
  const [pricing, setPricing] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const categoryConfig = PLAN_CATEGORIES.find((c) => c.id === category);

  const priceInt = parseInt(monthlyPrice) || 0;
  const hasValidPrice = monthlyPrice.length >= 3 && priceInt >= 100;
  const hasPricing = pricing.length > 0 && hasValidPrice;
  const hasSlots = selectedDays.length > 0 && selectedSlots.length > 0;

  const visibleTimeSlots = SLOT_HOURS_24.map((h) =>
    formatTimeSlot(h, selectedMinuteTab),
  );

  // Debounced session preview with AbortController
  useEffect(() => {
    if (monthlyPrice.length < 3 || priceInt < 100) {
      setPricing([]);
      setLoadingPricing(false);
      return;
    }

    setLoadingPricing(true);
    clearTimeout(debounceRef.current);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getSessionsPreviewAPI(priceInt, {
          signal: controller.signal,
        });
        if (res?.status === 200 && res.packs) {
          setPricing(parseSessionPacks(res.packs, categoryConfig));
        } else {
          setPricing([]);
        }
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setPricing([]);
      }
      if (!controller.signal.aborted) setLoadingPricing(false);
    }, 600);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [monthlyPrice, priceInt, categoryConfig]);

  const toggleSlotsCard = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSlotsExpanded((prev) => !prev);
    setSlotsWarning(false);
  }, []);

  const handleDayToggle = useCallback((day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
    setSlotsWarning(false);
  }, []);

  const handleSlotToggle = useCallback((slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
    setSlotsWarning(false);
  }, []);

  const handleSetPrice = useCallback(async () => {
    if (!hasPricing || !acknowledged || submitting) return;

    // Validate slots
    if (!hasSlots) {
      setSlotsWarning(true);
      if (!slotsExpanded) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSlotsExpanded(true);
      }
      return;
    }

    setSubmitting(true);
    try {
      const gymId = await getToken("gym_id");
      const res = await setupSessionAPI({
        gym_id: gymId,
        session_id: sessionId,
        monthly_price: priceInt,
        capacity: 25,
        enabled: true,
        selected_days: selectedDays,
        time_slots: selectedSlots,
      });

      if (res?.status === 200) {
        let sessionPacks = pricing;
        let slots = selectedDays.map((d) => ({ day: d, times: selectedSlots }));

        if (res.packs) {
          sessionPacks = parseSessionPacks(res.packs, categoryConfig);
        }
        if (res.slots) {
          slots = res.slots;
        }

        onSetPrice({
          monthlyPrice: priceInt,
          sessionPacks,
          slots,
          sessionId: res?.session_id || sessionId,
          enabled: true,
        });
      } else {
        Alert.alert("Error", res?.message || "Failed to setup session.");
      }
    } catch {
      Alert.alert("Error", "Failed to setup session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    hasPricing,
    acknowledged,
    submitting,
    hasSlots,
    slotsExpanded,
    priceInt,
    selectedDays,
    selectedSlots,
    pricing,
    sessionId,
    categoryConfig,
    onSetPrice,
  ]);

  return (
    <View style={styles.container}>
      <MonthlyPriceInput
        value={monthlyPrice}
        onChangeText={setMonthlyPrice}
        label="Monthly Price"
      />

      {/* Expandable Slots Card */}
      <View style={[styles.slotsCard, slotsWarning && styles.slotsCardWarning]}>
        <TouchableOpacity
          style={styles.slotsHeader}
          onPress={toggleSlotsCard}
          activeOpacity={0.7}
        >
          <View style={styles.slotsHeaderLeft}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={hasSlots ? "#38A169" : "#718096"}
            />
            <View style={styles.slotsHeaderTextWrap}>
              <Text style={styles.slotsHeaderTitle}>Select Days & Slots</Text>
              {hasSlots && !slotsExpanded && (
                <Text style={styles.slotsHeaderSummary}>
                  {selectedDays.length} day{selectedDays.length > 1 ? "s" : ""}{" "}
                  · {selectedSlots.length} slot
                  {selectedSlots.length > 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name={slotsExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#718096"
          />
        </TouchableOpacity>

        {slotsWarning && !slotsExpanded && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={14} color="#E53E3E" />
            <Text style={styles.warningText}>
              Please select days and time slots
            </Text>
          </View>
        )}

        {slotsExpanded && (
          <View style={styles.slotsBody}>
            {/* Day chips */}
            <Text style={styles.slotsLabel}>Select Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    selectedDays.includes(day) && styles.dayChipActive,
                  ]}
                  onPress={() => handleDayToggle(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDays.includes(day) && styles.dayChipTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minute tabs */}
            <Text style={[styles.slotsLabel, { marginTop: 14 }]}>
              Select Time Slots
            </Text>
            <View style={styles.minuteTabRow}>
              {SLOT_TAB_MINUTES.map((min) => {
                const isActive = selectedMinuteTab === min;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.minuteTab,
                      isActive && styles.minuteTabActive,
                    ]}
                    onPress={() => setSelectedMinuteTab(min)}
                  >
                    <Text
                      style={[
                        styles.minuteTabText,
                        isActive && styles.minuteTabTextActive,
                      ]}
                    >
                      :{String(min).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time slot grid */}
            <View style={styles.timeSlotsGrid}>
              {visibleTimeSlots.map((slot) => {
                const isSelected = selectedSlots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotActive,
                    ]}
                    onPress={() => handleSlotToggle(slot)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? "time" : "time-outline"}
                      size={14}
                      color={isSelected ? "#FFF" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {slotsWarning && (
              <View style={styles.warningRow}>
                <Ionicons name="warning" size={14} color="#E53E3E" />
                <Text style={styles.warningText}>
                  Please select at least one day and one time slot
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Loading */}
      {loadingPricing && (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color="#FF5757" />
          <Text style={styles.loaderText}>Calculating pricing…</Text>
        </View>
      )}

      {/* Session packs preview */}
      {!loadingPricing && hasPricing && (
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>
            Your {categoryConfig?.shortUnit || "Class"} Pricing{" "}
            <Text style={styles.pricingSubtitle}>
              ( Auto calculated based on monthly price)
            </Text>
          </Text>
          <View style={styles.cardsContainer}>
            {pricing.map((item, index) => (
              <DailyPassCard key={index} item={item} index={index} />
            ))}
          </View>
        </View>
      )}

      {/* Pack validity note */}
      {!loadingPricing && hasPricing && (
        <View style={styles.packValidityNote}>
          <Text style={styles.packValidityText}>
            Note: 7 Sessions Pack has 14 Sessions validity & 14 Day Pack has 28
            days validity.
          </Text>
        </View>
      )}

      {/* Acknowledge checkbox */}
      {!loadingPricing && hasPricing && (
        <TouchableOpacity
          style={styles.acknowledgeRow}
          onPress={() => setAcknowledged(!acknowledged)}
          activeOpacity={0.7}
        >
          <View
            style={[styles.checkbox, acknowledged && styles.checkboxChecked]}
          >
            {acknowledged && (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.acknowledgeText}>
            I acknowledge and accept the pricing set above.
          </Text>
        </TouchableOpacity>
      )}

      {/* Set Price button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.setPriceButton,
            (!hasPricing || !acknowledged || loadingPricing || submitting) &&
              styles.setPriceButtonDisabled,
          ]}
          onPress={handleSetPrice}
          disabled={
            !hasPricing || !acknowledged || loadingPricing || submitting
          }
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.setPriceButtonText}>Set Price</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Slots card ──
  slotsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  slotsCardWarning: {
    borderColor: "#FEB2B2",
  },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  slotsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  slotsHeaderTextWrap: {
    marginLeft: 10,
  },
  slotsHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  slotsHeaderSummary: {
    fontSize: 11,
    color: "#38A169",
    fontWeight: "500",
    marginTop: 1,
  },
  slotsBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  slotsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 8,
  },
  // ── Day chips ──
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dayChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  // ── Minute tabs ──
  minuteTabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  minuteTab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  minuteTabActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  minuteTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  minuteTabTextActive: {
    color: "#FFFFFF",
  },
  // ── Time slots ──
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
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
  },
  timeSlotActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  timeSlotTextActive: {
    color: "#FFFFFF",
  },
  // ── Warning ──
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  warningText: {
    fontSize: 11,
    color: "#E53E3E",
    fontWeight: "500",
  },
  // ── Pricing ──
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: "#718096",
  },
  pricingSection: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 14,
  },
  pricingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 14,
  },
  pricingSubtitle: {
    fontSize: 9,
    fontWeight: "400",
    color: "#718096",
  },
  cardsContainer: {
    paddingTop: 2,
  },
  // ── Pack validity note ──
  packValidityNote: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  packValidityText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 16,
  },
  // ── Acknowledge ──
  acknowledgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#38A169",
    borderColor: "#38A169",
  },
  acknowledgeText: {
    fontSize: 12,
    color: "#4A5568",
    flex: 1,
  },
  // ── Button ──
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  setPriceButton: {
    backgroundColor: "#FF5757",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  setPriceButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  setPriceButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default SessionSetupView;
