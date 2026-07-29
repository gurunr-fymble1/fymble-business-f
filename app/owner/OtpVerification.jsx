import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import OTPInput from "../../components/ui/OtpInputComponent";

import { Image } from "expo-image";
import { saveToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { OTPVerificationAPI, resendOTPAPI } from "../../services/Api";

const OTPVerificationScreen = () => {
  const { mobile, role } = useLocalSearchParams();
  const [otpValue, setOtpValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoVerifyInitiated, setAutoVerifyInitiated] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const lastVerifiedOTP = useRef(null);
  const router = useRouter();
  const mobile_number = JSON.parse(mobile);
  const userRole = role || "owner";

  const handleOTPComplete = (otp) => {
    setOtpValue(otp);
    if (
      otp &&
      otp.length === 6 &&
      !isLoading &&
      !autoVerifyInitiated &&
      lastVerifiedOTP.current !== otp
    ) {
      setAutoVerifyInitiated(true);
      lastVerifiedOTP.current = otp;
      handleVerify(otp);
    }
  };

  const handleResendOTP = async () => {
    try {
      setOtpValue("");
      setAutoVerifyInitiated(false);
      setVerificationFailed(false);
      lastVerifiedOTP.current = null;

      const id = null;
      const type = "mobile";

      const response = await resendOTPAPI(mobile, type, userRole, id);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: "Otp resent Successfully",
        });
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const handleVerify = async (manualOtp = null) => {
    const otpToVerify = manualOtp || otpValue;

    if (!otpToVerify) return;

    try {
      const response = await OTPVerificationAPI(mobile, otpToVerify, userRole);
      if (response?.status === 200) {
        setIsLoading(true);

        setTimeout(async () => {
          if (userRole === "owner") {
            // Check if registration is incomplete
            if (response?.incomplete_registration === true) {
              router.push({
                pathname: "/registerDigital",
                params: { mobile: mobile },
              });
              return;
            }

            if (response?.data?.gyms?.length > 1) {
              router.push({
                pathname: "/owner/selectgym",
                params: {
                  gyms: JSON.stringify(response.data.gyms),
                  user_id: response.data.owner_id.toString(),
                  access_token: response.data?.access_token.toString(),
                  refresh_token: response.data?.refresh_token.toString(),
                  name: response?.data?.name,
                  role: "owner",
                },
              });
            } else {
              try {
                await saveToken("gym_id", response.data.gyms.gym_id.toString());
                await saveToken("owner_id", response.data.owner_id.toString());
                await saveToken("role", "owner");
                await saveToken("gym_name", response?.data?.gyms?.name);
                await saveToken("access_token", response.data.access_token);
                await saveToken("refresh_token", response.data.refresh_token);
                await saveToken("name", response?.data?.name);
                await saveToken("gym_logo", response?.data?.gyms?.logo);
                router.push("/owner/home");
              } catch (error) {
                showToast({
                  type: "error",
                  title:
                    error || "Something went wrong. Please try again later",
                });
              }
            }
          } else if (userRole === "trainer") {
            // Handle trainer login flow
            if (response?.data?.gyms?.length > 1) {
              router.push({
                pathname: "/owner/selectgym",
                params: {
                  gyms: JSON.stringify(response.data.gyms),
                  user_id: response.data.trainer_id.toString(),
                  access_token: response.data?.access_token.toString(),
                  refresh_token: response.data?.refresh_token.toString(),
                  name: response?.data?.name,
                  role: "trainer",
                },
              });
            } else {
              try {
                await saveToken("gym_id", response.data.gyms.gym_id.toString());
                await saveToken(
                  "owner_id",
                  response.data.gyms.owner_id.toString(),
                );
                await saveToken(
                  "trainer_id",
                  response.data.trainer_id.toString(),
                );
                await saveToken("role", "trainer");
                await saveToken("gym_name", response?.data?.gyms?.name);
                await saveToken("access_token", response.data.access_token);
                await saveToken("refresh_token", response.data.refresh_token);
                await saveToken("name", response?.data?.name);
                await saveToken("gym_logo", response?.data?.gyms?.logo);
                router.push("/owner/home");
              } catch (error) {
                showToast({
                  type: "error",
                  title:
                    error || "Something went wrong. Please try again later",
                });
              }
            }
          }
        }, 2000);
      } else {
        // Clear OTP and set verification failed state
        setOtpValue(null);
        setVerificationFailed(true);
        setAutoVerifyInitiated(false);

        showToast({
          type: "error",
          title: "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      // Clear OTP and set verification failed state
      setOtpValue(null);
      setVerificationFailed(true);
      setAutoVerifyInitiated(false);

      showToast({
        type: "error",
        title: error || "Something went wrong. Please try again later",
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 2800);
    }
  };

  const handleChangeNumber = () => {
    router.push("/");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      {isLoading ? (
        <Image
          source={require("../../assets/gif/welcome.gif")}
          style={styles.topImage}
          contentFit="contain"
        />
      ) : (
        <Image
          source={require("../../assets/images/OTP 2.png")}
          style={styles.topImage}
          contentFit="contain"
        />
      )}

      <Text style={styles.title}>OTP Verification</Text>

      <Text style={styles.subtitle}>
        Enter the OTP sent to{" "}
        <Text style={{ color: "#263148", fontSize: 14 }}>{mobile_number}</Text>
      </Text>

      <OTPInput
        onComplete={handleOTPComplete}
        onResendOTP={handleResendOTP}
        clearOTP={verificationFailed} // Pass this prop to clear OTP input
      />

      <TouchableOpacity
        style={[
          styles.verifyButton,
          !otpValue ? styles.verifyButtonDisabled : styles.verifyButtonEnabled,
        ]}
        onPress={() => handleVerify()}
        disabled={!otpValue || isLoading}
      >
        {isLoading ? (
          <Animatable.View
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
          >
            <Ionicons name="fitness" size={24} color="#FFFFFF" />
          </Animatable.View>
        ) : (
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <View style={styles.changeNumberContainer}>
        <Text style={styles.changeNumberText}>
          Want to change mobile number?{" "}
          <Text onPress={handleChangeNumber} style={styles.changeButton}>
            Change!
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  container2: {
    flex: 1,
    backgroundColor: "#ffffff",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  topImage: {
    width: 250,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#696969",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#767676",
    marginBottom: 10,
  },
  verifyButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  verifyButtonEnabled: {
    backgroundColor: "#FF5757",
  },
  verifyButtonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  changeNumberContainer: {
    marginTop: 10,
  },
  changeNumberText: {
    fontSize: 14,
    color: "#888",
  },
  changeButton: {
    color: "#FF5757",
    fontWeight: "600",
  },
});

export default OTPVerificationScreen;
