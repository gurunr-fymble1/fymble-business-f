import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const TrainersSkeleton = () => {
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

  const TrainerCardSkeleton = () => (
    <View style={styles.trainerCard}>
      {/* Header with profile pic, name, options */}
      <View style={styles.cardHeader}>
        <SkeletonBox style={styles.profilePic} />
        <View style={styles.cardHeaderInfo}>
          <SkeletonBox style={styles.nameSkeleton} />
          <SkeletonBox style={styles.experienceSkeleton} />
          <SkeletonBox style={styles.accessBadgeSkeleton} />
        </View>
        <SkeletonBox style={styles.optionsSkeleton} />
      </View>

      {/* Timings title and chips */}
      <SkeletonBox style={styles.timingsTitleSkeleton} />
      <View style={styles.timingsRow}>
        <SkeletonBox style={styles.timingChipSkeleton} />
        <SkeletonBox style={styles.timingChipSkeleton} />
      </View>

      {/* Specializations */}
      <View style={styles.specializationsRow}>
        <SkeletonBox style={styles.specChipSkeleton} />
        <SkeletonBox style={styles.specChipSkeleton} />
        <SkeletonBox style={styles.specChipSmallSkeleton} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TrainerCardSkeleton />
      <TrainerCardSkeleton />
      <TrainerCardSkeleton />
      <TrainerCardSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: width * 0.05,
    paddingTop: 15,
  },
  trainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: width * 0.04,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  experienceSkeleton: {
    width: 100,
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },
  accessBadgeSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 12,
  },
  optionsSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  timingsTitleSkeleton: {
    width: 60,
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  timingsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  timingChipSkeleton: {
    width: 130,
    height: 28,
    borderRadius: 12,
  },
  specializationsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  specChipSkeleton: {
    width: 100,
    height: 26,
    borderRadius: 8,
  },
  specChipSmallSkeleton: {
    width: 80,
    height: 26,
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

export default TrainersSkeleton;
