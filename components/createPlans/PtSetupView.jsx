import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MonthlyPriceInput from "./MonthlyPriceInput";
import PtPackCard from "./PtPackCard";
import CustomDropdown from "../ui/CustomDropdown";
import { SESSIONS_COUNT_OPTIONS } from "./planConstants";
import {
  getPtPreviewAPI,
  setupPtAPI,
  setPtTrainerSlotsAPI,
  getTrainersAPI,
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

// Parse PT preview API response → PtPackCard format
const parsePtPacksFromPreview = (res) => {
  const packs = res?.packs || [];
  if (packs.length === 0) return [];
  return packs.map((p) => ({
    label: p.label,
    sessions: p.sessions,
    packTotal: p.customer_price,
    ownerPerSession: p.owner_per_session,
    earnMore: p.extra_amount,
    extraPercent: p.extra_percent,
    validityDays: p.validity_days,
  }));
};

// Parse memberships from setup response → planPrices format
const parseMemberships = (memberships = []) => {
  const result = {};
  memberships.forEach((m) => {
    result[m.duration_months] = {
      planId: m.plan_id,
      price: m.owner_price || null,
      members: m.members ?? null,
      noOfSession: m.no_of_session ?? null,
      bonus: m.bonus,
      bonusType: m.bonus_type,
      pause: m.pause,
      pauseType: m.pause_type,
    };
  });
  return result;
};

// ─── Trainer Slot Card ──────────────────────────────────────────────────────
const TrainerSlotCard = memo(
  ({
    trainer,
    selectedDays,
    selectedSlots,
    selectedMinuteTab,
    onDayToggle,
    onSlotToggle,
    onMinuteTabChange,
    expanded,
    onToggleExpand,
  }) => {
    const hasSlots = selectedDays.length > 0 && selectedSlots.length > 0;
    const visibleTimeSlots = SLOT_HOURS_24.map((h) =>
      formatTimeSlot(h, selectedMinuteTab),
    );

    return (
      <View style={styles.trainerCard}>
        {/* Trainer header */}
        <TouchableOpacity
          style={styles.trainerHeader}
          onPress={onToggleExpand}
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
              {trainer.experience ? (
                <Text style={styles.trainerExperience}>
                  {trainer.experience} yr{trainer.experience > 1 ? "s" : ""}{" "}
                  experience
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.trainerHeaderRight}>
            {hasSlots && !expanded && (
              <View style={styles.slotBadge}>
                <Text style={styles.slotBadgeText}>
                  {selectedDays.length}d · {selectedSlots.length}s
                </Text>
              </View>
            )}
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#718096"
            />
          </View>
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

        {/* Expanded slots */}
        {expanded && (
          <View style={styles.trainerSlotsBody}>
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
                  onPress={() => onDayToggle(day)}
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
                    onPress={() => onMinuteTabChange(min)}
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
                    onPress={() => onSlotToggle(slot)}
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
          </View>
        )}
      </View>
    );
  },
);

// ─── Main Component ─────────────────────────────────────────────────────────
const PtSetupView = memo(({ onSetPrice }) => {
  const router = useRouter();
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [sessionsCount, setSessionsCount] = useState(null);
  const [ptPacks, setPtPacks] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(true);

  // Per-trainer slot state: { [trainer_id]: { days: [], slots: [], minuteTab: 0 } }
  const [trainerSlots, setTrainerSlots] = useState({});
  // Which trainer card is expanded
  const [expandedTrainer, setExpandedTrainer] = useState(null);
  const [trainersWarning, setTrainersWarning] = useState(false);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);

  const priceInt = parseInt(monthlyPrice) || 0;
  const hasValidPrice = monthlyPrice.length >= 3 && priceInt >= 100;
  const hasPricing = ptPacks.length > 0 && hasValidPrice;
  const hasSessionsCount = sessionsCount !== null;

  // Check if at least one trainer has slots configured
  const hasTrainerSlots = trainers.some((t) => {
    const s = trainerSlots[t.trainer_id];
    return s && s.days.length > 0 && s.slots.length > 0;
  });

  const canSubmit =
    hasPricing &&
    hasSessionsCount &&
    hasTrainerSlots &&
    trainers.length > 0 &&
    acknowledged;

  // Fetch trainers on mount
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) return;
        const res = await getTrainersAPI(gymId);
        if (res?.status === 200 && res.data?.trainers) {
          setTrainers(res.data.trainers);
          // Initialize slot state for each trainer
          const initial = {};
          res.data.trainers.forEach((t) => {
            initial[t.trainer_id] = { days: [], slots: [], minuteTab: 0 };
          });
          setTrainerSlots(initial);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingTrainers(false);
      }
    };
    fetchTrainers();
  }, []);

  // Debounced PT preview
  useEffect(() => {
    if (monthlyPrice.length < 3 || priceInt < 100) {
      setPtPacks([]);
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
        const res = await getPtPreviewAPI(priceInt, {
          signal: controller.signal,
        });
        if (res?.status === 200 && (res.packs || res.pt_packs)) {
          setPtPacks(parsePtPacksFromPreview(res));
        } else {
          setPtPacks([]);
        }
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setPtPacks([]);
      }
      if (!controller.signal.aborted) setLoadingPricing(false);
    }, 600);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [monthlyPrice, priceInt]);

  const handleToggleExpand = useCallback((trainerId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTrainer((prev) => (prev === trainerId ? null : trainerId));
  }, []);

  const handleDayToggle = useCallback((trainerId, day) => {
    setTrainersWarning(false);
    setTrainerSlots((prev) => {
      const current = prev[trainerId] || { days: [], slots: [], minuteTab: 0 };
      const days = current.days.includes(day)
        ? current.days.filter((d) => d !== day)
        : [...current.days, day];
      return { ...prev, [trainerId]: { ...current, days } };
    });
  }, []);

  const handleSlotToggle = useCallback((trainerId, slot) => {
    setTrainersWarning(false);
    setTrainerSlots((prev) => {
      const current = prev[trainerId] || { days: [], slots: [], minuteTab: 0 };
      const slots = current.slots.includes(slot)
        ? current.slots.filter((s) => s !== slot)
        : [...current.slots, slot];
      return { ...prev, [trainerId]: { ...current, slots } };
    });
  }, []);

  const handleMinuteTabChange = useCallback((trainerId, min) => {
    setTrainerSlots((prev) => {
      const current = prev[trainerId] || { days: [], slots: [], minuteTab: 0 };
      return { ...prev, [trainerId]: { ...current, minuteTab: min } };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasPricing || !hasSessionsCount || !acknowledged || submitting) return;

    // Validate trainer slots — expand first trainer if none configured
    if (!hasTrainerSlots) {
      setTrainersWarning(true);
      if (trainers.length > 0 && expandedTrainer === null) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedTrainer(trainers[0].trainer_id);
      }
      return;
    }

    setSubmitting(true);
    try {
      const gymId = await getToken("gym_id");

      // 1. Setup PT plans (creates 1/3/6/12 month plans)
      const setupRes = await setupPtAPI({
        gym_id: gymId,
        owner_price: priceInt,
        no_of_session: sessionsCount,
      });

      if (setupRes?.status !== 200) {
        Alert.alert("Error", setupRes?.message || "Failed to setup PT plans.");
        setSubmitting(false);
        return;
      }

      // 2. Set trainer slots for each trainer that has slots
      const trainerSlotsPayload = [];
      trainers.forEach((t) => {
        const s = trainerSlots[t.trainer_id];
        if (s && s.days.length > 0 && s.slots.length > 0) {
          trainerSlotsPayload.push({
            trainer_id: t.trainer_id,
            selected_days: s.days,
            time_slots: s.slots,
          });
        }
      });

      if (trainerSlotsPayload.length > 0) {
        const slotsRes = await setPtTrainerSlotsAPI({
          gym_id: gymId,
          trainers: trainerSlotsPayload,
        });

        if (slotsRes?.status !== 200) {
          Alert.alert(
            "Error",
            slotsRes?.message || "Failed to set trainer slots.",
          );
          setSubmitting(false);
          return;
        }
      }

      // Parse memberships + split from setup response to transition to detail view
      const split = setupRes.split || {};
      const memberships = setupRes.memberships || [];
      const planPrices = parseMemberships(memberships);

      // Parse packs from split
      const rawPacks = split.packs || [];
      const setupPtPacks = rawPacks.map((p) => ({
        label: p.label,
        sessions: p.sessions,
        packTotal: p.customer_price,
        ownerPerSession: p.owner_per_session,
        earnMore: p.extra_amount,
        extraPercent: p.extra_percent,
        validityDays: p.validity_days,
      }));

      // Transition to configured view
      onSetPrice({
        monthlyPrice: priceInt,
        ptPacks: setupPtPacks.length > 0 ? setupPtPacks : ptPacks,
        planPrices,
        trainers: trainers.map((t) => ({
          ...t,
          slots: trainerSlots[t.trainer_id],
        })),
      });
    } catch {
      Alert.alert("Error", "Failed to setup PT plans. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    hasPricing,
    hasSessionsCount,
    hasTrainerSlots,
    acknowledged,
    submitting,
    priceInt,
    sessionsCount,
    trainers,
    trainerSlots,
    ptPacks,
    expandedTrainer,
    onSetPrice,
  ]);

  return (
    <View style={styles.container}>
      <MonthlyPriceInput
        value={monthlyPrice}
        onChangeText={setMonthlyPrice}
        label="Monthly PT Price"
      />

      {/* Sessions per month dropdown */}
      <View style={styles.dropdownSection}>
        <CustomDropdown
          label="Sessions per Month"
          value={sessionsCount}
          onChange={(option) => setSessionsCount(option.value)}
          options={SESSIONS_COUNT_OPTIONS}
          placeholder="Select sessions per month"
        />
      </View>

      {/* Loading pricing */}
      {loadingPricing && (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color="#FF5757" />
          <Text style={styles.loaderText}>Calculating pricing…</Text>
        </View>
      )}

      {/* PT Packs preview */}
      {!loadingPricing && hasPricing && (
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>
            PT Session Pricing{" "}
            <Text style={styles.pricingSubtitle}>
              ( Auto calculated based on monthly price)
            </Text>
          </Text>
          <View style={styles.cardsContainer}>
            {ptPacks.map((item, index) => (
              <PtPackCard key={index} item={item} index={index} />
            ))}
          </View>
        </View>
      )}

      {/* Pack validity note */}
      {!loadingPricing && hasPricing && (
        <View style={styles.packValidityNote}>
          <Text style={styles.packValidityText}>
            Note: 5 Sessions Pack has 10 days validity & 10 Day Pack has 20 days
            validity.
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
            I acknowledge and accept the pricing & validity as above .
          </Text>
        </TouchableOpacity>
      )}

      {/* Trainers section */}
      <View style={styles.trainersSection}>
        <View style={styles.trainersSectionHeader}>
          <Text style={styles.trainersSectionTitle}>Trainers & Slots</Text>
          <TouchableOpacity
            style={styles.addTrainerButton}
            onPress={() => router.push("/owner/trainerform?tab=add_trainer&from=pt_setup")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#FF5757" />
            <Text style={styles.addTrainerText}>Add Trainer</Text>
          </TouchableOpacity>
        </View>

        {loadingTrainers ? (
          <View style={styles.trainerLoaderContainer}>
            <ActivityIndicator size="small" color="#FF5757" />
            <Text style={styles.loaderText}>Loading trainers…</Text>
          </View>
        ) : trainers.length === 0 ? (
          <View style={styles.noTrainersContainer}>
            <Ionicons name="person-add-outline" size={32} color="#D1D5DB" />
            <Text style={styles.noTrainersText}>No trainers added yet</Text>
            <Text style={styles.noTrainersSubtext}>
              Add trainers to configure their slots and availability
            </Text>
          </View>
        ) : (
          trainers.map((trainer) => {
            const tid = trainer.trainer_id;
            const slotState = trainerSlots[tid] || {
              days: [],
              slots: [],
              minuteTab: 0,
            };
            return (
              <TrainerSlotCard
                key={tid}
                trainer={trainer}
                selectedDays={slotState.days}
                selectedSlots={slotState.slots}
                selectedMinuteTab={slotState.minuteTab}
                onDayToggle={(day) => handleDayToggle(tid, day)}
                onSlotToggle={(slot) => handleSlotToggle(tid, slot)}
                onMinuteTabChange={(min) => handleMinuteTabChange(tid, min)}
                expanded={expandedTrainer === tid}
                onToggleExpand={() => handleToggleExpand(tid)}
              />
            );
          })
        )}

        {trainersWarning && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={14} color="#E53E3E" />
            <Text style={styles.warningText}>
              Please select days and time slots for at least one trainer
            </Text>
          </View>
        )}
      </View>

      {/* Submit button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!hasPricing ||
              !hasSessionsCount ||
              !acknowledged ||
              loadingPricing ||
              submitting) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !hasPricing ||
            !hasSessionsCount ||
            !acknowledged ||
            loadingPricing ||
            submitting
          }
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Set PT Plans</Text>
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
  // ── Dropdown ──
  dropdownSection: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
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
  // ── Trainers section ──
  trainersSection: {
    marginTop: 20,
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
  trainerLoaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
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
  noTrainersSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  // ── Warning ──
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 11,
    color: "#E53E3E",
    fontWeight: "500",
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
  trainerExperience: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
  },
  trainerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  slotBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#22C55E",
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
  // ── Pack validity & acknowledge ──
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
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: "#FF5757",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default PtSetupView;
