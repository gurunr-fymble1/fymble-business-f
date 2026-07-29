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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientReportAPI, getClientDietAPI } from "../../../services/clientApi";
import { format } from "date-fns";

import FloatingActionButton from "../FloatingButton";
import DateNavigator from "../DateNavigator";
import { useRouter } from "expo-router";
import DietSummaryCard from "./DietSummaryCard";
import MacrosDistributionChart from "./MacrosDistributionChart";
import TopPageBar from "../TopPageBar";
import FoodLogCard from "./FoodLogCard";
import { LinearGradient } from "expo-linear-gradient";
import GradientButton2 from "../GradientButton2";
import HydrationCard from "./HydrationCard";
import { showToast } from "../../../utils/Toaster";
import AllClientsSkeleton from "../ui/loaders/allClientsSkeleton";

const { width, height } = Dimensions.get("window");

const DietReport = (props) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [report, setReport] = useState(null);
  const [consumedFoods, setConsumedFoods] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waterData, setWaterData] = useState(null);
  const { scrollEventThrottle, onScroll, headerHeight } = props;

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const nutritionColors = {
    calories: "#FF5757",
    protein: "#4CAF50",
    carbs: "#2196F3",
    fat: "#FFC107",
  };

  const showDate = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    setSelectedDate(currentDate);
  };

  const getReportDetails = async () => {
    const dateString = selectedDate.toISOString();
    const clientId = await AsyncStorage.getItem("client_id");
    setIsLoading(true);
    try {
      const response = await clientReportAPI(
        clientId,
        dateString?.split("T")[0],
      );
      if (response?.status === 200) {
        setReport(response?.data);
        setWaterData(response?.data?.water_intake);
        const protein = response?.data?.client_actual?.protein?.actual || 0;
        const carbs = response?.data?.client_actual?.carbs?.actual || 0;
        const fat = response?.data?.client_actual?.fat?.actual || 0;
        const totalCal = protein * 4 + carbs * 4 + fat * 9;
        const protein_p = ((protein * 4) / totalCal) * 100;
        const carbs_p = ((carbs * 4) / totalCal) * 100;
        const fat_p = ((fat * 9) / totalCal) * 100;

        setChartData({
          carbs: carbs_p,
          fat: fat_p,
          protein: protein_p,
        });
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Could not fetch report data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const fetchTodayDiet = async () => {
    const clientId = await AsyncStorage.getItem("client_id");
    try {
      const response = await getClientDietAPI(
        clientId,
        selectedDate?.toISOString().split("T")[0],
      );
      if (response?.status === 200) {
        setConsumedFoods(response?.data || []);
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

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getReportDetails();
        await fetchTodayDiet();
      };
      fetchData();
    }, [selectedDate]),
  );

  const groupFoodsByTime = (foods) => {
    if (!foods || foods.length === 0) {
      return [];
    }

    const groupedFoods = foods
      .filter((food) => {
        const formattedSelectedDate =
          selectedDate instanceof Date
            ? selectedDate.toISOString().split("T")[0]
            : selectedDate;
        return food.date === formattedSelectedDate;
      })
      .reduce((groups, food) => {
        const timeKey = food.timeAdded || "Unknown";
        if (!groups[timeKey]) {
          groups[timeKey] = [];
        }
        groups[timeKey].push(food);
        return groups;
      }, {});

    return Object.entries(groupedFoods)
      .map(([time, items]) => ({
        title: time,
        data: items,
      }))
      .sort((a, b) => b.title.localeCompare(a.title));
  };

  if (isLoading) {
    return <AllClientsSkeleton />;
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
    <SafeAreaView style={styles.container}>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={showDate}
          maximumDate={today}
        />
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

        <DietSummaryCard
          totalCalories={report?.client_actual?.calories?.target || "0"}
          consumedCalories={report?.client_actual?.calories?.actual || "NA"}
          macros={[
            {
              label: "Protein",
              value: report?.client_actual?.protein?.actual || 0,
              width: 22,
              color: nutritionColors.protein,
              icon: require("../../../assets/images/diet/protein.png"),
            },
            {
              label: "Carbs",
              value: report?.client_actual?.carbs?.actual || 0,
              width: 22,
              color: nutritionColors.carbs,
              icon: require("../../../assets/images/diet/carb.png"),
            },

            {
              label: "Fat",
              value: report?.client_actual?.fat?.actual || 0,
              width: 17,
              color: nutritionColors.fat,
              icon: require("../../../assets/images/diet/fat.png"),
            },
          ]}
        />

        {chartData &&
        chartData?.carbs &&
        chartData?.protein &&
        chartData?.fat ? (
          <MacrosDistributionChart
            macrosData={[
              {
                name: "Proteins",
                percentage: Number(chartData?.protein),
                color: "#338ED9",
              },
              { name: "grey", percentage: 1.5, color: "#D9D9D9" },
              {
                name: "Carbs",
                percentage: Number(chartData?.carbs),
                color: "#06B23F",
              },
              { name: "grey", percentage: 1.5, color: "#D9D9D9" },
              {
                name: "Fats",
                percentage: Number(chartData?.fat),
                color: "#EAA421",
              },
              { name: "grey", percentage: 1.5, color: "#D9D9D9" },
            ]}
          />
        ) : (
          ""
        )}
        <FoodLogCard
          selectedDate={selectedDate}
          consumedFoods={consumedFoods}
        />

        <HydrationCard
          currentIntake={waterData?.actual || 0}
          goal={waterData?.target || 0}
        />
      </Animated.ScrollView>
      {/* <FloatingActionButton icon="share-social" /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  dateDisplay: {
    // alignItems: 'center',
    // marginVertical: 15,
    marginTop: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    textDecorationLine: "underline",
    color: "#FF5757",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  cardContent: {
    padding: 10,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  nutritionItem2: {
    flex: 1,
    marginHorizontal: 5,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  nutritionLabel2: {
    fontSize: 12,
    fontWeight: "500",
  },
  nutritionValue2: {
    fontSize: 12,
    color: "#666",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  // Food log styles from FoodTracker
  foodList: {
    paddingVertical: 5,
  },
  foodCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    margin: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  foodCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  foodTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  nutritionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  nutritionDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  quantityText: {
    fontSize: 12,
    color: "#666",
    // marginTop: 8,
    marginLeft: 6,
  },
  timeHeader: {
    // backgroundColor: '#f5f5f5',
    // width: '100%',
    // padding: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
    width: "38%",
    display: "flex",
    alignItems: "left",
    justifyContent: "left",
  },
  timeHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

export default DietReport;
