import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const DailyPassSkeleton = ({ priority = "medium" }) => {
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
      {/* Header Spacer */}
      <View style={styles.headerSpacer} />

      {/* Tab Selector Skeleton */}
      <View style={styles.tabContainer}>
        <SkeletonBox style={styles.tab} pulse={priority !== "low"} />
        <SkeletonBox style={styles.tab} pulse={priority !== "low"} />
      </View>

      {/* Search Bar with Date Picker Skeleton */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SkeletonBox style={styles.searchIcon} pulse={false} />
          <SkeletonBox
            style={styles.searchInput}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
        </View>
        <SkeletonBox style={styles.datePicker} pulse={priority !== "low"} />
      </View>

      {/* Monthly Stats Cards Skeleton */}
      <View style={styles.statsContainer}>
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

      {/* Client Cards Skeleton */}
      <View style={styles.clientsContainer}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <View key={item} style={styles.clientCard}>
            <SkeletonBox
              style={styles.clientAvatar}
              pulse={priority !== "low"}
            />

            <View style={styles.clientInfo}>
              <SkeletonBox
                style={[
                  styles.clientName,
                  { width: index % 2 === 0 ? "65%" : "50%" },
                ]}
                pulse={false}
              />

              <View style={styles.clientDetails}>
                <SkeletonBox style={styles.detailIcon} pulse={false} />
                <SkeletonBox style={styles.detailText} pulse={false} />
              </View>
            </View>

            <View style={styles.rightSection}>
              <SkeletonBox style={styles.feeAmount} pulse={priority !== "low"} />
              <SkeletonBox style={styles.statusBadge} pulse={false} />
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerSpacer: {
    height: 70,
    backgroundColor: "#FFFFFF",
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

  // Tab Selector Skeleton
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 4,
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 6,
  },

  // Search Bar Skeleton
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginRight: 8,
  },
  searchIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 20,
    borderRadius: 4,
  },
  datePicker: {
    width: 100,
    height: 48,
    borderRadius: 8,
  },

  // Stats Cards Skeleton
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 4,
    gap: 12,
  },
  statCard: {
    flex: 1,
    height: 80,
    borderRadius: 12,
  },

  // Client Cards Skeleton
  clientsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  clientName: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  clientDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  detailText: {
    width: 90,
    height: 12,
    borderRadius: 4,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 6,
  },
  feeAmount: {
    width: 60,
    height: 18,
    borderRadius: 4,
  },
  statusBadge: {
    width: 50,
    height: 22,
    borderRadius: 11,
  },
});

export default DailyPassSkeleton;
