import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
  getPaymentDetailsAPI,
  submitPaymentDetailsEditRequestAPI,
  getBankDetailsFromIFSC,
  updateUpiGstDetailsAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const { height, width } = Dimensions.get("window");

const gstTypes = [
  { value: "no_gst", label: "No GST" },
  { value: "inclusive", label: "GST Inclusive" },
  { value: "exclusive", label: "GST Exclusive" },
];

const EditPaymentDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingUpiGst, setIsSavingUpiGst] = useState(false);
  const [gymID, setGymID] = useState(null);
  const [ownerID, setOwnerID] = useState(null);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);

  const [originalData, setOriginalData] = useState({});
  const [editData, setEditData] = useState({
    account_holdername: "",
    account_number: "",
    confirm_account_number: "",
    account_ifsccode: "",
    bank_name: "",
    account_branch: "",
    pan_number: "",
    upi_id: "",
    gst_type: "",
    gst_number: "",
    gst_percentage: "18",
  });

  const [showGstModal, setShowGstModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpiGstSuccessModal, setShowUpiGstSuccessModal] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");

      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "Session expired. Please login again.",
        });
        router.back();
        return;
      }

      setGymID(parseInt(gymId));
      setOwnerID(parseInt(ownerId));

      const response = await getPaymentDetailsAPI(parseInt(ownerId), parseInt(gymId));

      if (response?.status === 200) {
        const data = response?.data || {};
        const pendingEditRequest = response?.pending_edit_request;

        const paymentData = {
          account_holdername: data.account_holdername || "",
          account_number: data.account_number || "",
          confirm_account_number: data.account_number || "",
          account_ifsccode: data.account_ifsccode || "",
          bank_name: data.bank_name || "",
          account_branch: data.account_branch || "",
          pan_number: data.pan_number || "",
          upi_id: data.upi_id || "",
          gst_type: data.gst_type || "",
          gst_number: data.gst_number || "",
          gst_percentage: data.gst_percentage || "18",
        };

        setOriginalData(paymentData);
        setEditData(paymentData);

        if (pendingEditRequest) {
          setPendingRequest(pendingEditRequest);
          setShowPendingModal(true);
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch payment details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankDetails = async (ifscCode) => {
    if (!ifscCode || ifscCode.length !== 11) {
      showToast({
        type: "error",
        title: "Please enter a valid 11-character IFSC code",
      });
      return;
    }

    try {
      setBankDetailsLoading(true);
      const response = await getBankDetailsFromIFSC(ifscCode);
      if (response) {
        setEditData((prev) => ({
          ...prev,
          bank_name: response.BANK || "",
          account_branch: response.BRANCH || "",
        }));
        showToast({
          type: "success",
          title: "Bank details fetched successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Could not fetch bank details. Please check IFSC code.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch bank details",
      });
    } finally {
      setBankDetailsLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      editData.account_holdername !== originalData.account_holdername ||
      editData.account_number !== originalData.account_number ||
      editData.account_ifsccode !== originalData.account_ifsccode ||
      editData.bank_name !== originalData.bank_name ||
      editData.account_branch !== originalData.account_branch ||
      editData.upi_id !== originalData.upi_id ||
      editData.gst_type !== originalData.gst_type ||
      editData.gst_number !== originalData.gst_number ||
      editData.gst_percentage !== originalData.gst_percentage
    );
  };

  const hasBankDetailsChanges = () => {
    return (
      editData.account_holdername !== originalData.account_holdername ||
      editData.account_number !== originalData.account_number ||
      editData.account_ifsccode !== originalData.account_ifsccode ||
      editData.bank_name !== originalData.bank_name ||
      editData.account_branch !== originalData.account_branch ||
      editData.pan_number !== originalData.pan_number
    );
  };

  const hasUpiGstChanges = () => {
    return (
      editData.upi_id !== originalData.upi_id ||
      editData.gst_type !== originalData.gst_type ||
      editData.gst_number !== originalData.gst_number ||
      editData.gst_percentage !== originalData.gst_percentage
    );
  };

  const validateBankDetailsForm = () => {
    if (!editData.account_holdername?.trim()) {
      showToast({ type: "error", title: "Account holder name is required" });
      return false;
    }
    if (!editData.account_number?.trim()) {
      showToast({ type: "error", title: "Account number is required" });
      return false;
    }
    if (editData.account_number !== editData.confirm_account_number) {
      showToast({ type: "error", title: "Account numbers do not match" });
      return false;
    }
    if (!editData.account_ifsccode?.trim() || editData.account_ifsccode.length !== 11) {
      showToast({ type: "error", title: "Please enter a valid 11-character IFSC code" });
      return false;
    }
    return true;
  };

  const validateUpiGstForm = () => {
    if (!editData.gst_type) {
      showToast({ type: "error", title: "Please select GST type" });
      return false;
    }
    return true;
  };

  const handleSaveUpiGst = async () => {
    if (!hasUpiGstChanges()) {
      showToast({ type: "info", title: "No changes to save" });
      return;
    }

    if (!validateUpiGstForm()) {
      return;
    }

    try {
      setIsSavingUpiGst(true);

      const payload = {
        owner_id: ownerID,
        gym_id: gymID,
        upi_id: editData.upi_id || null,
        gst_type: editData.gst_type || null,
        gst_number: editData.gst_number || null,
        gst_percentage: editData.gst_percentage || null,
      };

      const response = await updateUpiGstDetailsAPI(payload);

      if (response?.status === 200) {
        // Update original data with new values
        setOriginalData((prev) => ({
          ...prev,
          upi_id: editData.upi_id,
          gst_type: editData.gst_type,
          gst_number: editData.gst_number,
          gst_percentage: editData.gst_percentage,
        }));
        setShowUpiGstSuccessModal(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update UPI/GST details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSavingUpiGst(false);
    }
  };

  const handleSubmitBankDetailsRequest = async () => {
    if (pendingRequest) {
      setShowPendingModal(true);
      return;
    }

    if (!hasBankDetailsChanges()) {
      showToast({ type: "info", title: "No bank details changes to submit" });
      return;
    }

    if (!validateBankDetailsForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        owner_id: ownerID,
        gym_id: gymID,
        old_data: {
          account_holdername: originalData.account_holdername,
          account_number: originalData.account_number,
          account_ifsccode: originalData.account_ifsccode,
          bank_name: originalData.bank_name,
          account_branch: originalData.account_branch,
          pan_number: originalData.pan_number,
        },
        new_data: {
          account_holdername: editData.account_holdername,
          account_number: editData.account_number,
          account_ifsccode: editData.account_ifsccode,
          bank_name: editData.bank_name,
          account_branch: editData.account_branch,
          pan_number: editData.pan_number,
        },
      };

      const response = await submitPaymentDetailsEditRequestAPI(payload);

      if (response?.status === 200) {
        setShowSuccessModal(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to submit edit request",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChangedFields = () => {
    if (!pendingRequest?.new_data) return [];
    const changes = [];
    const newData = pendingRequest.new_data;
    const oldData = pendingRequest.old_data || {};

    const fieldLabels = {
      account_holdername: "Account Holder Name",
      account_number: "Account Number",
      account_ifsccode: "IFSC Code",
      bank_name: "Bank Name",
      account_branch: "Branch Name",
      pan_number: "PAN Number",
    };

    Object.keys(newData).forEach((key) => {
      if (newData[key] !== oldData[key] && fieldLabels[key]) {
        changes.push({
          field: fieldLabels[key],
          oldValue: oldData[key] || "Not set",
          newValue: newData[key] || "Not set",
        });
      }
    });

    return changes;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler
        onBackPress={() => {
          router.replace({
            pathname: "/owner/ownerprofile",
            params: { activeTab: "payment" },
          });
          return true;
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.replace({
              pathname: "/owner/ownerprofile",
              params: { activeTab: "payment" },
            });
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Payment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Pending Request Banner */}
      {pendingRequest && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => setShowPendingModal(true)}
        >
          <View style={styles.pendingBannerContent}>
            <Ionicons name="time-outline" size={20} color="#f39c12" />
            <Text style={styles.pendingBannerText}>
              Bank details edit request pending verification
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#f39c12" />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* UPI & GST Section - Direct Save */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={22} color="#27ae60" />
              <Text style={styles.sectionTitle}>UPI & GST Details</Text>
            </View>
            <View style={styles.sectionInfoCard}>
              <Ionicons name="flash-outline" size={18} color="#27ae60" />
              <Text style={styles.sectionInfoText}>
                These details can be updated instantly without verification.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <TextInput
                style={styles.input}
                value={editData.upi_id}
                onChangeText={(text) => setEditData({ ...editData, upi_id: text })}
                placeholder="Enter UPI ID (optional)"
                placeholderTextColor="#AAA"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Type *</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowGstModal(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !editData.gst_type && styles.placeholderText,
                  ]}
                >
                  {editData.gst_type === "no_gst"
                    ? "No GST"
                    : editData.gst_type === "inclusive"
                    ? "GST Inclusive"
                    : editData.gst_type === "exclusive"
                    ? "GST Exclusive"
                    : "Select GST type"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#3498db" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput
                style={styles.input}
                value={editData.gst_number}
                onChangeText={(text) =>
                  setEditData({ ...editData, gst_number: text })
                }
                placeholder="Enter GST number (optional)"
                placeholderTextColor="#AAA"
              />
            </View>

            {editData.gst_type && editData.gst_type !== "no_gst" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GST Percentage</Text>
                <TextInput
                  style={styles.input}
                  value={editData.gst_percentage}
                  onChangeText={(text) =>
                    setEditData({ ...editData, gst_percentage: text })
                  }
                  placeholder="Enter GST percentage (default: 18%)"
                  keyboardType="numeric"
                  placeholderTextColor="#AAA"
                />
              </View>
            )}

            {/* Save UPI/GST Button */}
            <TouchableOpacity
              style={[
                styles.sectionSaveButton,
                styles.saveUpiGstButton,
                (isSavingUpiGst || !hasUpiGstChanges()) && styles.disabledSaveButton,
              ]}
              onPress={handleSaveUpiGst}
              disabled={Boolean(isSavingUpiGst || !hasUpiGstChanges())}
            >
              {isSavingUpiGst ? (
                <ActivityIndicator size={18} color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.sectionSaveButtonText}>Save UPI & GST</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Bank Details Section - Requires Verification */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
            </View>
            <View style={styles.sectionInfoCardBlue}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#3498db" />
              <Text style={styles.sectionInfoTextBlue}>
                Bank details require verification by our team. Changes will be processed within 24-48 hours.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <TextInput
                style={[styles.input, pendingRequest && styles.disabledInput]}
                value={editData.account_holdername}
                onChangeText={(text) =>
                  setEditData({ ...editData, account_holdername: text })
                }
                placeholder="Enter account holder name"
                placeholderTextColor="#AAA"
                editable={!Boolean(pendingRequest)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={[styles.input, pendingRequest && styles.disabledInput]}
                value={editData.account_number}
                onChangeText={(text) =>
                  setEditData({ ...editData, account_number: text })
                }
                keyboardType="numeric"
                placeholder="Enter bank account number"
                placeholderTextColor="#AAA"
                editable={!Boolean(pendingRequest)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Account Number *</Text>
              <TextInput
                style={[styles.input, pendingRequest && styles.disabledInput]}
                value={editData.confirm_account_number}
                onChangeText={(text) =>
                  setEditData({ ...editData, confirm_account_number: text })
                }
                keyboardType="numeric"
                placeholder="Re-enter account number"
                placeholderTextColor="#AAA"
                editable={!Boolean(pendingRequest)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <View style={styles.ifscContainer}>
                <TextInput
                  style={[styles.input, styles.ifscInput, pendingRequest && styles.disabledInput]}
                  value={editData.account_ifsccode}
                  onChangeText={(text) =>
                    setEditData({
                      ...editData,
                      account_ifsccode: text.toUpperCase(),
                    })
                  }
                  placeholder="Enter IFSC code"
                  autoCapitalize="characters"
                  maxLength={11}
                  placeholderTextColor="#AAA"
                  editable={!Boolean(pendingRequest)}
                />
                <TouchableOpacity
                  style={[
                    styles.ifscCheckButton,
                    (bankDetailsLoading ||
                      editData.account_ifsccode?.length !== 11 ||
                      pendingRequest) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => fetchBankDetails(editData.account_ifsccode)}
                  disabled={Boolean(
                    bankDetailsLoading ||
                    editData.account_ifsccode?.length !== 11 ||
                    pendingRequest
                  )}
                >
                  {bankDetailsLoading ? (
                    <ActivityIndicator size={16} color="#FFF" />
                  ) : (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={editData.bank_name}
                placeholder="Bank name (auto-filled)"
                editable={false}
                placeholderTextColor="#AAA"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Branch Name</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={editData.account_branch}
                placeholder="Branch name (auto-filled)"
                editable={false}
                placeholderTextColor="#AAA"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PAN Number</Text>
              <TextInput
                style={[styles.input, pendingRequest && styles.disabledInput]}
                value={editData.pan_number}
                onChangeText={(text) =>
                  setEditData({ ...editData, pan_number: text.toUpperCase() })
                }
                placeholder="Enter PAN number"
                autoCapitalize="characters"
                maxLength={10}
                placeholderTextColor="#AAA"
                editable={!Boolean(pendingRequest)}
              />
            </View>

            {/* Submit Bank Details Request Button */}
            <TouchableOpacity
              style={[
                styles.sectionSaveButton,
                styles.saveBankButton,
                (isSaving || pendingRequest || !hasBankDetailsChanges()) && styles.disabledSaveButton,
              ]}
              onPress={handleSubmitBankDetailsRequest}
              disabled={Boolean(isSaving || pendingRequest || !hasBankDetailsChanges())}
            >
              {isSaving ? (
                <ActivityIndicator size={18} color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#FFF" />
                  <Text style={styles.sectionSaveButtonText}>
                    {pendingRequest ? "Request Pending" : "Submit for Verification"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* GST Type Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGstModal}
        onRequestClose={() => setShowGstModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGstModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select GST Type</Text>
              <TouchableOpacity onPress={() => setShowGstModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {gstTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  editData.gst_type === type.value && styles.selectedOption,
                ]}
                onPress={() => {
                  setEditData({ ...editData, gst_type: type.value });
                  setShowGstModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    editData.gst_type === type.value && styles.selectedOptionText,
                  ]}
                >
                  {type.label}
                </Text>
                {editData.gst_type === type.value && (
                  <Ionicons name="checkmark" size={20} color="#3498db" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pending Request Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPendingModal}
        onRequestClose={() => setShowPendingModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPendingModal(false)}
        >
          <View style={[styles.modalContainer, styles.pendingModalContainer]}>
            <View style={styles.pendingModalHeader}>
              <View style={styles.pendingIconContainer}>
                <Ionicons name="time" size={40} color="#f39c12" />
              </View>
              <Text style={styles.pendingModalTitle}>Bank Details Edit Pending</Text>
              <Text style={styles.pendingModalSubtitle}>
                Your bank details change request is being reviewed by our team
              </Text>
            </View>

            <View style={styles.pendingDetailsContainer}>
              <View style={styles.pendingDetailRow}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.pendingDetailLabel}>Submitted on:</Text>
                <Text style={styles.pendingDetailValue}>
                  {formatDate(pendingRequest?.requested_time)}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.changesTitle}>Requested Changes:</Text>
              {getChangedFields().map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <Text style={styles.changeField}>{change.field}</Text>
                  <View style={styles.changeValues}>
                    <Text style={styles.oldValue}>{change.oldValue}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#666" />
                    <Text style={styles.newValue}>{change.newValue}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.pendingInfoBox}>
              <Ionicons name="information-circle" size={20} color="#3498db" />
              <Text style={styles.pendingInfoText}>
                Changes will be applied after verification. You'll receive a notification once processed.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closePendingButton}
              onPress={() => setShowPendingModal(false)}
            >
              <Text style={styles.closePendingButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal - Bank Details */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace({
            pathname: "/owner/ownerprofile",
            params: { activeTab: "payment" },
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.successModalContainer]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
            </View>
            <Text style={styles.successTitle}>Request Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Your bank details edit request has been submitted successfully. Our team will verify and update your details within 24-48 hours.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace({
                  pathname: "/owner/ownerprofile",
                  params: { activeTab: "payment" },
                });
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal - UPI/GST */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showUpiGstSuccessModal}
        onRequestClose={() => setShowUpiGstSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.successModalContainer]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
            </View>
            <Text style={styles.successTitle}>Saved Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your UPI & GST details have been updated successfully.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowUpiGstSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef9e7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9e79f",
  },
  pendingBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingBannerText: {
    fontSize: 14,
    color: "#9a7b4f",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f4fc",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#2980b9",
    lineHeight: 18,
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  sectionInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f6ef",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  sectionInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#27ae60",
    lineHeight: 16,
  },
  sectionInfoCardBlue: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f4fc",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  sectionInfoTextBlue: {
    flex: 1,
    fontSize: 12,
    color: "#2980b9",
    lineHeight: 16,
  },
  sectionSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  saveUpiGstButton: {
    backgroundColor: "#27ae60",
  },
  saveBankButton: {
    backgroundColor: "#3498db",
  },
  disabledSaveButton: {
    backgroundColor: "#bdc3c7",
  },
  sectionSaveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  ifscContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ifscInput: {
    flex: 1,
  },
  ifscCheckButton: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  selector: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 15,
    color: "#333",
  },
  placeholderText: {
    color: "#AAA",
  },
  bottomActions: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  disabledSubmitButton: {
    backgroundColor: "#bdc3c7",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  selectedOption: {
    backgroundColor: "#e8f4fc",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#3498db",
    fontWeight: "500",
  },
  pendingModalContainer: {
    padding: 0,
  },
  pendingModalHeader: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  pendingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef9e7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  pendingModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  pendingModalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  pendingDetailsContainer: {
    paddingHorizontal: 24,
  },
  pendingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  pendingDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  pendingDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  changesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  changeItem: {
    marginBottom: 12,
  },
  changeField: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  changeValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  oldValue: {
    fontSize: 14,
    color: "#e74c3c",
    textDecorationLine: "line-through",
    flex: 1,
  },
  newValue: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "500",
    flex: 1,
  },
  pendingInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f4fc",
    padding: 12,
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#2980b9",
    lineHeight: 18,
  },
  closePendingButton: {
    backgroundColor: "#3498db",
    margin: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closePendingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  successModalContainer: {
    alignItems: "center",
    padding: 24,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditPaymentDetails;
