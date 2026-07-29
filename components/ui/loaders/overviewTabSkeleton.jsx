import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";

const { width } = Dimensions.get("window");

const OverviewTabSkeleton = ({ priority = "medium" }) => {
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
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Attendance Card */}
      <SkeletonBox style={styles.attendanceCard} />

      {/* Membership Dashboard */}
      <SkeletonBox style={styles.membershipCard} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <SkeletonBox style={styles.statCard} />
        <SkeletonBox style={styles.statCard} />
      </View>

      {/* Chart Card */}
      <SkeletonBox style={styles.chartCard} />

      {/* List Section */}
      <SkeletonBox style={styles.sectionTitle} />
      {[1, 2, 3].map((item) => (
        <SkeletonBox key={item} style={styles.listItem} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
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
  attendanceCard: {
    height: 180,
    marginBottom: 16,
  },
  membershipCard: {
    height: 220,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    height: 100,
  },
  chartCard: {
    height: 200,
    marginBottom: 20,
  },
  sectionTitle: {
    width: 150,
    height: 20,
    marginBottom: 12,
    borderRadius: 4,
  },
  listItem: {
    height: 70,
    marginBottom: 8,
  },
});

export default OverviewTabSkeleton;
