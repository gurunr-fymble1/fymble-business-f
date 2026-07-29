import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "../../../utils/Toaster";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import {
  getBankDetailsFromIFSC,
  updateAccount,
  getOldAccountDetailsAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";

const AccountDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(false);

  const [accountDetails, setAccountDetails] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
    branchName: "",
    upiId: "",
    panNumber: "",
    gstNumber: "",
    gstType: "no_gst",
    gstPercentage: "18",
  });

  const [errors, setErrors] = useState({});

  // State for copying data from oldest gym
  const [hasOtherGyms, setHasOtherGyms] = useState(false);
  const [oldGymName, setOldGymName] = useState("");
  const [oldAccountData, setOldAccountData] = useState(null);

  // Check for old gym data on mount
  useEffect(() => {
    const checkOldGymData = async () => {
      try {
        const ownerId = await getToken("owner_id");
        const gymId = await getToken("gym_id");

        if (!ownerId || !gymId) return;

        const response = await getOldAccountDetailsAPI(ownerId, gymId);

        if (
          response?.status === 200 &&
          response?.has_other_gyms &&
          response?.data
        ) {
          setHasOtherGyms(true);
          setOldGymName(response.oldest_gym_name || "other gym");
          setOldAccountData(response.data);
        }
      } catch (error) {}
    };

    checkOldGymData();
  }, []);

  const handleCopyFromOldGym = () => {
    if (oldAccountData) {
      setAccountDetails({
        accountNumber: oldAccountData.account_number || "",
        confirmAccountNumber: oldAccountData.account_number || "",
        ifscCode: oldAccountData.account_ifsccode || "",
        accountHolderName: oldAccountData.account_holdername || "",
        bankName: oldAccountData.bank_name || "",
        branchName: oldAccountData.account_branch || "",
        upiId: oldAccountData.upi_id || "",
        panNumber: oldAccountData.pan_number || "",
        gstNumber: oldAccountData.gst_number || "",
        gstType: oldAccountData.gst_type || "no_gst",
        gstPercentage: oldAccountData.gst_percentage || "18",
      });
      // Mark IFSC as verified since it's from existing data
      if (oldAccountData.account_ifsccode) {
        setIfscVerified(true);
      }
      showToast({
        type: "success",
        title: `Account details copied from ${oldGymName}`,
      });
      // Hide the banner after copying
      setHasOtherGyms(false);
    }
  };

  const gstTypes = [
    { label: "GST Inclusive", value: "inclusive" },
    { label: "GST Exclusive", value: "exclusive" },
    { label: "No GST", value: "no_gst" },
  ];

  const handleInputChange = (field, value) => {
    setAccountDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-set GST percentage for inclusive/exclusive
    if (field === "gstType") {
      if (value === "inclusive" || value === "exclusive") {
        setAccountDetails((prev) => ({
          ...prev,
          gstType: value,
          gstPercentage: "18",
        }));
      } else {
        setAccountDetails((prev) => ({
          ...prev,
          gstType: value,
        }));
      }
    }

    // Mark IFSC as unverified when user edits
    if (field === "ifscCode") {
      setIfscVerified(false);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const fetchBankDetails = async () => {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode)) {
      return;
    }

    setBankDetailsLoading(true);
    try {
      const response = await getBankDetailsFromIFSC(accountDetails.ifscCode);
      if (response.status === 200 && response.data) {
        setAccountDetails((prev) => ({
          ...prev,
          bankName: response.data.BANK,
          branchName: response.data.BRANCH,
        }));
        setIfscVerified(true);
        showToast({
          type: "success",
          title: "Bank details fetched successfully!",
        });
      }
    } catch (error) {
      console.error("Bank details error:", error);
      showToast({
        type: "error",
        title: "Failed to fetch bank details",
      });
    } finally {
      setBankDetailsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Account Holder Name
    if (!accountDetails.accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
    }

    // Account Number
    if (!accountDetails.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d{9,18}$/.test(accountDetails.accountNumber.trim())) {
      newErrors.accountNumber = "Account number must be 9-18 digits";
    }

    // Confirm Account Number
    if (!accountDetails.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = "Please confirm your account number";
    } else if (
      accountDetails.accountNumber !== accountDetails.confirmAccountNumber
    ) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    // IFSC Code
    if (!accountDetails.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode.trim())) {
      newErrors.ifscCode = "Invalid IFSC code format";
    }

    // UPI ID (optional but validate format if provided)
    if (
      accountDetails.upiId.trim() &&
      !/^[\w\.\-]+@[\w\-]+$/.test(accountDetails.upiId.trim())
    ) {
      newErrors.upiId = "Invalid UPI ID format (example: user@paytm)";
    }

    // GST Type
    if (!accountDetails.gstType.trim()) {
      newErrors.gstType = "GST type is required";
    }

    // PAN Number (mandatory)
    if (!accountDetails.panNumber.trim()) {
      newErrors.panNumber = "PAN number is required";
    } else if (
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
        accountDetails.panNumber.trim().toUpperCase()
      )
    ) {
      newErrors.panNumber = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast({
        type: "error",
        title: "Please fix all errors before saving",
      });
      return;
    }

    setLoading(true);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID is not available",
        });
        setLoading(false);
        return;
      }

      // Prepare payload matching API requirements
      const payload = {
        gym_id: parseInt(gymId),
        accountNumber: accountDetails.accountNumber,
        confirmAccountNumber: accountDetails.confirmAccountNumber,
        ifscCode: accountDetails.ifscCode,
        accountHolderName: accountDetails.accountHolderName,
        bankName: accountDetails.bankName,
        branchName: accountDetails.branchName,
        upiId: accountDetails.upiId || undefined,
        panNumber: accountDetails.panNumber || undefined,
        gstNumber: accountDetails.gstNumber || undefined,
        gstType: accountDetails.gstType,
        gstPercentage: accountDetails.gstPercentage,
      };

      const response = await updateAccount(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Account details saved successfully!",
        });
        setTimeout(() => {
          router.push("/owner/home");
        }, 500);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to save account details",
        });
      }
    } catch (error) {
      console.error("Save account details error:", error);
      showToast({
        type: "error",
        title: "Failed to save account details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Bank Account Details"
      />

      {/* Copy from Old Gym Banner */}
      {hasOtherGyms && oldAccountData && (
        <TouchableOpacity
          style={styles.copyBanner}
          onPress={handleCopyFromOldGym}
          activeOpacity={0.7}
        >
          <View style={styles.copyBannerLeft}>
            <View style={styles.copyIconContainer}>
              <Ionicons name="sync-outline" size={18} color="#FFF" />
            </View>
            <View style={styles.copyBannerTextContainer}>
              <Text style={styles.copyBannerTitle}>Copy from {oldGymName}</Text>
              <Text style={styles.copyBannerSubtitle}>
                Tap to use same details
              </Text>
            </View>
          </View>
          <View style={styles.copyBannerAction}>
            <Text style={styles.copyBannerActionText}>Apply</Text>
            <Ionicons name="arrow-forward" size={16} color="#0154A0" />
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 250 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color="#F57C00" />
          <Text style={styles.warningText}>
            All transactions related to gym plans and client payments are
            processed to this bank account. Enter proper details carefully and
            verify before submitting.
          </Text>
        </View>

        {/* Account Holder Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="person-outline" size={16} color="#0154A0" /> Account
            Holder Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account holder name"
            placeholderTextColor="#999"
            value={accountDetails.accountHolderName}
            onChangeText={(value) =>
              handleInputChange("accountHolderName", value)
            }
          />
          {errors.accountHolderName && (
            <Text style={styles.errorText}>{errors.accountHolderName}</Text>
          )}
        </View>

        {/* Account Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="card-outline" size={16} color="#0154A0" /> Account
            Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bank account number"
            placeholderTextColor="#999"
            value={accountDetails.accountNumber}
            onChangeText={(value) => handleInputChange("accountNumber", value)}
            keyboardType="numeric"
            maxLength={18}
          />
          {errors.accountNumber && (
            <Text style={styles.errorText}>{errors.accountNumber}</Text>
          )}
        </View>

        {/* Confirm Account Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="card-outline" size={16} color="#0154A0" /> Confirm
            Account Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter account number"
            placeholderTextColor="#999"
            value={accountDetails.confirmAccountNumber}
            onChangeText={(value) =>
              handleInputChange("confirmAccountNumber", value)
            }
            keyboardType="numeric"
            maxLength={18}
          />
          {errors.confirmAccountNumber && (
            <Text style={styles.errorText}>{errors.confirmAccountNumber}</Text>
          )}
        </View>

        {/* IFSC Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="business-outline" size={16} color="#0154A0" /> IFSC
            Code <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.ifscContainer}>
            <TextInput
              style={[styles.input, styles.ifscInput]}
              placeholder="Enter IFSC code"
              placeholderTextColor="#999"
              value={accountDetails.ifscCode}
              onChangeText={(value) =>
                handleInputChange("ifscCode", value.toUpperCase())
              }
              maxLength={11}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.ifscCheckButton,
                (bankDetailsLoading ||
                  !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode)) &&
                  styles.disabledButton,
              ]}
              onPress={fetchBankDetails}
              disabled={
                bankDetailsLoading ||
                !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode)
              }
              activeOpacity={0.7}
            >
              {bankDetailsLoading ? (
                <ActivityIndicator size={16} color="#FFF" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          {/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode) &&
            !ifscVerified && (
              <Text style={styles.helperText}>
                Click the tick button after entering IFSC code to auto-fill bank
                details
              </Text>
            )}
          {errors.ifscCode && (
            <Text style={styles.errorText}>{errors.ifscCode}</Text>
          )}
        </View>

        {/* Bank Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="business-outline" size={16} color="#0154A0" /> Bank
            Name
          </Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Bank name (auto-filled)"
            placeholderTextColor="#999"
            value={accountDetails.bankName}
            editable={false}
          />
        </View>

        {/* Branch Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="location-outline" size={16} color="#0154A0" />{" "}
            Branch Name
          </Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Branch name (auto-filled)"
            placeholderTextColor="#999"
            value={accountDetails.branchName}
            editable={false}
          />
        </View>

        {/* UPI ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="qr-code-outline" size={16} color="#0154A0" /> UPI ID
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter UPI ID (optional)"
            placeholderTextColor="#999"
            value={accountDetails.upiId}
            onChangeText={(value) => handleInputChange("upiId", value)}
          />
          {errors.upiId && <Text style={styles.errorText}>{errors.upiId}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="card-outline" size={16} color="#0154A0" /> PAN Card
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.panNumber && { borderColor: "#F44336" },
            ]}
            placeholder="Enter PAN Number"
            placeholderTextColor="#999"
            value={accountDetails.panNumber}
            onChangeText={(value) =>
              handleInputChange("panNumber", value.toUpperCase())
            }
            autoCapitalize="characters"
            maxLength={10}
          />
          {errors.panNumber && (
            <Text style={styles.errorText}>{errors.panNumber}</Text>
          )}
        </View>

        {/* GST Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="receipt-outline" size={16} color="#0154A0" /> GST
            Number
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter GST number (optional)"
            placeholderTextColor="#999"
            value={accountDetails.gstNumber}
            onChangeText={(value) =>
              handleInputChange("gstNumber", value.toUpperCase())
            }
            autoCapitalize="characters"
            maxLength={15}
          />
        </View>

        {/* GST Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="settings-outline" size={16} color="#0154A0" /> GST
            Type <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowGstModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectorText,
                !accountDetails.gstType && styles.placeholderText,
              ]}
            >
              {gstTypes.find((type) => type.value === accountDetails.gstType)
                ?.label || "Select GST type"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#0154A0" />
          </TouchableOpacity>
          {errors.gstType && (
            <Text style={styles.errorText}>{errors.gstType}</Text>
          )}
        </View>

        {/* GST Percentage (if applicable) */}
        {(accountDetails.gstType === "inclusive" ||
          accountDetails.gstType === "exclusive") && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="information-circle" size={16} color="#0154A0" />{" "}
              GST Percentage
            </Text>
            <View style={styles.gstPercentageCard}>
              <Text style={styles.gstPercentageText}>
                {accountDetails.gstPercentage}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: 5 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#030A15", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Account Details</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* GST Type Modal */}
      <Modal
        visible={showGstModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGstModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: 10 + insets.bottom }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select GST Type</Text>
              <TouchableOpacity onPress={() => setShowGstModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {gstTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.gstTypeItem}
                onPress={() => {
                  handleInputChange("gstType", type.value);
                  setShowGstModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.gstTypeText}>{type.label}</Text>
                {accountDetails.gstType === type.value && (
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  copyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FBFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E3F5",
    shadowColor: "#0154A0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  copyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  copyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0154A0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  copyBannerTextContainer: {
    flex: 1,
  },
  copyBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  copyBannerSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  copyBannerAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBannerActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0154A0",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F57C00",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#E65100",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#F44336",
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginTop: 6,
    marginLeft: 4,
  },
  ifscContainer: {
    flexDirection: "row",
    gap: 8,
  },
  ifscInput: {
    flex: 1,
  },
  ifscCheckButton: {
    backgroundColor: "#0154A0",
    width: 44,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  selectorText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  gstPercentageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20,
  },
  gstPercentageText: {
    fontSize: 14,
    color: "#01579B",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  gstTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  gstTypeText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AccountDetails;
