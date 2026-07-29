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

const OwnerProfileSkeleton = ({ priority = "medium" }) => {
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
      {/* Header with back button */}
      <View style={styles.header}>
        <SkeletonBox style={styles.backButton} pulse={false} />
        <SkeletonBox style={styles.headerTitle} pulse={false} />
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Image with Profile Picture */}
        <View style={styles.bannerContainer}>
          <SkeletonBox
            style={styles.bannerImage}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />

          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <SkeletonBox
              style={styles.profilePicture}
              shimmer={priority === "high"}
              pulse={priority !== "low"}
            />
            <SkeletonBox style={styles.editIcon} pulse={false} />
          </View>

          {/* Edit Banner Icon */}
          <View style={styles.editBannerIconContainer}>
            <SkeletonBox style={styles.editBannerIcon} pulse={false} />
          </View>
        </View>

        {/* Gym Name */}
        <View style={styles.gymNameContainer}>
          <SkeletonBox
            style={styles.gymName}
            pulse={priority !== "low"}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {[1, 2, 3].map((item) => (
            <SkeletonBox
              key={item}
              style={styles.tab}
              pulse={priority !== "low"}
            />
          ))}
        </View>

        {/* Personal Details Cards */}
        <View style={styles.detailsContainer}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <View key={item} style={styles.detailCard}>
              <SkeletonBox style={styles.detailIcon} pulse={false} />

              <View style={styles.detailTextContainer}>
                <SkeletonBox
                  style={styles.detailLabel}
                  pulse={false}
                />
                <SkeletonBox
                  style={[
                    styles.detailValue,
                    { width: index % 2 === 0 ? "70%" : "85%" },
                  ]}
                  pulse={false}
                />
              </View>
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    width: 80,
    height: 24,
    borderRadius: 4,
  },

  // Banner and Profile
  bannerContainer: {
    position: "relative",
    height: 200,
    backgroundColor: "#FFFFFF",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  profilePictureContainer: {
    position: "absolute",
    bottom: -50,
    alignSelf: "center",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  editBannerIconContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  editBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Gym Name
  gymNameContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  gymName: {
    width: 140,
    height: 24,
    borderRadius: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 4,
  },

  // Details Cards
  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  detailCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    width: 60,
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  detailValue: {
    height: 16,
    borderRadius: 4,
  },
});

export default OwnerProfileSkeleton;
