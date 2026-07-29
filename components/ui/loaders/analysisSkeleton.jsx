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

const AnalysisSkeleton = ({ priority = "medium" }) => {
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
  }, [shimmerAnim, pulseAnim, shouldAnimate, shouldUseShimmer, shouldUsePulse, priority]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const opacity = shouldUsePulse
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: priority === "high" ? [0.3, 0.8] : [0.4, 0.7],
      })
    : new Animated.Value(0.5);

  const SkeletonBox = ({ style, shimmer = false, pulse = true }) => {
    const useShimmerForThis = shimmer && shouldUseShimmer;
    const usePulseForThis = pulse && shouldUsePulse;

    if (priority === "low") {
      return (
        <View style={[styles.skeletonBase, style]}>
          <View style={[styles.skeletonContent, styles.staticContent]} />
        </View>
      );
    }

    return (
      <View style={[styles.skeletonBase, style]}>
        <Animated.View
          style={[
            styles.skeletonContent,
            usePulseForThis ? { opacity } : styles.staticContent,
          ]}
        />
        {useShimmerForThis && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              { transform: [{ translateX }] },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.customHeader}>
        <View style={styles.topRow}>
          <View style={styles.companyContainer}>
            <SkeletonBox style={styles.menuIcon} pulse={false} />
            <SkeletonBox style={styles.logoText} pulse={false} />
          </View>
          <View style={styles.profileSection}>
            <SkeletonBox style={styles.gymName} pulse={false} />
            <SkeletonBox style={styles.profileIcon} pulse={priority !== "low"} />
          </View>
        </View>
      </View>

      {/* Tab Selector Skeleton */}
      <View style={styles.tabContainer}>
        {[1, 2, 3].map((item) => (
          <SkeletonBox
            key={item}
            style={styles.tab}
            pulse={priority !== "low"}
          />
        ))}
      </View>

      {/* Content Skeleton */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Section Title */}
        <View style={styles.section}>
          <SkeletonBox
            style={styles.sectionTitle}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />

          {/* Chart Skeleton */}
          <SkeletonBox
            style={styles.chartSkeleton}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <SkeletonBox
            style={styles.statCard}
            pulse={priority !== "low"}
          />
          <SkeletonBox
            style={styles.statCard}
            pulse={priority !== "low"}
          />
        </View>

        {/* Another Chart Section */}
        <View style={styles.section}>
          <SkeletonBox
            style={styles.sectionTitle}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />

          <SkeletonBox
            style={styles.chartSkeleton}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardsContainer}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.infoCard}>
              <SkeletonBox style={styles.infoIcon} pulse={false} />
              <SkeletonBox style={styles.infoTitle} pulse={false} />
              <SkeletonBox style={styles.infoValue} pulse={priority !== "low"} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  skeletonContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E1E9EE",
  },
  staticContent: {
    opacity: 0.5,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    width: 50,
  },

  // Header Skeleton
  customHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  logoText: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gymName: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  // Tab Selector Skeleton
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 6,
  },

  // Content Skeleton
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 16,
  },
  chartSkeleton: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },

  // Stats Cards Skeleton
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    height: 100,
    borderRadius: 12,
  },

  // Info Cards Skeleton
  infoCardsContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoTitle: {
    flex: 1,
    height: 16,
    borderRadius: 4,
  },
  infoValue: {
    width: 60,
    height: 24,
    borderRadius: 4,
  },
});

export default AnalysisSkeleton;
