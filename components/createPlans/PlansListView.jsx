import React, { useState, useCallback, useMemo, useRef, memo } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import {
  updateGymPlanAPI,
  getDailypassPreviewAPI,
  getPtPacksPreviewAPI,
  bulkUpdateGymPlansAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import PlanDurationCard from "./PlanDurationCard";
import DailyPassCard from "./DailyPassCard";
import PtPackCard from "./PtPackCard";
import PlanDetailModal from "./PlanDetailModal";
import {
  PLAN_DURATIONS,
  PLAN_CATEGORIES,
  NO_DAILYPASS_CATEGORIES,
  PT_PACK_CATEGORIES,
  BUDDY_CATEGORIES,
  PT_CATEGORIES,
  BUDDY_COUNT_OPTIONS,
  SESSIONS_COUNT_OPTIONS,
} from "./planConstants";
import CustomDropdown from "../ui/CustomDropdown";

const parseDailyPassFromAPI = (dailypass, categoryConfig) => {
  if (!dailypass) return null;
  const unit = categoryConfig?.shortUnit || "Day Pass";
  const unitPlural = categoryConfig?.unitPlural || "Day Pass";
  return [
    {
      label: `1 ${unit}`,
      price: dailypass.one_day.pack_total,
      extraPercent: dailypass.one_day.extra_percent,
      earnMore: dailypass.one_day.extra_amount,
      potentialRevenue: dailypass.one_day.owner_per_day * 30,
    },
    {
      label: `7 ${unitPlural}`,
      price: dailypass.seven_day.pack_total,
      extraPercent: dailypass.seven_day.extra_percent,
      earnMore: dailypass.seven_day.extra_amount,
      potentialRevenue: dailypass.seven_day.owner_per_day * 30,
    },
    {
      label: `14 ${unitPlural}`,
      price: dailypass.fourteen_day.pack_total,
      extraPercent: dailypass.fourteen_day.extra_percent,
      earnMore: dailypass.fourteen_day.extra_amount,
      potentialRevenue: dailypass.fourteen_day.owner_per_day * 30,
    },
  ];
};

const parsePtPacksFromAPI = (pt_packs) => {
  if (!pt_packs) return null;
  return [
    {
      label: "1 PT Session",
      sessions: pt_packs.one_session.sessions,
      packTotal: pt_packs.one_session.pack_total,
      ownerPerSession: pt_packs.one_session.owner_per_session,
      earnMore: pt_packs.one_session.extra_amount,
      extraPercent: pt_packs.one_session.extra_percent,
      validityDays: pt_packs.one_session.validity_days,
    },
    {
      label: "5 PT Sessions",
      sessions: pt_packs.five_session.sessions,
      packTotal: pt_packs.five_session.pack_total,
      ownerPerSession: pt_packs.five_session.owner_per_session,
      earnMore: pt_packs.five_session.extra_amount,
      extraPercent: pt_packs.five_session.extra_percent,
      validityDays: pt_packs.five_session.validity_days,
    },
    {
      label: "10 PT Sessions",
      sessions: pt_packs.ten_session.sessions,
      packTotal: pt_packs.ten_session.pack_total,
      ownerPerSession: pt_packs.ten_session.owner_per_session,
      earnMore: pt_packs.ten_session.extra_amount,
      extraPercent: pt_packs.ten_session.extra_percent,
      validityDays: pt_packs.ten_session.validity_days,
    },
  ];
};

const PlansListView = memo(
  ({ category, monthlyPrice, dailyPricing, ptPacks, initialPlanPrices }) => {
    const [planPrices, setPlanPrices] = useState(initialPlanPrices || {});
    const [selectedDuration, setSelectedDuration] = useState(null);
    // Initialise from existing plan data (any plan with members set)
    const [buddyCount, setBuddyCount] = useState(
      () =>
        Object.values(initialPlanPrices || {}).find((p) => p.members != null)
          ?.members ?? null,
    );
    const [sessionsCount, setSessionsCount] = useState(
      () =>
        Object.values(initialPlanPrices || {}).find(
          (p) => p.noOfSession != null,
        )?.noOfSession ?? null,
    );
    const [liveDailyPricing, setLiveDailyPricing] = useState(
      dailyPricing || null,
    );
    const [livePtPacks, setLivePtPacks] = useState(ptPacks || null);
    const gymIdRef = useRef(null);

    const isBuddy = BUDDY_CATEGORIES.includes(category);
    const isPT = PT_CATEGORIES.includes(category);
    const isPtPack = PT_PACK_CATEGORIES.includes(category);
    const hasDailyPass =
      !NO_DAILYPASS_CATEGORIES.includes(category) && !isPtPack;
    const categoryConfig = PLAN_CATEGORIES.find((c) => c.id === category);

    const getGymId = useCallback(async () => {
      if (!gymIdRef.current) gymIdRef.current = await getToken("gym_id");
      return gymIdRef.current;
    }, []);

    const handleDurationPress = useCallback((months) => {
      setSelectedDuration(months);
    }, []);

    const handleBuddyChange = useCallback(
      async (option) => {
        const value = option.value;
        setBuddyCount(value);
        const gymId = await getGymId();
        if (!gymId) return;
        const res = await bulkUpdateGymPlansAPI({
          gym_id: gymId,
          category: "buddy",
          value,
        });
        if (res?.status === 200 && res.memberships) {
          const updated = {};
          res.memberships.forEach((m) => {
            updated[m.duration_months] = {
              ...planPrices[m.duration_months],
              members: m.members,
            };
          });
          setPlanPrices((prev) => ({ ...prev, ...updated }));
        }
      },
      [getGymId, planPrices],
    );

    const handleSessionsChange = useCallback(
      async (option) => {
        const value = option.value;
        setSessionsCount(value);
        const gymId = await getGymId();
        if (!gymId) return;
        const res = await bulkUpdateGymPlansAPI({
          gym_id: gymId,
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
        const saveData = {
          ...data,
          ...(isBuddy && buddyCount != null ? { members: buddyCount } : {}),
        };

        // Optimistically update UI
        setPlanPrices((prev) => ({
          ...prev,
          [duration]: { ...prev[duration], ...saveData },
        }));
        setSelectedDuration(null);

        // If 1-month price changed, refresh daily pass or pt_packs from API
        if (duration === 1 && data.price) {
          if (hasDailyPass) {
            getDailypassPreviewAPI(data.price).then((res) => {
              if (res?.status === 200 && res.dailypass) {
                const parsed = parseDailyPassFromAPI(
                  res.dailypass,
                  categoryConfig,
                );
                if (parsed) setLiveDailyPricing(parsed);
              }
            });
          } else if (isPtPack) {
            getPtPacksPreviewAPI(data.price).then((res) => {
              if (res?.status === 200 && res.pt_packs) {
                const parsed = parsePtPacksFromAPI(res.pt_packs);
                if (parsed) setLivePtPacks(parsed);
              }
            });
          }
        }

        const res = await updateGymPlanAPI(planId, {
          owner_price: data.price,
          bonus: data.bonus ?? null,
          bonus_type: data.bonus ? data.bonusType : null,
          pause: data.pause ?? null,
          pause_type: data.pause ? data.pauseType : null,
          ...(isBuddy && buddyCount != null ? { members: buddyCount } : {}),
          ...(isPtPack && sessionsCount != null
            ? { no_of_session: sessionsCount }
            : {}),
        });
        if (res?.status !== 200) {
          Alert.alert("Error", "Failed to save plan. Please try again.");
        }
      },
      [
        selectedDuration,
        planPrices,
        categoryConfig,
        hasDailyPass,
        isPtPack,
        isBuddy,
        buddyCount,
        sessionsCount,
      ],
    );

    const handleModalClose = useCallback(() => {
      setSelectedDuration(null);
    }, []);

    const selectedPlanLabel = useMemo(() => {
      const dur = PLAN_DURATIONS.find((d) => d.months === selectedDuration);
      if (!dur) return "";
      const catLabel = (categoryConfig?.label || "Membership").replace(
        /\s*Plans?$/i,
        "",
      );
      return `${dur.months} Month${dur.months > 1 ? "s" : ""} ${catLabel} Plan`;
    }, [selectedDuration, categoryConfig]);

    return (
      <View style={styles.container}>
        {isBuddy && (
          <View style={styles.dropdownSection}>
            <CustomDropdown
              label="Number of Members"
              value={buddyCount}
              onChange={handleBuddyChange}
              options={BUDDY_COUNT_OPTIONS}
              placeholder="Select number of members (2-15)"
            />
          </View>
        )}

        {isPT && (
          <View style={styles.dropdownSection}>
            <CustomDropdown
              label="Sessions per Month"
              value={sessionsCount}
              onChange={handleSessionsChange}
              options={SESSIONS_COUNT_OPTIONS}
              placeholder="Select sessions per month"
            />
          </View>
        )}

        <View style={styles.durationsContainer}>
          {PLAN_DURATIONS.map((dur) => (
            <PlanDurationCard
              key={dur.months}
              label={`${dur.months} Month${dur.months > 1 ? "s" : ""} ${categoryConfig?.label || "Membership"}`}
              price={
                planPrices[dur.months]?.price ||
                (dur.months === 1 ? monthlyPrice : null)
              }
              onPress={() => handleDurationPress(dur.months)}
              disabled={false}
            />
          ))}
        </View>

        {hasDailyPass && liveDailyPricing && liveDailyPricing.length > 0 && (
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>
              Your {categoryConfig?.shortUnit || "Daily Pass"} Pricing{" "}
              <Text style={styles.pricingSubtitle}>
                ( Auto calculated based on 1 Month plan)
              </Text>
            </Text>
            <View style={styles.cardsContainer}>
              {liveDailyPricing.map((item, index) => (
                <DailyPassCard key={index} item={item} index={index} />
              ))}
            </View>
          </View>
        )}

        {isPtPack && livePtPacks && livePtPacks.length > 0 && (
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
  dropdownSection: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  durationsContainer: {
    marginTop: 6,
  },
  pricingSection: {
    marginTop: 0,
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

export default PlansListView;
