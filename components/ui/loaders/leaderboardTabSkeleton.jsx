import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ScrollView } from "react-native";

const LeaderboardTabSkeleton = () => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Podium */}
      <View style={styles.podiumContainer}>
        <SkeletonBox style={styles.podiumSecond} />
        <SkeletonBox style={styles.podiumFirst} />
        <SkeletonBox style={styles.podiumThird} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <SkeletonBox style={styles.filterTab} />
        <SkeletonBox style={styles.filterTab} />
      </View>

      {/* Leaderboard List */}
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <SkeletonBox key={item} style={styles.leaderboardItem} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
  },
  skeletonContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E1E9EE",
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  podiumFirst: {
    width: 100,
    height: 140,
    borderRadius: 12,
  },
  podiumSecond: {
    width: 90,
    height: 120,
    borderRadius: 12,
  },
  podiumThird: {
    width: 90,
    height: 100,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    height: 40,
    borderRadius: 20,
  },
  leaderboardItem: {
    height: 70,
    marginBottom: 8,
  },
});

export default LeaderboardTabSkeleton;
