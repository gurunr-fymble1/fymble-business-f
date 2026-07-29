import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ScrollView } from "react-native";

const FinanceTabSkeleton = () => {
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
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SkeletonBox style={styles.summaryCard} />
        <SkeletonBox style={styles.summaryCard} />
      </View>

      {/* Chart Card */}
      <SkeletonBox style={styles.chartCard} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <SkeletonBox style={styles.tab} />
        <SkeletonBox style={styles.tab} />
      </View>

      {/* Transaction List */}
      <SkeletonBox style={styles.sectionTitle} />
      {[1, 2, 3, 4, 5].map((item) => (
        <SkeletonBox key={item} style={styles.transactionItem} />
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
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    height: 120,
  },
  chartCard: {
    height: 200,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 8,
  },
  sectionTitle: {
    width: 150,
    height: 20,
    marginBottom: 12,
    borderRadius: 4,
  },
  transactionItem: {
    height: 70,
    marginBottom: 8,
  },
});

export default FinanceTabSkeleton;
