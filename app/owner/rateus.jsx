import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const PLAY_STORE_LINK =
  "https://play.google.com/store/apps/details?id=com.fittbot.fittbot_business";

const APP_STORE_LINK =
  "https://apps.apple.com/in/app/fittbot-business/id6747059115";
const { width, height } = Dimensions.get("window");

const RateNowScreen = ({ navigation }) => {
  const [rating, setRating] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Animation effect when user taps a star
  const animateStar = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRating = (selectedRating) => {
    setRating(selectedRating);
    animateStar();

    // Show thank you message briefly
    setShowThankYou(true);

    // Delay the redirect to Play Store to give time for the animation and "thank you" message
    setTimeout(() => {
      redirectToStore();
    }, 1500);
  };

  const redirectToStore = () => {
    try {
      Linking.openURL(Platform.OS === "ios" ? APP_STORE_LINK : PLAY_STORE_LINK);
    } catch (error) {
      showToast({
        type: "error",
        title: `Error opening ${
          Platform.OS === "ios" ? "App store" : "Play store"
        }`,
      });
    }
  };

  // Render stars for rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRating(i)}
          style={styles.starContainer}
        >
          <Animated.View
            style={{
              transform: [{ scale: rating === i ? scaleAnim : 1 }],
            }}
          >
            <Ionicons
              name={i <= rating ? "star" : "star-outline"}
              size={40}
              color={i <= rating ? "#FFD700" : "#CCCCCC"}
            />
          </Animated.View>
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      {/* App Logo
      <Image
        source={require("../../assets/images/")}
        style={styles.logo}
        resizeMode="contain"
      /> */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.push("/owner/home")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Us</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={[styles.logoContainer]}>
          <Text style={styles.logoText}>
            <Text style={styles.logoFirstPart}>Fymble</Text>

            <Text style={styles.logoSecondPart}>&nbsp;Business</Text>
          </Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Enjoying Fymble Business App?</Text>

        {/* Subheading with motivation */}
        <Text style={styles.subtitle}>
          Your feedback helps us improve your fitness journey. Please take a
          moment to rate your experience.
        </Text>

        {/* Star Rating */}
        <View style={styles.ratingContainer}>{renderStars()}</View>

        {/* Thank You Message (conditionally shown) */}
        {showThankYou && (
          <Animated.View style={styles.thankYouContainer}>
            <Text style={styles.thankYouText}>
              Thank you for your feedback.Please rate us in{" "}
              {Platform.OS === "ios" ? "App store..." : "Play store..."}!
            </Text>
            <Text style={styles.redirectText}>
              Redirecting to{" "}
              {Platform.OS === "ios" ? "App store..." : "Play store..."}
            </Text>
          </Animated.View>
        )}

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push("/owner/home")}
        >
          <Text style={styles.skipText}>Maybe Later</Text>
        </TouchableOpacity>

        {/* Motivation Text */}
        <Text style={styles.motivationText}>
          Your rating encourages us to keep making Fymble Business better for
          your fitness goals.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
    paddingHorizontal: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  starContainer: {
    padding: 8,
  },
  thankYouContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  redirectText: {
    fontSize: 14,
    color: "#666",
  },
  skipButton: {
    marginTop: 30,
    padding: 10,
  },
  skipText: {
    color: "#999",
    fontSize: 16,
  },
  motivationText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  logoText: {
    fontSize: 35,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontWeight: "500",
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#000000",
  },
  logoUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#FF5757",
    borderRadius: 2,
    marginTop: 5,
  },
  tagline: {
    color: "#000000",
    fontSize: 14,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
  },
});

export default RateNowScreen;
