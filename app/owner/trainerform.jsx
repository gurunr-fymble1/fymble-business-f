import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  SafeAreaView,
  Modal,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomTimePicker from "../../components/ui/CustomTimePicker";
import {
  addTrainerAPI,
  updateTrainerAPI,
  getTrainersAPI,
  deleteTrainerAPI,
} from "../../services/Api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import TrainersSkeleton from "../../components/ui/loaders/trainersSkeleton";
import TrainerFormSkeleton from "../../components/ui/loaders/TrainerFormSkeleton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { showToast } from "../../utils/Toaster";
import NoDataComponent from "../../utils/noDataComponent";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import axiosInstance from "../../services/axiosInstance";
import TrainerAttendanceModal from "../../components/trainer/TrainerAttendanceModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 786;
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const SPECIALIZATIONS = [
  "Fitness Training",
  "CrossFit Training",
  "Weight Loss",
  "Muscle Building",
  "Cardio Training",
  "Strength Training",
  "Yoga",
  "Pilates",
  "Functional Training",
  "HIIT Training",
  "Boxing",
  "Martial Arts",
  "Sports Training",
  "Rehabilitation",
  "Nutrition Coaching",
  "Dance Fitness",
];

const AddTrainerScreen = () => {
  const [form, setForm] = useState({
    id: null,
    fullName: "",
    gender: "Male",
    contact: "",
    email: "",
    specializations: [],
    experience: "",
    certifications: "",
    workTimings: [],
    profileImage: null,
    canViewClientData: false,
    personalTrainer: true,
  });

  const router = useRouter();
  const { tab, from } = useLocalSearchParams();
  const [showTrainersList, setShowTrainersList] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    tab === "add_trainer" ? "add_trainer" : "view_trainers",
  );
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [optionsPosition, setOptionsPosition] = useState({ top: 0, right: 0 });
  const [imageUploadModalVisible, setImageUploadModalVisible] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [editingTimeIndex, setEditingTimeIndex] = useState(-1);

  // Specialization modal states
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);

  // Trainer attendance modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedTrainerForAttendance, setSelectedTrainerForAttendance] =
    useState(null);
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const role = await getToken("role");
      setUserRole(role);

      if (role === "trainer") {
        setActiveTab("view_trainers");
      }

      await fetchTrainers();
    } catch (error) {
      console.error("Error initializing screen:", error);
      showToast({
        type: "error",
        title: "Error initializing screen",
      });
    }
  };

  const fetchTrainers = async () => {
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
      const response = await getTrainersAPI(gymId);
      if (response?.status === 200) {
        setTrainers(response.data.trainers);
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
        title: "Error fetching trainers",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (imageAsset) => {
    if (imageAsset && imageAsset.uri) {
      setImageUploading(true);
      try {
        const imageUri = imageAsset.uri;
        const uriParts = imageUri?.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileNameParts = fileName.split(".");
        const extension =
          fileNameParts.length > 1
            ? fileNameParts[fileNameParts.length - 1]
            : "";

        const gym_id = await getToken("gym_id");
        if (!gym_id) {
          showToast({
            type: "error",
            title: "Gym ID not found",
          });
          return;
        }

        showToast({
          type: "info",
          title: "Uploading image...",
        });

        const { data: uploadResp } = await axiosInstance.get(
          "/trainers/upload-url",
          {
            params: {
              gym_id: gym_id,
              extension: extension,
              scope: "profile_image",
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
            title: "Failed to upload image. Please try again.",
          });
          return;
        }

        const res = await axiosInstance.post("/trainers/confirm", {
          cdn_url,
          gym_id: gym_id,
          scope: "profile_image",
        });

        if (res?.status === 200) {
          handleInputChange("profileImage", cdn_url);
          showToast({
            type: "success",
            title: "Image uploaded successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Failed to confirm upload. Please try again.",
          });
        }
      } catch (error) {
        console.error("Image upload error:", error);

        let errorMessage = "Failed to upload image. Please try again.";

        if (error.response) {
          errorMessage =
            error.response.data?.detail ||
            error.response.data?.message ||
            errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }

        showToast({
          type: "error",
          title: errorMessage,
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const showImagePickerOptions = () => {
    if (imageUploading) {
      showToast({
        type: "info",
        title: "Please wait for current upload to complete",
      });
      return;
    }
    setImageUploadModalVisible(true);
  };

  const removeImage = () => {
    if (imageUploading) {
      showToast({
        type: "info",
        title: "Cannot remove image while uploading",
      });
      return;
    }

    Alert.alert(
      "Remove Picture",
      "Are you sure you want to remove the profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleInputChange("profileImage", null),
        },
      ],
    );
  };

  const handleOptionsPress = (item, event) => {
    if (userRole === "trainer") {
      return;
    }

    setSelectedItemForOptions(item);
    const { pageX, pageY } = event.nativeEvent;

    setOptionsPosition({
      top: pageY + 20,
      right: 50,
    });

    setOptionsVisible(true);
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // Time formatting function
  const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Add work timing
  const addWorkTiming = () => {
    const newTiming = {
      startTime: formatTime(tempStartTime),
      endTime: formatTime(tempEndTime),
      id: Date.now(),
    };

    if (editingTimeIndex >= 0) {
      const updatedTimings = [...form.workTimings];
      updatedTimings[editingTimeIndex] = newTiming;
      setForm({ ...form, workTimings: updatedTimings });
      setEditingTimeIndex(-1);
    } else {
      setForm({ ...form, workTimings: [...form.workTimings, newTiming] });
    }

    setTempStartTime(new Date());
    setTempEndTime(new Date());
  };

  // Remove work timing
  const removeWorkTiming = (index) => {
    const updatedTimings = form.workTimings.filter((_, i) => i !== index);
    setForm({ ...form, workTimings: updatedTimings });
  };

  // Edit work timing
  const editWorkTiming = (index) => {
    const timing = form.workTimings[index];
    const startTime = new Date();
    const endTime = new Date();

    // Parse time strings back to Date objects
    const [startHour, startMinute, startPeriod] = timing.startTime
      .replace(/:/g, " ")
      .split(" ");
    const [endHour, endMinute, endPeriod] = timing.endTime
      .replace(/:/g, " ")
      .split(" ");

    startTime.setHours(
      startPeriod === "PM" && startHour !== "12"
        ? parseInt(startHour) + 12
        : startPeriod === "AM" && startHour === "12"
          ? 0
          : parseInt(startHour),
      parseInt(startMinute),
    );

    endTime.setHours(
      endPeriod === "PM" && endHour !== "12"
        ? parseInt(endHour) + 12
        : endPeriod === "AM" && endHour === "12"
          ? 0
          : parseInt(endHour),
      parseInt(endMinute),
    );

    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setEditingTimeIndex(index);
  };

  // Time picker handlers
  const handleStartTimeChange = (selectedTime) => {
    if (selectedTime) {
      // Convert ISO string to Date object if needed
      const timeDate =
        typeof selectedTime === "string"
          ? new Date(selectedTime)
          : selectedTime;
      setTempStartTime(timeDate);
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (selectedTime) => {
    if (selectedTime) {
      // Convert ISO string to Date object if needed
      const timeDate =
        typeof selectedTime === "string"
          ? new Date(selectedTime)
          : selectedTime;
      setTempEndTime(timeDate);
    }
    setShowEndTimePicker(false);
  };

  // Specialization handlers
  const toggleSpecialization = (specialization) => {
    const currentSpecializations = form.specializations;
    if (currentSpecializations.includes(specialization)) {
      setForm({
        ...form,
        specializations: currentSpecializations.filter(
          (s) => s !== specialization,
        ),
      });
    } else {
      setForm({
        ...form,
        specializations: [...currentSpecializations, specialization],
      });
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      fullName: "",
      gender: "Male",
      contact: "",
      email: "",
      specializations: [],
      experience: "",
      certifications: "",
      workTimings: [],
      profileImage: null,
      canViewClientData: false,
      personalTrainer: false,
    });
    setIsEditing(false);
    setActiveTab("view_trainers");
    setEditingTimeIndex(-1);
    setTempStartTime(new Date());
    setTempEndTime(new Date());
  };

  const handleEdit = (trainer) => {
    setForm({
      trainer_id: trainer.trainer_id,
      fullName: trainer.full_name,
      gender: trainer.gender,
      contact: trainer.contact,
      email: trainer.email,
      specializations:
        trainer.specializations ||
        (trainer.specialization
          ? trainer.specialization.split(",").map((s) => s.trim())
          : []),
      experience: trainer?.experience?.toString() || 0,
      certifications: trainer.certifications,
      workTimings: trainer.work_timings || [],
      profileImage: trainer.profile_image,
      canViewClientData: trainer.can_view_client_data || false,
      personalTrainer: trainer.personal_trainer || false,
    });
    setIsEditing(true);
    setShowTrainersList(false);
  };

  const handleDelete = async (trainerId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this trainer?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const gym_id = await getToken("gym_id");

              if (!gym_id) {
                showToast({
                  type: "error",
                  title: "Gym Id is not there",
                });
                return;
              }
              const response = await deleteTrainerAPI(trainerId, gym_id);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Trainer deleted successfully!",
                });
                setShowTrainersList(false);
                fetchTrainers();
              } else {
                showToast({
                  type: "error",
                  title: "Failed to delete trainer.",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "An error occurred while deleting trainer.",
              });
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const submitForm = async () => {
    if (!form.fullName || !form.contact || form.specializations.length === 0) {
      showToast({
        type: "error",
        title:
          "Please fill all mandatory fields and select at least one specialization.",
      });
      return;
    }

    if (imageUploading) {
      showToast({
        type: "info",
        title: "Please wait for image upload to complete.",
      });
      return;
    }

    try {
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym Id is not there",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        full_name: form.fullName,
        gender: form.gender,
        contact: form.contact,
        email: form.email,
        specializations: form.specializations,
        experience: form.experience || 0,
        certifications: form.certifications,
        work_timings: form.workTimings,
        profile_image: form.profileImage,
        can_view_client_data: form.canViewClientData,
        personal_trainer: form.personalTrainer,
        trainer_id: form.trainer_id,
      };

      const response = isEditing
        ? await updateTrainerAPI(payload)
        : await addTrainerAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditing
            ? "Trainer updated successfully!"
            : "Trainer added successfully!",
        });

        resetForm();
        Keyboard.dismiss();
        await fetchTrainers();
        setActiveTab("view_trainers");
      } else {
        let errorMessage = "Failed to save trainer";
        if (response?.detail) {
          errorMessage = response.detail;
        } else if (!isEditing) {
          errorMessage = "Failed to add trainer";
        } else {
          errorMessage = "Failed to update trainer";
        }
        showToast({
          type: "error",
          title: errorMessage,
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);

      let errorMessage = "An error occurred";

      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const handleEditPress = (item) => {
    setOptionsVisible(false);
    handleEdit(item);
    setActiveTab("add_trainer");
  };

  const handleDeletePress = (item) => {
    setOptionsVisible(false);
    handleDelete(item.trainer_id);
  };

  const handleTrainerCardPress = (trainer) => {
    if (userRole === "owner") {
      setSelectedTrainerForAttendance(trainer);
      setShowAttendanceModal(true);
    }
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedTrainerForAttendance(null);
  };

  const renderOptionsDropdown = () => {
    if (!optionsVisible || userRole === "trainer") {
      return null;
    }

    return (
      <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
        <View style={styles.optionsOverlay}>
          <View
            style={[
              styles.optionsContainer,
              {
                position: "absolute",
                top: optionsPosition.top,
                right: optionsPosition.right,
                zIndex: 1001,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleEditPress(selectedItemForOptions)}
            >
              <MaterialIcons name="edit" size={18} color="#333" />
              <Text style={styles.optionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleDeletePress(selectedItemForOptions)}
            >
              <MaterialIcons name="delete" size={18} color="#FF5757" />
              <Text style={[styles.optionText, { color: "#FF5757" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const TrainerListModal = ({ item }) => {
    if (isLoading) {
      return <TrainersSkeleton />;
    }

    return (
      <ScrollView
        style={styles.innerContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {trainers.length ? (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {trainers?.map((trainer) => (
                <View
                  key={trainer.trainer_id}
                  style={[
                    styles.trainerCard,
                    userRole === "owner" && styles.clickableTrainerCard,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleTrainerCardPress(trainer)}
                    activeOpacity={userRole === "owner" ? 0.7 : 1}
                    disabled={userRole !== "owner"}
                  >
                    {/* Personal Trainer Badge */}
                    {trainer.personal_trainer && (
                      <View style={styles.ribbonContainer}>
                        <View style={styles.ribbon}>
                          <Ionicons
                            name="fitness-outline"
                            size={12}
                            color="#FFFFFF"
                          />
                          <Text style={styles.ribbonText}>
                            Personal Trainer
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <TouchableOpacity
                        style={styles.trainerImageContainer}
                        onPress={(event) => {
                          event.stopPropagation();
                          if (trainer.profile_image) {
                            setSelectedImage(trainer.profile_image);
                            setFullImageModalVisible(true);
                          }
                        }}
                      >
                        {trainer.profile_image ? (
                          <Image
                            source={{ uri: trainer.profile_image }}
                            style={styles.trainerImage}
                          />
                        ) : (
                          <View style={styles.trainerImagePlaceholder}>
                            <Text style={styles.trainerInitials}>
                              {trainer.full_name.charAt(0)}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.trainerName}>
                          {trainer.full_name}
                        </Text>
                        <Text style={styles.trainerExperience}>
                          {trainer.experience || 0}{" "}
                          {(trainer.experience || 0) === 1 ? "year" : "years"}{" "}
                          experience
                        </Text>
                        {trainer.can_view_client_data && (
                          <View style={styles.clientAccessBadge}>
                            <Ionicons
                              name="eye-outline"
                              size={11}
                              color="#2196F3"
                            />
                            <Text style={styles.clientAccessText}>
                              Client Data Access
                            </Text>
                          </View>
                        )}
                      </View>

                      {userRole !== "trainer" && (
                        <TouchableOpacity
                          style={styles.optionsButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            handleOptionsPress(trainer, event);
                          }}
                        >
                          <Ionicons
                            size={20}
                            name="ellipsis-vertical"
                            color="#666666"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Work Timings */}
                    {Array.isArray(trainer.work_timings) &&
                      trainer.work_timings.length > 0 && (
                        <View style={styles.timingsSection}>
                          <Text style={styles.timingsTitle}>Timings</Text>
                          <View style={styles.timingsChipsContainer}>
                            {trainer.work_timings.map((timing, index) => (
                              <View key={index} style={styles.timingChip}>
                                <Text style={styles.timingChipText}>
                                  {timing.startTime} - {timing.endTime}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                  </TouchableOpacity>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.specializationScrollView}
                    contentContainerStyle={styles.specializationContainer}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                  >
                    {Array.isArray(trainer.specializations) &&
                    trainer.specializations.length > 0
                      ? trainer.specializations.map((spec, index) => (
                          <View key={index} style={styles.specializationTag}>
                            <Text style={styles.specializationText}>
                              {spec.trim()}
                            </Text>
                          </View>
                        ))
                      : trainer.specializations
                          ?.split(",")
                          .map((spec, index) => (
                            <View key={index} style={styles.specializationTag}>
                              <Text style={styles.specializationText}>
                                {spec.trim()}
                              </Text>
                            </View>
                          ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 50 }}>
            <NoDataComponent
              icon={"people"}
              title={"No Trainers Available"}
              message="Looks like there is no data here yet."
              buttonText={userRole !== "trainer" ? "Add Trainer" : null}
              onButtonPress={
                userRole !== "trainer"
                  ? () => setActiveTab("add_trainer")
                  : null
              }
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const ImageUploadModal = ({
    isVisible,
    onClose,
    onImageSelect,
    title,
    aspectRatio = [1, 1],
  }) => {
    const selectImage = async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          showToast({
            type: "error",
            title:
              "Please allow access to your photo library to upload images.",
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
              <TouchableOpacity
                style={[
                  styles.uploadOption,
                  imageUploading && styles.disabledOption,
                ]}
                onPress={selectImage}
                disabled={imageUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="images-outline" size={24} color="#3498db" />
                </View>
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                {imageUploading && (
                  <ActivityIndicator size="small" color="#3498db" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadOption,
                  imageUploading && styles.disabledOption,
                ]}
                onPress={takePhoto}
                disabled={imageUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="camera-outline" size={24} color="#3498db" />
                </View>
                <Text style={styles.uploadOptionText}>Take Photo</Text>
                {imageUploading && (
                  <ActivityIndicator size="small" color="#3498db" />
                )}
              </TouchableOpacity>
            </View>

            {imageUploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.uploadingText}>Uploading image...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Filter tabs based on user role
  const getFilteredTabs = () => {
    const baseTabs = [
      { id: "view_trainers", label: "View Trainers", icon: "" },
      {
        id: "add_trainer",
        label: isEditing ? "Update Trainer Details" : "Add Trainer",
        icon: "",
      },
    ];

    return baseTabs;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"Manage Trainers"}
        />
        {userRole !== "trainer" && (
          <View style={styles.customTabContainer}>
            <TouchableOpacity
              style={[
                styles.customTab,
                activeTab === "view_trainers" && styles.customTabActive,
              ]}
              onPress={() => setActiveTab("view_trainers")}
            >
              <Text
                style={[
                  styles.customTabText,
                  activeTab === "view_trainers" && styles.customTabTextActive,
                ]}
              >
                View Trainers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.customTab,
                activeTab === "add_trainer" && styles.customTabActive,
              ]}
              onPress={() => setActiveTab("add_trainer")}
            >
              <Text
                style={[
                  styles.customTabText,
                  activeTab === "add_trainer" && styles.customTabTextActive,
                ]}
              >
                Add Trainer
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === "add_trainer" ? (
          <TrainerFormSkeleton />
        ) : (
          <TrainersSkeleton />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath={from === "pt_setup" ? "/owner/createPlans" : "/owner/home"}
        params={from === "pt_setup" ? { tab: "pt" } : {}}
        enabled={true}
      />
      <NewOwnerHeader
        onBackButtonPress={() =>
          from === "pt_setup"
            ? router.push({
                pathname: "/owner/createPlans",
                params: { tab: "pt" },
              })
            : router.push("/owner/home")
        }
        text={"Manage Trainers"}
      />
      {userRole !== "trainer" && (
        <View style={styles.customTabContainer}>
          <TouchableOpacity
            style={[
              styles.customTab,
              activeTab === "view_trainers" && styles.customTabActive,
            ]}
            onPress={() => {
              if (isEditing) {
                resetForm();
              }
              setActiveTab("view_trainers");
            }}
          >
            <Text
              style={[
                styles.customTabText,
                activeTab === "view_trainers" && styles.customTabTextActive,
              ]}
            >
              View Trainers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.customTab,
              activeTab === "add_trainer" && styles.customTabActive,
            ]}
            onPress={() => setActiveTab("add_trainer")}
          >
            <Text
              style={[
                styles.customTabText,
                activeTab === "add_trainer" && styles.customTabTextActive,
              ]}
            >
              {isEditing ? "Update Trainer Details" : "Add Trainer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "view_trainers" && <TrainerListModal />}

      {activeTab === "add_trainer" && userRole !== "trainer" && (
        <ScrollView
          style={styles.innerContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Picture (Optional)</Text>
              <View style={styles.imageContainer}>
                {form.profileImage ? (
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: form.profileImage }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                    {!imageUploading && (
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeImage}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF5757"
                        />
                      </TouchableOpacity>
                    )}
                    {imageUploading && (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.uploadOverlayText}>
                          Uploading...
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.imagePlaceholderContainer,
                      imageUploading && styles.disabledPlaceholder,
                    ]}
                    onPress={showImagePickerOptions}
                    disabled={imageUploading}
                  >
                    {imageUploading ? (
                      <>
                        <ActivityIndicator size={30} color="#007AFF" />
                        <Text style={styles.imagePlaceholder}>
                          Uploading image...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="camera" size={30} color="#A0A0A0" />
                        <Text style={styles.imagePlaceholder}>
                          Tap to add profile picture
                        </Text>
                        <Text style={styles.imageAspectText}>
                          (1:1 ratio recommended)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {form.profileImage && !imageUploading && (
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={showImagePickerOptions}
                  >
                    <Ionicons name="camera" size={16} color="#007AFF" />
                    <Text style={styles.changeImageText}>Change Picture</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#a0a0a0"
                value={form.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender*</Text>
              <View style={styles.radioGroup}>
                {["Male", "Female", "Other"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioButton,
                      form.gender === option && styles.radioSelected,
                    ]}
                    onPress={() => handleInputChange("gender", option)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        form.gender === option && styles.radioTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                placeholderTextColor="#a0a0a0"
                keyboardType="phone-pad"
                value={form.contact}
                onChangeText={(value) => handleInputChange("contact", value)}
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#a0a0a0"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(value) => handleInputChange("email", value)}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specializations*</Text>
              <TouchableOpacity
                style={styles.specializationSelector}
                onPress={() => setShowSpecializationModal(true)}
              >
                <Text
                  style={[
                    styles.specializationSelectorText,
                    form.specializations.length === 0 && styles.placeholderText,
                  ]}
                >
                  {form.specializations.length > 0
                    ? `${form.specializations.length} specialization(s) selected`
                    : "Select specializations"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>

              {form.specializations.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectedSpecializationsScroll}
                  contentContainerStyle={
                    styles.selectedSpecializationsContainer
                  }
                >
                  {form.specializations.map((spec, index) => (
                    <View key={index} style={styles.selectedSpecTag}>
                      <Text style={styles.selectedSpecText}>{spec}</Text>
                      <TouchableOpacity
                        onPress={() => toggleSpecialization(spec)}
                        style={styles.removeSpecButton}
                      >
                        <Ionicons name="close" size={14} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Work Timings</Text>
              <Text style={styles.timingsHelpText}>
                Select start and end time, then tap Add
              </Text>

              {/* Time Pickers */}
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerGroup}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color="#007AFF" />
                    <Text style={styles.timePickerText}>
                      {formatTime(tempStartTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timePickerGroup}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color="#007AFF" />
                    <Text style={styles.timePickerText}>
                      {formatTime(tempEndTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addTimingButton}
                onPress={addWorkTiming}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addTimingText}>
                  {editingTimeIndex >= 0 ? "Update Timing" : "Add Timing"}
                </Text>
              </TouchableOpacity>

              {/* Added Timings List */}
              {form.workTimings.length > 0 && (
                <View style={styles.timingsList}>
                  {form.workTimings.map((timing, index) => (
                    <View key={timing.id || index} style={styles.timingItem}>
                      <Ionicons name="time-outline" size={14} color="#666666" />
                      <Text style={styles.timingText}>
                        {timing.startTime} - {timing.endTime}
                      </Text>
                      <View style={styles.timingActions}>
                        <TouchableOpacity
                          onPress={() => editWorkTiming(index)}
                          style={styles.timingActionButton}
                        >
                          <Ionicons name="pencil" size={14} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeWorkTiming(index)}
                          style={styles.timingActionButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color="#FF5757"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience (in years)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter years of experience"
                placeholderTextColor="#a0a0a0"
                keyboardType="phone-pad"
                maxLength={2}
                value={form.experience}
                onChangeText={(value) => handleInputChange("experience", value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Certifications</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter certifications"
                placeholderTextColor="#a0a0a0"
                value={form.certifications}
                onChangeText={(value) =>
                  handleInputChange("certifications", value)
                }
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Client Data Access</Text>
                  <Text style={styles.switchDescription}>
                    Allow this trainer to view client workout status and
                    progress for this gym
                  </Text>
                </View>
                <Switch
                  value={form.canViewClientData}
                  onValueChange={(value) =>
                    handleInputChange("canViewClientData", value)
                  }
                  trackColor={{ false: "#D0D0D0", true: "#007AFF" }}
                  thumbColor={form.canViewClientData ? "#FFFFFF" : "#F4F3F4"}
                />
              </View>
            </View>
          </View>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Personal Trainer</Text>
                  <Text style={styles.switchDescription}>
                    Mark this trainer as a personal trainer for clients
                  </Text>
                </View>
                <Switch
                  value={form.personalTrainer}
                  onValueChange={(value) =>
                    handleInputChange("personalTrainer", value)
                  }
                  trackColor={{ false: "#D0D0D0", true: "#007AFF" }}
                  thumbColor={form.personalTrainer ? "#FFFFFF" : "#F4F3F4"}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isEditing && styles.updateButton,
                imageUploading && styles.disabledButton,
              ]}
              onPress={submitForm}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing
                    ? "Update Trainer Details"
                    : "Submit Trainer Details"}
                </Text>
              )}
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  imageUploading && styles.disabledButton,
                ]}
                onPress={resetForm}
                disabled={imageUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {renderOptionsDropdown()}

      <ImageUploadModal
        isVisible={imageUploadModalVisible}
        onClose={() => setImageUploadModalVisible(false)}
        onImageSelect={handleImageSelect}
        title="Select Profile Picture"
        aspectRatio={[1, 1]}
      />

      {/* Custom Time Pickers */}
      <CustomTimePicker
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onConfirm={handleStartTimeChange}
        initialTime={tempStartTime}
      />
      <CustomTimePicker
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        onConfirm={handleEndTimeChange}
        initialTime={tempEndTime}
      />

      {/* Specialization Selection Modal */}
      <Modal
        visible={showSpecializationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpecializationModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowSpecializationModal(false)}
        >
          <View style={styles.specializationModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.specializationModalContainer}>
                <View style={styles.specializationModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowSpecializationModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.specializationModalTitle}>
                    Select Specializations
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowSpecializationModal(false)}
                  >
                    <Text style={styles.specializationModalDone}>Done</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.specializationModalContent}>
                  {SPECIALIZATIONS.map((specialization) => (
                    <TouchableOpacity
                      key={specialization}
                      style={styles.specializationOption}
                      onPress={() => toggleSpecialization(specialization)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          form.specializations.includes(specialization) &&
                            styles.checkedBox,
                        ]}
                      >
                        {form.specializations.includes(specialization) && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text style={styles.specializationOptionText}>
                        {specialization}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Trainer Attendance Modal */}
      <TrainerAttendanceModal
        visible={showAttendanceModal}
        onClose={handleCloseAttendanceModal}
        trainer={selectedTrainerForAttendance}
      />

      {/* Full Image Modal */}
      <Modal
        visible={fullImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setFullImageModalVisible(false)}
        >
          <View style={styles.fullImageModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.fullImageContainer}>
                <TouchableOpacity
                  style={styles.fullImageCloseButton}
                  onPress={() => setFullImageModalVisible(false)}
                >
                  <Ionicons name="close-circle" size={32} color="#FFFFFF" />
                </TouchableOpacity>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
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
    backgroundColor: "#FFFFFF",
  },
  innerContainer: {
    flex: 1,
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
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    marginTop: 15,
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
  imageContainer: {
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: height * 0.01,
  },
  profileImage: {
    width: width * 0.6,
    height: width * 0.6 * (9 / 16),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadOverlayText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholderContainer: {
    width: width * 0.5,
    height: width * 0.5 * (1 / 1),
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D0D0D0",
    marginBottom: height * 0.01,
  },
  disabledPlaceholder: {
    backgroundColor: "#F0F0F0",
    borderColor: "#C0C0C0",
  },
  imagePlaceholder: {
    color: "#A0A0A0",
    textAlign: "center",
    fontSize: width * 0.035,
    marginTop: 8,
    fontWeight: "500",
  },
  imageAspectText: {
    color: "#C0C0C0",
    textAlign: "center",
    fontSize: width * 0.03,
    marginTop: 4,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  changeImageText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: width * 0.01,
    borderRadius: 10,
    backgroundColor: "#F1F4F8",
    marginHorizontal: width * 0.01,
    alignItems: "center",
  },
  radioSelected: {
    backgroundColor: "#007AFF",
  },
  radioText: {
    color: "#2C3E50",
    fontSize: 16,
  },
  radioTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#F1F4F8",
    borderRadius: 10,
  },
  pickerContainerWithIcon: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minHeight: isTablet ? 48 : undefined,
  },
  picker: {
    height: height * 0.07,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 16,
  },
  permissionBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  trainerPermissions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  permissionText: {
    fontSize: 10,
    color: "#007AFF",
    marginLeft: 4,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0.1,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  headerContainer: {
    paddingHorizontal: width * 0.05,
    marginVertical: height * 0.02,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-end",
  },
  viewAllButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  modalContent: {
    width: width * 0.9,
    height: "auto",
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#FF5757",
  },
  closeButton: {
    padding: 5,
  },
  trainersList: {
    flex: 1,
  },
  trainerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  clickableTrainerCard: {
    borderWidth: 1,
    borderColor: "rgba(123, 44, 191, 0.2)",
    shadowColor: "#7b2cbf",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trainerImageContainer: {
    position: "relative",
  },
  trainerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  trainerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  trainerInitials: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  trainerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },

  // Ribbon styles
  ribbonContainer: {
    position: "absolute",
    top: -18,
    right: -18,
    zIndex: 1,
  },
  ribbon: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  ribbonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },
  trainerExperience: {
    fontSize: 12,
    color: "#666",
  },
  optionsButton: {
    padding: 4,
  },
  clientAccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  clientAccessText: {
    fontSize: 10,
    color: "#2196F3",
    fontWeight: "500",
  },
  timingsSection: {
    marginBottom: 8,
  },
  timingsTitle: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  timingsChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specializationContainer: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
    // marginTop: 8,
  },
  specializationTag: {
    backgroundColor: "#ffffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  specializationText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },
  personalTrainerTag: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
  },
  personalTrainerText: {
    color: "#4CAF50",
  },
  trainerSpecialization: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  trainerContact: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: height * 0.015,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: 6,
    marginLeft: width * 0.02,
  },
  actionButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#E74C3C",
  },
  updateButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#95A5A6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: height * 0.02,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: height * 0.02,
  },

  optionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  optionsContainer: {
    width: responsiveWidth(35),
    backgroundColor: "#FFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(3),
  },
  optionText: {
    fontSize: responsiveFontSize(14),
    color: "#333",
    marginLeft: responsiveWidth(2),
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    width: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageUploadModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: width * 0.85,
    maxWidth: 400,
  },
  passwordModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  uploadOptionsContainer: {
    gap: 15,
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  disabledOption: {
    backgroundColor: "#F0F0F0",
    borderColor: "#D0D0D0",
    opacity: 0.6,
  },
  uploadOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    flex: 1,
  },
  uploadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    marginTop: 15,
  },
  uploadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    fontWeight: "500",
  },

  // Specialization styles
  specializationSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  specializationSelectorText: {
    fontSize: 14,
    color: "#2C3E50",
    flex: 1,
  },
  placeholderText: {
    color: "#a0a0a0",
  },
  selectedSpecializationsScroll: {
    marginTop: 10,
  },
  selectedSpecializationsContainer: {
    paddingRight: 10,
  },
  selectedSpecTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
    marginRight: 8,
  },
  selectedSpecText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
    marginRight: 6,
  },
  removeSpecButton: {
    padding: 2,
  },

  // Time picker styles
  timingsHelpText: {
    fontSize: 11,
    color: "#999",
    marginBottom: 12,
    fontStyle: "italic",
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  timePickerGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 6,
    minHeight: isTablet ? 48 : undefined,
  },
  timePickerText: {
    fontSize: isTablet ? 16 : 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  addTimingButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  addTimingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  timingsList: {
    marginTop: 10,
    gap: 8,
  },
  timingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  timingText: {
    flex: 1,
    fontSize: 12,
    color: "#333",
    marginLeft: 8,
  },
  timingActions: {
    flexDirection: "row",
    gap: 8,
  },
  timingActionButton: {
    padding: 4,
  },

  // Modal styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerModalCancel: {
    fontSize: 16,
    color: "#666",
  },
  pickerModalDone: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  iosDatePicker: {
    height: 200,
    width: "100%",
  },

  // Specialization modal styles
  specializationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  specializationModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  specializationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specializationModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  specializationModalDone: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  specializationModalContent: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  specializationOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  specializationOptionText: {
    fontSize: 14,
    color: "#2C3E50",
    flex: 1,
  },

  // Badge styles for trainer display
  specializationScrollView: {
    marginTop: 8,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  personalTrainerBadge: {
    backgroundColor: "#4CAF50",
  },
  clientDataBadge: {
    backgroundColor: "#2196F3",
  },
  compactBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 3,
  },
  // Full Image Modal styles
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: "90%",
    height: "80%",
    position: "relative",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: -40,
    right: 0,
    zIndex: 10,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  // Access Badge Container
  accessBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 8,
  },
  accessBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#2196F3",
    marginLeft: 4,
  },
  // Timing chips
  timingsScroll: {
    marginLeft: 6,
    flex: 1,
  },
  timingChip: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  timingChipText: {
    fontSize: 11,
    color: "#1976D2",
    fontWeight: "500",
  },
  // Custom Tab Styles
  customTabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 15,
    marginBottom: 10,
    gap: 10,
  },
  customTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#B4B4B4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  customTabActive: {
    borderColor: "#007AFF",
    backgroundColor: "#FFFFFF",
  },
  customTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B4B4B4",
  },
  customTabTextActive: {
    color: "#007AFF",
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

export default AddTrainerScreen;
