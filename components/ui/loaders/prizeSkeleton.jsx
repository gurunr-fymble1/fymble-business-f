import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

const PrizeSkeleton = () => {
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

  const PrizeCardSkeleton = () => (
    <View style={styles.prizeCard}>
      <SkeletonBox style={styles.avatarSkeleton} />
      <View style={styles.cardContent}>
        <SkeletonBox style={styles.nameSkeleton} />
        <SkeletonBox style={styles.pointsSkeleton} />
        <SkeletonBox style={styles.giftSkeleton} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Prize Cards - Two per row */}
        <View style={styles.row}>
          <PrizeCardSkeleton />
          <PrizeCardSkeleton />
        </View>
        <View style={styles.row}>
          <PrizeCardSkeleton />
          <PrizeCardSkeleton />
        </View>
        <View style={styles.row}>
          <PrizeCardSkeleton />
          <PrizeCardSkeleton />
        </View>
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
    padding: 15,
    paddingTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  prizeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    width: (width - 42) / 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  cardContent: {
    width: "100%",
    alignItems: "center",
  },
  nameSkeleton: {
    width: "80%",
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  pointsSkeleton: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  giftSkeleton: {
    width: "70%",
    height: 12,
    borderRadius: 4,
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

export default PrizeSkeleton;
