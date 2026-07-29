import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  Linking,
  BackHandler,
  ToastAndroid,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { loginAPI } from "../services/Api";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { getToken, saveToken, logout } from "../utils/auth";
import axios from "axios";
import apiConfig from "../services/apiConfig";
import WelcomeScreen from "../components/ui/WelcomeScreen";
import { showToast } from "../utils/Toaster";
import { useFocusEffect } from "@react-navigation/native";
import HomeSkeleton from "../components/ui/loaders/homeSkeleton";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const Login = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState("owner");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const baseURL = apiConfig.API_URL;
  const shakeAnimation = new Animated.Value(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  // BackHandler state refs
  const backPressCount = React.useRef(0);
  const backPressTimer = React.useRef(null);

  // Handle hardware back button - "Press again to exit"
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const currentTime = Date.now();

        // Reset counter if more than 2 seconds have passed
        if (
          backPressCount.current === 0 ||
          currentTime - (backPressTimer.current || 0) > 2000
        ) {
          backPressCount.current = 1;
          backPressTimer.current = currentTime;

          // Show toast message
          if (Platform.OS === "android") {
            ToastAndroid.show("Press again to exit", ToastAndroid.SHORT);
          }

          return true; // Prevent default back behavior
        } else {
          // Second press within 2 seconds - exit app
          backPressCount.current = 0;
          BackHandler.exitApp();
          return true;
        }
      }
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const WELCOME_SCREEN_VIEWED_KEY = "welcome_screen_viewed";

  const checkWelcomeStatus = async () => {
    try {
      const value = await getToken(WELCOME_SCREEN_VIEWED_KEY);
      if (value === "true") {
        setShowWelcome(false);
      } else {
        setShowWelcome(true);
      }
    } catch (error) {
      setShowWelcome(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const delayedCheck = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        checkAuthentication();
      };
      delayedCheck();
    }, []),
  );

  useEffect(() => {
    logoOpacity.setValue(0);
    logoTranslateY.setValue(-20);

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Reset form when role changes
  useEffect(() => {
    setMobileNumber("");
  }, [role]);

  // Handle owner mobile number change - just update state
  const handleOwnerMobileChange = (text) => {
    setMobileNumber(text);
  };

  const checkAuthentication = async () => {
    try {
      setInitializing(true);
      const accessToken = await getToken("access_token");
      const ownerId = await getToken("owner_id");
      const trainerId = await getToken("trainer_id");
      const userRole = await getToken("role");

      // If no access token, user is not authenticated - stay on login
      if (!accessToken) {
        setInitializing(false);
        return;
      }

      try {
        // Try to verify the token with the backend
        const response = await axios.get(`${baseURL}/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200) {
          router.replace("/owner/(tabs)/home");
          return;
        }
      } catch (error) {
        // Token verification failed, try to refresh
        const userId = userRole === "trainer" ? trainerId : ownerId;
        if (userId) {
          try {
            const refreshResponse = await axios.post(
              `${baseURL}/auth/refresh`,
              {
                id: userId,
                role: userRole,
              },
            );

            if (refreshResponse?.status === 200) {
              await saveToken(
                "access_token",
                refreshResponse.data.access_token,
              );
              router.replace("/owner/(tabs)/home");
              return;
            } else {
              await clearTokens();
            }
          } catch (refreshError) {
            await clearTokens();
          }
        } else {
          await clearTokens();
        }
      }
      setInitializing(false);
    } catch (error) {
      await clearTokens();
      setInitializing(false);
    }
  };

  const clearTokens = async () => {
    try {
      // Use the comprehensive logout function
      await logout();
      setInitializing(false);
    } catch (error) {
      setInitializing(false);
    }
  };

  // Handle trainer mobile number change
  const handleMobileChange = (text) => {
    setMobileNumber(text);
  };

  const login = async () => {
    if (role === "owner") {
      if (!mobileNumber) {
        shakeInputs();
        return;
      }

      setIsLoading(true);
      const payload = {
        mobile_number: mobileNumber,
        role: role,
      };

      try {
        const response = await loginAPI(payload);
        if (response?.status === 200) {
          router.push({
            pathname: "/owner/OtpVerification",
            params: { mobile: mobileNumber, role: "owner" },
          });
        } else if (response?.status === 201) {
          router.push({
            pathname: "/verificationowner",
            params: {
              verification: JSON.stringify(response?.data?.verification),
              email: response?.data?.email,
              contact: response?.data?.contact,
              id: response?.data?.id,
            },
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Something went wrong",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (role === "trainer") {
      if (!mobileNumber) {
        shakeInputs();
        return;
      }

      setIsLoading(true);
      const payload = {
        mobile_number: mobileNumber,
        role: "trainer",
      };

      try {
        const response = await loginAPI(payload);

        if (response?.status === 200) {
          router.push({
            pathname: "/owner/OtpVerification",
            params: { mobile: mobileNumber, role: "trainer" },
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Something went wrong",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (initializing) {
    return <HomeSkeleton priority="high" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {showWelcome ? (
        <WelcomeScreen setShowWelcome={setShowWelcome} />
      ) : (
        <View style={styles.background}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Animated.View
              style={{
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }],
              }}
            >
              <Text style={styles.logoText}>
                <Text style={styles.logoFirst}>Fymble</Text>
                <Text style={styles.logoSecond}> Business</Text>
              </Text>
            </Animated.View>
          </View>

          {/* Main Card */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={200}
              style={styles.card}
            >
              {/* Role Toggle */}
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "owner" && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole("owner")}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={role === "owner" ? "#FF5757" : "#999"}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === "owner" && styles.roleButtonTextActive,
                    ]}
                  >
                    Owner
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "trainer" && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole("trainer")}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={20}
                    color={role === "trainer" ? "#FF5757" : "#999"}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === "trainer" && styles.roleButtonTextActive,
                    ]}
                  >
                    Trainer
                  </Text>
                </TouchableOpacity>
              </View>

              <Animated.View
                style={[
                  styles.formSection,
                  { transform: [{ translateX: shakeAnimation }] },
                ]}
              >
                <Text style={styles.title}>
                  {role === "owner" ? "Welcome!" : "Hello Trainer!"}
                </Text>
                <Text style={styles.subtitle}>
                  Enter your mobile number to continue
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#AAA"
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={
                      role === "owner"
                        ? handleOwnerMobileChange
                        : handleMobileChange
                    }
                    maxLength={10}
                  />
                  {mobileNumber.length === 10 && (
                    <Animatable.View
                      animation="zoomIn"
                      duration={300}
                      style={styles.checkWrapper}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    </Animatable.View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    (!mobileNumber ||
                      mobileNumber.length !== 10 ||
                      isLoading) &&
                      styles.continueBtnDisabled,
                  ]}
                  onPress={login}
                  disabled={
                    isLoading || !mobileNumber || mobileNumber.length !== 10
                  }
                >
                  {isLoading ? (
                    <Animatable.View
                      animation="rotate"
                      easing="linear"
                      duration={1000}
                      iterationCount="infinite"
                    >
                      <Ionicons name="reload" size={24} color="#FFF" />
                    </Animatable.View>
                  ) : (
                    <Text style={styles.continueBtnText}>Get OTP</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.terms}>
                  <Text style={styles.termsText}>
                    By continuing, you agree to our{" "}
                  </Text>
                  <Text style={styles.termsText}>
                    <Text
                      style={styles.termsLink}
                      onPress={() =>
                        Linking.openURL(
                          "https://fymble.app/terms-and-conditions/",
                        )
                      }
                    >
                      Terms
                    </Text>{" "}
                    &{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() =>
                        Linking.openURL("https://fymble.app/privacy-policy/")
                      }
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </Animated.View>
            </Animatable.View>
          </ScrollView>

          {/* Footer */}
          {!keyboardVisible && (
            <View style={styles.footer}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>
                © 2025 NFCTech Fitness Pvt Ltd
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  background: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    alignItems: "center",
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 30,
  },
  logoFirst: {
    color: "#FF5757",
  },
  logoSecond: {
    color: "#1A1A1A",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    paddingHorizontal: 16,
  },
  roleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  roleButtonTextActive: {
    color: "#FF5757",
  },
  formSection: {
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 28,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    marginBottom: 20,
  },
  countryCode: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    padding: 0,
  },
  checkWrapper: {
    marginLeft: 8,
  },
  continueBtn: {
    backgroundColor: "#FF5757",
    borderRadius: 8,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  terms: {
    marginTop: 24,
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#FF5757",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF5757",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: "#CCC",
  },
});

export default Login;
