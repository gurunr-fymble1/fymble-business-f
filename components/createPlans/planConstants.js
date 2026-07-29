// Plan category definitions
export const PLAN_CATEGORIES = [
  { id: "membership", label: "Membership", type: "membership", shortUnit: "Day Pass", unitPlural: "Day Pass" },
  { id: "pt", label: "PT Plans", type: "pt", shortUnit: "PT Session", unitPlural: "PT Sessions" },
  { id: "couple", label: "Couple Plans", type: "couple", shortUnit: "Day Pass", unitPlural: "Day Pass" },
  { id: "buddy", label: "Buddy Plans", type: "buddy", shortUnit: "Day Pass", unitPlural: "Day Pass" },
  { id: "couple_pt", label: "Couple PT", type: "couple_pt", shortUnit: "PT Session", unitPlural: "PT Sessions" },
  { id: "buddy_pt", label: "Buddy PT", type: "buddy_pt", shortUnit: "PT Session", unitPlural: "PT Sessions" },
  { id: "zumba", label: "Zumba", type: "class", shortUnit: "Zumba Class", unitPlural: "Zumba Classes" },
  { id: "yoga", label: "Yoga", type: "class", shortUnit: "Yoga Class", unitPlural: "Yoga Classes" },
  { id: "pilates", label: "Pilates", type: "class", shortUnit: "Pilates Class", unitPlural: "Pilates Classes" },
  { id: "aerobics", label: "Aerobics", type: "class", shortUnit: "Aerobics Class", unitPlural: "Aerobics Classes" },
  { id: "dance", label: "Dance", type: "class", shortUnit: "Dance Class", unitPlural: "Dance Classes" },
  { id: "boxing", label: "Boxing", type: "class", shortUnit: "Boxing Class", unitPlural: "Boxing Classes" },
  { id: "martial_arts", label: "Martial Arts", type: "class", shortUnit: "Martial Arts Class", unitPlural: "Martial Arts Classes" },
  { id: "swimming", label: "Swimming", type: "class", shortUnit: "Swimming Class", unitPlural: "Swimming Classes" },
  { id: "gymnastics", label: "Gymnastics", type: "class", shortUnit: "Gymnastics Class", unitPlural: "Gymnastics Classes" },
];

// Categories that have no daily pass section
export const NO_DAILYPASS_CATEGORIES = ["couple", "buddy", "couple_pt", "buddy_pt"];

// Maps internal category id → API category string
export const INTERNAL_TO_API_KEY = {
  membership: "individual",
  pt: "personal_training",
  aerobics: "aerobic",
  martial_arts: "karate",
};
// Maps API category string → internal id
export const API_TO_INTERNAL_KEY = {
  individual: "membership",
  personal_training: "pt",
  aerobic: "aerobics",
  karate: "martial_arts",
};

// Categories that show PT session packs (instead of daily pass)
export const PT_PACK_CATEGORIES = ["pt"];

// PT category — uses separate /api/v2/business/pt/* APIs (not gym_plans)
export const PT_CATEGORY_ID = "pt";

// Fitness class categories — use sessions APIs instead of gym_plans
export const FITNESS_CLASS_IDS = ["zumba", "yoga", "pilates", "aerobics", "dance", "boxing", "martial_arts", "swimming", "gymnastics"];
export const toApiKey = (internalId) => INTERNAL_TO_API_KEY[internalId] || internalId;
export const toInternalId = (apiKey) => API_TO_INTERNAL_KEY[apiKey] || apiKey;

// Categories that need buddy member count
export const BUDDY_CATEGORIES = ["buddy", "buddy_pt"];

// Categories that need sessions/month input
export const PT_CATEGORIES = ["pt", "couple_pt", "buddy_pt"];

// Plan durations
export const PLAN_DURATIONS = [
  { months: 1, label: "1 Month Plan" },
  { months: 3, label: "3 Months Plan" },
  { months: 6, label: "6 Months Plan" },
  { months: 12, label: "12 Months Plan" },
];

// Top-level tab groups (replaces flat VISIBLE_TABS_COUNT approach)
export const TAB_GROUPS = [
  {
    id: "membership_group",
    label: "Membership",
    icon: "people",
    categoryIds: ["membership", "couple", "buddy"],
  },
  {
    id: "pt_group",
    label: "PT Plans",
    icon: "barbell",
    categoryIds: ["pt"],
  },
  {
    id: "fitness_group",
    label: "Fitness Class",
    icon: "flame",
    categoryIds: ["zumba", "yoga", "pilates", "aerobics", "dance", "boxing", "martial_arts", "swimming", "gymnastics"],
  },
];

// Auto-calculated pricing multipliers (based on 1 month price)
export const getDailyPassPricing = (monthlyPrice, category) => {
  if (!monthlyPrice || monthlyPrice <= 0) return [];

  const isSession = PT_CATEGORIES.includes(category);
  const cat = PLAN_CATEGORIES.find((c) => c.id === category);
  const unit = cat?.shortUnit || "Day Pass";
  const unitPlural = cat?.unitPlural || "Day Pass";

  if (isSession) {
    return [
      {
        label: `1 ${unit}`,
        price: Math.round(monthlyPrice * 0.045),
        extraPercent: 40,
        potentialRevenue: Math.round(monthlyPrice * 0.045 * 30),
        earnMore: Math.round(monthlyPrice * 0.045 * 30 - monthlyPrice),
      },
      {
        label: `7 ${unitPlural}`,
        price: Math.round(monthlyPrice * 0.256),
        extraPercent: 30,
        potentialRevenue: Math.round((monthlyPrice * 0.256 / 7) * 30),
        earnMore: Math.round((monthlyPrice * 0.256 / 7) * 30 - monthlyPrice),
      },
      {
        label: `15 ${unitPlural}`,
        price: Math.round(monthlyPrice * 0.525),
        extraPercent: 20,
        potentialRevenue: Math.round((monthlyPrice * 0.525 / 15) * 30),
        earnMore: Math.round((monthlyPrice * 0.525 / 15) * 30 - monthlyPrice),
      },
    ];
  }

  return [
    {
      label: `1 ${unit}`,
      price: Math.round(monthlyPrice * 0.045),
      extraPercent: 40,
      potentialRevenue: Math.round(monthlyPrice * 0.045 * 30),
      earnMore: Math.round(monthlyPrice * 0.045 * 30 - monthlyPrice),
    },
    {
      label: `7 ${unit}`,
      price: Math.round(monthlyPrice * 0.256),
      extraPercent: 30,
      potentialRevenue: Math.round((monthlyPrice * 0.256 / 7) * 30),
      earnMore: Math.round((monthlyPrice * 0.256 / 7) * 30 - monthlyPrice),
    },
    {
      label: `15 ${unit}`,
      price: Math.round(monthlyPrice * 0.525),
      extraPercent: 20,
      potentialRevenue: Math.round((monthlyPrice * 0.525 / 15) * 30),
      earnMore: Math.round((monthlyPrice * 0.525 / 15) * 30 - monthlyPrice),
    },
  ];
};

// Generate dropdown options
export const generateOptions = (start, end, type) => {
  const options = [];
  for (let i = start; i <= end; i++) {
    options.push({ label: `${i} ${type}${i > 1 ? "s" : ""}`, value: i });
  }
  return options;
};

export const BONUS_DAY_OPTIONS = generateOptions(1, 30, "Day");
export const BONUS_MONTH_OPTIONS = generateOptions(1, 12, "Month");
export const PAUSE_DAY_OPTIONS = generateOptions(1, 30, "Day");
export const PAUSE_MONTH_OPTIONS = generateOptions(1, 12, "Month");

export const BUDDY_COUNT_OPTIONS = [];
for (let i = 2; i <= 15; i++) {
  BUDDY_COUNT_OPTIONS.push({ label: `${i} Members`, value: i });
}

export const SESSIONS_COUNT_OPTIONS = [];
for (let i = 1; i <= 30; i++) {
  SESSIONS_COUNT_OPTIONS.push({
    label: `${i} Session${i > 1 ? "s" : ""}/Month`,
    value: i,
  });
}
