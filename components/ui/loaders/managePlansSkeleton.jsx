import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const ManagePlansSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  const SkeletonBox = ({ style }) => (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View style={[styles.skeletonContent, { opacity }]} />
    </View>
  );

  const PlanCardSkeleton = () => (
    <View style={styles.planCard}>
      {/* Header with title, badge and menu */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.titleBadgeRow}>
            <SkeletonBox style={styles.titleSkeleton} />
            <SkeletonBox style={styles.badgeSkeleton} />
          </View>
          {/* Duration, Bonus, Pause Row */}
          <View style={styles.infoRow}>
            <SkeletonBox style={styles.infoItemSkeleton} />
            <SkeletonBox style={styles.dotSkeleton} />
            <SkeletonBox style={styles.infoItemSkeleton} />
            <SkeletonBox style={styles.dotSkeleton} />
            <SkeletonBox style={styles.infoItemSkeleton} />
          </View>
        </View>
        <SkeletonBox style={styles.menuSkeleton} />
      </View>

      {/* Pricing Section */}
      <View style={styles.pricingSection}>
        <View style={styles.priceRow}>
          <SkeletonBox style={styles.originalPriceSkeleton} />
          <SkeletonBox style={styles.arrowSkeleton} />
          <SkeletonBox style={styles.finalPriceSkeleton} />
        </View>
        <SkeletonBox style={styles.discountBadgeSkeleton} />
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <SkeletonBox style={styles.servicesTitleSkeleton} />
        <View style={styles.servicesChipsRow}>
          <SkeletonBox style={styles.serviceChipSkeleton} />
          <SkeletonBox style={styles.serviceChipSkeleton} />
          <SkeletonBox style={styles.serviceChipSkeleton} />
        </View>
      </View>

      {/* Description Button */}
      <SkeletonBox style={styles.descriptionButtonSkeleton} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Plan Cards */}
      <View style={styles.cardsContainer}>
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <SkeletonBox style={styles.addButtonSkeleton} />
        <SkeletonBox style={styles.reassignButtonSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  cardsContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  // Header Section
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  titleSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeSkeleton: {
    width: 32,
    height: 18,
    borderRadius: 12,
  },
  menuSkeleton: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  // Info Row (Duration, Bonus, Pause)
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoItemSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
  dotSkeleton: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  // Pricing Section
  pricingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPriceSkeleton: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
  arrowSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  finalPriceSkeleton: {
    width: 70,
    height: 20,
    borderRadius: 4,
  },
  discountBadgeSkeleton: {
    width: 60,
    height: 24,
    borderRadius: 6,
  },
  // Services Section
  servicesSection: {
    marginBottom: 12,
  },
  servicesTitleSkeleton: {
    width: 80,
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  servicesChipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  serviceChipSkeleton: {
    width: 90,
    height: 28,
    borderRadius: 6,
  },
  // Description Button
  descriptionButtonSkeleton: {
    width: 100,
    height: 18,
    borderRadius: 4,
  },
  // Bottom Buttons
  bottomButtons: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  addButtonSkeleton: {
    flex: 3,
    height: 48,
    borderRadius: 8,
  },
  reassignButtonSkeleton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
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
});

export default ManagePlansSkeleton;
