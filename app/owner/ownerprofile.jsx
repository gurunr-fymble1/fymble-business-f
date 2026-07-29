import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OwnerProfileSkeleton from "../../components/ui/loaders/ownerProfileSkeleton";
import {
  changeGymLocationAPI,
  getBankDetailsFromIFSC,
  getDocumentPicsAPI,
  getOwnerGymBasicDetailsAPI,
  getOwnerPersonalDetailsAPI,
  getPaymentDetailsAPI,
  getPrefilledAgreementAPI,
  updateProfileAPI,
} from "../../services/Api";
// import UpiQRCode from "../../components/UPIQRCode";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomTimePicker from "../../components/ui/CustomTimePicker";
import { Image, ImageBackground } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { FullImageModal } from "../../components/profile/FullImageModal";
import axiosInstance from "../../services/axiosInstance";
import { deleteToken, getToken, saveToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

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

const WEEKDAYS = [
  { key: 0, label: "Monday", short: "Mon" },
  { key: 1, label: "Tuesday", short: "Tue" },
  { key: 2, label: "Wednesday", short: "Wed" },
  { key: 3, label: "Thursday", short: "Thu" },
  { key: 4, label: "Friday", short: "Fri" },
  { key: 5, label: "Saturday", short: "Sat" },
  { key: 6, label: "Sunday", short: "Sun" },
];

const DEFAULT_OPEN = "06:00";
const DEFAULT_CLOSE = "22:00";

// Build schedule map from API array: { 0: { enabled, open_time, close_time }, ... }
const buildScheduleFromAPI = (apiHours) => {
  const schedule = {};
  WEEKDAYS.forEach((d) => {
    schedule[d.key] = { enabled: false, open_time: DEFAULT_OPEN, close_time: DEFAULT_CLOSE };
  });
  if (Array.isArray(apiHours)) {
    apiHours.forEach((h) => {
      if (h.weekday !== undefined && h.weekday !== null) {
        schedule[h.weekday] = { enabled: true, open_time: h.open_time, close_time: h.close_time };
      }
    });
  }
  return schedule;
};

// Extract "HH:MM" from ISO string like "2026-07-06T06:00:00.000"
const isoToHHMM = (iso) => {
  if (!iso) return null;
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

// Convert "HH:MM" (24h) to display "h:mm AM/PM"
const formatHHMM = (hhmm) => {
  if (!hhmm) return "N/A";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Convert "HH:MM" to fake ISO for CustomTimePicker's initialTime
const hhmmToIso = (hhmm) => {
  if (!hhmm) return undefined;
  return `2000-01-01T${hhmm}:00.000`;
};

// Convert schedule map to payload array (only enabled days)
const scheduleToPayload = (schedule) => {
  const data = [];
  WEEKDAYS.forEach((d) => {
    const entry = schedule[d.key];
    if (entry.enabled && entry.open_time && entry.close_time) {
      data.push({ weekday: d.key, open_time: entry.open_time, close_time: entry.close_time });
    }
  });
  return data;
};

// Format schedule for read-only display string
const formatScheduleDisplay = (apiHours) => {
  if (!Array.isArray(apiHours) || apiHours.length === 0) return "N/A";
  const dayMap = { 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun" };
  return apiHours
    .map((h) => `${dayMap[h.weekday] || h.weekday}: ${formatHHMM(h.open_time)} - ${formatHHMM(h.close_time)}`)
    .join("\n");
};

const ImageUploadModal = ({
  isVisible,
  onClose,
  onImageSelect,
  title,
  aspectRatio = [16, 9],
}) => {
  const selectImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your photo library to upload images.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled) {
        onImageSelect(result.assets[0]);
        onClose();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Failed to select Image",
      });
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your camera to take photos.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled) {
        onImageSelect(result.assets[0]);
        onClose();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error || "Failed to take photo",
      });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.imageUploadModalContainer}>
          <View style={styles.passwordModalHeader}>
            <Text style={styles.passwordModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.uploadOptionsContainer}>
            <TouchableOpacity style={styles.uploadOption} onPress={selectImage}>
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="images-outline" size={24} color="#3498db" />
              </View>
              <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="camera-outline" size={24} color="#3498db" />
              </View>
              <Text style={styles.uploadOptionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OwnerProfile = () => {
  const [gymData, setGymData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [activeTab, setActiveTab] = useState(params?.activeTab || "gym");
  const [isEditing, setIsEditing] = useState(false);

  // Update activeTab when params change (for navigation back with params)
  useEffect(() => {
    if (params?.activeTab) {
      setActiveTab(params.activeTab);
    }
  }, [params?.activeTab]);

  // Fetch documents when documents tab is active
  useEffect(() => {
    if (activeTab === "documents") {
      fetchProfileDocuments();
    }
  }, [activeTab]);

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [personalDetails, setPersonalDetails] = useState([]);
  const [gymDetails, setGymDetails] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  const [pendingPaymentEditRequest, setPendingPaymentEditRequest] =
    useState(null);
  const [gymID, setGymID] = useState(null);
  const [accountID, setaccountID] = useState(null);
  const [isFullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);
  const [isServicesModalVisible, setServicesModalVisible] = useState(false);

  const [isLogoUploadModalVisible, setLogoUploadModalVisible] = useState(false);
  const [isCoverUploadModalVisible, setCoverUploadModalVisible] =
    useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Document upload states
  const [profileDocuments, setProfileDocuments] = useState([
    {
      id: 1,
      title: "Bank Document",
      subtitle: "Passbook / Cancelled Cheque / Account Statement",
      icon: "business-outline",
      image_url: null,
      key: "bank_document",
    },
    {
      id: 2,
      title: "PAN Card",
      subtitle: "Clear photo of your PAN Card",
      icon: "card-outline",
      image_url: null,
      key: "pan_card",
    },
  ]);
  const [showDocOptionsForId, setShowDocOptionsForId] = useState(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [prefilledAgreement, setPrefilledAgreement] = useState(null);

  const handleImageClick = (imageSource) => {
    setFullImageSource(imageSource);
    setFullImageModalVisible(true);
  };

  const handleLogoUpload = async (imageAsset) => {
    setIsUploadingLogo(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const { data: uploadResp } = await axiosInstance.get(
        "/gym_profile/upload-url",
        {
          params: {
            gym_id: gym_id,
            extension: extension,
            scope: "logo",
          },
        },
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      const s3Resp = await fetch(upload.url, {
        method: "POST",
        body: form,
      });

      if (s3Resp.status !== 204 && s3Resp.status !== 201) {
        showToast({
          type: "error",
          title: "Failed to upload logo. Please try again.",
        });
        return;
      }

      const res = await axiosInstance.post("/gym_profile/confirm", {
        cdn_url,
        gym_id: gym_id,
        scope: "logo",
      });

      if (res?.status === 200) {
        await getProfileData();
        showToast({
          type: "success",
          title: "Logo updated successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to upload logo. Please try again.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (imageAsset) => {
    setIsUploadingCover(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      const { data: uploadResp } = await axiosInstance.get(
        "/gym_profile/upload-url",
        {
          params: {
            gym_id: gym_id,
            extension,
            scope: "cover_pic",
          },
        },
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      const s3Resp = await fetch(upload.url, {
        method: "POST",
        body: form,
      });

      if (s3Resp.status !== 204 && s3Resp.status !== 201) {
        showToast({
          type: "error",
          title: "Failed to upload cover photo. Please try again.",
        });
        return;
      }

      const res = await axiosInstance.post("/gym_profile/confirm", {
        cdn_url,
        gym_id: gym_id,
        scope: "cover_pic",
      });

      if (res?.status === 200) {
        await getProfileData();
        showToast({
          type: "success",
          title: "Cover photo updated successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to upload cover photo. Please try again.",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const [editData, setEditData] = useState({
    name: "",
    email: "",
    contact_number: "",
    dob: "",
    age: "",
    gymName: "",
    location: "",
    account_number: "",
    account_holdername: "",
    account_ifsccode: "",
    account_branch: "",
    account_id: "",
    upi_id: "",
    gst_number: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dob, setDob] = useState(null);
  const [tempDob, setTempDob] = useState(new Date());
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState({
    show: false,
    weekday: null,
    type: "",
  });
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [showOperatingHoursModal, setShowOperatingHoursModal] = useState(false);

  const getGymInfo = () => {
    if (Array.isArray(gymData) && gymData.length > 0) {
      return gymData[0];
    } else {
      return gymData;
    }
  };

  const handleEditPress = () => {
    if (userRole === "trainer") return;

    // Navigate to separate edit page for gym details
    if (activeTab === "gym") {
      router.push({
        pathname: "/owner/editgymdetails",
        params: {
          gymData: JSON.stringify(gymData),
          gymID: gymID,
        },
      });
      return;
    }

    // Navigate to separate edit page for personal details
    if (activeTab === "personal") {
      router.push({
        pathname: "/owner/editpersonaldetails",
        params: {
          personalData: JSON.stringify(ownerData),
          ownerID: ownerData?.owner_id,
        },
      });
      return;
    }

    // For other tabs, use inline editing (payment)
    setEditData({
      // Personal details - will be populated from personal details API later
      name: "",
      email: "",
      contact_number: "",
      dob: "",
      // Gym details - from gymData state
      gymName: gymData?.name || "",
      location: "", // Location not in new API
      referral_id: null,
      gym_contact_number: gymData?.contact_number || "",
      services: (() => {
        const gymInfo =
          Array.isArray(gymData) && gymData.length > 0 ? gymData[0] : gymData;

        const servicesFromGymData = gymData?.services;
        const servicesFromGymInfo = gymInfo?.services;

        let services = servicesFromGymData || servicesFromGymInfo || [];

        if (typeof services === "string") {
          try {
            services = JSON.parse(services);
          } catch (e) {
            services = services
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
        }

        if (!Array.isArray(services)) {
          services = [];
        }

        return services;
      })(),
      hoursSchedule: buildScheduleFromAPI(gymData?.operating_hours),
      applyAllExceptSunday: false,
      address_street: gymData?.address?.street || "",
      address_area: gymData?.address?.area || "",
      address_city: gymData?.address?.city || "",
      address_state: gymData?.address?.state || "",
      address_pincode: gymData?.address?.pincode || "",
      total_trainers: gymData?.total_trainers?.toString() || "",
      floor_space: gymData?.floor_space?.toString() || "",
      total_machineries: gymData?.total_machineries?.toString() || "",
      yearly_membership_cost: gymData?.yearly_membership_cost?.toString() || "",
      // Payment details - will be populated from payment details API later
      account_number: "",
      account_holdername: "",
      account_ifsccode: "",
      account_branch: "",
      account_id: "",
      bank_name: "",
      upi_id: "",
      gst_type: gymData?.gst_type || "no_gst",
      gst_number: "",
      confirm_account_number: "",
      ifsc_code: "",
      account_holder_name: "",
      branch_name: "",
      gst_percentage: gymData?.gst_percentage || "18",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const toggleService = (service) => {
    const currentServices = editData.services || [];

    if (currentServices.includes(service)) {
      setEditData((prev) => ({
        ...prev,
        services: currentServices.filter((s) => s !== service),
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        services: [...currentServices, service],
      }));
    }
  };

  const toggleScheduleDay = (weekday) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      sched[weekday] = { ...sched[weekday], enabled: !sched[weekday].enabled };
      return { ...prev, hoursSchedule: sched };
    });
  };

  const updateScheduleTime = (weekday, field, hhmm) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      sched[weekday] = { ...sched[weekday], [field]: hhmm };
      // If apply-all is on and editing Monday, propagate to Tue–Sat
      if (prev.applyAllExceptSunday && weekday === 0) {
        for (let i = 1; i <= 5; i++) {
          sched[i] = { ...sched[i], [field]: hhmm };
        }
      }
      return { ...prev, hoursSchedule: sched };
    });
  };

  const handleApplyAllToggle = (value) => {
    setEditData((prev) => {
      const sched = { ...prev.hoursSchedule };
      if (value) {
        const mon = sched[0];
        for (let i = 1; i <= 5; i++) {
          sched[i] = { enabled: mon.enabled, open_time: mon.open_time, close_time: mon.close_time };
        }
      }
      return { ...prev, applyAllExceptSunday: value, hoursSchedule: sched };
    });
  };

  const isScheduleDayEditable = (weekday) => {
    if (editData.applyAllExceptSunday && weekday >= 1 && weekday <= 5) return false;
    return true;
  };

  const onTimeChange = (selectedTime) => {
    const { weekday, type } = showTimePicker;
    if (weekday === null || weekday === undefined || !type) return;
    const hhmm = isoToHHMM(selectedTime);
    if (hhmm) {
      const field = type === "open" ? "open_time" : "close_time";
      updateScheduleTime(weekday, field, hhmm);
    }
    setShowTimePicker({ show: false, weekday: null, type: "" });
  };

  const fetchBankDetails = async (ifscCode) => {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) return;

    setBankDetailsLoading(true);
    try {
      const response = await getBankDetailsFromIFSC(ifscCode);
      if (response.status === 200 && response.data) {
        setEditData((prev) => ({
          ...prev,
          bank_name: response.data.BANK,
          branch_name: response.data.BRANCH,
        }));
      }
    } catch (error) {
    } finally {
      setBankDetailsLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate && event.type !== "dismissed") {
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const year = selectedDate.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;
        setDob(selectedDate);
        setEditData({ ...editData, dob: formattedDate });
      }
    } else {
      if (selectedDate) {
        setTempDob(selectedDate);
      }
    }
  };

  const logout = async () => {
    try {
      // List of all possible tokens and user data to clear
      const tokensToDelete = [
        "access_token",
        "refresh_token",
        "owner_id",
        "trainer_id",
        "role",
        "gym_id",
        "gym_name",
        "name",
        "gym_logo",
      ];

      // Clear all tokens
      for (const token of tokensToDelete) {
        await deleteToken(token);
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const confirmDateSelection = () => {
    const day = String(tempDob.getDate()).padStart(2, "0");
    const month = String(tempDob.getMonth() + 1).padStart(2, "0");
    const year = tempDob.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;
    setDob(tempDob);
    setEditData({ ...editData, dob: formattedDate });
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDob(dob || new Date());
    setShowDatePicker(false);
  };

  const handleEditSubmit = async () => {
    try {
      const owner_id = await getToken("owner_id");
      if (!owner_id) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
        return;
      }
      if (!gymID) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
        return;
      }

      // Validate age if date of birth is provided
      if (editData.dob) {
        const dobDate = new Date(editData.dob);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ) {
          age--;
        }

        if (age < 18) {
          showToast({
            type: "error",
            title: "You must be at least 18 years old",
          });
          return;
        }
      }

      let formattedDob = editData.dob;
      if (editData.dob && editData.dob.includes("/")) {
        const [day, month, year] = editData.dob.split("/");
        formattedDob = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0",
        )}`;
      }

      const owner_data = {
        name: editData.name,
        email: editData.email,
        contact_number: editData.contact_number,
        dob: formattedDob,
      };

      const gym_data = {
        gym_id: gymID,
        gymName: editData.gymName,
        location: editData.location,
        referral_id: editData.referral_id,
        contact_number: editData.gym_contact_number,
        total_trainers: editData.total_trainers,
        floor_space: editData.floor_space,
        total_machineries: editData.total_machineries,
        yearly_membership_cost: editData.yearly_membership_cost,
        services: editData.services,
        operating_hours: scheduleToPayload(editData.hoursSchedule),
        address: {
          street: editData.address_street,
          area: editData.address_area,
          city: editData.address_city,
          state: editData.address_state,
          pincode: editData.address_pincode,
        },
        account_number: editData.account_number,
        account_holdername: editData.account_holdername,
        account_ifsccode: editData.account_ifsccode,
        account_branch: editData.account_branch,
        account_id: accountID,
        bank_name: editData.bank_name,
        upi_id: editData.upi_id,
        gst_type: editData.gst_type,
        gst_number: editData.gst_number,
      };

      const payload = {
        owner_id,
        method: "profile",
        role: "owner",
        owner_data: owner_data,
        gym_data: gym_data,
      };

      const response = await updateProfileAPI(payload);
      if (response?.status === 200) {
        // Save updated gym name to secure store
        if (editData.gymName) {
          await saveToken("gym_name", editData.gymName);
        }

        if (response?.is_changed) {
          Alert.alert(
            "Verification Required",
            "Please Login & Verify Your Mobile Number Again to Continue",
            [
              {
                text: "OK",
                onPress: async () => {
                  try {
                    if (await logout()) {
                      router.replace("/");
                    }
                  } catch (error) {
                    showToast({
                      type: "error",
                      title: "Error Logging out",
                    });
                  }
                },
              },
            ],
          );
        }
        showToast({
          type: "success",
          title: "Profile updated successfully",
        });
        setIsEditing(false);
        await getProfileData();
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update profile",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating profile",
      });
    }
  };

  const handleChangePassword = async () => {
    if (userRole === "trainer") return;

    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmNewPassword
    ) {
      showToast({
        type: "error",
        title: "Please fill all the fields",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToast({
        type: "error",
        title: "New passwords do not match",
      });
      return;
    }

    const owner_id = await getToken("owner_id");
    delete passwordData.confirmNewPassword;
    const payload = {
      ...passwordData,
      role: "owner",
      method: "password",
      owner_id: owner_id,
    };

    try {
      const response = await updateProfileAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Password changed successfully",
        });
        setPasswordModalVisible(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to change password",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong. Please try again later",
      });
    }
  };

  const getGymLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== "granted") {
        setIsLocationLoading(false);

        if (!canAskAgain) {
          Alert.alert(
            "Permission Blocked",
            "Location access has been blocked. Please enable it manually from your phone's settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ],
          );
        } else {
          showToast({
            type: "error",
            title:
              "Location permission is required to set your gym's location.",
          });
        }
        return;
      }

      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      let location = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!location && attempts < maxAttempts) {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? Location.LocationAccuracy.High
                : Location.LocationAccuracy.Best,
            maximumAge: 10000,
            timeout: 10000,
          });
          break;
        } catch (locationError) {
          attempts++;

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw locationError;
          }
        }
      }

      if (!location) {
        throw new Error("Unable to get location after multiple attempts");
      }

      setIsLocationLoading(false);
      return location.coords;
    } catch (error) {
      setIsLocationLoading(false);

      let errorMessage =
        "Could not get your current location. Please try again.";

      if (error.message.includes("denied")) {
        errorMessage =
          "Location access was denied. Please enable location permissions in settings.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.message.includes("unavailable")) {
        errorMessage =
          "Location services are unavailable. Please check your device settings.";
      } else if (error.message.includes("multiple attempts")) {
        errorMessage =
          "Unable to get accurate location. Please ensure location services are enabled and try again.";
      }

      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const updateGymLocation = async () => {
    try {
      setIsLocationLoading(true);
      const coords = await getGymLocation();
      if (!coords) {
        setIsLocationLoading(false);
        return;
      }

      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setIsLocationLoading(false);
        return;
      }

      const payload = {
        gym_id: gymId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const response = await changeGymLocationAPI(payload);
      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Your gym location has been updated!",
        });
      } else {
        showToast({
          type: "error",
          title: response.detail || "Failed to update location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating your gym location",
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const getProfileData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      const role = await getToken("role");
      setUserRole(role);

      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "Something went wrong, please try again later.",
        });
        return;
      }

      // Call the new gym basic details API
      const response = await getOwnerGymBasicDetailsAPI(gymId, ownerId);

      if (response?.status !== 200) {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch gym details",
        });
        return;
      }

      const gymInfo = response?.data;
      setGymData(gymInfo);
      setGymID(gymInfo?.gym_id);

      // Build gym details - only name, contact, address, services, operating_hours
      const gymDetailsData = [
        {
          key: "gymName",
          label: "Name",
          icon: "business-outline",
          value: gymInfo?.name || "N/A",
        },
        {
          key: "contact_number",
          label: "Contact Number",
          icon: "call-outline",
          value: gymInfo?.contact_number || "N/A",
        },
        {
          key: "services",
          label: "Services",
          icon: "fitness-outline",
          value:
            gymInfo?.services && gymInfo.services.length > 0
              ? gymInfo.services.slice(0, 3).join(", ")
              : "N/A",
          extraCount:
            gymInfo?.services?.length > 3 ? gymInfo.services.length - 3 : 0,
        },
        {
          key: "operating_hours",
          label: "Operating Hours",
          icon: "time-outline",
          value: formatScheduleDisplay(gymInfo?.operating_hours),
        },
        {
          key: "address",
          label: "Address",
          icon: "map-outline",
          value: gymInfo?.address
            ? `${gymInfo.address.street || ""}, ${
                gymInfo.address.area || ""
              }, ${gymInfo.address.city || ""}, ${
                gymInfo.address.state || ""
              } - ${gymInfo.address.pincode || ""}`
                .replace(/,\s*,/g, ",")
                .replace(/^,\s*/, "")
                .replace(/,\s*$/, "") || "N/A"
            : "N/A",
        },
      ];

      setGymDetails(gymDetailsData);

      // Fetch owner personal details
      const personalResponse = await getOwnerPersonalDetailsAPI(ownerId);
      if (personalResponse?.status === 200) {
        const ownerInfo = personalResponse?.data;
        setOwnerData(ownerInfo);

        const personalDetailsData = [
          {
            key: "name",
            label: "Name",
            icon: "person-outline",
            value: ownerInfo?.name || "N/A",
          },
          {
            key: "contact_number",
            label: "Contact Number",
            icon: "call-outline",
            value: ownerInfo?.contact_number || "N/A",
          },
          {
            key: "email",
            label: "Email",
            icon: "mail-outline",
            value: ownerInfo?.email || "N/A",
          },
        ];
        setPersonalDetails(personalDetailsData);
      } else {
        setPersonalDetails([]);
      }

      // Fetch payment details
      const paymentResponse = await getPaymentDetailsAPI(
        parseInt(ownerId),
        parseInt(gymId),
      );
      if (paymentResponse?.status === 200) {
        const paymentInfo = paymentResponse?.data || {};
        setPaymentData(paymentInfo);
        setPendingPaymentEditRequest(
          paymentResponse?.pending_edit_request || null,
        );

        const getGstTypeLabel = (type) => {
          switch (type) {
            case "no_gst":
              return "No GST";
            case "inclusive":
              return "GST Inclusive";
            case "exclusive":
              return "GST Exclusive";
            default:
              return "N/A";
          }
        };

        const paymentDetailsData = [
          {
            key: "account_holdername",
            label: "Account Holder",
            icon: "person-outline",
            value: paymentInfo.account_holdername || "N/A",
          },
          {
            key: "account_number",
            label: "Account Number",
            icon: "card-outline",
            value: paymentInfo.account_number
              ? `XXXX XXXX ${paymentInfo.account_number.slice(-4)}`
              : "N/A",
          },
          {
            key: "bank_name",
            label: "Bank Name",
            icon: "business-outline",
            value: paymentInfo.bank_name || "N/A",
          },
          {
            key: "account_ifsccode",
            label: "IFSC Code",
            icon: "code-outline",
            value: paymentInfo.account_ifsccode || "N/A",
          },
          {
            key: "account_branch",
            label: "Branch",
            icon: "location-outline",
            value: paymentInfo.account_branch || "N/A",
          },
          {
            key: "upi_id",
            label: "UPI ID",
            icon: "phone-portrait-outline",
            value: paymentInfo.upi_id || "N/A",
          },
          {
            key: "pan_number",
            label: "PAN Number",
            icon: "card-outline",
            value: paymentInfo.pan_number || "N/A",
          },
          {
            key: "gst_type",
            label: "GST Type",
            icon: "document-text-outline",
            value: getGstTypeLabel(paymentInfo.gst_type),
          },
          {
            key: "gst_number",
            label: "GST Number",
            icon: "receipt-outline",
            value: paymentInfo.gst_number || "N/A",
          },
        ];

        // Add GST percentage only if GST is not "no_gst"
        if (paymentInfo.gst_type && paymentInfo.gst_type !== "no_gst") {
          paymentDetailsData.push({
            key: "gst_percentage",
            label: "GST Percentage",
            icon: "pricetag-outline",
            value: `${paymentInfo.gst_percentage || "18"}%`,
          });
        }

        setPaymentDetails(paymentDetailsData);
      } else {
        setPaymentDetails([]);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getProfileData();
    }, []),
  );

  const renderPersonalDetailsTab = () => {
    if (isEditing && userRole === "owner") {
      return (
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={editData.name}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editData.contact_number}
              onChangeText={(text) =>
                setEditData({ ...editData, contact_number: text })
              }
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              maxLength={10}
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email ID</Text>
            <TextInput
              style={styles.input}
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email address"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                const initialDate = editData.dob
                  ? new Date(editData.dob)
                  : dob || new Date();
                setTempDob(initialDate);
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
                {editData.dob || "Select Date of Birth"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#777" />
            </TouchableOpacity>

            {Platform.OS === "ios" && showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={cancelDateSelection}
              >
                <TouchableWithoutFeedback onPress={cancelDateSelection}>
                  <View style={styles.pickerModalContainer}>
                    <TouchableWithoutFeedback
                      onPress={(e) => e.stopPropagation()}
                    >
                      <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                          <TouchableOpacity onPress={cancelDateSelection}>
                            <Text style={styles.pickerCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <Text style={styles.pickerTitle}>
                            Select Date of Birth
                          </Text>
                          <TouchableOpacity onPress={confirmDateSelection}>
                            <Text style={styles.pickerConfirmText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={tempDob}
                          mode="date"
                          display="spinner"
                          themeVariant="light"
                          textColor="#000000"
                          onChange={handleDateChange}
                          maximumDate={(() => {
                            const eighteenYearsAgo = new Date();
                            eighteenYearsAgo.setFullYear(
                              eighteenYearsAgo.getFullYear() - 18,
                            );
                            return eighteenYearsAgo;
                          })()}
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
                value={dob ? new Date(dob) : new Date()}
                mode="date"
                display="default"
                maximumDate={(() => {
                  const eighteenYearsAgo = new Date();
                  eighteenYearsAgo.setFullYear(
                    eighteenYearsAgo.getFullYear() - 18,
                  );
                  return eighteenYearsAgo;
                })()}
                onChange={handleDateChange}
              />
            )}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.tabContent}>
        {personalDetails.map((item, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={item.icon} size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        ))}

        {userRole === "owner" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <TouchableOpacity
              style={styles.switchGymButton}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.switchGymText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchGymButton}
              onPress={() => setPasswordModalVisible(true)}
            >
              <Ionicons name="key-outline" size={16} color="#fff" />
              <Text style={styles.switchGymText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderGymDetailsTab = () => {
    if (isEditing && userRole === "owner") {
      return (
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gym Name</Text>
            <TextInput
              style={styles.input}
              value={editData.gymName}
              onChangeText={(text) =>
                setEditData({ ...editData, gymName: text })
              }
              placeholder="Enter your gym name"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editData.location}
              onChangeText={(text) =>
                setEditData({ ...editData, location: text })
              }
              placeholder="Enter gym location"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={editData.gym_contact_number}
              onChangeText={(text) =>
                setEditData({ ...editData, gym_contact_number: text })
              }
              placeholder="Enter gym contact number"
              placeholderTextColor={"#AAA"}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Number of Trainers *</Text>
            <TextInput
              style={styles.input}
              value={editData.total_trainers}
              onChangeText={(text) =>
                setEditData({ ...editData, total_trainers: text })
              }
              placeholder="Enter total number of trainers"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Floor Space (in sq.ft) *</Text>
            <TextInput
              style={styles.input}
              value={editData.floor_space}
              onChangeText={(text) =>
                setEditData({ ...editData, floor_space: text })
              }
              placeholder="Enter floor space in sq.ft"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Number of Machineries *</Text>
            <TextInput
              style={styles.input}
              value={editData.total_machineries}
              onChangeText={(text) =>
                setEditData({ ...editData, total_machineries: text })
              }
              placeholder="Enter total number of machineries"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Yearly Membership Plan Cost *</Text>
            <TextInput
              style={styles.input}
              value={editData.yearly_membership_cost}
              onChangeText={(text) =>
                setEditData({ ...editData, yearly_membership_cost: text })
              }
              placeholder="Enter yearly membership cost"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
            />
          </View>

          {/* Services */}
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Services</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => {
                setShowServicesModal(true);
              }}
            >
              <Text
                style={[
                  styles.selectorText,
                  !editData.services?.length && styles.placeholderText,
                ]}
              >
                {editData.services?.length > 0
                  ? `${editData.services.length} services selected`
                  : "Select services"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#3498db" />
            </TouchableOpacity>

            {editData.services?.length > 0 && (
              <View style={styles.selectedServicesContainer}>
                {editData.services.slice(0, 3).map((service) => (
                  <View key={service} style={styles.servicePill}>
                    <Text style={styles.servicePillText}>{service}</Text>
                  </View>
                ))}
                {editData.services.length > 3 && (
                  <View style={styles.servicePill}>
                    <Text style={styles.servicePillText}>
                      +{editData.services.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operating Hours</Text>

            {/* Apply-all checkbox */}
            {editData.hoursSchedule && (
              <>
                <TouchableOpacity
                  style={styles.applyAllRow}
                  onPress={() => handleApplyAllToggle(!editData.applyAllExceptSunday)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={editData.applyAllExceptSunday ? "checkbox" : "square-outline"}
                    size={20}
                    color={editData.applyAllExceptSunday ? "#3498db" : "#999"}
                  />
                  <Text style={styles.applyAllText}>
                    Use Monday hours for all weekdays (Mon–Sat)
                  </Text>
                </TouchableOpacity>

                {WEEKDAYS.map((day) => {
                  const entry = editData.hoursSchedule[day.key];
                  if (!entry) return null;
                  const editable = isScheduleDayEditable(day.key);
                  const locked = !editable && entry.enabled;

                  return (
                    <View
                      key={day.key}
                      style={[
                        styles.scheduleDayCard,
                        !entry.enabled && styles.scheduleDayCardDisabled,
                        locked && styles.scheduleDayCardLocked,
                      ]}
                    >
                      <View style={styles.scheduleDayHeader}>
                        <View style={styles.scheduleDayLabelRow}>
                          <Switch
                            value={entry.enabled}
                            onValueChange={() => {
                              if (editable) toggleScheduleDay(day.key);
                            }}
                            disabled={!editable}
                            trackColor={{ false: "#E0E0E0", true: "#81B4E0" }}
                            thumbColor={entry.enabled ? "#3498db" : "#CCC"}
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                          />
                          <Text style={[styles.scheduleDayLabel, !entry.enabled && styles.scheduleDayLabelDisabled]}>
                            {day.label}
                          </Text>
                          {locked && (
                            <View style={styles.lockedBadge}>
                              <Ionicons name="link" size={10} color="#3498db" />
                              <Text style={styles.lockedBadgeText}>Mon</Text>
                            </View>
                          )}
                        </View>
                        {!entry.enabled && <Text style={styles.closedLabel}>Closed</Text>}
                      </View>

                      {entry.enabled && (
                        <View style={styles.scheduleTimeRow}>
                          <TouchableOpacity
                            style={[styles.scheduleTimeBtn, !editable && styles.scheduleTimeBtnLocked]}
                            onPress={() => {
                              if (!editable) return;
                              setShowTimePicker({ show: true, weekday: day.key, type: "open" });
                            }}
                            activeOpacity={editable ? 0.7 : 1}
                          >
                            <Ionicons name="time-outline" size={14} color="#3498db" />
                            <Text style={styles.scheduleTimeBtnText}>{formatHHMM(entry.open_time)}</Text>
                          </TouchableOpacity>

                          <Text style={styles.scheduleTimeSep}>to</Text>

                          <TouchableOpacity
                            style={[styles.scheduleTimeBtn, !editable && styles.scheduleTimeBtnLocked]}
                            onPress={() => {
                              if (!editable) return;
                              setShowTimePicker({ show: true, weekday: day.key, type: "close" });
                            }}
                            activeOpacity={editable ? 0.7 : 1}
                          >
                            <Ionicons name="time-outline" size={14} color="#3498db" />
                            <Text style={styles.scheduleTimeBtnText}>{formatHHMM(entry.close_time)}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* Address */}
          <Text style={styles.sectionTitle}>Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={editData.address_street}
              onChangeText={(text) =>
                setEditData({ ...editData, address_street: text })
              }
              placeholder="Enter street address"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Area</Text>
            <TextInput
              style={styles.input}
              value={editData.address_area}
              onChangeText={(text) =>
                setEditData({ ...editData, address_area: text })
              }
              placeholder="Enter area"
              placeholderTextColor={"#AAA"}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={editData.address_city}
                onChangeText={(text) =>
                  setEditData({ ...editData, address_city: text })
                }
                placeholder="Enter city"
                placeholderTextColor={"#AAA"}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={editData.address_state}
                onChangeText={(text) =>
                  setEditData({ ...editData, address_state: text })
                }
                placeholder="Enter state"
                placeholderTextColor={"#AAA"}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={editData.address_pincode}
              onChangeText={(text) =>
                setEditData({ ...editData, address_pincode: text })
              }
              placeholder="Enter pincode"
              placeholderTextColor={"#AAA"}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.locationButtonContainer}>
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={updateGymLocation}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="locate" size={16} color="#fff" />
                  <Text style={styles.updateLocationText}>
                    Update Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.tabContent}>
        {gymDetails.map((item, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={item.icon} size={20} color="#3498db" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              {item.key === "services" && item.extraCount > 0 ? (
                <View>
                  <Text style={styles.detailValue}>{item.value}</Text>
                  <Text
                    style={styles.moreServicesText}
                    onPress={() => setServicesModalVisible(true)}
                  >
                    +{item.extraCount} more
                  </Text>
                </View>
              ) : (
                <Text style={styles.detailValue}>{item.value}</Text>
              )}
            </View>
          </View>
        ))}

        <View style={styles.actionsContainer}>
          <View style={styles.compactButtonsRow}>
            {userRole === "owner" && (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={handleEditPress}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.compactActionButtonText}>Edit Details</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.compactActionButton,
                { backgroundColor: "#34495e" },
              ]}
              onPress={updateGymLocation}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={16} color="#fff" />
                  <Text style={styles.compactActionButtonText}>
                    Update Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* )} */}
      </View>
    );
  };

  const renderPaymentDetailsTab = () => {
    if (userRole === "trainer") {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyStateContainer}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              Payment details not available for trainers
            </Text>
          </View>
        </View>
      );
    }

    const handleEditPaymentDetails = () => {
      router.push("/owner/editpaymentdetails");
    };

    const formatPendingDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <View style={styles.tabContent}>
        {/* Pending Edit Request Banner */}
        {pendingPaymentEditRequest && (
          <TouchableOpacity
            style={styles.pendingRequestBanner}
            onPress={handleEditPaymentDetails}
          >
            <View style={styles.pendingRequestContent}>
              <View style={styles.pendingRequestIcon}>
                <Ionicons name="time" size={24} color="#f39c12" />
              </View>
              <View style={styles.pendingRequestText}>
                <Text style={styles.pendingRequestTitle}>
                  Edit Request Pending
                </Text>
                <Text style={styles.pendingRequestSubtitle}>
                  Submitted on{" "}
                  {formatPendingDate(pendingPaymentEditRequest.requested_time)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#f39c12" />
            </View>
          </TouchableOpacity>
        )}

        {paymentDetails.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              No payment details added yet
            </Text>
            <Text
              style={[styles.emptyStateText, { fontSize: 13, marginTop: 4 }]}
            >
              Tap "Edit Details" to add your payment information
            </Text>
          </View>
        ) : (
          paymentDetails.map((item, index) => (
            <View key={index} style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name={item.icon} size={20} color="#3498db" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))
        )}

        {/* Edit Details Button - Bottom Center */}
        <View style={styles.editPaymentButtonContainer}>
          <TouchableOpacity
            style={styles.editPaymentButton}
            onPress={handleEditPaymentDetails}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editPaymentButtonText}>
              {pendingPaymentEditRequest ? "View Request" : "Edit Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Document functions
  const fetchProfileDocuments = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      // Fetch documents
      const response = await getDocumentPicsAPI(gymId);
      if (response?.status === 200 && response?.data?.documents) {
        const fetchedDocs = response.data.documents;
        setProfileDocuments((prev) =>
          prev.map((doc) => {
            const fetchedDoc = fetchedDocs.find((d) => d.key === doc.key);
            return {
              ...doc,
              image_url: fetchedDoc?.image_url || null,
            };
          }),
        );
      }

      // Fetch prefilled agreement
      const agreementResponse = await getPrefilledAgreementAPI(gymId);
      if (
        agreementResponse?.status === 200 &&
        agreementResponse?.data?.has_agreement
      ) {
        setPrefilledAgreement(agreementResponse.data);
      } else {
        setPrefilledAgreement(null);
      }
    } catch (error) {}
  };

  const selectDocumentImage = async (id) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your photo library to upload images.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowDocOptionsForId(null);
        const document = profileDocuments.find((d) => d.id === id);
        if (document) {
          await handleDocumentUpload(result.assets[0], document);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to select Image",
      });
    }
  };

  const takeDocumentPhoto = async (id) => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your camera to take photos.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowDocOptionsForId(null);
        const document = profileDocuments.find((d) => d.id === id);
        if (document) {
          await handleDocumentUpload(result.assets[0], document);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to take photo",
      });
    }
  };

  const handleDocumentUploadClick = (document) => {
    if (showDocOptionsForId === document.id) {
      setShowDocOptionsForId(null);
    } else {
      setShowDocOptionsForId(document.id);
    }
  };

  const handleDocumentUpload = async (imageAsset, document) => {
    setIsUploadingDocument(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      // Step 1: Get upload URL from backend
      const { data: uploadResp } = await axiosInstance.get(
        "/owner_registration/document-upload",
        {
          params: {
            gym_id: gym_id,
            extension: extension,
            scope: document.key,
          },
        },
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      // Step 2: Upload to S3
      const s3Resp = await fetch(upload.url, {
        method: "POST",
        body: form,
      });

      if (s3Resp.status !== 204 && s3Resp.status !== 201) {
        showToast({
          type: "error",
          title: "Failed to upload document. Please try again.",
        });
        return;
      }

      // Step 3: Confirm upload with backend
      let confirmSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!confirmSuccess && retryCount < maxRetries) {
        try {
          const res = await axiosInstance.post(
            "/owner_registration/document-confirm",
            {
              cdn_url,
              gym_id: gym_id,
              column_name: document.key,
            },
          );

          if (res?.status === 200) {
            confirmSuccess = true;
            setProfileDocuments((prev) =>
              prev.map((d) =>
                d.id === document.id ? { ...d, image_url: cdn_url } : d,
              ),
            );
            showToast({
              type: "success",
              title: "Document uploaded successfully",
            });
          }
        } catch (confirmError) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          } else {
            throw confirmError;
          }
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to upload document. Please try again.",
      });
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleDownloadAgreement = async () => {
    if (prefilledAgreement?.s3_link) {
      try {
        await Linking.openURL(prefilledAgreement.s3_link);
      } catch (error) {
        showToast({
          type: "error",
          title: "Failed to open agreement",
        });
      }
    }
  };

  const renderDocumentsTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Prefilled Agreement Download Card */}
        {prefilledAgreement?.has_agreement && (
          <TouchableOpacity
            style={styles.agreementDownloadCard}
            onPress={handleDownloadAgreement}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/images/pdf.png")}
              style={styles.agreementPdfIcon}
              contentFit="contain"
            />
            <View style={styles.agreementTextContainer}>
              <Text style={styles.agreementTitle}>
                Gym Onboarding PDF is ready to download
              </Text>
            </View>
            <TouchableOpacity
              style={styles.agreementDownloadButton}
              onPress={handleDownloadAgreement}
            >
              <View style={styles.downloadIconWrapper}>
                <Image
                  source={require("../../assets/images/download_circle.png")}
                  style={styles.agreementDownloadCircle}
                  contentFit="contain"
                />
                <Image
                  source={require("../../assets/images/download.png")}
                  style={styles.agreementDownloadArrow}
                  contentFit="contain"
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Documents List */}
        {profileDocuments.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            {/* Document Header */}
            <View style={styles.documentHeader}>
              <View style={styles.documentIconContainer}>
                <Ionicons name={document.icon} size={24} color="#1EA1F3" />
              </View>
              <View style={styles.documentTitleContainer}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentSubtitle}>{document.subtitle}</Text>
              </View>
              {document.image_url && (
                <View style={styles.uploadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Image Container */}
            <View style={styles.docImageContainer}>
              {document.image_url ? (
                <Image
                  source={{ uri: document.image_url }}
                  style={styles.documentImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.docPlaceholderContainer}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={48}
                    color="#999"
                  />
                  <Text style={styles.docPlaceholderText}>Upload Photo</Text>
                </View>
              )}

              {/* Options Overlay */}
              {showDocOptionsForId === document.id && (
                <View style={styles.docOptionsOverlay}>
                  <View style={styles.docOptionsContainer}>
                    <TouchableOpacity
                      style={styles.docOptionButton}
                      onPress={() => selectDocumentImage(document.id)}
                    >
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.docOptionText}>
                        Upload From Gallery
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.docOptionButton}
                      onPress={() => takeDocumentPhoto(document.id)}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.docOptionText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Upload/Retake Button */}
            <TouchableOpacity
              style={[
                styles.docUploadButton,
                showDocOptionsForId === document.id && styles.docCancelButton,
                document.image_url &&
                  showDocOptionsForId !== document.id &&
                  styles.docRetakeButton,
              ]}
              onPress={() => handleDocumentUploadClick(document)}
            >
              <Text style={styles.docUploadButtonText}>
                {showDocOptionsForId === document.id
                  ? "Cancel"
                  : document.image_url
                    ? "Retake"
                    : "Upload"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Loading Overlay */}
        {isUploadingDocument && (
          <View style={styles.docUploadingOverlay}>
            <View style={styles.docUploadingCard}>
              <ActivityIndicator size="large" color="#1EA1F3" />
              <Text style={styles.docUploadingText}>Uploading document...</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalDetailsTab();
      case "gym":
        return renderGymDetailsTab();
      case "payment":
        return renderPaymentDetailsTab();
      case "documents":
        return renderDocumentsTab();
      default:
        return renderPersonalDetailsTab();
    }
  };

  const getHomeRoute = () => {
    return "/owner/home";
  };

  if (isLoading) {
    return <OwnerProfileSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath={getHomeRoute()} enabled={true} />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(getHomeRoute())}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.gymCoverContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            handleImageClick(
              gymData?.cover_pic
                ? { uri: gymData.cover_pic }
                : require("../../assets/images/default_cover_pic.png"),
            )
          }
        >
          <ImageBackground
            source={
              gymData?.cover_pic
                ? { uri: gymData.cover_pic }
                : require("../../assets/images/default_cover_pic.png")
            }
            style={styles.coverPhoto}
            contentPosition="top"
            contentFit="cover"
          >
            <View style={styles.gymProfileHeader}>
              <View style={styles.gymAvatarContainer}>
                <TouchableOpacity
                  onPress={() =>
                    handleImageClick(
                      gymData?.logo
                        ? { uri: gymData.logo }
                        : require("../../assets/images/default_logo.png"),
                    )
                  }
                >
                  <Image
                    source={
                      gymData?.logo
                        ? { uri: gymData.logo }
                        : require("../../assets/images/default_logo.png")
                    }
                    style={styles.gymAvatarImage}
                  />
                </TouchableOpacity>

                {userRole === "owner" && (
                  <TouchableOpacity
                    style={styles.logoEditButton}
                    onPress={() => setLogoUploadModalVisible(true)}
                    disabled={isUploadingLogo}
                  >
                    <View style={styles.logoEditIconBackground}>
                      {isUploadingLogo ? (
                        <Ionicons
                          name="hourglass-outline"
                          size={12}
                          color="white"
                        />
                      ) : (
                        <Ionicons name="pencil" size={12} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {userRole === "owner" && (
              <TouchableOpacity
                style={styles.coverEditButton}
                onPress={() => setCoverUploadModalVisible(true)}
                disabled={isUploadingCover}
              >
                <View style={styles.coverEditIconBackground}>
                  {isUploadingCover ? (
                    <Ionicons
                      name="hourglass-outline"
                      size={16}
                      color="white"
                    />
                  ) : (
                    <Ionicons name="pencil" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </ImageBackground>
        </TouchableOpacity>
      </View>
      <Text style={styles.gymProfileName}>{gymData?.name || "N/A"}</Text>

      {!isEditing ? (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContentContainer}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "gym" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("gym")}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "gym" && styles.activeTabText,
                ]}
              >
                Gym Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "personal" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("personal")}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "personal" && styles.activeTabText,
                ]}
              >
                {userRole === "trainer"
                  ? "Trainer Details"
                  : "Personal Details"}
              </Text>
            </TouchableOpacity>

            {userRole === "owner" && (
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "payment" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("payment")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "payment" && styles.activeTabText,
                  ]}
                >
                  Account Details
                </Text>
              </TouchableOpacity>
            )}

            {userRole === "owner" && (
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "documents" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("documents")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "documents" && styles.activeTabText,
                  ]}
                >
                  Documents
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationDotsContainer}>
            {[
              "gym",
              "personal",
              ...(userRole === "owner" ? ["payment", "documents"] : []),
            ].map((tab, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeTab === tab && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.editingHeaderContainer}>
          <Text style={styles.editingHeaderText}>
            {activeTab === "personal"
              ? "Edit Personal Details"
              : activeTab === "gym"
                ? "Edit Gym Details"
                : "Edit Payment Details"}
          </Text>
        </View>
      )}

      {isEditing && userRole === "owner" ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {renderActiveTabContent()}
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={styles.contentContainer}>
          {renderActiveTabContent()}
        </ScrollView>
      )}

      {isEditing && userRole === "owner" && (
        <View style={styles.editActionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleEditSubmit}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      <FullImageModal
        isVisible={isFullImageModalVisible}
        imageSource={fullImageSource}
        onClose={() => setFullImageModalVisible(false)}
      />

      {/* Services Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isServicesModalVisible}
        onRequestClose={() => setServicesModalVisible(false)}
      >
        <View style={styles.servicesModalOverlay}>
          <TouchableOpacity
            style={styles.servicesModalBackdrop}
            activeOpacity={1}
            onPress={() => setServicesModalVisible(false)}
          />
          <View style={styles.servicesModalContainer}>
            <View style={styles.servicesModalHeader}>
              <Text style={styles.servicesModalTitle}>All Services</Text>
              <TouchableOpacity onPress={() => setServicesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.servicesModalContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {gymData?.services?.map((service, index) => (
                <View
                  key={index}
                  style={[
                    styles.serviceItem,
                    index === gymData.services.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                  <Text style={styles.serviceItemText}>{service}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {userRole === "owner" && (
        <>
          <ImageUploadModal
            isVisible={isLogoUploadModalVisible}
            onClose={() => setLogoUploadModalVisible(false)}
            onImageSelect={handleLogoUpload}
            title="Upload Gym Logo"
            aspectRatio={[1, 1]}
          />

          <ImageUploadModal
            isVisible={isCoverUploadModalVisible}
            onClose={() => setCoverUploadModalVisible(false)}
            onImageSelect={handleCoverUpload}
            title="Upload Cover Photo"
            aspectRatio={[16, 9]}
          />
        </>
      )}

      {userRole === "owner" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPasswordModalVisible}
          onRequestClose={() => setPasswordModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View style={styles.passwordModalContainer}>
              <View style={styles.passwordModalHeader}>
                <Text style={styles.passwordModalTitle}>Change Password</Text>
                <TouchableOpacity
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordInputLabel}>Current Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor={"#AAA"}
                    secureTextEntry={!showOldPassword}
                    value={passwordData.oldPassword}
                    onChangeText={(text) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        oldPassword: text,
                      }))
                    }
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    <Ionicons
                      name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordInputLabel}>New Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor={"#AAA"}
                    secureTextEntry={!showNewPassword}
                    value={passwordData.newPassword}
                    onChangeText={(text) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: text,
                      }))
                    }
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordInputLabel}>
                  Confirm New Password
                </Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={"#AAA"}
                    secureTextEntry={!showConfirmPassword}
                    value={passwordData.confirmNewPassword}
                    onChangeText={(text) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmNewPassword: text,
                      }))
                    }
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveChangesButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveChangesText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Services Selection Modal */}
      <Modal
        visible={showServicesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Services</Text>
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {services.map((service) => {
                const isSelected = editData.services?.includes(service);

                return (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceOption,
                      isSelected && styles.serviceOptionSelected,
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    <Text
                      style={[
                        styles.serviceOptionText,
                        isSelected && styles.serviceOptionTextSelected,
                      ]}
                    >
                      {service}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#3498db" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowServicesModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>
                Done ({editData.services?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GST Type Selection Modal */}
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
                    styles.serviceOption,
                    editData.gst_type === type.value &&
                      styles.serviceOptionSelected,
                  ]}
                  onPress={() => {
                    setEditData({ ...editData, gst_type: type.value });
                    setShowGstModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.serviceOptionText,
                      editData.gst_type === type.value &&
                        styles.serviceOptionTextSelected,
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
          </View>
        </View>
      </Modal>

      {/* CustomTimePicker */}
      <CustomTimePicker
        visible={showTimePicker.show}
        onClose={() =>
          setShowTimePicker({ show: false, weekday: null, type: "" })
        }
        onConfirm={onTimeChange}
        initialTime={
          showTimePicker.weekday !== null && showTimePicker.weekday !== undefined && showTimePicker.type
            ? hhmmToIso(
                editData.hoursSchedule?.[showTimePicker.weekday]?.[
                  showTimePicker.type === "open" ? "open_time" : "close_time"
                ]
              )
            : undefined
        }
      />
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
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 30,
  },
  profileHeader: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    overflow: "hidden",
  },
  gymCoverContainer: {
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e1e1e1",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  editAvatarIconBackground: {
    backgroundColor: "#3498db",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    height: 45,
  },
  tabsContentContainer: {
    flexDirection: "row",
    height: 45,
  },
  paginationDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d1d1d1",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#3498db",
  },
  tabButton: {
    width: width / 3,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#777",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  tabContent: {
    padding: 15,
  },
  detailItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
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
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  switchGymButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 15,
    width: "48%",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  deleteAccountText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  switchGymText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  actionsContainer: {
    marginTop: 15,
    gap: 10,
  },
  compactButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  compactActionButton: {
    backgroundColor: "#3498db",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  compactActionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  editingHeaderContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    alignItems: "center",
  },
  editingHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  editActionsContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    padding: 24,
    alignSelf: "center",
  },
  passwordModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  passwordInputLabel: {
    fontSize: 15,
    color: "#555",
    marginBottom: 8,
    fontWeight: "500",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  saveChangesButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveChangesText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  locationButtonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  updateLocationButton: {
    backgroundColor: "#3498db",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateLocationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  upiQRContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upiQRTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  gymProfileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  gymAvatarContainer: {
    position: "relative",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gymAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#fff",
  },
  gymProfileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    paddingVertical: 10,
  },
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageUploadModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    padding: 20,
  },
  uploadOptionsContainer: {
    paddingVertical: 20,
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  uploadOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  uploadOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  logoEditButton: {
    position: "absolute",
    bottom: -5,
    right: -5,
  },
  logoEditIconBackground: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  coverEditButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  coverEditIconBackground: {
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
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
    color: "#3498db",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  addGymModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    height: height * 0.9,
    padding: 20,
  },
  addGymScrollView: {
    height: height * 0.7,
    marginVertical: 15,
  },
  gymSection: {
    marginBottom: 5,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  gymSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  addGymButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 10,
    backgroundColor: "#f8f9fa",
  },
  addGymButtonText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  addGymIcon: {
    marginRight: 5,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF4444",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fff5f5",
  },
  removeButtonText: {
    color: "#FF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  removeGymIcon: {
    marginRight: 5,
  },
  removeGymButton: {
    marginLeft: 10,
    padding: 5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  cancelModalButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  submitModalButton: {
    flex: 1,
    backgroundColor: "#3498db",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  submitModalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: "#bbb",
    opacity: 0.7,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginTop: 20,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 0.48,
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
    fontSize: 16,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  applyAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  applyAllText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  scheduleDayCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  scheduleDayCardDisabled: {
    backgroundColor: "#FAFAFA",
    borderColor: "#EEEEEE",
  },
  scheduleDayCardLocked: {
    backgroundColor: "#F5F9FF",
    borderColor: "#D0E3F5",
  },
  scheduleDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleDayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  scheduleDayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  scheduleDayLabelDisabled: {
    color: "#AAA",
  },
  closedLabel: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedBadgeText: {
    fontSize: 10,
    color: "#3498db",
    fontWeight: "500",
  },
  scheduleTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  scheduleTimeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    gap: 6,
  },
  scheduleTimeBtnLocked: {
    backgroundColor: "#EEF4FB",
    borderColor: "#D0E3F5",
  },
  scheduleTimeBtnText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  scheduleTimeSep: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
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
  placeholderText: {
    color: "#AAA",
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
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  servicesModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  servicesModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  servicesModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width * 0.85,
    maxHeight: height * 0.6,
    overflow: "hidden",
  },
  servicesModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  servicesModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  servicesModalContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    maxHeight: height * 0.45,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  serviceItemText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 12,
  },
  moreServicesText: {
    color: "#3498db",
    fontWeight: "500",
  },
  pendingRequestBanner: {
    backgroundColor: "#fef9e7",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f9e79f",
    overflow: "hidden",
  },
  pendingRequestContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  pendingRequestIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffeaa7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pendingRequestText: {
    flex: 1,
  },
  pendingRequestTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9a7b4f",
    marginBottom: 2,
  },
  pendingRequestSubtitle: {
    fontSize: 12,
    color: "#b8956f",
  },
  editPaymentButtonContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingBottom: 10,
  },
  editPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  editPaymentButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  // Document tab styles
  docInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  docInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    lineHeight: 18,
  },
  documentCard: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  documentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentTitleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  documentSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  uploadedBadge: {
    marginLeft: 8,
  },
  docImageContainer: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  docPlaceholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  docPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  docUploadButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  docCancelButton: {
    backgroundColor: "#FF5757",
  },
  docRetakeButton: {
    backgroundColor: "#FF5757",
  },
  docUploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  docOptionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  docOptionsContainer: {
    width: "80%",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  docOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
  },
  docOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  docUploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  docUploadingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  docUploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  // Agreement download card styles
  agreementDownloadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  agreementPdfIcon: {
    width: 36,
    height: 36,
    marginRight: 24,
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  agreementDownloadButton: {
    padding: 4,
  },
  downloadIconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  agreementDownloadCircle: {
    width: 36,
    height: 36,
    position: "absolute",
  },
  agreementDownloadArrow: {
    width: 18,
    height: 18,
  },
});

export default OwnerProfile;
