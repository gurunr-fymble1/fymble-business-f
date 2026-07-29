import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";

import { clientReportAPI, getClientWorkoutAPI } from "../../services/clientApi";
import { showToast } from "../../utils/Toaster";
import WorkoutCompletionModal from "./workoutcompletionmodal";
import WorkoutReportSkeleton from "../ui/loaders/workoutReportSkeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const DeleteConfirmationModal = ({ visible, onClose, onConfirm, photoUri }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmModalTitle}>Delete Photo?</Text>
          <Text style={styles.confirmModalMessage}>
            Are you sure you want to delete this photo? This action cannot be
            undone.
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.deleteButton]}
              onPress={() => onConfirm(photoUri)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const WeekdayButton = ({ day, date, isActive, onPress, fullDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buttonDate = new Date(fullDate);
  buttonDate.setHours(0, 0, 0, 0);
  const isFutureDate = buttonDate > today;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 7,
      }}
      disabled={isFutureDate}
    >
      <View
        style={[
          styles.weekdayButton,
          isActive && styles.activeWeekdayButton,
          isFutureDate && styles.disabledWeekdayButton,
        ]}
      >
        <Text
          style={[
            styles.weekdayText,
            isActive && styles.activeWeekdayText,
            isFutureDate && styles.disabledWeekdayText,
          ]}
        >
          {date}
        </Text>
      </View>
      <Text
        style={[
          styles.weekdayLabel,
          isActive && styles.activeWeekdayLabel,
          isFutureDate && styles.disabledWeekdayLabel,
        ]}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

const ClientWorkoutReport = (props) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Add temporary date state for iOS picker
  const [tempDate, setTempDate] = useState(new Date());
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPhotos, setSavedPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const router = useRouter();
  const [workoutCompletionVisible, setWorkoutCompletionVisible] =
    useState(false);
  const [image, setImage] = useState(null);
  const {
    onSectionChange,
    scrollEventThrottle,
    onScroll,
    headerHeight,
    gender,
    clientId,
  } = props;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const insets = useSafeAreaInsets();
  // Helper functions from ExerciseCard
  const getSetNumberColor = (index) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"];
    return colors[index % colors.length];
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}.${seconds.toString().padStart(2, "0")}`;
  };

  // Determine exercise type based on the sets data
  const getExerciseType = (exercise) => {
    if (!exercise.sets || exercise.sets.length === 0) return "regular";

    const firstSet = exercise.sets[0];
    const hasReps = firstSet.reps > 0;
    const hasWeight = firstSet.weight > 0;

    if (!hasReps && !hasWeight) return "cardio";
    if (hasReps && !hasWeight) return "bodyweight";
    return "regular";
  };

  // Render sets header similar to ExerciseCard
  const renderSetsHeader = (exercise) => {
    const exerciseType = getExerciseType(exercise);

    const getHeaderColumns = () => {
      if (exerciseType === "cardio") {
        return [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
        ];
      } else if (exerciseType === "bodyweight") {
        return [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "repeat", name: "Reps", unit: "", color: "#45B7D1" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
        ];
      } else {
        return [
          { icon: "time", name: "Duration", unit: "minutes", color: "#4ECDC4" },
          { icon: "repeat", name: "Reps", unit: "", color: "#45B7D1" },
          { icon: "flame", name: "Cal", unit: "kcal", color: "#FF6B6B" },
          {
            icon: "weight-kilogram",
            name: "Weight",
            unit: "kg",
            color: "#9B59B6",
            isFA: true,
          },
        ];
      }
    };

    const headerColumns = getHeaderColumns();
    const hasWeight = exerciseType === "regular";
    const headerFontSize = hasWeight ? 9 : 11;

    return (
      <View style={styles.setsHeaderContainer}>
        <View style={styles.setsHeaderRow}>
          <View style={styles.headerSetColumn}>
            <Ionicons name="fitness" size={16} color="#FF6B6B" />
            <Text
              style={[
                styles.headerText,
                { fontSize: responsiveFontSize(headerFontSize) },
              ]}
            >
              Sets
            </Text>
          </View>

          <View style={styles.headerDataContainer}>
            {headerColumns.map((column, index) => (
              <View key={index} style={styles.headerIconContainer}>
                <View style={styles.headerIconAndTitle}>
                  {column.isFA ? (
                    <MaterialCommunityIcons
                      name={column.icon}
                      size={14}
                      color={column.color}
                    />
                  ) : (
                    <Ionicons
                      name={column.icon}
                      size={14}
                      color={column.color}
                    />
                  )}
                  <Text
                    style={[
                      styles.headerText,
                      { fontSize: responsiveFontSize(headerFontSize) },
                    ]}
                  >
                    {column.name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Render individual set item similar to ExerciseCard
  const renderSetItem = ({ item: set, index: setIndex, exercise }) => {
    const exerciseType = getExerciseType(exercise);

    return (
      <View style={styles.newSetItem}>
        <View style={styles.setRowContent}>
          <View style={styles.setNumberContainer}>
            <View
              style={[
                styles.setNumberCircle,
                { backgroundColor: getSetNumberColor(setIndex) },
              ]}
            >
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
            </View>
          </View>

          <View style={styles.setDataContainer}>
            {exerciseType === "cardio" ? (
              <>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {formatDuration(set.duration)}
                    <Text style={styles.setDataLabel}>&nbsp;min</Text>
                  </Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {set.calories.toFixed(2)}
                    <Text style={styles.setDataLabel}>kcal</Text>
                  </Text>
                </View>
              </>
            ) : exerciseType === "bodyweight" ? (
              <>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {formatDuration(set.duration)}
                    <Text style={styles.setDataLabel}>&nbsp;min</Text>
                  </Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>{set.reps}</Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {set.calories.toFixed(2)}
                    <Text style={styles.setDataLabel}>kcal</Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {formatDuration(set.duration)}
                    <Text style={styles.setDataLabel}>&nbsp;min</Text>
                  </Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>{set.reps}</Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {set.calories.toFixed(2)}
                    <Text style={styles.setDataLabel}>kcal</Text>
                  </Text>
                </View>
                <View style={styles.setDataColumn}>
                  <Text style={styles.setDataValue}>
                    {set.weight}
                    <Text style={styles.setDataLabel}>kg</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const formatHeaderDate = (date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${month} ${day}`;
    }
    return `${month} ${day}`;
  };

  const generateWeekDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDate = new Date(selectedDate);
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 3);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isSelected = date.toDateString() === selectedDate.toDateString();

      weekDays.push({
        day: days[date.getDay()],
        date: date.getDate(),
        fullDate: new Date(date),
        isActive: isSelected,
      });
    }

    return weekDays;
  };
  const selectDayFromStrip = (fullDate) => {
    const newSelectedDate = new Date(fullDate);
    newSelectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newSelectedDate > today) {
      return;
    }
    setSelectedDate(newSelectedDate);
  };

  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);

    if (newDate > today) return;
    setSelectedDate(newDate);
  };

  const generateFilename = () => {
    const randomId = Math.random().toString().slice(2);
    const date = new Date().toISOString().split("T")[0];
    return `${randomId}_${date}.jpg`;
  };

  const setupImageDirectory = async () => {
    const dirUri = `${FileSystem.documentDirectory}FymbleImages/`;

    try {
      // In SDK 54, just try to create the directory - it won't error if it exists
      const dir = new FileSystem.Directory(dirUri);
      await dir.create();
    } catch (error) {
      // Directory might already exist, which is fine
    }

    return dirUri;
  };

  //   const handleDeletePhoto = async (photoUri) => {
  //     try {
  //       const fileInfo = await FileSystem.getInfoAsync(photoUri);
  //       if (fileInfo.exists) {
  //         await FileSystem.deleteAsync(photoUri);
  //         const updatedPhotos = await getSavedPhotosByDate(selectedDate);
  //         setSavedPhotos(updatedPhotos);
  //         setDeleteModalVisible(false);
  //         if (selectedPhoto === photoUri) {
  //           setPhotoModalVisible(false);
  //         }
  //       }
  //     } catch (error) {
  //       showToast({
  //         type: 'error',
  //         title: 'Error',
  //         desc: 'Failed to delete the photo. Please try again later',
  //       });
  //     }
  //   };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const confirmDeletePhoto = (photoUri) => {
    setPhotoToDelete(photoUri);
    setDeleteModalVisible(true);
  };

  const handleImageUpload = async () => {
    setWorkoutCompletionVisible(false);

    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Sorry",
          desc: "we need camera permissions to make this work!",
        });
        return;
      }

      const dirUri = await setupImageDirectory();
      const newFilename = generateFilename();
      const newFileUri = `${dirUri}${newFilename}`;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (image) {
          try {
            // Delete previous image using SDK 54 File API
            const oldFile = new FileSystem.File(image);
            if (await oldFile.exists()) {
              await oldFile.delete();
            }
          } catch (deleteError) {
            showToast({
              type: "error",
              title: `Error deleting previous image: ${deleteError}`,
            });
          }
        }

        // Copy new image using SDK 54 File API
        const sourceFile = new FileSystem.File(result.assets[0].uri);
        const destFile = new FileSystem.File(newFileUri);
        await sourceFile.copy(destFile);

        setImage(newFileUri);
      }

      setWorkoutCompletionVisible(true);
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to process the image. Please try again.",
      });
      setWorkoutCompletionVisible(true);
    }
  };

  // Updated date change handler for iOS/Android compatibility
  const showDate = async (event, selected) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selected) {
        if (selected > today) return;
        setSelectedDate(selected);
      }
    } else {
      // iOS - just update temp date
      if (selected) {
        setTempDate(selected);
      }
    }
  };

  // iOS picker confirmation handlers
  const confirmDateSelection = () => {
    if (tempDate > today) return;
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  // Cancel handler for iOS
  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    setPhotoModalVisible(true);
  };

  const getReportDetails = async () => {
    const formattedDate = formatDateForAPI(selectedDate);

    setIsLoading(true);

    try {
      const response = await clientReportAPI(clientId, formattedDate);

      if (response?.status === 200) {
        setReport(response?.data);

        await fetchWorkoutDetails(formattedDate);
      } else {
        showToast({
          type: "error",
          title: `Error fetching report: ${response?.detail}`,
        });
        setWorkoutDetails([]);
        setReport(null);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: `Error fetching report: ${error}`,
      });
      setWorkoutDetails([]);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkoutDetails = async (formattedDate) => {
    // const clientId = await AsyncStorage.getItem('client_id');

    try {
      const response = await getClientWorkoutAPI(clientId, formattedDate);

      if (response?.status === 200) {
        const workoutData = response?.data?.workout_details || [];
        setWorkoutDetails(workoutData);

        if (workoutData && workoutData.length > 0) {
          setSelectedTab(Object.keys(workoutData[0])[0] || "");
        } else {
          setSelectedTab(null);
        }
      } else {
        showToast({
          type: "error",
          title: `Error fetching workouts: ${response?.detail}`,
        });
        setWorkoutDetails([]);
        setSelectedTab(null);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: `Error fetching workouts: ${error}`,
      });
      setWorkoutDetails([]);
      setSelectedTab(null);
    }
  };

  useEffect(() => {
    getReportDetails();
  }, [selectedDate]);

  if (isLoading) {
    return <WorkoutReportSkeleton priority="high" />;
  }

  const availableTabs = workoutDetails
    ? [
        ...new Set(
          workoutDetails.flatMap((workout) => Object.keys(workout || {})),
        ),
      ]
    : [];
  const getExercisesForSelectedTab = () => {
    if (!workoutDetails || workoutDetails.length === 0) return [];

    const allExercises = workoutDetails
      .flatMap((workout) =>
        Object.entries(workout || {})
          .filter(([muscleGroup]) => muscleGroup === selectedTab)
          .map(([_, exercises]) => exercises),
      )
      .flat();

    return allExercises;
  };

  const totalCalories = workoutDetails?.reduce((total, muscleGroup) => {
    const exercises = Object.values(muscleGroup).flat();
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        total += set.calories;
      });
    });
    return total;
  }, 0);

  const totalVolume = workoutDetails?.reduce((total, muscleGroup) => {
    const exercises = Object.values(muscleGroup).flat();
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        total += set.weight * set.reps;
      });
    });
    return total;
  }, 0);

  const getCurrentExercises = getExercisesForSelectedTab();

  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom },
      ]}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ padding: 15 }}
        >
          <View style={styles.dateHeader}>
            <View style={styles.dateNavigator}>
              <TouchableOpacity onPress={() => navigateDate(-1)}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTempDate(selectedDate);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateHeaderText}>
                  {formatHeaderDate(selectedDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateDate(1)}
                disabled={selectedDate.toDateString() === today.toDateString()}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    selectedDate.toDateString() === today.toDateString()
                      ? "#ccc"
                      : "#000"
                  }
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              style={styles.weekDayStrip}
            >
              {generateWeekDays().map((item, index) => (
                <WeekdayButton
                  key={index}
                  day={item.day}
                  date={item.date}
                  isActive={item.isActive}
                  onPress={() => selectDayFromStrip(item.fullDate)}
                  fullDate={item.fullDate}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.entryExitContainer}>
            <View style={styles.entryTimeContainer}>
              <Image
                source={
                  gender.toLowerCase() === "male"
                    ? require("../../assets/images/workout/LOG_IN 3.png")
                    : require("../../assets/images/workout/LOG_IN 3_female.png")
                }
                resizeMode="contain"
                style={{ width: 100, height: 100 }}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.entryTime}>
                  {report?.attendance?.in_time || "N/A"}
                </Text>
                {report?.attendance?.in_time_2 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.in_time_2 || "N/A"}
                  </Text>
                )}
                {report?.attendance?.in_time_3 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.in_time_3 || "N/A"}
                  </Text>
                )}
                <Text style={styles.entryLabel}>Gym Entry</Text>
              </View>
            </View>

            <View style={styles.workoutDuration}>
              <Text style={styles.durationText}>
                Duration: {report?.time_spent || "N/A"}
              </Text>
            </View>

            <View style={styles.exitTimeContainer}>
              <Image
                source={
                  gender.toLowerCase() === "male"
                    ? require("../../assets/images/workout/LOG_OUT 1.png")
                    : require("../../assets/images/workout/LOG_OUT 1_female.png")
                }
                resizeMode="contain"
                style={{ width: 100, height: 100 }}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.exitTime}>
                  {report?.attendance?.out_time || "N/A"}
                </Text>
                {report?.attendance?.in_time_2 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.out_time_2 || "N/A"}
                  </Text>
                )}
                {report?.attendance?.in_time_3 && (
                  <Text style={styles.entryTime}>
                    {report?.attendance?.out_time_3 || "N/A"}
                  </Text>
                )}
                <Text style={styles.exitLabel}>Gym Exit</Text>
              </View>
            </View>
          </View>

          <View style={styles.workoutDetailsSection}>
            <Text style={styles.sectionTitle}>Workout Details</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
            >
              {availableTabs.map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tabButton,
                    selectedTab === tab && styles.activeTabButton,
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exerciseList}>
              {getCurrentExercises.length > 0 ? (
                getCurrentExercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <TouchableOpacity
                      onPress={() =>
                        toggleExerciseExpand(`${selectedTab}_${idx}`)
                      }
                      style={styles.exerciseHeader}
                    >
                      <View style={styles.exerciseNameContainer}>
                        <Text
                          style={styles.exerciseName}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {exercise.name}
                        </Text>
                        <Text style={styles.setDetails}>
                          {exercise.sets ? `${exercise.sets.length} sets` : ""}
                          {exercise.sets &&
                          exercise.sets.some((set) => set.reps > 0)
                            ? ` • ${Object.values(exercise.sets).reduce(
                                (sum, group) => sum + group.reps,
                                0,
                              )} reps`
                            : ""}
                          {exercise.sets &&
                          exercise.sets.some((set) => set.weight > 0)
                            ? ` • ${Object.values(exercise.sets).reduce(
                                (sum, group) => sum + group.weight,
                                0,
                              )} kg`
                            : ""}
                        </Text>
                      </View>
                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseCalories}>
                          {exercise.sets
                            ? `${Object.values(exercise.sets)
                                .reduce((sum, group) => sum + group.calories, 0)
                                .toFixed(2)} kcal`
                            : ""}
                        </Text>
                        <Ionicons
                          name={
                            expandedExercise === `${selectedTab}_${idx}`
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color="#555"
                        />
                      </View>
                    </TouchableOpacity>

                    {expandedExercise === `${selectedTab}_${idx}` &&
                      exercise.sets && (
                        <View style={styles.setsDisplayContainer}>
                          {renderSetsHeader(exercise)}
                          <FlatList
                            data={exercise.sets}
                            renderItem={({ item, index }) =>
                              renderSetItem({ item, index, exercise })
                            }
                            keyExtractor={(item, index) => `set-${index}`}
                            horizontal={false}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            style={styles.setsList}
                            contentContainerStyle={styles.setsContainer}
                            initialNumToRender={50}
                            maxToRenderPerBatch={50}
                          />
                        </View>
                      )}
                  </View>
                ))
              ) : (
                <Text style={styles.noExercisesText}>
                  No exercise Data found
                </Text>
              )}
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>

            <View style={styles.progressStatsContainer}>
              <View style={styles.progressStat}>
                <Image
                  source={require("../../assets/images/calories.png")}
                  resizeMode="contain"
                  style={styles.progressImage}
                />
                <Text style={styles.statValue}>
                  {totalCalories
                    ? `${totalCalories.toFixed(2)} kcal`
                    : "0 kcal"}
                </Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>

              <View style={styles.progressStat}>
                <Image
                  source={require("../../assets/images/kgs.png")}
                  resizeMode="contain"
                  style={styles.progressImage}
                />
                <Text style={styles.statValue}>
                  {totalVolume ? `${totalVolume.toFixed(2)} kg` : "0 kg"}
                </Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>

              <View style={styles.progressStat}>
                <Image
                  source={
                    gender.toLowerCase() === "male"
                      ? require("../../assets/images/workout/Group 5 1.png")
                      : require("../../assets/images/workout/Group 5 1_female.png")
                  }
                  resizeMode="contain"
                  style={{ width: 80, height: 80 }}
                />
                <Text style={styles.statValue}>
                  {report?.workout?.count} Exercises
                </Text>
                <Text style={styles.statLabel}> Completed</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* iOS Date Picker Modal */}
        {Platform.OS === "ios" && showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={cancelDateSelection}
          >
            <TouchableWithoutFeedback onPress={cancelDateSelection}>
              <View style={styles.pickerModalContainer}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={cancelDateSelection}>
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Select Date</Text>
                      <TouchableOpacity onPress={confirmDateSelection}>
                        <Text style={styles.pickerConfirmText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      themeVariant="light"
                      textColor="#000000"
                      onChange={showDate}
                      maximumDate={today}
                      style={styles.iosPickerStyle}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Android Date Picker */}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={showDate}
            maximumDate={today}
          />
        )}
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: 10,
  },

  dateNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: "white",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 15,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weekDayStrip: {
    paddingLeft: 8,
    paddingTop: 10,
    paddingBottom: 16,
  },
  weekdayButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "rgba(0, 123, 255, 0.06)",
  },
  activeWeekdayButton: {
    backgroundColor: "#007BFF",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "400",
  },
  weekdayLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  activeWeekdayText: {
    color: "white",
  },
  activeWeekdayLabel: {
    color: "#007BFF",
  },
  entryExitContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderRadius: 15,
    paddingVertical: 15,
  },
  entryTimeContainer: {
    width: "33%",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: "white",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "visible",
  },
  exitTimeContainer: {
    width: "33%",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
    elevation: 3,
    overflow: "visible",
  },
  timeContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  exitTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  entryLabel: {
    fontSize: 12,
    color: "#777",
  },
  exitLabel: {
    fontSize: 12,
    color: "#777",
  },
  workoutDuration: {
    width: "33%",
    padding: 5,
  },
  durationText: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
    elevation: 3,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  workoutDetailsSection: {
    backgroundColor: "white",
    borderRadius: 15,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#D9D9D9",
  },
  activeTabButton: {
    backgroundColor: "#007BFF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "400",
  },
  activeTabText: {
    color: "white",
  },
  exerciseList: {
    marginTop: 10,
  },
  exerciseItem: {
    marginBottom: 12,
    backgroundColor: "rgba(217, 217, 217, 0.25)",
    borderRadius: 8,
    overflow: "hidden",
  },
  exerciseHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  exerciseMeta: {
    alignItems: "flex-end",
  },
  exerciseCalories: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  // New styles from ExerciseCard for sets display
  setsDisplayContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(1),
    marginTop: responsiveHeight(0.5),
  },
  setsHeaderContainer: {
    marginBottom: responsiveHeight(0.8),
  },
  setsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(1),
    backgroundColor: "rgba(100, 150, 200, 0.1)",
    borderRadius: 8,
    marginBottom: 0,
  },
  headerSetColumn: {
    width: responsiveWidth(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  headerDataContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  headerIconContainer: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerIconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  headerText: {
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  setsList: {
    maxHeight: responsiveHeight(30),
  },
  setsContainer: {
    paddingVertical: responsiveHeight(0.5),
  },
  newSetItem: {
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(2),
    marginBottom: responsiveHeight(0.8),
    backgroundColor: "rgba(240, 245, 250, 0.9)",
    borderRadius: responsiveWidth(2.5),
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
  },
  setRowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  setNumberContainer: {
    width: responsiveWidth(15),
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberCircle: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    borderRadius: responsiveWidth(3),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  setNumber: {
    color: "white",
    fontSize: responsiveFontSize(10),
    fontWeight: "bold",
  },
  setDataContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  setDataColumn: {
    flex: 1,
    alignItems: "center",
  },
  setDataValue: {
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  setDataLabel: {
    fontSize: responsiveFontSize(9),
    color: "#666",
    textAlign: "center",
  },
  setDetails: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.80)",
  },
  noExercisesText: {
    textAlign: "center",
    color: "#777",
    padding: 20,
  },
  progressSection: {
    marginVertical: 10,
  },
  progressStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  progressStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    justifyContent: "flex-end",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 5,
    shadowColor: "rgba(0, 0, 0, 0.50)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressImage: {
    width: 70,
    height: 70,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  photoSection: {
    backgroundColor: "white",
    marginVertical: 10,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 5,
  },
  uploadPhotoTile: {
    width: "32%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  plusIconOverlay: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "#000",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPhotoText: {
    fontSize: 12,
    color: "#777",
  },
  photoContainer: {
    position: "relative",
    width: "32%",
    height: width / 3.5,
    marginBottom: 10,
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  deleteIconContainer: {
    position: "absolute",
    top: -12,
    right: -5,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  noPhotosText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
    width: "100%",
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenPhoto: {
    width: width,
    height: width,
  },
  photoCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  photoDeleteButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    zIndex: 10,
  },
  disabledWeekdayButton: {
    backgroundColor: "#D9D9D9",
  },
  disabledWeekdayText: {
    color: "#999",
  },
  disabledWeekdayLabel: {
    color: "#999",
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  confirmModalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  deleteButton: {
    backgroundColor: "#297DB3",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "500",
  },
  // iOS Picker Modal Styles (added from previous examples)
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
    color: "#007BFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
});

export default ClientWorkoutReport;
