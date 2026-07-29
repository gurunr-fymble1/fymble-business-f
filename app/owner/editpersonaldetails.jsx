import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import {
  updateOwnerPersonalDetailsAPI,
  checkMobileExistsAPI,
  sendMobileChangeOtpAPI,
  verifyMobileChangeOtpAPI,
  updateMobileNumberAPI,
} from "../../services/Api";
import { getToken, saveToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const EditPersonalDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [ownerID, setOwnerID] = useState(null);
  const [originalContactNumber, setOriginalContactNumber] = useState("");

  const [editData, setEditData] = useState({
    name: "",
    email: "",
    contact_number: "",
  });

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState("current"); // "current" or "new"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (params?.personalData) {
      try {
        const personalData = JSON.parse(params.personalData);
        setOwnerID(params.ownerID);
        setOriginalContactNumber(personalData?.contact_number || "");

        setEditData({
          name: personalData?.name || "",
          email: personalData?.email || "",
          contact_number: personalData?.contact_number || "",
        });
      } catch (error) {
        showToast({
          type: "error",
          title: "Failed to load personal data",
        });
        router.replace({
          pathname: "/owner/ownerprofile",
          params: { activeTab: "personal" },
        });
      }
    }
  }, []);

  // Resend timer countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const sendOtp = async (step) => {
    setIsSendingOtp(true);
    try {
      const owner_id = await getToken("owner_id");
      const mobile = step === "current" ? originalContactNumber : editData.contact_number.trim();

      const response = await sendMobileChangeOtpAPI(parseInt(owner_id), mobile, step);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response?.message || "OTP sent successfully",
        });
        setResendTimer(30);
        return true;
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to send OTP",
        });
        return false;
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to send OTP",
      });
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      showToast({
        type: "error",
        title: "Please enter complete OTP",
      });
      return;
    }

    setIsOtpLoading(true);
    try {
      const owner_id = await getToken("owner_id");
      const mobile = otpStep === "current" ? originalContactNumber : editData.contact_number.trim();

      const response = await verifyMobileChangeOtpAPI(
        parseInt(owner_id),
        mobile,
        otpString,
        otpStep
      );

      if (response?.status === 200) {
        if (otpStep === "current") {
          // Current number verified, now send OTP to new number
          showToast({
            type: "success",
            title: "Current number verified",
          });
          setOtp(["", "", "", "", "", ""]);
          setOtpStep("new");
          const sent = await sendOtp("new");
          if (!sent) {
            setShowOtpModal(false);
          }
        } else {
          // New number verified, now update the mobile number
          showToast({
            type: "success",
            title: "New number verified",
          });
          await completeMobileChange();
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Invalid OTP",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to verify OTP",
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const completeMobileChange = async () => {
    try {
      const owner_id = await getToken("owner_id");

      // Update mobile number
      const mobileResponse = await updateMobileNumberAPI(
        parseInt(owner_id),
        editData.contact_number.trim()
      );

      if (mobileResponse?.status !== 200) {
        showToast({
          type: "error",
          title: mobileResponse?.detail || "Failed to update mobile number",
        });
        setShowOtpModal(false);
        return;
      }

      // Now update name and email
      const payload = {
        owner_id: parseInt(owner_id),
        name: editData.name.trim(),
        email: editData.email.trim() || null,
      };

      const response = await updateOwnerPersonalDetailsAPI(payload);

      if (response?.status === 200) {
        if (editData.name) {
          await saveToken("owner_name", editData.name);
        }
        showToast({
          type: "success",
          title: "Personal details updated successfully",
        });
        setShowOtpModal(false);
        router.replace({
          pathname: "/owner/ownerprofile",
          params: { activeTab: "personal" },
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update personal details",
        });
        setShowOtpModal(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to update details",
      });
      setShowOtpModal(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!editData.name.trim()) {
        showToast({
          type: "error",
          title: "Please enter your name",
        });
        return;
      }

      if (!validatePhone(editData.contact_number)) {
        showToast({
          type: "error",
          title: "Please enter a valid 10-digit phone number",
        });
        return;
      }

      if (!validateEmail(editData.email)) {
        showToast({
          type: "error",
          title: "Please enter a valid email address",
        });
        return;
      }

      setIsSaving(true);
      const owner_id = await getToken("owner_id");

      if (!owner_id) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
        return;
      }

      // Check if mobile number has changed
      const mobileChanged = editData.contact_number.trim() !== originalContactNumber;

      if (mobileChanged) {
        // First check if new number already exists
        const checkResponse = await checkMobileExistsAPI(
          editData.contact_number.trim(),
          parseInt(owner_id)
        );

        if (checkResponse?.exists) {
          showToast({
            type: "error",
            title: "This mobile number is already registered",
          });
          setIsSaving(false);
          return;
        }

        // Start OTP verification flow
        setOtpStep("current");
        setOtp(["", "", "", "", "", ""]);
        const sent = await sendOtp("current");

        if (sent) {
          setShowOtpModal(true);
        }
        setIsSaving(false);
      } else {
        // No mobile change, just update name and email
        const payload = {
          owner_id: parseInt(owner_id),
          name: editData.name.trim(),
          email: editData.email.trim() || null,
        };

        const response = await updateOwnerPersonalDetailsAPI(payload);

        if (response?.status === 200) {
          if (editData.name) {
            await saveToken("owner_name", editData.name);
          }
          showToast({
            type: "success",
            title: "Personal details updated successfully",
          });
          router.replace({
            pathname: "/owner/ownerprofile",
            params: { activeTab: "personal" },
          });
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Failed to update personal details",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to update personal details",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.replace({
      pathname: "/owner/ownerprofile",
      params: { activeTab: "personal" },
    });
    return true;
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpStep("current");
  };

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler onBackPress={handleCancel} />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Personal Details</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={editData.name}
              onChangeText={(text) =>
                setEditData({ ...editData, name: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor={"#AAA"}
              autoCapitalize="words"
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number *</Text>
            <TextInput
              style={styles.input}
              value={editData.contact_number}
              onChangeText={(text) =>
                setEditData({ ...editData, contact_number: text.replace(/[^0-9]/g, '') })
              }
              placeholder="Enter your contact number"
              placeholderTextColor={"#AAA"}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {editData.contact_number !== originalContactNumber && editData.contact_number.length === 10 && (
              <Text style={styles.changeNote}>
                OTP verification required for number change
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email ID</Text>
            <TextInput
              style={styles.input}
              value={editData.email}
              onChangeText={(text) =>
                setEditData({ ...editData, email: text })
              }
              placeholder="Enter your email address"
              placeholderTextColor={"#AAA"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={closeOtpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeOtpModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {otpStep === "current" ? "Verify Current Number" : "Verify New Number"}
            </Text>

            <Text style={styles.modalSubtitle}>
              {otpStep === "current"
                ? `Enter the OTP sent to your current number ${originalContactNumber?.slice(0, 3)}****${originalContactNumber?.slice(-3)}`
                : `Enter the OTP sent to your new number ${editData.contact_number?.slice(0, 3)}****${editData.contact_number?.slice(-3)}`}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpInputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isOtpLoading && styles.disabledButton]}
              onPress={verifyOtp}
              disabled={isOtpLoading}
            >
              {isOtpLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => sendOtp(otpStep)}
              disabled={resendTimer > 0 || isSendingOtp}
            >
              {isSendingOtp ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, otpStep === "current" && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, otpStep === "new" && styles.stepDotActive]} />
            </View>
            <Text style={styles.stepText}>
              Step {otpStep === "current" ? "1" : "2"} of 2
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 34,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  changeNote: {
    fontSize: 11,
    color: "#e67e22",
    marginTop: 5,
    fontStyle: "italic",
  },
  bottomSpacing: {
    height: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#bbb",
    opacity: 0.7,
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: "#f9f9f9",
  },
  verifyButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    paddingVertical: 10,
  },
  resendText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
  resendDisabled: {
    color: "#999",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ddd",
  },
  stepDotActive: {
    backgroundColor: "#3498db",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
  stepText: {
    fontSize: 12,
    color: "#999",
  },
});

export default EditPersonalDetails;
