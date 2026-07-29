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

const ClientPageSkeleton = ({ priority = "medium" }) => {
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBox style={styles.menuIcon} pulse={false} />
          <SkeletonBox style={styles.logoText} pulse={false} />
        </View>
        <View style={styles.headerRight}>
          <SkeletonBox style={styles.gymName} pulse={false} />
          <SkeletonBox style={styles.profileImage} pulse={false} />
        </View>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {[1, 2, 3, 4].map((item, index) => (
          <View key={item} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <SkeletonBox
                  style={styles.cardTitle}
                  shimmer={priority === "high"}
                  pulse={priority !== "low"}
                />
                <SkeletonBox
                  style={[styles.cardSubtitle, { width: index % 2 === 0 ? "90%" : "80%" }]}
                  pulse={false}
                />
                <SkeletonBox
                  style={[styles.cardSubtitle2, { width: index % 2 === 0 ? "70%" : "85%" }]}
                  pulse={false}
                />
                <SkeletonBox
                  style={styles.cardButton}
                  pulse={priority !== "low"}
                />
              </View>
              <View style={styles.cardRight}>
                <SkeletonBox
                  style={styles.cardImage}
                  shimmer={priority === "high"}
                  pulse={priority !== "low"}
                />
              </View>
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
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
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
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
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
    width: 140,
    height: 20,
    borderRadius: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gymName: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  // Cards Container
  cardsContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 5,
    gap: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    height: 20,
    width: "70%",
    borderRadius: 4,
    marginBottom: 8,
  },
  cardSubtitle: {
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  cardSubtitle2: {
    height: 14,
    borderRadius: 4,
    marginBottom: 12,
  },
  cardButton: {
    width: 70,
    height: 32,
    borderRadius: 6,
  },
  cardRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
});

export default ClientPageSkeleton;
