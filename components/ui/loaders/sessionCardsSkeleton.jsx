import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";

const SessionCardsSkeleton = () => {
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
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        <SkeletonBox style={styles.card} />
        <SkeletonBox style={styles.card} />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <SkeletonBox style={styles.card} />
        <SkeletonBox style={styles.card} />
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <SkeletonBox style={styles.card} />
        <SkeletonBox style={styles.card} />
      </View>

      {/* Row 4 */}
      <View style={styles.row}>
        <SkeletonBox style={styles.card} />
        <SkeletonBox style={styles.card} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
  },
  skeletonContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E1E9EE",
  },
  card: {
    width: "47%",
    height: 160,
    marginHorizontal: 6,
  },
});

export default SessionCardsSkeleton;
