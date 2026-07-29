import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  BackHandler,
} from "react-native";
import { FontFamily, Color } from "../GlobalStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { changePasswordAPI } from "../services/Api";
import { showToast } from "../utils/Toaster";

const { width, height } = Dimensions.get("window");

const ChangePassword = () => {
  const { mail, mobile, role } = useLocalSearchParams();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnimation = new Animated.Value(0);
  const logoOpacity = new Animated.Value(1);
  const logoTranslateY = new Animated.Value(0);

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

    // Add back handler
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/");
        return true;
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      backHandler.remove();
    };
  }, []);

  const validatePasswords = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const formErrors = validatePasswords();

    if (Object.keys(formErrors).length === 0) {
      submitNewPassword();
    } else {
      setErrors(formErrors);
      shakeInputs();
    }
  };

  const submitNewPassword = async () => {
    setIsLoading(true);

    try {
      const payload = {
        type: mail ? "email" : "mobile",
        data: mail ? mail : mobile,
        password: newPassword,
        role: role || "owner",
      };

      const response = await changePasswordAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Password changed successfully",
        });
        router.push("/");
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={styles.background}>
        {/* <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidContainer}
                > */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }],
              },
            ]}
          >
            <Text style={styles.logoText}>
              <Text style={styles.logoFirstPart}>Fymble</Text>

              <Text style={styles.logoSecondPart}>&nbsp;Business</Text>
            </Text>
          </Animated.View>

          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.card}
          >
            <View>
              <Text style={styles.heading}>Change Password</Text>
            </View>

            <View style={styles.formContainer}>
              <Animated.View
                style={[
                  styles.inputWrapper,
                  errors.newPassword
                    ? { transform: [{ translateX: shakeAnimation }] }
                    : {},
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: null });
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </Animated.View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}

              <Animated.View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword
                    ? { transform: [{ translateX: shakeAnimation }] }
                    : {},
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#888888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: null });
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>
              </Animated.View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={
                  isLoading ? styles.loginButtonDisabled : styles.loginButton
                }
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginLinkContainer}>
                <TouchableOpacity onPress={() => router.push("/")}>
                  <Text style={styles.loginLinkText}>Go to Login?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>
        </ScrollView>

        {!keyboardVisible && (
          <Animatable.View
            animation="fadeIn"
            duration={1000}
            delay={600}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              © 2025 NFCTech Fitness Private Limited
            </Text>
          </Animatable.View>
        )}
        {/* </KeyboardAvoidingView> */}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: height * 0.2,
    paddingBottom: height * 0.1,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.04,
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
    color: "#263148",
  },
  logoUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#FF5757",
    borderRadius: 2,
    marginTop: 5,
  },
  tagline: {
    color: "#263148",
    fontSize: 12,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: height * 0.02,
  },
  heading: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    color: "#767676",
    marginBottom: 24,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.urbanistMedium,
    color: "#767676",
  },
  errorText: {
    color: "#FF0000",
    fontSize: width * 0.03,
    marginBottom: 10,
  },
  eyeIconContainer: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#FF5757",
    height: 54,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: "#FF5757",
    height: 54,
    borderRadius: 12,
    width: "100%",
    opacity: 0.6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#FF5757",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonText: {
    fontSize: 16,
    color: Color.white || "#FFFFFF",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#767676",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  loginLinkContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  loginLinkText: {
    color: "#FF5757",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
    textDecorationLine: "underline",
  },
});

export default ChangePassword;
