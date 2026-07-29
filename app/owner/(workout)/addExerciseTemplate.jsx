import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
} from "react-native";
import { showToast } from "../../../utils/Toaster";
import { editWorkoutTemplateAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const AddExerciseTemplate = () => {
  const { template, workouts } = useLocalSearchParams();
  const exerciseData = workouts ? JSON.parse(workouts) : [];
  const parsedTemplate = template ? JSON.parse(template) : {};
  const [templateExercises, setTemplateExercises] = useState(
    parsedTemplate.exercise_data || {}
  );
  const [currentTemplate, setCurrentTemplate] = useState(parsedTemplate);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [addVariantModalVisible, setAddVariantModalVisible] = useState(false);
  const [selectedVariantForRename, setSelectedVariantForRename] =
    useState(null);
  const [newVariantName, setNewVariantName] = useState("");
  const [openMenuVariant, setOpenMenuVariant] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (parsedTemplate) {
      setCurrentTemplate(parsedTemplate);
      setTemplateExercises(parsedTemplate.exercise_data || {});
    }
  }, [template]);

  const deleteExercise = (variant, muscleGroup, exerciseIndex) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedExercises = { ...templateExercises };
            updatedExercises[variant][muscleGroup].exercises.splice(
              exerciseIndex,
              1
            );

            if (updatedExercises[variant][muscleGroup].exercises.length === 0) {
              delete updatedExercises[variant][muscleGroup];
            }

            setTemplateExercises(updatedExercises);
          },
        },
      ]
    );
  };

  const handleRenameVariant = () => {
    if (!newVariantName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter a valid name",
      });
      return;
    }

    const updatedExercises = { ...templateExercises };

    if (
      updatedExercises[newVariantName.toLowerCase()] &&
      newVariantName.toLowerCase() !== selectedVariantForRename
    ) {
      showToast({
        type: "error",
        title: "Error",
        desc: "This variant name already exists",
      });
      return;
    }

    updatedExercises[newVariantName.toLowerCase()] =
      updatedExercises[selectedVariantForRename];
    if (newVariantName.toLowerCase() !== selectedVariantForRename) {
      delete updatedExercises[selectedVariantForRename];
    }

    setTemplateExercises(updatedExercises);
    setRenameModalVisible(false);
    setSelectedVariantForRename(null);
    setNewVariantName("");
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Please enter a valid variant name",
      });
      return;
    }

    const variantKey = newVariantName.toLowerCase();

    if (templateExercises[variantKey]) {
      showToast({
        type: "error",
        title: "Error",
        desc: "This variant name already exists",
      });
      return;
    }

    const updatedExercises = { ...templateExercises };
    updatedExercises[variantKey] = {};

    setTemplateExercises(updatedExercises);
    setAddVariantModalVisible(false);
    setNewVariantName("");

    showToast({
      type: "success",
      title: "Success",
      desc: "New variant added successfully",
    });
  };

  const deleteVariant = (variant) => {
    Alert.alert(
      "Delete Variant",
      `Are you sure you want to delete the variant "${
        variant.charAt(0).toUpperCase() + variant.slice(1)
      }"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedExercises = { ...templateExercises };
            delete updatedExercises[variant];
            setTemplateExercises(updatedExercises);
            setOpenMenuVariant(null);
          },
        },
      ]
    );
  };

  const openRenameModal = (variant) => {
    setSelectedVariantForRename(variant);
    setNewVariantName(variant);
    setRenameModalVisible(true);
    setOpenMenuVariant(null);
  };

  const openAddVariantModal = () => {
    setNewVariantName("");
    setAddVariantModalVisible(true);
  };

  const handleMenuToggle = (variant) => {
    setOpenMenuVariant(openMenuVariant === variant ? null : variant);
  };

  const saveExercises = async () => {
    const gymId = await getToken("gym_id");

    if (!gymId) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
      return;
    }

    const payload = {
      id: currentTemplate.id,
      workoutPlan: templateExercises,
      gym_id: gymId,
    };

    try {
      const response = await editWorkoutTemplateAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Success",
          desc: response?.message || "Workout saved successfully",
        });
        router.push("/owner/personalTemplate");
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
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

  const handleAddWorkout = () => {
    router.push({
      pathname: "/owner/AddExerciseToTemplate",
      params: {
        template: JSON.stringify({
          ...parsedTemplate,
          exercise_data: templateExercises,
        }),
        workouts: JSON.stringify(exerciseData),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath="/owner/(workout)/personalTemplate"
        enabled={true}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButtonContainer, { paddingTop: insets.top + 10 }]}
          onPress={() => {
            router.push("/owner/(workout)/personalTemplate");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>{parsedTemplate.name}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={openAddVariantModal}
          style={styles.addVariantButton}
        >
          <MaskedView
            maskElement={
              <View style={styles.buttonContentWrapper}>
                <Text style={styles.addButtonText}>+ Add Variant</Text>
              </View>
            }
          >
            <LinearGradient
              colors={["#10B981", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBackground}
            >
              <View style={styles.buttonContentWrapper}>
                <Ionicons
                  name="add-circle"
                  size={20}
                  color="#000"
                  style={{ opacity: 0 }}
                />
                <Text style={[styles.addButtonText, { opacity: 0 }]}>
                  + Add Variant
                </Text>
              </View>
            </LinearGradient>
          </MaskedView>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddWorkout} style={styles.addButton}>
          <MaskedView
            maskElement={
              <View style={styles.buttonContentWrapper}>
                <Text style={styles.addButtonText}>+ Add Workout</Text>
              </View>
            }
          >
            <LinearGradient
              colors={["#297DB3", "#183243"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBackground}
            >
              <View style={styles.buttonContentWrapper}>
                <Ionicons
                  name="add-circle"
                  size={20}
                  color="#000"
                  style={{ opacity: 0 }}
                />
                <Text style={[styles.addButtonText, { opacity: 0 }]}>
                  + Add Workout
                </Text>
              </View>
            </LinearGradient>
          </MaskedView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(templateExercises).map((variant) => {
          const hasExercises = Object.keys(templateExercises[variant]).some(
            (muscleGroup) =>
              templateExercises[variant][muscleGroup]?.exercises?.length > 0
          );

          return (
            <TouchableOpacity
              key={variant}
              style={styles.variantSection}
              activeOpacity={1}
              onPress={() => setOpenMenuVariant(null)}
            >
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleMenuToggle(variant)}
                  style={styles.menuButton}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#297DB3"
                  />
                </TouchableOpacity>

                {openMenuVariant === variant && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => openRenameModal(variant)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#297DB3"
                      />
                      <Text style={styles.menuOptionText}>Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => deleteVariant(variant)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#E63946"
                      />
                      <Text
                        style={[styles.menuOptionText, { color: "#E63946" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {!hasExercises ? (
                <View style={styles.noExerciseContainer}>
                  <Text style={styles.noExerciseText}>
                    No exercises added yet
                  </Text>
                </View>
              ) : (
                Object.keys(templateExercises[variant]).map((muscleGroup) => (
                  <View key={muscleGroup} style={styles.muscleGroupSection}>
                    <Text style={styles.muscleGroupTitle}>{muscleGroup}</Text>
                    {templateExercises[variant][muscleGroup].exercises.map(
                      (exercise, index) => (
                        <View
                          key={`${exercise.name}-${index}`}
                          style={styles.exerciseItem}
                        >
                          <Text style={styles.exerciseName}>
                            {exercise.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              deleteExercise(variant, muscleGroup, index)
                            }
                          >
                            <Ionicons name="trash" size={20} color="#297DB3" />
                          </TouchableOpacity>
                        </View>
                      )
                    )}
                  </View>
                ))
              )}
            </TouchableOpacity>
          );
        })}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveExercises}>
          <LinearGradient
            colors={["#297DB3", "#183243"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, { width: "60%" }]}
          >
            <Text style={styles.saveButtonText}>Save Exercises</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={renameModalVisible}
        onRequestClose={() => {
          setRenameModalVisible(false);
          setSelectedVariantForRename(null);
          setNewVariantName("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rename Variant</Text>
            <TextInput
              style={styles.modalInput}
              value={newVariantName}
              onChangeText={setNewVariantName}
              placeholder="Enter new variant name"
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setRenameModalVisible(false);
                  setSelectedVariantForRename(null);
                  setNewVariantName("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRenameVariant}
              >
                <Text style={styles.modalButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={addVariantModalVisible}
        onRequestClose={() => {
          setAddVariantModalVisible(false);
          setNewVariantName("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Variant</Text>
            <TextInput
              style={styles.modalInput}
              value={newVariantName}
              onChangeText={setNewVariantName}
              placeholder="Enter variant name"
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddVariantModalVisible(false);
                  setNewVariantName("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addVariantConfirmButton]}
                onPress={handleAddVariant}
              >
                <Text style={styles.modalButtonText}>Add Variant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: width * 0.04,
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: height * 0.02,
    paddingBottom: 15,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    paddingHorizontal: width * 0.05,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: width * 0.05,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  addButton: {
    alignItems: "center",
  },
  addVariantButton: {
    alignItems: "center",
  },
  addButtonText: {
    fontSize: scale(14),
    color: "#3B82F6",
    fontWeight: "500",
  },
  buttonContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gradientBackground: {
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  variantSection: {
    backgroundColor: "white",
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    padding: 15,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.02,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    position: "relative",
  },
  variantTitle: {
    fontSize: scale(14),
    fontWeight: "500",
    color: "#297DB3",
  },
  menuButton: {
    padding: 4,
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: 35,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 1000,
    minWidth: 120,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  menuOptionText: {
    fontSize: scale(14),
    color: "#297DB3",
    fontWeight: "500",
  },
  noExerciseContainer: {
    alignItems: "center",
  },
  noExerciseText: {
    fontSize: scale(14),
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  muscleGroupSection: {
    marginBottom: height * 0.02,
  },
  muscleGroupTitle: {
    fontSize: scale(14),
    fontWeight: "500",
    marginBottom: height * 0.01,
    color: "#1A202C",
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.01,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseName: {
    fontSize: scale(12),
    color: "#1A202C",
  },

  buttonContainer: {
    alignItems: "center",
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: width * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#1A202C",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: scale(16),
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#297DB3",
  },
  addVariantConfirmButton: {
    backgroundColor: "#10B981",
  },
  modalButtonText: {
    color: "white",
    fontSize: scale(16),
    fontWeight: "600",
  },
});

export default AddExerciseTemplate;
