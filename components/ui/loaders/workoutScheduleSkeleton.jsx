import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

const WorkoutScheduleSkeleton = () => {
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

  const TemplateCardSkeleton = () => (
    <View style={styles.templateCard}>
      <View style={styles.cardContent}>
        <SkeletonBox style={styles.templateTitleSkeleton} />
        <SkeletonBox style={styles.templateDescSkeleton} />
      </View>
      <View style={styles.cardActions}>
        <SkeletonBox style={styles.actionIconSkeleton} />
        <SkeletonBox style={styles.actionIconSkeleton} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <SkeletonBox style={styles.headerSkeleton} />

        {/* Template Cards */}
        <View style={styles.templatesContainer}>
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
        </View>
      </ScrollView>

      {/* Create Template Button */}
      <SkeletonBox style={styles.createButtonSkeleton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 100,
  },
  headerSkeleton: {
    width: 200,
    height: 28,
    borderRadius: 4,
    marginBottom: 20,
    alignSelf: "center",
  },
  templatesContainer: {
    gap: 15,
  },
  templateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  templateTitleSkeleton: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  templateDescSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  createButtonSkeleton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 50,
    borderRadius: 25,
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

export default WorkoutScheduleSkeleton;
