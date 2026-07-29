import React, { useState, useCallback, useRef, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DailyPassCard from "./DailyPassCard";
import { PLAN_CATEGORIES } from "./planConstants";
import {
  getSessionsPreviewAPI,
  updateSessionAPI,
} from "../../services/Api";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
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

const parseSessionPacks = (packs) => {
  if (!packs || !Array.isArray(packs)) return [];
  return packs.map((p) => ({
    label: p.label,
    price: p.customer_price,
    extraPercent: p.extra_percent,
    earnMore: p.extra_amount,
    potentialRevenue: p.monthly_equivalent,
  }));
};

const SessionDetailView = memo(
  ({ category, sessionId, monthlyPrice, sessionPacks, slots, gymId }) => {
    const [livePacks, setLivePacks] = useState(sessionPacks || []);
    const [currentSlots, setCurrentSlots] = useState(slots || []);
    const [slotsExpanded, setSlotsExpanded] = useState(false);

    // Price editing state
    const [priceEditing, setPriceEditing] = useState(false);
    const [priceValue, setPriceValue] = useState(String(monthlyPrice || ""));
    const [currentPrice, setCurrentPrice] = useState(monthlyPrice);
    const [priceSaving, setPriceSaving] = useState(false);
    const priceInputRef = useRef(null);

    const handlePriceEdit = useCallback(() => {
      setPriceEditing(true);
      setPriceValue(String(currentPrice || ""));
      setTimeout(() => priceInputRef.current?.focus(), 100);
    }, [currentPrice]);

    const handlePriceCancel = useCallback(() => {
      setPriceEditing(false);
      setPriceValue(String(currentPrice || ""));
    }, [currentPrice]);

    const handlePriceSave = useCallback(async () => {
      const newPrice = parseInt(priceValue);
      if (!newPrice || newPrice <= 0) return;
      if (newPrice === currentPrice) {
        setPriceEditing(false);
        return;
      }
      setPriceSaving(true);
      try {
        const res = await updateSessionAPI(sessionId, {
          gym_id: gymId,
          monthly_price: newPrice,
        });
        if (res?.status === 200) {
          setCurrentPrice(res.monthly_price || newPrice);
          if (res.packs) setLivePacks(parseSessionPacks(res.packs));
          if (res.slots) setCurrentSlots(res.slots);
          setPriceEditing(false);
        } else {
          Alert.alert("Error", res?.message || "Failed to update price.");
        }
      } catch {
        Alert.alert("Error", "Failed to update price.");
      } finally {
        setPriceSaving(false);
      }
    }, [priceValue, currentPrice, sessionId, gymId]);

    // For editing slots
    const [selectedDays, setSelectedDays] = useState(
      () => (slots || []).map((s) => s.day),
    );
    const [selectedSlots, setSelectedSlots] = useState(() => {
      // Flatten all unique time slots from all days
      const allTimes = new Set();
      (slots || []).forEach((s) => s.times?.forEach((t) => allTimes.add(t)));
      return [...allTimes];
    });
    const [selectedMinuteTab, setSelectedMinuteTab] = useState(0);
    const [editing, setEditing] = useState(false);

    const categoryConfig = PLAN_CATEGORIES.find((c) => c.id === category);
    const visibleTimeSlots = SLOT_HOURS_24.map((h) => formatTimeSlot(h, selectedMinuteTab));

    const toggleSlotsCard = useCallback(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSlotsExpanded((prev) => !prev);
    }, []);

    const handleDayToggle = useCallback((day) => {
      setEditing(true);
      setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
      );
    }, []);

    const handleSlotToggle = useCallback((slot) => {
      setEditing(true);
      setSelectedSlots((prev) =>
        prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
      );
    }, []);

    const handleSaveSlots = useCallback(async () => {
      if (selectedDays.length === 0 || selectedSlots.length === 0) {
        Alert.alert("Error", "Please select at least one day and one time slot.");
        return;
      }
      try {
        const res = await updateSessionAPI(sessionId, {
          gym_id: gymId,
          selected_days: selectedDays,
          time_slots: selectedSlots,
        });
        if (res?.status === 200) {
          if (res.slots) setCurrentSlots(res.slots);
          if (res.packs) setLivePacks(parseSessionPacks(res.packs));
          setEditing(false);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSlotsExpanded(false);
        } else {
          Alert.alert("Error", "Failed to update schedule.");
        }
      } catch {
        Alert.alert("Error", "Failed to update schedule.");
      }
    }, [sessionId, gymId, selectedDays, selectedSlots]);

    // Summary of current slots
    const slotsSummary = currentSlots.length > 0
      ? `${currentSlots.length} day${currentSlots.length > 1 ? "s" : ""} · ${
          new Set(currentSlots.flatMap((s) => s.times || [])).size
        } slot${new Set(currentSlots.flatMap((s) => s.times || [])).size > 1 ? "s" : ""}`
      : "Not set";

    return (
      <View style={styles.container}>
        {/* Editable Price Card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Monthly Price</Text>
          {priceEditing ? (
            <View style={styles.priceEditRow}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  ref={priceInputRef}
                  style={styles.priceInput}
                  value={priceValue}
                  onChangeText={(t) => setPriceValue(t.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  maxLength={7}
                  selectTextOnFocus
                />
              </View>
              {priceSaving ? (
                <ActivityIndicator size="small" color="#22C55E" style={{ marginLeft: 10 }} />
              ) : (
                <>
                  <TouchableOpacity style={styles.priceCheckBtn} onPress={handlePriceSave}>
                    <Ionicons name="checkmark" size={18} color="#22C55E" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.priceCancelBtn} onPress={handlePriceCancel}>
                    <Ionicons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.priceDisplayRow} onPress={handlePriceEdit} activeOpacity={0.6}>
              <Text style={styles.priceValue}>₹{currentPrice}</Text>
              <Ionicons name="pencil" size={14} color="#718096" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Slots expandable card */}
        <View style={styles.slotsCard}>
          <TouchableOpacity
            style={styles.slotsHeader}
            onPress={toggleSlotsCard}
            activeOpacity={0.7}
          >
            <View style={styles.slotsHeaderLeft}>
              <Ionicons name="calendar-outline" size={18} color="#38A169" />
              <View style={styles.slotsHeaderTextWrap}>
                <Text style={styles.slotsHeaderTitle}>Days & Slots</Text>
                {!slotsExpanded && (
                  <Text style={styles.slotsHeaderSummary}>{slotsSummary}</Text>
                )}
              </View>
            </View>
            <Ionicons
              name={slotsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#718096"
            />
          </TouchableOpacity>

          {slotsExpanded && (
            <View style={styles.slotsBody}>
              {/* Day chips */}
              <Text style={styles.slotsLabel}>Select Days</Text>
              <View style={styles.daysRow}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                    onPress={() => handleDayToggle(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextActive]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Minute tabs */}
              <Text style={[styles.slotsLabel, { marginTop: 14 }]}>Select Time Slots</Text>
              <View style={styles.minuteTabRow}>
                {SLOT_TAB_MINUTES.map((min) => {
                  const isActive = selectedMinuteTab === min;
                  return (
                    <TouchableOpacity
                      key={min}
                      style={[styles.minuteTab, isActive && styles.minuteTabActive]}
                      onPress={() => setSelectedMinuteTab(min)}
                    >
                      <Text style={[styles.minuteTabText, isActive && styles.minuteTabTextActive]}>
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
                      style={[styles.timeSlot, isSelected && styles.timeSlotActive]}
                      onPress={() => handleSlotToggle(slot)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? "time" : "time-outline"}
                        size={14}
                        color={isSelected ? "#FFF" : "#6B7280"}
                      />
                      <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {editing && (
                <TouchableOpacity
                  style={styles.saveSlotsButton}
                  onPress={handleSaveSlots}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveSlotsButtonText}>Save Schedule</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Session packs */}
        {livePacks && livePacks.length > 0 && (
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>
              {categoryConfig?.shortUnit || "Class"} Pricing{" "}
              <Text style={styles.pricingSubtitle}>
                ( Auto calculated based on monthly price)
              </Text>
            </Text>
            <View style={styles.cardsContainer}>
              {livePacks.map((item, index) => (
                <DailyPassCard key={index} item={item} index={index} />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
  },
  priceDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceEditRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 90,
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
  priceCheckBtn: {
    marginLeft: 10,
    padding: 4,
  },
  priceCancelBtn: {
    marginLeft: 4,
    padding: 4,
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
  saveSlotsButton: {
    backgroundColor: "#FF5757",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 14,
  },
  saveSlotsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  // ── Pricing ──
  pricingSection: {
    marginTop: 16,
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
});

export default SessionDetailView;
