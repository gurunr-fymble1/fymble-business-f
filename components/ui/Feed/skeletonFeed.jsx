import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);

const SkeletonFeeds = ({
  priority = "medium", // "high", "medium", "low"
  type = "feeds", // "feeds", "offers", "announcements"
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  // Determine animation type based on priority
  const shouldUseShimmer = priority === "high";
  const shouldUsePulse = priority === "high" || priority === "medium";
  const shouldAnimate = isFocused;

  useEffect(() => {
    if (!shouldAnimate) {
      shimmerAnim.stopAnimation();
      pulseAnim.stopAnimation();
      return;
    }

    let shimmerAnimation, pulseAnimation;

    if (shouldUseShimmer) {
      shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
    }

    if (shouldUsePulse) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: priority === "high" ? 800 : 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: priority === "high" ? 800 : 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }

    return () => {
      shimmerAnimation?.stop();
      pulseAnimation?.stop();
    };
  }, [
    shimmerAnim,
    pulseAnim,
    shouldAnimate,
    shouldUseShimmer,
    shouldUsePulse,
    priority,
  ]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const opacity = shouldUsePulse
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: priority === "high" ? [0.3, 0.8] : [0.4, 0.7],
      })
    : new Animated.Value(0.5);

  const SkeletonBox = ({
    style,
    shimmer = false,
    pulse = true,
    gradient = false,
  }) => {
    const useShimmerForThis = shimmer && shouldUseShimmer;
    const usePulseForThis = pulse && shouldUsePulse;

    if (priority === "low") {
      return (
        <View style={[styles.skeletonBase, style]}>
          <View
            style={[
              styles.skeletonContent,
              styles.staticContent,
              gradient && styles.gradientContent,
            ]}
          />
        </View>
      );
    }

    return (
      <View style={[styles.skeletonBase, style]}>
        <Animated.View
          style={[
            styles.skeletonContent,
            usePulseForThis ? { opacity } : styles.staticContent,
            gradient && styles.gradientContent,
          ]}
        />
        {useShimmerForThis && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        )}
      </View>
    );
  };

  // Media Input Component Skeleton
  const renderMediaInputSkeleton = () => (
    <View style={styles.mediaInputContainer}>
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <SkeletonBox
            style={styles.textInputSkeleton}
            shimmer={priority === "high"}
            pulse={priority !== "low"}
          />
          <SkeletonBox style={styles.attachButtonSkeleton} pulse={false} />
        </View>
        <View style={styles.actionButtons}>
          <SkeletonBox style={styles.micButtonSkeleton} pulse={false} />
          <SkeletonBox
            style={styles.sendButtonSkeleton}
            pulse={priority !== "low"}
          />
        </View>
      </View>
    </View>
  );

  // Feeds Skeleton (Social Posts)
  const renderFeedsSkeleton = () => (
    <View style={styles.feedsContainer}>
      {[1, 2, 3].map((item, index) => (
        <View key={item} style={styles.feedPostCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.userInfoContainer}>
              <SkeletonBox
                style={styles.userAvatar}
                pulse={priority !== "low"}
              />
              <View style={styles.userInfo}>
                <SkeletonBox
                  style={[
                    styles.userName,
                    {
                      width: index === 0 ? "60%" : index === 1 ? "75%" : "55%",
                    },
                  ]}
                  pulse={false}
                />
                <SkeletonBox style={styles.timeStamp} pulse={false} />
              </View>
            </View>
            <SkeletonBox style={styles.moreOptionsButton} pulse={false} />
          </View>

          {/* Post Content */}
          {index === 0 ? (
            // Text only post
            <View style={styles.textOnlyPost}>
              <SkeletonBox style={styles.postTextLine1} pulse={false} />
              <SkeletonBox style={styles.postTextLine2} pulse={false} />
              <SkeletonBox style={styles.postTextLine3} pulse={false} />
            </View>
          ) : (
            // Post with media
            <View style={styles.mediaPostContainer}>
              <SkeletonBox
                style={styles.postMediaSkeleton}
                shimmer={priority === "high" && index === 1}
                pulse={priority !== "low"}
              />

              {/* Media Controls/Pagination */}
              <View style={styles.mediaPagination}>
                {[1, 2, 3].map((dot) => (
                  <SkeletonBox
                    key={dot}
                    style={styles.paginationDot}
                    pulse={false}
                  />
                ))}
              </View>

              {/* Caption */}
              <View style={styles.captionContainer}>
                <SkeletonBox style={styles.captionLine} pulse={false} />
              </View>
            </View>
          )}

          {/* Post Actions */}
          <View style={styles.postActions}>
            <View style={styles.leftActions}>
              <SkeletonBox style={styles.likeButton} pulse={false} />
              <SkeletonBox style={styles.likesCount} pulse={false} />
            </View>
            <View style={styles.rightActions}>
              <SkeletonBox style={styles.commentButton} pulse={false} />
              <SkeletonBox style={styles.commentsCount} pulse={false} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderMediaInputSkeleton()}
      <View style={styles.scrollableContent}>{renderFeedsSkeleton()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
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
  staticContent: {
    opacity: 0.5,
  },
  gradientContent: {
    backgroundColor: "#D0D8DD",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    width: 50,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 15,
  },

  // Media Input Skeleton
  mediaInputContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 15,
    marginHorizontal: 15,
    marginTop: 10,
  },
  inputSection: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(29, 160, 242, 0.04)",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E9EE",
  },
  textInputSkeleton: {
    flex: 1,
    height: 40,
    borderRadius: 6,
  },
  attachButtonSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginLeft: 10,
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: 5,
    alignItems: "center",
    gap: 5,
  },
  micButtonSkeleton: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  sendButtonSkeleton: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },

  // Feeds Skeleton
  feedsContainer: {
    flex: 1,
  },
  feedPostCard: {
    backgroundColor: "#ffffff",
    marginBottom: 15,
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    marginRight: responsiveWidth(3),
  },
  userInfo: {
    justifyContent: "center",
    flex: 1,
  },
  userName: {
    height: 16,
    borderRadius: 4,
    marginBottom: 5,
  },
  timeStamp: {
    width: "40%",
    height: 12,
    borderRadius: 4,
  },
  moreOptionsButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  textOnlyPost: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  postTextLine1: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  postTextLine2: {
    width: "85%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  postTextLine3: {
    width: "60%",
    height: 16,
    borderRadius: 4,
  },
  mediaPostContainer: {
    marginBottom: 15,
  },
  postMediaSkeleton: {
    width: "100%",
    height: responsiveHeight(40),
    borderRadius: 10,
    marginBottom: 10,
  },
  mediaPagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  captionContainer: {
    paddingHorizontal: 5,
  },
  captionLine: {
    width: "70%",
    height: 14,
    borderRadius: 4,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeButton: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 8,
  },
  likesCount: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  commentButton: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 8,
  },
  commentsCount: {
    width: 70,
    height: 12,
    borderRadius: 4,
  },
});

export default SkeletonFeeds;
