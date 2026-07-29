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

import { useFocusEffect } from "@react-navigation/native";

import AssignPageSkeleton from "../../components/ui/loaders/assignPageSkeleton";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import WorkoutCard from "../../components/ui/WorkoutCard";
import SearchBar from "../../components/home/newbies/SearchBar";
import { Image } from "expo-image";
import { showToast } from "../../utils/Toaster";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const COLORS = {
  primary: "#4A90E2",
  secondary: "#007AFF",
  background: "#F7F9FC",
  text: "#2C3E50",
  white: "#FFFFFF",
  gray: "#BDC3C7",
  success: "#2ECC71",
  disabled: "#95A5A6",
};

const assignworkoutpage = () => {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [assignmentType, setAssignmentType] = useState("workout");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [assignmentMode, setAssignmentMode] = useState("workout");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedTrainingType, setSelectedTrainingType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
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
        (client) => client.batch === selectedBatch
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
        selectedClients.includes(client.id)
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
        (client) => client.trainingType === selectedTrainingType
      );
    }

    setIsConfirmModalVisible(true);
  };

  const filteredClients = useMemo(() => {
    const searchTerm = searchQuery.toLowerCase().trim();
    return searchTerm
      ? clients.filter((client) =>
          client.name.toLowerCase().includes(searchTerm)
        )
      : clients;
  }, [clients, searchQuery]);

  const handleClientSelection = useCallback((clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((client_id) => client_id !== clientId)
        : [...prev, clientId]
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
            style={pickerSelectStyles}
            placeholder={{
              label: `Select a ${assignmentType}`,
              value: null,
            }}
            items={items}
            Icon={() => (
              <Ionicons name="chevron-down" size={20} color="#666666" />
            )}
            useNativeAndroidPickerStyle={false}
            fixAndroidTouchableBug={true}
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

            <View style={{ display: "flex", flexDirection: "row" }}>
              <Image
                source={
                  item?.profile ||
                  require("../../assets/images/assignment/client_1.png")
                }
                height={30}
                width={30}
                style={{ borderRadius: 15 }}
              />
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
                <Text style={styles.clientId}>{item?.gym_client_id}</Text>
              </View>
            </View>

            <View style={styles.plansRow}>
              {assignmentType === "trainer" && (
                <View style={styles.trainerContainer}>
                  <Ionicons name="person" size={14} color={COLORS.gray} />
                  <Text style={styles.clientBatchText}>
                    {item.assigned_trainer ? item.assigned_trainer : "None"}
                  </Text>
                </View>
              )}
              {assignmentType === "workout" && (
                <View style={styles.planContainer}>
                  <Ionicons name="barbell" size={14} color={COLORS.gray} />
                  <Text style={styles.clientBatchText}>
                    {item.assigned_workoutplan
                      ? item.assigned_workoutplan
                      : "None"}
                  </Text>
                </View>
              )}
              {assignmentType === "diet" && (
                <View style={styles.planContainer}>
                  <Ionicons name="nutrition" size={14} color={COLORS.gray} />
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
    [selectedClients, handleClientSelection]
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
          //   setAssignmentMode('batch');
          //   setAssignmentType('');
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
      {/* <TextInput
        placeholder="Search clients..."
        placeholderTextColor={COLORS.gray}
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      /> */}
      <SearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        showFilter={false}
        // onPress={() => setFilterModalVisible(!filterModalVisible)}
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
          title: "GymId is not available",
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
    }, [])
  );

  const fetchPlansAndBatches = async () => {
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
      workout: "dumbbell",
      diet: "nutrition-outline",
    };

    return (
      <View style={styles.noFeedContainer}>
        <Text style={styles.headerTitle}>Assign {type}.</Text>
        <MaterialCommunityIcons
          name={icons[type] || "account-group-outline"}
          size={80}
          color="#CBD5E0"
        />

        <Text style={styles.noFeedTitle}>
          No {type.charAt(0).toUpperCase() + type.slice(1)} templates Available
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
        ]
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
        <NewOwnerHeader />
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
      </>
    );
  }

  if (assignmentType === "trainer" && trainers.length === 0) {
    return (
      <>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/assigntrainer")}
          text={"Assign Workout"}
        />
        {renderNoDataView("trainer", "/owner/trainerform")}
      </>
    );
  }

  if (assignmentType === "workout" && workoutPlans.length === 0) {
    return (
      <>
        <HardwareBackHandler routePath="/owner/assigntrainer" enabled={true} />

        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/assigntrainer")}
          text={"Assign Workout"}
        />
        {renderNoDataView("workout", "/owner/(workout)/personalTemplate")}
      </>
    );
  }

  if (assignmentType === "diet" && dietPlans.length === 0) {
    return (
      <>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/assigntrainer")}
          text={"Assign Workout"}
        />
        {renderNoDataView("diet", "/owner/diet")}
      </>
    );
  }

  if (
    !assignmentType &&
    trainers.length === 0 &&
    workoutPlans.length === 0 &&
    dietPlans.length === 0
  ) {
    return (
      <>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/assigntrainer")}
          text={"Assign Workout"}
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

          <Text style={styles.noFeedTitle}>Nothing to Assign</Text>

          <Text style={styles.noFeedSubtitle}>
            You need to add at least one trainer, workout plan, or diet plan
            before making assignments.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.noFeedRefreshButton, { marginBottom: 10 }]}
              onPress={() => router.push("/owner/trainerform")}
            >
              <MaterialCommunityIcons
                name="account-tie"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.noFeedButtonText}>Add Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.noFeedRefreshButton, { marginBottom: 10 }]}
              onPress={() => router.push("/owner/workout_schedule")}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.noFeedButtonText}>Add Workout Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noFeedRefreshButton}
              onPress={() => router.push("/owner/diet")}
            >
              <MaterialCommunityIcons
                name="food-apple"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.noFeedButtonText}>Add Diet Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (isLoading) {
    return <AssignPageSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler routePath="/owner/assigntrainer" enabled={true} />

      {/* <OwnerHeader /> */}
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/assigntrainer")}
        text={"Assign Workout"}
      />

      <View style={styles.scrollContainer}>
        {assignmentType && (
          <>
            {renderSelector()}

            {assignmentType === "trainer" && (
              <View style={styles.section}>
                <Text style={styles.label}>Assignment Mode</Text>
                <View style={styles.radioGroup}>
                  {["batch", "client", "training"].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={styles.radioButton}
                      onPress={() => setAssignmentMode(mode)}
                    >
                      {assignmentMode === mode ? (
                        <LinearGradient
                          colors={["#030A15", "#0154A0"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.radioSelected}
                        >
                          <Text style={styles.radioTextSelected}>
                            {mode === "batch"
                              ? "Batch-wise"
                              : mode === "client"
                              ? "Client-wise"
                              : "Training-wise"}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.radioInactive}>
                          <Text style={styles.radioText}>
                            {mode === "batch"
                              ? "Batch-wise"
                              : mode === "client"
                              ? "Client-wise"
                              : "Training-wise"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {assignmentType !== "trainer" && (
              <View style={styles.section}>
                <Text style={styles.label}>Assignment Mode</Text>
                <View style={styles.radioGroup}>
                  {["client", "training"].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={styles.radioButton}
                      onPress={() => setAssignmentMode(mode)}
                    >
                      {assignmentMode === mode ? (
                        <LinearGradient
                          colors={["#030A15", "#0154A0"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.radioSelected}
                        >
                          <Text style={styles.radioTextSelected}>
                            {mode === "client"
                              ? "Client-wise"
                              : "Training-wise"}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.radioInactive}>
                          <Text style={styles.radioText}>
                            {mode === "client"
                              ? "Client-wise"
                              : "Training-wise"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {assignmentMode === "batch" && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Batch</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    value={selectedBatch}
                    onValueChange={(value) => setSelectedBatch(value)}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select a batch",
                      value: null,
                    }}
                    items={batches.map((batch) => ({
                      label: batch.batch_name,
                      value: batch.id,
                    }))}
                    Icon={() => (
                      <Ionicons name="chevron-down" size={20} color="#666666" />
                    )}
                    useNativeAndroidPickerStyle={false}
                    fixAndroidTouchableBug={true}
                  />
                </View>
              </View>
            )}
            {assignmentMode === "client" && renderClientList()}

            {assignmentMode === "training" && (
              <View style={styles.section}>
                <Text style={styles.label}>Select Plan</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    value={selectedTrainingType}
                    onValueChange={(value) => setSelectedTrainingType(value)}
                    pickerProps={{
                      itemStyle: {
                        color: "#000000",
                      },
                    }}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select plan type",
                      value: null,
                    }}
                    items={plans.map((plan) => ({
                      label: plan.plans,
                      value: plan.id,
                    }))}
                    Icon={() => (
                      <Ionicons name="chevron-down" size={20} color="#666666" />
                    )}
                    useNativeAndroidPickerStyle={false}
                    fixAndroidTouchableBug={true}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!selectedItem ||
                  (assignmentMode === "batch" &&
                    !selectedBatch &&
                    assignmentType === "trainer") ||
                  (assignmentMode === "client" &&
                    selectedClients.length === 0) ||
                  (assignmentMode === "training" && !selectedTrainingType)) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleAssignClients}
              disabled={
                !selectedItem ||
                (assignmentMode === "batch" &&
                  !selectedBatch &&
                  assignmentType === "trainer") ||
                (assignmentMode === "client" && selectedClients.length === 0) ||
                (assignmentMode === "training" && !selectedTrainingType)
              }
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.secondary]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  Assign{" "}
                  {assignmentType.charAt(0).toUpperCase() +
                    assignmentType.slice(1)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
      <ConfirmationModal />
    </View>
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
    // marginBottom: height * 0.025,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    // fontWeight: '600',
    marginBottom: 10,
    color: COLORS.text,
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  radioButton: {
    flex: 1,
  },
  radioSelected: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  radioInactive: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  radioText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  radioTextSelected: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
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
    marginTop: 15,
    paddingHorizontal: 10,
  },

  searchInput: {
    margin: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    fontSize: 12,
  },
  clientScrollView: {
    paddingBottom: 20,
  },
  clientItem: {
    padding: 10,
    marginVertical: 5,
    // marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 10,
    backgroundColor: "#fff",
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
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    // marginRight: 10,
  },
  clientBatchText: {
    fontSize: 12,
    color: "#404040",
    marginHorizontal: 10,
  },
  clientTextSelected: {
    color: COLORS.secondary,
    fontWeight: "bold",
  },
  button: {
    marginTop: 20,
    // borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
    // width: '50%',
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
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
    color: "#007AFF",
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
    // padding: 5,
  },
  contentWrapper: {
    // flex: 1,
    // backgroundColor: 'pink',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  nameTrainerRow: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingLeft: 10,
  },
  clientId: {
    fontSize: 10,
    color: "rgba(64, 64, 64, 0.518)",
  },
  trainerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  plansRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // width: '100%',
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
    backgroundColor: "#4299E1",
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
    color: "#4299E1",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 12,
    color: "#2C3E50",
    paddingRight: 40, // Ensure text doesn't overlap with icon
    backgroundColor: "transparent",
    minHeight: 45,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0, // Remove border since container already has it
    borderRadius: 12,
    color: "#2C3E50",
    paddingRight: 40,
    backgroundColor: "transparent",
  },
  placeholder: {
    color: "#9EA0A4",
    fontSize: 14,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 15 : 12,
    right: 15,
  },
});

export default assignworkoutpage;
