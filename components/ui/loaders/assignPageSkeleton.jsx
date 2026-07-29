import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

const AssignPageSkeleton = () => {
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dropdowns Section */}
        <View style={styles.section}>
          <SkeletonBox style={styles.labelSkeleton} />
          <SkeletonBox style={styles.dropdownSkeleton} />
        </View>

        <View style={styles.section}>
          <SkeletonBox style={styles.labelSkeleton} />
          <SkeletonBox style={styles.dropdownSkeleton} />
        </View>

        <View style={styles.section}>
          <SkeletonBox style={styles.labelSkeleton} />
          <SkeletonBox style={styles.dropdownSkeleton} />
        </View>

        {/* Search Bar */}
        <SkeletonBox style={styles.searchBarSkeleton} />

        {/* Client List */}
        <View style={styles.clientsSection}>
          <SkeletonBox style={styles.clientsHeaderSkeleton} />
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <View key={item} style={styles.clientCard}>
              <SkeletonBox style={styles.clientAvatarSkeleton} />
              <View style={styles.clientInfo}>
                <SkeletonBox style={styles.clientNameSkeleton} />
                <SkeletonBox style={styles.clientDetailsSkeleton} />
              </View>
              <SkeletonBox style={styles.checkboxSkeleton} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Assign Button */}
      <SkeletonBox style={styles.assignButtonSkeleton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  labelSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  dropdownSkeleton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
  },
  searchBarSkeleton: {
    width: "100%",
    height: 45,
    borderRadius: 10,
    marginBottom: 20,
  },
  clientsSection: {
    marginTop: 10,
  },
  clientsHeaderSkeleton: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 15,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  clientAvatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  clientDetailsSkeleton: {
    width: 90,
    height: 12,
    borderRadius: 4,
  },
  checkboxSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  assignButtonSkeleton: {
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

export default AssignPageSkeleton;
