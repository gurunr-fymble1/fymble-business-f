import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);

const AnnouncementsSkeleton = () => {
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

  const AnnouncementCardSkeleton = () => (
    <View style={styles.announcementContainer}>
      <View style={styles.announcementHeader}>
        <SkeletonBox style={styles.priorityIndicatorSkeleton} />
        <SkeletonBox style={styles.iconSkeleton} />
        <View style={styles.headerTextContainer}>
          <SkeletonBox style={styles.titleSkeleton} />
          <View style={styles.dateTimeRow}>
            <SkeletonBox style={styles.dateSkeleton} />
            <SkeletonBox style={styles.timeSkeleton} />
          </View>
        </View>
        <SkeletonBox style={styles.optionsSkeleton} />
      </View>
      <View style={styles.contentContainer}>
        <SkeletonBox style={styles.contentLine1} />
        <SkeletonBox style={styles.contentLine2} />
        <SkeletonBox style={styles.contentLine3} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <SkeletonBox style={styles.addButtonSkeleton} />
          <View style={styles.infoBoxSkeleton}>
            <SkeletonBox style={styles.infoIconSkeleton} />
            <SkeletonBox style={styles.infoTextSkeleton} />
          </View>
        </View>

        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(2),
  },
  headerSection: {
    marginVertical: responsiveHeight(2),
  },
  addButtonSkeleton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBoxSkeleton: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(3),
    padding: responsiveWidth(4),
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  infoTextSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    marginLeft: responsiveWidth(3),
  },
  announcementContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: responsiveWidth(3),
    marginBottom: responsiveHeight(2),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveWidth(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  priorityIndicatorSkeleton: {
    width: responsiveWidth(1),
    height: responsiveHeight(6),
    borderRadius: responsiveWidth(0.5),
    marginRight: responsiveWidth(3),
  },
  iconSkeleton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    marginRight: responsiveWidth(3),
  },
  headerTextContainer: {
    flex: 1,
  },
  titleSkeleton: {
    width: "70%",
    height: 16,
    borderRadius: 4,
    marginBottom: responsiveHeight(0.5),
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateSkeleton: {
    width: 70,
    height: 12,
    borderRadius: 4,
    marginRight: responsiveWidth(3),
  },
  timeSkeleton: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  optionsSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  contentContainer: {
    padding: responsiveWidth(4),
  },
  contentLine1: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  contentLine2: {
    width: "95%",
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  contentLine3: {
    width: "60%",
    height: 14,
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

export default AnnouncementsSkeleton;
