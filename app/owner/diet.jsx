import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import OwnerHeader from "../../components/ui/OwnerHeader";
import * as SecureStore from "expo-secure-store";
import RNPickerSelect from "react-native-picker-select";
import {
  addDietTemplateAPI,
  deleteDietTemplateAPI,
  editAllDietTemplateAPI,
  editDietTemplateAPI,
  getDietTemplateAPI,
} from "../../services/Api";

import { getToken } from "../../utils/auth";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import AllClientsSkeleton from "../../components/ui/loaders/allClientsSkeleton";

const { width, height } = Dimensions.get("window");

const TIME_SLOTS = [
  { label: "Pre-Morning (4-6 AM)", value: "preMorning" },
  { label: "Morning (6-9 AM)", value: "morning" },
  { label: "Mid-Morning (9-11 AM)", value: "midMorning" },
  { label: "Lunch (11 AM-2 PM)", value: "lunch" },
  { label: "Afternoon (2-4 PM)", value: "afternoon" },
  { label: "Evening (4-7 PM)", value: "evening" },
  { label: "Dinner (7-9 PM)", value: "dinner" },
  { label: "Late Night (9-11 PM)", value: "lateNight" },
];

const VARIANTS = [
  "Variant 1",
  "Variant 2",
  "Variant 3",
  "Variant 4",
  "Variant 5",
];

const DietTracker = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [dietPlan, setDietPlan] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [dishModal, setDishModal] = useState(false);
  const [hasSavedDishes, setHasSavedDishes] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTemp, setEditTemp] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [currentTimeSlot, setCurrentTimeSlot] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newDish, setNewDish] = useState({
    name: "",
    calories: "",
    proteins: "",
    carbs: "",
    fats: "",
  });

  const PRIMARY_COLOR = "#FF5757";

  const getTemplates = async () => {
    setIsLoading(true);
    const gymId = await getToken("gym_id");
    try {
      const response = await getDietTemplateAPI(gymId);
      if (response?.status === 200) {
        setTemplates(response?.data);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch templates",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch templates",
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

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Something went wrong, please try again.",
        });
      }
      const payload = {
        name: templateName,
        dietPlan: {
          variant1: {},
          variant2: {},
          variant3: {},
          variant4: {},
          variant5: {},
        },
        gym_id: gymId,
      };
      const response = await addDietTemplateAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Template created successfully",
        });
        getTemplates();
        setModalVisible(false);
        setTemplateName("");
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to create template",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const saveDish = () => {
    if (!currentTimeSlot || !newDish.name || !newDish.calories) {
      showToast({
        type: "error",
        title: "Please fill in all dish details",
      });
      return;
    }

    setDietPlan((prev) => {
      const updatedPlan = { ...prev };
      if (!updatedPlan[currentTimeSlot]) {
        updatedPlan[currentTimeSlot] = [];
      }

      if (editingIndex !== null) {
        updatedPlan[currentTimeSlot][editingIndex] = newDish;
      } else {
        updatedPlan[currentTimeSlot].push(newDish);
      }
      return updatedPlan;
    });

    setHasSavedDishes(true);
    setDishModal(false);
    setNewDish({ name: "", calories: "", proteins: "", carbs: "", fats: "" });
    setCurrentTimeSlot("");
    setEditingIndex(null);
  };

  const saveAllDishes = async () => {
    if (Object.keys(dietPlan).length === 0) {
      showToast({
        type: "error",
        title: "Please add at least one dish",
      });
      return;
    }
    const updatedDietPlan = {
      ...currentTemplate.dietPlan,
      [`variant${currentVariant}`]: dietPlan,
    };

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Something went wrong, please try again.",
        });
      }
      const payload = {
        dietPlan: updatedDietPlan,
        id: currentTemplate.id,
        gym_id: gymId,
      };
      const response = await editDietTemplateAPI(payload);

      if (response?.status === 200) {
        const updatedTemplates = templates.map((template) => {
          if (template.id === currentTemplate.id) {
            return {
              ...template,
              dietPlan: updatedDietPlan,
            };
          }
          return template;
        });

        // Update templates state
        setTemplates(updatedTemplates);

        // Update current template state
        setCurrentTemplate({
          ...currentTemplate,
          dietPlan: updatedDietPlan,
        });
        showToast({
          type: "success",
          title: "All dishes saved successfully",
        });
        getTemplates();
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to save dishes",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const editTemplate = (template) => {
    setEditId(template.id);
    setEditTemp(template.name);
    setEditModal(true);
  };

  const deleteTemplate = (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this template?",
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
                  title: "Something went wrong, please try again.",
                });
              }
              const response = await deleteDietTemplateAPI(id, gym_id);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Template deleted successfully",
                });
                getTemplates();
              } else {
                showToast({
                  type: "error",
                  title: response?.detail || "Failed to delete template",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Failed to delete template",
              });
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const editDish = (timeSlot, index) => {
    const dish = dietPlan[timeSlot][index];
    setNewDish(dish);
    setCurrentTimeSlot(timeSlot);
    setEditingIndex(index);
    setDishModal(true);
  };

  const renderVariants = () => {
    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.variantsTitle}>Select Variant</Text>
        <View style={styles.variantButtonsContainer}>
          {VARIANTS?.map((variant, index) => (
            <TouchableOpacity
              key={variant}
              style={[styles.variantButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={() => {
                setCurrentVariant(index + 1);
                const variantKey = `variant${index + 1}`;
                setDietPlan(currentTemplate.dietPlan[variantKey] || {});
                setHasSavedDishes(
                  Object.keys(currentTemplate.dietPlan[variantKey] || {})
                    .length > 0,
                );
              }}
            >
              <Text style={styles.variantButtonText}>{variant}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (currentTemplate && currentVariant) {
      const variantKey = `variant${currentVariant}`;
      setDietPlan(currentTemplate.dietPlan[variantKey] || {});
      setHasSavedDishes(
        Object.keys(currentTemplate.dietPlan[variantKey] || {}).length > 0,
      );
    }
  }, [currentTemplate, currentVariant]);

  const deleteDish = (timeSlot, index) => {
    setDietPlan((prev) => {
      const updatedPlan = { ...prev };
      updatedPlan[timeSlot].splice(index, 1);
      if (updatedPlan[timeSlot].length === 0) {
        delete updatedPlan[timeSlot];
      }
      return updatedPlan;
    });
  };

  useEffect(() => {
    getTemplates();
  }, []);

  const renderTemplatesList = () => {
    if (templates.length === 0) {
      return (
        <View style={styles.noTemplatesContainer}>
          <Icon name="playlist-add" size={64} color="#cccccc" />
          <Text style={styles.noTemplatesText}>No diet templates found</Text>
          <Text style={styles.noTemplatesSubtext}>
            Tap the "New Template" button to create your first diet plan
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: PRIMARY_COLOR, marginTop: height * 0.02 },
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
        <Text style={styles.screenTitle}>Diet Templates</Text>
        {templates?.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateButton}
            onPress={() => {
              setCurrentTemplate(template);
              setDietPlan(template.dietPlan || {});
              setHasSavedDishes(
                Object.keys(template.dietPlan || {}).length > 0,
              );
            }}
          >
            <Text style={styles.templateButtonText}>{template.name}</Text>
            <View style={styles.actionTemplates}>
              <TouchableOpacity onPress={() => editTemplate(template)}>
                <Icon name="edit" size={20} color="#dc3545" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTemplate(template.id)}>
                <Icon name="delete" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
          onPress={() => setModalVisible(true)}
          // onPress={() => router.push('/owner/(diet)/personalTemplate')}
        >
          <Icon name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>New Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
          // onPress={() => setModalVisible(true)}
          onPress={() => router.push("/owner/(diet)/personalTemplate")}
        >
          <Icon name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Personal Template</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderDietPlan = () => {
    if (Object.keys(dietPlan).length === 0) {
      return (
        <View style={styles.noExercisesContainer}>
          <Icon name="restaurant-menu" size={64} color="#cccccc" />
          <Text style={styles.noExercisesText}>No dishes found</Text>
          <Text style={styles.noExercisesSubtext}>
            Tap the "Add Dish" button to get started
          </Text>
        </View>
      );
    }

    return TIME_SLOTS.map(({ label, value }) => {
      if (!dietPlan[value]) return null;

      return (
        <View key={value} style={styles.dayContainer}>
          <Text style={styles.dayTitle}>{label}</Text>
          {dietPlan[value].map((dish, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{dish.name}</Text>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity onPress={() => editDish(value, index)}>
                    <Icon name="edit" size={20} color={PRIMARY_COLOR} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteDish(value, index)}>
                    <Icon name="delete" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.dishDetails}>
                Calories: {dish.calories} | Proteins: {dish.proteins}g | Carbs:{" "}
                {dish.carbs}g | Fats: {dish.fats}g
              </Text>
            </View>
          ))}
        </View>
      );
    });
  };

  if (isLoading) {
    <AllClientsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* <OwnerHeader /> */}
      {!currentTemplate ? (
        <ScrollView>{renderTemplatesList()}</ScrollView>
      ) : !currentVariant ? (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => setCurrentTemplate(null)}>
              <Icon name="arrow-back" size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <Text style={styles.screenTitleInside}>{currentTemplate.name}</Text>
          </View>
          {renderVariants()}
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => setCurrentVariant(null)}>
              <Icon name="arrow-back" size={24} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <Text style={styles.screenTitleInside}>
              {`${currentTemplate.name} - Variant ${currentVariant}`}
            </Text>
          </View>

          <ScrollView>{renderDietPlan()}</ScrollView>

          {hasSavedDishes && (
            <TouchableOpacity
              style={[styles.saveAllButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={saveAllDishes}
            >
              <Icon name="save" size={24} color="white" />
              <Text style={styles.addButtonText}>Save All Dishes</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={() => setDishModal(true)}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Dish</Text>
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
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
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
                    }
                    const payload = {
                      id: editId,
                      name: editTemp,
                      gym_id: gymId,
                    };
                    const response = await editAllDietTemplateAPI(payload);

                    if (response?.status === 200) {
                      showToast({
                        type: "success",
                        title: "Template updated successfully",
                      });
                      setEditModal(false);
                      getTemplates();
                    } else {
                      showToast({
                        type: "error",
                        title: response?.detail || "Failed to update template",
                      });
                    }
                  } catch (error) {
                    showToast({
                      type: "error",
                      title: "Something went wrong, please try again.",
                    });
                  }
                }}
              >
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

      {/* Add/Edit Dish Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dishModal}
        onRequestClose={() => setDishModal(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? "Edit Dish" : "Add Dish"}
            </Text>

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                selectedValue={currentTimeSlot}
                onValueChange={(value) => setCurrentTimeSlot(value)}
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
                  label: "Select time slot...",
                  value: "",
                  color: "gray",
                }}
                items={TIME_SLOTS.map((slot) => ({
                  label: slot.label,
                  value: slot.value,
                }))}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Dish Name"
              value={newDish.name}
              onChangeText={(text) =>
                setNewDish((prev) => ({ ...prev, name: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={newDish.calories}
              onChangeText={(text) =>
                setNewDish((prev) => ({ ...prev, calories: text }))
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Proteins (g)"
              value={newDish.proteins}
              onChangeText={(text) =>
                setNewDish((prev) => ({ ...prev, proteins: text }))
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Carbs (g)"
              value={newDish.carbs}
              onChangeText={(text) =>
                setNewDish((prev) => ({ ...prev, carbs: text }))
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Fats (g)"
              value={newDish.fats}
              onChangeText={(text) =>
                setNewDish((prev) => ({ ...prev, fats: text }))
              }
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={saveDish}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDishModal(false);
                  setNewDish({
                    name: "",
                    calories: "",
                    proteins: "",
                    carbs: "",
                    fats: "",
                  });
                  setCurrentTimeSlot("");
                  setEditingIndex(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default DietTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#FF5757",
  },
  screenTitleInside: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 10,
    color: "#FF5757",
  },
  noTemplatesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: height * 0.15,
  },
  noTemplatesText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#666",
  },
  noTemplatesSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  templateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  saveAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#FF5757",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
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
  dayContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  exerciseCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "500",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: 16,
  },
  dishDetails: {
    color: "#666",
    fontSize: 14,
  },
  noExercisesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: height * 0.15,
  },
  noExercisesText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#666",
  },
  noExercisesSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  variantsContainer: {
    padding: 16,
  },
  variantsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  variantButtonsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  variantButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  variantButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
