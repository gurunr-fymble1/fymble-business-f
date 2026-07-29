import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const DietReportSkeleton = ({ priority = "high" }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  const shouldUseShimmer = priority === "high";
  const shouldUsePulse = priority === "high" || priority === "medium";
  const shouldAnimate = isFocused;

  useEffect(() => {
    if (!shouldAnimate) {
      shimmerAnim.stopAnimation();
      pulseAnim.stopAnimation();
      return;
    }

    let shimmerAnimation, pulseAnimation;

    if (shouldUseShimmer) {
      shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
    }

    if (shouldUsePulse) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: priority === "high" ? 800 : 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: priority === "high" ? 800 : 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }

    return () => {
      shimmerAnimation?.stop();
      pulseAnimation?.stop();
    };
  }, [shouldAnimate, shouldUseShimmer, shouldUsePulse, shimmerAnim, pulseAnim, priority]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBlock = ({ style, useShimmer = shouldUseShimmer, usePulse = shouldUsePulse }) => (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View
        style={[
          styles.skeletonBase,
          style,
          usePulse && { opacity: pulseOpacity },
        ]}
      />
      {useShimmer && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date Navigator Skeleton */}
        <View style={styles.dateNavigatorSkeleton}>
          <View style={styles.dateHeaderSkeleton}>
            <SkeletonBlock style={styles.iconSkeleton} />
            <SkeletonBlock style={styles.dateTextSkeleton} />
            <SkeletonBlock style={styles.iconSkeleton} />
          </View>

          {/* Week Day Strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDayStripSkeleton}>
            {[...Array(7)].map((_, index) => (
              <View key={index} style={styles.weekdayButtonSkeleton}>
                <SkeletonBlock style={styles.weekdayCircleSkeleton} />
                <SkeletonBlock style={styles.weekdayLabelSkeleton} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Diet Progress Tracker Skeleton */}
        <View style={styles.progressTrackerSkeleton}>
          {/* Title Row */}
          <View style={styles.progressHeaderSkeleton}>
            <SkeletonBlock style={styles.progressTitleSkeleton} />
            <SkeletonBlock style={styles.progressSubtitleSkeleton} />
          </View>

          {/* Progress Circles */}
          <View style={styles.progressCirclesSkeleton}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.progressCircleItemSkeleton}>
                <SkeletonBlock style={styles.circleSkeleton} />
                <SkeletonBlock style={styles.circleValueSkeleton} />
                <SkeletonBlock style={styles.circleLabelSkeleton} />
              </View>
            ))}
          </View>

          {/* Nutrient Bars */}
          <View style={styles.nutrientBarsSkeleton}>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={styles.nutrientBarItemSkeleton}>
                <View style={styles.nutrientBarHeaderSkeleton}>
                  <SkeletonBlock style={styles.nutrientIconSkeleton} />
                  <SkeletonBlock style={styles.nutrientLabelSkeleton} />
                  <SkeletonBlock style={styles.nutrientValueSkeleton} />
                </View>
                <SkeletonBlock style={styles.nutrientBarLineSkeleton} />
              </View>
            ))}
          </View>
        </View>

        {/* Meal Sections Skeleton */}
        {[...Array(4)].map((_, mealIndex) => (
          <View key={mealIndex} style={styles.mealSectionSkeleton}>
            {/* Meal Header */}
            <View style={styles.mealHeaderSkeleton}>
              <View style={styles.mealInfoSkeleton}>
                <SkeletonBlock style={styles.mealTitleSkeleton} />
                <SkeletonBlock style={styles.mealTaglineSkeleton} />
                <SkeletonBlock style={styles.mealTimeSkeleton} />
              </View>
            </View>

            {/* Food Items */}
            <View style={styles.foodSectionSkeleton}>
              {[...Array(2)].map((_, foodIndex) => (
                <View key={foodIndex} style={styles.foodItemCardSkeleton}>
                  {/* Food Header */}
                  <View style={styles.foodItemHeaderSkeleton}>
                    <View style={styles.foodItemLeftSkeleton}>
                      <SkeletonBlock style={styles.foodItemNameSkeleton} />
                      <SkeletonBlock style={styles.foodQuantitySkeleton} />
                    </View>
                    {foodIndex === 0 && (
                      <SkeletonBlock style={styles.expandButtonSkeleton} />
                    )}
                  </View>

                  {/* Food Macros */}
                  <View style={styles.foodMacroRowSkeleton}>
                    {[...Array(6)].map((_, macroIndex) => (
                      <View key={macroIndex} style={styles.foodMacroItemSkeleton}>
                        <SkeletonBlock style={styles.macroIconSkeleton} />
                        <SkeletonBlock style={styles.macroLabelSkeleton} />
                        <SkeletonBlock style={styles.macroValueSkeleton} />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  skeletonBase: {
    backgroundColor: "#E1E9EE",
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },

  // Date Navigator
  dateNavigatorSkeleton: {
    marginTop: 20,
    marginBottom: 15,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dateTextSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  weekDayStripSkeleton: {
    paddingVertical: 8,
  },
  weekdayButtonSkeleton: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  weekdayCircleSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  weekdayLabelSkeleton: {
    width: 30,
    height: 12,
    borderRadius: 4,
  },

  // Progress Tracker
  progressTrackerSkeleton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeaderSkeleton: {
    marginBottom: 16,
  },
  progressTitleSkeleton: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressSubtitleSkeleton: {
    width: 200,
    height: 16,
    borderRadius: 4,
  },
  progressCirclesSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  progressCircleItemSkeleton: {
    alignItems: "center",
  },
  circleSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  circleValueSkeleton: {
    width: 50,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  circleLabelSkeleton: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  nutrientBarsSkeleton: {
    gap: 12,
  },
  nutrientBarItemSkeleton: {
    marginBottom: 8,
  },
  nutrientBarHeaderSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  nutrientIconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  nutrientLabelSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 4,
  },
  nutrientValueSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
  nutrientBarLineSkeleton: {
    height: 8,
    borderRadius: 4,
  },

  // Meal Sections
  mealSectionSkeleton: {
    backgroundColor: "#f8f9fa",
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#eee",
  },
  mealHeaderSkeleton: {
    marginBottom: 12,
  },
  mealInfoSkeleton: {
    gap: 6,
  },
  mealTitleSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  mealTaglineSkeleton: {
    width: 180,
    height: 14,
    borderRadius: 4,
  },
  mealTimeSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },

  // Food Section
  foodSectionSkeleton: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  foodItemCardSkeleton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  foodItemHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  foodItemLeftSkeleton: {
    flex: 1,
    gap: 4,
  },
  foodItemNameSkeleton: {
    width: "70%",
    height: 14,
    borderRadius: 4,
  },
  foodQuantitySkeleton: {
    width: "40%",
    height: 12,
    borderRadius: 4,
  },
  expandButtonSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 4,
  },

  // Food Macros
  foodMacroRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  foodMacroItemSkeleton: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  macroIconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  macroLabelSkeleton: {
    width: 30,
    height: 10,
    borderRadius: 4,
  },
  macroValueSkeleton: {
    width: 24,
    height: 12,
    borderRadius: 4,
  },
});

export default DietReportSkeleton;
