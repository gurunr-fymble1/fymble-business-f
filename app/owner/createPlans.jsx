import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  Switch,
  Keyboard,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import PlanCategoryTabs from "../../components/createPlans/PlanCategoryTabs";
import InitialSetupView from "../../components/createPlans/InitialSetupView";
import PlansListView from "../../components/createPlans/PlansListView";
import SessionSetupView from "../../components/createPlans/SessionSetupView";
import SessionDetailView from "../../components/createPlans/SessionDetailView";
import PtSetupView from "../../components/createPlans/PtSetupView";
import PtDetailView from "../../components/createPlans/PtDetailView";
import {
  PLAN_CATEGORIES,
  FITNESS_CLASS_IDS,
  PT_CATEGORY_ID,
  toApiKey,
  toInternalId,
} from "../../components/createPlans/planConstants";
import {
  getGymPlansAPI,
  getSessionsCatalogAPI,
  getSessionDetailAPI,
  getPtOverviewAPI,
  noCostBNPLSetAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import { castArray } from "lodash";

// Converts API memberships[] → { [months]: { planId, price, members, bonus, bonusType, pause, pauseType } }
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

// Converts API pt_packs → PtPackCard format
const parsePtPacks = (pt_packs) => {
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

// Converts API dailypass → DailyPassCard format
const parseDailyPass = (dailypass, categoryConfig) => {
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

const seedSetupData = (res, internalId) => {
  const cat = PLAN_CATEGORIES.find((c) => c.id === internalId);
  const memberships = res.memberships || [];
  if (memberships.length === 0) return null;

  const oneMonth = memberships.find((m) => m.duration_months === 1);
  // If the 1-month plan has no price set yet (owner_price === 0), treat as unconfigured
  if (!oneMonth || !oneMonth.owner_price) return null;

  return {
    monthlyPrice: oneMonth.owner_price,
    dailyPricing: parseDailyPass(res.dailypass, cat) || [],
    ptPacks: parsePtPacks(res.pt_packs) || null,
    planPrices: parseMemberships(memberships),
  };
};

const CreatePlans = () => {
  const router = useRouter();
  const { tab } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const gymIdRef = useRef(null);
  const initialTabRef = useRef(tab || null);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState(null);
  const [activeCategory, setActiveCategory] = useState(tab || "membership");
  // { categoryId: { monthlyPrice, dailyPricing, planPrices } | null }
  // For fitness classes: { monthlyPrice, sessionPacks, slots, sessionId, enabled }
  // null means "fetched but not configured"; undefined means "not fetched yet"
  const [setupData, setSetupData] = useState({});
  // sessionId lookup: { [categoryId]: session_id } — use ref for immediate access
  const sessionIdMapRef = useRef({});
  const catalogFetchedRef = useRef(false);
  const ptFetchedRef = useRef(false);
  const [noCostEMI, setNoCostEMI] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Shimmer sweep animation for EMI badge
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);
  // Translate from -30 (left of badge) to full badge width (~90)
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 90],
  });

  // Fetch on mount — only gym_plans (individual)
  useEffect(() => {
    const controller = new AbortController();

    const fetchInitial = async () => {
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) return;
        gymIdRef.current = gymId;

        const res = await getGymPlansAPI(gymId, "individual", {
          signal: controller.signal,
        });

        if (!res || res.status !== 200) return;

        // Read no_cost_emi from API response
        if (res.no_cost_emi != null) setNoCostEMI(!!res.no_cost_emi);

        const cats = (res.tabs || [])
          .map((tab) => {
            const internalId = toInternalId(tab.key);
            const cat = PLAN_CATEGORIES.find((c) => c.id === internalId);
            if (!cat) return null;
            return { ...cat, configured: tab.configured };
          })
          .filter(Boolean);

        if (cats.length > 0) {
          setApiCategories(cats);
          // Only override activeCategory if no tab param was passed
          if (!initialTabRef.current) {
            setActiveCategory(cats[0].id);
          }
        }

        const firstInternalId = cats.length > 0 ? cats[0].id : "membership";
        const seeded = seedSetupData(res, firstInternalId);
        setSetupData({ [firstInternalId]: seeded });
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchInitial();

    return () => controller.abort();
  }, []);

  // When loading finishes and a tab param was provided, trigger fetch for that category
  const initialTabTriggeredRef = useRef(false);
  useEffect(() => {
    if (!loading && initialTabRef.current && !initialTabTriggeredRef.current) {
      initialTabTriggeredRef.current = true;
      const targetTab = initialTabRef.current;
      // If the target tab data isn't already fetched, trigger handleCategoryChange
      if (!setupData.hasOwnProperty(targetTab)) {
        handleCategoryChange(targetTab);
      }
    }
  }, [loading]);

  // Abort previous tab fetch when switching tabs quickly
  const tabControllerRef = useRef(null);

  // Fetches sessions catalog once, populates ref + apiCategories chips
  const fetchCatalogOnce = useCallback(async (signal) => {
    if (catalogFetchedRef.current) return;
    catalogFetchedRef.current = true;

    const gymId = gymIdRef.current || (await getToken("gym_id"));
    gymIdRef.current = gymId;

    const catalogRes = await getSessionsCatalogAPI(gymId, { signal });

    const classes = catalogRes?.classes || catalogRes?.sessions;
    if (catalogRes?.status !== 200 || !classes) return;

    const idMap = {};
    const fitnessCats = [];
    classes.forEach((s) => {
      const internalId = toInternalId(s.key);
      if (!FITNESS_CLASS_IDS.includes(internalId)) return;
      idMap[internalId] = s.session_id;
      const staticCat = PLAN_CATEGORIES.find((c) => c.id === internalId);
      if (!staticCat) return;
      fitnessCats.push({
        ...staticCat,
        configured: s.configured,
        sessionId: s.session_id,
      });
    });

    sessionIdMapRef.current = idMap;

    // Merge fitness chips into apiCategories
    if (fitnessCats.length > 0) {
      setApiCategories((prev) => {
        const base = prev || [];
        const merged = [...base];
        fitnessCats.forEach((fc) => {
          const idx = merged.findIndex((c) => c.id === fc.id);
          if (idx >= 0) merged[idx] = fc;
          else merged.push(fc);
        });
        return merged;
      });
    }
  }, []);

  // Fetches PT overview once, populates setupData for "pt" category
  const fetchPtOnce = useCallback(async (signal) => {
    if (ptFetchedRef.current) return;
    ptFetchedRef.current = true;

    const gymId = gymIdRef.current || (await getToken("gym_id"));
    gymIdRef.current = gymId;

    const res = await getPtOverviewAPI(gymId, { signal });
    if (res?.status !== 200) return;

    const split = res.split || {};
    const memberships = res.memberships || [];
    const isConfigured = split.configured && split.monthly_price;

    if (isConfigured) {
      // Parse packs from split.packs (flat array)
      const rawPacks = split.packs || [];
      const ptPacks = rawPacks.map((p) => ({
        label: p.label,
        sessions: p.sessions,
        packTotal: p.customer_price,
        ownerPerSession: p.owner_per_session,
        earnMore: p.extra_amount,
        extraPercent: p.extra_percent,
        validityDays: p.validity_days,
      }));

      // Parse memberships into planPrices (same format as parseMemberships)
      const planPrices = parseMemberships(memberships);

      // Parse trainers
      const trainers = (res.trainers || []).map((t) => ({
        ...t,
        full_name: t.name || t.full_name,
        slots: {
          days: t.slots?.map((s) => s.day) || [],
          slots: [...new Set((t.slots || []).flatMap((s) => s.times || []))],
        },
      }));

      setSetupData((prev) => ({
        ...prev,
        pt: {
          monthlyPrice: split.monthly_price,
          ptPacks,
          planPrices,
          trainers,
        },
      }));

      // Mark PT as configured in tabs
      setApiCategories((prev) =>
        prev
          ? prev.map((cat) =>
              cat.id === "pt" ? { ...cat, configured: true } : cat,
            )
          : prev,
      );
    } else {
      // PT not configured
      setSetupData((prev) => ({ ...prev, pt: null }));
    }
  }, []);

  // Fetch category data when tab changes (if not already cached)
  const handleCategoryChange = useCallback(
    async (categoryId) => {
      setActiveCategory(categoryId);

      // Already fetched (including null = "not configured")
      if (setupData.hasOwnProperty(categoryId)) return;

      // Cancel any in-flight tab fetch
      tabControllerRef.current?.abort();
      const controller = new AbortController();
      tabControllerRef.current = controller;

      const isFitnessClass = FITNESS_CLASS_IDS.includes(categoryId);
      const isPt = categoryId === PT_CATEGORY_ID;

      setTabLoading(true);
      try {
        const gymId = gymIdRef.current || (await getToken("gym_id"));
        gymIdRef.current = gymId;

        if (isPt) {
          // Lazy-fetch PT overview on first PT tab click
          await fetchPtOnce(controller.signal);
        } else if (isFitnessClass) {
          // Fetch catalog on first fitness tab click
          await fetchCatalogOnce(controller.signal);

          const sid = sessionIdMapRef.current[categoryId];
          if (!sid) {
            // Not in catalog → show setup without session_id (shouldn't happen)
            setSetupData((prev) => ({ ...prev, [categoryId]: null }));
            return;
          }

          const res = await getSessionDetailAPI(gymId, sid, {
            signal: controller.signal,
          });
          if (res?.status === 200 && res.monthly_price) {
            const sessionPacks = (res.packs || []).map((p) => ({
              label: p.label,
              price: p.customer_price,
              extraPercent: p.extra_percent,
              earnMore: p.extra_amount,
              potentialRevenue: p.monthly_equivalent,
            }));
            setSetupData((prev) => ({
              ...prev,
              [categoryId]: {
                monthlyPrice: res.monthly_price,
                sessionPacks,
                slots: res.slots || [],
                sessionId: sid,
                enabled: res.enabled ?? true,
              },
            }));
          } else {
            setSetupData((prev) => ({ ...prev, [categoryId]: null }));
          }
        } else {
          // Standard gym_plans fetch
          const apiKey = toApiKey(categoryId);
          const res = await getGymPlansAPI(gymId, apiKey, {
            signal: controller.signal,
          });

          if (res?.status === 200) {
            const seeded = seedSetupData(res, categoryId);
            setSetupData((prev) => ({ ...prev, [categoryId]: seeded }));

            // Refresh tab configured flag if it changed
            if (res.tabs?.length > 0) {
              setApiCategories((prev) =>
                prev
                  ? prev.map((cat) => {
                      const match = res.tabs.find(
                        (t) => toInternalId(t.key) === cat.id,
                      );
                      return match
                        ? { ...cat, configured: match.configured }
                        : cat;
                    })
                  : prev,
              );
            }
          } else {
            setSetupData((prev) => ({ ...prev, [categoryId]: null }));
          }
        }
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setSetupData((prev) => ({ ...prev, [categoryId]: null }));
      } finally {
        if (!controller.signal.aborted) setTabLoading(false);
      }
    },
    [setupData, fetchCatalogOnce, fetchPtOnce],
  );

  const handleSetPrice = useCallback(
    (data) => {
      setSetupData((prev) => ({ ...prev, [activeCategory]: data }));
      // Mark tab as configured
      setApiCategories((prev) =>
        prev
          ? prev.map((cat) =>
              cat.id === activeCategory ? { ...cat, configured: true } : cat,
            )
          : prev,
      );
      // Update ref if the setup returned a session_id
      if (data?.sessionId && FITNESS_CLASS_IDS.includes(activeCategory)) {
        sessionIdMapRef.current[activeCategory] = data.sessionId;
      }
    },
    [activeCategory],
  );

  const activeCategoryConfig = useMemo(
    () => PLAN_CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory],
  );

  const headerText = useMemo(() => {
    const label = (activeCategoryConfig?.label || "Membership").replace(
      /\s*Plans?$/i,
      "",
    );
    return `Create ${label} Plans`;
  }, [activeCategoryConfig]);

  // Toggle EMI and persist via API
  const handleEMIToggle = useCallback(async (value) => {
    setNoCostEMI(value);
    try {
      const gymId = gymIdRef.current || (await getToken("gym_id"));
      await noCostBNPLSetAPI({ gym_id: gymId, no_cost_emi: value });
    } catch {
      // revert on failure
      setNoCostEMI(!value);
    }
  }, []);

  const categoryData = setupData[activeCategory];
  // Show configured view if we have data for this category
  const hasSetupData = !!categoryData;
  const isFitnessClass = FITNESS_CLASS_IDS.includes(activeCategory);
  const isPt = activeCategory === PT_CATEGORY_ID;

  const displayCategories = apiCategories || PLAN_CATEGORIES;

  return (
    <View style={styles.container}>
      <NewOwnerHeader
        text={headerText}
        onBackButtonPress={() => router.push("/owner/home")}
        rightElement={
          loading ? null : (
            <TouchableOpacity
              style={[styles.emiBadge, noCostEMI && styles.emiBadgeActive]}
              onPress={() => setShowTermsModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.emiBadgeLabel}>0% EMI</Text>
              <View
                style={[
                  styles.emiBadgeDot,
                  noCostEMI && styles.emiBadgeDotActive,
                ]}
              />
              <Text
                style={[
                  styles.emiBadgeStatus,
                  noCostEMI && styles.emiBadgeStatusActive,
                ]}
              >
                {noCostEMI ? "ON" : "OFF"}
              </Text>
              {/* Shimmer sweep */}
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  { transform: [{ translateX: shimmerTranslateX }] },
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(255,255,255,0.8)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </TouchableOpacity>
          )
        }
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF5757" />
        </View>
      ) : (
        <>
          <PlanCategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            categories={displayCategories}
          />

          {tabLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FF5757" />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  {isPt ? (
                    hasSetupData ? (
                      <PtDetailView
                        key={activeCategory}
                        monthlyPrice={categoryData?.monthlyPrice}
                        ptPacks={categoryData?.ptPacks}
                        initialPlanPrices={categoryData?.planPrices}
                        trainers={categoryData?.trainers}
                        gymId={gymIdRef.current}
                      />
                    ) : (
                      <PtSetupView
                        key={activeCategory}
                        onSetPrice={handleSetPrice}
                      />
                    )
                  ) : isFitnessClass ? (
                    hasSetupData ? (
                      <SessionDetailView
                        key={activeCategory}
                        category={activeCategory}
                        sessionId={categoryData?.sessionId}
                        monthlyPrice={categoryData?.monthlyPrice}
                        sessionPacks={categoryData?.sessionPacks}
                        slots={categoryData?.slots}
                        gymId={gymIdRef.current}
                      />
                    ) : (
                      <SessionSetupView
                        key={activeCategory}
                        category={activeCategory}
                        sessionId={sessionIdMapRef.current[activeCategory]}
                        onSetPrice={handleSetPrice}
                      />
                    )
                  ) : hasSetupData ? (
                    <PlansListView
                      key={activeCategory}
                      category={activeCategory}
                      monthlyPrice={categoryData?.monthlyPrice}
                      dailyPricing={categoryData?.dailyPricing}
                      ptPacks={categoryData?.ptPacks}
                      initialPlanPrices={categoryData?.planPrices}
                    />
                  ) : (
                    <InitialSetupView
                      key={activeCategory}
                      category={activeCategory}
                      onSetPrice={handleSetPrice}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          )}
        </>
      )}

      {/* EMI Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>No-Cost EMI</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Feather name="x" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.emiToggleRow}>
              <View style={styles.emiToggleLeft}>
                <Text style={styles.emiToggleLabel}>Enable No-Cost EMI</Text>
                <Text style={styles.emiToggleSubtext}>
                  Available on 3 & 6 months tenure
                </Text>
              </View>
              <Switch
                value={noCostEMI}
                onValueChange={handleEMIToggle}
                trackColor={{ false: "#D1D5DB", true: "#007BFF" }}
                thumbColor={noCostEMI ? "#FFFFFF" : "#F3F4F6"}
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            <ScrollView
              style={styles.termsModalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.termsHeading}>Terms & Conditions</Text>
              {[
                "A 5% processing fee will be deducted from the total payment amount received by the gym owner.",
                "Clients can pay using 3-month or 6-month EMI tenure option.",
                "No Cost EMI is available only for plans with amount \u20B94,000 or above.",
                "The EMI interest is borne by the gym owner through the 5% deduction.",
                "Clients will see 0% interest on their EMI payments.",
                "The full payment (minus 5% deduction) will be settled to the gym owner within standard settlement timelines.",
                "This feature can be enabled or disabled at any time.",
                "Razorpay's standard EMI terms and conditions apply.",
              ].map((text, i) => (
                <View key={i} style={styles.termsItem}>
                  <Text style={styles.termsBullet}>{"\u2022"}</Text>
                  <Text style={styles.termsText}>{text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.termsModalFooter}>
              <TouchableOpacity
                style={styles.termsCloseButton}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.termsCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreatePlans;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  emiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DC2626",
    gap: 4,
    overflow: "hidden",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 30,
    borderRadius: 14,
  },
  emiBadgeActive: {
    backgroundColor: "#22C55E",
    borderColor: "#16A34A",
  },
  emiBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emiBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    opacity: 0.7,
  },
  emiBadgeDotActive: {
    backgroundColor: "#FFFFFF",
    opacity: 1,
  },
  emiBadgeStatus: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emiBadgeStatusActive: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  termsModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxHeight: "75%",
    overflow: "hidden",
    elevation: 5,
  },
  termsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  termsModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  emiToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  emiToggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  emiToggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  emiToggleSubtext: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
  },
  termsModalBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  termsHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  termsItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  termsBullet: {
    fontSize: 14,
    color: "#007BFF",
    marginRight: 10,
    marginTop: 1,
    fontWeight: "700",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  termsModalFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  termsCloseButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  termsCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
