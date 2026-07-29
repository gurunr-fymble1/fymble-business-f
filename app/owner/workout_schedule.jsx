import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/MaterialIcons";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { Alert } from "react-native";
import {
  addWorkoutTemplateAPI,
  deleteWorkoutTemplateAPI,
  editAllWorkoutTemplateAPI,
  editWorkoutTemplateAPI,
  getWorkoutTemplateAPI,
} from "../../services/Api";
import * as SecureStore from "expo-secure-store";

import WorkoutScheduleSkeleton from "../../components/ui/loaders/workoutScheduleSkeleton";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Arms",
  "Shoulders",
  "Abs",
  "Glutes",
  "Calves",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WorkoutTracker = () => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [hasSavedExercises, setHasSavedExercises] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroups: [],
    sets: [],
  });
  const [currentDay, setCurrentDay] = useState("");
  const [currentSet, setCurrentSet] = useState({ reps: "", weight: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editTemp, setEditTemp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const PRIMARY_COLOR = "#FF5757";
  const toggleMuscleGroup = (group) => {
    setNewExercise((prev) => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(group)
        ? prev.muscleGroups.filter((g) => g !== group)
        : [...prev.muscleGroups, group],
    }));
  };

  const addSet = () => {
    const reps = parseInt(currentSet.reps);
    const weight = parseFloat(currentSet.weight);

    if (!isNaN(reps) && !isNaN(weight) && reps > 0 && weight >= 0) {
      setTimeout(() => {
        setNewExercise((prev) => ({
          ...prev,
          sets: [...prev.sets, { reps, weight }],
        }));

        setCurrentSet({ reps: "", weight: "" });
      }, 100);
    } else {
      showToast({
        type: "error",
        title: "Please enter valid reps and weight values",
      });
    }
  };

  const saveExercise = () => {
    if (
      !currentDay ||
      !newExercise.name ||
      newExercise.muscleGroups.length === 0
    ) {
      showToast({
        type: "error",
        title: "Please fill in all exercise details",
      });
      return;
    }

    setWorkoutPlan((prev) => {
      const updatedPlan = { ...prev };
      if (!updatedPlan[currentDay]) {
        updatedPlan[currentDay] = [];
      }

      if (editingIndex !== null) {
        updatedPlan[currentDay][editingIndex] = newExercise;
      } else {
        updatedPlan[currentDay].push(newExercise);
      }
      return updatedPlan;
    });

    setHasSavedExercises(true);
    setExerciseModal(false);
    setNewExercise({ name: "", muscleGroups: [], sets: [] });
    setCurrentDay("");
    setEditingIndex(null);
  };

  const saveAllExercises = async () => {
    if (Object.keys(workoutPlan).length === 0) {
      showToast({
        type: "error",
        title: "Please add at least one exercise",
      });
      return;
    }
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const payload = {
        workoutPlan,
        id: currentTemplate.id,
        gym_id: gymId,
      };
      const response = await editWorkoutTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "All exercises saved successfully",
        });
        getTemplates();
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
        title: "Something went wrong, please try again.",
      });
    }
  };

  const getTemplates = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getWorkoutTemplateAPI(gymId);
      if (response?.status === 200) {
        setTemplates(response?.data);
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
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim()) {
      showToast({
        type: "error",
        title: "Please enter a template name",
      });
      return;
    }
    const gymId = await getToken("gym_id");

    if (!gymId) {
      showToast({
        type: "error",
        title: "GymId is not available",
      });
      return;
    }
    const payload = {
      name: templateName,
      workoutPlan: {},
      gym_id: gymId,
    };

    try {
      const response = await addWorkoutTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response?.message,
        });
        getTemplates();
        setModalVisible(false);
        setTemplateName("");
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
        title: "Something went wrong, please try again.",
      });
    }
  };

  const deleteTemplate = async (id) => {
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await deleteWorkoutTemplateAPI(id, gym_id);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Template deleted successfully",
        });
        setDeleteId(null);
        getTemplates();
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
        title: "Something went wrong, please try again.",
      });
    }
  };

  const showDeleteAlert = (id) => {
    setDeleteId(id);
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this template?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setDeleteId(null),
        },
        {
          text: "Delete",
          onPress: () => deleteTemplate(id),
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  const editTemplate = (template) => {
    setEditId(template.id);
    setEditTemp(template.name);
    setEditModal(true);
  };

  const editExercise = (day, index) => {
    const exercise = workoutPlan[day][index];
    setNewExercise(exercise);
    setCurrentDay(day);
    setEditingIndex(index);
    setExerciseModal(true);
  };

  const deleteExercise = (day, index) => {
    setWorkoutPlan((prev) => {
      const updatedPlan = { ...prev };
      updatedPlan[day].splice(index, 1);

      if (updatedPlan[day].length === 0) {
        delete updatedPlan[day];
      }
      return updatedPlan;
    });
  };

  const renderTemplatesList = () => {
    if (templates.length === 0) {
      return (
        <View style={styles.noTemplatesContainer}>
          <Icon name="playlist-add" size={64} color="#cccccc" />
          <Text style={styles.noTemplatesText}>No workout templates found</Text>
          <Text style={styles.noTemplatesSubtext}>
            Tap the "New Template" button to create your first workout plan
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: "#FF5757", marginTop: height * 0.02 },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Create First Template</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.screenTitle}>Workout Templates</Text>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateButton}
            onPress={() => {
              setCurrentTemplate(template);
              setWorkoutPlan(template.workoutPlan || {});
              setHasSavedExercises(
                Object.keys(template.workoutPlan || {}).length > 0,
              );
            }}
          >
            <Text style={styles.templateButtonText}>{template.name}</Text>
            <View style={styles.actionTemplates}>
              <TouchableOpacity onPress={() => editTemplate(template)}>
                <Icon name="edit" size={20} color="#dc3545" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => showDeleteAlert(template.id)}>
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>New Template</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderWorkoutPlan = () => {
    if (Object.keys(workoutPlan).length === 0) {
      return (
        <View style={styles.noExercisesContainer}>
          <Icon name="fitness-center" size={64} color="#cccccc" />
          <Text style={styles.noExercisesText}>No exercises found</Text>
          <Text style={styles.noExercisesSubtext}>
            Tap the "Add Exercise" button to get started
          </Text>
        </View>
      );
    }

    return Object.entries(workoutPlan).map(([day, exercises]) => (
      <View key={day} style={styles.dayContainer}>
        <Text style={styles.dayTitle}>{day}</Text>
        {exercises?.map((exercise, index) => (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.exerciseActions}>
                <TouchableOpacity onPress={() => editExercise(day, index)}>
                  <Icon name="edit" size={20} color={PRIMARY_COLOR} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteExercise(day, index)}>
                  <Icon name="delete" size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.muscleGroups}>
              Muscle Groups: {exercise.muscleGroups.join(", ")}
            </Text>
            {exercise.sets.map((set, setIndex) => (
              <Text key={setIndex} style={styles.setDetails}>
                Set {setIndex + 1}: {set.reps} reps @ {set.weight} kg
              </Text>
            ))}
          </View>
        ))}
      </View>
    ));
  };

  const editNow = async () => {
    if (!editTemp.trim()) {
      showToast({
        type: "error",
        title: "Please enter a template name",
      });
      return;
    }

    try {
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const payload = {
        id: editId,
        name: editTemp,
        gym_id: gymId,
      };
      const response = await editAllWorkoutTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Template updated successfully",
        });
        getTemplates();
        setEditId(null);
        setEditTemp(null);
        setEditModal(false);
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
        title: "Something went wrong, please try again.",
      });
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);
  if (isLoading) {
    return <WorkoutScheduleSkeleton />;
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* <OwnerHeader /> */}
      {!currentTemplate ? (
        <ScrollView>{renderTemplatesList()}</ScrollView>
      ) : (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => setCurrentTemplate(null)}>
              <Icon name="arrow-back" size={24} color="#FF5757" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>{currentTemplate.name}</Text>
          </View>

          <ScrollView>{renderWorkoutPlan()}</ScrollView>
          {hasSavedExercises && (
            <TouchableOpacity
              style={[styles.saveAllButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={saveAllExercises}
            >
              <Icon name="save" size={24} color="white" />
              <Text style={styles.addButtonText}>Save All Exercises</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setExerciseModal(true)}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Template</Text>
            <TextInput
              style={styles.input}
              placeholder="Template Name"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={createTemplate}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModal}
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Template</Text>
            <TextInput
              style={styles.input}
              placeholder="Template Name"
              value={editTemp}
              onChangeText={setEditTemp}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={editNow}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={exerciseModal}
        onRequestClose={() => setExerciseModal(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? "Edit Exercise" : "Add Exercise"}
            </Text>

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                selectedValue={currentDay}
                onValueChange={(itemValue) => setCurrentDay(itemValue)}
                pickerProps={{
                  itemStyle: {
                    color: "#000000",
                  },
                }}
                style={{
                  inputIOS: styles.picker,
                  inputAndroid: styles.picker,
                }}
                items={[
                  { label: "Select Day", value: "" },
                  ...DAYS.map((day) => ({ label: day, value: day })),
                ]}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Exercise Name"
              value={newExercise.name}
              onChangeText={(text) =>
                setNewExercise((prev) => ({ ...prev, name: text }))
              }
            />

            <Text style={styles.sectionTitle}>Muscle Groups</Text>
            <View style={styles.muscleGroupContainer}>
              {MUSCLE_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.muscleGroupItem,
                    newExercise.muscleGroups.includes(group) &&
                      styles.selectedMuscleGroup,
                  ]}
                  onPress={() => toggleMuscleGroup(group)}
                >
                  <Text style={styles.muscleGroupText}>{group}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.setInputContainer}>
              <TextInput
                style={styles.setInput}
                placeholder="Reps"
                keyboardType="phone-pad"
                value={currentSet.reps}
                autoCorrect={false}
                autoComplete="off"
                onChangeText={(text) =>
                  setCurrentSet((prev) => ({ ...prev, reps: text }))
                }
              />
              <TextInput
                style={styles.setInput}
                placeholder="Weight (kg)"
                keyboardType="phone-pad"
                value={currentSet.weight}
                autoComplete="off"
                onChangeText={(text) =>
                  setCurrentSet((prev) => ({ ...prev, weight: text }))
                }
              />
              <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
                <Text style={styles.addSetButtonText}>Add Set</Text>
              </TouchableOpacity>
            </View>

            {newExercise.sets.map((set, index) => (
              <View key={index} style={styles.addedSetContainer}>
                <Text>
                  Set {index + 1}: {set.reps} reps @ {set.weight} kg
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setNewExercise((prev) => ({
                      ...prev,
                      sets: prev.sets.filter((_, i) => i !== index),
                    }));
                  }}
                >
                  <Icon name="delete" size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.saveExerciseButton}
              onPress={saveExercise}
            >
              <Text style={styles.saveExerciseButtonText}>
                {editingIndex !== null ? "Update Exercise" : "Save Exercise"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  screenTitle: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: height * 0.02,
    color: "#FF5757",
  },
  noTemplate: {
    fontSize: width * 0.04,
    textAlign: "center",
    marginVertical: 15,
  },
  saveAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: width * 0.04,
    margin: width * 0.04,
    borderRadius: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 0,
    backgroundColor: "#fff",
    width: "100%",
    marginBottom: 10,
  },
  templateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: width * 0.04,
    marginHorizontal: width * 0.04,
    marginVertical: height * 0.01,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateButtonText: {
    fontSize: width * 0.045,
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5757",
    padding: width * 0.04,
    margin: width * 0.04,
    borderRadius: 10,
  },
  addButtonText: {
    color: "white",
    marginLeft: 10,
    fontSize: width * 0.045,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: width * 0.04,
  },
  dayContainer: {
    backgroundColor: "white",
    margin: width * 0.04,
    borderRadius: 10,
    padding: width * 0.04,
  },
  dayTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.01,
  },
  exerciseCard: {
    backgroundColor: "#f9f9f9",
    padding: width * 0.03,
    marginVertical: height * 0.01,
    borderRadius: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  noExercisesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.1,
    marginTop: height * 0.1,
  },
  noExercisesText: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#333",
    marginTop: height * 0.02,
    textAlign: "center",
  },
  noExercisesSubtext: {
    fontSize: width * 0.04,
    color: "#666",
    marginTop: height * 0.01,
    textAlign: "center",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: width * 0.02,
  },
  muscleGroups: {
    fontSize: width * 0.035,
    color: "#666",
    marginVertical: height * 0.005,
  },
  setDetails: {
    fontSize: width * 0.035,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: 10,
    padding: width * 0.05,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#FF5757",
    padding: width * 0.03,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  modalButtonText: {
    color: "white",
    fontSize: width * 0.04,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: height * 0.01,
  },
  muscleGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: height * 0.02,
  },
  muscleGroupItem: {
    backgroundColor: "#e9ecef",
    padding: width * 0.02,
    margin: width * 0.01,
    borderRadius: 8,
  },
  selectedMuscleGroup: {
    backgroundColor: "#FF5757",
  },
  muscleGroupText: {
    color: "#333",
    fontSize: width * 0.035,
  },
  setInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  setInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: width * 0.03,
    width: "35%",
    fontSize: width * 0.035,
  },
  addSetButton: {
    backgroundColor: "#28a745",
    padding: width * 0.03,
    borderRadius: 8,
  },
  addSetButtonText: {
    color: "white",
    fontSize: width * 0.035,
  },
  addedSetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    padding: width * 0.03,
    marginBottom: height * 0.01,
    borderRadius: 8,
  },
  saveExerciseButton: {
    backgroundColor: "#FF5757",
    padding: width * 0.04,
    borderRadius: 10,
    alignItems: "center",
    marginTop: height * 0.02,
  },
  saveExerciseButtonText: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  noTemplatesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.1,
    marginTop: height * 0.1,
  },
  noTemplatesText: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#333",
    marginTop: height * 0.02,
    textAlign: "center",
  },
  noTemplatesSubtext: {
    fontSize: width * 0.04,
    color: "#666",
    marginTop: height * 0.01,
    textAlign: "center",
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 10,
  },
});

export default WorkoutTracker;
