import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  SectionList,
  Image,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getClientDietAPI } from "../../services/Api";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import DietReportSkeleton from "../ui/loaders/dietReportSkeleton";
import DateNavigator from "../ui/DateNavigator";

import { toIndianISOString } from "../Diet/toIndianISOString";
import DietProgressTracker from "../Diet/dietprogress";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ClientDietReport = (props) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Add temporary date state for iOS picker
  const [tempDate, setTempDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [dietTemplate, setDietTemplate] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const insets = useSafeAreaInsets();
  const { scrollEventThrottle, onScroll, headerHeight, clientId } = props;

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const nutrients = [
    {
      label: "Calories",
      icon: require("../../assets/images/diet/calorie.png"),
    },
    {
      label: "Proteins",
      icon: require("../../assets/images/diet/protein.png"),
    },
    {
      label: "Carbs",
      icon: require("../../assets/images/diet/carb.png"),
    },
    {
      label: "Fats",
      icon: require("../../assets/images/diet/fat.png"),
    },
    {
      label: "Fiber",
      icon: require("../../assets/images/diet/fiber.png"),
    },
    {
      label: "Sugar",
      icon: require("../../assets/images/diet/sugar.png"),
    },
  ];

  // Updated date change handler for iOS/Android compatibility
  const showDate = (event, selected) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selected) {
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
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  // Cancel handler for iOS
  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const fetchTodayDiet = async () => {
    try {
      const response = await getClientDietAPI(
        clientId,
        toIndianISOString(selectedDate).split("T")[0]
      );

      if (response?.status === 200) {
        setDietTemplate(response?.data || []);
        setProgressData(response?.progress || null);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Could not fetch diet data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMealExpansion = (mealId) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await fetchTodayDiet();
      };
      fetchData();
    }, [selectedDate])
  );

  const renderMealSection = ({ item }) => {
    const isExpanded = expandedMeal === item.id;
    const hasFood = item.foodList.length > 0;

    return (
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealTitle}>{item.title}</Text>
            <Text style={styles.mealTagline}>{item.tagline}</Text>
            <Text style={styles.mealTime}>{item.timeRange}</Text>
          </View>
        </View>

        {/* Food Items Section */}
        {hasFood && (
          <View style={styles.foodSection}>
            {/* First food - always visible */}
            <View style={styles.foodItemCard}>
              <View style={styles.foodItemHeader}>
                <View style={styles.foodItemLeft}>
                  <Text style={styles.foodItemName}>
                    {item.foodList[0].name}
                  </Text>
                  <Text style={styles.foodQuantity}>
                    Qty: {item.foodList[0].quantity}
                  </Text>
                </View>
                {item.foodList.length > 1 && (
                  <TouchableOpacity
                    style={styles.expandFoodButton}
                    onPress={() => toggleMealExpansion(item.id)}
                  >
                    <Text style={styles.moreItemsText}>
                      {isExpanded
                        ? `Hide ${item.foodList.length - 1} more`
                        : `+${item.foodList.length - 1} more`}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* First food macros */}
              <View style={styles.foodMacroRow}>
                {nutrients.map((nutrient, idx) => {
                  let value;
                  const food = item.foodList[0];
                  switch (nutrient.label) {
                    case "Calories":
                      value = Math.round(food.calories || 0);
                      break;
                    case "Proteins":
                      value = Math.round(food.protein || 0);
                      break;
                    case "Carbs":
                      value = Math.round(food.carbs || 0);
                      break;
                    case "Fats":
                      value = Math.round(food.fat || 0);
                      break;
                    case "Fiber":
                      value = Math.round(food.fiber || 0);
                      break;
                    case "Sugar":
                      value = Math.round(food.sugar || 0);
                      break;
                    default:
                      value = 0;
                  }

                  return (
                    <View key={idx} style={styles.foodMacroItem}>
                      <View style={styles.macroIconContainer}>
                        <Image
                          source={nutrient.icon}
                          style={[
                            styles.macroIcon,
                            {
                              width:
                                nutrient.label === "Calories"
                                  ? 10
                                  : nutrient.label === "Fats"
                                  ? 14
                                  : nutrient.label === "Fiber"
                                  ? 22
                                  : nutrient.label === "Sugar"
                                  ? 18
                                  : 16,
                              height: nutrient.label === "Fats" ? 18 : 16,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroLabel}>{nutrient.label}</Text>
                      <Text style={styles.macroValue}>{value}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Additional foods - shown when expanded */}
            {isExpanded &&
              item.foodList.slice(1).map((food, index) => (
                <View key={index + 1} style={styles.foodItemCard}>
                  <View style={styles.foodItemHeader}>
                    <View style={styles.foodItemLeft}>
                      <Text style={styles.foodItemName}>{food.name}</Text>
                      <Text style={styles.foodQuantity}>
                        Qty: {food.quantity}
                      </Text>
                    </View>
                  </View>

                  {/* Individual food macros */}
                  <View style={styles.foodMacroRow}>
                    {nutrients.map((nutrient, idx) => {
                      let value;
                      switch (nutrient.label) {
                        case "Calories":
                          value = Math.round(food.calories || 0);
                          break;
                        case "Proteins":
                          value = Math.round(food.protein || 0);
                          break;
                        case "Carbs":
                          value = Math.round(food.carbs || 0);
                          break;
                        case "Fats":
                          value = Math.round(food.fat || 0);
                          break;
                        case "Fiber":
                          value = Math.round(food.fiber || 0);
                          break;
                        case "Sugar":
                          value = Math.round(food.sugar || 0);
                          break;
                        default:
                          value = 0;
                      }

                      return (
                        <View key={idx} style={styles.foodMacroItem}>
                          <View style={styles.macroIconContainer}>
                            <Image
                              source={nutrient.icon}
                              style={[
                                styles.macroIcon,
                                {
                                  width:
                                    nutrient.label === "Calories"
                                      ? 10
                                      : nutrient.label === "Fats"
                                      ? 14
                                      : nutrient.label === "Fiber"
                                      ? 22
                                      : nutrient.label === "Sugar"
                                      ? 18
                                      : 16,
                                  height: nutrient.label === "Fats" ? 18 : 16,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.macroLabel}>
                            {nutrient.label}
                          </Text>
                          <Text style={styles.macroValue}>{value}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <DietReportSkeleton priority="high" />;
  }

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    if (newDate > today) return;

    setSelectedDate(newDate);
  };

  const selectDayFromStrip = (date) => {
    setSelectedDate(date);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Date Picker Modal - Positioned at root level for proper z-index */}
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={showDate}
            themeVariant="light"
            textColor="#000000"
            maximumDate={today}
            style={Platform.OS === "ios" ? styles.iosDatePicker : {}}
          />
          {Platform.OS === "ios" && (
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.confirmButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        <View style={styles.dateDisplay}>
          <DateNavigator
            selectedDate={selectedDate}
            today={new Date()}
            navigateDate={navigateDate}
            setShowDatePicker={setShowDatePicker}
            selectDayFromStrip={selectDayFromStrip}
          />
        </View>

        {/* Diet Progress Tracker */}
        {progressData && (
          <DietProgressTracker
            calories={{
              actual: Math.round(progressData?.calories?.actual) || 0,
              target: progressData?.calories?.target || 0,
            }}
            carbs={{
              actual: Math.round(progressData?.carbs?.actual) || 0,
              target: progressData?.carbs?.target || 0,
            }}
            protein={{
              actual: Math.round(progressData?.protein?.actual) || 0,
              target: progressData?.protein?.target || 0,
            }}
            fat={{
              actual: Math.round(progressData?.fat?.actual) || 0,
              target: progressData?.fat?.target || 0,
            }}
            fiber={{
              actual: Math.round(progressData?.fiber?.actual) || 0,
              target: progressData?.fiber?.target || 0,
            }}
            sugar={{
              actual: Math.round(progressData?.sugar?.actual) || 0,
              target: progressData?.sugar?.target || 0,
            }}
          />
        )}

        <FlatList
          data={dietTemplate}
          keyExtractor={(item) => item.id}
          renderItem={renderMealSection}
          scrollEnabled={false}
          contentContainerStyle={styles.flatListContainer}
        />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  dateDisplay: {
    marginTop: Platform.OS === "ios" ? 0 : 20,
    marginBottom: 15,
  },
  flatListContainer: {
    paddingBottom: 20,
  },
  mealSection: {
    backgroundColor: "#f8f9fa",
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    elevation: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#eee",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  mealTagline: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: "#696161ff",
  },
  foodSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  foodItemCard: {
    backgroundColor: "#fff",
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  foodItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  foodQuantity: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  expandFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moreItemsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  foodMacroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  foodMacroItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 2,
  },
  macroIconContainer: {
    marginBottom: 2,
  },
  macroIcon: {
    width: 16,
    height: 16,
  },
  macroLabel: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
  macroValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "absolute",
    top: 300,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  iosDatePicker: {
    height: 200,
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 10,
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  confirmButton: {
    backgroundColor: "#FF5757",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ClientDietReport;
