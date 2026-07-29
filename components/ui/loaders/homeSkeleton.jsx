import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = Platform?.OS === "android" ? 20 : 20;

const HomeSkeleton = ({ priority = "medium" }) => {
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
  }, [
    shimmerAnim,
    pulseAnim,
    shouldAnimate,
    shouldUseShimmer,
    shouldUsePulse,
    priority,
  ]);

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
            style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <SkeletonBox style={styles.headerTitle} pulse={false} />
            <SkeletonBox
              style={styles.profileIcon}
              pulse={priority !== "low"}
            />
          </View>

          {/* Tab Headers */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollView}
          >
            <View style={styles.tabsContainer}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <View key={item} style={styles.tabItem}>
                  <SkeletonBox style={styles.tabIcon} pulse={false} />
                  <SkeletonBox style={styles.tabText} pulse={false} />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Content Skeleton */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <SkeletonBox
            style={styles.statCard}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
          <SkeletonBox
            style={styles.statCard}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
        </View>

        {/* Large Info Card */}
        <SkeletonBox
          style={styles.largeCard}
          shimmer={priority === "high"}
          pulse={priority !== "low"}
        />

        {/* Section Title */}
        <SkeletonBox style={styles.sectionTitle} pulse={false} />

        {/* Horizontal Scroll Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {[1, 2, 3].map((item) => (
            <SkeletonBox
              key={item}
              style={styles.horizontalCard}
              pulse={priority !== "low"}
            />
          ))}
        </ScrollView>

        {/* Another Section */}
        <SkeletonBox style={styles.sectionTitle} pulse={false} />

        {/* List Items */}
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.listItem}>
            <SkeletonBox style={styles.listIcon} pulse={false} />
            <View style={styles.listContent}>
              <SkeletonBox style={styles.listTitle} pulse={false} />
              <SkeletonBox style={styles.listSubtitle} pulse={false} />
            </View>
            <SkeletonBox style={styles.listValue} pulse={priority !== "low"} />
          </View>
        ))}

        {/* Chart Section */}
        <SkeletonBox style={styles.sectionTitle} pulse={false} />
        <SkeletonBox
          style={styles.chartCard}
          shimmer={priority === "high"}
          pulse={priority !== "low"}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
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
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#FFFFFF",
  },
  headerContent: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabsScrollView: {
    marginHorizontal: -16,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 24,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  tabText: {
    width: 50,
    height: 12,
    borderRadius: 6,
  },

  // Content Skeleton
  contentContainer: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    height: 100,
    borderRadius: 12,
  },
  largeCard: {
    marginHorizontal: 16,
    height: 140,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    marginHorizontal: 16,
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingLeft: 16,
    marginBottom: 24,
  },
  horizontalCard: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    width: "70%",
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  listSubtitle: {
    width: "50%",
    height: 12,
    borderRadius: 4,
  },
  listValue: {
    width: 60,
    height: 24,
    borderRadius: 4,
  },
  chartCard: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 12,
    marginBottom: 30,
  },
});

export default HomeSkeleton;
