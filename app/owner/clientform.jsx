import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Animated,
  KeyboardAvoidingView,
  FlatList,
  Keyboard,
  Image,
  Linking,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import { LinearGradient } from "expo-linear-gradient";

import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import QRCodeScanner from "../../components/ui/qrcode";
import WorkoutCard from "../../components/ui/workout/WorkoutCard";
import CustomIOSDatePicker from "../../components/ui/CustomIOSDatePicker";
import {
  ClientFormSkeleton,
  ClientFormSelectionSkeleton,
} from "../../components/ui/loaders/ClientFormSkeleton";
import ConfettiAnimation from "../../components/ConfettiAnimation";
import {
  addClientAPI,
  getClientFromQRAPI,
  getPlansandBatchesAPI,
  updateFeeStatusAPI,
  getGymJoinRequestsAPI,
  rejectRequestAPI,
} from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";

import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");
const isTablet = width >= 786;

const AddClientScreen = () => {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    contact: "",
    email: "",
    dateOfBirth: new Date(),
    height: "",
    weight: "",
    bmi: "",
    jobNature: "",
    fitnessGoal: "",
    trainingType: "",

    originalFee: "",
    discountType: "amount",
    discountAmount: "",
    discountPercentage: "",
    admissionFee: "",
    discountedFee: "",
    admissionNumber: "",
    batchType: "",
    expiry: "joining_date",
    feeCollectionStartDate: null,
    newExpiryDate: null,
    paymentMethod: "",
    paymentReferenceNumber: "",
    gstType: "no_gst",
    gstPercentage: "18",
    totalAmount: "",
    membershipId: "",
    oldClient: false,
  });

  const [selectedPlanCategory, setSelectedPlanCategory] =
    useState("gym_membership");
  const planScrollViewRef = useRef(null);

  const discountTypeOptions = [
    { label: "Amount (₹)", value: "amount" },
    { label: "Percentage (%)", value: "percentage" },
  ];

  const gstTypeOptions = [
    { label: "No GST", value: "no_gst" },
    { label: "Inclusive", value: "inclusive" },
    { label: "Exclusive", value: "exclusive" },
  ];

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQRScannerVisible, setQRScannerVisible] = useState(false);
  const [isDataFromQR, setIsDataFromQR] = useState(false);
  const [qrDataType, setQrDataType] = useState(null);
  const [qrPlanName, setQrPlanName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDifferentGymAlert, setShowDifferentGymAlert] = useState(false);
  const [showDailyPassModeAlert, setShowDailyPassModeAlert] = useState(false);
  const [showNoPlansBatchesAlert, setShowNoPlansBatchesAlert] = useState(false);
  const [missingType, setMissingType] = useState(""); // "both", "plans", "batches"
  const hasShownAlert = useRef(false);
  const hasOpenedScanner = useRef(false);
  const [isRenewalFlow, setIsRenewalFlow] = useState(false);
  const [renewalData, setRenewalData] = useState({
    fullName: "",
    plan: "",
    planName: "",
    amount: "",
    joiningDate: null,
    batchType: "",
    gstType: "no_gst",
    gstPercentage: "18",
    totalAmount: "",
    clientId: null,
    planType: "",
    membershipId: "",
    isEditable: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFeeCollectionDatePicker, setShowFeeCollectionDatePicker] =
    useState(false);
  const [showNewExpiryDatePicker, setShowNewExpiryDatePicker] = useState(false);
  const [showFeeCollectionOptions, setShowFeeCollectionOptions] =
    useState(false);
  const [hasUserSelectedDOB, setHasUserSelectedDOB] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [isFlipping, setIsFlipping] = useState(false);

  const [tempDateOfBirth, setTempDateOfBirth] = useState(new Date());
  const [tempFeeCollectionDate, setTempFeeCollectionDate] = useState(
    new Date(),
  );
  const [tempNewExpiryDate, setTempNewExpiryDate] = useState(new Date());

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [type, setType] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isFromRequestFlow, setIsFromRequestFlow] = useState(false);
  const [scannedQRData, setScannedQRData] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const calculateAge = (dateOfBirth) => {
    try {
      if (!dateOfBirth) return 0;
      const today = new Date();
      const birthDate =
        dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 0;

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (e) {
      console.error("[ClientForm] calculateAge error:", e);
      return 0;
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
      console.error("[ClientForm] formatDateForSQL error:", e);
      return null;
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
      console.error("[ClientForm] formatDateForDisplay error:", e);
      return "Select Date";
    }
  };

  const fetchPlansAndBatches = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        setIsLoading(false);
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);

      if (response?.status === 200 && response?.data) {
        const plansData = Array.isArray(response.data?.plans)
          ? response.data.plans
          : [];
        const batchesData = Array.isArray(response.data?.batches)
          ? response.data.batches
          : [];
        setPlans(plansData);
        setBatches(batchesData);

        // Check for missing plans/batches after data is fetched
        if (!hasShownAlert.current) {
          if (plansData.length === 0 && batchesData.length === 0) {
            setMissingType("both");
            setShowNoPlansBatchesAlert(true);
            hasShownAlert.current = true;
          } else if (plansData.length === 0 && batchesData.length > 0) {
            setMissingType("plans");
            setShowNoPlansBatchesAlert(true);
            hasShownAlert.current = true;
          } else if (batchesData.length === 0 && plansData.length > 0) {
            setMissingType("batches");
            setShowNoPlansBatchesAlert(true);
            hasShownAlert.current = true;
          }
        }
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      console.error("[ClientForm] Error fetching plans and batches:", error);
      // Ensure plans and batches are always arrays even on error
      setPlans([]);
      setBatches([]);
      showToast({
        type: "error",
        title: "Error fetching plans and batches",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    setJoinRequestsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        setJoinRequests([]);
        setJoinRequestsCount(0);
        setJoinRequestsLoading(false);
        return;
      }
      const response = await getGymJoinRequestsAPI(gymId);

      if (response?.status === 200) {
        setJoinRequests(Array.isArray(response.data) ? response.data : []);
        setJoinRequestsCount(response.count || 0);
      } else {
        setJoinRequests([]);
        setJoinRequestsCount(0);
      }
    } catch (error) {
      console.error("[ClientForm] Error fetching join requests:", error);
      setJoinRequests([]);
      setJoinRequestsCount(0);
      showToast({
        type: "error",
        title: "Error fetching join requests",
      });
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  // Fetch plans and batches only once on mount
  useEffect(() => {
    fetchPlansAndBatches();
    fetchJoinRequests();
  }, []);

  // Handle scanner opening from navigation params
  const openScanner = params?.openScanner;
  useEffect(() => {
    if (openScanner === "true" && !hasOpenedScanner.current) {
      // Check if plans and batches are available before opening scanner
      if (plans.length === 0 || batches.length === 0) {
        // Wait for plans and batches to load
        return;
      }
      hasOpenedScanner.current = true;
      setQRScannerVisible(true);
    }
  }, [openScanner, plans, batches]);

  // Auto-scroll to selected plan when coming from QR code
  useEffect(() => {
    if (
      form.trainingType &&
      plans.length > 0 &&
      (qrDataType === "gym_membership" || qrDataType === "personal_training")
    ) {
      const selectedPlan = plans.find((plan) => plan.id === form.trainingType);
      if (selectedPlan) {
        // Set the correct category based on plan type
        const category = selectedPlan.personal_training
          ? "personal_training"
          : "gym_membership";
        setSelectedPlanCategory(category);

        // Auto-scroll to the selected plan after a short delay
        setTimeout(() => {
          const filteredPlans = plans.filter((plan) =>
            category === "gym_membership"
              ? !plan.personal_training
              : plan.personal_training,
          );
          const planIndex = filteredPlans.findIndex(
            (plan) => plan.id === form.trainingType,
          );

          if (planIndex !== -1 && planScrollViewRef.current) {
            // Scroll to position (card width 160 + margin 12) * index
            planScrollViewRef.current.scrollTo({
              x: (160 + 12) * planIndex,
              animated: true,
            });
          }
        }, 300);
      }
    }
  }, [form.trainingType, plans, qrDataType]);

  const calculateDiscountedFee = () => {
    if (!form.originalFee || form.originalFee === 0) return 0;

    if (form.discountType === "amount") {
      const discount = parseFloat(form.discountAmount) || 0;
      return Math.max(0, form.originalFee - discount);
    } else {
      const discount = parseFloat(form.discountPercentage) || 0;
      const discountAmount = (form.originalFee * discount) / 100;
      return Math.max(0, form.originalFee - discountAmount);
    }
  };

  const calculateGstAmount = () => {
    if (form.gstType === "no_gst" || !form.gstPercentage) return 0;

    // For QR code purchases, use the discountedFee directly
    let baseAmount;
    if (qrDataType === "gym_membership" || qrDataType === "personal_training") {
      baseAmount = parseFloat(form.discountedFee) || 0;
    } else {
      baseAmount = calculateDiscountedFee();
    }

    return (baseAmount * parseFloat(form.gstPercentage)) / 100;
  };

  const calculateTotalAmount = () => {
    // For QR code purchases, use the discountedFee directly
    let baseAmount;
    if (qrDataType === "gym_membership" || qrDataType === "personal_training") {
      baseAmount = parseFloat(form.discountedFee) || 0;
    } else {
      baseAmount = calculateDiscountedFee();
    }

    if (form.gstType === "no_gst") return baseAmount;

    const gstAmount = calculateGstAmount();
    if (form.gstType === "exclusive") {
      return baseAmount + gstAmount;
    }
    return baseAmount;
  };

  const getDiscountAmount = () => {
    if (form.discountType === "amount") {
      return parseFloat(form.discountAmount) || 0;
    } else {
      const percentage = parseFloat(form.discountPercentage) || 0;
      return (form.originalFee * percentage) / 100;
    }
  };

  const getDiscountPercentage = () => {
    if (form.discountType === "percentage") {
      return parseFloat(form.discountPercentage) || 0;
    } else {
      const amount = parseFloat(form.discountAmount) || 0;
      return form.originalFee > 0 ? (amount / form.originalFee) * 100 : 0;
    }
  };

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "fullName":
        if (!value.trim()) error = "Full name is required";
        break;

      case "contact":
        if (!value) error = "Phone number is required";
        else if (!/^[1-9]\d{9}$/.test(value))
          error = "Enter valid 10-digit mobile number";
        break;

      // case "email":
      //   if (!value) error = "Email is required";
      //   else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      //     error = "Enter valid email address";
      //   break;

      case "gender":
        if (!value) error = "Gender is required";
        break;

      // case "dateOfBirth":
      //   if (!hasUserSelectedDOB) {
      //     error = "Please select your date of birth";
      //   } else if (!value) {
      //     error = "Date of birth is required";
      //   } else {
      //     const age = calculateAge(value);
      //     if (age < 5 || age > 100) error = "Age must be between 5-100 years";
      //   }
      //   break;

      // case "height":
      //   if (!value) error = "Height is required";
      //   else if (parseFloat(value) < 50 || parseFloat(value) > 300)
      //     error = "Height must be between 50-300 cm";
      //   break;

      // case "weight":
      //   if (!value) error = "Weight is required";
      //   else if (parseFloat(value) < 20 || parseFloat(value) > 500)
      //     error = "Weight must be between 20-500 kg";
      //   break;

      // case "fitnessGoal":
      //   if (!value) error = "Fitness goal is required";
      //   break;

      // case "jobNature":
      //   if (!value) error = "Lifestyle is required";
      //   break;

      case "trainingType":
        if (!value) error = "Training type is required";
        break;

      case "batchType":
        if (!value) error = "Batch type is required";
        break;

      case "expiry":
        if (!value) error = "Fee collection is required";
        break;

      // case "paymentMethod":
      //   if (!value) error = "Payment method is required";
      //   break;

      // case "place":
      //   if (!value) error = "Place can only contain letters";
      //   break;

      case "admissionFee":
        if (value && (isNaN(value) || parseFloat(value) < 0))
          error = "Enter valid amount";
        break;

      case "discountAmount":
        if (value && form.originalFee) {
          const discount = parseFloat(value);
          if (discount < 0) error = "Discount cannot be negative";
          else if (discount > form.originalFee)
            error = "Discount cannot exceed original fee";
        }
        break;

      case "discountPercentage":
        if (value) {
          const discount = parseFloat(value);
          if (discount < 0) error = "Discount cannot be negative";
          else if (discount > 100) error = "Discount cannot exceed 100%";
        }
        break;

      case "gstPercentage":
        if (form.gstType !== "no_gst" && value) {
          const gst = parseFloat(value);
          if (gst < 0) error = "GST percentage cannot be negative";
          else if (gst > 100) error = "GST percentage cannot exceed 100%";
        }
        break;

      case "discountedFee":
        if (!value) error = "Discounted fee is required";
        else if (isNaN(value) || parseFloat(value) < 0)
          error = "Enter valid amount";
        else if (form.originalFee && parseFloat(value) > form.originalFee)
          error = "Discounted fee cannot exceed original fee";
        break;
    }

    return error;
  };

  const handleInputChange = (field, value) => {
    setForm((prevForm) => {
      const updatedForm = { ...prevForm, [field]: value };

      if (field === "trainingType") {
        const selectedPlan = plans.find((plan) => plan.id === value);
        if (selectedPlan) {
          updatedForm.originalFee = selectedPlan.amount || 0;
          updatedForm.discountAmount = "";
          updatedForm.discountPercentage = "";
          updatedForm.discountedFee = selectedPlan.amount || 0;

          // Auto-calculate totalAmount when plan is selected
          let baseAmount = selectedPlan.amount || 0;
          let gstAmount = 0;

          if (updatedForm.gstType !== "no_gst" && updatedForm.gstPercentage) {
            gstAmount =
              (baseAmount * parseFloat(updatedForm.gstPercentage)) / 100;
          }

          if (updatedForm.gstType === "exclusive") {
            updatedForm.totalAmount = (baseAmount + gstAmount).toString();
          } else {
            updatedForm.totalAmount = baseAmount.toString();
          }
        }
      }

      if (field === "discountType") {
        updatedForm.discountAmount = "";
        updatedForm.discountPercentage = "";
        updatedForm.discountedFee = updatedForm.originalFee || 0;
      }

      if (field === "discountAmount" || field === "discountPercentage") {
        if (updatedForm.originalFee) {
          if (updatedForm.discountType === "amount") {
            const discount = parseFloat(updatedForm.discountAmount) || 0;
            updatedForm.discountedFee = Math.max(
              0,
              updatedForm.originalFee - discount,
            );
          } else {
            const discount = parseFloat(updatedForm.discountPercentage) || 0;
            const discountAmount = (updatedForm.originalFee * discount) / 100;
            updatedForm.discountedFee = Math.max(
              0,
              updatedForm.originalFee - discountAmount,
            );
          }
        }
      }

      if (field === "gstType" && value === "no_gst") {
        updatedForm.gstPercentage = "";
      }

      if (field === "height" || field === "weight") {
        const heightInMeters =
          field === "height"
            ? parseFloat(value) / 100
            : parseFloat(updatedForm.height) / 100;
        const weight =
          field === "weight"
            ? parseFloat(value)
            : parseFloat(updatedForm.weight);

        if (weight && heightInMeters && heightInMeters > 0) {
          const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(
            2,
          );
          updatedForm.bmi = isNaN(bmiValue) ? "" : bmiValue;
        }
      }

      // Auto-calculate totalAmount when relevant fields change
      if (
        field === "discountedFee" ||
        field === "gstType" ||
        field === "gstPercentage" ||
        field === "discountAmount" ||
        field === "discountPercentage"
      ) {
        let baseAmount = parseFloat(updatedForm.discountedFee) || 0;
        let gstAmount = 0;

        if (updatedForm.gstType !== "no_gst" && updatedForm.gstPercentage) {
          gstAmount =
            (baseAmount * parseFloat(updatedForm.gstPercentage)) / 100;
        }

        if (updatedForm.gstType === "exclusive") {
          updatedForm.totalAmount = (baseAmount + gstAmount).toString();
        } else {
          updatedForm.totalAmount = baseAmount.toString();
        }
      }

      return updatedForm;
    });

    const error = validateField(field, value);
    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
  };

  const handleBlur = (field) => {
    setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        setHasUserSelectedDOB(true);
        setForm((prevForm) => ({ ...prevForm, dateOfBirth: selectedDate }));
        const age = calculateAge(selectedDate);
        let dobError = "";
        if (age < 18 || age > 100) {
          dobError = "Age must be between 18-100 years";
        }
        setErrors((prevErrors) => ({ ...prevErrors, dateOfBirth: dobError }));
      }
    } else {
      if (selectedDate) {
        setTempDateOfBirth(selectedDate);
      }
    }
  };

  const handleFeeCollectionDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowFeeCollectionDatePicker(false);
      if (selectedDate) {
        handleInputChange("feeCollectionStartDate", selectedDate);
      }
    } else {
      // On iOS, always update with selectedDate or keep current tempFeeCollectionDate
      const newDate = selectedDate || tempFeeCollectionDate;
      if (newDate instanceof Date && !isNaN(newDate.getTime())) {
        setTempFeeCollectionDate(newDate);
      }
    }
  };

  const confirmDateOfBirthSelection = () => {
    setHasUserSelectedDOB(true);
    setForm((prevForm) => ({ ...prevForm, dateOfBirth: tempDateOfBirth }));
    const age = calculateAge(tempDateOfBirth);
    let dobError = "";
    if (age < 18 || age > 100) {
      dobError = "Age must be between 18-100 years";
    }
    setErrors((prevErrors) => ({ ...prevErrors, dateOfBirth: dobError }));
    setShowDatePicker(false);
  };

  const confirmFeeCollectionDateSelection = () => {
    if (
      tempFeeCollectionDate &&
      tempFeeCollectionDate instanceof Date &&
      !isNaN(tempFeeCollectionDate.getTime())
    ) {
      handleInputChange("feeCollectionStartDate", tempFeeCollectionDate);
    }
    setShowFeeCollectionDatePicker(false);
  };

  const cancelDateOfBirthSelection = () => {
    setTempDateOfBirth(form.dateOfBirth || new Date());
    setShowDatePicker(false);
  };

  const cancelFeeCollectionDateSelection = () => {
    const validDate =
      form.feeCollectionStartDate &&
      form.feeCollectionStartDate instanceof Date &&
      !isNaN(form.feeCollectionStartDate.getTime())
        ? form.feeCollectionStartDate
        : new Date();
    setTempFeeCollectionDate(validDate);
    setShowFeeCollectionDatePicker(false);
  };

  const handleNewExpiryDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowNewExpiryDatePicker(false);
      if (selectedDate) {
        handleInputChange("newExpiryDate", selectedDate);
      }
    } else {
      // On iOS, always update with selectedDate or keep current tempNewExpiryDate
      const newDate = selectedDate || tempNewExpiryDate;
      if (newDate instanceof Date && !isNaN(newDate.getTime())) {
        setTempNewExpiryDate(newDate);
      }
    }
  };

  const confirmNewExpiryDateSelection = () => {
    if (
      tempNewExpiryDate &&
      tempNewExpiryDate instanceof Date &&
      !isNaN(tempNewExpiryDate.getTime())
    ) {
      handleInputChange("newExpiryDate", tempNewExpiryDate);
    }
    setShowNewExpiryDatePicker(false);
  };

  const cancelNewExpiryDateSelection = () => {
    const validDate =
      form.newExpiryDate &&
      form.newExpiryDate instanceof Date &&
      !isNaN(form.newExpiryDate.getTime())
        ? form.newExpiryDate
        : new Date();
    setTempNewExpiryDate(validDate);
    setShowNewExpiryDatePicker(false);
  };

  const fetchQRData = async (qrData) => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      // Parse the QR data to get the type
      const parsedQrData = JSON.parse(qrData);

      const qrType = parsedQrData?.type;

      const response = await getClientFromQRAPI(parsedQrData, gymId);

      if (response?.status === 200) {
        let dateOfBirth = new Date();
        if (response.data.dob) {
          dateOfBirth = new Date(response.data.dob);
          setHasUserSelectedDOB(true);
        } else if (response.data.age) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - parseInt(response.data.age);
          dateOfBirth = new Date(birthYear, 0, 1);
          setHasUserSelectedDOB(true);
        }

        if (qrType === "gym_membership" || qrType === "personal_training") {
          setType(qrType);
          setQrDataType(qrType);
          // Find and set the plan name
          const planId = response?.data?.plan;
          const selectedPlan = plans.find((plan) => plan.id === planId);
          setQrPlanName(selectedPlan?.plans || "");

          setForm({
            ...form,
            fullName: response.data.full_name || "",
            gender: response.data.gender || "",
            contact: response.data.contact || "",
            email: response.data.email || "",
            dateOfBirth: dateOfBirth,
            height: response.data.height ? response.data.height.toString() : "",
            weight: response.data.weight ? response.data.weight.toString() : "",
            bmi: response.data.bmi ? response.data.bmi.toString() : "",
            jobNature: response.data.lifestyle || "",
            fitnessGoal: response.data.goals || "",
            trainingType: response?.data?.plan || "",
            batchType: "",
            admissionFee: "",
            admissionNumber: "",
            discountedFee: response?.data?.amount || "",
            expiry: "joining_date",
            feeCollectionStartDate: response?.data?.joining_date || null,
            paymentMethod: "bank_transfer",
            paymentReferenceNumber: "",
            membershipId: response?.data?.membership_id || "",
          });
        } else {
          setQrDataType(qrType);
          setType("normal");
          setForm({
            ...form,
            fullName: response.data.full_name || "",
            gender: response.data.gender || "",
            contact: response.data.contact || "",
            email: response.data.email || "",
            dateOfBirth: dateOfBirth,
            height: response.data.height ? response.data.height.toString() : "",
            weight: response.data.weight ? response.data.weight.toString() : "",
            bmi: response.data.bmi ? response.data.bmi.toString() : "",
            jobNature: response.data.lifestyle || "",
            fitnessGoal: response.data.goals || "",
            trainingType: "",

            batchType: "",
            admissionFee: "",
            admissionNumber: "",
            discountedFee: "",
            expiry: "joining_date",
            feeCollectionStartDate: null,
            paymentMethod: "",
            paymentReferenceNumber: "",
            membershipId: null,
          });
        }

        setIsDataFromQR(true);
        setShowForm(true);
        setErrors((prevErrors) => ({ ...prevErrors, dateOfBirth: "" }));
        showToast({
          type: "success",
          title:
            "Client data retrieved successfully. Please select Batch Type and complete training details.",
        });
      } else if (response?.status === 201) {
        // Renewal flow - existing member (read-only)
        const planId = response.plan;
        const selectedPlan = plans.find((plan) => plan.id === planId);

        setRenewalData({
          fullName: response.full_name || "",
          plan: response.plan || "",
          planName: selectedPlan?.plans || "",
          amount: response.amount || "",
          joiningDate: response.joining_date
            ? new Date(response.joining_date)
            : new Date(),
          batchType: "",
          gstType: "no_gst",
          gstPercentage: "",
          totalAmount: response.amount || "",
          clientId: response.client_id || null,
          planType: response.plan_type || "",
          membershipId: response?.membership_id || "",
          isEditable: false,
        });

        setIsRenewalFlow(true);
        setShowForm(true);
        showToast({
          type: "info",
          title: "Please select Batch Type to continue with renewal.",
        });
      } else if (response?.status === 202) {
        // Renewal flow - existing member (editable)
        const planId = response.plan;
        const selectedPlan = plans.find((plan) => plan.id === planId);

        setRenewalData({
          fullName: response.full_name || "",
          plan: response.plan || "",
          planName: selectedPlan?.plans || "",
          amount: response.amount || "",
          joiningDate: response.joining_date
            ? new Date(response.joining_date)
            : new Date(),
          batchType: "",
          gstType: "no_gst",
          gstPercentage: "18",
          totalAmount: response.amount || "",
          clientId: response.client_id || null,
          planType: "gym_membership",
          membershipId: response?.membership_id || "",
          isEditable: true,
        });

        setIsRenewalFlow(true);
        setShowForm(true);
        showToast({
          type: "info",
          title: "Please select Batch Type to continue with renewal.",
        });
      } else if (response?.status === 402) {
        setShowDifferentGymAlert(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to retrieve client data",
        });
        setShowForm(true);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to process QR code data",
      });
      setShowForm(true);
    } finally {
      setIsLoading(false);
      setQRScannerVisible(false);
    }
  };

  const handleQRCodeScanned = async (type, data) => {
    setQRScannerVisible(false);

    // Fetch QR data to check the response
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      const parsedQrData = JSON.parse(data);

      // Check if this is a daily pass or sessions QR code (not a membership QR)
      if (
        parsedQrData?.mode === "dailypass" ||
        parsedQrData?.mode === "sessions"
      ) {
        setIsLoading(false);
        setShowDailyPassModeAlert(true);
        return;
      }

      const qrType = parsedQrData?.type;
      const response = await getClientFromQRAPI(parsedQrData, gymId);

      if (response?.status === 200) {
        // Check if it's a renewal type (gym_membership or personal_training)
        if (qrType === "gym_membership" || qrType === "personal_training") {
          // For renewal types, directly proceed with current flow
          fetchQRData(data);
        } else {
          // For normal type, show modal for quick add or full details
          setScannedQRData({
            qrData: data,
            response: response,
            parsedQrData: parsedQrData,
          });
          setShowAddClientModal(true);
        }
      } else if (response?.status === 202) {
        // For editable renewal, show modal for quick add or full details
        setScannedQRData({
          qrData: data,
          response: response,
          parsedQrData: parsedQrData,
          isEditableRenewal: true,
        });
        setShowAddClientModal(true);
      } else if (response?.status === 201) {
        // For non-editable renewal flows, directly proceed with full details
        fetchQRData(data);
      } else if (response?.status === 402) {
        setShowDifferentGymAlert(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to retrieve client data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to process QR code data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifferentGymAlertOk = () => {
    setShowDifferentGymAlert(false);
    router.back();
  };

  const handleRenewalInputChange = (field, value) => {
    setRenewalData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-populate GST percentage when inclusive or exclusive is selected
      if (
        field === "gstType" &&
        (value === "inclusive" || value === "exclusive")
      ) {
        updated.gstPercentage = "18";
      } else if (field === "gstType" && value === "no_gst") {
        updated.gstPercentage = "";
      }

      // Auto-calculate totalAmount when relevant fields change (only for editable mode)
      if (
        updated.isEditable &&
        (field === "amount" || field === "gstType" || field === "gstPercentage")
      ) {
        let baseAmount = parseFloat(updated.amount) || 0;
        let gstAmount = 0;

        if (updated.gstType !== "no_gst" && updated.gstPercentage) {
          gstAmount = (baseAmount * parseFloat(updated.gstPercentage)) / 100;
        }

        if (updated.gstType === "exclusive") {
          updated.totalAmount = (baseAmount + gstAmount).toString();
        } else {
          updated.totalAmount = baseAmount.toString();
        }
      }

      return updated;
    });
  };

  const calculateRenewalAmounts = () => {
    // For editable mode, use the amount field for calculations
    const baseAmount = parseFloat(renewalData.amount) || 0;

    if (renewalData.gstType === "inclusive" && renewalData.gstPercentage) {
      const gstPercent = parseFloat(renewalData.gstPercentage) || 0;
      // For inclusive: baseAmount includes GST
      // baseAmount = actualBase / (1 + gstPercent / 100)
      const actualBase = baseAmount / (1 + gstPercent / 100);
      const gstAmount = baseAmount - actualBase;

      return {
        baseAmount: actualBase,
        gstAmount: gstAmount,
        totalAmount: baseAmount,
      };
    }

    if (renewalData.gstType === "exclusive" && renewalData.gstPercentage) {
      const gstPercent = parseFloat(renewalData.gstPercentage) || 0;
      // For exclusive: GST is added on top of base amount
      const gstAmount = (baseAmount * gstPercent) / 100;
      const totalAmount = baseAmount + gstAmount;

      return {
        baseAmount: baseAmount,
        gstAmount: gstAmount,
        totalAmount: totalAmount,
      };
    }

    return {
      baseAmount: baseAmount,
      gstAmount: 0,
      totalAmount: baseAmount,
    };
  };

  const handleRenewalSubmit = async () => {
    try {
      setLoading(true);

      const amounts = calculateRenewalAmounts();
      const gymId = await getToken("gym_id");

      // Prepare payload according to API requirements
      const payload = {
        client_id: renewalData.clientId,
        gym_id: parseInt(gymId),
        plan_id: renewalData.plan,
        batch_id: renewalData.batchType,
        type: "fees",
        fees:
          renewalData.gstType === "no_gst"
            ? parseFloat(renewalData.amount)
            : Math.round(amounts.baseAmount),
        gst_percentage:
          renewalData.gstType === "no_gst"
            ? 0
            : parseFloat(renewalData.gstPercentage),
        gst_type: renewalData.gstType,
        payment_method: "bank_transfer",
        payment_reference_number: null,
        total_amount: renewalData.isEditable
          ? parseFloat(renewalData.totalAmount)
          : parseFloat(renewalData.amount),
        request_type: isFromRequestFlow,
        ...(!renewalData.isEditable && {
          payment_type: renewalData.planType,
          ...(renewalData.membershipId && {
            membership_id: renewalData.membershipId,
          }),
        }),
      };

      const response = await updateFeeStatusAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Fee updated successfully",
        });
        setIsFromRequestFlow(false);
        setTimeout(() => {
          router.replace("/owner/client");
        }, 1500);
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to update fee",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "An error occurred while updating fee",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    const requiredFields = [
      "fullName",
      "contact",
      // "email",
      // "dateOfBirth",
      // "height",
      // "weight",
      "gender",
      // "fitnessGoal",
      // "jobNature",
    ];
    let isValid = true;

    for (let field of requiredFields) {
      const error = validateField(field, form[field]);
      if (error) {
        isValid = false;
      }
    }

    return isValid;
  };

  const validateStep2 = () => {
    const requiredFields = [
      "batchType",
      "trainingType",
      "discountedFee",
      // "paymentMethod",
      "expiry",
    ];
    let isValid = true;

    for (let field of requiredFields) {
      if (!form[field]) {
        isValid = false;
      }
    }

    if (form.gstType !== "no_gst" && !form.gstPercentage) {
      isValid = false;
    }

    return isValid;
  };

  const isStep1Valid = validateStep1();
  const isStep2Valid = validateStep2();

  const handleNextStep = () => {
    if (validateStep1()) {
      setIsFlipping(true);
      // First half of flip animation
      Animated.timing(flipAnimation, {
        toValue: 90,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change content at the middle of flip
        setCurrentStep(2);
        setErrors({});
        setTouched({});
        // Scroll to top instantly while content is hidden
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });

        // Second half of flip animation
        Animated.timing(flipAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsFlipping(false);
        });
      });
    }
  };

  const handlePreviousStep = () => {
    setIsFlipping(true);
    // First half of flip animation (flip backward)
    Animated.timing(flipAnimation, {
      toValue: -90,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Change content at the middle of flip
      setCurrentStep(1);
      setErrors({});
      setTouched({});
      // Scroll to top instantly while content is hidden
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      // Second half of flip animation
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsFlipping(false);
      });
    });
  };

  const showConfirmationModal = () => {
    if (validateStep2()) {
      setIsConfirmationModalVisible(true);
    }
  };

  const submitForm = async () => {
    setLoading(true);
    setIsConfirmationModalVisible(false);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        setLoading(false);
        return;
      }

      const payload = {
        gym_id: gymId,
        full_name: form.fullName,
        date_of_birth: formatDateForSQL(form.dateOfBirth),
        gender: form.gender,
        contact: form.contact,
        email: form.email,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        bmi: parseFloat(form.bmi),
        job_nature: form.jobNature,
        fitness_goal: form.fitnessGoal,
        training_type: parseInt(form.trainingType),
        original_fee: parseFloat(form.originalFee),
        discount_type: form.discountType,
        discount_amount:
          form.discountType === "amount"
            ? parseFloat(form.discountAmount) || 0
            : 0,
        discount_percentage:
          form.discountType === "percentage"
            ? parseFloat(form.discountPercentage) || 0
            : 0,
        admission_fee: parseInt(form.admissionFee),
        discounted_fee: parseInt(form.discountedFee),
        admission_number: form.admissionNumber,
        batch_type: parseInt(form.batchType),
        expiry: form.expiry,
        fee_collection_start_date: formatDateForSQL(
          form.feeCollectionStartDate,
        ),
        new_expiry_date: form.newExpiryDate
          ? formatDateForSQL(form.newExpiryDate)
          : null,
        payment_method: form.paymentMethod,
        payment_reference_number: form.paymentReferenceNumber || null,
        gst_type: form.gstType,
        gst_percentage:
          form.gstType !== "no_gst" ? parseFloat(form.gstPercentage) || 0 : 0,
        total_amount:
          qrDataType === "gym_membership" || qrDataType === "personal_training"
            ? parseInt(form.discountedFee)
            : parseFloat(form.totalAmount) || 0,
        entry_type: qrDataType,
        membership_id: form?.membershipId,
        old_client: form.oldClient,
        request_type: isFromRequestFlow,
      };

      const response = await addClientAPI(payload);

      if (response?.status === 200) {
        setLoading(false);

        // Show confetti animation and success modal
        setShowConfetti(true);
        setShowSuccessModal(true);

        showToast({
          type: "success",
          title: "Client added successfully",
        });

        // Reset form and navigate after showing animation
        setTimeout(() => {
          try {
            setForm({
              fullName: "",
              gender: "",
              contact: "",
              email: "",
              dateOfBirth: new Date(),
              height: "",
              weight: "",
              bmi: "",
              jobNature: "",
              fitnessGoal: "",
              trainingType: "",
              batchType: "",
              admissionFee: "",
              admissionNumber: "",
              discountedFee: "",
              expiry: "joining_date",
              feeCollectionStartDate: null,
              newExpiryDate: null,
              paymentMethod: "",
              paymentReferenceNumber: "",
              totalAmount: "",
              oldClient: false,
            });
            setErrors({});
            setTouched({});
            setCurrentStep(1);
            setShowForm(false);
            setIsDataFromQR(false);
            setHasUserSelectedDOB(false);
            setShowConfetti(false);
            setShowSuccessModal(false);
            setIsFromRequestFlow(false);

            // Use replace instead of push to prevent back navigation issues
            router.replace("/owner/client");
          } catch (navError) {
            console.error("Navigation error:", navError);
          }
        }, 2500);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to add client data.",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Submit form error:", error);
      showToast({
        type: "error",
        title: "An error occurred while submitting client data.",
      });
      setLoading(false);
      setIsConfirmationModalVisible(false);
    }
  };

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request);
    setShowAddClientModal(true);
  };

  const handleQuickAdd = () => {
    // Handle QR scan quick add
    if (scannedQRData) {
      const response = scannedQRData.response;
      const parsedQrData = scannedQRData.parsedQrData;

      // For editable renewal (status 202), use client_id and type request
      if (scannedQRData.isEditableRenewal) {
        const params = {
          client_id: response.client_id,
          dp: response.dp || "",
          name: response.full_name || "",
          mobile: response.contact || "",
          type: "request",
        };

        setShowAddClientModal(false);
        setScannedQRData(null);

        router.push({
          pathname: "/owner/offlineclients",
          params,
        });
        return;
      }

      // For normal QR scan (status 200), use uuid and type scan
      const params = {
        uuid: parsedQrData.id,
        client_id: null,
        dp: response.data?.dp || "",
        name: response.data?.full_name || "",
        mobile: response.data?.contact || "",
        type: "scan",
      };

      setShowAddClientModal(false);
      setScannedQRData(null);

      router.push({
        pathname: "/owner/offlineclients",
        params,
      });
      return;
    }

    // Handle request quick add
    if (!selectedRequest) return;

    const params = {
      client_id: selectedRequest.client_id,
      dp: selectedRequest.dp || "",
      name: selectedRequest.name,
      mobile: selectedRequest.mobile_number,
      type: "request",
    };
    if (selectedRequest.alternate_mobile_number) {
      params.alternate = selectedRequest.alternate_mobile_number;
    }

    setShowAddClientModal(false);
    setSelectedRequest(null);

    router.push({
      pathname: "/owner/offlineclients",
      params,
    });
  };

  const handleFullDetails = () => {
    // Handle QR scan full details
    if (scannedQRData) {
      setShowAddClientModal(false);
      fetchQRData(scannedQRData.qrData);
      setScannedQRData(null);
      return;
    }

    // Handle request full details
    if (!selectedRequest) return;

    setShowAddClientModal(false);
    setIsFromRequestFlow(true);

    const qrData = JSON.stringify({
      id: "random",
      type: "normal",
      client_id: selectedRequest.client_id,
    });

    fetchQRData(qrData);
    setSelectedRequest(null);
  };

  const handleRejectRequest = (requestId, requestName) => {
    Alert.alert(
      "Reject Request",
      `Are you sure you want to reject the request from ${requestName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await rejectRequestAPI({ id: requestId });
              if (response.status === 200) {
                showToast({
                  type: "success",
                  title: "Request rejected successfully",
                });
                fetchJoinRequests();
              } else {
                showToast({
                  type: "error",
                  title: "Failed to reject request",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Failed to reject request",
              });
            }
          },
        },
      ],
    );
  };

  const handleProfilePress = (item) => {
    setSelectedProfile(item);
    setProfileModalVisible(true);
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderJoinRequestItem = ({ item }) => {
    if (!item) return null;
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestLeftContent}>
          {/* Profile Image */}
          <TouchableOpacity onPress={() => handleProfilePress(item)}>
            {item.dp ? (
              <Image source={{ uri: item.dp }} style={styles.profileImage} />
            ) : (
              <View
                style={[styles.profileImage, styles.profileImagePlaceholder]}
              >
                <Text style={styles.profileInitial}>
                  {item.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Request Info */}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{item?.name || "Unknown"}</Text>
            <Text style={styles.requestMobile}>
              {item?.mobile_number || ""}
            </Text>
            {item.alternate_mobile_number && (
              <Text style={styles.requestMobile}>
                {item.alternate_mobile_number}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.id, item.name)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!showForm) {
      return (
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"Client Management - Add & Renew"}
        />
      );
    }

    if (currentStep === 1) {
      return (
        <NewOwnerHeader
          onBackButtonPress={() => {
            setShowForm(false);
            setIsDataFromQR(false);
            setHasUserSelectedDOB(false);
            setCurrentStep(1);
          }}
          text={"Add Clients"}
        />
      );
    }

    return (
      <NewOwnerHeader
        onBackButtonPress={handlePreviousStep}
        text={"Add Clients"}
      />
    );
  };

  if (isLoading && !showForm) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ClientFormSelectionSkeleton />
      </View>
    );
  }

  if (isLoading && showForm) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView
          style={styles.innerContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <ClientFormSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath="/owner/home"
        enabled={true}
        onBackPress={() => {
          if (showForm) {
            setShowForm(false);
            setHasUserSelectedDOB(false);
            setErrors({});
            return true;
          }
          return false;
        }}
      />
      {renderHeader()}

      {!showForm ? (
        <ScrollView
          style={styles.mainScrollContainer}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.selectionContainer}>
            {/* Manual Entry Card - At Top */}
            <WorkoutCard
              key={"manual"}
              title={"Manual Entry"}
              subtitle={
                "Add clients directly without QR code - CRM style entry for offline client management"
              }
              buttonText={"Add Client"}
              imagePath={require("../../assets/images/manual.png")}
              onPress={() => router.push("/owner/manualClientEntry")}
              textColor={"#297DB3"}
              bg1={"rgba(41, 125, 179, 0.15)"}
              bg2={"#fff"}
              border1={"rgba(41, 125, 179, 0.5)"}
              border2={"#fff"}
              charWidth={110}
              charHeight={110}
            />

            {/* QR Scan Card - Below */}
            <WorkoutCard
              key={"scan"}
              title={"Scan QR Code"}
              subtitle={
                "For Fymble app users - scan QR to add or renew memberships"
              }
              buttonText={"Scan"}
              imagePath={require("../../assets/images/SCANNER TOO.png")}
              onPress={() => setQRScannerVisible(true)}
              textColor={"#297DB3"}
              bg1={"rgba(41, 125, 179, 0.15)"}
              bg2={"#fff"}
              border1={"rgba(41, 125, 179, 0.5)"}
              border2={"#fff"}
              charWidth={140}
              charHeight={110}
            />
          </View>

          {/* Join Requests Section */}
          {joinRequestsCount > 0 && (
            <View style={styles.joinRequestsContainer}>
              <View style={styles.joinRequestsHeader}>
                <Text style={styles.joinRequestsTitle}>
                  Gym Client's Join Request
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchJoinRequests}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="#0078FF" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or mobile number"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              {/* FlatList */}
              {joinRequestsLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#a855f7" />
                  <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
              ) : (
                <FlatList
                  data={joinRequests.filter(
                    (req) =>
                      req.name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      req.mobile_number?.includes(searchQuery) ||
                      req.alternate_mobile_number?.includes(searchQuery),
                  )}
                  keyExtractor={(item, index) =>
                    item?.id?.toString() || `request_${index}`
                  }
                  renderItem={renderJoinRequestItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>No requests found</Text>
                  )}
                />
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.innerContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.animatedContainer,
                {
                  transform: [
                    {
                      rotateY: flipAnimation.interpolate({
                        inputRange: [-90, 0, 90],
                        outputRange: ["-90deg", "0deg", "90deg"],
                      }),
                    },
                  ],
                  opacity: flipAnimation.interpolate({
                    inputRange: [-90, -45, 0, 45, 90],
                    outputRange: [0, 0.5, 1, 0.5, 0],
                  }),
                },
              ]}
            >
              {isRenewalFlow ? (
                <>
                  <Text style={styles.title}>Membership Renewal</Text>

                  {/* Renewal Member Info Card */}
                  <View style={styles.renewalInfoCard}>
                    <View style={styles.renewalIconContainer}>
                      <MaterialCommunityIcons
                        name="account-check"
                        size={40}
                        color="#34C759"
                      />
                    </View>
                    <Text style={styles.renewalInfoTitle}>
                      {renewalData.fullName}
                    </Text>
                    <Text style={styles.renewalInfoSubtitle}>
                      {renewalData.isEditable
                        ? "is already a member of your gym"
                        : "is already a member of your gym and purchased a renewal plan from Fymble App"}
                    </Text>
                  </View>

                  {/* Renewal Form */}
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Renewal Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Client Name</Text>
                      <TextInput
                        style={[
                          styles.input,
                          !renewalData.isEditable && styles.disabledInput,
                        ]}
                        value={renewalData.fullName}
                        editable={renewalData.isEditable}
                        onChangeText={(text) =>
                          handleRenewalInputChange("fullName", text)
                        }
                      />
                    </View>

                    {!renewalData.isEditable ? (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Plan Type</Text>
                          <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={
                              renewalData.planType === "gym_membership"
                                ? "Gym Membership"
                                : renewalData.planType === "personal_training"
                                  ? "Personal Training"
                                  : ""
                            }
                            editable={false}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Plan</Text>
                          <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={renewalData.planName}
                            editable={false}
                          />
                        </View>
                      </>
                    ) : (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plan Type</Text>

                        {/* Plan Category Radio Buttons */}
                        <View style={styles.planTypeRadioContainer}>
                          <TouchableOpacity
                            style={styles.planTypeRadioButton}
                            onPress={() => {
                              setRenewalData((prev) => ({
                                ...prev,
                                planType: "gym_membership",
                                plan: "",
                                planName: "",
                              }));
                            }}
                          >
                            <View style={styles.radioButton}>
                              {renewalData.planType === "gym_membership" && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>

                            <Text
                              style={[
                                styles.planTypeRadioText,
                                renewalData.planType === "gym_membership" &&
                                  styles.planTypeRadioTextActive,
                              ]}
                            >
                              Membership
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.planTypeRadioButton}
                            onPress={() => {
                              setRenewalData((prev) => ({
                                ...prev,
                                planType: "personal_training",
                                plan: "",
                                planName: "",
                              }));
                            }}
                          >
                            <View style={styles.radioButton}>
                              {renewalData.planType === "personal_training" && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>

                            <Text
                              style={[
                                styles.planTypeRadioText,
                                renewalData.planType === "personal_training" &&
                                  styles.planTypeRadioTextActivePT,
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
                                renewalData.planType === "gym_membership"
                                  ? !plan.personal_training
                                  : plan.personal_training,
                              )
                              .map((plan) => (
                                <TouchableOpacity
                                  key={plan.id}
                                  style={[
                                    styles.planCard,
                                    renewalData.planType ===
                                      "personal_training" && styles.planCardPT,
                                    renewalData.plan === plan.id &&
                                      (renewalData.planType === "gym_membership"
                                        ? styles.planCardSelected
                                        : styles.planCardSelectedPT),
                                  ]}
                                  onPress={() => {
                                    setRenewalData((prev) => {
                                      const baseAmount =
                                        parseFloat(plan.amount) || 0;
                                      let totalAmount = baseAmount;

                                      // Calculate total amount based on GST type
                                      if (
                                        prev.gstType === "exclusive" &&
                                        prev.gstPercentage
                                      ) {
                                        const gstAmount =
                                          (baseAmount *
                                            parseFloat(prev.gstPercentage)) /
                                          100;
                                        totalAmount = baseAmount + gstAmount;
                                      }

                                      return {
                                        ...prev,
                                        plan: plan.id,
                                        planName: plan.plans,
                                        amount: plan.amount?.toString() || "",
                                        totalAmount: totalAmount.toString(),
                                      };
                                    });
                                  }}
                                >
                                  {renewalData.plan === plan.id ? (
                                    <View
                                      style={
                                        renewalData.planType ===
                                        "gym_membership"
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
                                      renewalData.plan === plan.id &&
                                        styles.planCardDurationSelected,
                                    ]}
                                  >
                                    {plan.plans || ""}
                                  </Text>
                                  <View style={styles.planCardPriceContainer}>
                                    {plan.original > plan.amount ? (
                                      <Text
                                        style={styles.planCardOriginalPrice}
                                      >
                                        ₹{plan.original || 0}
                                      </Text>
                                    ) : null}
                                    <Text
                                      style={[
                                        styles.planCardPrice,
                                        renewalData.plan === plan.id &&
                                          styles.planCardPriceSelected,
                                      ]}
                                    >
                                      ₹{plan.amount || 0}
                                    </Text>
                                  </View>

                                  <View style={styles.planCardBonusBadge}>
                                    <Text style={styles.planCardBonusText}>
                                      {plan.duration} Month{" "}
                                      {plan.bonus ? "+" : ""}
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
                                        {plan.pause} {plan.pause_type || ""}{" "}
                                        pause
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
                      </View>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Amount (₹)</Text>
                      <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={`₹${renewalData.amount}`}
                        editable={false}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Joining Date</Text>
                      <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={
                          renewalData.joiningDate
                            ? formatDateForDisplay(renewalData.joiningDate)
                            : ""
                        }
                        editable={false}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Batch Type{" "}
                        <Text style={[styles.required, { color: "#FF5757" }]}>
                          *
                        </Text>
                      </Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          !renewalData.batchType && styles.highlightInput,
                        ]}
                      >
                        <RNPickerSelect
                          onValueChange={(value) =>
                            handleRenewalInputChange("batchType", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          value={renewalData.batchType}
                          style={pickerSelectStyles}
                          placeholder={{
                            label: "Select Batch Type",
                            value: null,
                          }}
                          items={
                            Array.isArray(batches)
                              ? batches
                                  .map((batch) => ({
                                    label: batch?.batch_name || "Unknown Batch",
                                    value: batch?.id,
                                  }))
                                  .filter((item) => item.value != null)
                              : []
                          }
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color="#666666"
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>GST Type</Text>
                      <View style={styles.renewalGstRadioContainer}>
                        {(renewalData.isEditable
                          ? ["no_gst", "inclusive", "exclusive"]
                          : ["no_gst", "inclusive"]
                        ).map((gstOption) => (
                          <TouchableOpacity
                            key={gstOption}
                            style={styles.renewalGstRadioOptionButton}
                            onPress={() =>
                              handleRenewalInputChange("gstType", gstOption)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.radioButton}>
                              {renewalData.gstType === gstOption && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Text style={styles.renewalGstRadioOptionText}>
                              {gstOption === "no_gst"
                                ? "No GST"
                                : gstOption === "inclusive"
                                  ? "Inclusive"
                                  : "Exclusive"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {(renewalData.gstType === "inclusive" ||
                      renewalData.gstType === "exclusive") && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>GST Percentage (%)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={renewalData.gstPercentage}
                          placeholder="Enter GST % (e.g., 18)"
                          placeholderTextColor="#a0a0a0"
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9.]/g, "");
                            handleRenewalInputChange(
                              "gstPercentage",
                              numericValue,
                            );
                          }}
                        />
                      </View>
                    )}

                    {/* Final Amount Summary */}
                    {renewalData.isEditable ? (
                      <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Fee Summary</Text>

                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Base Amount:</Text>
                          <Text style={styles.summaryValue}>
                            ₹{calculateRenewalAmounts().baseAmount.toFixed(2)}
                          </Text>
                        </View>

                        {renewalData.gstType !== "no_gst" &&
                          renewalData.gstPercentage && (
                            <>
                              <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>
                                  GST ({renewalData.gstPercentage}%{" "}
                                  {renewalData.gstType}):
                                </Text>
                                <Text style={styles.summaryValue}>
                                  ₹
                                  {calculateRenewalAmounts().gstAmount.toFixed(
                                    2,
                                  )}
                                </Text>
                              </View>
                            </>
                          )}

                        {renewalData.gstType === "inclusive" &&
                          renewalData.gstPercentage && (
                            <View style={styles.summaryRow}>
                              <Text
                                style={[
                                  styles.summaryLabel,
                                  { fontSize: 12, fontStyle: "italic" },
                                ]}
                              >
                                * GST is included in the base amount
                              </Text>
                            </View>
                          )}

                        {/* Editable Total Amount */}
                        <View style={styles.totalAmountInputContainer}>
                          <Text style={styles.totalLabel}>
                            Total Amount (₹):
                          </Text>
                          <TextInput
                            style={styles.totalAmountInput}
                            placeholder="0"
                            placeholderTextColor="#a0a0a0"
                            keyboardType="numeric"
                            value={renewalData.totalAmount}
                            onChangeText={(value) => {
                              const numericValue = value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              handleRenewalInputChange(
                                "totalAmount",
                                numericValue,
                              );
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.renewalSummaryCard}>
                        <View style={styles.renewalSummaryRow}>
                          <Text style={styles.renewalSummaryLabel}>
                            Base Amount:
                          </Text>
                          <Text style={styles.renewalSummaryValue}>
                            ₹{calculateRenewalAmounts().baseAmount.toFixed(2)}
                          </Text>
                        </View>

                        {renewalData.gstType === "inclusive" &&
                          renewalData.gstPercentage && (
                            <>
                              <View style={styles.renewalSummaryRow}>
                                <Text style={styles.renewalSummaryLabel}>
                                  GST ({renewalData.gstPercentage}%):
                                </Text>
                                <Text style={styles.renewalSummaryValue}>
                                  ₹
                                  {calculateRenewalAmounts().gstAmount.toFixed(
                                    2,
                                  )}
                                </Text>
                              </View>
                            </>
                          )}

                        <View
                          style={[
                            styles.renewalSummaryRow,
                            styles.renewalSummaryTotal,
                          ]}
                        >
                          <Text style={styles.renewalSummaryTotalLabel}>
                            Total Amount:
                          </Text>
                          <Text style={styles.renewalSummaryTotalValue}>
                            ₹{calculateRenewalAmounts().totalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.renewalSubmitButton,
                        (loading ||
                          !renewalData.batchType ||
                          (renewalData.isEditable &&
                            (!renewalData.fullName ||
                              !renewalData.plan ||
                              !renewalData.amount ||
                              !renewalData.totalAmount))) &&
                          styles.disabledButton,
                      ]}
                      onPress={handleRenewalSubmit}
                      disabled={
                        loading ||
                        !renewalData.batchType ||
                        (renewalData.isEditable &&
                          (!renewalData.fullName ||
                            !renewalData.plan ||
                            !renewalData.amount ||
                            !renewalData.totalAmount))
                      }
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.renewalSubmitButtonText}>
                          Submit Renewal
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : currentStep === 1 ? (
                <>
                  <Text style={styles.title}>Client Details</Text>

                  {/* QR Purchase Info Card */}
                  {(qrDataType === "gym_membership" ||
                    qrDataType === "personal_training") && (
                    <View style={styles.qrInfoCard}>
                      <View style={styles.qrInfoHeader}>
                        <MaterialCommunityIcons
                          name="qrcode-scan"
                          size={24}
                          color="#007AFF"
                        />
                        <Text style={styles.qrInfoTitle}>
                          Purchased via Fymble App
                        </Text>
                      </View>

                      <View style={styles.qrInfoContent}>
                        <View style={styles.qrInfoRow}>
                          <Text style={styles.qrInfoLabel}>Type:</Text>
                          <Text style={styles.qrInfoValue}>
                            {qrDataType === "gym_membership"
                              ? "Gym Membership"
                              : "Personal Training"}
                          </Text>
                        </View>

                        {qrPlanName && (
                          <View style={styles.qrInfoRow}>
                            <Text style={styles.qrInfoLabel}>Plan:</Text>
                            <Text style={styles.qrInfoValue}>{qrPlanName}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.qrInfoBadge}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={16}
                          color="#34C759"
                        />
                        <Text style={styles.qrInfoBadgeText}>
                          Client purchased this through the Fymble App
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Basic Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full name</Text>
                      <TextInput
                        style={[
                          styles.input,
                          isDataFromQR && styles.disabledInput,
                          touched.fullName &&
                            errors.fullName &&
                            styles.errorInput,
                        ]}
                        placeholder="Enter name"
                        placeholderTextColor="#a0a0a0"
                        value={form.fullName}
                        onChangeText={(value) =>
                          handleInputChange("fullName", value)
                        }
                        onBlur={() => handleBlur("fullName")}
                        editable={!isDataFromQR}
                      />
                      {touched.fullName && errors.fullName && (
                        <Text style={styles.errorText}>{errors.fullName}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                        style={[
                          styles.input,
                          isDataFromQR && styles.disabledInput,
                          touched.contact &&
                            errors.contact &&
                            styles.errorInput,
                        ]}
                        placeholder="Enter mobile number"
                        placeholderTextColor="#a0a0a0"
                        keyboardType="phone-pad"
                        value={form.contact}
                        onChangeText={(value) =>
                          handleInputChange("contact", value)
                        }
                        onBlur={() => handleBlur("contact")}
                        maxLength={10}
                        editable={!isDataFromQR}
                      />
                      {touched.contact && errors.contact && (
                        <Text style={styles.errorText}>{errors.contact}</Text>
                      )}
                    </View>

                    {/* <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Id</Text>
                      <TextInput
                        style={[
                          styles.input,
                          isDataFromQR && styles.disabledInput,
                          touched.email && errors.email && styles.errorInput,
                        ]}
                        placeholder="Enter email address"
                        placeholderTextColor="#a0a0a0"
                        keyboardType="email-address"
                        value={form.email}
                        onChangeText={(value) =>
                          handleInputChange("email", value)
                        }
                        onBlur={() => handleBlur("email")}
                        editable={!isDataFromQR}
                      />
                      {touched.email && errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View> */}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Gender</Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          touched.gender && errors.gender && styles.errorInput,
                        ]}
                      >
                        <RNPickerSelect
                          value={form.gender}
                          onValueChange={(value) =>
                            !isDataFromQR && handleInputChange("gender", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          disabled={isDataFromQR}
                          items={[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                          ]}
                          placeholder={{ label: "Select Gender", value: null }}
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={isDataFromQR ? "#999999" : "#666666"}
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {touched.gender && errors.gender && (
                        <Text style={styles.errorText}>{errors.gender}</Text>
                      )}
                    </View>

                    {/* <View style={styles.inputGroup}>
                      <Text style={styles.label}>Date of Birth</Text>
                      <TouchableOpacity
                        style={[
                          styles.datePickerButton,
                          isDataFromQR && styles.disabledInput,
                          errors.dateOfBirth && styles.errorInput,
                        ]}
                        onPress={() => {
                          if (!isDataFromQR) {
                            setTempDateOfBirth(form.dateOfBirth || new Date());
                            setShowDatePicker(true);
                          }
                        }}
                        disabled={isDataFromQR}
                      >
                        <Text
                          style={[
                            styles.datePickerText,
                            isDataFromQR && styles.disabledText,
                            !hasUserSelectedDOB && styles.placeholderText,
                          ]}
                        >
                          {hasUserSelectedDOB ? (
                            <>
                              {formatDateForDisplay(form.dateOfBirth)}
                              <Text style={styles.ageText}>
                                {" "}
                                (Age: {calculateAge(form.dateOfBirth)} years)
                              </Text>
                            </>
                          ) : (
                            "Select your date of birth"
                          )}
                        </Text>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={20}
                          color={isDataFromQR ? "#999999" : "#666666"}
                        />
                      </TouchableOpacity>
                      {errors.dateOfBirth && (
                        <Text style={styles.errorText}>
                          {errors.dateOfBirth}
                        </Text>
                      )}
                    </View> */}

                    {/* {Platform.OS === "ios" && showDatePicker && (
                      <Modal
                        transparent={true}
                        animationType="slide"
                        visible={showDatePicker}
                        onRequestClose={cancelDateOfBirthSelection}
                      >
                        <TouchableWithoutFeedback
                          onPress={cancelDateOfBirthSelection}
                        >
                          <View style={styles.pickerModalContainer}>
                            <TouchableWithoutFeedback
                              onPress={(e) => e.stopPropagation()}
                            >
                              <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                  <TouchableOpacity
                                    onPress={cancelDateOfBirthSelection}
                                  >
                                    <Text style={styles.pickerCancelText}>
                                      Cancel
                                    </Text>
                                  </TouchableOpacity>
                                  <Text style={styles.pickerTitle}>
                                    Select Date of Birth
                                  </Text>
                                  <TouchableOpacity
                                    onPress={confirmDateOfBirthSelection}
                                  >
                                    <Text style={styles.pickerConfirmText}>
                                      Done
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                  testID="dateTimePicker"
                                  value={tempDateOfBirth}
                                  mode="date"
                                  display="spinner"
                                  themeVariant="light"
                                  textColor="#000000"
                                  onChange={handleDateChange}
                                  maximumDate={new Date()}
                                  minimumDate={
                                    new Date(
                                      new Date().getFullYear() - 100,
                                      0,
                                      1,
                                    )
                                  }
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
                        testID="dateTimePicker"
                        value={form.dateOfBirth}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        themeVariant="light"
                        textColor="#000000"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={
                          new Date(new Date().getFullYear() - 100, 0, 1)
                        }
                      />
                    )} */}

                    {/* <View style={styles.inputGroup}>
                      <Text style={styles.label}>Place</Text>
                      <TextInput
                        style={[
                          styles.input,
                          isDataFromQR && styles.disabledInput,
                          touched.place && errors.place && styles.errorInput,
                        ]}
                        placeholder="Enter place"
                        placeholderTextColor="#a0a0a0"
                        value={form.place || ""}
                        onChangeText={(value) =>
                          handleInputChange("place", value)
                        }
                        onBlur={() => handleBlur("place")}
                        editable={!isDataFromQR}
                      />
                      {touched.place && errors.place && (
                        <Text style={styles.errorText}>{errors.place}</Text>
                      )}
                    </View> */}
                  </View>

                  {/* <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Physical Attributes</Text>

                    <View style={styles.doubleInputRow}>
                      <View style={styles.halfInputGroup}>
                        <Text style={styles.label}>Height (cm)</Text>
                        <View style={styles.inputWithSuffix}>
                          <TextInput
                            style={[
                              styles.inputWithSuffixField,
                              isDataFromQR && styles.disabledInput,
                              touched.height &&
                                errors.height &&
                                styles.errorInput,
                            ]}
                            placeholder=""
                            placeholderTextColor="#a0a0a0"
                            keyboardType="phone-pad"
                            value={form.height}
                            onChangeText={(value) =>
                              handleInputChange("height", value)
                            }
                            onBlur={() => handleBlur("height")}
                            editable={!isDataFromQR}
                          />
                          <Text style={styles.suffix}>cm</Text>
                        </View>
                        {touched.height && errors.height && (
                          <Text style={styles.errorText}>{errors.height}</Text>
                        )}
                      </View>

                      <View style={styles.halfInputGroup}>
                        <Text style={styles.label}>Weight (kg)</Text>
                        <View style={styles.inputWithSuffix}>
                          <TextInput
                            style={[
                              styles.inputWithSuffixField,
                              isDataFromQR && styles.disabledInput,
                              touched.weight &&
                                errors.weight &&
                                styles.errorInput,
                            ]}
                            placeholder=""
                            placeholderTextColor="#a0a0a0"
                            keyboardType="phone-pad"
                            value={form.weight}
                            onChangeText={(value) =>
                              handleInputChange("weight", value)
                            }
                            onBlur={() => handleBlur("weight")}
                            editable={!isDataFromQR}
                          />
                          <Text style={styles.suffix}>kg</Text>
                        </View>
                        {touched.weight && errors.weight && (
                          <Text style={styles.errorText}>{errors.weight}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Bmi (Auto Calculated)</Text>
                      <TextInput
                        style={[styles.input, styles.disabledInput]}
                        editable={false}
                        value={form.bmi.toString() || ""}
                        placeholder="Your BMI Appear Here"
                        placeholderTextColor="#a0a0a0"
                      />
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Lifestyle & Goals</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Lifestyle</Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          touched.jobNature &&
                            errors.jobNature &&
                            styles.errorInput,
                        ]}
                      >
                        <RNPickerSelect
                          value={form.jobNature}
                          onValueChange={(value) =>
                            !isDataFromQR &&
                            handleInputChange("jobNature", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          disabled={isDataFromQR}
                          placeholder={{
                            label: "Select Lifestyle",
                            value: null,
                          }}
                          items={[
                            { label: "Sedentary", value: "sedentary" },
                            {
                              label: "Lightly Active",
                              value: "lightly_active",
                            },
                            {
                              label: "Moderately Active",
                              value: "moderately_active",
                            },
                            { label: "Very Active", value: "very_active" },
                            { label: "Super Active", value: "super_active" },
                          ]}
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={isDataFromQR ? "#999999" : "#666666"}
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {touched.jobNature && errors.jobNature && (
                        <Text style={styles.errorText}>{errors.jobNature}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Fitness Goal</Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          touched.fitnessGoal &&
                            errors.fitnessGoal &&
                            styles.errorInput,
                        ]}
                      >
                        <RNPickerSelect
                          value={form.fitnessGoal}
                          onValueChange={(value) =>
                            !isDataFromQR &&
                            handleInputChange("fitnessGoal", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          disabled={isDataFromQR}
                          placeholder={{ label: "Select Goal", value: null }}
                          items={[
                            { label: "Weight Loss", value: "weight_loss" },
                            { label: "Weight Gain", value: "weight_gain" },
                            { label: "Body Recomp", value: "maintain" },
                          ]}
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={isDataFromQR ? "#999999" : "#666666"}
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {touched.fitnessGoal && errors.fitnessGoal && (
                        <Text style={styles.errorText}>
                          {errors.fitnessGoal}
                        </Text>
                      )}
                    </View>
                  </View> */}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !isStep1Valid && styles.disabledButton,
                    ]}
                    onPress={handleNextStep}
                    disabled={!isStep1Valid}
                  >
                    <LinearGradient
                      colors={
                        !isStep1Valid
                          ? ["#CCCCCC", "#CCCCCC"]
                          : ["#030A15", "#0154A0"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>Next</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFF"
                        style={{ marginLeft: 6 }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Training and Batch Details</Text>
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Training & Batch</Text>

                    {/* Client Type Radio Buttons - Only show if not from QR */}
                    {!(
                      qrDataType === "gym_membership" ||
                      qrDataType === "personal_training"
                    ) && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Client Type</Text>
                        <View style={styles.planTypeRadioContainer}>
                          <TouchableOpacity
                            style={styles.planTypeRadioButton}
                            onPress={() =>
                              handleInputChange("oldClient", false)
                            }
                          >
                            <View style={styles.radioButton}>
                              {!form.oldClient && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.planTypeRadioText,
                                !form.oldClient &&
                                  styles.planTypeRadioTextActive,
                              ]}
                            >
                              New Client
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.planTypeRadioButton}
                            onPress={() => handleInputChange("oldClient", true)}
                          >
                            <View style={styles.radioButton}>
                              {form.oldClient && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.planTypeRadioText,
                                form.oldClient &&
                                  styles.planTypeRadioTextActive,
                              ]}
                            >
                              Old Client
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Plan Type</Text>

                      {/* Plan Category Radio Buttons */}
                      <View style={styles.planTypeRadioContainer}>
                        <TouchableOpacity
                          style={styles.planTypeRadioButton}
                          onPress={() => {
                            if (
                              !(
                                qrDataType === "gym_membership" ||
                                qrDataType === "personal_training"
                              )
                            ) {
                              setSelectedPlanCategory("gym_membership");
                              handleInputChange("trainingType", "");
                            }
                          }}
                          disabled={
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          }
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
                              (qrDataType === "gym_membership" ||
                                qrDataType === "personal_training") &&
                                styles.disabledText,
                            ]}
                          >
                            Membership
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.planTypeRadioButton}
                          onPress={() => {
                            if (
                              !(
                                qrDataType === "gym_membership" ||
                                qrDataType === "personal_training"
                              )
                            ) {
                              setSelectedPlanCategory("personal_training");
                              handleInputChange("trainingType", "");
                            }
                          }}
                          disabled={
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          }
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
                                styles.planTypeRadioTextActivePT,
                              (qrDataType === "gym_membership" ||
                                qrDataType === "personal_training") &&
                                styles.disabledText,
                            ]}
                          >
                            Personal Training
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Plan Cards */}
                      <View style={styles.planCategoryContainer}>
                        <ScrollView
                          ref={planScrollViewRef}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.planCardsScroll}
                        >
                          {plans
                            .filter((plan) =>
                              selectedPlanCategory === "gym_membership"
                                ? !plan.personal_training
                                : plan.personal_training,
                            )
                            .map((plan) => (
                              <TouchableOpacity
                                key={plan.id}
                                style={[
                                  styles.planCard,
                                  selectedPlanCategory ===
                                    "personal_training" && styles.planCardPT,
                                  form.trainingType === plan.id &&
                                    (selectedPlanCategory === "gym_membership"
                                      ? styles.planCardSelected
                                      : styles.planCardSelectedPT),
                                  (qrDataType === "gym_membership" ||
                                    qrDataType === "personal_training") &&
                                    styles.planCardDisabled,
                                ]}
                                onPress={() =>
                                  !(
                                    qrDataType === "gym_membership" ||
                                    qrDataType === "personal_training"
                                  ) &&
                                  handleInputChange("trainingType", plan.id)
                                }
                                disabled={
                                  qrDataType === "gym_membership" ||
                                  qrDataType === "personal_training"
                                }
                              >
                                {form.trainingType === plan.id ? (
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
                                    form.trainingType === plan.id &&
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
                                      form.trainingType === plan.id &&
                                        styles.planCardPriceSelected,
                                    ]}
                                  >
                                    ₹{plan.amount || 0}
                                  </Text>
                                </View>

                                <View style={styles.planCardBonusBadge}>
                                  <Text style={styles.planCardBonusText}>
                                    {plan.duration} Month{" "}
                                    {plan.bonus ? "+" : ""}
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

                      {touched.trainingType && errors.trainingType && (
                        <Text style={styles.errorText}>
                          {errors.trainingType}
                        </Text>
                      )}
                    </View>

                    {/* <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bonus (Months)</Text>
                    <View
                      style={[
                        styles.pickerContainerWithIcon,
                        (qrDataType === "gym_membership" ||
                          qrDataType === "personal_training") &&
                          styles.disabledInput,
                      ]}
                    >
                      <RNPickerSelect
                        onValueChange={(value) =>
                          !(
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          ) && handleInputChange("bonus", value)
                        }
                        pickerProps={{
                          itemStyle: {
                            color: "#000000",
                          },
                        }}
                        value={form.bonus}
                        style={pickerSelectStyles}
                        disabled={
                          qrDataType === "gym_membership" ||
                          qrDataType === "personal_training"
                        }
                        placeholder={{
                          label: "Select Bonus",
                          value: null,
                        }}
                        items={Array.from({ length: 12 }, (_, i) => ({
                          label: `${i + 1} Month${i > 0 ? "s" : ""}`,
                          value: i + 1,
                        }))}
                        Icon={() => (
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={20}
                            color={
                              qrDataType === "gym_membership" ||
                              qrDataType === "personal_training"
                                ? "#999999"
                                : "#666666"
                            }
                          />
                        )}
                        useNativeAndroidPickerStyle={false}
                        fixAndroidTouchableBug={true}
                      />
                    </View>
                  </View> */}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Batch Type{" "}
                        <Text style={[styles.required, { color: "#FF5757" }]}>
                          *
                        </Text>
                      </Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          touched.batchType &&
                            errors.batchType &&
                            styles.errorInput,
                          !form.batchType && styles.highlightInput,
                        ]}
                      >
                        <RNPickerSelect
                          onValueChange={(value) =>
                            handleInputChange("batchType", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          value={form.batchType}
                          style={pickerSelectStyles}
                          placeholder={{
                            label: "Select Batch Type",
                            value: null,
                          }}
                          items={
                            Array.isArray(batches)
                              ? batches
                                  .map((batch) => ({
                                    label: batch?.batch_name || "Unknown Batch",
                                    value: batch?.id,
                                  }))
                                  .filter((item) => item.value != null)
                              : []
                          }
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color="#666666"
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Fee Details</Text>

                    <View style={styles.doubleInputRow}>
                      <View style={styles.halfInputGroup}>
                        <Text style={styles.label}>Original Fee (₹)</Text>
                        <TextInput
                          style={[styles.input, styles.disabledInput]}
                          value={form.originalFee ? `₹${form.originalFee}` : ""}
                          placeholder="Select plan first"
                          placeholderTextColor="#a0a0a0"
                          editable={false}
                        />
                      </View>

                      <View style={styles.halfInputGroup}>
                        <Text style={styles.label}>Final Fee (₹)</Text>
                        <TextInput
                          style={[styles.input, styles.disabledInput]}
                          value={
                            form.discountedFee ? `₹${form.discountedFee}` : ""
                          }
                          placeholder="₹0"
                          placeholderTextColor="#a0a0a0"
                          editable={false}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Discount Type</Text>
                      <View style={styles.radioButtonContainer}>
                        {discountTypeOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={styles.radioOptionButton}
                            onPress={() =>
                              !(
                                qrDataType === "gym_membership" ||
                                qrDataType === "personal_training"
                              ) &&
                              handleInputChange("discountType", option.value)
                            }
                            activeOpacity={0.7}
                            disabled={
                              qrDataType === "gym_membership" ||
                              qrDataType === "personal_training"
                            }
                          >
                            <View style={styles.radioButton}>
                              {form.discountType === option.value && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.radioOptionText,
                                (qrDataType === "gym_membership" ||
                                  qrDataType === "personal_training") &&
                                  styles.disabledText,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        {form.discountType === "amount"
                          ? "Discount Amount (₹)"
                          : "Discount Percentage (%)"}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          (qrDataType === "gym_membership" ||
                            qrDataType === "personal_training") &&
                            styles.disabledInput,
                          (touched.discountAmount && errors.discountAmount) ||
                          (touched.discountPercentage &&
                            errors.discountPercentage)
                            ? styles.errorInput
                            : null,
                        ]}
                        keyboardType="numeric"
                        value={
                          form.discountType === "amount"
                            ? form.discountAmount
                            : form.discountPercentage
                        }
                        placeholder={
                          form.discountType === "amount"
                            ? "Enter discount amount"
                            : "Enter discount percentage"
                        }
                        placeholderTextColor="#a0a0a0"
                        editable={
                          !(
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          )
                        }
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9.]/g, "");
                          if (form.discountType === "amount") {
                            handleInputChange("discountAmount", numericValue);
                          } else {
                            handleInputChange(
                              "discountPercentage",
                              numericValue,
                            );
                          }
                        }}
                        onBlur={() => {
                          if (form.discountType === "amount") {
                            handleBlur("discountAmount");
                          } else {
                            handleBlur("discountPercentage");
                          }
                        }}
                      />
                      {((touched.discountAmount && errors.discountAmount) ||
                        (touched.discountPercentage &&
                          errors.discountPercentage)) && (
                        <Text style={styles.errorText}>
                          {errors.discountAmount || errors.discountPercentage}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>GST Type</Text>
                      <View style={styles.gstRadioContainer}>
                        {gstTypeOptions
                          .filter((option) => {
                            // If QR type is gym_membership or personal_training, show only inclusive and no_gst
                            if (
                              qrDataType === "gym_membership" ||
                              qrDataType === "personal_training"
                            ) {
                              return (
                                option.value === "inclusive" ||
                                option.value === "no_gst"
                              );
                            }
                            return true;
                          })
                          .map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={styles.gstRadioOptionButton}
                              onPress={() =>
                                handleInputChange("gstType", option.value)
                              }
                              activeOpacity={0.7}
                            >
                              <View style={styles.radioButton}>
                                {form.gstType === option.value && (
                                  <View style={styles.radioButtonInner} />
                                )}
                              </View>
                              <Text style={styles.gstRadioOptionText}>
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>

                    {form.gstType !== "no_gst" && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>GST Percentage (%)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            touched.gstPercentage &&
                              errors.gstPercentage &&
                              styles.errorInput,
                          ]}
                          keyboardType="numeric"
                          value={form.gstPercentage}
                          placeholder="Enter GST % (e.g., 18)"
                          placeholderTextColor="#a0a0a0"
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9.]/g, "");
                            handleInputChange("gstPercentage", numericValue);
                          }}
                          onBlur={() => handleBlur("gstPercentage")}
                        />
                        {touched.gstPercentage && errors.gstPercentage && (
                          <Text style={styles.errorText}>
                            {errors.gstPercentage}
                          </Text>
                        )}
                      </View>
                    )}

                    {form.originalFee && (
                      <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Fee Summary</Text>

                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            Original Amount:
                          </Text>
                          <Text style={styles.summaryValue}>
                            ₹{form.originalFee}
                          </Text>
                        </View>

                        {getDiscountAmount() > 0 && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount:</Text>
                            <Text
                              style={[styles.summaryValue, styles.discountText]}
                            >
                              -₹{getDiscountAmount().toFixed(2)} (
                              {getDiscountPercentage().toFixed(1)}%)
                            </Text>
                          </View>
                        )}

                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Base Amount:</Text>
                          <Text style={styles.summaryValue}>
                            ₹{calculateDiscountedFee()}
                          </Text>
                        </View>

                        {form.gstType !== "no_gst" && form.gstPercentage && (
                          <>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>
                                GST ({form.gstPercentage}% {form.gstType}):
                              </Text>
                              <Text style={styles.summaryValue}>
                                ₹{calculateGstAmount().toFixed(2)}
                              </Text>
                            </View>
                          </>
                        )}

                        {form.gstType === "inclusive" && form.gstPercentage && (
                          <View style={styles.summaryRow}>
                            <Text
                              style={[
                                styles.summaryLabel,
                                { fontSize: 12, fontStyle: "italic" },
                              ]}
                            >
                              * GST is included in the base amount
                            </Text>
                          </View>
                        )}

                        {/* Editable Total Amount */}
                        <View style={styles.totalAmountInputContainer}>
                          <Text style={styles.totalLabel}>
                            Total Amount (₹):
                          </Text>
                          <TextInput
                            style={[
                              styles.totalAmountInput,
                              touched.totalAmount &&
                                errors.totalAmount &&
                                styles.errorInput,
                            ]}
                            placeholder="0"
                            placeholderTextColor="#a0a0a0"
                            keyboardType="numeric"
                            value={form.totalAmount}
                            onChangeText={(value) => {
                              const numericValue = value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              handleInputChange("totalAmount", numericValue);
                            }}
                            onBlur={() => handleBlur("totalAmount")}
                          />
                        </View>
                        {touched.totalAmount && errors.totalAmount && (
                          <Text style={styles.errorText}>
                            {errors.totalAmount}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Additional Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Fee Collection</Text>
                      <TouchableOpacity
                        style={[
                          styles.feeCollectionButton,
                          (qrDataType === "gym_membership" ||
                            qrDataType === "personal_training") &&
                            styles.disabledInput,
                          touched.expiry && errors.expiry && styles.errorInput,
                        ]}
                        onPress={() =>
                          !(
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          ) &&
                          setShowFeeCollectionOptions(!showFeeCollectionOptions)
                        }
                        disabled={
                          qrDataType === "gym_membership" ||
                          qrDataType === "personal_training"
                        }
                      >
                        <Text
                          style={[
                            styles.feeCollectionButtonText,
                            (qrDataType === "gym_membership" ||
                              qrDataType === "personal_training") &&
                              styles.disabledText,
                            !form.expiry && styles.placeholderText,
                          ]}
                        >
                          {form.expiry === "start_of_the_month"
                            ? "Start of the Month"
                            : form.expiry === "joining_date"
                              ? "Joining Date"
                              : "Select Fee Collection Method"}
                        </Text>
                        <MaterialCommunityIcons
                          name={
                            showFeeCollectionOptions
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                              ? "#999999"
                              : "#666666"
                          }
                        />
                      </TouchableOpacity>

                      {showFeeCollectionOptions && (
                        <View style={styles.feeCollectionCards}>
                          <TouchableOpacity
                            style={[
                              styles.feeCollectionCard,
                              form.expiry === "start_of_the_month" &&
                                styles.selectedCard,
                            ]}
                            onPress={() => {
                              handleInputChange("expiry", "start_of_the_month");
                              setShowFeeCollectionOptions(false);
                            }}
                          >
                            <View style={styles.cardHeader}>
                              <MaterialCommunityIcons
                                name="calendar-month"
                                size={24}
                                color={
                                  form.expiry === "start_of_the_month"
                                    ? "#007AFF"
                                    : "#666666"
                                }
                              />
                              <Text
                                style={[
                                  styles.feeCollectionCardTitle,
                                  form.expiry === "start_of_the_month" &&
                                    styles.selectedCardTitle,
                                ]}
                              >
                                Start of the Month
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.feeCollectionCardDescription,
                                form.expiry === "start_of_the_month" &&
                                  styles.selectedCardDescription,
                              ]}
                            >
                              📅 Monthly billing cycle starts on the 1st of each
                              month{"\n"}
                              💰 Automatic fee collection from next month{"\n"}
                              📊 Easy to track and manage monthly subscriptions
                            </Text>
                            <View style={styles.cardExample}>
                              <Text style={styles.exampleText}>
                                Example: If joined on 15th Jan, billing starts
                                from 1st Feb
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.feeCollectionCard,
                              form.expiry === "joining_date" &&
                                styles.selectedCard,
                            ]}
                            onPress={() => {
                              handleInputChange("expiry", "joining_date");
                              setShowFeeCollectionOptions(false);
                            }}
                          >
                            <View style={styles.cardHeader}>
                              <MaterialCommunityIcons
                                name="calendar-today"
                                size={24}
                                color={
                                  form.expiry === "joining_date"
                                    ? "#007AFF"
                                    : "#666666"
                                }
                              />
                              <Text
                                style={[
                                  styles.feeCollectionCardTitle,
                                  form.expiry === "joining_date" &&
                                    styles.selectedCardTitle,
                                ]}
                              >
                                Joining Date
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.feeCollectionCardDescription,
                                form.expiry === "joining_date" &&
                                  styles.selectedCardDescription,
                              ]}
                            >
                              🎯 Billing cycle based on actual joining date
                              {"\n"}⚡ Immediate fee collection from specified
                              date
                              {"\n"}
                              🔄 Consistent monthly renewal on same date
                            </Text>
                            <View style={styles.cardExample}>
                              <Text style={styles.exampleText}>
                                Example: If joined on 15th Jan, next billing on
                                15th Feb
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}

                      {touched.expiry && errors.expiry && (
                        <Text style={styles.errorText}>{errors.expiry}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Joining Date (Optional)</Text>
                      <Text style={styles.instructionText}>
                        💡 If you select "Start of the Month", the fee will be
                        collected from the 1st of the next month. If you select
                        "Joining Date", the fee will be collected from the date
                        you specify below or today's date if not specified.
                      </Text>
                      <View style={styles.datePickerWithReset}>
                        <TouchableOpacity
                          style={[
                            styles.datePickerButton,
                            (qrDataType === "gym_membership" ||
                              qrDataType === "personal_training") &&
                              styles.disabledInput,
                          ]}
                          onPress={() => {
                            if (
                              !(
                                qrDataType === "gym_membership" ||
                                qrDataType === "personal_training"
                              )
                            ) {
                              setShowFeeCollectionDatePicker(true);
                              const validDate =
                                form.feeCollectionStartDate &&
                                form.feeCollectionStartDate instanceof Date &&
                                !isNaN(form.feeCollectionStartDate.getTime())
                                  ? form.feeCollectionStartDate
                                  : new Date();
                              setTempFeeCollectionDate(validDate);
                            }
                          }}
                          disabled={
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          }
                        >
                          <Text
                            style={[
                              styles.datePickerText,
                              (qrDataType === "gym_membership" ||
                                qrDataType === "personal_training") &&
                                styles.disabledText,
                              !form.feeCollectionStartDate &&
                                styles.placeholderText,
                            ]}
                          >
                            {form.feeCollectionStartDate
                              ? formatDateForDisplay(
                                  form.feeCollectionStartDate,
                                )
                              : "Select fee collection start date (Optional)"}
                          </Text>
                          <MaterialCommunityIcons
                            name="calendar"
                            size={20}
                            color="#666666"
                          />
                        </TouchableOpacity>
                        {form.feeCollectionStartDate && (
                          <TouchableOpacity
                            style={styles.resetDateButton}
                            onPress={() => {
                              handleInputChange("feeCollectionStartDate", null);
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
                    </View>

                    {Platform.OS === "ios" && (
                      <CustomIOSDatePicker
                        visible={showFeeCollectionDatePicker}
                        onClose={cancelFeeCollectionDateSelection}
                        onConfirm={(date) => {
                          handleInputChange("feeCollectionStartDate", date);
                          setShowFeeCollectionDatePicker(false);
                        }}
                        initialDate={form.feeCollectionStartDate}
                        title="Select Fee Collection Date"
                        maximumDate={new Date()}
                      />
                    )}

                    {Platform.OS === "android" &&
                      showFeeCollectionDatePicker && (
                        <DateTimePicker
                          testID="feeCollectionDateTimePicker"
                          value={form.feeCollectionStartDate || new Date()}
                          mode="date"
                          is24Hour={true}
                          display="default"
                          themeVariant="light"
                          textColor="#000000"
                          onChange={handleFeeCollectionDateChange}
                          maximumDate={new Date()}
                        />
                      )}

                    {/* New Expiry Date - Only show if not from QR */}
                    {!(
                      qrDataType === "gym_membership" ||
                      qrDataType === "personal_training"
                    ) && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date (Optional)</Text>
                        <View style={styles.datePickerWithReset}>
                          <TouchableOpacity
                            style={[styles.datePickerButton]}
                            onPress={() => {
                              setShowNewExpiryDatePicker(true);
                              const validDate =
                                form.newExpiryDate &&
                                form.newExpiryDate instanceof Date &&
                                !isNaN(form.newExpiryDate.getTime())
                                  ? form.newExpiryDate
                                  : new Date();
                              setTempNewExpiryDate(validDate);
                            }}
                          >
                            <Text
                              style={[
                                styles.datePickerText,
                                !form.newExpiryDate && styles.placeholderText,
                              ]}
                            >
                              {form.newExpiryDate
                                ? formatDateForDisplay(form.newExpiryDate)
                                : "Select expiry date (Optional)"}
                            </Text>
                            <MaterialCommunityIcons
                              name="calendar"
                              size={20}
                              color="#666666"
                            />
                          </TouchableOpacity>
                          {form.newExpiryDate && (
                            <TouchableOpacity
                              style={styles.resetDateButton}
                              onPress={() => {
                                handleInputChange("newExpiryDate", null);
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
                      </View>
                    )}

                    {Platform.OS === "ios" && (
                      <CustomIOSDatePicker
                        visible={showNewExpiryDatePicker}
                        onClose={cancelNewExpiryDateSelection}
                        onConfirm={(date) => {
                          handleInputChange("newExpiryDate", date);
                          setShowNewExpiryDatePicker(false);
                        }}
                        initialDate={form.newExpiryDate}
                        title="Select Expiry Date"
                      />
                    )}

                    {Platform.OS === "android" && showNewExpiryDatePicker && (
                      <DateTimePicker
                        testID="newExpiryDateTimePicker"
                        value={form.newExpiryDate || new Date()}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        themeVariant="light"
                        textColor="#000000"
                        onChange={handleNewExpiryDateChange}
                      />
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        One Time Admission Fees (Optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.admissionFee &&
                            errors.admissionFee &&
                            styles.errorInput,
                        ]}
                        placeholder="Enter Admission Fees(optional)"
                        placeholderTextColor="#a0a0a0"
                        keyboardType="numeric"
                        value={form.admissionFee}
                        onChangeText={(value) =>
                          handleInputChange("admissionFee", value)
                        }
                        onBlur={() => handleBlur("admissionFee")}
                      />
                      {touched.admissionFee && errors.admissionFee && (
                        <Text style={styles.errorText}>
                          {errors.admissionFee}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Admission Number (optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.admissionNumber &&
                            errors.admissionNumber &&
                            styles.errorInput,
                        ]}
                        placeholder="Enter Admission Number(Optional)"
                        placeholderTextColor="#a0a0a0"
                        value={form.admissionNumber}
                        onChangeText={(value) =>
                          handleInputChange("admissionNumber", value)
                        }
                        onBlur={() => handleBlur("admissionNumber")}
                      />
                      {touched.admissionNumber && errors.admissionNumber && (
                        <Text style={styles.errorText}>
                          {errors.admissionNumber}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Payment Method</Text>
                      <View
                        style={[
                          styles.pickerContainerWithIcon,
                          (qrDataType === "gym_membership" ||
                            qrDataType === "personal_training") &&
                            styles.disabledInput,
                        ]}
                      >
                        <RNPickerSelect
                          onValueChange={(value) =>
                            !(
                              qrDataType === "gym_membership" ||
                              qrDataType === "personal_training"
                            ) && handleInputChange("paymentMethod", value)
                          }
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          value={form.paymentMethod || ""}
                          style={pickerSelectStyles}
                          disabled={
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          }
                          placeholder={{
                            label: "Select Payment Method",
                            value: null,
                          }}
                          items={[
                            { label: "Cash", value: "cash" },
                            { label: "Card", value: "card" },
                            { label: "UPI", value: "upi" },
                            { label: "Bank Transfer", value: "bank_transfer" },
                            { label: "Cheque", value: "cheque" },
                          ]}
                          Icon={() => (
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={
                                qrDataType === "gym_membership" ||
                                qrDataType === "personal_training"
                                  ? "#999999"
                                  : "#666666"
                              }
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {touched.paymentMethod && errors.paymentMethod && (
                        <Text style={styles.errorText}>
                          {errors.paymentMethod}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Payment Reference Number (Optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          (qrDataType === "gym_membership" ||
                            qrDataType === "personal_training") &&
                            styles.disabledInput,
                          touched.paymentReferenceNumber &&
                            errors.paymentReferenceNumber &&
                            styles.errorInput,
                        ]}
                        placeholder="Enter reference number if applicable"
                        placeholderTextColor="#a0a0a0"
                        value={form.paymentReferenceNumber}
                        editable={
                          !(
                            qrDataType === "gym_membership" ||
                            qrDataType === "personal_training"
                          )
                        }
                        onChangeText={(value) =>
                          handleInputChange("paymentReferenceNumber", value)
                        }
                        onBlur={() => handleBlur("paymentReferenceNumber")}
                      />
                      {touched.paymentReferenceNumber &&
                        errors.paymentReferenceNumber && (
                          <Text style={styles.errorText}>
                            {errors.paymentReferenceNumber}
                          </Text>
                        )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !isStep2Valid && styles.disabledButton,
                    ]}
                    onPress={showConfirmationModal}
                    disabled={!isStep2Valid}
                  >
                    <LinearGradient
                      colors={
                        !isStep2Valid
                          ? ["#CCCCCC", "#CCCCCC"]
                          : ["#030A15", "#0154A0"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>
                        Submit Details
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {isQRScannerVisible && (
        <QRCodeScanner
          isVisible={isQRScannerVisible}
          onClose={() => setQRScannerVisible(false)}
          onCodeScanned={handleQRCodeScanned}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isConfirmationModalVisible}
        onRequestClose={() => setIsConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Please Verify Client Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{form.fullName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{form.contact}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{form.email}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth:</Text>
              <Text style={styles.detailValue}>
                {formatDateForDisplay(form.dateOfBirth)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>
                {calculateAge(form.dateOfBirth)} years
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Training Type:</Text>
              <Text style={styles.detailValue}>
                {plans.find((p) => p.id === form.trainingType)?.plans ||
                  "Not selected"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Batch:</Text>
              <Text style={styles.detailValue}>
                {batches.find((b) => b.id === form.batchType)?.batch_name ||
                  "Not selected"}
              </Text>
            </View>

            {form.feeCollectionStartDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fee Collection Start:</Text>
                <Text style={styles.detailValue}>
                  {formatDateForDisplay(form.feeCollectionStartDate)}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>
                {form.paymentMethod
                  ? form.paymentMethod.charAt(0).toUpperCase() +
                    form.paymentMethod.slice(1).replace("_", " ")
                  : "Not selected"}
              </Text>
            </View>

            {form.paymentReferenceNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference Number:</Text>
                <Text style={styles.detailValue}>
                  {form.paymentReferenceNumber}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsConfirmationModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={submitForm}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Different Gym Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDifferentGymAlert}
        onRequestClose={handleDifferentGymAlertOk}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={60}
                color="#FF3B30"
              />
            </View>

            <Text style={styles.alertTitle}>Different Gym</Text>

            <Text style={styles.alertMessage}>
              This client has purchased a plan from a different gym. You cannot
              add this client to your gym.
            </Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleDifferentGymAlertOk}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Daily Pass / Fitness Class QR Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDailyPassModeAlert}
        onRequestClose={() => setShowDailyPassModeAlert(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={60}
                color="#FF3B30"
              />
            </View>

            <Text style={styles.alertTitle}>Daily Pass / Fitness Class QR</Text>

            <Text style={styles.alertMessage}>
              This is a Daily Pass or Fitness Class QR code, not a Membership
              QR. Please use the Daily Pass / Fitness Class Scanner to scan
              this.
            </Text>

            <View style={{ width: "100%", gap: 10 }}>
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: "#007BFF" }]}
                onPress={() => {
                  setShowDailyPassModeAlert(false);
                  router.replace({
                    pathname: "/owner/home",
                    params: { openDailyPassScanner: "true" },
                  });
                }}
              >
                <Text style={styles.alertButtonText}>
                  Open Daily Pass Scanner
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  {
                    backgroundColor: "#F3F4F6",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  },
                ]}
                onPress={() => setShowDailyPassModeAlert(false)}
              >
                <Text style={[styles.alertButtonText, { color: "#374151" }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Plans/Batches Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showNoPlansBatchesAlert}
        onRequestClose={() => {
          setShowNoPlansBatchesAlert(false);
          router.push("/owner/home");
        }}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons
                name={
                  missingType === "both"
                    ? "account-clock"
                    : missingType === "plans"
                      ? "card-account-details"
                      : "clock-time-eight"
                }
                size={60}
                color="#FF5757"
              />
            </View>

            <Text style={[styles.alertTitle, { color: "#FF5757" }]}>
              {missingType === "both"
                ? "No Plans or Batches Found"
                : missingType === "plans"
                  ? "No Plans Found"
                  : "No Batches Found"}
            </Text>

            <Text style={styles.alertMessage}>
              {missingType === "both"
                ? "You need to add plans and batches initially to start adding clients in your gym."
                : missingType === "plans"
                  ? "You need to add plans to start adding clients in your gym."
                  : "You need to add batches to start adding clients in your gym."}
            </Text>

            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: "#FF5757" }]}
              onPress={() => {
                setShowNoPlansBatchesAlert(false);
                setTimeout(() => {
                  if (missingType === "both") {
                    router.push("/owner/manageplans");
                  } else if (missingType === "plans") {
                    router.push({
                      pathname: "/owner/manageplans",
                      params: { tab: "plans" },
                    });
                  } else {
                    router.push({
                      pathname: "/owner/manageplans",
                      params: { tab: "batches" },
                    });
                  }
                }, 200);
              }}
            >
              <Text style={styles.alertButtonText}>
                {missingType === "both"
                  ? "Add Plans and Batches"
                  : missingType === "plans"
                    ? "Add Plans"
                    : "Add Batches"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.alertButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: "#FF5757",
                  marginTop: 12,
                },
              ]}
              onPress={() => {
                setShowNoPlansBatchesAlert(false);
                setTimeout(() => {
                  router.push("/owner/home");
                }, 200);
              }}
            >
              <Text style={[styles.alertButtonText, { color: "#FF5757" }]}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation xpPoints={0} />}

      {/* Success Modal */}
      {/* Add Client Options Modal */}
      <Modal
        visible={showAddClientModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddClientModal(false);
          setSelectedRequest(null);
          setScannedQRData(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowAddClientModal(false);
            setSelectedRequest(null);
            setScannedQRData(null);
          }}
        >
          <View style={styles.addClientModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.addClientModalContent}>
                {/* Client Info */}
                <View style={styles.addClientModalHeader}>
                  <View style={styles.addClientModalIconContainer}>
                    {selectedRequest?.dp ||
                    scannedQRData?.response?.data?.dp ? (
                      <Image
                        source={{
                          uri:
                            selectedRequest?.dp ||
                            scannedQRData?.response?.data?.dp,
                        }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                      />
                    ) : (
                      <Ionicons name="person-add" size={40} color="#0078FF" />
                    )}
                  </View>
                  <Text style={styles.addClientModalTitle}>Add Client</Text>
                  <Text style={styles.addClientModalSubtitle}>
                    {selectedRequest?.name ||
                      scannedQRData?.response?.data?.full_name}
                  </Text>
                  <Text style={styles.addClientModalDescription}>
                    Choose how you'd like to add this client
                  </Text>
                </View>

                {/* Options */}
                <View style={styles.addClientOptionsContainer}>
                  {/* Quick Add Option */}
                  <TouchableOpacity
                    style={styles.addClientOptionButton}
                    onPress={handleQuickAdd}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addClientOptionIconContainer}>
                      <Ionicons name="flash" size={28} color="#FFFFFF" />
                    </View>
                    <View style={styles.addClientOptionTextContainer}>
                      <Text style={styles.addClientOptionTitle}>Quick Add</Text>
                      <Text style={styles.addClientOptionDescription}>
                        Just membership & payment info
                      </Text>
                    </View>
                    <View style={styles.addClientOptionChevron}>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Full Details Option */}
                  <TouchableOpacity
                    style={[
                      styles.addClientOptionButton,
                      styles.addClientOptionButtonSecondary,
                    ]}
                    onPress={handleFullDetails}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.addClientOptionIconContainer,
                        styles.addClientOptionIconSecondary,
                      ]}
                    >
                      <Ionicons
                        name="document-text"
                        size={28}
                        color="#0078FF"
                      />
                    </View>
                    <View style={styles.addClientOptionTextContainer}>
                      <Text
                        style={[
                          styles.addClientOptionTitle,
                          styles.addClientOptionTitleSecondary,
                        ]}
                      >
                        Full Details
                      </Text>
                      <Text
                        style={[
                          styles.addClientOptionDescription,
                          styles.addClientOptionDescriptionSecondary,
                        ]}
                      >
                        Add Discount, GST, Admission number & more.
                      </Text>
                    </View>
                    <View style={styles.addClientOptionChevron}>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#0078FF"
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.addClientModalCancelButton}
                  onPress={() => {
                    setShowAddClientModal(false);
                    setSelectedRequest(null);
                    setScannedQRData(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addClientModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>
              Client added successfully
            </Text>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
          <View style={styles.profileModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.profileModalContent}>
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.profileModalCloseButton}
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>

                {/* Profile Image */}
                <View style={styles.profileModalImageContainer}>
                  {selectedProfile?.dp ? (
                    <Image
                      source={{ uri: selectedProfile.dp }}
                      style={styles.profileModalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profileModalImagePlaceholder}>
                      <Text style={styles.profileModalInitial}>
                        {selectedProfile?.name?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* User Info */}
                <View style={styles.profileModalInfo}>
                  <Text style={styles.profileModalName}>
                    {selectedProfile?.name}
                  </Text>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                  style={styles.profileModalCallButton}
                  onPress={() => handleCall(selectedProfile?.mobile_number)}
                >
                  <Ionicons name="call" size={24} color="#007AFF" />
                  <Text style={styles.profileModalCallButtonText}>
                    Call {selectedProfile?.mobile_number}
                  </Text>
                </TouchableOpacity>

                {/* Alternate Number Call Button */}
                {selectedProfile?.alternate_mobile_number && (
                  <TouchableOpacity
                    style={[
                      styles.profileModalCallButton,
                      styles.profileModalCallButtonAlt,
                    ]}
                    onPress={() =>
                      handleCall(selectedProfile?.alternate_mobile_number)
                    }
                  >
                    <Ionicons name="call" size={24} color="#007AFF" />
                    <Text
                      style={[
                        styles.profileModalCallButtonText,
                        styles.profileModalCallButtonTextAlt,
                      ]}
                    >
                      Call {selectedProfile?.alternate_mobile_number}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  innerContainer: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
    backfaceVisibility: "hidden",
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.05,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
    textAlign: "center",
    marginVertical: height * 0.02,
  },
  qrInfoCard: {
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
    paddingBottom: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: "#D1E8FF",
  },
  qrInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 8,
  },
  qrInfoContent: {
    marginBottom: height * 0.015,
  },
  qrInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.008,
  },
  qrInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    marginRight: 8,
    minWidth: 50,
  },
  qrInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  qrInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F9ED",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: 8,
    marginTop: height * 0.01,
  },
  qrInfoBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#34C759",
    marginLeft: 6,
    flex: 1,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: height * 0.02,
  },
  inputGroup: {
    marginBottom: height * 0.02,
  },
  label: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666666",
    paddingLeft: 5,
    marginBottom: height * 0.01,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    fontSize: isTablet ? 16 : width * 0.04,
    color: "#2C3E50",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: isTablet ? 48 : undefined,
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#999999",
  },
  disabledText: {
    color: "#999999",
  },
  placeholderText: {
    color: "#a0a0a0",
  },
  errorInput: {
    borderColor: "#FF3B30",
  },
  highlightInput: {
    borderColor: "#FF5757",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 5,
  },
  datePickerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: isTablet ? 48 : undefined,
  },
  datePickerWithReset: {
    position: "relative",
  },
  resetDateButton: {
    position: "absolute",
    top: -15,
    right: -15,
    padding: 8,
    zIndex: 10,
  },
  datePickerText: {
    fontSize: isTablet ? 16 : width * 0.04,
    color: "#2C3E50",
    flex: 1,
  },
  ageText: {
    fontSize: isTablet ? 14 : width * 0.035,
    color: "#666666",
    fontWeight: "normal",
  },
  doubleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInputGroup: {
    width: "48%",
    marginBottom: 0,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minHeight: isTablet ? 48 : undefined,
  },
  inputWithSuffixField: {
    flex: 1,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    fontSize: isTablet ? 16 : width * 0.04,
    color: "#2C3E50",
  },
  suffix: {
    paddingRight: width * 0.04,
    fontSize: isTablet ? 14 : width * 0.035,
    color: "#666666",
  },
  submitButton: {
    borderRadius: 8,
    overflow: "hidden",
    width: "50%",
    alignSelf: "center",
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
  },
  submitButtonGradient: {
    paddingVertical: height * 0.018,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: isTablet ? 16 : width * 0.04,
    fontWeight: "600",
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  noFeedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubTitle: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 10,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  headerTitle: {
    color: "#2C3E50",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  mainScrollContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainScrollContent: {
    flexGrow: 1,
  },
  selectionContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    paddingBottom: 0,
  },
  pickerContainerWithIcon: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  pickerIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#666666",
    fontSize: 14,
  },
  detailValue: {
    color: "#2C3E50",
    fontSize: 14,
    maxWidth: "60%",
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#666666",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertModalContainer: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIconContainer: {
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  renewalInfoCard: {
    backgroundColor: "#E8F9ED",
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  renewalIconContainer: {
    marginBottom: height * 0.015,
  },
  renewalInfoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#34C759",
    marginBottom: height * 0.01,
    textAlign: "center",
  },
  renewalInfoSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  renewalGstRadioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingVertical: 8,
  },
  renewalGstRadioOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: "center",
  },
  renewalGstRadioOptionText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 6,
    textAlign: "center",
  },
  renewalSummaryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: width * 0.04,
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  renewalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  renewalSummaryLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  renewalSummaryValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  renewalSummaryTotal: {
    borderTopWidth: 2,
    borderTopColor: "#007AFF",
    marginTop: 8,
    paddingTop: 12,
  },
  renewalSummaryTotalLabel: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "700",
  },
  renewalSummaryTotalValue: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "700",
  },
  renewalSubmitButton: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  renewalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
    color: "#007AFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
    paddingVertical: 8,
  },
  radioOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 100,
  },
  radioOptionText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 6,
  },
  radioButton: {
    height: 15,
    width: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  gstRadioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingVertical: 8,
  },
  gstRadioOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: "center",
  },
  gstRadioOptionText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 6,
    textAlign: "center",
  },
  summaryContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  discountText: {
    color: "#28A745",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    marginTop: 8,
  },
  totalAmountInput: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    minWidth: 120,
    textAlign: "right",
  },
  instructionText: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 16,
  },
  feeCollectionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeCollectionButtonText: {
    fontSize: width * 0.04,
    color: "#2C3E50",
    flex: 1,
  },
  feeCollectionCards: {
    marginTop: 8,
  },
  feeCollectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  feeCollectionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 12,
  },
  selectedCardTitle: {
    color: "#007AFF",
  },
  feeCollectionCardDescription: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 8,
  },
  selectedCardDescription: {
    color: "#333333",
  },
  cardExample: {
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  exampleText: {
    fontSize: 11,
    color: "#666666",
    fontStyle: "italic",
  },
  // Plan Selection Styles
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
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 12,
  },
  planTypeRadioText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 0,
    fontWeight: "500",
  },
  planTypeRadioTextActive: {
    color: "#6366f1",
    fontWeight: "600",
  },
  planTypeRadioTextActivePT: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  planCategoryContainer: {
    marginBottom: 20,
  },
  planCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  planCategoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 8,
  },
  planCardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
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
  planCardDisabled: {
    opacity: 0.5,
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
  successModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Join Requests Styles
  joinRequestsContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 40,
  },
  joinRequestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  joinRequestsTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    height: 45,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 10,
  },
  requestCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 8,
  },
  requestLeftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  profileImagePlaceholder: {
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 14,
    fontWeight: "400",
    color: "#767676",
    marginBottom: 3,
  },
  requestMobile: {
    fontSize: 13,
    color: "#767676",
    marginBottom: 1,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "rgba(266,66,66,0.3)",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButtonText: {
    color: "#E64242",
    fontSize: 13,
    fontWeight: "500",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  profileModalCloseButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  profileModalImageContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  profileModalImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  profileModalImagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  profileModalInitial: {
    fontSize: 64,
    fontWeight: "700",
    color: "#666",
  },
  profileModalInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  profileModalMobile: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  profileModalCallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    marginBottom: 12,
    borderColor: "#007AFF",
    borderWidth: 1,
    gap: 8,
  },
  profileModalCallButtonAlt: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  profileModalCallButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  profileModalCallButtonTextAlt: {
    color: "#007AFF",
  },
  // Add Client Modal Styles
  addClientModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },
  addClientModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  addClientModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  addClientModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addClientModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  addClientModalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0078FF",
    marginBottom: 8,
  },
  addClientModalDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  addClientOptionsContainer: {
    marginBottom: 20,
  },
  addClientOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0078FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addClientOptionButtonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  addClientOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  addClientOptionIconSecondary: {
    backgroundColor: "#E6F2FF",
  },
  addClientOptionTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  addClientOptionChevron: {
    justifyContent: "center",
    alignItems: "center",
  },
  addClientOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  addClientOptionDescription: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  addClientOptionTitleSecondary: {
    color: "#1F2937",
  },
  addClientOptionDescriptionSecondary: {
    color: "#6B7280",
  },
  addClientModalCancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 10,
  },
  addClientModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: isTablet ? 16 : 14,
    paddingVertical: isTablet ? 16 : 15,
    paddingHorizontal: 15,
    borderWidth: 0,
    borderRadius: 8,
    color: "#2C3E50",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: isTablet ? 48 : 45,
  },
  inputAndroid: {
    fontSize: isTablet ? 16 : 14,
    paddingHorizontal: 15,
    paddingVertical: isTablet ? 14 : 12,
    borderWidth: 0,
    borderRadius: 8,
    color: "#2C3E50",
    paddingRight: 40,
    backgroundColor: "transparent",
    minHeight: isTablet ? 48 : undefined,
  },
  placeholder: {
    color: "#a0a0a0",
    fontSize: isTablet ? 16 : 14,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? (isTablet ? 16 : 15) : isTablet ? 14 : 12,
    right: 15,
  },
});

export default AddClientScreen;
