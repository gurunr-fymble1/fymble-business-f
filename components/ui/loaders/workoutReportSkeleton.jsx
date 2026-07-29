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

const WorkoutReportSkeleton = ({ priority = "high" }) => {
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
      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 15 }}>
        {/* Date Header Skeleton */}
        <View style={styles.dateHeaderSkeleton}>
          <View style={styles.dateNavigatorSkeleton}>
            <SkeletonBlock style={styles.iconSkeleton} />
            <SkeletonBlock style={styles.dateTextSkeleton} />
            <SkeletonBlock style={styles.iconSkeleton} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDayStripSkeleton}>
            {[...Array(7)].map((_, index) => (
              <View key={index} style={styles.weekdayButtonSkeleton}>
                <SkeletonBlock style={styles.weekdayCircleSkeleton} />
                <SkeletonBlock style={styles.weekdayLabelSkeleton} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Entry/Exit Container Skeleton */}
        <View style={styles.entryExitContainerSkeleton}>
          <View style={styles.timeCardSkeleton}>
            <SkeletonBlock style={styles.timeImageSkeleton} />
            <SkeletonBlock style={styles.timeTextSkeleton} />
            <SkeletonBlock style={styles.timeLabelSkeleton} />
          </View>

          <View style={styles.durationCardSkeleton}>
            <SkeletonBlock style={styles.durationTextSkeleton} />
          </View>

          <View style={styles.timeCardSkeleton}>
            <SkeletonBlock style={styles.timeImageSkeleton} />
            <SkeletonBlock style={styles.timeTextSkeleton} />
            <SkeletonBlock style={styles.timeLabelSkeleton} />
          </View>
        </View>

        {/* Workout Details Section Skeleton */}
        <View style={styles.workoutDetailsSectionSkeleton}>
          <SkeletonBlock style={styles.sectionTitleSkeleton} />

          {/* Tabs Skeleton */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainerSkeleton}>
            {[...Array(4)].map((_, index) => (
              <SkeletonBlock key={index} style={styles.tabButtonSkeleton} />
            ))}
          </ScrollView>

          {/* Exercise List Skeleton */}
          <View style={styles.exerciseListSkeleton}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.exerciseItemSkeleton}>
                <View style={styles.exerciseHeaderSkeleton}>
                  <View style={styles.exerciseNameContainerSkeleton}>
                    <SkeletonBlock style={styles.exerciseNameSkeleton} />
                    <SkeletonBlock style={styles.setDetailsSkeleton} />
                  </View>
                  <View style={styles.exerciseMetaSkeleton}>
                    <SkeletonBlock style={styles.exerciseCaloriesSkeleton} />
                    <SkeletonBlock style={styles.iconSkeleton} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Progress Section Skeleton */}
        <View style={styles.progressSectionSkeleton}>
          <SkeletonBlock style={styles.sectionTitleSkeleton} />

          <View style={styles.progressStatsContainerSkeleton}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.progressStatSkeleton}>
                <SkeletonBlock style={styles.progressImageSkeleton} />
                <SkeletonBlock style={styles.statValueSkeleton} />
                <SkeletonBlock style={styles.statLabelSkeleton} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: 10,
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

  // Date Header
  dateHeaderSkeleton: {
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  dateNavigatorSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingLeft: 8,
    paddingTop: 10,
    paddingBottom: 16,
  },
  weekdayButtonSkeleton: {
    alignItems: "center",
    marginHorizontal: 7,
  },
  weekdayCircleSkeleton: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },
  weekdayLabelSkeleton: {
    width: 30,
    height: 12,
    borderRadius: 4,
    marginTop: 5,
  },

  // Entry/Exit Container
  entryExitContainerSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  timeCardSkeleton: {
    width: "33%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeImageSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  timeTextSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
    marginBottom: 5,
  },
  timeLabelSkeleton: {
    width: 50,
    height: 12,
    borderRadius: 4,
  },
  durationCardSkeleton: {
    width: "33%",
    padding: 5,
  },
  durationTextSkeleton: {
    width: "100%",
    height: 40,
    borderRadius: 4,
    backgroundColor: "white",
  },

  // Workout Details Section
  workoutDetailsSectionSkeleton: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleSkeleton: {
    width: 140,
    height: 18,
    borderRadius: 4,
    marginBottom: 12,
  },
  tabsContainerSkeleton: {
    marginBottom: 12,
  },
  tabButtonSkeleton: {
    width: 80,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
  },

  // Exercise List
  exerciseListSkeleton: {
    marginTop: 10,
  },
  exerciseItemSkeleton: {
    marginBottom: 12,
    backgroundColor: "rgba(217, 217, 217, 0.25)",
    borderRadius: 8,
    padding: 15,
  },
  exerciseHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseNameContainerSkeleton: {
    flex: 1,
    marginRight: 10,
  },
  exerciseNameSkeleton: {
    width: "80%",
    height: 16,
    borderRadius: 4,
    marginBottom: 5,
  },
  setDetailsSkeleton: {
    width: "60%",
    height: 12,
    borderRadius: 4,
  },
  exerciseMetaSkeleton: {
    alignItems: "flex-end",
  },
  exerciseCaloriesSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },

  // Progress Section
  progressSectionSkeleton: {
    marginBottom: 20,
  },
  progressStatsContainerSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  progressStatSkeleton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 5,
    shadowColor: "rgba(0, 0, 0, 0.50)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressImageSkeleton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },
  statValueSkeleton: {
    width: "70%",
    height: 16,
    borderRadius: 4,
    marginBottom: 5,
  },
  statLabelSkeleton: {
    width: "60%",
    height: 12,
    borderRadius: 4,
  },
});

export default WorkoutReportSkeleton;
