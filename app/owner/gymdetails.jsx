
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Switch,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import CustomTimePicker from "../../components/ui/CustomTimePicker";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import {
  getBankDetailsFromIFSC,
  getProfileDataAPI,
  addNewGymsAPI,
  updateProfileAPI,
  getGymPhotosPresignedUrls,
  confirmGymPhotoUpload,
  getRegistrationPhotosPresignedUrls,
  confirmRegistrationPhotoUpload,
} from "../../services/Api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axiosInstance from "../../services/axiosInstance";

const { width, height } = Dimensions.get("window");

const gstTypes = [
  { value: "no_gst", label: "No GST" },
  { value: "inclusive", label: "GST Inclusive" },
  { value: "exclusive", label: "GST Exclusive" },
];

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
  "Dance Classes",
  "Zumba",
  "Aerobics",
  "Physiotherapy",
  "Nutrition Counseling",
  "Sports Training",
  "Other",
];

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
    description: "Free weights and machines",
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

const GymDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params?.mode === "edit";
  const ownerContactNumber = params?.ownerContact || null;
  const insets = useSafeAreaInsets();
  const [ownerProfileData, setOwnerProfileData] = useState(null);
  const [existingGyms, setExistingGyms] = useState([]);
  const [currentGymIndex, setCurrentGymIndex] = useState(0);

  const [form, setForm] = useState({
    gyms: [
      {
        name: "",
        contactNumber: "",
        sameAsOwner: false,
        total_trainers: "",
        floor_space: "",
        total_machineries: "",
        yearly_membership_cost: "",
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
        photos: [],
        areaPhotos: {},
        address: {
          street: "",
          area: "",
          city: "",
          state: "",
          pincode: "",
        },
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
      },
    ],
  });

  const [errors, setErrors] = useState({});
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState({
    show: false,
    rangeId: null,
    type: "",
  });
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState({});
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadGymData();
    }
    loadOwnerContact();
  }, []);

  const loadOwnerContact = async () => {
    try {
      if (ownerContactNumber) {
        return;
      }

      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      const role = await getToken("role");

      if (gymId && ownerId && role) {
        const response = await getProfileDataAPI(
          gymId,
          ownerId,
          null,
          null,
          role
        );
        const ownerData = response?.data?.owner_data;

        if (ownerData) {
          setOwnerProfileData(ownerData);
        }

        const gymData = response?.data?.gym_data;
        const gymsList = response?.data?.gyms;

        if (gymsList && Array.isArray(gymsList)) {
          setExistingGyms(gymsList);
        } else if (gymData) {
          setExistingGyms([gymData]);
        }
      }
    } catch (error) {}
  };

  const loadGymData = async () => {
    try {
      if (!isEditMode) return;

      const gymId = params?.gymId || (await getToken("gym_id"));
      const ownerId = await getToken("owner_id");
      const role = await getToken("role");

      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "Missing gym information for editing",
        });
        return;
      }

      const response = await getProfileDataAPI(
        gymId,
        ownerId,
        null,
        null,
        role
      );
      const gymData = response?.data?.gym_data;

      if (gymData) {
        const currentGym =
          Array.isArray(gymData) && gymData.length > 0 ? gymData[0] : gymData;

        if (currentGym) {
          setForm((prev) => ({
            ...prev,
            gyms: [
              {
                name: currentGym.gymName || currentGym.name || "",
                contactNumber: currentGym.contact_number || "",
                total_trainers: currentGym.total_trainers?.toString() || "",
                floor_space: currentGym.floor_space?.toString() || "",
                total_machineries:
                  currentGym.total_machineries?.toString() || "",
                yearly_membership_cost:
                  currentGym.yearly_membership_cost?.toString() || "",
                services: currentGym.services || [],
                operatingHours: currentGym.operating_hours || [],
                address: {
                  street: currentGym.address?.street || "",
                  area: currentGym.address?.area || "",
                  city: currentGym.address?.city || "",
                  state: currentGym.address?.state || "",
                  pincode: currentGym.address?.pincode || "",
                },
                accountDetails: {
                  accountNumber: currentGym.account_number || "",
                  confirmAccountNumber: currentGym.account_number || "",
                  ifscCode: currentGym.ifsc_code || "",
                  accountHolderName: currentGym.account_holder_name || "",
                  bankName: currentGym.bank_name || "",
                  branchName: currentGym.branch_name || "",
                  upiId: currentGym.upi_id || "",
                  gstNumber: currentGym.gst_number || "",
                  gstType: currentGym.gst_type || "no_gst",
                  gstPercentage: currentGym.gst_percentage || "18",
                },
              },
            ],
          }));
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to load gym data",
      });
    }
  };

  const validateField = (gymIndex, field, value, subField = null) => {
    const errorKey = subField
      ? `gym${gymIndex}${field}${subField}`
      : `gym${gymIndex}${field}`;
    const gym = form.gyms[gymIndex];
    let errorMessage = "";

    if (subField) {
      switch (field) {
        case "address":
          switch (subField) {
            case "street":
              if (!value.trim()) {
                errorMessage = "Street address is required";
              } else if (value.trim().length < 5) {
                errorMessage = "Street address must be at least 5 characters";
              }
              break;
            case "area":
              if (!value.trim()) {
                errorMessage = "Area is required";
              } else if (value.trim().length < 2) {
                errorMessage = "Area must be at least 2 characters";
              }
              break;
            case "city":
              if (!value.trim()) {
                errorMessage = "City is required";
              } else if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) {
                errorMessage = "City name contains invalid characters";
              }
              break;
            case "state":
              if (!value.trim()) {
                errorMessage = "State is required";
              } else if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) {
                errorMessage = "State name contains invalid characters";
              }
              break;
            case "pincode":
              if (!value.trim()) {
                errorMessage = "Pincode is required";
              } else if (!/^\d{6}$/.test(value.trim())) {
                errorMessage = "Pincode must be exactly 6 digits";
              }
              break;
          }
          break;
        case "accountDetails":
          switch (subField) {
            case "accountNumber":
              if (!value.trim()) {
                errorMessage = "Account number is required";
              } else if (!/^\d{9,18}$/.test(value.trim())) {
                errorMessage = "Account number must be 9-18 digits only";
              }
              break;
            case "confirmAccountNumber":
              if (!value.trim()) {
                errorMessage = "Please confirm your account number";
              } else {
                const currentAccountNumber =
                  form.gyms[gymIndex]?.accountDetails?.accountNumber || "";
                if (
                  currentAccountNumber &&
                  value.trim() !== currentAccountNumber.trim()
                ) {
                  errorMessage = "Account numbers do not match";
                }
              }
              break;
            case "ifscCode":
              // No inline validation for IFSC, only on submit
              // Clear any existing error and skip validation
              errorMessage = ""; // No error while typing
              break;
            case "accountHolderName":
              if (!value.trim()) {
                errorMessage = "Account holder name is required";
              } else if (value.trim().length < 2) {
                errorMessage =
                  "Account holder name must be at least 2 characters";
              } else if (!/^[a-zA-Z\s\.]+$/.test(value.trim())) {
                errorMessage =
                  "Account holder name should contain only letters, spaces, and dots";
              }
              break;
            case "upiId":
              if (value.trim() && !/^[\w\.\-]+@[\w\-]+$/.test(value.trim())) {
                errorMessage = "Invalid UPI ID format (e.g., user@paytm)";
              }
              break;
            case "gstNumber":
              if (
                value.trim() &&
                (gym?.accountDetails?.gstType === "inclusive" ||
                  gym?.accountDetails?.gstType === "exclusive")
              ) {
                if (
                  !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                    value.trim()
                  )
                ) {
                  errorMessage = "Invalid GST number format";
                }
              }
              break;
            case "gstPercentage":
              const gstPercentage = parseFloat(value);
              if (
                isNaN(gstPercentage) ||
                gstPercentage < 0 ||
                gstPercentage > 50
              ) {
                errorMessage = "GST percentage must be between 0 and 50";
              }
              break;
          }
          break;
      }
    } else {
      switch (field) {
        case "name":
          if (!value.trim()) {
            errorMessage = "Gym name is required";
          } else if (value.trim().length < 2) {
            errorMessage = "Gym name must be at least 2 characters";
          } else if (value.trim().length > 100) {
            errorMessage = "Gym name cannot exceed 100 characters";
          } else {
            const duplicateGym = form.gyms.find(
              (g, i) =>
                i !== gymIndex &&
                g.name.trim().toLowerCase() === value.trim().toLowerCase()
            );
            if (duplicateGym) {
              errorMessage = "Gym name must be unique";
            }
          }
          break;
        case "contactNumber":
          if (!value.trim()) {
            errorMessage = "Contact number is required";
          } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
            errorMessage =
              "Invalid mobile number format (must start with 6-9 and be 10 digits)";
          }
          break;
        case "total_trainers":
          if (!value.trim()) {
            errorMessage = "Total number of trainers is required";
          } else if (!/^\d+$/.test(value.trim())) {
            errorMessage = "Only numbers are allowed";
          }
          break;
        case "floor_space":
          if (!value.trim()) {
            errorMessage = "Floor space is required";
          } else if (!/^\d+$/.test(value.trim())) {
            errorMessage = "Only numbers are allowed";
          }
          break;
        case "total_machineries":
          if (!value.trim()) {
            errorMessage = "Total number of machineries is required";
          } else if (!/^\d+$/.test(value.trim())) {
            errorMessage = "Only numbers are allowed";
          }
          break;
        case "yearly_membership_cost":
          if (!value.trim()) {
            errorMessage = "Yearly membership cost is required";
          } else if (!/^\d+$/.test(value.trim())) {
            errorMessage = "Only numbers are allowed";
          }
          break;
      }
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (errorMessage) {
        newErrors[errorKey] = errorMessage;
      } else {
        delete newErrors[errorKey];
      }
      return newErrors;
    });

    return !errorMessage;
  };

  const handleInputChange = (gymIndex, field, value, subField = null) => {
    const updatedGyms = [...form.gyms];

    if (subField) {
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        [field]: {
          ...updatedGyms[gymIndex][field],
          [subField]: value,
        },
      };

      // Handle GST type change - auto-set percentage for inclusive/exclusive
      if (field === "accountDetails" && subField === "gstType") {
        if (value === "inclusive" || value === "exclusive") {
          updatedGyms[gymIndex].accountDetails.gstPercentage = "18";
        }
      }
    } else {
      if (field === "sameAsOwner" && value) {
        const contactToUse =
          ownerContactNumber || ownerProfileData?.contact_number;
        updatedGyms[gymIndex] = {
          ...updatedGyms[gymIndex],
          [field]: value,
          contactNumber: contactToUse || "",
        };
        setTimeout(
          () => validateField(gymIndex, "contactNumber", contactToUse || ""),
          0
        );
      } else if (field === "sameAsOwner" && !value) {
        updatedGyms[gymIndex] = {
          ...updatedGyms[gymIndex],
          [field]: value,
          contactNumber: "",
        };
      } else {
        updatedGyms[gymIndex] = {
          ...updatedGyms[gymIndex],
          [field]: value,
        };
      }
    }

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    validateField(gymIndex, field, value, subField);

    if (field === "accountDetails") {
      if (subField === "accountNumber") {
        const confirmAccountNumber =
          updatedGyms[gymIndex].accountDetails.confirmAccountNumber;
        if (confirmAccountNumber) {
          setTimeout(
            () =>
              validateField(
                gymIndex,
                "accountDetails",
                confirmAccountNumber,
                "confirmAccountNumber"
              ),
            0
          );
        }
      } else if (subField === "confirmAccountNumber") {
        const accountNumber =
          updatedGyms[gymIndex].accountDetails.accountNumber;
        if (
          accountNumber &&
          value.trim() &&
          accountNumber.trim() !== value.trim()
        ) {
        }
      } else if (subField === "ifscCode") {
        // Mark IFSC as unverified when user edits
        updatedGyms[gymIndex].ifscVerified = false;
        setForm((prev) => ({ ...prev, gyms: updatedGyms }));
      }
    }
  };

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

        showToast({
          type: "success",
          title: "Bank details loaded successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch bank details. Please check IFSC code.",
      });
    } finally {
      setBankDetailsLoading(false);
    }
  };

  const toggleService = (gymIndex, service) => {
    const updatedGyms = [...form.gyms];
    const currentServices = updatedGyms[gymIndex].services || [];

    if (currentServices.includes(service)) {
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        services: currentServices.filter((s) => s !== service),
      };
    } else {
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        services: [...currentServices, service],
      };
    }

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    const newServices = updatedGyms[gymIndex].services;
    const errorKey = `gym${gymIndex}services`;

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newServices.length === 0) {
        newErrors[errorKey] = "At least one service is required";
      } else if (newServices.length > 15) {
        newErrors[errorKey] = "Maximum 15 services allowed";
      } else {
        delete newErrors[errorKey];
      }
      return newErrors;
    });
  };

  const addCustomService = (gymIndex) => {
    const updatedGyms = [...form.gyms];
    const customService = updatedGyms[gymIndex].customService;
    if (!customService.trim()) return;

    const currentServices = updatedGyms[gymIndex].services || [];

    if (!currentServices.includes(customService)) {
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        services: [...currentServices, customService],
        customService: "",
      };
      setForm((prev) => ({ ...prev, gyms: updatedGyms }));
    }
  };

  const addTimeRange = (gymIndex) => {
    const updatedGyms = [...form.gyms];

    const newTimeRange = {
      id: Date.now().toString(),
      day: "everyday",
      customDays: [],
      startTime: "",
      endTime: "",
    };

    updatedGyms[gymIndex] = {
      ...updatedGyms[gymIndex],
      operatingHours: [
        ...(updatedGyms[gymIndex].operatingHours || []),
        newTimeRange,
      ],
    };

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    const errorKey = `gym${gymIndex}operatingHours`;
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  };

  const removeTimeRange = (gymIndex, id) => {
    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex] = {
      ...updatedGyms[gymIndex],
      operatingHours:
        updatedGyms[gymIndex].operatingHours?.filter(
          (range) => range.id !== id
        ) || [],
    };
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    const errorKey = `gym${gymIndex}operatingHours`;
    const operatingHours = updatedGyms[gymIndex].operatingHours;

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!operatingHours || operatingHours.length === 0) {
        newErrors[errorKey] = "Operating hours are required";
      } else {
        delete newErrors[errorKey];
      }
      return newErrors;
    });
  };

  const updateTimeRange = (gymIndex, id, field, value) => {
    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex] = {
      ...updatedGyms[gymIndex],
      operatingHours:
        updatedGyms[gymIndex].operatingHours?.map((range) =>
          range.id === id ? { ...range, [field]: value } : range
        ) || [],
    };
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    const errorKey = `gym${gymIndex}operatingHours`;
    const operatingHours = updatedGyms[gymIndex].operatingHours;

    setErrors((prev) => {
      const newErrors = { ...prev };

      if (!operatingHours || operatingHours.length === 0) {
        newErrors[errorKey] = "Operating hours are required";
      } else {
        let hasError = false;
        for (const timeRange of operatingHours) {
          if (!timeRange.startTime || !timeRange.endTime) {
            newErrors[errorKey] =
              "All time ranges must have start and end times";
            hasError = true;
            break;
          } else {
            const startTime = new Date(`1970-01-01T${timeRange.startTime}`);
            const endTime = new Date(`1970-01-01T${timeRange.endTime}`);
            if (startTime >= endTime) {
              newErrors[errorKey] = "End time must be after start time";
              hasError = true;
              break;
            }
          }
        }
        if (!hasError) {
          delete newErrors[errorKey];
        }
      }

      return newErrors;
    });
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
        selectedTime
      );
    }
    setShowTimePicker({ show: false, rangeId: null, type: "" });
  };

  const processUploadWithRetry = async (queueItem) => {
    const {
      id: queueId,
      areaId,
      gymIndex,
      uri: imageUri,
      areaName,
    } = queueItem;

    const attemptUpload = async (attempt) => {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? {
                ...item,
                status: `uploading (attempt ${attempt}/${queueItem.maxRetries})`,
              }
            : item
        )
      );

      const uploadResult = await uploadImageToServer(
        imageUri,
        areaId,
        gymIndex
      );

      if (uploadResult.success === false) {
        if (attempt < queueItem.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          return await attemptUpload(attempt + 1);
        } else {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: "failed",
                    error: uploadResult.error,
                    retryCount: attempt,
                  }
                : item
            )
          );

          showToast({
            type: "error",
            title: `Failed to upload ${areaName} photo after ${attempt} attempts: ${uploadResult.error}`,
          });

          return false;
        }
      }

      // Success - update form and queue
      const updatedGyms = [...form.gyms];
      updatedGyms[gymIndex] = {
        ...updatedGyms[gymIndex],
        areaPhotos: {
          ...updatedGyms[gymIndex].areaPhotos,
          [areaId]: {
            uri: imageUri,
            areaType: areaId,
            photo_id: uploadResult.photo_id,
            server_url: uploadResult.url,
            id: `area-${areaId}-${Date.now()}`,
          },
        },
      };
      setForm((prev) => ({ ...prev, gyms: updatedGyms }));

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, status: "completed", photo_id: uploadResult.photo_id }
            : item
        )
      );

      showToast({
        type: "success",
        title: `${areaName} photo uploaded successfully`,
      });

      return true;
    };

    return await attemptUpload(1);
  };

  const retryFailedUpload = async (queueItem) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === queueItem.id
          ? { ...item, retryCount: 0, status: "uploading" }
          : item
      )
    );

    await processUploadWithRetry(queueItem);
  };

  const clearCompletedUploads = () => {
    setUploadQueue((prev) =>
      prev.filter((item) => item.status !== "completed")
    );
  };

  const uploadImageToServer = async (imageUri, areaId, gymIndex) => {
    try {
      if (isEditMode) {
        const gymId = await getToken("gym_id");
        const ownerId = await getToken("owner_id");

        if (!gymId || !ownerId) {
          throw new Error("Missing gym or owner information");
        }

        const presignedPayload = {
          gym_id: gymId,
          owner_id: ownerId,
          area_type: areaId,
          file_type: "image/jpeg",
        };

        const presignedResponse = await getGymPhotosPresignedUrls(
          presignedPayload
        );

        if (presignedResponse?.status !== 200) {
          return {
            success: false,
            error: presignedResponse?.detail || "Failed to get upload URL",
          };
        }

        const { presigned_url, photo_id } = presignedResponse.data;

        const formData = new FormData();
        formData.append("file", {
          uri: imageUri,
          type: "image/jpeg",
          name: `gym_${areaId}_${Date.now()}.jpg`,
        });

        const uploadResponse = await fetch(presigned_url, {
          method: "PUT",
          body: formData,
          headers: {
            "Content-Type": "image/jpeg",
          },
        });

        if (!uploadResponse.ok) {
          return { success: false, error: "Failed to upload image" };
        }

        const confirmPayload = {
          photo_id: photo_id,
          gym_id: gymId,
          owner_id: ownerId,
        };

        const confirmResponse = await confirmGymPhotoUpload(confirmPayload);

        if (confirmResponse?.status === 200) {
          return {
            photo_id: photo_id,
            url: confirmResponse.data?.photo_url,
            area_type: areaId,
          };
        } else {
          return {
            success: false,
            error: confirmResponse?.detail || "Failed to confirm upload",
          };
        }
      } else {
        const fileName = `gym_${areaId}_${Date.now()}.jpg`;
        const fileExtension = fileName.split(".").pop();

        const ownerContact =
          ownerContactNumber || ownerProfileData?.contact_number;
        if (!ownerContact) {
          return {
            success: false,
            error: "Owner contact number is required for new gym photo upload",
          };
        }

        const presignedPayload = {
          owner_contact: ownerContact,
          gym_index: gymIndex,
          gym_name: form.gyms[gymIndex]?.name || `Gym ${gymIndex + 1}`,
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

        const presignedResponse = await getRegistrationPhotosPresignedUrls(
          presignedPayload
        );

        if (presignedResponse?.status !== 200) {
          return {
            success: false,
            error: presignedResponse?.detail || "Failed to get upload URL",
          };
        }

        const presignedData = presignedResponse.data.presigned_urls[0];
        const { upload_url, cdn_url, photo_id } = presignedData;

        const formData = new FormData();

        Object.entries(upload_url.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

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
          const errorText = await uploadResponse.text();
          return {
            success: false,
            error: `S3 upload failed: ${uploadResponse.status}`,
          };
        }

        const confirmPayload = {
          cdn_url: cdn_url,
          owner_contact: ownerContact,
          gym_index: gymIndex,
          photo_id: photo_id,
          area_type: areaId,
        };

        const confirmResponse = await confirmRegistrationPhotoUpload(
          confirmPayload
        );

        if (confirmResponse?.status === 200) {
          return {
            photo_id: photo_id,
            url: cdn_url,
            area_type: areaId,
          };
        } else {
          return {
            success: false,
            error: confirmResponse?.detail || "Failed to confirm upload",
          };
        }
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const renderAreaIcon = (area) => {
    if (area.iconLibrary === "MaterialIcons") {
      return <MaterialIcons name={area.icon} size={24} color={area.color} />;
    } else {
      return <Ionicons name={area.icon} size={24} color={area.color} />;
    }
  };

  const pickImageForArea = async (gymIndex, areaId) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Permission required to access photo library",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name || areaId;

        const queueId = Date.now();
        const newQueueItem = {
          id: queueId,
          areaId,
          gymIndex,
          uri: imageUri,
          status: "uploading",
          areaName: areaName,
          retryCount: 0,
          maxRetries: 3,
        };

        setUploadQueue((prev) => [...prev, newQueueItem]);

        await processUploadWithRetry(newQueueItem);
      }
    } catch (error) {
      showToast({ type: "error", title: "Failed to select image" });
    }
  };

  const takePhotoForArea = async (gymIndex, areaId) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Permission required to access camera",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name || areaId;

        const queueId = Date.now();
        const newQueueItem = {
          id: queueId,
          areaId,
          gymIndex,
          uri: imageUri,
          status: "uploading",
          areaName: areaName,
          retryCount: 0,
          maxRetries: 3,
        };

        setUploadQueue((prev) => [...prev, newQueueItem]);

        await processUploadWithRetry(newQueueItem);
      }
    } catch (error) {
      showToast({ type: "error", title: "Failed to take photo" });
    }
  };

  const removeAreaPhoto = async (gymIndex, areaId) => {
    const currentPhoto = form.gyms[gymIndex]?.areaPhotos?.[areaId];

    try {
      const ownerContact =
        ownerContactNumber || ownerProfileData?.contact_number;

      if (!ownerContact) {
        showToast({
          type: "error",
          title: "Owner contact not found",
        });
        return;
      }

      // Call backend API to remove photo
      const response = await axiosInstance.delete("/gym_photos/redis_delete", {
        data: {
          owner_contact: ownerContact,
          gym_index: gymIndex,
          photo_id: currentPhoto.photo_id,
        },
      });
     

      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Photo removed from server successfully",
        });
      } else {
        showToast({
          type: "error",
          title: "Photo removed locally, but server removal failed",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Photo removed locally, but server removal failed",
      });
    }

    const updatedGyms = [...form.gyms];
    updatedGyms[gymIndex] = {
      ...updatedGyms[gymIndex],
      areaPhotos: {
        ...updatedGyms[gymIndex].areaPhotos,
        [areaId]: undefined,
      },
    };
    setForm((prev) => ({ ...prev, gyms: updatedGyms }));

    setUploadQueue((prev) =>
      prev.filter(
        (item) => !(item.areaId === areaId && item.gymIndex === gymIndex)
      )
    );

    const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name;
    showToast({
      type: "info",
      title: `${areaName} photo removed`,
    });
  };

  const addGym = () => {
    const newGymIndex = form.gyms.length;
    const newGym = {
      name: "",
      contactNumber: "",
      sameAsOwner: false,
      total_trainers: "",
      floor_space: "",
      total_machineries: "",
      yearly_membership_cost: "",
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
      photos: [],
      areaPhotos: {},
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
      },
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
    };

    setForm((prev) => ({
      ...prev,
      gyms: [...prev.gyms, newGym],
    }));

    setCurrentGymIndex(newGymIndex);

    setShowPhotoSection((prev) => {
      const newPhotoSections = { ...prev };
      GYM_AREAS.forEach((area) => {
        newPhotoSections[`${newGymIndex}-${area.id}`] = false;
      });
      return newPhotoSections;
    });

    showToast({
      type: "success",
      title: "New gym added",
    });
  };

  const removeGym = (gymIndex) => {
    if (form.gyms.length <= 1) {
      showToast({
        type: "error",
        title: "Cannot remove the last gym",
      });
      return;
    }

    const updatedGyms = form.gyms.filter((_, index) => index !== gymIndex);

    let newCurrentGymIndex = currentGymIndex;
    if (gymIndex === currentGymIndex) {
      newCurrentGymIndex = gymIndex > 0 ? gymIndex - 1 : 0;
    } else if (gymIndex < currentGymIndex) {
      newCurrentGymIndex = currentGymIndex - 1;
    }

    setForm((prev) => ({ ...prev, gyms: updatedGyms }));
    setCurrentGymIndex(newCurrentGymIndex);

    showToast({
      type: "success",
      title: "Gym removed successfully",
    });
  };

  const switchToGym = (gymIndex) => {
    if (gymIndex >= 0 && gymIndex < form.gyms.length) {
      setCurrentGymIndex(gymIndex);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    form.gyms.forEach((gym, gymIndex) => {
      // Basic Information Validation
      if (!gym.name.trim()) {
        newErrors[`gym${gymIndex}name`] = "Gym name is required";
      } else if (gym.name.trim().length < 2) {
        newErrors[`gym${gymIndex}name`] =
          "Gym name must be at least 2 characters";
      } else if (gym.name.trim().length > 100) {
        newErrors[`gym${gymIndex}name`] =
          "Gym name cannot exceed 100 characters";
      }

      if (!gym.contactNumber.trim()) {
        newErrors[`gym${gymIndex}contactNumber`] = "Contact number is required";
      } else if (!/^[6-9]\d{9}$/.test(gym.contactNumber.trim())) {
        newErrors[`gym${gymIndex}contactNumber`] =
          "Invalid mobile number format (must start with 6-9 and be 10 digits)";
      }

      // New fields validation
      if (!gym.total_trainers?.trim()) {
        newErrors[`gym${gymIndex}total_trainers`] =
          "Total number of trainers is required";
      } else if (!/^\d+$/.test(gym.total_trainers.trim())) {
        newErrors[`gym${gymIndex}total_trainers`] = "Only numbers are allowed";
      }

      if (!gym.floor_space?.trim()) {
        newErrors[`gym${gymIndex}floor_space`] = "Floor space is required";
      } else if (!/^\d+$/.test(gym.floor_space.trim())) {
        newErrors[`gym${gymIndex}floor_space`] = "Only numbers are allowed";
      }

      if (!gym.total_machineries?.trim()) {
        newErrors[`gym${gymIndex}total_machineries`] =
          "Total number of machineries is required";
      } else if (!/^\d+$/.test(gym.total_machineries.trim())) {
        newErrors[`gym${gymIndex}total_machineries`] =
          "Only numbers are allowed";
      }

      if (!gym.yearly_membership_cost?.trim()) {
        newErrors[`gym${gymIndex}yearly_membership_cost`] =
          "Yearly membership cost is required";
      } else if (!/^\d+$/.test(gym.yearly_membership_cost.trim())) {
        newErrors[`gym${gymIndex}yearly_membership_cost`] =
          "Only numbers are allowed";
      }

      // Services Validation
      if (gym.services.length === 0) {
        newErrors[`gym${gymIndex}services`] =
          "At least one service is required";
      } else if (gym.services.length > 15) {
        newErrors[`gym${gymIndex}services`] = "Maximum 15 services allowed";
      }

      // Operating Hours Validation
      if (!gym.operatingHours || gym.operatingHours.length === 0) {
        newErrors[`gym${gymIndex}operatingHours`] =
          "Operating hours are required";
      } else {
        gym.operatingHours.forEach((timeRange, index) => {
          if (!timeRange.startTime || !timeRange.endTime) {
            newErrors[`gym${gymIndex}operatingHours`] =
              "All time ranges must have start and end times";
          } else {
            const startTime = new Date(`1970-01-01T${timeRange.startTime}`);
            const endTime = new Date(`1970-01-01T${timeRange.endTime}`);
            if (startTime >= endTime) {
              newErrors[`gym${gymIndex}operatingHours`] =
                "End time must be after start time";
            }
          }
        });
      }

      // Address Validation
      if (!gym.address.street.trim()) {
        newErrors[`gym${gymIndex}addressstreet`] = "Street address is required";
      } else if (gym.address.street.trim().length < 5) {
        newErrors[`gym${gymIndex}addressstreet`] =
          "Street address must be at least 5 characters";
      }

      if (!gym.address.area.trim()) {
        newErrors[`gym${gymIndex}addressarea`] = "Area is required";
      } else if (gym.address.area.trim().length < 2) {
        newErrors[`gym${gymIndex}addressarea`] =
          "Area must be at least 2 characters";
      }

      if (!gym.address.city.trim()) {
        newErrors[`gym${gymIndex}addresscity`] = "City is required";
      } else if (!/^[a-zA-Z\s\-'\.]+$/.test(gym.address.city.trim())) {
        newErrors[`gym${gymIndex}addresscity`] =
          "City name contains invalid characters";
      }

      if (!gym.address.state.trim()) {
        newErrors[`gym${gymIndex}addressstate`] = "State is required";
      } else if (!/^[a-zA-Z\s\-'\.]+$/.test(gym.address.state.trim())) {
        newErrors[`gym${gymIndex}addressstate`] =
          "State name contains invalid characters";
      }

      if (!gym.address.pincode.trim()) {
        newErrors[`gym${gymIndex}addresspincode`] = "Pincode is required";
      } else if (!/^\d{6}$/.test(gym.address.pincode.trim())) {
        newErrors[`gym${gymIndex}addresspincode`] =
          "Pincode must be exactly 6 digits";
      }

      // Bank Account Validation
      if (!gym.accountDetails.accountNumber.trim()) {
        newErrors[`gym${gymIndex}accountDetailsaccountNumber`] =
          "Account number is required";
      } else if (!/^\d{9,18}$/.test(gym.accountDetails.accountNumber.trim())) {
        newErrors[`gym${gymIndex}accountDetailsaccountNumber`] =
          "Account number must be 9-18 digits only";
      }

      if (!gym.accountDetails.confirmAccountNumber.trim()) {
        newErrors[`gym${gymIndex}accountDetailsconfirmAccountNumber`] =
          "Please confirm your account number";
      } else if (
        gym.accountDetails.accountNumber.trim() !==
        gym.accountDetails.confirmAccountNumber.trim()
      ) {
        newErrors[`gym${gymIndex}accountDetailsconfirmAccountNumber`] =
          "Account numbers do not match";
      }

      if (!gym.accountDetails.ifscCode.trim()) {
        newErrors[`gym${gymIndex}accountDetailsifscCode`] =
          "IFSC code is required";
      } else if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(gym.accountDetails.ifscCode.trim())
      ) {
        newErrors[`gym${gymIndex}accountDetailsifscCode`] =
          "Invalid IFSC code format (e.g., SBIN0001234)";
      }

      if (!gym.accountDetails.accountHolderName.trim()) {
        newErrors[`gym${gymIndex}accountDetailsaccountHolderName`] =
          "Account holder name is required";
      } else if (gym.accountDetails.accountHolderName.trim().length < 2) {
        newErrors[`gym${gymIndex}accountDetailsaccountHolderName`] =
          "Account holder name must be at least 2 characters";
      } else if (
        !/^[a-zA-Z\s\.]+$/.test(gym.accountDetails.accountHolderName.trim())
      ) {
        newErrors[`gym${gymIndex}accountDetailsaccountHolderName`] =
          "Account holder name should contain only letters, spaces, and dots";
      }

      // UPI Validation (Optional)
      if (
        gym.accountDetails.upiId.trim() &&
        !/^[\w\.\-]+@[\w\-]+$/.test(gym.accountDetails.upiId.trim())
      ) {
        newErrors[`gym${gymIndex}accountDetailsupiId`] =
          "Invalid UPI ID format (e.g., user@paytm)";
      }

      // GST Validation
      if (!gym.accountDetails.gstType.trim()) {
        newErrors[`gym${gymIndex}accountDetailsgstType`] =
          "GST type is required";
      }

      if (
        gym.accountDetails.gstType === "inclusive" ||
        gym.accountDetails.gstType === "exclusive"
      ) {
        if (
          gym.accountDetails.gstNumber.trim() &&
          !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            gym.accountDetails.gstNumber.trim()
          )
        ) {
          newErrors[`gym${gymIndex}accountDetailsgstNumber`] =
            "Invalid GST number format";
        }

        const gstPercentage = parseFloat(gym.accountDetails.gstPercentage);
        if (isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 50) {
          newErrors[`gym${gymIndex}accountDetailsgstPercentage`] =
            "GST percentage must be between 0 and 50";
        }
      }

      // Duplicate gym name check within the same form
      const duplicateGym = form.gyms.find(
        (g, i) =>
          i !== gymIndex &&
          g.name.trim().toLowerCase() === gym.name.trim().toLowerCase()
      );
      if (duplicateGym) {
        newErrors[`gym${gymIndex}name`] = "Gym name must be unique";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Get the first error message to show
      const firstErrorKey = Object.keys(errors)[0];
      const firstErrorMessage = errors[firstErrorKey];

      showToast({
        type: "error",
        title: firstErrorMessage || "Please fix all errors before submitting",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const ownerId = await getToken("owner_id");
      const gymId = await getToken("gym_id");

      if (!ownerId) {
        showToast({
          type: "error",
          title: "Owner information not found",
        });
        return;
      }

      const gymsData = form.gyms.map((gym) => {
        // const uploadedPhotos = Object.values(gym.areaPhotos || {})
        //   .filter((photo) => photo.photo_id)
        //   .map((photo) => ({
        //     photo_id: photo.photo_id,
        //     area_type: photo.areaType,
        //     url: photo.server_url,
        //   }));

        return {
          gymName: gym.name,
          contact_number: gym.contactNumber,
          total_trainers: gym.total_trainers,
          floor_space: gym.floor_space,
          total_machineries: gym.total_machineries,
          yearly_membership_cost: gym.yearly_membership_cost,
          services: gym.services,
          operating_hours: gym.operatingHours.map((oh) => ({
            id: oh.id,
            startTime: oh.startTime,
            endTime: oh.endTime,
            day:
              oh.day === "custom" && oh.customDays
                ? oh.customDays
                : oh.day || "everyday",
          })),
          address: gym.address,
          account_number: gym.accountDetails.accountNumber,
          ifsc_code: gym.accountDetails.ifscCode,
          account_holder_name: gym.accountDetails.accountHolderName,
          bank_name: gym.accountDetails.bankName,
          branch_name: gym.accountDetails.branchName,
          upi_id: gym.accountDetails.upiId,
          gst_number: gym.accountDetails.gstNumber,
          gst_type: gym.accountDetails.gstType,
          gst_percentage:
            gym.accountDetails.gstType === "no_gst"
              ? ""
              : gym.accountDetails.gstPercentage,
          // photos: uploadedPhotos,
        };
      });

      if (isEditMode) {
        const gymData = gymsData[0];
        const payload = {
          owner_id: ownerId,
          method: "profile",
          role: "owner",
          gym_data: gymData,
        };

        const response = await updateProfileAPI(payload);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Gym details updated successfully",
          });
          router.back();
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Failed to update gym details",
          });
        }
      } else {
        const payload = {
          owner_id: ownerId,
          gyms: gymsData,
        };

        const response = await addNewGymsAPI(payload);
        if (response?.status === 200) {
          const gymCount = gymsData.length;
          showToast({
            type: "success",
            title: `${gymCount} gym${
              gymCount > 1 ? "s" : ""
            } added successfully`,
          });
          router.back();
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Failed to add gyms",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while saving gym details",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServicesModal = () => (
    <Modal
      visible={showServicesModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowServicesModal(false)}
    >
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Services</Text>
            <TouchableOpacity onPress={() => setShowServicesModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.serviceOption,
                  form.gyms[currentGymIndex]?.services?.includes(service) &&
                    styles.serviceOptionSelected,
                ]}
                onPress={() => toggleService(currentGymIndex, service)}
              >
                <Text
                  style={[
                    styles.serviceOptionText,
                    form.gyms[currentGymIndex]?.services?.includes(service) &&
                      styles.serviceOptionTextSelected,
                  ]}
                >
                  {service}
                </Text>
                {form.gyms[currentGymIndex]?.services?.includes(service) && (
                  <Ionicons name="checkmark" size={20} color="#3498db" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {form.gyms[currentGymIndex]?.services?.includes("Other") && (
            <View style={styles.customServiceContainer}>
              <TextInput
                style={styles.customServiceInput}
                placeholder="Specify other service"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.customService || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "customService", value)
                }
              />
              {form.gyms[currentGymIndex]?.customService?.trim() && (
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => addCustomService(currentGymIndex)}
                >
                  <Text style={styles.addCustomButtonText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowServicesModal(false)}
          >
            <Text style={styles.modalDoneButtonText}>
              Done ({form.gyms[currentGymIndex]?.services?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler routePath="/owner/ownerprofile" enabled={true} />

      <NewOwnerHeader
        text={
          isEditMode
            ? "Edit Gym Details"
            : `${
                form.gyms.length > 1
                  ? `Gym Details (${currentGymIndex + 1}/${form.gyms.length})`
                  : "Add Gym Details"
              }`
        }
        onBackButtonPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditMode && (
            <View style={styles.gymNavigationContainer}>
              {form.gyms.length > 1 && (
                <View style={styles.gymNavigationHeader}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentGymIndex === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={() =>
                      currentGymIndex > 0 && switchToGym(currentGymIndex - 1)
                    }
                    disabled={currentGymIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentGymIndex === 0 ? "#ccc" : "#3498db"}
                    />
                    <Text
                      style={[
                        styles.navButtonText,
                        currentGymIndex === 0 && styles.navButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.gymCounter}>
                    <Text style={styles.gymCounterText}>
                      Gym {currentGymIndex + 1} of {form.gyms.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentGymIndex === form.gyms.length - 1 &&
                        styles.navButtonDisabled,
                    ]}
                    onPress={() =>
                      currentGymIndex < form.gyms.length - 1 &&
                      switchToGym(currentGymIndex + 1)
                    }
                    disabled={currentGymIndex === form.gyms.length - 1}
                  >
                    <Text
                      style={[
                        styles.navButtonText,
                        currentGymIndex === form.gyms.length - 1 &&
                          styles.navButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={
                        currentGymIndex === form.gyms.length - 1
                          ? "#ccc"
                          : "#3498db"
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.gymControlsContainer}>
                <TouchableOpacity style={styles.addGymButton} onPress={addGym}>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#3498db"
                  />
                  <Text style={styles.addGymButtonText}>Add Another Gym</Text>
                </TouchableOpacity>

                {form.gyms.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeGymButton}
                    onPress={() => removeGym(currentGymIndex)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                    <Text style={styles.removeGymButtonText}>
                      Remove This Gym
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gym Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors[`gym${currentGymIndex}name`] && styles.inputError,
                ]}
                placeholder="Enter gym name"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.name || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "name", value)
                }
              />
              {errors[`gym${currentGymIndex}name`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}name`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <View style={styles.contactContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter contact number"
                  placeholderTextColor="#999"
                  value={form.gyms[currentGymIndex]?.contactNumber || ""}
                  onChangeText={(value) =>
                    handleInputChange(currentGymIndex, "contactNumber", value)
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.sameAsOwnerButton}
                  onPress={() => {
                    handleInputChange(
                      currentGymIndex,
                      "sameAsOwner",
                      !form.gyms[currentGymIndex]?.sameAsOwner
                    );
                  }}
                >
                  <Switch
                    value={form.gyms[currentGymIndex]?.sameAsOwner || false}
                    onValueChange={(value) => {
                      handleInputChange(currentGymIndex, "sameAsOwner", value);
                    }}
                    trackColor={{ false: "#D0D0D0", true: "#3498db" }}
                    thumbColor={
                      form.gyms[currentGymIndex]?.sameAsOwner
                        ? "#FFFFFF"
                        : "#F4F3F4"
                    }
                  />
                  <Text style={styles.sameAsOwnerText}>Same as Owner</Text>
                </TouchableOpacity>
              </View>
              {errors[`gym${currentGymIndex}contactNumber`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}contactNumber`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Number of Trainers *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total number of trainers"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.total_trainers || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "total_trainers", value)
                }
                keyboardType="numeric"
              />
              {errors[`gym${currentGymIndex}total_trainers`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}total_trainers`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Floor Space (in sq.ft) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter floor space in sq.ft"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.floor_space || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "floor_space", value)
                }
                keyboardType="numeric"
              />
              {errors[`gym${currentGymIndex}floor_space`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}floor_space`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Total Number of Machineries *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total number of machineries"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.total_machineries || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "total_machineries", value)
                }
                keyboardType="numeric"
              />
              {errors[`gym${currentGymIndex}total_machineries`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}total_machineries`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Yearly Membership Plan Cost *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter yearly membership cost"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.yearly_membership_cost || ""}
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "yearly_membership_cost",
                    value
                  )
                }
                keyboardType="numeric"
              />
              {errors[`gym${currentGymIndex}yearly_membership_cost`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}yearly_membership_cost`]}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowServicesModal(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  !form.gyms[currentGymIndex]?.services?.length &&
                    styles.placeholderText,
                ]}
              >
                {form.gyms[currentGymIndex]?.services?.length > 0
                  ? `${form.gyms[currentGymIndex].services.length} services selected`
                  : "Select services"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#3498db" />
            </TouchableOpacity>

            {form.gyms[currentGymIndex]?.services?.length > 0 && (
              <View style={styles.selectedServicesContainer}>
                {form.gyms[currentGymIndex].services
                  .slice(0, 3)
                  .map((service) => (
                    <View key={service} style={styles.servicePill}>
                      <Text style={styles.servicePillText}>{service}</Text>
                    </View>
                  ))}
                {form.gyms[currentGymIndex].services.length > 3 && (
                  <View style={styles.servicePill}>
                    <Text style={styles.servicePillText}>
                      +{form.gyms[currentGymIndex].services.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}
            {errors[`gym${currentGymIndex}services`] && (
              <Text style={styles.errorText}>
                {errors[`gym${currentGymIndex}services`]}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Operating Hours *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addTimeRange(currentGymIndex)}
              >
                <Ionicons name="add" size={16} color="#3498db" />
                <Text style={styles.addButtonText}>Add Hours</Text>
              </TouchableOpacity>
            </View>

            {form.gyms[currentGymIndex]?.operatingHours?.map(
              (timeRange, index) => (
                <View key={timeRange.id} style={styles.timeRangeCard}>
                  <View style={styles.timeRangeHeader}>
                    <Text style={styles.timeRangeTitle}>
                      Time Range {index + 1}
                    </Text>
                    {form.gyms[currentGymIndex]?.operatingHours?.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() =>
                          removeTimeRange(currentGymIndex, timeRange.id)
                        }
                      >
                        <Ionicons name="close" size={16} color="#F44336" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.timeInputsContainer}>
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
                          {formatTime(timeRange.startTime) ||
                            "Select start time"}
                        </Text>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#3498db"
                        />
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
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#3498db"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.daysContainer}>
                    <Text style={styles.daysLabel}>Days:</Text>
                    <View style={styles.dayButtons}>
                      {[
                        "everyday",
                        "weekdays",
                        "weekends",
                        "sunday",
                        "custom",
                      ].map((dayOption) => (
                        <TouchableOpacity
                          key={dayOption}
                          style={[
                            styles.dayButton,
                            timeRange.day === dayOption &&
                              styles.dayButtonActive,
                          ]}
                          onPress={() =>
                            updateTimeRange(
                              currentGymIndex,
                              timeRange.id,
                              "day",
                              dayOption
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              timeRange.day === dayOption &&
                                styles.dayButtonTextActive,
                            ]}
                          >
                            {dayOption}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {timeRange.day === "custom" && (
                    <TextInput
                      style={styles.customDayInput}
                      placeholder="e.g., Mon, Wed, Fri"
                      placeholderTextColor="#767676"
                      value={timeRange.customDays || ""}
                      onChangeText={(value) =>
                        updateTimeRange(
                          currentGymIndex,
                          timeRange.id,
                          "customDays",
                          value
                        )
                      }
                    />
                  )}
                </View>
              )
            )}
            {errors[`gym${currentGymIndex}operatingHours`] && (
              <Text style={styles.errorText}>
                {errors[`gym${currentGymIndex}operatingHours`]}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address *</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.address?.street || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "address", value, "street")
                }
              />
              {errors[`gym${currentGymIndex}addressstreet`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}addressstreet`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter area"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.address?.area || ""}
                onChangeText={(value) =>
                  handleInputChange(currentGymIndex, "address", value, "area")
                }
              />
              {errors[`gym${currentGymIndex}addressarea`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}addressarea`]}
                </Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor="#999"
                  value={form.gyms[currentGymIndex]?.address?.city || ""}
                  onChangeText={(value) =>
                    handleInputChange(currentGymIndex, "address", value, "city")
                  }
                />
                {errors[`gym${currentGymIndex}addresscity`] && (
                  <Text style={styles.errorText}>
                    {errors[`gym${currentGymIndex}addresscity`]}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter state"
                  placeholderTextColor="#999"
                  value={form.gyms[currentGymIndex]?.address?.state || ""}
                  onChangeText={(value) =>
                    handleInputChange(
                      currentGymIndex,
                      "address",
                      value,
                      "state"
                    )
                  }
                />
                {errors[`gym${currentGymIndex}addressstate`] && (
                  <Text style={styles.errorText}>
                    {errors[`gym${currentGymIndex}addressstate`]}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pincode"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.address?.pincode || ""}
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "address",
                    value,
                    "pincode"
                  )
                }
                keyboardType="numeric"
                maxLength={6}
              />
              {errors[`gym${currentGymIndex}addresspincode`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}addresspincode`]}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Account Details *</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors[
                    `gym${currentGymIndex}accountDetailsaccountHolderName`
                  ] && styles.inputError,
                ]}
                placeholder="Enter account holder name"
                placeholderTextColor="#999"
                value={
                  form.gyms[currentGymIndex]?.accountDetails
                    ?.accountHolderName || ""
                }
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "accountDetails",
                    value,
                    "accountHolderName"
                  )
                }
              />
              {errors[
                `gym${currentGymIndex}accountDetailsaccountHolderName`
              ] && (
                <Text style={styles.errorText}>
                  {
                    errors[
                      `gym${currentGymIndex}accountDetailsaccountHolderName`
                    ]
                  }
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors[`gym${currentGymIndex}accountDetailsaccountNumber`] &&
                    styles.inputError,
                ]}
                placeholder="Enter account number"
                placeholderTextColor="#999"
                value={
                  form.gyms[currentGymIndex]?.accountDetails?.accountNumber ||
                  ""
                }
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "accountDetails",
                    value,
                    "accountNumber"
                  )
                }
                keyboardType="numeric"
              />
              {errors[`gym${currentGymIndex}accountDetailsaccountNumber`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}accountDetailsaccountNumber`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Account Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors[
                    `gym${currentGymIndex}accountDetailsconfirmAccountNumber`
                  ] && styles.inputError,
                ]}
                placeholder="Re-enter account number"
                placeholderTextColor="#999"
                value={
                  form.gyms[currentGymIndex]?.accountDetails
                    ?.confirmAccountNumber || ""
                }
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "accountDetails",
                    value,
                    "confirmAccountNumber"
                  )
                }
                keyboardType="numeric"
              />
              {errors[
                `gym${currentGymIndex}accountDetailsconfirmAccountNumber`
              ] && (
                <Text style={styles.errorText}>
                  {
                    errors[
                      `gym${currentGymIndex}accountDetailsconfirmAccountNumber`
                    ]
                  }
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <View style={styles.ifscContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1 },
                    errors[`gym${currentGymIndex}accountDetailsifscCode`] &&
                      styles.inputError,
                  ]}
                  placeholder="Enter IFSC code (e.g., SBIN0001234)"
                  placeholderTextColor="#999"
                  value={
                    form.gyms[currentGymIndex]?.accountDetails?.ifscCode || ""
                  }
                  onChangeText={(value) => {
                    handleInputChange(
                      currentGymIndex,
                      "accountDetails",
                      value.toUpperCase(),
                      "ifscCode"
                    );
                  }}
                  maxLength={11}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.ifscCheckButton,
                    (bankDetailsLoading ||
                      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
                        form.gyms[currentGymIndex]?.accountDetails?.ifscCode ||
                          ""
                      )) &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    fetchBankDetails(
                      form.gyms[currentGymIndex]?.accountDetails?.ifscCode,
                      currentGymIndex
                    )
                  }
                  disabled={
                    bankDetailsLoading ||
                    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
                      form.gyms[currentGymIndex]?.accountDetails?.ifscCode || ""
                    )
                  }
                >
                  {bankDetailsLoading ? (
                    <ActivityIndicator size={16} color="#FFF" />
                  ) : (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
              {/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
                form.gyms[currentGymIndex]?.accountDetails?.ifscCode || ""
              ) &&
                !form.gyms[currentGymIndex]?.ifscVerified && (
                  <Text style={styles.helperText}>
                    Click the tick button after entering IFSC code to auto-fill
                    bank details
                  </Text>
                )}
              {errors[`gym${currentGymIndex}accountDetailsifscCode`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}accountDetailsifscCode`]}
                </Text>
              )}
            </View>

            {form.gyms[currentGymIndex]?.accountDetails?.bankName && (
              <View style={styles.bankInfoContainer}>
                <Text style={styles.bankInfoLabel}>Bank Information:</Text>
                <Text style={styles.bankInfoText}>
                  Bank: {form.gyms[currentGymIndex]?.accountDetails?.bankName}
                </Text>
                <Text style={styles.bankInfoText}>
                  Branch:{" "}
                  {form.gyms[currentGymIndex]?.accountDetails?.branchName}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  errors[`gym${currentGymIndex}accountDetailsupiId`] &&
                    styles.inputError,
                ]}
                placeholder="username@paytm"
                placeholderTextColor="#999"
                value={form.gyms[currentGymIndex]?.accountDetails?.upiId || ""}
                onChangeText={(value) =>
                  handleInputChange(
                    currentGymIndex,
                    "accountDetails",
                    value,
                    "upiId"
                  )
                }
              />
              {errors[`gym${currentGymIndex}accountDetailsupiId`] && (
                <Text style={styles.errorText}>
                  {errors[`gym${currentGymIndex}accountDetailsupiId`]}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Details *</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowGstModal(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !form.gyms[currentGymIndex]?.accountDetails?.gstType &&
                      styles.placeholderText,
                  ]}
                >
                  {form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                  "no_gst"
                    ? "No GST"
                    : form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                      "inclusive"
                    ? "GST Inclusive"
                    : form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                      "exclusive"
                    ? "GST Exclusive"
                    : "Select GST type"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#3498db" />
              </TouchableOpacity>
              {errors.accountDetailsgstType && (
                <Text style={styles.errorText}>
                  {errors.accountDetailsgstType}
                </Text>
              )}
            </View>

            {(form.gyms[currentGymIndex]?.accountDetails?.gstType ===
              "inclusive" ||
              form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                "exclusive") && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GST Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter GST number"
                  placeholderTextColor="#999"
                  value={
                    form.gyms[currentGymIndex]?.accountDetails?.gstNumber || ""
                  }
                  onChangeText={(value) =>
                    handleInputChange(
                      currentGymIndex,
                      "accountDetails",
                      value,
                      "gstNumber"
                    )
                  }
                  autoCapitalize="characters"
                />
              </View>
            )}
          </View>

          {/* Gym Photos */}
          {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gym Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Upload photos of different areas of your gym
          </Text>

          <View style={styles.photosContainer}>
            {GYM_AREAS.map((area) => (
              <View key={area.id} style={styles.photoAreaContainer}>
                <View style={styles.photoAreaHeader}>
                  <View style={styles.photoAreaTitleContainer}>
                    {renderAreaIcon(area)}
                    <View style={styles.photoAreaTextContainer}>
                      <Text style={styles.photoAreaTitle}>{area.name}</Text>
                      <Text style={styles.photoAreaDescription}>
                        {area.description}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.photoToggleButton}
                    onPress={() =>
                      setShowPhotoSection((prev) => ({
                        ...prev,
                        [`${currentGymIndex}-${area.id}`]:
                          !prev[`${currentGymIndex}-${area.id}`],
                      }))
                    }
                  >
                    <Ionicons
                      name={
                        showPhotoSection[`${currentGymIndex}-${area.id}`]
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {showPhotoSection[`${currentGymIndex}-${area.id}`] && (
                  <View style={styles.photoAreaContent}>
                    {form.gyms[currentGymIndex]?.areaPhotos?.[area.id] ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image
                          source={{
                            uri: form.gyms[currentGymIndex]?.areaPhotos?.[
                              area.id
                            ]?.uri,
                          }}
                          style={styles.photoPreview}
                          contentFit="cover"
                        />
                        <View style={styles.photoActions}>
                          <TouchableOpacity
                            style={styles.photoActionButton}
                            onPress={() =>
                              pickImageForArea(currentGymIndex, area.id)
                            }
                          >
                            <Ionicons
                              name="images-outline"
                              size={16}
                              color="#3498db"
                            />
                            <Text style={styles.photoActionText}>Change</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.photoActionButton}
                            onPress={() =>
                              removeAreaPhoto(currentGymIndex, area.id)
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#F44336"
                            />
                            <Text
                              style={[
                                styles.photoActionText,
                                { color: "#F44336" },
                              ]}
                            >
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoUploadContainer}>
                        <Text style={styles.photoUploadText}>
                          No photo added for {area.name}
                        </Text>
                        <View style={styles.photoUploadButtons}>
                          <TouchableOpacity
                            style={styles.photoUploadButton}
                            onPress={() =>
                              pickImageForArea(currentGymIndex, area.id)
                            }
                          >
                            <Ionicons
                              name="images-outline"
                              size={20}
                              color="#3498db"
                            />
                            <Text style={styles.photoUploadButtonText}>
                              Gallery
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.photoUploadButton}
                            onPress={() =>
                              takePhotoForArea(currentGymIndex, area.id)
                            }
                          >
                            <Ionicons
                              name="camera-outline"
                              size={20}
                              color="#3498db"
                            />
                            <Text style={styles.photoUploadButtonText}>
                              Camera
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {uploadQueue.length > 0 && (
            <View style={styles.uploadQueueContainer}>
              <View style={styles.uploadQueueHeader}>
                <Text style={styles.uploadQueueTitle}>
                  Upload Queue ({uploadQueue.length})
                </Text>
                <TouchableOpacity
                  style={styles.clearQueueButton}
                  onPress={clearCompletedUploads}
                >
                  <Text style={styles.clearQueueText}>Clear Completed</Text>
                </TouchableOpacity>
              </View>
              {uploadQueue.map((item) => (
                <View key={item.id} style={styles.uploadQueueItem}>
                  <View style={styles.uploadQueueItemLeft}>
                    <Text style={styles.uploadQueueItemText}>
                      {item.areaName}
                    </Text>
                    {item.status === "failed" && (
                      <Text style={styles.errorMessage}>{item.error}</Text>
                    )}
                  </View>
                  <View style={styles.uploadQueueItemRight}>
                    <View
                      style={[
                        styles.uploadQueueStatus,
                        {
                          backgroundColor:
                            item.status === "completed"
                              ? "#4CAF50"
                              : item.status === "failed"
                              ? "#F44336"
                              : item.status.includes("uploading")
                              ? "#FF9800"
                              : "#2196F3",
                        },
                      ]}
                    >
                      <Text style={styles.uploadQueueStatusText}>
                        {item.status === "completed"
                          ? "Uploaded"
                          : item.status === "failed"
                          ? "Failed"
                          : item.status.includes("uploading")
                          ? item.status
                          : item.status}
                      </Text>
                    </View>
                    {item.status === "failed" && (
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => retryFailedUpload(item)}
                      >
                        <Ionicons name="refresh" size={16} color="#3498db" />
                        <Text style={styles.retryText}>Retry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditMode ? "Update Gym Details" : "Save Gym Details"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderServicesModal()}

      {/* GST Modal */}
      <Modal
        visible={showGstModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGstModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select GST Type</Text>
              <TouchableOpacity onPress={() => setShowGstModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {gstTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.gstOption,
                    form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                      type.value && styles.gstOptionSelected,
                  ]}
                  onPress={() => {
                    handleInputChange(
                      currentGymIndex,
                      "accountDetails",
                      type.value,
                      "gstType"
                    );
                    setShowGstModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.gstOptionText,
                      form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                        type.value && styles.gstOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {form.gyms[currentGymIndex]?.accountDetails?.gstType ===
                    type.value && (
                    <Ionicons name="checkmark" size={20} color="#3498db" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Time Picker */}
      <CustomTimePicker
        visible={showTimePicker.show}
        onClose={() =>
          setShowTimePicker({ show: false, rangeId: null, type: "" })
        }
        onConfirm={onTimeChange}
        initialTime={
          showTimePicker.rangeId && showTimePicker.type
            ? form.gyms[currentGymIndex]?.operatingHours?.find(
                (range) => range.id === showTimePicker.rangeId
              )?.[showTimePicker.type === "start" ? "startTime" : "endTime"]
            : new Date()
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#F44336",
    borderWidth: 2,
    backgroundColor: "#FFEBEE",
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sameAsOwnerButton: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  sameAsOwnerText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#666",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  selectorText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  selectedServicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  servicePill: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  servicePillText: {
    fontSize: 12,
    color: "#3498db",
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "500",
    marginLeft: 4,
  },
  timeRangeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timeRangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeRangeTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  removeButton: {
    padding: 4,
  },
  timeInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 16,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
  },
  dayButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  dayButtonActive: {
    backgroundColor: "#3498db",
  },
  dayButtonText: {
    fontSize: 12,
    color: "#666",
  },
  dayButtonTextActive: {
    color: "#FFFFFF",
  },
  customDayInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#FFF",
    color: "#333",
    marginTop: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  ifscContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  },
  loadingIcon: {
    marginLeft: 8,
  },
  bankInfoContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bankInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2E7D32",
    marginBottom: 4,
  },
  bankInfoText: {
    fontSize: 12,
    color: "#2E7D32",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3498db",
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  serviceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceOptionSelected: {
    backgroundColor: "#E3F2FD",
  },
  serviceOptionText: {
    fontSize: 16,
    color: "#333",
  },
  serviceOptionTextSelected: {
    color: "#3498db",
    fontWeight: "500",
  },
  customServiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  customServiceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addCustomButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addCustomButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  modalDoneButton: {
    backgroundColor: "#3498db",
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalDoneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  gstOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  gstOptionSelected: {
    backgroundColor: "#E3F2FD",
  },
  gstOptionText: {
    fontSize: 16,
    color: "#333",
  },
  gstOptionTextSelected: {
    color: "#3498db",
    fontWeight: "500",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  photosContainer: {
    marginTop: 8,
  },
  photoAreaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  photoAreaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  photoAreaTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  photoAreaTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  photoAreaTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  photoAreaDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  photoToggleButton: {
    padding: 4,
  },
  photoAreaContent: {
    padding: 12,
  },
  photoPreviewContainer: {
    alignItems: "center",
  },
  photoPreview: {
    width: width - 64,
    height: ((width - 64) * 9) / 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  photoActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  photoActionText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
    fontWeight: "500",
  },
  photoUploadContainer: {
    alignItems: "center",
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 8,
  },
  photoUploadText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  photoUploadButtons: {
    flexDirection: "row",
    gap: 16,
  },
  photoUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  photoUploadButtonText: {
    fontSize: 14,
    color: "#3498db",
    marginLeft: 6,
    fontWeight: "500",
  },
  uploadQueueContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  uploadQueueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadQueueTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#F57C00",
  },
  clearQueueButton: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearQueueText: {
    fontSize: 12,
    color: "#3498db",
    fontWeight: "500",
  },
  uploadQueueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  uploadQueueItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  uploadQueueItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadQueueItemText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: 10,
    color: "#F44336",
    marginTop: 2,
  },
  uploadQueueStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  uploadQueueStatusText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  retryText: {
    fontSize: 10,
    color: "#3498db",
    fontWeight: "500",
  },
  timePickerContainer: {
    flex: 1,
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
  timeSeparatorText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  placeholderText: {
    color: "#AAA",
  },
  gymNavigationContainer: {
    backgroundColor: "#F8F9FA",
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  gymNavigationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
  },
  navButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  navButtonText: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "500",
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: "#ccc",
  },
  gymCounter: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  gymCounterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  gymControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  addGymButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  addGymButtonText: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "600",
    marginLeft: 6,
  },
  removeGymButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F44336",
  },
  removeGymButtonText: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default GymDetails;
``;
