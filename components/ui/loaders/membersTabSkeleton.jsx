import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ScrollView } from "react-native";

const MembersTabSkeleton = () => {
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
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[1, 2, 3].map((item) => (
          <SkeletonBox key={item} style={styles.filterTab} />
        ))}
      </View>

      {/* Member Cards */}
      {[1, 2, 3, 4, 5].map((item) => (
        <SkeletonBox key={item} style={styles.memberCard} />
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
  memberCard: {
    height: 120,
    marginBottom: 12,
  },
});

export default MembersTabSkeleton;
