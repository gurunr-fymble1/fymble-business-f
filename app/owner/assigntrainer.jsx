import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TextInput,
  StatusBar,
  FlatList,
  Modal,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  assignTrainerAPI,
  getAsssignmentsAPI,
  getPlansandBatchesAPI,
} from "../../services/Api";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";

import AssignPageSkeleton from "../../components/ui/loaders/assignPageSkeleton";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import WorkoutCard from "../../components/ui/WorkoutCard";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");
const COLORS = {
  primary: "#4A90E2",
  secondary: "#FF5757",
  background: "#F7F9FC",
  text: "#2C3E50",
  white: "#FFFFFF",
  gray: "#BDC3C7",
  success: "#2ECC71",
  disabled: "#95A5A6",
};

const AssignTrainerScreen = () => {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [assignmentType, setAssignmentType] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [assignmentMode, setAssignmentMode] = useState("batch");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedTrainingType, setSelectedTrainingType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState("owner");

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    setSelectedItem("");
    setSelectedBatch("");
    setSelectedClients([]);
    setSelectedTrainingType("");
    setAssignmentMode(type === "trainer" ? "batch" : "client");
  };

  const handleAssignClients = () => {
    if (!selectedItem) {
      showToast({
        type: "error",
        title: `Please select a ${assignmentType}!`,
      });
      return;
    }

    let assignedClients = [];
    if (assignmentMode === "batch" && assignmentType === "trainer") {
      if (!selectedBatch) {
        showToast({
          type: "error",
          title: "Please select a batch!",
        });
        return;
      }
      assignedClients = clients.filter(
        (client) => client.batch === selectedBatch,
      );
    } else if (assignmentMode === "client") {
      if (selectedClients.length === 0) {
        showToast({
          type: "error",
          title: "Please select at least one client!",
        });
        return;
      }
      assignedClients = clients.filter((client) =>
        selectedClients.includes(client.id),
      );
    } else if (assignmentMode === "training") {
      if (!selectedTrainingType) {
        showToast({
          type: "error",
          title: "Please select a training type!",
        });
        return;
      }
      assignedClients = clients.filter(
        (client) => client.trainingType === selectedTrainingType,
      );
    }

    setIsConfirmModalVisible(true);
  };

  const filteredClients = useMemo(() => {
    const searchTerm = searchQuery.toLowerCase().trim();
    return searchTerm
      ? clients.filter((client) =>
          client.name.toLowerCase().includes(searchTerm),
        )
      : clients;
  }, [clients, searchQuery]);

  const handleClientSelection = useCallback((clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((client_id) => client_id !== clientId)
        : [...prev, clientId],
    );
  }, []);

  const renderSelector = () => {
    const items =
      assignmentType === "trainer"
        ? trainers?.map((t) => ({
            label: `${t.full_name} (${t?.specialization})`,
            value: t.trainer_id,
          }))
        : assignmentType === "workout"
          ? workoutPlans?.map((w) => ({ label: `${w.name}`, value: w.id }))
          : dietPlans?.map((d) => ({
              label: `${d.template_name}`,
              value: d.template_id,
            }));

    return (
      <View style={styles.section}>
        <Text style={styles.label}>{`Select ${
          assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)
        }`}</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            value={selectedItem}
            onValueChange={(value) => setSelectedItem(value)}
            pickerProps={{
              itemStyle: {
                color: "#000000",
              },
            }}
            style={{
              inputIOS: styles.picker,
              inputAndroid: styles.picker,
            }}
            placeholder={{
              label: `Select a ${assignmentType}`,
              value: null,
              color: "#9EA0A4",
            }}
            items={items}
          />
        </View>
      </View>
    );
  };

  const renderClientItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={[
          styles.clientItem,
          selectedClients.includes(item.client_id) && styles.clientSelected,
        ]}
        onPress={() => handleClientSelection(item.client_id)}
      >
        <View style={styles.clientItemContent}>
          <View style={styles.contentWrapper}>
            {/* First Row */}
            <View style={styles.nameTrainerRow}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.clientText,
                  selectedClients.includes(item.client_id) &&
                    styles.clientTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </View>

            <View style={styles.plansRow}>
              {assignmentType === "trainer" && (
                <View style={styles.trainerContainer}>
                  <Ionicons name="person" size={16} color={COLORS.gray} />
                  <Text style={styles.clientBatchText}>
                    {item.assigned_trainer ? item.assigned_trainer : "None"}
                  </Text>
                </View>
              )}
              {assignmentType === "workout" && (
                <View style={styles.planContainer}>
                  <Ionicons name="barbell" size={16} color={COLORS.gray} />
                  <Text style={styles.clientBatchText}>
                    {item.assigned_workoutplan
                      ? item.assigned_workoutplan
                      : "None"}
                  </Text>
                </View>
              )}
              {assignmentType === "diet" && (
                <View style={styles.planContainer}>
                  <Ionicons name="nutrition" size={16} color={COLORS.gray} />
                  <Text style={styles.clientBatchText}>
                    {item.assigned_dietplan ? item.assigned_dietplan : "None"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [selectedClients, handleClientSelection],
  );

  const ConfirmationModal = () => {
    const confirmAssignment = async () => {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }
      const initialPayload = {
        method: assignmentType,
        gym_id: gymId,
      };
      let payload;
      if (assignmentType === "trainer" && assignmentMode === "batch") {
        payload = {
          ...initialPayload,
          trainer_id: selectedItem,
          batch_id: selectedBatch,
        };
      }
      if (assignmentType === "trainer" && assignmentMode === "client") {
        payload = {
          ...initialPayload,
          trainer_id: selectedItem,
          client_ids: selectedClients,
        };
      }
      if (assignmentType === "trainer" && assignmentMode === "training") {
        payload = {
          ...initialPayload,
          trainer_id: selectedItem,
          training_id: selectedTrainingType,
        };
      }
      if (assignmentType === "workout" && assignmentMode === "client") {
        payload = {
          ...initialPayload,
          workout_id: selectedItem,
          client_ids: selectedClients,
        };
      }
      if (assignmentType === "workout" && assignmentMode === "training") {
        payload = {
          ...initialPayload,
          workout_id: selectedItem,
          training_id: selectedTrainingType,
        };
      }
      if (assignmentType === "diet" && assignmentMode === "client") {
        payload = {
          ...initialPayload,
          diet_id: selectedItem,
          client_ids: selectedClients,
        };
      }
      if (assignmentType === "diet" && assignmentMode === "training") {
        payload = {
          ...initialPayload,
          diet_id: selectedItem,
          training_id: selectedTrainingType,
        };
      }

      try {
        const response = await assignTrainerAPI(payload);
        if (response?.status === 200) {
          showToast({
            type: "success",
            title: `Assignment successful`,
          });
          setSelectedItem("");
          setSelectedClients([]);
          setSelectedBatch("");
          setSelectedTrainingType("");
          setIsConfirmModalVisible(false);
          setAssignmentMode("batch");
          setAssignmentType("");
          await fetchAssignments();
          await fetchPlansAndBatches();
        } else {
          showToast({
            type: "error",
            title: response?.detail || `Failed to assign ${assignmentType}`,
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong .Please try again later",
        });
      }
    };

    return (
      <Modal
        transparent={true}
        visible={isConfirmModalVisible}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Assignment</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to assign clients to{" "}
                <Text style={styles.highlightText}>
                  {assignmentType === "trainer"
                    ? trainers?.find((t) => t.trainer_id === selectedItem)
                        ?.full_name
                    : assignmentType === "workout"
                      ? workoutPlans?.find((w) => w.id === selectedItem)?.name
                      : dietPlans?.find((d) => d.template_id === selectedItem)
                          ?.template_name}
                </Text>
                ?
              </Text>
              <View style={styles.modalAssignmentDetails}>
                <Text style={styles.modalDetailText}>
                  Type:{" "}
                  <Text style={styles.highlightText}>
                    {assignmentType.charAt(0).toUpperCase() +
                      assignmentType.slice(1)}
                  </Text>
                </Text>

                <Text style={styles.modalDetailText}>
                  Assignment Mode:{" "}
                  <Text style={styles.highlightText}>
                    {assignmentMode === "batch"
                      ? "Batch-wise"
                      : assignmentMode === "client"
                        ? "Client-wise"
                        : "Training-wise"}
                  </Text>
                </Text>

                {assignmentType === "trainer" && assignmentMode === "batch" && (
                  <Text style={styles.modalDetailText}>
                    Batch:{" "}
                    <Text style={styles.highlightText}>
                      {
                        batches.find((batch) => batch.id === selectedBatch)
                          ?.batch_name
                      }
                    </Text>
                  </Text>
                )}

                {assignmentMode === "training" && (
                  <Text style={styles.modalDetailText}>
                    Training Type:{" "}
                    <Text style={styles.highlightText}>
                      {
                        plans.find((plan) => plan.id === selectedTrainingType)
                          ?.plans
                      }
                    </Text>
                  </Text>
                )}

                {assignmentMode === "client" && (
                  <Text style={styles.modalDetailText}>
                    Selected Clients:{" "}
                    <Text style={styles.highlightText}>
                      {selectedClients.length}
                    </Text>
                  </Text>
                )}
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsConfirmModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmAssignment}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    );
  };

  const keyExtractor = useCallback((item) => item.client_id.toString(), []);

  const renderClientList = () => (
    <View style={styles.clientListContainer}>
      <TextInput
        placeholder="Search clients..."
        placeholderTextColor={COLORS.gray}
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.clientScrollView}
        showsVerticalScrollIndicator={true}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews={true}
        initialNumToRender={20}
        getItemLayout={(data, index) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
        style={styles.clientFlatList}
      />
    </View>
  );

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error fetching Assignments",
        });
        return;
      }
      const response = await getAsssignmentsAPI(gymId);
      if (response?.status === 200) {
        setTrainers(response.data?.trainers);
        setClients(response.data?.clients);
        setWorkoutPlans(response.data?.workouts);
        setDietPlans(response.data?.diets);
      } else {
        showToast({
          type: "error",
          title: "Error fetching assignments",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching Assignments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssignments();
      fetchPlansAndBatches();
      getToken("role").then((role) => {
        setRole(role);
      });
    }, []),
  );

  const fetchPlansAndBatches = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Error fetching plans and batches",
        });
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);
      if (response?.status === 200) {
        setPlans(response.data.plans);
        setBatches(response.data.batches);
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
        title: "Error fetching plans and batches",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderNoDataView = (type, route) => {
    const icons = {
      trainer: "person",
      workout: "barbell-outline",
      diet: "nutrition-outline",
    };

    return (
      <View style={styles.noFeedContainer}>
        <Text style={styles.headerTitle}>Assign Trainers, Diet, Workout.</Text>
        <MaterialCommunityIcons
          name={icons[type] || "account-group-outline"}
          size={80}
          color="#CBD5E0"
        />

        <Text style={styles.noFeedTitle}>
          No {type.charAt(0).toUpperCase() + type.slice(1)}s Available
        </Text>

        <Text style={styles.noFeedSubtitle}>
          Add {type}s to assign them to clients.
        </Text>

        <TouchableOpacity
          style={styles.noFeedRefreshButton}
          onPress={() => router.push(route)}
        >
          <MaterialCommunityIcons
            name={icons[type] || "account-group-outline"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.noFeedButtonText}>
            Add {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleButtonPress = (type) => {
    const isDisabled =
      (type === "trainer" && trainers.length === 0) ||
      (type === "workout" && workoutPlans.length === 0) ||
      (type === "diet" && dietPlans.length === 0);

    if (isDisabled) {
      Alert.alert(
        `No ${type} available`,
        `You don't have any ${type}s added yet.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add",
            onPress: () => {
              if (type === "trainer") {
                router.push("/owner/trainerform");
              } else if (type === "workout") {
                router.push("/owner/workout_schedule");
              } else {
                router.push("/owner/diet");
              }
            },
          },
        ],
      );
    } else {
      handleAssignmentTypeChange(type);
    }
  };

  if (isLoading) {
    return <AssignPageSkeleton />;
  }

  if (clients.length === 0) {
    return (
      <>
        <View style={{ flex: 1 }}>
          <HardwareBackHandler routePath="/owner/home" enabled={true} />

          <NewOwnerHeader
            onBackButtonPress={() => router.push("/owner/home")}
            text={"Assignments"}
          />

          <View style={styles.noFeedContainer}>
            <Text style={styles.headerTitle}>
              Assign Trainers, Diet, Workout.
            </Text>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={80}
              color="#CBD5E0"
            />

            <Text style={styles.noFeedTitle}>No Clients to Assign</Text>

            <Text style={styles.noFeedSubtitle}>Add Clients to Assign.</Text>

            <TouchableOpacity
              style={styles.noFeedRefreshButton}
              onPress={() => router.push("/owner/clientform")}
            >
              <MaterialCommunityIcons
                name="account-group-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.noFeedButtonText}>Add Clients</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (assignmentType === "trainer" && trainers.length === 0) {
    return (
      <>
        <NewOwnerHeader />
        {renderNoDataView("trainer", "/owner/trainerform")}
      </>
    );
  }

  if (assignmentType === "workout" && workoutPlans.length === 0) {
    return (
      <>
        <NewOwnerHeader />
        {renderNoDataView("workout", "/owner/workout_schedule")}
      </>
    );
  }

  if (assignmentType === "diet" && dietPlans.length === 0) {
    return (
      <>
        <NewOwnerHeader />
        {renderNoDataView("diet", "/owner/diet")}
      </>
    );
  }

  if (isLoading) {
    return <AssignPageSkeleton />;
  }

  return (
    // <ScrollView>

    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      {/* <OwnerHeader /> */}
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Select the type of assignment"}
      />

      <View style={styles.selectionButtonsContainer}>
        {role !== "trainer" && (
          <WorkoutCard
            title={"Trainer"}
            subtitle={
              "Assign trainers instantly to your gym clients and help them achieve their fitness goals effectively."
            }
            imagePath={require("../../assets/images/trainer.png")}
            buttonText="Assign"
            onPress={() => router.push("/owner/assigntrainerpage")}
            // onPress={() => setActiveSection('manual')}
            textColor={"#000000"}
            paraTextColor={"#00000081"}
            buttonTextColor={"#62D2D3"}
            bg1={"#F7F7F7"}
            bg2={"#F7F7F7"}
            border1={"#28a74629"}
            border2={"#297eb32f"}
            charWidth={110}
            // filteredFoods={filteredFoods}
          />
        )}

        <WorkoutCard
          title={"Workout"}
          subtitle={
            "Assign Personalised Workout Plans to your gym clients to track their fitness progress seamlessly."
          }
          imagePath={require("../../assets/images/workout_plans.png")}
          buttonText="Assign"
          onPress={() =>
            router.push({
              pathname: "/owner/assignworkoutpage",
              params: { method: "personal" },
            })
          }
          // onPress={() => setActiveSection('template')}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#62D2D3"}
          bg1={"#F7F7F7"}
          bg2={"#F7F7F7"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={120}
        />

        <WorkoutCard
          title={"Diet"}
          subtitle={
            "Assign Personalised Diets Plans to your gym clients to track their fitness progress seamlessly."
          }
          imagePath={require("../../assets/images/diet_plans.png")}
          buttonText="Assign"
          onPress={() => router.push("/owner/assigndietpage")}
          // onPress={() => setActiveSection('template')}
          textColor={"#000000"}
          paraTextColor={"#00000081"}
          buttonTextColor={"#62D2D3"}
          bg1={"#F7F7F7"}
          bg2={"#F7F7F7"}
          border1={"#28a74629"}
          border2={"#297eb32f"}
          charWidth={120}
          charHeight={120}
        />
      </View>
    </View>
    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.02,
  },
  headerGradient: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
    width: "100%",
    marginVertical: 15,
  },
  selectionButtonsContainer: {
    padding: width * 0.04,
    marginTop: 10,
  },
  section: {
    marginBottom: height * 0.025,
  },
  label: {
    fontSize: width * 0.04,
    fontWeight: "600",
    marginBottom: 10,
    color: COLORS.text,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    width: "100%",
    height: height * 0.07,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF5757",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  radioSelected: {
    borderColor: "#FF5757",
    backgroundColor: "#FF5757" + "100",
  },
  radioText: {
    fontSize: width * 0.03,
    color: COLORS.text,
    textAlign: "center",
  },
  radioTextSelected: {
    color: "#000",
    fontWeight: "bold",
  },
  clientListContainer: {
    // height: height * 0.5,
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },

  searchInput: {
    margin: 10,
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    fontSize: width * 0.04,
  },
  clientScrollView: {
    paddingBottom: 20,
  },
  clientItem: {
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  clientItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clientSelected: {
    backgroundColor: COLORS.secondary + "20",
    borderColor: COLORS.secondary,
  },
  clientText: {
    fontSize: width * 0.04,
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  clientBatchText: {
    fontSize: width * 0.035,
    color: COLORS.gray,
    marginHorizontal: 10,
  },
  clientTextSelected: {
    color: COLORS.secondary,
    fontWeight: "bold",
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: width * 0.055,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: width * 0.04,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 15,
  },
  modalAssignmentDetails: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalDetailText: {
    fontSize: width * 0.035,
    color: COLORS.text,
    marginVertical: 5,
  },
  highlightText: {
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.gray + "20",
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  assignmentTypeContainer: {
    marginBottom: height * 0.025,
  },
  clientItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 5,
  },
  contentWrapper: {
    flex: 1,
  },
  nameTrainerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  trainerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  plansRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  planContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  safeContainer: {},
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  noFeedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A5568",
    marginTop: 16,
    marginBottom: 8,
  },
  noFeedSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 250,
  },
  noFeedRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noFeedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  headerTitle: {
    color: "#007AFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});

export default AssignTrainerScreen;
