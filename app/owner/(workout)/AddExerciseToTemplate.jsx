import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");

const scale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

const AddExerciseToTemplate = () => {
  const { template, workouts } = useLocalSearchParams();
  const parsedTemplate = template ? JSON.parse(template) : {};
  const router = useRouter();
  const muscleGroupsData = workouts ? JSON.parse(workouts) : [];

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [variants, setVariants] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const [selectedExercises, setSelectedExercises] = useState(() => {
    return parsedTemplate.exercise_data || {};
  });

  useEffect(() => {
    // Get variants from existing exercise_data
    if (parsedTemplate.exercise_data) {
      const variantNames = Object.keys(parsedTemplate.exercise_data);
      setVariants(variantNames);
    }

    // Get muscle groups from workouts data
    if (muscleGroupsData && typeof muscleGroupsData === "object") {
      const groupNames = Object.keys(muscleGroupsData);
      setMuscleGroups(groupNames);
    } else {
      setMuscleGroups([]);
    }
  }, [workouts, template]);

  const filteredMuscleGroups = muscleGroups.filter((group) =>
    group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExerciseSelected = (variant, muscleGroup, exerciseName) => {
    if (!selectedExercises[variant] || !selectedExercises[variant][muscleGroup])
      return false;

    return selectedExercises[variant][muscleGroup].exercises.some(
      (exercise) => exercise.name === exerciseName
    );
  };

  const handleExerciseToggle = (exercise) => {
    if (!selectedVariant || !selectedMuscleGroup) return;

    setSelectedExercises((prev) => {
      const updatedExercises = { ...prev };

      if (!updatedExercises[selectedVariant]) {
        updatedExercises[selectedVariant] = {};
      }

      if (!updatedExercises[selectedVariant][selectedMuscleGroup]) {
        updatedExercises[selectedVariant][selectedMuscleGroup] = {
          isCardio: muscleGroupsData[selectedMuscleGroup]?.isCardio || false,
          exercises: [],
          imagePath: muscleGroupsData[selectedMuscleGroup]?.imagePath || null,
          isMuscleGroup:
            muscleGroupsData[selectedMuscleGroup]?.isMuscleGroup || true,
          isBodyWeight:
            muscleGroupsData[selectedMuscleGroup]?.isBodyWeight || false,
        };
      }

      const existingExerciseIndex = updatedExercises[selectedVariant][
        selectedMuscleGroup
      ].exercises.findIndex((ex) => ex.name === exercise.name);

      if (existingExerciseIndex >= 0) {
        updatedExercises[selectedVariant][selectedMuscleGroup].exercises.splice(
          existingExerciseIndex,
          1
        );

        if (
          updatedExercises[selectedVariant][selectedMuscleGroup].exercises
            .length === 0
        ) {
          delete updatedExercises[selectedVariant][selectedMuscleGroup];
        }

        if (Object.keys(updatedExercises[selectedVariant]).length === 0) {
          delete updatedExercises[selectedVariant];
        }
      } else {
        updatedExercises[selectedVariant][selectedMuscleGroup].exercises.push(
          exercise
        );
      }

      return updatedExercises;
    });
  };

  const handleMuscleGroupSelect = (muscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setModalVisible(false);
    setSearchQuery("");
  };

  const saveSelectedExercises = () => {
    const updatedTemplate = {
      ...parsedTemplate,
      exercise_data: selectedExercises,
    };

    router.push({
      pathname: "/owner/addExerciseTemplate",
      params: {
        template: JSON.stringify(updatedTemplate),
        workouts: JSON.stringify(muscleGroupsData),
      },
    });
  };

  const renderVariantSelection = () => (
    <ScrollView style={styles.variantList} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Select Day/Variant</Text>
      {variants.map((variant, index) => (
        <TouchableOpacity
          key={`${variant}-${index}`}
          style={[
            styles.variantItem,
            selectedVariant === variant && styles.selectedVariantItem,
          ]}
          onPress={() => setSelectedVariant(variant)}
        >
          <Text
            style={[
              styles.variantName,
              selectedVariant === variant && styles.selectedVariantName,
            ]}
          >
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Text>
          {selectedVariant === variant && (
            <Ionicons name="checkmark-circle" size={24} color="#297DB3" />
          )}
        </TouchableOpacity>
      ))}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );

  const renderMuscleGroupAndExercises = () => (
    <>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.muscleGroupSelector}
          onPress={() => {
            setModalVisible(true);
          }}
        >
          <Text
            style={[
              styles.muscleGroupText,
              !selectedMuscleGroup && styles.placeholderText,
            ]}
          >
            {selectedMuscleGroup || "Select the Muscle Group"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Muscle Group Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Muscle Group</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Muscle Group"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.modalSectionTitle}>Choose muscle group</Text>

            <ScrollView
              style={styles.muscleGroupList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredMuscleGroups.length > 0 ? (
                filteredMuscleGroups.map((muscleGroup, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.muscleGroupItem}
                    onPress={() => handleMuscleGroupSelect(muscleGroup)}
                  >
                    <Text style={styles.muscleGroupItemText}>
                      {muscleGroup}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {searchQuery
                      ? "No muscle groups found"
                      : "Loading muscle groups..."}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.exerciseList}
        showsVerticalScrollIndicator={false}
      >
        {selectedMuscleGroup &&
          muscleGroupsData[selectedMuscleGroup]?.exercises.map(
            (exercise, index) => {
              const isSelected = isExerciseSelected(
                selectedVariant,
                selectedMuscleGroup,
                exercise.name
              );

              return (
                <TouchableOpacity
                  key={`${exercise.name}-${index}`}
                  onPress={() => handleExerciseToggle(exercise)}
                >
                  <View style={styles.exerciseItem}>
                    <Image
                      source={exercise?.imgPath}
                      style={{
                        width: 75,
                        height: 75,
                        marginRight: 10,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleWorkoutButton,
                        isSelected
                          ? styles.removeWorkoutButton
                          : styles.addWorkoutButton,
                      ]}
                      onPress={() => handleExerciseToggle(exercise)}
                    >
                      <LinearGradient
                        colors={
                          !isSelected
                            ? ["#297DB3", "#183243"]
                            : ["#E63946", "#D90429"]
                        }
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.gradientButton,
                          {
                            width: "100%",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.toggleWorkoutText,
                            isSelected
                              ? styles.removeWorkoutText
                              : styles.addWorkoutText,
                          ]}
                        >
                          {isSelected ? "-" : "+"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath="/owner/(workout)/personalTemplate"
        enabled={true}
        onBackPress={() => {
          if (selectedVariant && !selectedMuscleGroup) {
            setSelectedVariant(null);
            return true;
          }
          return false;
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButtonContainer, { paddingTop: insets.top }]}
          onPress={() => {
            if (selectedVariant && !selectedMuscleGroup) {
              setSelectedVariant(null);
            } else {
              router.push("/owner/(workout)/personalTemplate");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {selectedVariant
              ? selectedMuscleGroup
                ? selectedVariant.charAt(0).toUpperCase() +
                  selectedVariant.slice(1)
                : "Select Muscle Group"
              : parsedTemplate.name || "Add Workout"}
          </Text>
        </TouchableOpacity>
      </View>

      {!selectedVariant
        ? renderVariantSelection()
        : renderMuscleGroupAndExercises()}

      {selectedVariant && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveSelectedExercises}
          >
            <LinearGradient
              colors={["#297DB3", "#183243"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gradientButton, { width: "60%" }]}
            >
              <Text style={styles.saveButtonText}>Add Selected Exercises</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
    color: "#1A202C",
  },
  variantList: {
    flex: 1,
    paddingTop: height * 0.01,
  },
  variantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 3,
  },
  selectedVariantItem: {
    borderColor: "#297DB3",
    borderWidth: 2,
  },
  variantName: {
    fontSize: scale(16),
    color: "#1A202C",
    fontWeight: "500",
  },
  selectedVariantName: {
    color: "#297DB3",
    fontWeight: "600",
  },
  dropdownContainer: {
    marginHorizontal: width * 0.05,
    marginVertical: height * 0.02,
  },
  muscleGroupSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  muscleGroupText: {
    fontSize: scale(16),
    color: "#1A202C",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width * 0.85,
    height: height * 0.7,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 3,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A202C",
  },
  modalSectionTitle: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  muscleGroupList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  muscleGroupItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    minHeight: 50,
  },
  muscleGroupItemText: {
    fontSize: 16,
    color: "#1A202C",
    fontWeight: "500",
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 1,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2980B917",
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    paddingLeft: 10,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.01,
  },
  exerciseName: {
    fontSize: scale(14),
    color: "#1A202C",
    flex: 1,
    marginRight: width * 0.02,
  },
  toggleWorkoutButton: {
    width: width * 0.08,
    borderRadius: 50,
  },
  gradientButton: {
    borderRadius: 7,
    width: width * 0.08,
    height: width * 0.09,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleWorkoutText: {
    fontSize: scale(20),
    fontWeight: "600",
  },
  addWorkoutText: {
    color: "#FFFFFF",
  },
  removeWorkoutText: {
    color: "#FFFFFF",
  },
  buttonContainer: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  saveButton: {
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "600",
  },
  bottomSpace: {
    height: height * 0.1,
  },
});

export default AddExerciseToTemplate;
