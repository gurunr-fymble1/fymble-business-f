import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { addPlanAPI, addPlanBulkAPI } from "../../services/Api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

const QuickPlanSetup = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const planTabScrollRef = useRef(null);

  // Main tabs
  const [activeMainTab, setActiveMainTab] = useState("quick");

  // Plan category tabs
  const planSubTabs = [
    { id: "membership", label: "Individual", planFor: "individual", pt: false },
    { id: "couple_membership", label: "Couple", planFor: "couple", pt: false },
    { id: "buddy_membership", label: "Buddy", planFor: "buddy", pt: false },
    { id: "pt", label: "Individual PT", planFor: "individual", pt: true },
    { id: "couple_pt", label: "Couple PT", planFor: "couple", pt: true },
    { id: "buddy_pt", label: "Buddy PT", planFor: "buddy", pt: true },
  ];

  // Get initial plan sub-tab from params (from manageplans.jsx)
  const getInitialSubTab = () => {
    if (params.planSubTab) {
      return params.planSubTab;
    }
    return "membership";
  };

  const [planSubTab, setPlanSubTab] = useState(getInitialSubTab());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Scroll to initial tab on mount
  useEffect(() => {
    const initialTabIndex = planSubTabs.findIndex(
      (tab) => tab.id === planSubTab,
    );
    if (initialTabIndex > -1) {
      const tabWidth = 120;
      let scrollX = 0;
      if (initialTabIndex === 0) {
        scrollX = 0;
      } else if (initialTabIndex >= planSubTabs.length - 2) {
        scrollX = (planSubTabs.length - 3) * tabWidth;
      } else {
        scrollX = (initialTabIndex - 1) * tabWidth;
      }
      // Small delay to ensure the ref is ready
      setTimeout(() => {
        planTabScrollRef.current?.scrollTo({
          x: Math.max(0, scrollX),
          animated: true,
        });
      }, 100);
    }
  }, []);

  // Quick setup plans - pre-filled with common durations
  const [quickPlans, setQuickPlans] = useState({
    membership: [
      { name: "1 Month Plan", duration: 1, amount: "", isCustom: false },
      { name: "3 Months Plan", duration: 3, amount: "", isCustom: false },
      { name: "6 Months Plan", duration: 6, amount: "", isCustom: false },
      { name: "12 Months Plan", duration: 12, amount: "", isCustom: false },
    ],
    couple_membership: [
      { name: "1 Month Couple Plan", duration: 1, amount: "", isCustom: false },
      {
        name: "3 Months Couple Plan",
        duration: 3,
        amount: "",
        isCustom: false,
      },
      {
        name: "6 Months Couple Plan",
        duration: 6,
        amount: "",
        isCustom: false,
      },
      {
        name: "12 Months Couple Plan",
        duration: 12,
        amount: "",
        isCustom: false,
      },
    ],
    buddy_membership: [
      { name: "1 Month Buddy Plan", duration: 1, amount: "", isCustom: false },
      { name: "3 Months Buddy Plan", duration: 3, amount: "", isCustom: false },
      { name: "6 Months Buddy Plan", duration: 6, amount: "", isCustom: false },
      {
        name: "12 Months Buddy Plan",
        duration: 12,
        amount: "",
        isCustom: false,
      },
    ],
    pt: [
      { name: "1 Month PT Plan", duration: 1, amount: "", isCustom: false },
      { name: "3 Months PT Plan", duration: 3, amount: "", isCustom: false },
      { name: "6 Months PT Plan", duration: 6, amount: "", isCustom: false },
      { name: "12 Months PT Plan", duration: 12, amount: "", isCustom: false },
    ],
    couple_pt: [
      {
        name: "1 Month Couple PT Plan",
        duration: 1,
        amount: "",
        isCustom: false,
      },
      {
        name: "3 Months Couple PT Plan",
        duration: 3,
        amount: "",
        isCustom: false,
      },
      {
        name: "6 Months Couple PT Plan",
        duration: 6,
        amount: "",
        isCustom: false,
      },
      {
        name: "12 Months Couple PT Plan",
        duration: 12,
        amount: "",
        isCustom: false,
      },
    ],
    buddy_pt: [
      {
        name: "1 Month Buddy PT Plan",
        duration: 1,
        amount: "",
        isCustom: false,
      },
      {
        name: "3 Months Buddy PT Plan",
        duration: 3,
        amount: "",
        isCustom: false,
      },
      {
        name: "6 Months Buddy PT Plan",
        duration: 6,
        amount: "",
        isCustom: false,
      },
      {
        name: "12 Months Buddy PT Plan",
        duration: 12,
        amount: "",
        isCustom: false,
      },
    ],
  });

  // Detailed plan state
  const [detailedPlan, setDetailedPlan] = useState({
    name: "",
    duration: null,
    originalAmount: "",
    discountedAmount: "",
    discountPercentage: "",
    bonus: null,
    bonusType: "day",
    pause: null,
    pauseType: "day",
    services: [],
    description: "",
    buddyCount: null,
    sessionsCount: null,
  });

  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [pauseInfoVisible, setPauseInfoVisible] = useState(false);

  const getCurrentPlanConfig = () => {
    return planSubTabs.find((tab) => tab.id === planSubTab);
  };

  const updateQuickPlanAmount = (category, index, amount) => {
    const updatedPlans = { ...quickPlans };
    updatedPlans[category][index].amount = amount;
    setQuickPlans(updatedPlans);
  };

  const addQuickPlanRow = (category) => {
    const updatedPlans = { ...quickPlans };
    updatedPlans[category].push({
      name: "",
      duration: null,
      amount: "",
      isCustom: true,
    });
    setQuickPlans(updatedPlans);
  };

  const removeQuickPlanRow = (category, index) => {
    const updatedPlans = { ...quickPlans };
    updatedPlans[category].splice(index, 1);
    setQuickPlans(updatedPlans);
  };

  const updateQuickPlanName = (category, index, name) => {
    const updatedPlans = { ...quickPlans };
    updatedPlans[category][index].name = name;
    setQuickPlans(updatedPlans);
  };

  const updateQuickPlanDuration = (category, index, duration) => {
    const updatedPlans = { ...quickPlans };
    updatedPlans[category][index].duration = duration;
    setQuickPlans(updatedPlans);
  };

  const validateQuickPlans = () => {
    // Collect all filled plans from all categories
    let allFilledPlans = [];
    let hasError = false;
    let errorMessage = "";

    Object.keys(quickPlans).forEach((category) => {
      const categoryConfig = planSubTabs.find((tab) => tab.id === category);
      const plans = quickPlans[category];
      const filledPlans = plans.filter(
        (plan) => plan.amount && plan.amount.trim() !== "",
      );

      filledPlans.forEach((plan, i) => {
        if (!plan.name || !plan.name.trim()) {
          hasError = true;
          errorMessage = `${categoryConfig.label} - Plan ${
            i + 1
          }: Name is required`;
        }
        if (!plan.duration) {
          hasError = true;
          errorMessage = `${categoryConfig.label} - Plan ${
            i + 1
          }: Duration is required`;
        }
        const amount = parseFloat(plan.amount);
        if (isNaN(amount) || amount <= 0) {
          hasError = true;
          errorMessage = `${categoryConfig.label} - Plan ${
            i + 1
          }: Valid amount is required`;
        }

        // Validate buddy count for buddy plans
        if (categoryConfig.planFor === "buddy" && !detailedPlan.buddyCount) {
          hasError = true;
          errorMessage = "Please select number of members for buddy plans";
        }
      });

      allFilledPlans.push(...filledPlans);
    });

    if (allFilledPlans.length === 0) {
      showToast({
        type: "error",
        title: "Please add at least one plan with amount",
      });
      return false;
    }

    if (hasError) {
      showToast({
        type: "error",
        title: errorMessage,
      });
      return false;
    }

    return true;
  };

  const getFilledQuickPlans = () => {
    // Collect all filled plans from all categories
    let allPlans = [];

    // Default services for membership plans
    const defaultMembershipServices = [
      "Access to Gym Floor",
      "Cardio Equipment Access",
      "Strength Training Equipment",
      "Free Weights Area",
    ];

    // Default services for PT plans
    const defaultPTServices = [
      "One-on-One Personal Training",
      "Strength Training Coaching",
      "Weight Loss Coaching",
      "Muscle Building Coaching",
    ];

    Object.keys(quickPlans).forEach((category) => {
      const categoryConfig = planSubTabs.find((tab) => tab.id === category);
      const plans = quickPlans[category];
      const filledPlans = plans
        .filter((plan) => plan.amount && plan.amount.trim() !== "")
        .map((plan) => ({
          plan_name: plan.name,
          duration: plan.duration,
          amount: parseFloat(plan.amount),
          personal_training: categoryConfig.pt,
          is_couple: categoryConfig.planFor === "couple",
          plan_for: categoryConfig.planFor,
          buddy_count:
            categoryConfig.planFor === "buddy" ? detailedPlan.buddyCount : null,
          sessions_count:
            categoryConfig.pt && (categoryConfig.planFor === "individual" || categoryConfig.planFor === "couple")
              ? detailedPlan.sessionsCount
              : null,
          category: categoryConfig.label, // Add category for preview
          services: categoryConfig.pt
            ? defaultPTServices
            : defaultMembershipServices,
        }));

      allPlans.push(...filledPlans);
    });

    return allPlans;
  };

  const handleQuickSetupSave = async () => {
    if (!validateQuickPlans()) {
      return;
    }

    setShowPreviewModal(true);
  };

  const confirmQuickSetupSave = async () => {
    setShowPreviewModal(false);
    setIsSubmitting(true);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not available",
        });
        setIsSubmitting(false);
        return;
      }

      const plansToCreate = getFilledQuickPlans();

      const payload = {
        gym_id: gymId,
        plans: plansToCreate,
      };

      const response = await addPlanBulkAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: `${plansToCreate.length} plan${
            plansToCreate.length > 1 ? "s" : ""
          } created successfully!`,
        });

        // Reset all category plans
        setQuickPlans({
          membership: [
            { name: "1 Month Plan", duration: 1, amount: "", isCustom: false },
            { name: "3 Months Plan", duration: 3, amount: "", isCustom: false },
            { name: "6 Months Plan", duration: 6, amount: "", isCustom: false },
            {
              name: "12 Months Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
          couple_membership: [
            {
              name: "1 Month Couple Plan",
              duration: 1,
              amount: "",
              isCustom: false,
            },
            {
              name: "3 Months Couple Plan",
              duration: 3,
              amount: "",
              isCustom: false,
            },
            {
              name: "6 Months Couple Plan",
              duration: 6,
              amount: "",
              isCustom: false,
            },
            {
              name: "12 Months Couple Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
          buddy_membership: [
            {
              name: "1 Month Buddy Plan",
              duration: 1,
              amount: "",
              isCustom: false,
            },
            {
              name: "3 Months Buddy Plan",
              duration: 3,
              amount: "",
              isCustom: false,
            },
            {
              name: "6 Months Buddy Plan",
              duration: 6,
              amount: "",
              isCustom: false,
            },
            {
              name: "12 Months Buddy Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
          pt: [
            {
              name: "1 Month PT Plan",
              duration: 1,
              amount: "",
              isCustom: false,
            },
            {
              name: "3 Months PT Plan",
              duration: 3,
              amount: "",
              isCustom: false,
            },
            {
              name: "6 Months PT Plan",
              duration: 6,
              amount: "",
              isCustom: false,
            },
            {
              name: "12 Months PT Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
          couple_pt: [
            {
              name: "1 Month Couple PT Plan",
              duration: 1,
              amount: "",
              isCustom: false,
            },
            {
              name: "3 Months Couple PT Plan",
              duration: 3,
              amount: "",
              isCustom: false,
            },
            {
              name: "6 Months Couple PT Plan",
              duration: 6,
              amount: "",
              isCustom: false,
            },
            {
              name: "12 Months Couple PT Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
          buddy_pt: [
            {
              name: "1 Month Buddy PT Plan",
              duration: 1,
              amount: "",
              isCustom: false,
            },
            {
              name: "3 Months Buddy PT Plan",
              duration: 3,
              amount: "",
              isCustom: false,
            },
            {
              name: "6 Months Buddy PT Plan",
              duration: 6,
              amount: "",
              isCustom: false,
            },
            {
              name: "12 Months Buddy PT Plan",
              duration: 12,
              amount: "",
              isCustom: false,
            },
          ],
        });

        // Navigate back after delay
        setTimeout(() => {
          router.push("/owner/manageplans");
        }, 1500);
      } else {
        showToast({
          type: "error",
          title: "Failed to create plans",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to create plans",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateDetailedPlan = () => {
    if (!detailedPlan.name.trim()) {
      showToast({ type: "error", title: "Please enter plan name" });
      return false;
    }
    if (!detailedPlan.duration) {
      showToast({ type: "error", title: "Please select duration" });
      return false;
    }
    if (!detailedPlan.originalAmount.trim()) {
      showToast({ type: "error", title: "Please enter original amount" });
      return false;
    }

    const originalNum = parseFloat(detailedPlan.originalAmount);
    if (isNaN(originalNum) || originalNum <= 0) {
      showToast({
        type: "error",
        title: "Original amount must be valid and greater than 0",
      });
      return false;
    }

    if (detailedPlan.discountedAmount.trim()) {
      const discountedNum = parseFloat(detailedPlan.discountedAmount);
      if (isNaN(discountedNum) || discountedNum <= 0) {
        showToast({
          type: "error",
          title: "Final amount must be valid and greater than 0",
        });
        return false;
      }
      if (discountedNum > originalNum) {
        showToast({
          type: "error",
          title: "Final amount cannot be more than original amount",
        });
        return false;
      }
    }

    if (detailedPlan.services.length === 0) {
      showToast({
        type: "error",
        title: "Please select at least one service",
      });
      return false;
    }

    const currentConfig = getCurrentPlanConfig();
    if (currentConfig.planFor === "buddy" && !detailedPlan.buddyCount) {
      showToast({
        type: "error",
        title: "Please select number of members for buddy plan",
      });
      return false;
    }

    return true;
  };

  const handleDetailedPlanSave = async () => {
    if (!validateDetailedPlan()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Gym ID not available" });
        setIsSubmitting(false);
        return;
      }

      const currentConfig = getCurrentPlanConfig();
      const payload = {
        gym_id: gymId,
        plan_name: detailedPlan.name,
        amount: detailedPlan.discountedAmount
          ? parseFloat(detailedPlan.discountedAmount)
          : parseFloat(detailedPlan.originalAmount),
        original: parseFloat(detailedPlan.originalAmount),
        duration: detailedPlan.duration,
        bonus: detailedPlan.bonus || null,
        bonus_type: detailedPlan.bonus ? detailedPlan.bonusType : null,
        pause: detailedPlan.pause || null,
        pause_type: detailedPlan.pause ? detailedPlan.pauseType : null,
        description: detailedPlan.description || "",
        personal_training: currentConfig.pt,
        services: detailedPlan.services || [],
        plan_for: currentConfig.planFor,
        is_couple: currentConfig.planFor === "couple",
        buddy_count:
          currentConfig.planFor === "buddy" ? detailedPlan.buddyCount : null,
        sessions_count:
          currentConfig.pt && (currentConfig.planFor === "individual" || currentConfig.planFor === "couple")
            ? detailedPlan.sessionsCount
            : null,
      };

      const response = await addPlanAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response.message || "Plan created successfully!",
        });

        // Reset form
        setDetailedPlan({
          name: "",
          duration: null,
          originalAmount: "",
          discountedAmount: "",
          discountPercentage: "",
          bonus: null,
          bonusType: "day",
          pause: null,
          pauseType: "day",
          services: [],
          description: "",
          buddyCount: null,
          sessionsCount: null,
        });

        // Navigate back after delay
        setTimeout(() => {
          router.push("/owner/manageplans");
        }, 1500);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to create plan",
        });
      }
    } catch (error) {
      showToast({ type: "error", title: "Failed to create plan" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomServices = () => {
    if (!customServiceInput.trim()) {
      showToast({ type: "error", title: "Please enter service names" });
      return;
    }

    const newServices = customServiceInput
      .split(",")
      .map((service) => service.trim())
      .filter(
        (service) =>
          service.length > 0 && !detailedPlan.services.includes(service),
      );

    if (newServices.length > 0) {
      setDetailedPlan({
        ...detailedPlan,
        services: [...detailedPlan.services, ...newServices],
      });
      setCustomServiceInput("");
      showToast({
        type: "success",
        title: `${newServices.length} service${
          newServices.length > 1 ? "s" : ""
        } added`,
      });
    } else {
      showToast({ type: "info", title: "Services already added or invalid" });
    }
  };

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/owner/manageplans" enabled={true} />
      <NewOwnerHeader
        text="Add New Plan"
        onBackButtonPress={() => router.push("/owner/manageplans")}
      />

      {/* Main Tabs - Quick Setup vs Detailed */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={styles.mainTab}
          onPress={() => setActiveMainTab("quick")}
        >
          {activeMainTab === "quick" ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTabGradient}
            >
              <Text style={styles.mainTabTextActive}>Quick Setup</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTabButton}>
              <Text style={styles.mainTabText}>Quick Setup</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainTab}
          onPress={() => setActiveMainTab("detailed")}
        >
          {activeMainTab === "detailed" ? (
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTabGradient}
            >
              <Text style={styles.mainTabTextActive}>Detailed Addition</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTabButton}>
              <Text style={styles.mainTabText}>Detailed Addition</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Plan Category Tabs */}
      <View style={styles.planTabsContainer}>
        <ScrollView
          ref={planTabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.planTabScrollContent}
        >
          {planSubTabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.planTab,
                planSubTab === tab.id && styles.planTabActive,
              ]}
              onPress={() => {
                setPlanSubTab(tab.id);
                const tabWidth = 120;
                let scrollX = 0;
                if (index === 0) {
                  scrollX = 0;
                } else if (index >= planSubTabs.length - 2) {
                  scrollX = (planSubTabs.length - 3) * tabWidth;
                } else {
                  scrollX = (index - 1) * tabWidth;
                }
                planTabScrollRef.current?.scrollTo({
                  x: Math.max(0, scrollX),
                  animated: true,
                });
              }}
            >
              <Text
                style={[
                  styles.planTabText,
                  planSubTab === tab.id && styles.planTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.paginationDots}>
          {planSubTabs.map((tab) => (
            <View
              key={tab.id}
              style={[
                styles.paginationDot,
                planSubTab === tab.id && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content based on active main tab */}
      {activeMainTab === "quick" ? (
        <>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          >
            {/* Buddy Count Selection (for buddy plans only) */}
            {getCurrentPlanConfig().planFor === "buddy" && (
              <View style={styles.buddyCountSection}>
                <CustomDropdown
                  label="Number of Members in Buddy Plan"
                  value={detailedPlan.buddyCount}
                  onChange={(option) =>
                    setDetailedPlan({
                      ...detailedPlan,
                      buddyCount: option.value,
                    })
                  }
                  options={BUDDY_COUNT_OPTIONS}
                  placeholder="Select number of members (2-15)"
                />
              </View>
            )}

            {/* Sessions Count Selection (for Individual PT and Couple PT only) */}
            {getCurrentPlanConfig().pt &&
              (getCurrentPlanConfig().planFor === "individual" ||
                getCurrentPlanConfig().planFor === "couple") && (
                <View style={styles.buddyCountSection}>
                  <CustomDropdown
                    label="Number of Sessions per Month (Optional)"
                    value={detailedPlan.sessionsCount}
                    onChange={(option) =>
                      setDetailedPlan({
                        ...detailedPlan,
                        sessionsCount: option.value,
                      })
                    }
                    options={SESSIONS_COUNT_OPTIONS}
                    placeholder="Select sessions per month"
                  />
                </View>
              )}

            {/* Quick Plans Table */}
            <View style={styles.quickPlansSection}>
              <View style={styles.quickPlanHeader}>
                <Text style={[styles.quickPlanHeaderText, { width: "36%" }]}>
                  Plan Name
                </Text>
                <Text style={[styles.quickPlanHeaderText, { width: "33%" }]}>
                  Duration
                </Text>
                <Text style={[styles.quickPlanHeaderText, { width: "25%" }]}>
                  Amount
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {quickPlans[planSubTab].map((plan, index) => (
                <View
                  key={index}
                  style={[styles.quickPlanRow, { position: "relative" }]}
                >
                  <TextInput
                    style={[styles.quickPlanInput, { width: "35%" }]}
                    placeholder="Plan Name"
                    placeholderTextColor="#CBD5E0"
                    value={plan.name}
                    onChangeText={(text) =>
                      updateQuickPlanName(planSubTab, index, text)
                    }
                  />

                  <View style={styles.durationDropdownWrapper}>
                    <CustomDropdown
                      value={plan.duration}
                      onChange={(option) =>
                        updateQuickPlanDuration(planSubTab, index, option.value)
                      }
                      options={DURATION_OPTIONS}
                      placeholder="Select"
                      small={true}
                    />
                  </View>

                  <TextInput
                    style={[styles.quickPlanInput, { width: "25%" }]}
                    placeholder="₹0"
                    placeholderTextColor="#CBD5E0"
                    keyboardType="numeric"
                    value={plan.amount}
                    onChangeText={(text) =>
                      updateQuickPlanAmount(planSubTab, index, text)
                    }
                  />

                  {index >= 4 && (
                    <TouchableOpacity
                      onPress={() => removeQuickPlanRow(planSubTab, index)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        zIndex: 10,
                        backgroundColor: "#FF3B30",
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addRowButton}
                onPress={() => addQuickPlanRow(planSubTab)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#0078FF" />
                <Text style={styles.addRowButtonText}>Add Custom Plan</Text>
              </TouchableOpacity>
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsSectionTitle}>
                💡 Tips to Boost Membership
              </Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Add <Text style={styles.tipHighlight}>bonus days</Text> like
                  "+7 days free" on 3-month plans
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Offer <Text style={styles.tipHighlight}>pause option</Text>{" "}
                  (e.g., "15 days pause allowed")
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Price longer plans lower per month to encourage commitment
                </Text>
              </View>
              <Text style={styles.tipsNote}>
                Use "Detailed Addition" tab for bonus, pause & discount options
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View
            style={[
              styles.bottomButtonContainer,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handleQuickSetupSave}
              disabled={isSubmitting}
            >
              <Ionicons name="eye-outline" size={20} color="#0078FF" />
              <Text style={styles.previewButtonText}>Preview & Save</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Detailed Addition Form */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          >
            <View style={styles.detailedFormContainer}>
              {/* Buddy Count (for buddy plans only) */}
              {getCurrentPlanConfig().planFor === "buddy" && (
                <CustomDropdown
                  label="Number of Members"
                  value={detailedPlan.buddyCount}
                  onChange={(option) =>
                    setDetailedPlan({
                      ...detailedPlan,
                      buddyCount: option.value,
                    })
                  }
                  options={BUDDY_COUNT_OPTIONS}
                  placeholder="Select number of members (2-15)"
                />
              )}

              {/* Sessions Count (for Individual PT and Couple PT only) */}
              {getCurrentPlanConfig().pt &&
                (getCurrentPlanConfig().planFor === "individual" ||
                  getCurrentPlanConfig().planFor === "couple") && (
                  <CustomDropdown
                    label="Number of Sessions per Month (Optional)"
                    value={detailedPlan.sessionsCount}
                    onChange={(option) =>
                      setDetailedPlan({
                        ...detailedPlan,
                        sessionsCount: option.value,
                      })
                    }
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
                  value={detailedPlan.name}
                  onChangeText={(text) =>
                    setDetailedPlan({ ...detailedPlan, name: text })
                  }
                />
              </View>

              {/* Duration */}
              <CustomDropdown
                label="Plan Duration"
                value={detailedPlan.duration}
                onChange={(option) =>
                  setDetailedPlan({ ...detailedPlan, duration: option.value })
                }
                options={DURATION_OPTIONS}
                placeholder="Select plan duration"
              />

              {/* Bonus/Offer Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Bonus/Offer Duration{" "}
                  <Text style={styles.optionalText}>(Optional)</Text>
                </Text>

                <View style={styles.bonusTypeRadioContainer}>
                  <TouchableOpacity
                    style={styles.bonusTypeRadioOption}
                    onPress={() =>
                      setDetailedPlan({
                        ...detailedPlan,
                        bonusType: "day",
                        bonus: null,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {detailedPlan.bonusType === "day" ? (
                        <View style={styles.radioSelected} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bonusTypeRadioOption}
                    onPress={() =>
                      setDetailedPlan({
                        ...detailedPlan,
                        bonusType: "month",
                        bonus: null,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {detailedPlan.bonusType === "month" ? (
                        <View style={styles.radioSelected} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Months</Text>
                  </TouchableOpacity>
                </View>

                <CustomDropdown
                  value={detailedPlan.bonus}
                  onChange={(option) =>
                    setDetailedPlan({ ...detailedPlan, bonus: option.value })
                  }
                  options={
                    detailedPlan.bonusType === "day"
                      ? BONUS_DAY_OPTIONS
                      : BONUS_MONTH_OPTIONS
                  }
                  placeholder={`Select bonus duration in ${
                    detailedPlan.bonusType === "day" ? "days" : "months"
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

                <View style={styles.bonusTypeRadioContainer}>
                  <TouchableOpacity
                    style={styles.bonusTypeRadioOption}
                    onPress={() =>
                      setDetailedPlan({
                        ...detailedPlan,
                        pauseType: "day",
                        pause: null,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {detailedPlan.pauseType === "day" ? (
                        <View style={styles.radioSelected} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bonusTypeRadioOption}
                    onPress={() =>
                      setDetailedPlan({
                        ...detailedPlan,
                        pauseType: "month",
                        pause: null,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {detailedPlan.pauseType === "month" ? (
                        <View style={styles.radioSelected} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Months</Text>
                  </TouchableOpacity>
                </View>

                <CustomDropdown
                  value={detailedPlan.pause}
                  onChange={(option) =>
                    setDetailedPlan({ ...detailedPlan, pause: option.value })
                  }
                  options={
                    detailedPlan.pauseType === "day"
                      ? PAUSE_DAY_OPTIONS
                      : PAUSE_MONTH_OPTIONS
                  }
                  placeholder={`Select pause duration in ${
                    detailedPlan.pauseType === "day" ? "days" : "months"
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
                      value={detailedPlan.originalAmount}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9.]/g, "");
                        const parts = numericText.split(".");
                        const validText =
                          parts.length > 2
                            ? parts[0] + "." + parts.slice(1).join("")
                            : numericText;
                        setDetailedPlan({
                          ...detailedPlan,
                          originalAmount: validText,
                        });
                      }}
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
                      value={detailedPlan.discountPercentage}
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
                          detailedPlan.originalAmount &&
                          validText &&
                          !isNaN(parseFloat(validText))
                        ) {
                          const original = parseFloat(
                            detailedPlan.originalAmount,
                          );
                          const discount = parseFloat(validText);
                          newDiscountedAmount = (
                            original -
                            (original * discount) / 100
                          ).toFixed(2);
                        }

                        setDetailedPlan({
                          ...detailedPlan,
                          discountPercentage: validText,
                          discountedAmount: newDiscountedAmount,
                        });
                      }}
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
                    styles.finalAmountInput,
                    detailedPlan.originalAmount &&
                      detailedPlan.discountedAmount &&
                      parseFloat(detailedPlan.discountedAmount) >
                        parseFloat(detailedPlan.originalAmount) &&
                      styles.errorBorder,
                  ]}
                  placeholder="Auto-calculated or enter manually"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={detailedPlan.discountedAmount}
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
                      detailedPlan.originalAmount &&
                      validText &&
                      !isNaN(parseFloat(validText))
                    ) {
                      const original = parseFloat(detailedPlan.originalAmount);
                      const discounted = parseFloat(validText);
                      if (discounted < original) {
                        newDiscountPercentage = (
                          ((original - discounted) / original) *
                          100
                        ).toFixed(2);
                      }
                    }

                    setDetailedPlan({
                      ...detailedPlan,
                      discountedAmount: validText,
                      discountPercentage: newDiscountPercentage,
                    });
                  }}
                />

                {detailedPlan.originalAmount &&
                detailedPlan.discountedAmount &&
                parseFloat(detailedPlan.discountedAmount) >
                  parseFloat(detailedPlan.originalAmount) ? (
                  <View style={styles.errorDisplayContainer}>
                    <Icon name="alert-circle" size={16} color="#E53E3E" />
                    <Text style={styles.errorDisplayText}>
                      Final amount cannot be more than original amount
                    </Text>
                  </View>
                ) : null}

                {detailedPlan.originalAmount &&
                detailedPlan.discountedAmount &&
                parseFloat(detailedPlan.discountedAmount) <
                  parseFloat(detailedPlan.originalAmount) ? (
                  <View style={styles.priceDisplayContainer}>
                    <View style={styles.priceDisplayRow}>
                      <Text style={styles.strikethroughPrice}>
                        ₹{parseFloat(detailedPlan.originalAmount).toFixed(2)}
                      </Text>
                      <Icon
                        name="arrow-right"
                        size={16}
                        color="#48BB78"
                        style={styles.arrowIcon}
                      />
                      <Text style={styles.discountedPrice}>
                        ₹{parseFloat(detailedPlan.discountedAmount).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.savingsBadge}>
                      <Icon name="tag" size={12} color="#38A169" />
                      <Text style={styles.savingsText}>
                        Save ₹
                        {(
                          parseFloat(detailedPlan.originalAmount) -
                          parseFloat(detailedPlan.discountedAmount)
                        ).toFixed(2)}{" "}
                        (
                        {(
                          ((parseFloat(detailedPlan.originalAmount) -
                            parseFloat(detailedPlan.discountedAmount)) /
                            parseFloat(detailedPlan.originalAmount)) *
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
                    {detailedPlan.services.length > 0
                      ? `${detailedPlan.services.length} service${
                          detailedPlan.services.length > 1 ? "s" : ""
                        } selected`
                      : "Select services"}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#4A5568" />
                </TouchableOpacity>

                {detailedPlan.services.length > 0 ? (
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
                      {detailedPlan.services.map((service) => (
                        <TouchableOpacity
                          key={service}
                          style={styles.serviceTag}
                          onPress={() => {
                            setDetailedPlan({
                              ...detailedPlan,
                              services: detailedPlan.services.filter(
                                (s) => s !== service,
                              ),
                            });
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.serviceTagText} numberOfLines={1}>
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
              <View style={[styles.inputGroup, { marginBottom: 180 }]}>
                <Text style={styles.inputLabel}>
                  Terms & Conditions (Optional)
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  placeholderTextColor="#aaa"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={detailedPlan.description}
                  onChangeText={(text) =>
                    setDetailedPlan({ ...detailedPlan, description: text })
                  }
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Save Button for Detailed */}
          <View
            style={[
              styles.bottomButtonContainer,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleDetailedPlanSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Create Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.previewModalContainer}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Preview Plans</Text>
              <TouchableOpacity
                onPress={() => setShowPreviewModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewModalBody}>
              <Text style={styles.previewSectionTitle}>
                Plans to be created ({getFilledQuickPlans().length} total):
              </Text>

              {getFilledQuickPlans().map((plan, index) => (
                <View key={index} style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <Text style={styles.previewCardTitle}>
                      {plan.plan_name}
                    </Text>
                    <View style={styles.previewCardBadge}>
                      <Text style={styles.previewCardBadgeText}>
                        {plan.category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewCardRow}>
                    <Icon name="calendar" size={16} color="#666" />
                    <Text style={styles.previewCardText}>
                      Duration: {plan.duration}{" "}
                      {plan.duration === 1 ? "Month" : "Months"}
                    </Text>
                  </View>

                  <View style={styles.previewCardRow}>
                    <Icon name="currency-inr" size={16} color="#666" />
                    <Text style={styles.previewCardText}>
                      Amount: ₹{plan.amount}
                    </Text>
                  </View>

                  {plan.buddy_count && (
                    <View style={styles.previewCardRow}>
                      <Icon name="account-group" size={16} color="#666" />
                      <Text style={styles.previewCardText}>
                        Members: {plan.buddy_count}
                      </Text>
                    </View>
                  )}

                  {plan.sessions_count && (
                    <View style={styles.previewCardRow}>
                      <Icon name="calendar-clock" size={16} color="#666" />
                      <Text style={styles.previewCardText}>
                        Sessions: {plan.sessions_count}/Month
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.previewModalFooter}>
              <TouchableOpacity
                style={styles.previewCancelButton}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.previewCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.previewConfirmButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={confirmQuickSetupSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.previewConfirmButtonText}>
                    Create {getFilledQuickPlans().length} Plan
                    {getFilledQuickPlans().length > 1 ? "s" : ""}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                <Text style={styles.addServiceButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                getCurrentPlanConfig().pt
                  ? PERSONAL_TRAINING_SERVICES
                  : MEMBERSHIP_SERVICES
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => {
                    if (detailedPlan.services.includes(item)) {
                      setDetailedPlan({
                        ...detailedPlan,
                        services: detailedPlan.services.filter(
                          (s) => s !== item,
                        ),
                      });
                    } else {
                      setDetailedPlan({
                        ...detailedPlan,
                        services: [...detailedPlan.services, item],
                      });
                    }
                  }}
                >
                  <View style={styles.checkboxContainer}>
                    <Icon
                      name={
                        detailedPlan.services.includes(item)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={20}
                      color={
                        detailedPlan.services.includes(item)
                          ? "#0078FF"
                          : "#CBD5E0"
                      }
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
                onPress={() =>
                  setDetailedPlan({ ...detailedPlan, services: [] })
                }
              >
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setServicesModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>
                  Done ({detailedPlan.services.length})
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
        <View style={styles.infoModalContainer}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="information-circle" size={32} color="#0078FF" />
              <TouchableOpacity
                onPress={() => setPauseInfoVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoModalTitle}>Pause Membership</Text>
            <Text style={styles.infoModalDescription}>
              If this option is given, users can pause their membership for the
              specified duration and resume it one time. This allows members to
              temporarily suspend their membership without losing their
              remaining days.
            </Text>
            <TouchableOpacity
              style={styles.infoModalButton}
              onPress={() => setPauseInfoVisible(false)}
            >
              <Text style={styles.infoModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  mainTabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
  },
  mainTab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  mainTabText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  mainTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  planTabsContainer: {
    paddingVertical: 8,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  planTabScrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  planTab: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  planTabActive: {
    backgroundColor: "#E8F4FD",
    borderColor: "#007BFF",
    borderWidth: 2,
  },
  planTabText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  planTabTextActive: {
    color: "#007BFF",
    fontWeight: "600",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  paginationDotActive: {
    backgroundColor: "#007BFF",
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#E8F4FD",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#B3D9FF",
    gap: 10,
  },
  infoBannerTextContainer: {
    flex: 1,
  },
  infoBannerText: {
    fontSize: 13,
    color: "#2D3748",
    lineHeight: 18,
  },
  buddyCountSection: {
    marginTop: 10,
    marginBottom: -10,
  },
  quickPlansSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
    marginTop: 10,
  },
  quickPlanHeader: {
    flexDirection: "row",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0",
    marginBottom: 12,
    alignItems: "center",
    marginLeft: 6,
  },
  quickPlanHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
    marginRight: 8,
  },
  quickPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  quickPlanText: {
    fontSize: 14,
    color: "#2D3748",
    marginRight: 8,
  },
  quickPlanInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#2D3748",
    marginRight: 8,
  },
  durationDropdownWrapper: {
    width: "33%",
    marginRight: 4,
    marginBottom: -16,
  },
  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
  },
  addRowButtonText: {
    fontSize: 14,
    color: "#0078FF",
    fontWeight: "600",
  },
  removeRowButton: {
    padding: 4,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tipsSection: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  tipsSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  tipBullet: {
    fontSize: 16,
    color: "#D97706",
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
  },
  tipHighlight: {
    fontWeight: "600",
    color: "#92400E",
  },
  tipsNote: {
    fontSize: 12,
    color: "#92400E",
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FCD34D",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  previewButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#0078FF",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewButtonText: {
    color: "#0078FF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#0078FF",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  detailedFormContainer: {
    paddingVertical: 16,
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
  labelWithInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoIcon: {
    padding: 2,
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
  serviceTagIcon: {
    marginLeft: 4,
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
  closeButton: {
    padding: 4,
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
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addServiceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  previewModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  previewModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  previewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
  },
  previewModalBody: {
    padding: 20,
    maxHeight: 400,
  },
  previewSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    flex: 1,
  },
  previewCardBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewCardBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0078FF",
  },
  previewCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  previewCardText: {
    fontSize: 14,
    color: "#4A5568",
  },
  previewModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    alignItems: "center",
  },
  previewCancelButtonText: {
    color: "#4A5568",
    fontSize: 15,
    fontWeight: "600",
  },
  previewConfirmButton: {
    flex: 2,
    backgroundColor: "#0078FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  previewConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  amountInputContainer: {
    flex: 1,
  },
  discountInputContainer: {
    flex: 1,
  },
  percentageInputWrapper: {
    position: "relative",
    flex: 1,
  },
  percentageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#E8F5E9",
    paddingRight: 32,
  },
  percentageSymbol: {
    position: "absolute",
    right: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
  },
  finalAmountInput: {
    backgroundColor: "#E3F2FD",
  },
});

export default QuickPlanSetup;
