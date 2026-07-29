import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

const GymOffersSkeleton = () => {
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

  const OfferCardSkeleton = () => (
    <View style={styles.offerCard}>
      <SkeletonBox style={styles.offerImageSkeleton} />
      <View style={styles.offerContent}>
        <SkeletonBox style={styles.offerTitleSkeleton} />
        <SkeletonBox style={styles.offerDescSkeleton} />
        <SkeletonBox style={styles.offerDescShortSkeleton} />
        <View style={styles.offerFooter}>
          <SkeletonBox style={styles.discountBadgeSkeleton} />
          <SkeletonBox style={styles.validityDateSkeleton} />
        </View>
        <View style={styles.actionButtons}>
          <SkeletonBox style={styles.actionButtonSkeleton} />
          <SkeletonBox style={styles.actionButtonSkeleton} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <OfferCardSkeleton />
        <OfferCardSkeleton />
        <OfferCardSkeleton />
        <OfferCardSkeleton />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerImageSkeleton: {
    width: "100%",
    height: 180,
  },
  offerContent: {
    padding: 16,
  },
  offerTitleSkeleton: {
    width: "70%",
    height: 20,
    borderRadius: 4,
    marginBottom: 10,
  },
  offerDescSkeleton: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  offerDescShortSkeleton: {
    width: "80%",
    height: 14,
    borderRadius: 4,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  discountBadgeSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  validityDateSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButtonSkeleton: {
    flex: 1,
    height: 36,
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

export default GymOffersSkeleton;
