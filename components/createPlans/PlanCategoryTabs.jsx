import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PLAN_CATEGORIES, TAB_GROUPS, FITNESS_CLASS_IDS } from "./planConstants";

const { width: SCREEN_W } = Dimensions.get("window");
const GROUP_COUNT = TAB_GROUPS.length;
const INDICATOR_WIDTH = (SCREEN_W - 32) / GROUP_COUNT;

// ─── Chip (sub-category selector) ────────────────────────────────────────────
const Chip = memo(({ cat, isActive, onPress }) => {
  const isConfigured = cat.configured === true;
  const isUnconfigured = cat.configured === false;
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && styles.chipActive,
        isUnconfigured && !isActive && styles.chipUnconfigured,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isUnconfigured && !isActive && (
        <Ionicons
          name="add"
          size={11}
          color="#9CA3AF"
          style={styles.chipAddIcon}
        />
      )}
      <Text
        style={[
          styles.chipText,
          isActive && styles.chipTextActive,
          isUnconfigured && !isActive && styles.chipTextUnconfigured,
        ]}
      >
        {cat.label}
      </Text>
      {isConfigured && !isActive && <View style={styles.chipDot} />}
    </TouchableOpacity>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
const PlanCategoryTabs = memo(
  ({ activeCategory, onCategoryChange, categories }) => {
    const allCategories = categories || PLAN_CATEGORIES;

    const activeGroupId = useMemo(() => {
      for (const g of TAB_GROUPS) {
        if (g.categoryIds.includes(activeCategory)) return g.id;
      }
      return TAB_GROUPS[0].id;
    }, [activeCategory]);

    const activeGroupIndex = TAB_GROUPS.findIndex(
      (g) => g.id === activeGroupId,
    );
    const indicatorX = useRef(
      new Animated.Value(activeGroupIndex * INDICATOR_WIDTH),
    ).current;

    useEffect(() => {
      Animated.spring(indicatorX, {
        toValue: activeGroupIndex * INDICATOR_WIDTH,
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }).start();
    }, [activeGroupIndex]);

    const handleGroupPress = useCallback(
      (group) => {
        if (group.id === activeGroupId) return;
        // Prefer a category the API returned
        const firstCat =
          group.categoryIds.find((id) => allCategories.find((c) => c.id === id));
        // For non-fitness groups, fall back to first static category
        const fallback = group.id !== "fitness_group" ? group.categoryIds[0] : null;
        const target = firstCat || fallback;
        if (target) onCategoryChange(target);
      },
      [activeGroupId, allCategories, onCategoryChange],
    );

    const groupCategories = useMemo(() => {
      const group = TAB_GROUPS.find((g) => g.id === activeGroupId);
      if (!group) return [];
      return group.categoryIds.map((id) => {
        const fromApi = allCategories.find((c) => c.id === id);
        // For fitness classes, only show if returned by catalog API
        if (FITNESS_CLASS_IDS.includes(id)) return fromApi || null;
        // For non-fitness, fall back to static config
        return fromApi || PLAN_CATEGORIES.find((c) => c.id === id);
      }).filter(Boolean);
    }, [activeGroupId, allCategories]);

    // Only show chip row when there are multiple sub-categories
    const showChips = groupCategories.length > 1;

    return (
      <View style={styles.container}>
        {/* ── Segment bar ── */}
        <View style={styles.segmentBar}>
          {TAB_GROUPS.map((group, idx) => {
            const isActive = group.id === activeGroupId;
            return (
              <TouchableOpacity
                key={group.id}
                style={styles.segment}
                onPress={() => handleGroupPress(group)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {group.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Sliding underline */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: INDICATOR_WIDTH - 24,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        </View>

        {/* ── Chip strip (sub-categories) ── */}
        {showChips && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {groupCategories.map((cat) => (
              <Chip
                key={cat.id}
                cat={cat}
                isActive={activeCategory === cat.id}
                onPress={() => onCategoryChange(cat.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  // ── Segment bar ──
  segmentBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    position: "relative",
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    paddingBottom: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  segmentTextActive: {
    color: "#1A1A2E",
    fontWeight: "700",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#FF5757",
  },

  // ── Chip strip ──
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 7,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: "#F4F4F8",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
  chipUnconfigured: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  chipAddIcon: {
    marginRight: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A5568",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipTextUnconfigured: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#38A169",
    marginLeft: 5,
  },
});

export default PlanCategoryTabs;
