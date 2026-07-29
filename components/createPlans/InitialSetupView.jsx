import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MonthlyPriceInput from "./MonthlyPriceInput";
import DailyPassCard from "./DailyPassCard";
import PtPackCard from "./PtPackCard";
import {
  PLAN_CATEGORIES,
  PT_CATEGORIES,
  BUDDY_CATEGORIES,
  NO_DAILYPASS_CATEGORIES,
  PT_PACK_CATEGORIES,
  BUDDY_COUNT_OPTIONS,
  SESSIONS_COUNT_OPTIONS,
  toApiKey,
} from "./planConstants";
import CustomDropdown from "../ui/CustomDropdown";
import {
  getDailypassPreviewAPI,
  getPtPacksPreviewAPI,
  setupGymPlansAPI,
} from "../../services/Api";

// Converts API pt_packs → PtPackCard format
const parsePtPacksPreview = (pt_packs) => {
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
import { getToken } from "../../utils/auth";

// Maps API dailypass response → DailyPassCard item format
const parseDailyPassPreview = (dailypass, categoryConfig) => {
  if (!dailypass) return [];
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

// Converts setup API memberships[] → { [months]: { planId, price, members, ... } }
const parseMembershipsFromSetup = (memberships = []) => {
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

const InitialSetupView = memo(({ category, onSetPrice }) => {
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [acknowledged, setAcknowledged] = useState(true);
  const [buddyCount, setBuddyCount] = useState(null);
  const [sessionsCount, setSessionsCount] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [ptPacksPricing, setPtPacksPricing] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef(null);
  const debounceControllerRef = useRef(null);
  const ptDebounceRef = useRef(null);
  const ptDebounceControllerRef = useRef(null);
  const isPT = PT_CATEGORIES.includes(category);
  const isBuddy = BUDDY_CATEGORIES.includes(category);
  const isPtPack = PT_PACK_CATEGORIES.includes(category);
  const hasDailyPass = !NO_DAILYPASS_CATEGORIES.includes(category) && !isPtPack;
  const categoryConfig = PLAN_CATEGORIES.find((c) => c.id === category);

  const priceInt = parseInt(monthlyPrice) || 0;
  const hasValidPrice = monthlyPrice.length >= 3 && priceInt >= 100;
  // Enable button only after preview is loaded for categories that show previews
  const hasPricing = hasDailyPass
    ? pricing.length > 0 && hasValidPrice
    : isPtPack
      ? ptPacksPricing.length > 0 && hasValidPrice
      : hasValidPrice;

  // Debounced daily pass preview with AbortController
  useEffect(() => {
    if (!hasDailyPass) return;

    if (monthlyPrice.length < 3 || priceInt < 100) {
      setPricing([]);
      setLoadingPricing(false);
      return;
    }

    setLoadingPricing(true);
    clearTimeout(debounceRef.current);
    debounceControllerRef.current?.abort();
    const controller = new AbortController();
    debounceControllerRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getDailypassPreviewAPI(priceInt, {
          signal: controller.signal,
        });

        if (res?.status === 200 && res.dailypass) {
          setPricing(parseDailyPassPreview(res.dailypass, categoryConfig));
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
  }, [monthlyPrice, priceInt, categoryConfig, hasDailyPass]);

  // Debounced PT packs preview with AbortController
  useEffect(() => {
    if (!isPtPack) return;

    if (monthlyPrice.length < 3 || priceInt < 100) {
      setPtPacksPricing([]);
      setLoadingPricing(false);
      return;
    }

    setLoadingPricing(true);
    clearTimeout(ptDebounceRef.current);
    ptDebounceControllerRef.current?.abort();
    const controller = new AbortController();
    ptDebounceControllerRef.current = controller;

    ptDebounceRef.current = setTimeout(async () => {
      try {
        const res = await getPtPacksPreviewAPI(priceInt, {
          signal: controller.signal,
        });
        if (res?.status === 200 && res.pt_packs) {
          setPtPacksPricing(parsePtPacksPreview(res.pt_packs));
        } else {
          setPtPacksPricing([]);
        }
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setPtPacksPricing([]);
      }
      if (!controller.signal.aborted) setLoadingPricing(false);
    }, 600);

    return () => {
      clearTimeout(ptDebounceRef.current);
      controller.abort();
    };
  }, [monthlyPrice, priceInt, isPtPack]);

  const handleSetPrice = useCallback(async () => {
    if (!hasPricing || !acknowledged || submitting) return;
    setSubmitting(true);
    try {
      const gymId = await getToken("gym_id");
      const res = await setupGymPlansAPI({
        gym_id: gymId,
        category: toApiKey(category),
        owner_price: priceInt,
        ...(isBuddy && buddyCount ? { members: buddyCount } : {}),
        ...(isPtPack && sessionsCount ? { no_of_session: sessionsCount } : {}),
      });

      let planPrices = {};
      let dailyPricing = pricing;
      let ptPacks = ptPacksPricing.length > 0 ? ptPacksPricing : null;

      if (res?.status === 200) {
        // Response is flat: res.memberships, res.dailypass, res.pt_packs
        if (res.memberships) {
          planPrices = parseMembershipsFromSetup(res.memberships);
        }
        if (res.dailypass) {
          dailyPricing = parseDailyPassPreview(res.dailypass, categoryConfig);
        }
        if (res.pt_packs) {
          ptPacks = parsePtPacksPreview(res.pt_packs);
        }
      }

      onSetPrice({
        monthlyPrice: priceInt,
        dailyPricing,
        ptPacks,
        planPrices,
        buddyCount,
        sessionsCount,
      });
    } catch (e) {
      // Fall through — parent shows PlansListView without planIds
      onSetPrice({
        monthlyPrice: priceInt,
        dailyPricing: pricing,
        ptPacks: ptPacksPricing.length > 0 ? ptPacksPricing : null,
        planPrices: {},
        buddyCount,
        sessionsCount,
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    hasPricing,
    acknowledged,
    submitting,
    priceInt,
    pricing,
    ptPacksPricing,
    category,
    categoryConfig,
    buddyCount,
    sessionsCount,
    onSetPrice,
  ]);

  return (
    <View style={styles.container}>
      <MonthlyPriceInput
        value={monthlyPrice}
        onChangeText={setMonthlyPrice}
        label="1 Month Plan"
      />

      {isBuddy && (
        <View style={styles.dropdownSection}>
          <CustomDropdown
            label="Number of Members"
            value={buddyCount}
            onChange={(option) => setBuddyCount(option.value)}
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
            onChange={(option) => setSessionsCount(option.value)}
            options={SESSIONS_COUNT_OPTIONS}
            placeholder="Select sessions per month"
          />
        </View>
      )}

      {(hasDailyPass || isPtPack) && loadingPricing && (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color="#FF5757" />
          <Text style={styles.loaderText}>Calculating pricing…</Text>
        </View>
      )}

      {hasDailyPass && !loadingPricing && hasPricing && (
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>
            Your {categoryConfig?.shortUnit || "Daily Pass"} Pricing{" "}
            <Text style={styles.pricingSubtitle}>
              ( Auto calculated based on 1 Month plan)
            </Text>
          </Text>
          <View style={styles.cardsContainer}>
            {pricing.map((item, index) => (
              <DailyPassCard key={index} item={item} index={index} />
            ))}
          </View>
        </View>
      )}

      {isPtPack && !loadingPricing && ptPacksPricing.length > 0 && (
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>
            PT Sessions Pricing{" "}
            <Text style={styles.pricingSubtitle}>
              ( Auto calculated based on 1 Month plan)
            </Text>
          </Text>
          <View style={styles.cardsContainer}>
            {ptPacksPricing.map((item, index) => (
              <PtPackCard key={index} item={item} index={index} />
            ))}
          </View>
        </View>
      )}
      {hasDailyPass && !loadingPricing && hasPricing && (
        <View style={styles.packValidityNote}>
          <Text style={styles.packValidityText}>
            Note: 7 Day Pack has 14 days validity & 14 Day Pack has 28 days
            validity.
          </Text>
        </View>
      )}

      {(hasDailyPass || isPtPack) && !loadingPricing && hasPricing && (
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
  dropdownSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
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

export default InitialSetupView;
