import React, { useState, useCallback, useRef, memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PlanDurationCard from "./PlanDurationCard";
import PlanDetailModal from "./PlanDetailModal";
import PtPackCard from "./PtPackCard";
import CustomDropdown from "../ui/CustomDropdown";
import {
  PLAN_DURATIONS,
  PLAN_CATEGORIES,
  SESSIONS_COUNT_OPTIONS,
} from "./planConstants";
import {
  setPtTrainerSlotsAPI,
  getPtPreviewAPI,
  updateGymPlanAPI,
  bulkUpdateGymPlansAPI,
} from "../../services/Api";
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

// ─── Trainer Detail Card ────────────────────────────────────────────────────
const TrainerDetailCard = memo(({ trainer, gymId, onSlotsUpdated }) => {
  const initialDays = trainer.slots?.days || trainer.slots?.selected_days || [];
  const initialSlotTimes =
    trainer.slots?.slots || trainer.slots?.time_slots || [];

  const [expanded, setExpanded] = useState(false);
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [selectedSlots, setSelectedSlots] = useState(initialSlotTimes);
  const [selectedMinuteTab, setSelectedMinuteTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasSlots = selectedDays.length > 0 && selectedSlots.length > 0;
  const visibleTimeSlots = SLOT_HOURS_24.map((h) =>
    formatTimeSlot(h, selectedMinuteTab),
  );

  const slotsSummary = hasSlots
    ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} · ${selectedSlots.length} slot${selectedSlots.length > 1 ? "s" : ""}`
    : "Not set";

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
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
    setSaving(true);
    try {
      const res = await setPtTrainerSlotsAPI({
        gym_id: gymId,
        trainers: [
          {
            trainer_id: trainer.trainer_id,
            selected_days: selectedDays,
            time_slots: selectedSlots,
          },
        ],
      });
      if (res?.status === 200) {
        setEditing(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(false);
        if (onSlotsUpdated) {
          onSlotsUpdated(trainer.trainer_id, {
            days: selectedDays,
            slots: selectedSlots,
          });
        }
      } else {
        Alert.alert("Error", res?.message || "Failed to update trainer slots.");
      }
    } catch {
      Alert.alert("Error", "Failed to update trainer slots.");
    } finally {
      setSaving(false);
    }
  }, [trainer.trainer_id, gymId, selectedDays, selectedSlots, onSlotsUpdated]);

  return (
    <View style={styles.trainerCard}>
      {/* Trainer header */}
      <TouchableOpacity
        style={styles.trainerHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.trainerInfo}>
          {trainer.profile_image ? (
            <Image
              source={{ uri: trainer.profile_image }}
              style={styles.trainerAvatar}
            />
          ) : (
            <View style={styles.trainerAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.trainerDetails}>
            <Text style={styles.trainerName}>
              {trainer.full_name || trainer.name}
            </Text>
            {!expanded && (
              <Text style={styles.trainerSlotSummary}>{slotsSummary}</Text>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#718096"
        />
      </TouchableOpacity>

      {/* Specializations */}
      {expanded && trainer.specializations?.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specRow}
        >
          {trainer.specializations.map((spec) => (
            <View key={spec} style={styles.specChip}>
              <Text style={styles.specChipText}>{spec}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Expanded slots editor */}
      {expanded && (
        <View style={styles.trainerSlotsBody}>
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

          <Text style={[styles.slotsLabel, { marginTop: 14 }]}>
            Select Time Slots
          </Text>
          <View style={styles.minuteTabRow}>
            {SLOT_TAB_MINUTES.map((min) => {
              const isActive = selectedMinuteTab === min;
              return (
                <TouchableOpacity
                  key={min}
                  style={[styles.minuteTab, isActive && styles.minuteTabActive]}
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

          {editing && (
            <TouchableOpacity
              style={styles.saveSlotsButton}
              onPress={handleSaveSlots}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveSlotsButtonText}>Save Schedule</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────
const PtDetailView = memo(
  ({
    monthlyPrice,
    ptPacks: initialPtPacks,
    initialPlanPrices,
    trainers,
    gymId,
  }) => {
    const router = useRouter();
    const [planPrices, setPlanPrices] = useState(initialPlanPrices || {});
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [livePtPacks, setLivePtPacks] = useState(initialPtPacks || []);
    const [sessionsCount, setSessionsCount] = useState(
      () =>
        Object.values(initialPlanPrices || {}).find(
          (p) => p.noOfSession != null,
        )?.noOfSession ?? null,
    );
    const gymIdRef = useRef(gymId);

    const categoryConfig = PLAN_CATEGORIES.find((c) => c.id === "pt");

    const getGymId = useCallback(async () => {
      if (!gymIdRef.current) gymIdRef.current = await getToken("gym_id");
      return gymIdRef.current;
    }, []);

    const handleDurationPress = useCallback((months) => {
      setSelectedDuration(months);
    }, []);

    const handleSessionsChange = useCallback(
      async (option) => {
        const value = option.value;
        setSessionsCount(value);
        const gid = await getGymId();
        if (!gid) return;
        const res = await bulkUpdateGymPlansAPI({
          gym_id: gid,
          category: "personal_training",
          value,
        });

        if (res?.status === 200 && res.memberships) {
          const updated = {};
          res.memberships.forEach((m) => {
            updated[m.duration_months] = {
              ...planPrices[m.duration_months],
              noOfSession: m.no_of_session,
            };
          });
          setPlanPrices((prev) => ({ ...prev, ...updated }));
        }
      },
      [getGymId, planPrices],
    );

    const handleModalSave = useCallback(
      async (data) => {
        const planId = planPrices[selectedDuration]?.planId;
        const duration = selectedDuration;

        // Optimistically update UI
        setPlanPrices((prev) => ({
          ...prev,
          [duration]: { ...prev[duration], ...data },
        }));
        setSelectedDuration(null);

        // If 1-month price changed, refresh PT packs from preview API
        if (duration === 1 && data.price) {
          getPtPreviewAPI(data.price).then((res) => {
            if (res?.status === 200 && res.packs) {
              const parsed = res.packs.map((p) => ({
                label: p.label,
                sessions: p.sessions,
                packTotal: p.customer_price,
                ownerPerSession: p.owner_per_session,
                earnMore: p.extra_amount,
                extraPercent: p.extra_percent,
                validityDays: p.validity_days,
              }));
              if (parsed.length > 0) setLivePtPacks(parsed);
            }
          });
        }

        const res = await updateGymPlanAPI(planId, {
          owner_price: data.price,
          bonus: data.bonus ?? null,
          bonus_type: data.bonus ? data.bonusType : null,
          pause: data.pause ?? null,
          pause_type: data.pause ? data.pauseType : null,
          ...(sessionsCount != null ? { no_of_session: sessionsCount } : {}),
        });
        if (res?.status !== 200) {
          Alert.alert("Error", "Failed to save plan. Please try again.");
        }
      },
      [selectedDuration, planPrices, sessionsCount],
    );

    const handleModalClose = useCallback(() => {
      setSelectedDuration(null);
    }, []);

    const handleSlotsUpdated = useCallback((trainerId, newSlots) => {
      // Optional: could refresh data if needed
    }, []);

    const selectedPlanLabel = selectedDuration
      ? `${selectedDuration} Month${selectedDuration > 1 ? "s" : ""} PT Plan`
      : "";

    return (
      <View style={styles.container}>
        {/* Sessions per month dropdown */}
        <View style={styles.dropdownSection}>
          <CustomDropdown
            label="Sessions per Month"
            value={sessionsCount}
            onChange={handleSessionsChange}
            options={SESSIONS_COUNT_OPTIONS}
            placeholder="Select sessions per month"
          />
        </View>

        {/* Plan duration cards (1, 3, 6, 12 months) */}
        <View style={styles.durationsContainer}>
          {PLAN_DURATIONS.map((dur) => (
            <PlanDurationCard
              key={dur.months}
              label={`${dur.months} Month${dur.months > 1 ? "s" : ""} ${categoryConfig?.label || "PT Plans"}`}
              price={
                planPrices[dur.months]?.price ||
                (dur.months === 1 ? monthlyPrice : null)
              }
              onPress={() => handleDurationPress(dur.months)}
              disabled={false}
            />
          ))}
        </View>

        {/* Trainers section */}
        <View style={styles.trainersSection}>
          <View style={styles.trainersSectionHeader}>
            <Text style={styles.trainersSectionTitle}>Trainers & Slots</Text>
            <TouchableOpacity
              style={styles.addTrainerButton}
              onPress={() => router.push("/owner/trainerform?tab=add_trainer")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#FF5757" />
              <Text style={styles.addTrainerText}>Add Trainer</Text>
            </TouchableOpacity>
          </View>

          {trainers && trainers.length > 0 ? (
            trainers.map((trainer) => (
              <TrainerDetailCard
                key={trainer.trainer_id}
                trainer={trainer}
                gymId={gymId}
                onSlotsUpdated={handleSlotsUpdated}
              />
            ))
          ) : (
            <View style={styles.noTrainersContainer}>
              <Ionicons name="person-add-outline" size={32} color="#D1D5DB" />
              <Text style={styles.noTrainersText}>No trainers configured</Text>
            </View>
          )}
        </View>

        {/* PT Packs */}
        {livePtPacks && livePtPacks.length > 0 && (
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>
              PT Session Pricing{" "}
              <Text style={styles.pricingSubtitle}>
                ( Auto calculated based on 1 Month plan)
              </Text>
            </Text>
            <View style={styles.cardsContainer}>
              {livePtPacks.map((item, index) => (
                <PtPackCard key={index} item={item} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Plan Detail Modal */}
        <PlanDetailModal
          visible={selectedDuration !== null}
          onClose={handleModalClose}
          onSave={handleModalSave}
          planLabel={selectedPlanLabel}
          initialData={selectedDuration ? planPrices[selectedDuration] : null}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Dropdown ──
  dropdownSection: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  // ── Duration cards ──
  durationsContainer: {
    marginTop: 6,
  },
  // ── Trainers section ──
  trainersSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  trainersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trainersSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  addTrainerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  addTrainerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF5757",
  },
  noTrainersContainer: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 6,
  },
  noTrainersText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  // ── Trainer card ──
  trainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 10,
    overflow: "hidden",
  },
  trainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  trainerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  trainerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
  },
  trainerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  trainerDetails: {
    marginLeft: 10,
    flex: 1,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  trainerSlotSummary: {
    fontSize: 11,
    color: "#38A169",
    fontWeight: "500",
    marginTop: 2,
  },
  // ── Specializations ──
  specRow: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  specChip: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specChipText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#0369A1",
  },
  // ── Trainer slots body ──
  trainerSlotsBody: {
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

export default PtDetailView;
