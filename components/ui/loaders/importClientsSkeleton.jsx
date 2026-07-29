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

const ImportClientsSkeleton = ({ priority = "medium" }) => {
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
      {/* Search Bar with Filter Skeleton */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SkeletonBox style={styles.searchIcon} pulse={false} />
          <SkeletonBox
            style={styles.searchInput}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
        </View>
        <SkeletonBox style={styles.filterButton} pulse={false} />
      </View>

      {/* Data Table Header Skeleton */}
      <View style={styles.tableHeader}>
        <SkeletonBox style={styles.headerCol1} pulse={false} />
        <SkeletonBox style={styles.headerCol2} pulse={false} />
        <SkeletonBox style={styles.headerCol3} pulse={false} />
      </View>

      {/* Table Rows Skeleton */}
      <View style={styles.tableBody}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
          <View key={item} style={styles.tableRow}>
            <View style={styles.rowCol1}>
              <SkeletonBox style={styles.rowNumber} pulse={false} />
            </View>

            <View style={styles.rowCol2}>
              <SkeletonBox
                style={[
                  styles.clientName,
                  { width: index % 2 === 0 ? "70%" : "55%" },
                ]}
                pulse={false}
              />
              <SkeletonBox
                style={[
                  styles.clientContact,
                  { width: index % 3 === 0 ? "50%" : "60%" },
                ]}
                pulse={false}
              />
            </View>

            <View style={styles.rowCol3}>
              <SkeletonBox
                style={styles.statusBadge}
                pulse={priority !== "low"}
              />
              <SkeletonBox
                style={styles.smsBadge}
                pulse={priority !== "low"}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Pagination Skeleton */}
      <View style={styles.paginationContainer}>
        <SkeletonBox style={styles.paginationInfo} pulse={false} />
        <View style={styles.paginationButtons}>
          <SkeletonBox style={styles.paginationButton} pulse={false} />
          <SkeletonBox style={styles.pageNumber} pulse={false} />
          <SkeletonBox style={styles.paginationButton} pulse={false} />
        </View>
      </View>

      {/* Floating Action Button Skeleton */}
      <View style={styles.floatingActionContainer}>
        <SkeletonBox
          style={styles.floatingActionButton}
          pulse={priority !== "low"}
        />
      </View>
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

  // Search Bar Skeleton
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    marginBottom: 10,
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
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },

  // Table Header Skeleton
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerCol1: {
    flex: 0.6,
    height: 16,
    borderRadius: 4,
  },
  headerCol2: {
    flex: 2,
    height: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  headerCol3: {
    flex: 1,
    height: 16,
    borderRadius: 4,
  },

  // Table Body Skeleton
  tableBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  rowCol1: {
    flex: 0.6,
  },
  rowNumber: {
    width: 30,
    height: 16,
    borderRadius: 4,
  },
  rowCol2: {
    flex: 2,
    paddingHorizontal: 8,
  },
  clientName: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  clientContact: {
    height: 14,
    borderRadius: 4,
  },
  rowCol3: {
    flex: 1,
    gap: 6,
  },
  statusBadge: {
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  smsBadge: {
    height: 24,
    borderRadius: 12,
  },

  // Pagination Skeleton
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  paginationInfo: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  paginationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  pageNumber: {
    width: 40,
    height: 16,
    borderRadius: 4,
  },

  // Floating Action Button Skeleton
  floatingActionContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  floatingActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

export default ImportClientsSkeleton;
