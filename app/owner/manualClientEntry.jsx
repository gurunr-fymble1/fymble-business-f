import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import CustomIOSDatePicker from "../../components/ui/CustomIOSDatePicker";
import ConfettiAnimation from "../../components/ConfettiAnimation";
import { getPlansandBatchesAPI } from "../../services/Api";
import {
  addManualClientAPI,
  lookupManualClientAPI,
  getClientPhotoUploadUrlAPI,
} from "../../services/manualClientApi";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 786;

// Helper to safely get a valid Date object
const getSafeDate = (dateValue, fallback = new Date()) => {
  try {
    if (!dateValue) return fallback;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return fallback;
  } catch (e) {
    console.error("[ManualClientEntry] getSafeDate error:", e);
    return fallback;
  }
};

const ManualClientEntry = () => {
  const [form, setForm] = useState({
    // Basic Info (Required)
    name: "",
    contact: "",
    email: "",
    gender: "",
    dateOfBirth: null,

    // Physical Info (Optional)
    height: "",
    weight: "",
    goal: "",

    // Membership
    admissionNumber: "",
    planId: "",
    batchId: "",
    joinedAt: new Date(),
    expiresAt: null,

    // Fees
    admissionFee: "",
    monthlyFee: "",
    discountAmount: "",
    totalPaid: "",
    paymentMethod: "",

    // Notes
    notes: "",
  });

  const [selectedPlanCategory, setSelectedPlanCategory] =
    useState("gym_membership");

  const [errors, setErrors] = useState({});
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gymId, setGymId] = useState(null);

  // Lookup state - check if client already exists
  const [lookupStatus, setLookupStatus] = useState(null); // null, 'checking', 'exists', 'new'
  const [existingClient, setExistingClient] = useState(null);

  // Date pickers
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showJoinedDatePicker, setShowJoinedDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Photo upload state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const goalOptions = [
    { label: "Weight Loss", value: "weight_loss" },
    { label: "Weight Gain", value: "weight_gain" },
    { label: "Body Recomposition", value: "body_recomposition" },
  ];

  const paymentMethodOptions = [
    { label: "Cash", value: "cash" },
    { label: "UPI", value: "upi" },
    { label: "Card", value: "card" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Cheque", value: "cheque" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-calculate expiry when plan changes
  useEffect(() => {
    try {
      if (
        form.planId &&
        form.joinedAt &&
        Array.isArray(plans) &&
        plans.length > 0
      ) {
        const selectedPlan = plans.find((p) => p.id === form.planId);
        if (selectedPlan && selectedPlan.duration) {
          const joinedDate =
            form.joinedAt instanceof Date
              ? form.joinedAt
              : new Date(form.joinedAt);
          if (joinedDate && !isNaN(joinedDate.getTime())) {
            const expiryDate = new Date(joinedDate);
            expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.duration);
            setForm((prev) => ({
              ...prev,
              expiresAt: expiryDate,
              monthlyFee: selectedPlan.amount?.toString() || "",
            }));
          }
        }
      }
    } catch (error) {
      console.error("[ManualClientEntry] Error calculating expiry:", error);
    }
  }, [form.planId, form.joinedAt, plans]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const storedGymId = await getToken("gym_id");
      setGymId(storedGymId);

      if (storedGymId) {
        const response = await getPlansandBatchesAPI(storedGymId);
        if (response?.status === 200 && response?.data) {
          // Plans and batches are nested inside response.data
          const plansData = Array.isArray(response.data?.plans)
            ? response.data.plans
            : [];
          const batchesData = Array.isArray(response.data?.batches)
            ? response.data.batches
            : [];

          // All gym plans are valid for manual clients (individual, couple, etc.)
          setPlans(plansData);
          setBatches(batchesData);
        } else {
          // Ensure plans and batches are always arrays
          setPlans([]);
          setBatches([]);
        }
      } else {
        // No gym ID - set empty arrays
        setPlans([]);
        setBatches([]);
      }
    } catch (error) {
      console.error("[ManualClientEntry] Error fetching initial data:", error);
      // Ensure plans and batches are always arrays even on error
      setPlans([]);
      setBatches([]);
      showToast({
        type: "error",
        title: "Failed to load data",
        desc: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "Select Date";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return "Select Date";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("[ManualClientEntry] formatDateForDisplay error:", e);
      return "Select Date";
    }
  };

  const formatDateForSQL = (date) => {
    if (!date) return null;
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("[ManualClientEntry] formatDateForSQL error:", e);
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.contact.trim()) {
      newErrors.contact = "Contact is required";
    } else if (!/^\d{10}$/.test(form.contact.trim())) {
      newErrors.contact = "Enter valid 10-digit number";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter valid email";
    }

    if (!form.planId) {
      newErrors.planId = "Select a plan";
    }

    if (!form.batchId) {
      newErrors.batchId = "Select a batch";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateBalanceDue = () => {
    const admission = parseFloat(form.admissionFee) || 0;
    const monthly = parseFloat(form.monthlyFee) || 0;
    const discount = parseFloat(form.discountAmount) || 0;
    const paid = parseFloat(form.totalPaid) || 0;
    const total = admission + monthly - discount;
    return Math.max(0, total - paid);
  };

  // Lookup client when contact is entered (10 digits)
  const handleContactBlur = async () => {
    const contact = form.contact.trim().replace(/\D/g, "");
    if (contact.length < 10 || !gymId) {
      setLookupStatus(null);
      setExistingClient(null);
      return;
    }

    try {
      setLookupStatus("checking");
      const response = await lookupManualClientAPI(contact, gymId);

      if (response?.exists) {
        setLookupStatus("exists");
        setExistingClient(response.client_data);
        setErrors((prev) => ({
          ...prev,
          contact: `Client "${response.client_data?.name}" is already registered`,
        }));
      } else {
        setLookupStatus("new");
        setExistingClient(null);
        // Clear contact error if it was set
        if (errors.contact?.includes("already registered")) {
          setErrors((prev) => ({ ...prev, contact: null }));
        }
      }
    } catch (error) {
      console.error("Lookup error:", error);
      setLookupStatus(null);
    }
  };

  // Photo upload functions
  const selectImageFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your photo library",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowPhotoOptions(false);
        await handlePhotoUpload(result.assets[0]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to select image",
      });
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your camera",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowPhotoOptions(false);
        await handlePhotoUpload(result.assets[0]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to take photo",
      });
    }
  };

  const handlePhotoUpload = async (imageAsset) => {
    setPhotoUploading(true);
    try {
      const imageUri = imageAsset.uri;
      setProfilePhoto(imageUri);

      // Get presigned URL
      const response = await getClientPhotoUploadUrlAPI(gymId);

      if (response?.status !== 200 || !response?.presigned_url) {
        showToast({
          type: "error",
          title: response?.detail || "Failed to get upload URL",
        });
        setProfilePhoto(null);
        return;
      }

      const { presigned_url, s3_url } = response;

      // Upload to S3 using PUT
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();

      const uploadResponse = await fetch(presigned_url, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (uploadResponse.ok) {
        setUploadedPhotoUrl(s3_url);
        showToast({
          type: "success",
          title: "Photo uploaded successfully",
        });
      } else {
        const errorText = await uploadResponse.text();
        console.error("S3 upload failed:", errorText);
        showToast({
          type: "error",
          title: "Failed to upload photo",
        });
        setProfilePhoto(null);
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      showToast({
        type: "error",
        title: "Failed to upload photo",
      });
      setProfilePhoto(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = () => {
    // Check if client already exists
    if (lookupStatus === "exists") {
      showToast({
        type: "error",
        title: "Client already exists",
        desc: `${existingClient?.name} is already registered`,
      });
      return;
    }

    if (!validateForm()) {
      showToast({
        type: "error",
        title: "Please fix the errors",
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmationModal(false);

    try {
      setLoading(true);

      const payload = {
        gym_id: parseInt(gymId),
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() || null,
        gender: form.gender || null,
        date_of_birth: formatDateForSQL(form.dateOfBirth),
        height: parseFloat(form.height) || null,
        weight: parseFloat(form.weight) || null,
        goal: form.goal || null,
        admission_number: form.admissionNumber.trim() || null,
        plan_id: form.planId,
        batch_id: form.batchId,
        joined_at: formatDateForSQL(form.joinedAt),
        expires_at: formatDateForSQL(form.expiresAt),
        admission_fee: parseFloat(form.admissionFee) || 0,
        monthly_fee: parseFloat(form.monthlyFee) || 0,
        discount_amount: parseFloat(form.discountAmount) || 0,
        total_paid: parseFloat(form.totalPaid) || 0,
        balance_due: calculateBalanceDue(),
        payment_method: form.paymentMethod || null,
        notes: form.notes.trim() || null,
        entry_type: "manual",
        dp: uploadedPhotoUrl || null,
      };

      const response = await addManualClientAPI(payload);

      if (response?.status === 201 || response?.status === 200) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setShowSuccessModal(true);
        }, 2000);
      } else {
        showToast({
          type: "error",
          title: "Failed to add client",
          desc: response?.detail || response?.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error adding client:", error);
      showToast({
        type: "error",
        title: "Failed to add client",
        desc: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace("/owner/client");
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Manual Client Entry</Text>
      <Text style={styles.headerSubtitle}>
        Add client without QR code - CRM style
      </Text>
    </View>
  );

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = "default",
    required = false,
    onBlurCallback = null
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          style={[
            styles.input,
            errors[field] && styles.inputError,
            { flex: 1 },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={form[field]}
          onChangeText={(text) => {
            // For contact field, only allow digits and limit to 10
            let processedText = text;
            if (field === "contact") {
              processedText = text.replace(/\D/g, "").slice(0, 10);
            }
            setForm((prev) => ({ ...prev, [field]: processedText }));
            if (errors[field]) {
              setErrors((prev) => ({ ...prev, [field]: null }));
            }
          }}
          onBlur={onBlurCallback}
          keyboardType={keyboardType}
          maxLength={field === "contact" ? 10 : undefined}
        />
        {field === "contact" && lookupStatus === "checking" && (
          <ActivityIndicator
            size="small"
            color="#0078FF"
            style={{ marginLeft: 8 }}
          />
        )}
        {field === "contact" && lookupStatus === "new" && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#0078FF"
            style={{ marginLeft: 8 }}
          />
        )}
        {field === "contact" && lookupStatus === "exists" && (
          <Ionicons
            name="alert-circle"
            size={22}
            color="#ef4444"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderDatePicker = (
    label,
    field,
    showPicker,
    setShowPicker,
    required = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <View style={styles.datePickerWithReset}>
        <TouchableOpacity
          style={[styles.datePickerButton, errors[field] && styles.inputError]}
          onPress={() => {
            try {
              setTempDate(getSafeDate(form[field]));
              setShowPicker(true);
            } catch (e) {
              console.error(
                "[ManualClientEntry] renderDatePicker onPress error:",
                e
              );
              setTempDate(new Date());
              setShowPicker(true);
            }
          }}
        >
          <Text
            style={[
              styles.datePickerText,
              !form[field] && styles.placeholderText,
            ]}
          >
            {formatDateForDisplay(form[field])}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
        {form[field] && field === "expiresAt" && (
          <TouchableOpacity
            style={styles.resetDateButton}
            onPress={() => {
              setForm((prev) => ({ ...prev, [field]: null }));
            }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#FF3B30"
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderPicker = (
    label,
    field,
    options,
    placeholder,
    required = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <View
        style={[styles.pickerContainer, errors[field] && styles.inputError]}
      >
        <RNPickerSelect
          onValueChange={(value) => {
            setForm((prev) => ({ ...prev, [field]: value }));
            if (errors[field]) {
              setErrors((prev) => ({ ...prev, [field]: null }));
            }
          }}
          items={options}
          value={form[field]}
          placeholder={{ label: placeholder, value: null }}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
          Icon={() => (
            <Ionicons
              name="chevron-down"
              size={20}
              color="#666"
              style={{ marginRight: 12 }}
            />
          )}
          pickerProps={{
            itemStyle: {
              color: "#000000",
            },
          }}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <HardwareBackHandler onBackPress={() => false} />

      {/* Simple Header with Back Button */}
      <View style={styles.simpleHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Manual Entry</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {showConfetti && <ConfettiAnimation xpPoints={0} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account"
                size={22}
                color="#0078FF"
              />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            {/* Profile Photo Upload */}
            <View style={styles.photoUploadContainer}>
              <TouchableOpacity
                style={styles.photoCircle}
                onPress={() => setShowPhotoOptions(!showPhotoOptions)}
                disabled={photoUploading}
              >
                {photoUploading ? (
                  <ActivityIndicator size="large" color="#0078FF" />
                ) : profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={styles.profileImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color="#999" />
                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoHintText}>Tap to add client photo</Text>

              {/* Photo Options Modal */}
              {showPhotoOptions && (
                <View style={styles.photoOptionsContainer}>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={selectImageFromGallery}
                  >
                    <Ionicons name="images-outline" size={22} color="#0078FF" />
                    <Text style={styles.photoOptionText}>
                      Choose from Gallery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={takePhotoWithCamera}
                  >
                    <Ionicons name="camera-outline" size={22} color="#0078FF" />
                    <Text style={styles.photoOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.photoOptionButton,
                      styles.cancelOptionButton,
                    ]}
                    onPress={() => setShowPhotoOptions(false)}
                  >
                    <Text style={styles.cancelOptionText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {renderInput("Name", "name", "Enter client name", "default", true)}
            {renderInput(
              "Contact",
              "contact",
              "10-digit mobile number",
              "phone-pad",
              true,
              handleContactBlur
            )}
            {renderInput(
              "Email",
              "email",
              "Email address (optional)",
              "email-address"
            )}

            {renderPicker("Gender", "gender", genderOptions, "Select gender")}

            {renderDatePicker(
              "Date of Birth",
              "dateOfBirth",
              showDOBPicker,
              setShowDOBPicker
            )}
          </View>

          {/* Physical Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="human" size={22} color="#0078FF" />
              <Text style={styles.sectionTitle}>Physical Info (Optional)</Text>
            </View>

            {renderInput("Height (cm)", "height", "e.g. 170", "numeric")}
            {renderInput("Weight (kg)", "weight", "e.g. 70", "numeric")}

            {renderPicker("Fitness Goal", "goal", goalOptions, "Select goal")}
          </View>

          {/* Membership Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="card-account-details"
                size={22}
                color="#0078FF"
              />
              <Text style={styles.sectionTitle}>Membership Details</Text>
            </View>

            {renderInput(
              "Admission Number",
              "admissionNumber",
              "Your custom ID (optional)"
            )}

            {/* Plan Selection with Radio Buttons and Cards */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Plan
                <Text style={styles.requiredStar}> *</Text>
              </Text>

              {/* Plan Category Radio Buttons */}
              <View style={styles.planTypeRadioContainer}>
                <TouchableOpacity
                  style={styles.planTypeRadioButton}
                  onPress={() => {
                    setSelectedPlanCategory("gym_membership");
                    setForm((prev) => ({ ...prev, planId: "" }));
                    if (errors.planId) {
                      setErrors((prev) => ({ ...prev, planId: null }));
                    }
                  }}
                >
                  <View style={styles.radioButton}>
                    {selectedPlanCategory === "gym_membership" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.planTypeRadioText,
                      selectedPlanCategory === "gym_membership" &&
                        styles.planTypeRadioTextActive,
                    ]}
                  >
                    Membership
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.planTypeRadioButton}
                  onPress={() => {
                    setSelectedPlanCategory("personal_training");
                    setForm((prev) => ({ ...prev, planId: "" }));
                    if (errors.planId) {
                      setErrors((prev) => ({ ...prev, planId: null }));
                    }
                  }}
                >
                  <View style={styles.radioButton}>
                    {selectedPlanCategory === "personal_training" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.planTypeRadioText,
                      selectedPlanCategory === "personal_training" &&
                        styles.planTypeRadioTextActive,
                    ]}
                  >
                    Personal Training
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Plan Cards */}
              <View style={styles.planCategoryContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.planCardsScroll}
                >
                  {plans
                    .filter((plan) =>
                      selectedPlanCategory === "gym_membership"
                        ? !plan.personal_training
                        : plan.personal_training
                    )
                    .map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planCard,
                          selectedPlanCategory === "personal_training" &&
                            styles.planCardPT,
                          form.planId === plan.id &&
                            (selectedPlanCategory === "gym_membership"
                              ? styles.planCardSelected
                              : styles.planCardSelectedPT),
                        ]}
                        onPress={() => {
                          setForm((prev) => ({
                            ...prev,
                            planId: plan.id,
                            monthlyFee: plan.amount?.toString() || "",
                          }));
                          if (errors.planId) {
                            setErrors((prev) => ({ ...prev, planId: null }));
                          }
                        }}
                      >
                        {form.planId === plan.id ? (
                          <View
                            style={
                              selectedPlanCategory === "gym_membership"
                                ? styles.planCardSelectedBadge
                                : styles.planCardSelectedBadgePT
                            }
                          >
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={20}
                              color="#fff"
                            />
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.planCardDuration,
                            form.planId === plan.id &&
                              styles.planCardDurationSelected,
                          ]}
                        >
                          {plan.plans || ""}
                        </Text>
                        <View style={styles.planCardPriceContainer}>
                          {plan.original > plan.amount ? (
                            <Text style={styles.planCardOriginalPrice}>
                              ₹{plan.original || 0}
                            </Text>
                          ) : null}
                          <Text
                            style={[
                              styles.planCardPrice,
                              form.planId === plan.id &&
                                styles.planCardPriceSelected,
                            ]}
                          >
                            ₹{plan.amount || 0}
                          </Text>
                        </View>

                        <View style={styles.planCardBonusBadge}>
                          <Text style={styles.planCardBonusText}>
                            {plan.duration} Month {plan.bonus ? "+" : ""}
                            {plan.bonus || ""} {plan.bonus_type || ""}
                          </Text>
                        </View>

                        {plan.pause ? (
                          <View style={styles.planCardPauseInfo}>
                            <MaterialCommunityIcons
                              name="pause-circle-outline"
                              size={14}
                              color="#6b7280"
                            />
                            <Text style={styles.planCardPauseText}>
                              {plan.pause} {plan.pause_type || ""} pause
                            </Text>
                          </View>
                        ) : null}
                        {plan.is_couple ? (
                          <View style={styles.planCardCoupleBadge}>
                            <MaterialCommunityIcons
                              name="account-multiple"
                              size={12}
                              color="#EC4899"
                            />
                            <Text style={styles.planCardCoupleText}>
                              Couple Plan
                            </Text>
                          </View>
                        ) : null}
                        {plan.is_buddy ? (
                          <View style={styles.planCardBuddyBadge}>
                            <MaterialCommunityIcons
                              name="account-group"
                              size={12}
                              color="#8B5CF6"
                            />
                            <Text style={styles.planCardBuddyText}>
                              Buddy Plan
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {errors.planId && (
                <Text style={styles.errorText}>{errors.planId}</Text>
              )}
            </View>

            {renderPicker(
              "Batch",
              "batchId",
              Array.isArray(batches)
                ? batches
                    .map((b) => ({
                      label: b?.batch_name || "Unknown Batch",
                      value: b?.id,
                    }))
                    .filter((item) => item.value != null)
                : [],
              "Select a batch",
              true
            )}

            {renderDatePicker(
              "Joined Date",
              "joinedAt",
              showJoinedDatePicker,
              setShowJoinedDatePicker
            )}

            {renderDatePicker(
              "Expiry Date",
              "expiresAt",
              showExpiryDatePicker,
              setShowExpiryDatePicker
            )}
          </View>

          {/* Fees Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cash" size={22} color="#0078FF" />
              <Text style={styles.sectionTitle}>Fees</Text>
            </View>

            {renderInput(
              "One Time Admission Fee (Optional)",
              "admissionFee",
              "₹0",
              "numeric"
            )}
            {renderInput(
              "Plan Fee",
              "monthlyFee",
              "₹0 (auto from plan)",
              "numeric"
            )}
            {renderInput("Discount", "discountAmount", "₹0", "numeric")}
            {renderInput("Amount Paid", "totalPaid", "₹0", "numeric")}

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Balance Due:</Text>
              <Text style={styles.balanceAmount}>₹{calculateBalanceDue()}</Text>
            </View>

            {renderPicker(
              "Payment Method",
              "paymentMethod",
              paymentMethodOptions,
              "Select method"
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="note-text"
                size={22}
                color="#0078FF"
              />
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes about this client..."
              placeholderTextColor="#999"
              value={form.notes}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, notes: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Add Client</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {Platform.OS === "ios" ? (
        <>
          <CustomIOSDatePicker
            visible={showDOBPicker}
            onClose={() => setShowDOBPicker(false)}
            onConfirm={(date) => {
              try {
                const safeDate = getSafeDate(date);
                setForm((prev) => ({ ...prev, dateOfBirth: safeDate }));
              } catch (e) {
                console.error("[ManualClientEntry] DOB confirm error:", e);
              }
              setShowDOBPicker(false);
            }}
            initialDate={getSafeDate(form.dateOfBirth)}
            maximumDate={new Date()}
            title="Select Date of Birth"
          />
          <CustomIOSDatePicker
            visible={showJoinedDatePicker}
            onClose={() => setShowJoinedDatePicker(false)}
            onConfirm={(date) => {
              try {
                const safeDate = getSafeDate(date);
                setForm((prev) => ({ ...prev, joinedAt: safeDate }));
              } catch (e) {
                console.error(
                  "[ManualClientEntry] Joined date confirm error:",
                  e
                );
              }
              setShowJoinedDatePicker(false);
            }}
            initialDate={getSafeDate(form.joinedAt)}
            title="Select Joined Date"
          />
          <CustomIOSDatePicker
            visible={showExpiryDatePicker}
            onClose={() => setShowExpiryDatePicker(false)}
            onConfirm={(date) => {
              try {
                const safeDate = getSafeDate(date);
                setForm((prev) => ({ ...prev, expiresAt: safeDate }));
              } catch (e) {
                console.error(
                  "[ManualClientEntry] Expiry date confirm error:",
                  e
                );
              }
              setShowExpiryDatePicker(false);
            }}
            initialDate={getSafeDate(form.expiresAt)}
            title="Select Expiry Date"
          />
        </>
      ) : (
        <>
          {showDOBPicker && (
            <DateTimePicker
              value={
                tempDate instanceof Date && !isNaN(tempDate)
                  ? tempDate
                  : new Date()
              }
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, date) => {
                try {
                  setShowDOBPicker(false);
                  if (date && date instanceof Date && !isNaN(date)) {
                    setForm((prev) => ({ ...prev, dateOfBirth: date }));
                  }
                } catch (e) {
                  console.error("[ManualClientEntry] DOB picker error:", e);
                  setShowDOBPicker(false);
                }
              }}
            />
          )}
          {showJoinedDatePicker && (
            <DateTimePicker
              value={
                tempDate instanceof Date && !isNaN(tempDate)
                  ? tempDate
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={(event, date) => {
                try {
                  setShowJoinedDatePicker(false);
                  if (date && date instanceof Date && !isNaN(date)) {
                    setForm((prev) => ({ ...prev, joinedAt: date }));
                  }
                } catch (e) {
                  console.error(
                    "[ManualClientEntry] Joined date picker error:",
                    e
                  );
                  setShowJoinedDatePicker(false);
                }
              }}
            />
          )}
          {showExpiryDatePicker && (
            <DateTimePicker
              value={
                tempDate instanceof Date && !isNaN(tempDate)
                  ? tempDate
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={(event, date) => {
                try {
                  setShowExpiryDatePicker(false);
                  if (date && date instanceof Date && !isNaN(date)) {
                    setForm((prev) => ({ ...prev, expiresAt: date }));
                  }
                } catch (e) {
                  console.error(
                    "[ManualClientEntry] Expiry date picker error:",
                    e
                  );
                  setShowExpiryDatePicker(false);
                }
              }}
            />
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Verify Client Details</Text>

            <View style={styles.confirmationDetailRow}>
              <Text style={styles.confirmationLabel}>Name:</Text>
              <Text style={styles.confirmationValue}>{form.name}</Text>
            </View>

            <View style={styles.confirmationDetailRow}>
              <Text style={styles.confirmationLabel}>Contact:</Text>
              <Text style={styles.confirmationValue}>{form.contact}</Text>
            </View>

            <View style={styles.confirmationDetailRow}>
              <Text style={styles.confirmationLabel}>Amount Paid:</Text>
              <Text style={styles.confirmationValue}>
                ₹{parseFloat(form.totalPaid) || 0}
              </Text>
            </View>

            <View style={styles.confirmationButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmationButton,
                  styles.confirmationCancelButton,
                ]}
                onPress={() => setShowConfirmationModal(false)}
                disabled={loading}
              >
                <Text style={styles.confirmationCancelText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmationButton,
                  styles.confirmationConfirmButton,
                ]}
                onPress={confirmSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmationConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={60}
                color="#0078FF"
              />
            </View>
            <Text style={styles.successTitle}>Client Added!</Text>
            <Text style={styles.successMessage}>
              {form.name} has been added successfully.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  simpleHeaderTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  photoUploadContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  photoHintText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  photoOptionsContainer: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    width: "100%",
  },
  photoOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  photoOptionText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 12,
  },
  cancelOptionButton: {
    justifyContent: "center",
    borderBottomWidth: 0,
  },
  cancelOptionText: {
    fontSize: 15,
    color: "#ef4444",
    fontWeight: "500",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  requiredStar: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: isTablet ? 14 : 12,
    fontSize: isTablet ? 16 : 15,
    color: "#1a1a1a",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  datePickerWithReset: {
    position: "relative",
  },
  datePickerButton: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: isTablet ? 14 : 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: isTablet ? 16 : 15,
    color: "#1a1a1a",
  },
  placeholderText: {
    color: "#999",
  },
  resetDateButton: {
    position: "absolute",
    top: -15,
    right: -15,
  },
  pickerContainer: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  planTypeRadioContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  planTypeRadioButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0078FF",
  },
  planTypeRadioText: {
    fontSize: isTablet ? 15 : 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  planTypeRadioTextActive: {
    color: "#0078FF",
    fontWeight: "600",
  },
  planCategoryContainer: {
    marginBottom: 12,
  },
  planCardsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  planCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  planCardPT: {
    borderColor: "#fed7aa",
  },
  planCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  planCardSelectedPT: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
  },
  planCardSelectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12,
  },
  planCardSelectedBadgePT: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
  },
  planCardDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  planCardDurationSelected: {
    color: "#6366f1",
  },
  planCardPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planCardOriginalPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  planCardPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C3E50",
  },
  planCardPriceSelected: {
    color: "#6366f1",
  },
  planCardBonusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  planCardBonusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#16a34a",
  },
  planCardPauseInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  planCardPauseText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  planCardCoupleBadge: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  planCardCoupleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EC4899",
    marginLeft: 4,
  },
  planCardBuddyBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  planCardBuddyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 4,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: "500",
    color: "#0078FF",
  },
  balanceAmount: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
    color: "#0078FF",
  },
  notesInput: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: isTablet ? 14 : 12,
    fontSize: isTablet ? 16 : 15,
    color: "#1a1a1a",
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#0078FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: isTablet ? 24 : 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: isTablet ? 16 : 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#0078FF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  successButtonText: {
    color: "#fff",
    fontSize: isTablet ? 16 : 15,
    fontWeight: "600",
  },
  confirmationModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmationDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  confirmationLabel: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: "500",
    color: "#666",
  },
  confirmationValue: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  confirmationButtonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationCancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmationConfirmButton: {
    backgroundColor: "#0078FF",
  },
  confirmationCancelText: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: "600",
    color: "#666",
  },
  confirmationConfirmText: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: "600",
    color: "#fff",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: isTablet ? 16 : 15,
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 14 : 12,
    paddingRight: 36,
    color: "#1a1a1a",
  },
  inputAndroid: {
    fontSize: isTablet ? 16 : 15,
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 14 : 12,
    paddingRight: 36,
    color: "#1a1a1a",
  },
  placeholder: {
    color: "#999",
  },
  iconContainer: {
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});

export default ManualClientEntry;
