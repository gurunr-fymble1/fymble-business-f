import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform,
  Modal,
  Alert,
  FlatList,
  Switch,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomTimePicker from "../components/ui/CustomTimePicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  registerAPI,
  checkMobileAvailability,
  getBankDetailsFromIFSC,
  getRegistrationPhotosPresignedUrls,
  confirmRegistrationPhotoUpload,
  cleanupRegistrationPhoto,
  checkReferralAPI,
} from "../services/Api";
import { FontFamily } from "../GlobalStyles";
import { showToast } from "../utils/Toaster";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

// Gym area sections configuration
const GYM_AREAS = [
  {
    id: "entrance",
    name: "Entrance",
    icon: "login",
    iconLibrary: "MaterialIcons",
    description: "Main entrance and signage",
    color: "#4CAF50",
  },
  {
    id: "cardio",
    name: "Cardio Area",
    icon: "favorite",
    iconLibrary: "MaterialIcons",
    description: "Treadmills, bikes",
    color: "#FF5722",
  },
  {
    id: "weight",
    name: "Weight Area",
    icon: "fitness-center",
    iconLibrary: "MaterialIcons",
    description: "Free weights and machine",
    color: "#FF9800",
  },
  {
    id: "locker",
    name: "Locker Room",
    icon: "lock-closed",
    iconLibrary: "Ionicons",
    description: "Changing rooms",
    color: "#9C27B0",
  },
  {
    id: "reception",
    name: "Reception",
    icon: "desk",
    iconLibrary: "MaterialIcons",
    description: "Front desk and waiting area",
    color: "#2196F3",
  },
  {
    id: "other",
    name: "Other Areas",
    icon: "more-horiz",
    iconLibrary: "MaterialIcons",
    description: "Any other facility areas",
    color: "#607D8B",
  },
];

const register = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentGymIndex, setCurrentGymIndex] = useState(0);
  const [form, setForm] = useState({
    // Owner details
    name: "",
    dob: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    referralId: "",
    // Gym details
    gyms: [
      {
        name: "",
        services: [],
        customService: "",
        operatingHours: [
          {
            id: Date.now(),
            startTime: null,
            endTime: null,
            day: "everyday",
          },
        ],
        contactNumber: "",
        sameAsOwner: false,
        totalTrainers: "",
        floorSpace: "",
        totalMachineries: "",
        yearlyMembershipCost: "",
        address: {
          street: "",
          area: "",
          city: "",
          state: "",
          pincode: "",
        },
        photos: [],
        areaPhotos: {},
        accountDetails: {
          accountNumber: "",
          confirmAccountNumber: "",
          ifscCode: "",
          accountHolderName: "",
          bankName: "",
          branchName: "",
          upiId: "",
          gstNumber: "",
          gstType: "no_gst",
          gstPercentage: "18",
        },
        sameAsPreviousGym: false,
      },
    ],
  });

  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDob, setTempDob] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState({
    show: false,
    rangeId: null,
    type: "",
  });
  const [showPhotoSection, setShowPhotoSection] = useState({});
  const [mobileCheckLoading, setMobileCheckLoading] = useState(false);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralOwnerName, setReferralOwnerName] = useState("");
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCheckLoading, setReferralCheckLoading] = useState(false);
  const scrollViewRef = React.useRef(null);

  const services = [
    "General Fitness",
    "Weight Training",
    "Cardio",
    "Personal Training",
    "Group Classes",
    "Yoga",
    "Pilates",
    "CrossFit",
    "Swimming",
    "Martial Arts",
    "Dance",
    "Physiotherapy",
    "Nutrition Counseling",
    "Sports Training",
    "Other",
  ];

  const gstTypes = [
    { label: "GST Inclusive", value: "inclusive" },
    { label: "GST Exclusive", value: "exclusive" },
    { label: "No GST", value: "no_gst" },
  ];

  // Process upload queue sequentially
  useEffect(() => {
    if (uploadQueue.length > 0 && !isProcessingUpload) {
      processNextUpload();
    }
  }, [uploadQueue, isProcessingUpload]);

  // Mobile availability check
  const checkMobileAvailabilityAPI = async (mobile) => {
    if (!/^\d{10}$/.test(mobile)) return;

    setMobileCheckLoading(true);
    try {
      const response = await checkMobileAvailability(mobile);

      if (response?.status === 200 && response?.exists) {
        setErrors((prev) => ({
          ...prev,
          mobile: "Mobile number already registered",
        }));
      } else {
        // Clear mobile error if number is available
        setErrors((prev) => {
          const newErrors = { ...prev };
          // Only clear mobile error if it was about availability, not format
          if (prev.mobile === "Mobile number already registered") {
            delete newErrors.mobile;
          }
          return newErrors;
        });
      }
    } catch (error) {
    } finally {
      setMobileCheckLoading(false);
    }
  };

  // IFSC code validation and bank details fetch
  const fetchBankDetails = async (ifscCode, gymIndex) => {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) return;

    setBankDetailsLoading(true);
    try {
      const response = await getBankDetailsFromIFSC(ifscCode);
      if (response.status === 200 && response.data) {
        const updatedGyms = [...form.gyms];
        updatedGyms[gymIndex].accountDetails = {
          ...updatedGyms[gymIndex].accountDetails,
          bankName: response.data.BANK,
          branchName: response.data.BRANCH,
        };
        updatedGyms[gymIndex].ifscVerified = true;
        setForm((prev) => ({ ...prev, gyms: updatedGyms }));
      }
    } catch (error) {
    } finally {
      setBankDetailsLoading(false);
    }
  };

  // Photo upload handling
  const handlePhotoUpload = async (gymIndex) => {
    Alert.alert("Select Photo Source", "Choose how you want to add photos", [
      {
        text: "Camera",
        onPress: async () => {
          try {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              showToast({
                type: "error",
                title: "Permission denied",
                message: "Camera permission is required!",
              });
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });

            if (!result.canceled) {
              const updatedGyms = [...form.gyms];
              updatedGyms[gymIndex].photos = [
                ...updatedGyms[gymIndex].photos,
                ...result.assets,
              ];
              setForm((prev) => ({ ...prev, gyms: updatedGyms }));
            }
          } catch (error) {
            console.error("Camera error:", error);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.8,
            });

            if (!result.canceled) {
              const updatedGyms = [...form.gyms];
              updatedGyms[gymIndex].photos = [
                ...updatedGyms[gymIndex].photos,
                ...result.assets,
              ];
              setForm((prev) => ({ ...prev, gyms: updatedGyms }));
            }
          } catch (error) {
            console.error("Gallery error:", error);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Time picker handling
  const addTimeRange = (gymIndex) => {
    const newTimeRange = {
      id: Date.now(),
      startTime: "",
      endTime: "",
      day: "everyday",
    };

    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex].operatingHours = [
      ...(updatedGyms[gymIndex].operatingHours || []),
      newTimeRange,
    ];
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  const removeTimeRange = (gymIndex, id) => {
    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex].operatingHours =
      updatedGyms[gymIndex].operatingHours?.filter(
        (range) => range.id !== id,
      ) || [];
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  const updateTimeRange = (gymIndex, id, field, value) => {
    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex].operatingHours =
      updatedGyms[gymIndex].operatingHours?.map((range) =>
        range.id === id ? { ...range, [field]: value } : range,
      ) || [];
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  const formatTime = (time) => {
    if (!time) return "";

    // If it's an ISO string, parse it directly
    if (typeof time === "string" && time.includes("T")) {
      const timeMatch = time.match(/T(\d{2}):(\d{2})/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2];
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
      }
    }

    // Fallback to Date parsing
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const onTimeChange = (selectedTime) => {
    if (selectedTime && showTimePicker.rangeId && showTimePicker.type) {
      updateTimeRange(
        currentGymIndex,
        showTimePicker.rangeId,
        showTimePicker.type === "start" ? "startTime" : "endTime",
        selectedTime,
      );
    }
    setShowTimePicker({ show: false, rangeId: null, type: "" });
  };

  const handleGymChange = (index, field, value, subField = null) => {
    const updatedGyms = [...form.gyms];

    if (subField) {
      updatedGyms[index][field][subField] = value;
    } else {
      updatedGyms[index][field] = value;
    }

    // Handle same as owner toggle
    if (field === "sameAsOwner") {
      if (value) {
        updatedGyms[index].contactNumber = form.mobile;
      } else {
        updatedGyms[index].contactNumber = "";
      }
    }

    // Handle GST type change - auto-set percentage for inclusive/exclusive
    if (field === "accountDetails" && subField === "gstType") {
      if (value === "inclusive" || value === "exclusive") {
        updatedGyms[index].accountDetails.gstPercentage = "18";
      }
    }

    // Mark IFSC as unverified when user edits
    if (field === "accountDetails" && subField === "ifscCode") {
      updatedGyms[index].ifscVerified = false;
    }

    setForm((prevForm) => ({ ...prevForm, gyms: updatedGyms }));

    const fieldId = subField
      ? `gym${index}${field}${subField}`
      : `gym${index}${field}`;

    setTouchedFields((prev) => ({
      ...prev,
      [fieldId]: true,
    }));

    // IFSC code handling - removed auto-check, now manual via button

    // Always validate immediately when gym field changes
    validateGymField(index, field, value, subField);
  };

  const toggleService = (gymIndex, service) => {
    const updatedGyms = [...form.gyms];
    const currentServices = updatedGyms[gymIndex].services || [];

    if (currentServices.includes(service)) {
      updatedGyms[gymIndex].services = currentServices.filter(
        (s) => s !== service,
      );
    } else {
      updatedGyms[gymIndex].services = [...currentServices, service];
    }

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  const addCustomServiceToPills = (gymIndex) => {
    const customService = form.gyms[gymIndex].customService.trim();
    if (!customService) return;

    const updatedGyms = [...form.gyms];
    const currentServices = updatedGyms[gymIndex].services || [];

    // Add the custom service to the services array if not already present
    if (!currentServices.includes(customService)) {
      updatedGyms[gymIndex].services = [...currentServices, customService];
    }

    // Clear the custom service input
    updatedGyms[gymIndex].customService = "";

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  const renderAreaIcon = (area) => {
    if (area.iconLibrary === "MaterialIcons") {
      return <MaterialIcons name={area.icon} size={24} color={area.color} />;
    } else {
      return <Ionicons name={area.icon} size={24} color={area.color} />;
    }
  };

  const pickImageForArea = async (gymIndex, areaId) => {
    const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name || areaId;

    Alert.alert(
      "Select Photo Source",
      `Choose how you want to add ${areaName} photo`,
      [
        {
          text: "Camera",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                showToast({
                  type: "error",
                  title: "Permission denied",
                  message: "Camera permission is required!",
                });
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                queueUpload(gymIndex, areaId, imageUri, areaName);
              }
            } catch (error) {
              console.error("Camera error:", error);
              showToast({ type: "error", title: "Failed to capture image" });
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

              if (status !== "granted") {
                showToast({
                  type: "error",
                  title: "Permission denied",
                  message: "Gallery permission is required!",
                });
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsMultipleSelection: false,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                queueUpload(gymIndex, areaId, imageUri, areaName);
              }
            } catch (error) {
              console.error("Gallery error:", error);
              showToast({ type: "error", title: "Failed to select image" });
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  // Process upload queue sequentially
  const processNextUpload = async () => {
    if (uploadQueue.length === 0 || isProcessingUpload) return;

    setIsProcessingUpload(true);
    const nextUpload = uploadQueue[0];

    const maxRetries = 3;
    const currentRetry = nextUpload.retryCount || 0;

    try {
      await performActualUpload(nextUpload);

      // Remove completed upload from queue
      setUploadQueue((prev) => prev.slice(1));

      showToast({
        type: "success",
        title: `${nextUpload.areaName} photo uploaded successfully`,
      });
    } catch (error) {
      if (currentRetry < maxRetries - 1) {
        // Retry: Update retry count and keep in queue
        setUploadQueue((prev) =>
          prev.map((item, index) =>
            index === 0
              ? { ...item, retryCount: currentRetry + 1, status: "retrying" }
              : item,
          ),
        );

        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Don't change isProcessingUpload, let it retry immediately
        setIsProcessingUpload(false);
        return;
      } else {
        // Max retries reached: mark as failed and remove from queue
        setUploadQueue((prev) => prev.slice(1));

        showToast({
          type: "error",
          title: `Failed to upload ${nextUpload.areaName} photo after ${maxRetries} attempts`,
        });
      }
    } finally {
      setIsProcessingUpload(false);
      // Small delay to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // Queue upload function
  const queueUpload = (gymIndex, areaId, imageUri, areaName) => {
    const queueId = Date.now() + Math.random();

    setUploadQueue((prev) => {
      const newQueue = [
        ...prev,
        {
          id: queueId,
          gymIndex,
          areaId,
          imageUri,
          areaName,
          status: "queued",
        },
      ];

      return newQueue;
    });

    showToast({
      type: "info",
      title: `${areaName} photo added to upload queue`,
    });
  };

  // Perform the actual upload
  const performActualUpload = async (uploadItem) => {
    const { gymIndex, areaId, imageUri, areaName } = uploadItem;

    // Get file extension from URI or default to jpg
    const fileName = `gym_${areaId}_${Date.now()}.jpg`;
    const fileExtension = fileName.split(".").pop();

    // Step 1: Get presigned URL for registration photo upload
    const presignedPayload = {
      owner_contact: form.mobile, // Use mobile as temp identifier
      gym_index: gymIndex, // Which gym this photo belongs to
      gym_name: form.gyms[gymIndex]?.name || `Gym ${gymIndex + 1}`, // Gym name for reference
      media: [
        {
          type: "image",
          fileName: fileName,
          contentType: "image/jpeg",
          extension: fileExtension,
          area_type: areaId,
        },
      ],
    };

    const presignedResponse =
      await getRegistrationPhotosPresignedUrls(presignedPayload);

    if (presignedResponse?.status !== 200) {
      console.error("Failed to get presigned URL:", presignedResponse);
      throw new Error("Failed to get presigned URL");
    }

    const presignedData = presignedResponse.data.presigned_urls[0];
    const { upload_url, cdn_url, photo_id } = presignedData;

    // Step 2: Upload image to S3 using presigned POST
    const formData = new FormData();

    // Add all the fields from the presigned POST
    Object.entries(upload_url.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add the file (must be last)
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: fileName,
    });

    const uploadResponse = await fetch(upload_url.url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!uploadResponse.ok) {
      return;
    }

    // Step 3: Confirm upload completion
    const confirmPayload = {
      cdn_url: cdn_url,
      owner_contact: form.mobile,
      gym_index: gymIndex, // Which gym this photo belongs to
      photo_id: photo_id,
      area_type: areaId,
    };

    const confirmResponse =
      await confirmRegistrationPhotoUpload(confirmPayload);

    if (confirmResponse?.status !== 200) {
      return;
    }

    // Update form with successful upload
    const updatedGyms = [...form.gyms];

    if (!updatedGyms[gymIndex].areaPhotos) {
      updatedGyms[gymIndex].areaPhotos = {};
    }

    // Store both URL and photo_id for cleanup purposes, plus fileName and areaName for payload
    updatedGyms[gymIndex].areaPhotos[areaId] = {
      url: cdn_url,
      photo_id: photo_id,
      fileName: fileName,
      area_type: areaId,
    };

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
  };

  // Retry failed upload
  const retryFailedUpload = (failedItem) => {
    // Remove the failed item from queue
    setUploadQueue((prev) => prev.filter((item) => item.id !== failedItem.id));

    // Re-queue the upload
    queueUpload(
      failedItem.gymIndex,
      failedItem.areaId,
      failedItem.imageUri,
      failedItem.areaName,
    );
  };

  // Clear all failed uploads
  const clearFailedUploads = () => {
    setUploadQueue((prev) => prev.filter((item) => item.status !== "failed"));
    showToast({
      type: "info",
      title: "Failed uploads cleared",
    });
  };

  const uploadImageToServer = async (imageUri, areaId, gymIndex, areaType) => {
    try {
      // Get file extension from URI or default to jpg
      const fileName = `gym_${areaType}_${Date.now()}.jpg`;
      const fileExtension = fileName.split(".").pop();

      // Step 1: Get presigned URL for registration photo upload
      const presignedPayload = {
        owner_contact: form.mobile, // Use mobile as temp identifier
        gym_index: gymIndex, // Which gym this photo belongs to
        gym_name: form.gyms[gymIndex]?.name || `Gym ${gymIndex + 1}`, // Gym name for reference
        media: [
          {
            type: "image",
            fileName: fileName,
            contentType: "image/jpeg",
            extension: fileExtension,
            area_type: areaType,
          },
        ],
      };

      const presignedResponse =
        await getRegistrationPhotosPresignedUrls(presignedPayload);

      if (presignedResponse?.status !== 200) {
        return;
      }

      const presignedData = presignedResponse.data.presigned_urls[0];
      const { upload_url, cdn_url, photo_id } = presignedData;

      // Step 2: Upload image to S3 using presigned POST
      const formData = new FormData();

      // Add all the fields from the presigned POST
      Object.entries(upload_url.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add the file (must be last)
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: fileName,
      });

      const uploadResponse = await fetch(upload_url.url, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!uploadResponse.ok) {
        return;
      }
      // Step 3: Confirm upload completion
      const confirmPayload = {
        cdn_url: cdn_url,
        owner_contact: form.mobile,
        gym_index: gymIndex, // Which gym this photo belongs to
        photo_id: photo_id,
        area_type: areaType,
      };

      const confirmResponse =
        await confirmRegistrationPhotoUpload(confirmPayload);

      if (confirmResponse?.status === 200) {
        return {
          photo_id: photo_id,
          url: cdn_url,
          area_type: areaType,
        };
      } else {
        return;
      }
    } catch (error) {
      return;
    }
  };

  const removeAreaPhoto = async (gymIndex, areaId) => {
    const updatedGyms = [...form.gyms];
    let photo_id = null;

    // Get photo_id before deleting for Redis cleanup
    if (
      updatedGyms[gymIndex].areaPhotos &&
      updatedGyms[gymIndex].areaPhotos[areaId]
    ) {
      const photoData = updatedGyms[gymIndex].areaPhotos[areaId];
      // Extract photo_id only if it's the new object format
      if (
        typeof photoData === "object" &&
        photoData !== null &&
        !Array.isArray(photoData) &&
        photoData.photo_id
      ) {
        photo_id = photoData.photo_id;
      }
      delete updatedGyms[gymIndex].areaPhotos[areaId];
    }

    // Remove from upload queue
    setUploadQueue((prev) =>
      prev.filter(
        (item) => !(item.gymIndex === gymIndex && item.areaId === areaId),
      ),
    );

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    // Clean up Redis if photo_id exists
    if (photo_id && form.mobile) {
      try {
        const result = await cleanupRegistrationPhoto(
          form.mobile,
          photo_id,
          gymIndex,
        );
      } catch (error) {
        console.warn("Redis cleanup error:", error);
        // Don't show error to user for cleanup failures
      }
    }

    showToast({
      type: "info",
      title: `${GYM_AREAS.find((a) => a.id === areaId)?.name} photo removed`,
    });
  };

  const validateGymField = (index, field, value, subField = null) => {
    const fieldId = subField
      ? `gym${index}${field}${subField}`
      : `gym${index}${field}`;
    let error = null;
    const gym = form.gyms[index];

    // Special validation for account details
    if (field === "accountDetails" && subField) {
      switch (subField) {
        case "accountNumber":
          if (!value || !value.trim()) {
            error = "Account number is required";
          } else if (!/^\d{9,18}$/.test(value.trim())) {
            error = "Account number must be 9-18 digits";
          }
          break;
        case "confirmAccountNumber":
          if (!value || !value.trim()) {
            error = "Please confirm your account number";
          } else if (
            gym &&
            gym.accountDetails &&
            gym.accountDetails.accountNumber !== value
          ) {
            error = "Account numbers do not match";
          }
          break;
        case "ifscCode":
          if (!value || !value.trim()) {
            error = "IFSC code is required";
          } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim())) {
            error = "Invalid IFSC code format";
          }
          break;
        case "accountHolderName":
          if (!value || !value.trim()) {
            error = "Account holder name is required";
          }
          break;
        case "upiId":
          if (
            value &&
            value.trim() &&
            !/^[\w\.\-]+@[\w\-]+$/.test(value.trim())
          ) {
            error = "Invalid UPI ID format (example: user@paytm)";
          }
          break;
        case "gstType":
          if (!value || !value.trim()) {
            error = "GST type is required";
          }
          break;
      }
    } else {
      // General validation for other fields
      if (!value || (typeof value === "string" && !value.trim())) {
        error = `${subField ? subField : field} is required`;
      }
    }

    // Update errors state
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldId] = error;
      } else {
        delete newErrors[fieldId];
      }
      return newErrors;
    });

    return error !== null;
  };

  const validateField = (field, value) => {
    let error = null;

    switch (field) {
      case "name":
        if (!value.trim()) error = "Full name is required";
        break;
      case "dob":
        if (!value) {
          error = "Date of birth is required";
        } else {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          if (age < 18) {
            error = "You must be at least 18 years old to register";
          }
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "mobile":
        if (!value.trim()) {
          error = "Mobile number is required";
        } else if (!/^\d{10}$/.test(value)) {
          error = "Invalid mobile number";
        } else {
          // Only check availability for valid 10-digit numbers
          checkMobileAvailabilityAPI(value);
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 8) {
          error = "Password must be at least 8 characters";
        }
        break;
      case "confirmPassword":
        if (value !== form.password) {
          error = "Passwords do not match";
        }
        break;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return error;
  };

  const addGymField = () => {
    const newGym = {
      name: "",
      services: [],
      customService: "",
      operatingHours: [
        {
          id: Date.now(),
          startTime: null,
          endTime: null,
          day: "everyday",
        },
      ],
      contactNumber: "",
      sameAsOwner: false,
      totalTrainers: "",
      floorSpace: "",
      totalMachineries: "",
      yearlyMembershipCost: "",
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
      },
      photos: [],
      areaPhotos: {},
      accountDetails: {
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
        branchName: "",
        upiId: "",
        gstNumber: "",
        gstType: "no_gst",
        gstPercentage: "18",
      },
      ifscVerified: false,
      sameAsPreviousGym: false,
    };

    setForm((prevForm) => {
      const updatedGyms = [...prevForm.gyms, newGym];
      const newGymIndex = updatedGyms.length - 1;
      const newStep = 1 + newGymIndex + 1; // Owner step + gym index + 1

      // Set the current gym index to the new gym and navigate to its step
      setCurrentGymIndex(newGymIndex);
      setCurrentStep(newStep);

      return {
        ...prevForm,
        gyms: updatedGyms,
      };
    });
  };

  const removeGym = (gymIndex) => {
    if (form.gyms.length <= 1) return; // Don't remove if only one gym left

    // Clear any errors related to the gym being removed
    const errorsToRemove = Object.keys(errors).filter((key) =>
      key.includes(`gym${gymIndex}`),
    );
    if (errorsToRemove.length > 0) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        errorsToRemove.forEach((key) => delete newErrors[key]);
        return newErrors;
      });
    }

    setForm((prevForm) => {
      const updatedGyms = prevForm.gyms.filter(
        (_, index) => index !== gymIndex,
      );

      // Calculate new navigation values
      const newTotalSteps = 1 + updatedGyms.length;
      let newCurrentGymIndex = currentGymIndex;
      let newCurrentStep = currentStep;

      // If removing the currently viewed gym
      if (gymIndex === currentGymIndex) {
        // If it's the last gym in the array, go to the previous one
        if (currentGymIndex >= updatedGyms.length) {
          newCurrentGymIndex = updatedGyms.length - 1;
          newCurrentStep = 1 + newCurrentGymIndex + 1; // Owner step + gym index + 1
        }
        // If current step becomes invalid after removal, adjust it
        if (newCurrentStep > newTotalSteps) {
          newCurrentStep = newTotalSteps;
          newCurrentGymIndex = updatedGyms.length - 1;
        }
      } else if (gymIndex < currentGymIndex) {
        // If removing a gym before the current one, adjust indices
        newCurrentGymIndex = currentGymIndex - 1;
        newCurrentStep = currentStep - 1;
      }

      // Update state
      setCurrentGymIndex(newCurrentGymIndex);
      setCurrentStep(newCurrentStep);

      return {
        ...prevForm,
        gyms: updatedGyms,
      };
    });
  };

  const navigateToGym = (newIndex) => {
    if (newIndex === currentGymIndex) return;
    setCurrentGymIndex(newIndex);
  };

  const handleSameAsPreviousGym = (gymIndex, value) => {
    setForm((prevForm) => {
      const updatedGyms = [...prevForm.gyms];
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        sameAsPreviousGym: value,
      };

      if (value && gymIndex > 0) {
        // Copy account details from previous gym
        const previousGym = updatedGyms[gymIndex - 1];
        updatedGyms[gymIndex].accountDetails = {
          ...previousGym.accountDetails,
        };
      } else if (!value) {
        // Clear account details
        updatedGyms[gymIndex].accountDetails = {
          accountNumber: "",
          confirmAccountNumber: "",
          ifscCode: "",
          accountHolderName: "",
          bankName: "",
          branchName: "",
          upiId: "",
          gstNumber: "",
          gstType: "no_gst",
          gstPercentage: "18",
        };
        updatedGyms[gymIndex].ifscVerified = false;
      }

      return {
        ...prevForm,
        gyms: updatedGyms,
      };
    });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };

      // If password field changes and confirm password has a value, validate confirm password too
      if (field === "password" && prev.confirmPassword) {
        // Use requestAnimationFrame to ensure state is updated first
        requestAnimationFrame(() => {
          // Check if confirm password matches the new password
          if (prev.confirmPassword !== value) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              confirmPassword: "Passwords do not match",
            }));
          } else {
            setErrors((prevErrors) => {
              const { confirmPassword, ...rest } = prevErrors;
              return rest;
            });
          }
        });
      }

      return newForm;
    });

    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Always validate immediately when field changes
    validateField(field, value);
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validate on blur to ensure current form value is used
    validateField(field, form[field]);
  };

  const formatDateToLocalString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        const dobString = formatDateToLocalString(selectedDate);
        setForm((prev) => ({
          ...prev,
          dob: dobString,
        }));
        setTouchedFields((prev) => ({ ...prev, dob: true }));
        validateField("dob", dobString);
      }
    } else {
      // iOS - just update temp value
      if (selectedDate) {
        setTempDob(selectedDate);
      }
    }
  };

  const confirmDobSelection = () => {
    const dobString = formatDateToLocalString(tempDob);
    setForm((prev) => ({
      ...prev,
      dob: dobString,
    }));
    setTouchedFields((prev) => ({ ...prev, dob: true }));
    validateField("dob", dobString);
    setShowDatePicker(false);
  };

  const cancelDobSelection = () => {
    setTempDob(form.dob ? new Date(form.dob) : new Date());
    setShowDatePicker(false);
  };

  const validateOwnerSection = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const today = new Date();
      const birthDate = new Date(form.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        newErrors.dob = "You must be at least 18 years old to register";
      }
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(form.mobile)) {
      newErrors.mobile = "Invalid mobile number";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGymSection = (gymIndex) => {
    const gym = form.gyms[gymIndex];
    const newErrors = {};

    if (!gym.name.trim())
      newErrors[`gym${gymIndex}name`] = "Gym name is required";
    if (!gym.contactNumber.trim())
      newErrors[`gym${gymIndex}contactNumber`] = "Contact number is required";
    if (!gym.totalTrainers.trim())
      newErrors[`gym${gymIndex}totalTrainers`] =
        "Total number of trainers is required";
    else if (!/^\d+$/.test(gym.totalTrainers.trim()))
      newErrors[`gym${gymIndex}totalTrainers`] = "Only numbers are allowed";
    if (!gym.floorSpace.trim())
      newErrors[`gym${gymIndex}floorSpace`] = "Floor space is required";
    else if (!/^\d+$/.test(gym.floorSpace.trim()))
      newErrors[`gym${gymIndex}floorSpace`] = "Only numbers are allowed";
    if (!gym.totalMachineries.trim())
      newErrors[`gym${gymIndex}totalMachineries`] =
        "Total number of machineries is required";
    else if (!/^\d+$/.test(gym.totalMachineries.trim()))
      newErrors[`gym${gymIndex}totalMachineries`] = "Only numbers are allowed";
    if (!gym.yearlyMembershipCost.trim())
      newErrors[`gym${gymIndex}yearlyMembershipCost`] =
        "Yearly membership cost is required";
    else if (!/^\d+$/.test(gym.yearlyMembershipCost.trim()))
      newErrors[`gym${gymIndex}yearlyMembershipCost`] =
        "Only numbers are allowed";
    if (gym.services.length === 0)
      newErrors[`gym${gymIndex}services`] = "At least one service is required";
    if (!gym.operatingHours || gym.operatingHours.length === 0)
      newErrors[`gym${gymIndex}operatingHours`] =
        "Operating hours are required";
    if (!gym.address.street.trim())
      newErrors[`gym${gymIndex}addressstreet`] = "Street address is required";
    if (!gym.address.area.trim())
      newErrors[`gym${gymIndex}addressarea`] = "Area is required";
    if (!gym.address.city.trim())
      newErrors[`gym${gymIndex}addresscity`] = "City is required";
    if (!gym.address.state.trim())
      newErrors[`gym${gymIndex}addressstate`] = "State is required";
    if (!gym.address.pincode.trim())
      newErrors[`gym${gymIndex}addresspincode`] = "Pincode is required";

    // Account details validation
    if (!gym.accountDetails.accountNumber.trim())
      newErrors[`gym${gymIndex}accountDetailsaccountNumber`] =
        "Account number is required";
    else if (!/^\d{9,18}$/.test(gym.accountDetails.accountNumber.trim()))
      newErrors[`gym${gymIndex}accountDetailsaccountNumber`] =
        "Account number must be 9-18 digits";

    if (!gym.accountDetails.confirmAccountNumber.trim())
      newErrors[`gym${gymIndex}accountDetailsconfirmAccountNumber`] =
        "Please confirm your account number";
    else if (
      gym.accountDetails.accountNumber !==
      gym.accountDetails.confirmAccountNumber
    )
      newErrors[`gym${gymIndex}accountDetailsconfirmAccountNumber`] =
        "Account numbers do not match";

    if (!gym.accountDetails.ifscCode.trim())
      newErrors[`gym${gymIndex}accountDetailsifscCode`] =
        "IFSC code is required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(gym.accountDetails.ifscCode.trim()))
      newErrors[`gym${gymIndex}accountDetailsifscCode`] =
        "Invalid IFSC code format";

    if (!gym.accountDetails.accountHolderName.trim())
      newErrors[`gym${gymIndex}accountDetailsaccountHolderName`] =
        "Account holder name is required";

    // UPI ID validation (optional)
    if (
      gym.accountDetails.upiId.trim() &&
      !/^[\w\.\-]+@[\w\-]+$/.test(gym.accountDetails.upiId.trim())
    ) {
      newErrors[`gym${gymIndex}accountDetailsupiId`] =
        "Invalid UPI ID format (example: user@paytm)";
    }
    // GST number is now optional
    if (!gym.accountDetails.gstType.trim())
      newErrors[`gym${gymIndex}accountDetailsgstType`] = "GST type is required";

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const isCurrentGymFormComplete = () => {
    const gym = form.gyms[currentGymIndex];
    return (
      gym.name.trim() &&
      gym.contactNumber.trim() &&
      gym.services.length > 0 &&
      gym.operatingHours?.length > 0 &&
      gym.address.street.trim() &&
      gym.address.area.trim() &&
      gym.address.city.trim() &&
      gym.address.state.trim() &&
      gym.address.pincode.trim() &&
      gym.accountDetails.accountNumber.trim() &&
      gym.accountDetails.confirmAccountNumber.trim() &&
      gym.accountDetails.ifscCode.trim() &&
      gym.accountDetails.accountHolderName.trim() &&
      gym.accountDetails.gstType.trim() &&
      Object.keys(errors).length === 0
    );
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      // Check only step 1 related errors (errors without gym prefix)
      const step1Errors = Object.keys(errors).filter(
        (key) => !key.startsWith("gym"),
      );
      return (
        !form.name.trim() ||
        !form.dob ||
        !form.email.trim() ||
        !form.mobile.trim() ||
        !form.password ||
        !form.confirmPassword ||
        step1Errors.length > 0
      );
    } else if (currentStep >= 2) {
      // For gym steps (step 2 and above)
      const gymIndex = currentStep - 2; // Convert step to gym index
      if (gymIndex >= 0 && gymIndex < form.gyms.length) {
        const gym = form.gyms[gymIndex];
        // Check only errors related to current gym
        const currentGymErrors = Object.keys(errors).filter((key) =>
          key.startsWith(`gym${gymIndex}`),
        );
        return (
          !gym.name.trim() ||
          !gym.contactNumber.trim() ||
          !gym.totalTrainers.trim() ||
          !/^\d+$/.test(gym.totalTrainers.trim()) ||
          !gym.floorSpace.trim() ||
          !/^\d+$/.test(gym.floorSpace.trim()) ||
          !gym.totalMachineries.trim() ||
          !/^\d+$/.test(gym.totalMachineries.trim()) ||
          !gym.yearlyMembershipCost.trim() ||
          !/^\d+$/.test(gym.yearlyMembershipCost.trim()) ||
          gym.services.length === 0 ||
          !gym.operatingHours?.length ||
          !gym.address.street.trim() ||
          !gym.address.area.trim() ||
          !gym.address.city.trim() ||
          !gym.address.state.trim() ||
          !gym.address.pincode.trim() ||
          !gym.accountDetails.accountNumber.trim() ||
          !gym.accountDetails.confirmAccountNumber.trim() ||
          !gym.accountDetails.ifscCode.trim() ||
          !gym.accountDetails.accountHolderName.trim() ||
          !gym.accountDetails.gstType.trim() ||
          currentGymErrors.length > 0
        );
      }
    }
    return false;
  };

  const handleApplyReferral = async () => {
    if (!form.referralId.trim()) {
      Alert.alert("Error", "Please enter a referral ID");
      return;
    }

    setReferralCheckLoading(true);
    try {
      const response = await checkReferralAPI(form.referralId.trim());

      if (response?.status === 200 && response?.available) {
        // Referral is valid
        setReferralApplied(true);
        setReferralOwnerName(response?.owner_name || "");
        setShowReferralModal(true);
      } else {
        // Referral is invalid
        Alert.alert(
          "Invalid Referral",
          "This referral ID is not available or invalid.",
          [
            {
              text: "OK",
              onPress: () => {
                setForm((prev) => ({ ...prev, referralId: "" }));
                setReferralApplied(false);
                setReferralOwnerName("");
              },
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to validate referral ID. Please try again.");
      setForm((prev) => ({ ...prev, referralId: "" }));
      setReferralApplied(false);
      setReferralOwnerName("");
    } finally {
      setReferralCheckLoading(false);
    }
  };

  const handleNext = () => {
    if (isNextButtonDisabled()) return;

    if (currentStep === 1) {
      if (validateOwnerSection()) {
        // Go to first gym step (step 2)
        setCurrentStep(2);
        setCurrentGymIndex(0); // Ensure we start with first gym

        // Scroll to top instantly
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }
    } else if (currentStep >= 2) {
      // For gym steps
      const gymIndex = currentStep - 2;
      if (validateGymSection(gymIndex)) {
        const totalSteps = 1 + form.gyms.length; // 1 owner step + gym steps

        if (currentStep < totalSteps) {
          // Move to next gym step
          const nextGymIndex = gymIndex + 1;
          setCurrentStep(currentStep + 1);
          setCurrentGymIndex(nextGymIndex);
          // Scroll to top instantly
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: false });
          }
        } else {
          // Last gym completed, submit form
          handleSubmit();
        }
      }
    }
  };

  const handleBackStep = () => {
    // If there are multiple gyms and not on the first gym, go to previous gym
    if (form.gyms.length > 1 && currentGymIndex > 0) {
      // Go to previous gym
      const newGymIndex = currentGymIndex - 1;
      setCurrentGymIndex(newGymIndex);
      setCurrentStep(currentStep - 1);
    } else if (currentStep > 1) {
      // Go back to step 1
      setCurrentStep(1);
      setCurrentGymIndex(0);
    }

    // Scroll to top instantly
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    try {
      // Check if any uploads are still in progress
      // const pendingUploads = uploadQueue.filter(
      //   (item) => item.status === "uploading" || item.status === "queued"
      // );

      // if (pendingUploads.length > 0) {
      //   showToast({
      //     type: "warning",
      //     title: "Please wait for image uploads to complete",
      //   });
      //   setSubmitted(false);
      //   return;
      // }

      // // Check for failed uploads
      // const failedUploads = uploadQueue.filter(
      //   (item) => item.status === "failed"
      // );
      // if (failedUploads.length > 0) {
      //   showToast({
      //     type: "error",
      //     title: `${failedUploads.length} image uploads failed. Please retry or remove failed images.`,
      //   });
      //   setSubmitted(false);
      //   return;
      // }

      // Prepare form data with proper structure for backend
      const formData = {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        confirmPassword: form.confirmPassword,
        dob: form.dob,
        referral_id: referralApplied ? form.referralId : null,
        gyms: form.gyms.map((gym) => ({
          name: gym.name,
          location: gym.address
            ? `${gym.address.city}, ${gym.address.state}`
            : "",
          contactNumber: gym.contactNumber,
          totalTrainers: gym.totalTrainers,
          floorSpace: gym.floorSpace,
          totalMachineries: gym.totalMachineries,
          yearlyMembershipCost: gym.yearlyMembershipCost,
          services: gym.services,
          operatingHours: gym.operatingHours.map((oh) => ({
            id: oh.id,
            startTime: oh.startTime,
            endTime: oh.endTime,
            day:
              oh.day === "everyday"
                ? "everyday"
                : oh.day === "custom" && oh.customDays
                  ? oh.customDays
                  : oh.day || "everyday",
          })),
          address: {
            street: gym.address.street,
            area: gym.address.area,
            city: gym.address.city,
            state: gym.address.state,
            pincode: gym.address.pincode,
          },
          accountDetails: {
            accountNumber: gym.accountDetails.accountNumber,
            confirmAccountNumber: gym.accountDetails.confirmAccountNumber,
            ifscCode: gym.accountDetails.ifscCode,
            accountHolderName: gym.accountDetails.accountHolderName,
            bankName: gym.accountDetails.bankName,
            branchName: gym.accountDetails.branchName,
            upiId: gym.accountDetails.upiId,
            gstNumber: gym.accountDetails.gstNumber,
            gstType: gym.accountDetails.gstType,
            gstPercentage:
              gym.accountDetails.gstType === "no_gst"
                ? ""
                : gym.accountDetails.gstPercentage,
          },
        })),
      };
      // console.log(
      //   "Submitting registration with data:",
      //   JSON.stringify(formData)
      // );
      const response = await registerAPI(formData);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Registration successful!",
        });
        router.push({
          pathname: "/verificationowner",
          params: {
            contact: form.mobile,
            email: form.email,
            id: response.data?.owner_id || response.data,
            verification: JSON.stringify({ mobile: false, email: false }),
          },
        });
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast({
        type: "error",
        title: error.message || "Registration failed",
      });
    } finally {
      setSubmitted(false);
    }
  };

  const shouldShowError = (fieldName) => {
    // Show error if field has been touched or form has been submitted
    return touchedFields[fieldName] && errors[fieldName];
  };

  const renderInputField = (
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    options = {},
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          <Ionicons name={icon} size={16} color="#FF5757" /> {label}{" "}
          {options.required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          options.multiline && styles.multilineInput,
          options.error && styles.inputError,
        ]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
        }}
        placeholder={placeholder}
        placeholderTextColor="#767676"
        multiline={options.multiline}
        numberOfLines={options.numberOfLines}
        textAlignVertical={options.multiline ? "top" : "center"}
        keyboardType={options.keyboardType || "default"}
        returnKeyType={options.returnKeyType || "next"}
        secureTextEntry={options.secureTextEntry}
        maxLength={options.maxLength}
        onBlur={options.onBlur}
        editable={!options.disabled}
      />
      {options.unit && <Text style={styles.unitText}>{options.unit}</Text>}
      {options.loading && (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={16} color="#FF5757" />
        </View>
      )}
    </View>
  );

  const renderServicesSection = (gymIndex) => (
    <View style={styles.servicesContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          <Ionicons name="fitness-outline" size={16} color="#FF5757" /> Services{" "}
          <Text style={styles.required}>*</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowServicesModal(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !form.gyms[gymIndex].services.length && styles.placeholderText,
          ]}
        >
          {form.gyms[gymIndex].services.length > 0
            ? `${form.gyms[gymIndex].services.length} services selected`
            : "Select services"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#FF5757" />
      </TouchableOpacity>

      {form.gyms[gymIndex].services.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedServicesContainer}
          contentContainerStyle={styles.selectedServicesContent}
        >
          {form.gyms[gymIndex].services.map((service) => (
            <View key={service} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{service}</Text>
              <TouchableOpacity
                onPress={() => toggleService(gymIndex, service)}
              >
                <Ionicons name="close" size={16} color="#FF5757" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {form.gyms[gymIndex].services.includes("Other") && (
        <View style={styles.otherServiceContainer}>
          <TextInput
            style={styles.input}
            placeholder="Specify other service"
            placeholderTextColor="#767676"
            value={form.gyms[gymIndex].customService}
            onChangeText={(value) =>
              handleGymChange(gymIndex, "customService", value)
            }
          />
          {form.gyms[gymIndex].customService.trim() && (
            <TouchableOpacity
              style={styles.addOtherButton}
              onPress={() => addCustomServiceToPills(gymIndex)}
            >
              <Ionicons name="add" size={16} color="#FF5757" />
              <Text style={styles.addOtherButtonText}>Add to Selected</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {shouldShowError(`gym${gymIndex}services`) && (
        <Text style={styles.errorText}>{errors[`gym${gymIndex}services`]}</Text>
      )}
    </View>
  );

  const renderTimingSection = (gymIndex) => (
    <View style={styles.operatingHoursSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.label}>
          <Ionicons name="time-outline" size={16} color="#FF5757" /> Operating
          Hours <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addTimeRange(gymIndex)}
        >
          <Ionicons name="add" size={16} color="#FF5757" />
          <Text style={styles.addButtonText}>Add Hours</Text>
        </TouchableOpacity>
      </View>

      {(form.gyms[gymIndex].operatingHours || []).map((timeRange, index) => (
        <View key={timeRange.id} style={styles.timeRangeCard}>
          <View style={styles.timeRangeHeader}>
            <Text style={styles.timeRangeTitle}>Time Range {index + 1}</Text>
            {form.gyms[gymIndex].operatingHours?.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeTimeRange(gymIndex, timeRange.id)}
              >
                <Ionicons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.daySelectionContainer}>
            <Text style={styles.dayLabel}>Days:</Text>
            <View style={styles.dayButtons}>
              {["everyday", "weekdays", "weekends", "sunday", "custom"].map(
                (day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      timeRange.day === day && styles.dayButtonActive,
                    ]}
                    onPress={() =>
                      updateTimeRange(gymIndex, timeRange.id, "day", day)
                    }
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        timeRange.day === day && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          {timeRange.day === "custom" && (
            <TextInput
              style={styles.customDayInput}
              placeholder="e.g., Mon, Wed, Fri"
              placeholderTextColor="#767676"
              value={timeRange.customDays || ""}
              onChangeText={(value) =>
                updateTimeRange(gymIndex, timeRange.id, "customDays", value)
              }
            />
          )}

          <View style={styles.timeSelectionRow}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() =>
                  setShowTimePicker({
                    show: true,
                    rangeId: timeRange.id,
                    type: "start",
                  })
                }
              >
                <Text
                  style={[
                    styles.timePickerText,
                    !timeRange.startTime && styles.placeholderText,
                  ]}
                >
                  {formatTime(timeRange.startTime) || "Select start time"}
                </Text>
                <Ionicons name="time-outline" size={16} color="#FF5757" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeSeparator}>
              <Text style={styles.timeSeparatorText}>to</Text>
            </View>

            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() =>
                  setShowTimePicker({
                    show: true,
                    rangeId: timeRange.id,
                    type: "end",
                  })
                }
              >
                <Text
                  style={[
                    styles.timePickerText,
                    !timeRange.endTime && styles.placeholderText,
                  ]}
                >
                  {formatTime(timeRange.endTime) || "Select end time"}
                </Text>
                <Ionicons name="time-outline" size={16} color="#FF5757" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {(!form.gyms[gymIndex].operatingHours ||
        form.gyms[gymIndex].operatingHours.length === 0) && (
        <View style={styles.emptyTimeRanges}>
          <Ionicons name="time-outline" size={32} color="#999" />
          <Text style={styles.emptyText}>No operating hours added</Text>
          <Text style={styles.emptySubtext}>
            Tap "Add Hours" to set gym operating times
          </Text>
        </View>
      )}

      {shouldShowError(`gym${gymIndex}operatingHours`) && (
        <Text style={styles.errorText}>
          {errors[`gym${gymIndex}operatingHours`]}
        </Text>
      )}
    </View>
  );

  const renderOwnerRegistration = () => (
    <View style={styles.section}>
      {renderInputField(
        "Full Name",
        form.name,
        (value) => handleFieldChange("name", value),
        "Enter your full name",
        "person-outline",
        { required: true, onBlur: () => handleFieldBlur("name") },
      )}
      {shouldShowError("name") && (
        <Text style={styles.errorText}>{errors.name}</Text>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            <Ionicons name="calendar-outline" size={16} color="#FF5757" /> Date
            of Birth <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => {
            setTempDob(form.dob ? new Date(form.dob) : new Date());
            setShowDatePicker(true);
          }}
        >
          <Text
            style={[styles.selectorText, !form.dob && styles.placeholderText]}
          >
            {form.dob || "Select date of birth"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#FF5757" />
        </TouchableOpacity>
      </View>
      {shouldShowError("dob") && (
        <Text style={styles.errorText}>{errors.dob}</Text>
      )}

      {renderInputField(
        "Email Address",
        form.email,
        (value) => handleFieldChange("email", value),
        "Enter your email address",
        "mail-outline",
        {
          required: true,
          keyboardType: "email-address",
          onBlur: () => handleFieldBlur("email"),
        },
      )}
      {shouldShowError("email") && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}

      {renderInputField(
        "Mobile Number",
        form.mobile,
        (value) => handleFieldChange("mobile", value),
        "Enter 10-digit mobile number",
        "call-outline",
        {
          required: true,
          keyboardType: "phone-pad",
          maxLength: 10,
          loading: mobileCheckLoading,
          onBlur: () => handleFieldBlur("mobile"),
        },
      )}
      {shouldShowError("mobile") && (
        <Text style={styles.errorText}>{errors.mobile}</Text>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            <Ionicons name="lock-closed-outline" size={16} color="#FF5757" />{" "}
            Password <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Enter password (min 8 characters)"
            placeholderTextColor="#767676"
            value={form.password}
            onChangeText={(value) => handleFieldChange("password", value)}
            secureTextEntry={!showPassword}
            onBlur={() => handleFieldBlur("password")}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      {shouldShowError("password") && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            <Ionicons name="lock-closed-outline" size={16} color="#FF5757" />{" "}
            Confirm Password <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Re-enter password"
            placeholderTextColor="#767676"
            value={form.confirmPassword}
            onChangeText={(value) =>
              handleFieldChange("confirmPassword", value)
            }
            secureTextEntry={!showConfirmPassword}
            onBlur={() => handleFieldBlur("confirmPassword")}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      {shouldShowError("confirmPassword") && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            <Ionicons name="person-add-outline" size={16} color="#FF5757" />{" "}
            Referral ID
          </Text>
        </View>
        <View style={styles.referralContainer}>
          <TextInput
            style={[styles.input, styles.referralInput]}
            placeholder="Enter referral ID (optional)"
            placeholderTextColor="#767676"
            value={form.referralId}
            onChangeText={(value) => {
              handleFieldChange("referralId", value);
              if (referralApplied) {
                setReferralApplied(false);
                setReferralOwnerName("");
              }
            }}
            editable={!referralApplied}
          />
          <TouchableOpacity
            style={[
              styles.applyButton,
              referralApplied && styles.appliedButton,
              (referralCheckLoading || !form.referralId.trim()) &&
                styles.disabledButton,
            ]}
            onPress={handleApplyReferral}
            disabled={
              referralCheckLoading || referralApplied || !form.referralId.trim()
            }
          >
            {referralCheckLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyButtonText}>
                {referralApplied ? "Applied" : "Apply"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {referralApplied && referralOwnerName && (
          <Text style={styles.referralAppliedText}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />{" "}
            Referred by: {referralOwnerName}
          </Text>
        )}
      </View>
    </View>
  );

  const renderGymDetails = () => {
    const gym = form.gyms[currentGymIndex];

    return (
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="business-outline" size={20} color="#FF5757" /> Gym
            Details{" "}
            {form.gyms.length > 1 &&
              `(${currentGymIndex + 1}/${form.gyms.length})`}
          </Text>
          {/* Show remove button only for additional gyms (not the first gym) */}
          {form.gyms.length > 1 && currentGymIndex > 0 && (
            <TouchableOpacity
              style={styles.removeGymButton}
              onPress={() => removeGym(currentGymIndex)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Queue Status */}
        {uploadQueue.length > 0 && (
          <View style={styles.queueStatusContainer}>
            <View style={styles.queueStatusHeader}>
              <Ionicons name="cloud-upload-outline" size={16} color="#3498db" />
              <Text style={styles.queueStatusTitle}>
                Upload Queue ({uploadQueue.length})
              </Text>
              {uploadQueue.some((item) => item.status === "failed") && (
                <TouchableOpacity
                  onPress={clearFailedUploads}
                  style={styles.clearFailedButton}
                >
                  <Text style={styles.clearFailedText}>Clear Failed</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.queueItems}>
              {uploadQueue.slice(0, 3).map((item, index) => (
                <View key={item.id} style={styles.queueItem}>
                  <View
                    style={[
                      styles.queueItemStatus,
                      index === 0 && isProcessingUpload
                        ? styles.queueItemProcessing
                        : item.status === "failed"
                          ? styles.queueItemFailed
                          : styles.queueItemQueued,
                    ]}
                  >
                    {index === 0 && isProcessingUpload ? (
                      <ActivityIndicator size="small" color="#3498db" />
                    ) : item.status === "failed" ? (
                      <Ionicons
                        name="alert-circle-outline"
                        size={14}
                        color="#F44336"
                      />
                    ) : (
                      <Text style={styles.queueNumber}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={styles.queueItemText} numberOfLines={1}>
                    {item.areaName} - Gym {item.gymIndex + 1}
                  </Text>
                  {item.status === "failed" && (
                    <TouchableOpacity
                      onPress={() => retryFailedUpload(item)}
                      style={styles.retryButton}
                    >
                      <Ionicons
                        name="reload-outline"
                        size={14}
                        color="#3498db"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {uploadQueue.length > 3 && (
                <Text style={styles.queueMoreText}>
                  +{uploadQueue.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}

        {renderInputField(
          "Gym Name",
          gym.name,
          (value) => handleGymChange(currentGymIndex, "name", value),
          "Enter gym name",
          "fitness-outline",
          { required: true },
        )}
        {shouldShowError(`gym${currentGymIndex}name`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}name`]}
          </Text>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              <Ionicons name="call-outline" size={16} color="#FF5757" /> Gym
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Same as owner number</Text>
            <Switch
              value={gym.sameAsOwner}
              onValueChange={(value) =>
                handleGymChange(currentGymIndex, "sameAsOwner", value)
              }
              trackColor={{ false: "#E0E0E0", true: "#FF5757" }}
              thumbColor={gym.sameAsOwner ? "#FFFFFF" : "#F4F3F4"}
            />
          </View>

          <TextInput
            style={[styles.input, gym.sameAsOwner && styles.disabledInput]}
            placeholder="Enter gym contact number"
            placeholderTextColor="#767676"
            value={gym.contactNumber}
            onChangeText={(value) =>
              handleGymChange(currentGymIndex, "contactNumber", value)
            }
            keyboardType="phone-pad"
            maxLength={10}
            editable={!gym.sameAsOwner}
          />
        </View>
        {shouldShowError(`gym${currentGymIndex}contactNumber`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}contactNumber`]}
          </Text>
        )}

        {renderInputField(
          "Total Number of Trainers",
          gym.totalTrainers,
          (value) => handleGymChange(currentGymIndex, "totalTrainers", value),
          "Enter total number of trainers",
          "people-outline",
          { required: true, keyboardType: "numeric" },
        )}
        {shouldShowError(`gym${currentGymIndex}totalTrainers`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}totalTrainers`]}
          </Text>
        )}

        {renderInputField(
          "Floor Space (in sq.ft)",
          gym.floorSpace,
          (value) => handleGymChange(currentGymIndex, "floorSpace", value),
          "Enter floor space in sq.ft",
          "expand-outline",
          { required: true, keyboardType: "numeric" },
        )}
        {shouldShowError(`gym${currentGymIndex}floorSpace`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}floorSpace`]}
          </Text>
        )}

        {renderInputField(
          "Total Number of Machineries",
          gym.totalMachineries,
          (value) =>
            handleGymChange(currentGymIndex, "totalMachineries", value),
          "Enter total number of machineries",
          "barbell-outline",
          { required: true, keyboardType: "numeric" },
        )}
        {shouldShowError(`gym${currentGymIndex}totalMachineries`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}totalMachineries`]}
          </Text>
        )}

        {renderInputField(
          "Yearly Membership Plan Cost",
          gym.yearlyMembershipCost,
          (value) =>
            handleGymChange(currentGymIndex, "yearlyMembershipCost", value),
          "Enter yearly membership cost",
          "cash-outline",
          { required: true, keyboardType: "numeric" },
        )}
        {shouldShowError(`gym${currentGymIndex}yearlyMembershipCost`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}yearlyMembershipCost`]}
          </Text>
        )}

        {renderServicesSection(currentGymIndex)}
        {renderTimingSection(currentGymIndex)}

        <View style={styles.addressSection}>
          <View style={styles.labelContainer}>
            <Text style={styles.sectionSubTitle}>
              <Ionicons name="location-outline" size={16} color="#FF5757" /> Gym
              Address
            </Text>
          </View>

          {renderInputField(
            "Street Address",
            gym.address.street,
            (value) =>
              handleGymChange(currentGymIndex, "address", value, "street"),
            "Enter street address",
            "home-outline",
            { required: true },
            "",
          )}
          {shouldShowError(`gym${currentGymIndex}addressstreet`) && (
            <Text style={styles.errorText}>
              {errors[`gym${currentGymIndex}addressstreet`]}
            </Text>
          )}

          {renderInputField(
            "Area",
            gym.address.area,
            (value) =>
              handleGymChange(currentGymIndex, "address", value, "area"),
            "Enter area/locality",
            "map-outline",
            { required: true },
            "",
          )}
          {shouldShowError(`gym${currentGymIndex}addressarea`) && (
            <Text style={styles.errorText}>
              {errors[`gym${currentGymIndex}addressarea`]}
            </Text>
          )}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInputField(
                "City",
                gym.address.city,
                (value) =>
                  handleGymChange(currentGymIndex, "address", value, "city"),
                "City",
                "business-outline",
                { required: true },
                "",
              )}
              {shouldShowError(`gym${currentGymIndex}addresscity`) && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}addresscity`]}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              {renderInputField(
                "State",
                gym.address.state,
                (value) =>
                  handleGymChange(currentGymIndex, "address", value, "state"),
                "State",
                "flag-outline",
                { required: true },
                "",
              )}
              {shouldShowError(`gym${currentGymIndex}addressstate`) && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}addressstate`]}
                </Text>
              )}
            </View>
          </View>

          {renderInputField(
            "Pincode",
            gym.address.pincode,
            (value) =>
              handleGymChange(currentGymIndex, "address", value, "pincode"),
            "Enter 6-digit pincode",
            "keypad-outline",
            { required: true, keyboardType: "numeric", maxLength: 6 },
            "",
          )}
          {shouldShowError(`gym${currentGymIndex}addresspincode`) && (
            <Text style={styles.errorText}>
              {errors[`gym${currentGymIndex}addresspincode`]}
            </Text>
          )}
        </View>

        <View style={styles.photoSection}>
          {/* <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubTitle}>
              <Ionicons name="camera-outline" size={16} color="#FF5757" /> Gym
              Photos
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowImageUploadModal(true)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FF5757" />
              <Text style={styles.uploadButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View> */}

          {/* <Text style={styles.noteText}>
            📸 Upload photos of different gym areas to showcase your facilities
            to potential members.
          </Text> */}

          {gym.areaPhotos && Object.keys(gym.areaPhotos).length > 0 && (
            <View style={styles.photoGrid}>
              {Object.entries(gym.areaPhotos).map(([areaId, photoData]) => {
                // photoData can be an object {url, photo_id}, an array [url], or just a string url
                let photoUrl;
                if (typeof photoData === "object" && photoData !== null) {
                  if (photoData.url) {
                    // New format: {url, photo_id}
                    photoUrl = photoData.url;
                  } else if (Array.isArray(photoData) && photoData.length > 0) {
                    // Old format: [url]
                    photoUrl = photoData[0];
                  } else {
                    // Fallback for any other object format
                    photoUrl = null;
                  }
                } else {
                  // Direct string URL (very old format)
                  photoUrl = photoData;
                }

                if (!photoUrl) return null;

                const area = GYM_AREAS.find((a) => a.id === areaId);

                return (
                  <View key={areaId} style={styles.photoItem}>
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.photoPreview}
                    />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText}>{area?.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removeAreaPhoto(currentGymIndex, areaId)}
                    >
                      <Ionicons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAccountDetails = () => {
    const gym = form.gyms[currentGymIndex];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="card-outline" size={20} color="#FF5757" /> Bank
          Account Details
        </Text>

        <Text style={styles.warningText}>
          ⚠️ All transactions related to gym plans, client payments are
          processed to this bank account. Enter proper details carefully and
          reverify before submitting.
        </Text>

        {/* Same as Previous Gym Toggle - Only show for additional gyms */}
        {currentGymIndex > 0 && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              Same as previous gym account details
            </Text>
            <Switch
              value={gym.sameAsPreviousGym}
              onValueChange={(value) =>
                handleSameAsPreviousGym(currentGymIndex, value)
              }
              trackColor={{ false: "#E0E0E0", true: "#FF5757" }}
              thumbColor={gym.sameAsPreviousGym ? "#FFFFFF" : "#F4F3F4"}
            />
          </View>
        )}

        {renderInputField(
          "Account Holder Name",
          gym.accountDetails.accountHolderName,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value,
              "accountHolderName",
            ),
          "Enter account holder name",
          "person-outline",
          { required: true, disabled: gym.sameAsPreviousGym },
          "Name as per bank account",
        )}
        {shouldShowError(
          `gym${currentGymIndex}accountDetailsaccountHolderName`,
        ) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsaccountHolderName`]}
          </Text>
        )}

        {renderInputField(
          "Account Number",
          gym.accountDetails.accountNumber,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value,
              "accountNumber",
            ),
          "Enter bank account number",
          "card-outline",
          {
            required: true,
            keyboardType: "numeric",
            disabled: gym.sameAsPreviousGym,
          },
          "Bank account number where payments will be credited",
        )}
        {shouldShowError(
          `gym${currentGymIndex}accountDetailsaccountNumber`,
        ) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsaccountNumber`]}
          </Text>
        )}

        {renderInputField(
          "Confirm Account Number",
          gym.accountDetails.confirmAccountNumber,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value,
              "confirmAccountNumber",
            ),
          "Re-enter account number",
          "card-outline",
          {
            required: true,
            keyboardType: "numeric",
            disabled: gym.sameAsPreviousGym,
          },
          "Confirm your account number to avoid errors",
        )}
        {shouldShowError(
          `gym${currentGymIndex}accountDetailsconfirmAccountNumber`,
        ) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsconfirmAccountNumber`]}
          </Text>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              <Ionicons name="business-outline" size={16} color="#FF5757" />{" "}
              IFSC Code <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <View style={styles.ifscContainer}>
            <TextInput
              style={[styles.input, styles.ifscInput]}
              placeholder="Enter IFSC code"
              placeholderTextColor="#767676"
              value={gym.accountDetails.ifscCode}
              onChangeText={(value) =>
                handleGymChange(
                  currentGymIndex,
                  "accountDetails",
                  value.toUpperCase(),
                  "ifscCode",
                )
              }
              maxLength={11}
              autoCapitalize="characters"
              editable={!gym.sameAsPreviousGym}
            />
            <TouchableOpacity
              style={[
                styles.ifscCheckButton,
                (bankDetailsLoading ||
                  gym.sameAsPreviousGym ||
                  !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
                    gym.accountDetails.ifscCode,
                  )) &&
                  styles.disabledButton,
              ]}
              onPress={() =>
                fetchBankDetails(gym.accountDetails.ifscCode, currentGymIndex)
              }
              disabled={
                bankDetailsLoading ||
                gym.sameAsPreviousGym ||
                !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(gym.accountDetails.ifscCode)
              }
            >
              {bankDetailsLoading ? (
                <ActivityIndicator size={16} color="#FFF" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          {/^[A-Z]{4}0[A-Z0-9]{6}$/.test(gym.accountDetails.ifscCode) &&
            !gym.ifscVerified && (
              <Text style={styles.helperText}>
                Click the tick button after entering IFSC code to auto-fill bank
                details
              </Text>
            )}
        </View>
        {shouldShowError(`gym${currentGymIndex}accountDetailsifscCode`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsifscCode`]}
          </Text>
        )}

        {renderInputField(
          "Bank Name",
          gym.accountDetails.bankName,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value,
              "bankName",
            ),
          "Bank name (auto-filled)",
          "business-outline",
          { disabled: true },
          "Bank name will be auto-filled from IFSC code",
        )}

        {renderInputField(
          "Branch Name",
          gym.accountDetails.branchName,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value,
              "branchName",
            ),
          "Branch name (auto-filled)",
          "location-outline",
          { disabled: true },
          "Branch details will be auto-filled from IFSC code",
        )}

        {renderInputField(
          "UPI ID",
          gym.accountDetails.upiId,
          (value) =>
            handleGymChange(currentGymIndex, "accountDetails", value, "upiId"),
          "Enter UPI ID (optional)",
          "qr-code-outline",
          { disabled: gym.sameAsPreviousGym },
          "UPI ID for digital payments (e.g., user@paytm)",
        )}
        {shouldShowError(`gym${currentGymIndex}accountDetailsupiId`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsupiId`]}
          </Text>
        )}

        {renderInputField(
          "GST Number",
          gym.accountDetails.gstNumber,
          (value) =>
            handleGymChange(
              currentGymIndex,
              "accountDetails",
              value.toUpperCase(),
              "gstNumber",
            ),
          "Enter GST number (optional)",
          "receipt-outline",
          { disabled: gym.sameAsPreviousGym },
          "GST registration number for tax compliance",
        )}
        {shouldShowError(`gym${currentGymIndex}accountDetailsgstNumber`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsgstNumber`]}
          </Text>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              <Ionicons name="settings-outline" size={16} color="#FF5757" /> GST
              Type <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.selector,
              gym.sameAsPreviousGym && styles.disabledSelector,
            ]}
            onPress={() => !gym.sameAsPreviousGym && setShowGstModal(true)}
            disabled={gym.sameAsPreviousGym}
          >
            <Text
              style={[
                styles.selectorText,
                !gym.accountDetails.gstType && styles.placeholderText,
              ]}
            >
              {gym.accountDetails.gstType
                ? gstTypes.find(
                    (type) => type.value === gym.accountDetails.gstType,
                  )?.label
                : "Select GST type"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#FF5757" />
          </TouchableOpacity>
        </View>
        {shouldShowError(`gym${currentGymIndex}accountDetailsgstType`) && (
          <Text style={styles.errorText}>
            {errors[`gym${currentGymIndex}accountDetailsgstType`]}
          </Text>
        )}

        {gym.accountDetails.gstType &&
          gym.accountDetails.gstType !== "no_gst" && (
            <View>
              {renderInputField(
                "GST Percentage",
                gym.accountDetails.gstPercentage,
                (value) =>
                  handleGymChange(
                    currentGymIndex,
                    "accountDetails",
                    value,
                    "gstPercentage",
                  ),
                "Enter GST percentage (default: 18%)",
                "receipt-outline",
                {
                  keyboardType: "numeric",
                  disabled:
                    gym.sameAsPreviousGym ||
                    gym.accountDetails.gstType === "inclusive" ||
                    gym.accountDetails.gstType === "exclusive",
                },
                "GST percentage for tax calculation",
              )}
            </View>
          )}
      </View>
    );
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        requestAnimationFrame(() => {
          setKeyboardVisible(true);
        });
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        requestAnimationFrame(() => {
          setKeyboardVisible(false);
        });
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              <Text style={styles.logoFirstPart}>Fymble</Text>

              <Text style={styles.logoSecondPart}>&nbsp;Business</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.stepIndicator}>
              {/* Owner Registration Step - Step 1 */}
              <View
                style={[
                  styles.step,
                  currentStep >= 1 && styles.stepActive,
                  currentStep > 1 && styles.stepComplete,
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    currentStep >= 1 && styles.stepTextActive,
                    currentStep > 1 && styles.stepTextComplete,
                  ]}
                >
                  1
                </Text>
              </View>

              {/* Dynamic gym steps */}
              {form.gyms.map((_, gymIndex) => {
                const stepNumber = gymIndex + 2; // Step 2, 3, 4, etc. for gyms
                const isActive = currentStep >= stepNumber;
                const isComplete = currentStep > stepNumber;

                return (
                  <React.Fragment key={`gym-step-${gymIndex}`}>
                    <View
                      style={[
                        styles.stepLine,
                        isActive && styles.stepLineActive,
                        isComplete && styles.stepLineComplete,
                      ]}
                    />
                    <View
                      style={[
                        styles.step,
                        isActive && styles.stepActive,
                        isComplete && styles.stepComplete,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepText,
                          isActive && styles.stepTextActive,
                          isComplete && styles.stepTextComplete,
                        ]}
                      >
                        {stepNumber}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            <Text style={styles.title}>
              {currentStep === 1
                ? "Owner Registration"
                : `Gym ${currentStep - 1} Details & Account`}
            </Text>

            <View style={styles.formContainer}>
              {currentStep === 1 && renderOwnerRegistration()}
              {currentStep >= 2 && (
                <>
                  {renderGymDetails()}
                  {renderAccountDetails()}
                </>
              )}

              <View style={styles.buttonContainer}>
                {/* Show Add Another Gym button only on the very last step and if current step is completed */}
                {(() => {
                  const totalSteps = 1 + form.gyms.length; // 1 owner step + gym steps
                  const isLastStep = currentStep === totalSteps;
                  const currentStepCompleted =
                    currentStep >= 2 && isCurrentGymFormComplete();

                  return (
                    isLastStep &&
                    currentStepCompleted && (
                      <TouchableOpacity
                        style={styles.addGymButton}
                        onPress={addGymField}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color="#FF5757"
                        />
                        <Text style={styles.addGymButtonText}>
                          Add Another Gym
                        </Text>
                      </TouchableOpacity>
                    )
                  );
                })()}

                <View style={styles.navigationButtons}>
                  {currentStep >= 2 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackStep}
                    >
                      <Ionicons name="arrow-back" size={16} color="#FF5757" />
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      (isNextButtonDisabled() || submitted) &&
                        styles.nextButtonDisabled,
                      currentStep >= 2 && styles.nextButtonWithBack,
                    ]}
                    onPress={handleNext}
                    disabled={isNextButtonDisabled() || submitted}
                  >
                    {submitted && currentStep === 1 + form.gyms.length ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.nextButtonText}>
                        {currentStep === 1
                          ? "Next"
                          : currentStep < 1 + form.gyms.length
                            ? "Next"
                            : "Register"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.loginContainer}>
                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginPrompt}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/")}>
                    <Text style={styles.loginLinkText}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footerSpacer} />
        </ScrollView>

        {!keyboardVisible && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2025 NFCTech Fitness Private Limited
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={cancelDobSelection}
        >
          <TouchableWithoutFeedback onPress={cancelDobSelection}>
            <View style={styles.pickerModalContainer}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={cancelDobSelection}>
                      <Text style={styles.pickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select Date of Birth</Text>
                    <TouchableOpacity onPress={confirmDobSelection}>
                      <Text style={styles.pickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDob}
                    mode="date"
                    display="spinner"
                    themeVariant="light"
                    textColor="#000000"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    style={styles.iosPickerStyle}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={form.dob ? new Date(form.dob) : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <CustomTimePicker
        visible={showTimePicker.show}
        onClose={() =>
          setShowTimePicker({ show: false, rangeId: null, type: "" })
        }
        onConfirm={onTimeChange}
        initialTime={
          showTimePicker.rangeId && showTimePicker.type
            ? form.gyms[currentGymIndex]?.operatingHours?.find(
                (range) => range.id === showTimePicker.rangeId,
              )?.[showTimePicker.type === "start" ? "startTime" : "endTime"]
            : new Date()
        }
      />

      <Modal
        visible={showServicesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: 10 + insets.bottom }]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  gap: 15,
                },
              ]}
            >
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Services</Text>
            </View>

            <FlatList
              data={services}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.serviceItem}
                  onPress={() => toggleService(currentGymIndex, item)}
                >
                  <Text style={styles.serviceText}>{item}</Text>
                  {form.gyms[currentGymIndex].services.includes(item) && (
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowServicesModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGstModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGstModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  handleGymChange(
                    currentGymIndex,
                    "accountDetails",
                    type.value,
                    "gstType",
                  );
                  setShowGstModal(false);
                }}
              >
                <Text style={styles.gstTypeText}>{type.label}</Text>
                {form.gyms[currentGymIndex].accountDetails.gstType ===
                  type.value && (
                  <Ionicons name="checkmark" size={20} color="#FF5757" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Gym Photos Modal */}
      <Modal
        visible={showImageUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowImageUploadModal(false)}
      >
        <SafeAreaView style={styles.imageModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowImageUploadModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Gym Photos</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.imageModalContent}
          >
            <View style={styles.areasGrid}>
              {GYM_AREAS.map((area) => {
                const photoData =
                  form.gyms[currentGymIndex].areaPhotos?.[area.id];
                // Handle different data formats: {url, photo_id}, [url], or string
                let photoUrl = null;
                let hasPhoto = false;

                if (photoData) {
                  if (typeof photoData === "object" && photoData !== null) {
                    if (photoData.url) {
                      // New format: {url, photo_id}
                      photoUrl = photoData.url;
                      hasPhoto = true;
                    } else if (
                      Array.isArray(photoData) &&
                      photoData.length > 0
                    ) {
                      // Old format: [url]
                      photoUrl = photoData[0];
                      hasPhoto = true;
                    }
                  } else if (typeof photoData === "string") {
                    // Direct string URL
                    photoUrl = photoData;
                    hasPhoto = true;
                  }
                }

                return (
                  <View
                    key={area.id}
                    style={[
                      styles.areaCard,
                      { borderColor: area.color + "30" },
                    ]}
                  >
                    <View style={styles.areaCardHeader}>
                      <View
                        style={[
                          styles.areaCardIcon,
                          { backgroundColor: area.color + "20" },
                        ]}
                      >
                        {renderAreaIcon(area)}
                      </View>
                      <View style={styles.areaCardInfo}>
                        <Text style={styles.areaCardTitle}>{area.name}</Text>
                        <Text style={styles.areaCardDescription}>
                          {area.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.areaCardImageContainer}>
                      {hasPhoto && photoUrl ? (
                        <View style={styles.imagePreviewContainer}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              pickImageForArea(currentGymIndex, area.id)
                            }
                          >
                            <Image
                              source={{ uri: photoUrl }}
                              style={styles.imagePreview}
                              resizeMode="cover"
                            />
                            <View style={styles.replaceOverlay}>
                              <Ionicons
                                name="create-outline"
                                size={16}
                                color="#FFF"
                              />
                              <Text style={styles.replaceText}>
                                Tap to replace
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() =>
                              removeAreaPhoto(currentGymIndex, area.id)
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#FFF"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        // Check upload queue status for this area
                        (() => {
                          const queuedItem = uploadQueue.find(
                            (item) =>
                              item.gymIndex === currentGymIndex &&
                              item.areaId === area.id,
                          );

                          const failedItem = uploadQueue.find(
                            (item) =>
                              item.gymIndex === currentGymIndex &&
                              item.areaId === area.id &&
                              item.status === "failed",
                          );

                          const isCurrentlyUploading =
                            uploadQueue.length > 0 &&
                            uploadQueue[0].gymIndex === currentGymIndex &&
                            uploadQueue[0].areaId === area.id &&
                            isProcessingUpload;

                          if (isCurrentlyUploading) {
                            return (
                              <View
                                style={[
                                  styles.uploadPlaceholder,
                                  styles.uploadingState,
                                ]}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#3498db"
                                />
                                <Text
                                  style={[
                                    styles.uploadPlaceholderText,
                                    { color: "#3498db" },
                                  ]}
                                >
                                  Uploading...
                                </Text>
                              </View>
                            );
                          } else if (
                            queuedItem &&
                            queuedItem.status === "retrying"
                          ) {
                            const retryCount = queuedItem.retryCount || 0;
                            return (
                              <View
                                style={[
                                  styles.uploadPlaceholder,
                                  styles.retryingState,
                                ]}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#FF9800"
                                />
                                <Text
                                  style={[
                                    styles.uploadPlaceholderText,
                                    { color: "#FF9800" },
                                  ]}
                                >
                                  Retrying ({retryCount + 1}/3)
                                </Text>
                              </View>
                            );
                          } else if (
                            queuedItem &&
                            queuedItem.status === "queued"
                          ) {
                            // Find position in queue
                            const queuePosition =
                              uploadQueue.findIndex(
                                (item) =>
                                  item.gymIndex === currentGymIndex &&
                                  item.areaId === area.id,
                              ) + 1;

                            return (
                              <View
                                style={[
                                  styles.uploadPlaceholder,
                                  styles.queuedState,
                                ]}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={20}
                                  color="#FF9800"
                                />
                                <Text
                                  style={[
                                    styles.uploadPlaceholderText,
                                    { color: "#FF9800" },
                                  ]}
                                >
                                  Queued ({queuePosition})
                                </Text>
                              </View>
                            );
                          } else if (failedItem) {
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.uploadPlaceholder,
                                  styles.failedState,
                                ]}
                                onPress={() => retryFailedUpload(failedItem)}
                              >
                                <Ionicons
                                  name="alert-circle-outline"
                                  size={20}
                                  color="#F44336"
                                />
                                <Text
                                  style={[
                                    styles.uploadPlaceholderText,
                                    { color: "#F44336" },
                                  ]}
                                >
                                  Upload failed - Retry
                                </Text>
                              </TouchableOpacity>
                            );
                          } else {
                            return (
                              <TouchableOpacity
                                style={styles.uploadPlaceholder}
                                onPress={() =>
                                  pickImageForArea(currentGymIndex, area.id)
                                }
                              >
                                <Ionicons
                                  name="camera-outline"
                                  size={20}
                                  color="#999"
                                />
                                <Text style={styles.uploadPlaceholderText}>
                                  Upload image
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        })()
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Done Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowImageUploadModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Referral Success Modal */}
      <Modal
        visible={showReferralModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.referralModalOverlay}>
          <View style={styles.referralModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>Referral Applied!</Text>
              <Text style={styles.modalSubtitle}>
                Referred by {referralOwnerName}
              </Text>
            </View>

            <View style={styles.rewardsList}>
              <Text style={styles.rewardsHeading}>Your Rewards</Text>

              <View style={styles.rewardRow}>
                <View style={styles.rewardIconCircle}>
                  <Ionicons name="gift-outline" size={20} color="#FF5757" />
                </View>
                <View style={styles.rewardDetails}>
                  <Text style={styles.rewardAmount}>₹1000</Text>
                  <Text style={styles.rewardDesc}>
                    On successful registration & Getting atleast 10 Fymble
                    Premium Subscribed clients in your Gym
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeReferralModalButton}
              onPress={() => setShowReferralModal(false)}
            >
              <Text style={styles.closeReferralModalText}>Continue</Text>
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
    overflow: "hidden",
  },
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingTop: height * 0.05,
    paddingBottom: height * 0.1,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  logoText: {
    fontSize: isTablet ? 42 : 35,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: isTablet ? 600 : 400,
    paddingHorizontal: isTablet ? 30 : 20,
    paddingTop: isTablet ? 30 : 20,
    paddingBottom: isTablet ? 40 : 30,
    marginTop: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  step: {
    width: isTablet ? 40 : 30,
    height: isTablet ? 40 : 30,
    borderRadius: isTablet ? 20 : 15,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepActive: {
    backgroundColor: "#FF5757",
  },
  stepComplete: {
    backgroundColor: "#4CAF50",
  },
  stepText: {
    color: "#999",
    fontSize: isTablet ? 16 : 14,
    fontWeight: "bold",
  },
  stepTextActive: {
    color: "#FFF",
  },
  stepTextComplete: {
    color: "#FFF",
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: "#E0E0E0",
  },
  stepLineActive: {
    backgroundColor: "#FF5757",
  },
  stepLineComplete: {
    backgroundColor: "#4CAF50",
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  formContainer: {
    width: "100%",
    overflow: "hidden",
  },
  section: {
    marginBottom: 30,
    overflow: "visible",
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  sectionSubTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 15,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  inputGroup: {
    marginBottom: 16,
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    color: "#333",
    flexDirection: "row",
    alignItems: "center",
  },
  required: {
    color: "#F44336",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: isTablet ? 14 : 10,
    fontSize: isTablet ? 16 : 14,
    backgroundColor: "#F8F8F8",
    color: "#767676",
    fontFamily: FontFamily.urbanistMedium,
    height: isTablet ? 55 : 45,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  multilineInput: {
    minHeight: isTablet ? 100 : 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#F44336",
  },
  disabledInput: {
    backgroundColor: "#F0F0F0",
    color: "#999",
  },
  selector: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: isTablet ? 14 : 10,
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: isTablet ? 55 : 45,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorText: {
    fontSize: isTablet ? 16 : 14,
    color: "#767676",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
    fontSize: isTablet ? 16 : 14,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    fontFamily: FontFamily.urbanistMedium,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: "#666",
  },
  servicesContainer: {
    marginBottom: 20,
  },
  operatingHoursSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5757",
  },
  addButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  timeRangeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  timeRangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeRangeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  removeButton: {
    padding: 4,
  },
  daySelectionContainer: {
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  dayButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  dayButtonActive: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
  },
  dayButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  dayButtonTextActive: {
    color: "#FFF",
  },
  customDayInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#FFF",
    color: "#333",
    marginBottom: 12,
  },
  timeSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  timePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 12,
  },
  timePickerText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  timeSeparator: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  timeSeparatorText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  emptyTimeRanges: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  addressSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  photoSection: {
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5757",
  },
  toggleButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF5757",
  },
  warningText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  photoUploadContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF5757",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 10,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  unitText: {
    position: "absolute",
    right: 16,
    top: 47,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    position: "absolute",
    right: 16,
    top: 47,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  addGymButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF5757",
  },
  addGymButtonText: {
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  nextButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
    minWidth: 150,
  },
  nextButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowColor: "#CCCCCC",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  nextButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  loginContainer: {
    marginTop: 20,
  },
  loginLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginPrompt: {
    color: "#666",
    fontSize: 14,
  },
  loginLinkText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    color: "#999999",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
  },
  footerSpacer: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceText: {
    fontSize: 16,
    color: "#333",
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  gstTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  gstTypeText: {
    fontSize: 16,
    color: "#333",
  },
  doneButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedServicesContainer: {
    marginTop: 12,
  },
  selectedServicesContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5757",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  servicePillText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  otherServiceContainer: {
    marginTop: 12,
    gap: 8,
  },
  addOtherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5757",
    gap: 6,
  },
  addOtherButtonText: {
    color: "#FF5757",
    fontSize: 14,
    fontWeight: "500",
  },
  // Image modal styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  closeButton: {
    padding: 5,
    marginLeft: 15,
  },
  modalTitleContainer: {
    alignItems: "center",
  },
  queueBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  queueBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  modalScrollView: {
    flex: 1,
  },
  imageModalContent: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  modalDoneButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalDoneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  areasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  areaCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areaCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  areaCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  areaCardInfo: {
    flex: 1,
  },
  areaCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  areaCardDescription: {
    fontSize: 11,
    color: "#666",
    lineHeight: 14,
  },
  areaCardImageContainer: {
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  imagePreviewContainer: {
    flex: 1,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
    borderRadius: 8,
    margin: 1,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  deletePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,59,48,0.8)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  replaceOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  replaceText: {
    color: "#FFF",
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "500",
  },
  photoLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  photoLabelText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,59,48,0.8)",
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadQueueContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF5757",
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  queueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  queueItemText: {
    fontSize: 12,
    color: "#666",
  },
  queueItemStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  queueMoreText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  ifscContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ifscInput: {
    flex: 1,
  },
  ifscCheckButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  referralContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  referralInput: {
    flex: 1,
  },
  applyButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    width: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF5757",
    gap: 8,
    flex: 1,
    justifyContent: "center",
    minWidth: 100,
  },
  backButtonText: {
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonWithBack: {
    flex: 2,
    minWidth: 150,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  gymNavigationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gymNavButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5757",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  gymNavButtonDisabled: {
    borderColor: "#E0E0E0",
  },
  removeGymButton: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF4444",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  disabledSelector: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  uploadingState: {
    backgroundColor: "#E3F2FD",
    borderColor: "#3498db",
  },
  failedState: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  queuedState: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  retryingState: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  queueStatusContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  queueStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  queueStatusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
    marginLeft: 6,
    flex: 1,
  },
  clearFailedButton: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearFailedText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  queueItems: {
    gap: 6,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueItemStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  queueItemQueued: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  queueItemProcessing: {
    backgroundColor: "#E3F2FD",
    borderColor: "#3498db",
  },
  queueItemFailed: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  queueNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF9800",
  },
  queueItemText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  retryButton: {
    padding: 4,
  },
  queueMoreText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 32,
  },
  // iOS Picker Modal Styles
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#FF5757",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  appliedButton: {
    backgroundColor: "#4CAF50",
  },
  referralAppliedText: {
    fontSize: 13,
    color: "#4CAF50",
    marginTop: 8,
    marginLeft: 5,
    fontFamily: FontFamily.urbanistMedium,
  },
  referralModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  referralModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 15,
  },
  successBadge: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
    fontFamily: FontFamily.urbanistBold,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: FontFamily.urbanistMedium,
  },
  rewardsList: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rewardsHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: FontFamily.urbanistSemiBold,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rewardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5757",
    marginBottom: 2,
    fontFamily: FontFamily.urbanistBold,
  },
  rewardDesc: {
    fontSize: 13,
    color: "#666",
    fontFamily: FontFamily.urbanistMedium,
  },
  closeReferralModalButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  closeReferralModalText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FontFamily.urbanistSemiBold,
  },
});

export default register;
