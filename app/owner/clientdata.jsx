import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useLocalSearchParams } from "expo-router";
import MessageForm from "../../components/ui/MessageForm";
import { getClientDataAPI } from "../../services/Api";
import { showToast } from "../../utils/Toaster";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";

const { width, height } = Dimensions.get("window");

const ClientPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [selectedChart, setSelectedChart] = useState("weight");
  const { clientData } = useLocalSearchParams(); 
  const [feeHistory, setFeeHistory] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [dietVariants, setDietVariants] = useState({});
  const [workoutDays, setWorkoutDays] = useState({});
  const [clientActual, setClientActual] = useState([]);

  const client = JSON.parse(clientData);

  const progressData = {
    weight: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [78, 76.5, 75, 73.5, 72, 70.5],
          color: (opacity = 1) => `rgba(255, 87, 87, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    },
    bodyFat: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [25, 23, 21, 19, 17, 15],
          color: (opacity = 1) => `rgba(0, 200, 100, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    },
  };

  const fetchClientData = async () => {
    try {
      const response = await getClientDataAPI(client.gym_id, client.id);

      if (response?.status === 200) {
        const data = response.data;
        setFeeHistory(data.fee_history || []);
        setDietVariants(data.diet_variants || {});
        setWorkoutDays(data.workout_days || {});
        setClientActual(data.client_actual || []);
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
        title:
          error.response?.detail ||
          "Something went wrong, please try again later.",
      });
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    fetchClientData();
  }, []);


  const statsCards = [
    {
      icon: "heartbeat",
      title: "BMI",
      value: client?.bmi ? client?.bmi?.toFixed(2) : "N/A",
      color: "#FF6347",
    },
    {
      icon: "phone",
      title: "Contact",
      value: client.contact ? client.contact : "N/A",
      color: "#4169E1",
    },

    {
      icon: "time",
      title: "Batch",
      value: client.batch ? client.batch : "N/A",
      color: "#32CD32",
    },
    {
      icon: "notes-medical",
      title: "Medical history",
      value: client.medical_issues ? client.medical_issues : "N/A",
      color: "#FF6347",
    },
    {
      icon: "dumbbell",
      title: "Training Days",
      value: "5/week",
      color: "#4169E1",
    },
  ];

  const renderStatsCard = ({ item, index }) => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View
        style={[
          styles.statsCard,
          { backgroundColor: item.color },
          animatedStyle,
        ]}
      >
        <FontAwesome5
          name={item.icon === "time" ? "clock" : item.icon}
          size={24}
          color="white"
        />
        <Text style={styles.statsCardTitle}>{item.title}</Text>
        <Text
          style={
            item.title === "Contact" || item.title === "Medical history"
              ? styles.statsCardValueContact
              : styles.statsCardValue
          }
        >
          {item.value}
        </Text>
      </Animated.View>
    );
  };

  const renderFeeHistoryModal = () => (
    <Modal
      visible={activeModal === "fee"}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Fee History</Text>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {feeHistory.map((item, index) => (
              <View key={index} style={styles.modalRow}>
                <Text style={styles.modalRowText}>{item.payment_date}</Text>
                <Text style={styles.modalRowText}>₹{item.fees_paid}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActiveModal(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDietPlanModal = () => (
    <Modal
      visible={activeModal === "diet"}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Diet Plan</Text>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {Object.entries(dietVariants).map(([variant, meals], index) => (
              <View key={index} style={styles.dietVariantSection}>
                <Text style={styles.variantTitle}>Variant: {variant}</Text>
                {meals.map((meal, idx) => (
                  <View key={idx} style={styles.modalRow}>
                    <View>
                      <Text style={styles.modalRowTextBold}>
                        {meal.time_slot} - {meal.meal_type}
                      </Text>
                      <Text style={styles.modalRowTextSub}>
                        Type: {meal.diet_type}
                      </Text>
                    </View>
                    <Text style={styles.modalRowText}>
                      {meal.calories} Cal | Protein: {meal.protein}g | Fat:{" "}
                      {meal.fat}g | Carbs: {meal.carbs}g
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActiveModal(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderWorkoutPlanModal = () => (
    <Modal
      visible={activeModal === "workout"}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Workout Plan</Text>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {Object.entries(workoutDays).map(([day, exercises], index) => (
              <View key={index} style={styles.workoutDaySection}>
                <Text style={styles.dayTitle}>Day: {day}</Text>
                {exercises.map((exercise, idx) => (
                  <View key={idx} style={styles.modalRow}>
                    <Text style={styles.modalRowTextBold}>
                      {exercise.workout_name}
                    </Text>
                    <View style={styles.exerciseDetailContainer}>
                      <Text style={styles.modalRowText}>
                        Sets: {exercise.sets} | Reps: {exercise.reps}
                      </Text>
                      <Text style={styles.modalRowText}>
                        Weights:{" "}
                        {exercise.weights.filter((w) => w !== null).join(", ")}{" "}
                        kg
                      </Text>
                    </View>
                    <Text style={styles.modalRowTextSub}>
                      Muscle Group: {exercise.muscle_group} | Duration:{" "}
                      {exercise.duration} mins | Rest: {exercise.rest_time} secs
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActiveModal(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <LinearGradient colors={["#FFFFFF", "#F0F0F0"]} style={styles.container}>
      <NewOwnerHeader />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.profileHeader}>
            <View style={styles.profileHead}>
              {/* <Image
                source={clientInfo.profileImage}
                style={styles.profileImage}
              /> */}
              <View>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientSubtitle}>
                  {client.age} yrs | {client.goal}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.messageIcon}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5
                name="comment"
                size={width * 0.06}
                color="#FF5757"
                solid
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {modalVisible && (
          <MessageForm
            client={{ name: "John Doe" }}
            onSubmit={async (messageData) => {
              setModalVisible(false);
            }}
            onClose={() => setModalVisible(false)}
          />
        )}

        <FlatList
          data={statsCards}
          renderItem={renderStatsCard}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        />

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal("fee")}
          >
            <Ionicons name="cash-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Fee History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal("diet")}
          >
            <Ionicons name="nutrition-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Diet Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal("workout")}
          >
            <Ionicons name="fitness-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Workout Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartToggle}>
            <TouchableOpacity
              style={[
                styles.chartToggleButton,
                selectedChart === "weight" && styles.activeChartToggle,
              ]}
              onPress={() => setSelectedChart("weight")}
            >
              <Text style={styles.chartToggleText}>
                Weight Change with time
              </Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={progressData[selectedChart]}
            width={width * 0.9}
            height={height * 0.25}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 87, 87, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.finalActionContainer}>
          <TouchableOpacity style={styles.finalActionButton}>
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.finalActionButtonText}>
              View Client Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finalActionButton}>
            <Ionicons name="analytics-outline" size={20} color="white" />
            <Text style={styles.finalActionButtonText}>View Analysis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderFeeHistoryModal()}
      {renderDietPlanModal()}
      {renderWorkoutPlanModal()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: height * 0.02,
  },
  header: {
    paddingHorizontal: width * 0.05,
    marginVertical: height * 0.02,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    marginRight: width * 0.04,
  },
  clientName: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#333",
  },
  clientSubtitle: {
    fontSize: width * 0.04,
    color: "#666",
  },
  messageIcon: {
    padding: width * 0.02,
  },
  statsContainer: {
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.01,
  },
  statsCard: {
    width: width * 0.28,
    height: height * 0.13,
    borderRadius: 15,
    marginRight: width * 0.03,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.02,
  },
  statsCardTitle: {
    color: "white",
    marginTop: height * 0.01,
    fontSize: width * 0.03,
    textAlign: "center",
  },
  statsCardValue: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  statsCardValueContact: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.032,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#FF5757",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.015,
    borderRadius: 10,
    marginHorizontal: width * 0.01,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    marginLeft: width * 0.02,
    fontSize: width * 0.03,
  },
  chartSection: {
    marginTop: height * 0.02,
    alignItems: "center",
  },
  chartToggle: {
    flexDirection: "row",
    marginBottom: height * 0.02,
  },
  chartToggleButton: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
  },
  activeChartToggle: {
    backgroundColor: "#FF5757",
  },
  chartToggleText: {
    fontSize: width * 0.035,
    color: "#fff",
  },
  chart: {
    marginVertical: height * 0.02,
    borderRadius: 16,
  },
  finalActionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  finalActionButton: {
    flexDirection: "row",
    backgroundColor: "#FF5757",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderRadius: 10,
    marginHorizontal: width * 0.02,
    alignItems: "center",
  },
  finalActionButtonText: {
    color: "white",
    marginLeft: width * 0.02,
    fontSize: width * 0.03,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonMessage: {
    position: "absolute",
    right: width * 0.03,
    top: width * 0.03,
    padding: width * 0.02,
    color: "#FF5757",
  },
  messageInput: {
    width: "100%",
    height: height * 0.15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.015,
    borderRadius: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: width * 0.04,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: 20,
    padding: width * 0.05,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  modalScrollContent: {
    paddingBottom: height * 0.02,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalRowText: {
    fontSize: width * 0.035,
  },
  modalRowTextBold: {
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  modalRowTextSub: {
    fontSize: width * 0.03,
    color: "#666",
  },
  paidText: {
    color: "green",
  },
  unpaidText: {
    color: "red",
  },
  workoutCard: {
    marginBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  workoutCardTitle: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginBottom: height * 0.01,
  },
  exerciseDetailContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalSubtitle: {
    fontSize: width * 0.04,
    color: "#666",
    marginBottom: height * 0.02,
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: 20,
    padding: width * 0.05,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  modalScrollContent: {
    paddingBottom: height * 0.02,
  },
  modalRow: {
    flexDirection: "column",
    paddingVertical: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalRowText: {
    fontSize: width * 0.035,
    color: "#333",
  },
  modalRowTextBold: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#000",
  },
  modalRowTextSub: {
    fontSize: width * 0.033,
    color: "#666",
  },
  variantTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginVertical: height * 0.01,
    color: "#FF5757",
  },
  dayTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginVertical: height * 0.01,
    color: "#4169E1",
  },
  dietVariantSection: {
    marginBottom: height * 0.02,
  },
  workoutDaySection: {
    marginBottom: height * 0.02,
  },
  closeButton: {
    marginTop: height * 0.02,
    backgroundColor: "#FF5757",
    padding: width * 0.03,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  exerciseDetailContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: height * 0.005,
  },
});

export default ClientPage;
