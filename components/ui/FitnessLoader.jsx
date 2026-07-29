import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

const FitnessLoader = ({ padding = 0, page = "default" }) => {
  // Multiple animation values for different effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get screen width for the progress bar
  const screenWidth = Dimensions.get("window").width;

  const gifPath = {};

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Progress bar animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "0deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth * 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Main rotating and pulsing image */}
      {/* <Animated.View
                style={[
                    styles.imageContainer,
                    {
                        transform: [
                            { scale: pulseAnim },
                            { rotate: spin },
                        ],
                    },
                ]}
            > */}
      {/* <Image
                    source={require('../../assets/images/loader.png')}  // Replace with your image path
                    style={styles.image}
                    resizeMode="contain"
                /> */}
      <Image
        source={gifPath[page].url}
        style={{ width: gifPath[page].width, height: gifPath[page].height }}
        contentFit={gifPath[page].fit}
      />
      {/* </Animated.View> */}

      {/* Progress bar */}
      {/* <View style={styles.progressContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: progressWidth,
                        },
                    ]}
                />
            </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  imageContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // Changed from solid color to transparent
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: 80,
    height: 80,
    // Removed tintColor property to show original image colors
  },
  progressContainer: {
    width: "80%",
    height: 3,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginTop: 30,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF4757",
    borderRadius: 4,
  },
  dotsContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#FF4757",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});

export default FitnessLoader;
