import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ScrollView } from "react-native";

const AnalyticsTabSkeleton = () => {
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
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <SkeletonBox style={styles.statCard} />
        <SkeletonBox style={styles.statCard} />
      </View>

      {/* Chart Section */}
      <SkeletonBox style={styles.sectionTitle} />
      <SkeletonBox style={styles.chartCard} />

      {/* Horizontal Cards */}
      <SkeletonBox style={styles.sectionTitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.horizontalCards}>
          {[1, 2, 3].map((item) => (
            <SkeletonBox key={item} style={styles.horizontalCard} />
          ))}
        </View>
      </ScrollView>

      {/* Info Cards */}
      <SkeletonBox style={styles.sectionTitle} />
      {[1, 2, 3].map((item) => (
        <SkeletonBox key={item} style={styles.infoCard} />
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    height: 100,
  },
  sectionTitle: {
    width: 150,
    height: 20,
    marginBottom: 12,
    borderRadius: 4,
  },
  chartCard: {
    height: 220,
    marginBottom: 20,
  },
  horizontalCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  horizontalCard: {
    width: 200,
    height: 140,
  },
  infoCard: {
    height: 80,
    marginBottom: 12,
  },
});

export default AnalyticsTabSkeleton;
