import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FoodCard from "../../../components/Diet/FoodCard";
import MissedMealsModal from "../../../components/Diet/MissedMealsModal";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import GradientButton from "../../../components/ui/GradientButton";
import GradientButton2 from "../../../components/ui/GradientButton2";
import { editDietTemplateAPI, getDietTemplateAPI } from "../../../services/Api";
import {
  addClientDietAPI,
  addCustomFoodAPI,
  getCommonFooodAPI,
  searchClientFoodAPI,
} from "../../../services/clientApi";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const FoodSearchScreen = () => {
  const router = useRouter();
  const inputRef = useRef(null);

  const {
    date,
    templateTitle,
    mealTitle,
    mealTimeRange,
    mealId,
    templateId,
    templateData,
    variantId,
    variantName,
  } = useLocalSearchParams();

  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateAdd, setDateAdd] = useState(new Date());
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [missedMealsModalVisible, setMissedMealsModalVisible] = useState(false);
  const [parsedTemplateData, setParsedTemplateData] = useState({});
  const [templates, setTemplates] = useState([]);
  const [gymId, setGymId] = useState(null);
  const insets = useSafeAreaInsets();
  const [showNoResults, setShowNoResults] = useState(false);
  const [addFoodModalVisible, setAddFoodModalVisible] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: "",
    quantity: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugar: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAddingCustomFood, setIsAddingCustomFood] = useState(false);

  const handleDateSelect = (date) => {
    setDateAdd(date);
    setSelectedDate(date);
  };

  // Get gym ID on component mount
  useEffect(() => {
    const getGymId = async () => {
      const id = await getToken("gym_id");
      setGymId(id);
    };
    getGymId();
  }, []);

  const getTemplates = async () => {
    const gymIdValue = await getToken("gym_id");
    try {
      const response = await getDietTemplateAPI(gymIdValue);
      if (response?.status === 200) {
        setTemplates(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to fetch templates",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong, please try again.",
      });
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  useEffect(() => {
    if (templateData) {
      try {
        const parsed = JSON.parse(templateData);
        setParsedTemplateData(parsed);
      } catch (error) {
        showToast({
          type: "error",
          title: "Error parsing template data",
        });
      }
    }
  }, [templateData]);

  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
      setMissedMealsModalVisible(true);
    }
  }, [date]);

  const fetchCommonDiet = async () => {
    if (!gymId) return;

    setLoading(true);
    try {
      const response = await getCommonFooodAPI(gymId);
      if (response?.status === 200) {
        setAllFoods(response?.data || []);
        setShowNoResults(false);
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
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query) => {
    if (!gymId) return;

    if (query.length > 1) {
      try {
        const response = await searchClientFoodAPI(query, gymId);
        if (response?.status === 200) {
          setAllFoods(response?.data);
          setShowNoResults(response?.data?.length === 0);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    } else {
      await fetchCommonDiet();
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchFoods(query);
  };

  const filteredData = allFoods?.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSearchQuery("");
    searchFoods("");
    Keyboard.dismiss();
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (gymId) {
      fetchCommonDiet();
    }
  }, [gymId]);

  const toggleFoodSelection = (food) => {
    if (selectedFoods.find((f) => f.id === food.id)) {
      setSelectedFoods(selectedFoods.filter((f) => f.id !== food.id));
    } else {
      setSelectedFoods([...selectedFoods, { ...food, quantity: "1" }]);
    }
  };

  const updateFoodQuantity = (foodId, quantity) => {
    setSelectedFoods(
      selectedFoods.map((food) =>
        food.id === foodId ? { ...food, quantity } : food
      )
    );
  };

  // Custom food form validation
  const validateCustomFoodForm = () => {
    const errors = {};

    if (!customFoodForm.name.trim()) {
      errors.name = "Food name is required";
    }

    if (!customFoodForm.quantity.trim()) {
      errors.quantity = "Quantity is required";
    }

    if (
      !customFoodForm.calories ||
      isNaN(customFoodForm.calories) ||
      customFoodForm.calories <= 0
    ) {
      errors.calories = "Valid calories value is required";
    }

    if (
      !customFoodForm.protein ||
      isNaN(customFoodForm.protein) ||
      customFoodForm.protein < 0
    ) {
      errors.protein = "Valid protein value is required";
    }

    if (
      !customFoodForm.carbs ||
      isNaN(customFoodForm.carbs) ||
      customFoodForm.carbs < 0
    ) {
      errors.carbs = "Valid carbs value is required";
    }

    if (
      !customFoodForm.fat ||
      isNaN(customFoodForm.fat) ||
      customFoodForm.fat < 0
    ) {
      errors.fat = "Valid fat value is required";
    }

    // Fiber and sugar are optional, but if provided should be valid
    if (
      customFoodForm.fiber &&
      (isNaN(customFoodForm.fiber) || customFoodForm.fiber < 0)
    ) {
      errors.fiber = "Valid fiber value required";
    }

    if (
      customFoodForm.sugar &&
      (isNaN(customFoodForm.sugar) || customFoodForm.sugar < 0)
    ) {
      errors.sugar = "Valid sugar value required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomFood = async () => {
    if (!validateCustomFoodForm()) {
      return;
    }

    setIsAddingCustomFood(true);
    try {
      const foodData = {
        name: customFoodForm.name.trim(),
        quantity: customFoodForm.quantity.trim(),
        calories: parseInt(customFoodForm.calories),
        protein: parseFloat(customFoodForm.protein),
        carbs: parseFloat(customFoodForm.carbs),
        fat: parseFloat(customFoodForm.fat),
        fiber: customFoodForm.fiber ? parseFloat(customFoodForm.fiber) : null,
        sugar: customFoodForm.sugar ? parseFloat(customFoodForm.sugar) : null,
      };

      const response = await addCustomFoodAPI(foodData, gymId);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Custom food added successfully",
        });

        // Add the new food to the current list
        setAllFoods((prev) => [response.data, ...prev]);
        setShowNoResults(false);

        // Reset form and close modal
        setCustomFoodForm({
          name: "",
          quantity: "",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          fiber: "",
          sugar: "",
        });
        setFormErrors({});
        setAddFoodModalVisible(false);

        // Optionally select the new food
        setSelectedFoods([
          ...selectedFoods,
          { ...response.data, quantity: "1" },
        ]);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to add custom food",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setIsAddingCustomFood(false);
    }
  };

  const updateCustomFoodForm = (field, value) => {
    setCustomFoodForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleTheUpdateTemplate = async (dietPlanToUse) => {
    try {
      const gymIdValue = await getToken("gym_id");

      const payload = {
        gym_id: gymIdValue,
        id: templateId,
        dietPlan: dietPlanToUse,
      };

      const response = await editDietTemplateAPI(payload);

      if (response?.status !== 200) {
        throw new Error(response?.detail || "Failed to update template");
      }

      return response;
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating template",
      });
      throw error;
    }
  };

  const saveFoods = async () => {
    if (!dateAdd && !templateId) {
      return;
    }

    if (selectedFoods.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    try {
      const gymIdValue = await getToken("gym_id");

      // Prepare new foods with proper formatting
      const newFoods = selectedFoods.map((food) => {
        const quantity = parseInt(food.quantity) || 1;
        return {
          ...food,
          id: food.isCustom
            ? food.id
            : `${food.id}-${Date.now()}-${Math.random()}`,
          quantity,
          calories: food.calories * quantity,
          protein: food.protein * quantity,
          carbs: food.carbs * quantity,
          fat: food.fat * quantity,
          date: format(dateAdd, "yyyy-MM-dd"),
          timeAdded: format(new Date(), "HH:mm"),
        };
      });

      // Handle template meal update
      if (templateId && mealId && variantName) {
        try {
          // Find the current template from templates state
          const currentTemplate = templates.find(
            (template) => template.id.toString() === templateId.toString()
          );

          if (!currentTemplate) {
            throw new Error("Template not found");
          }

          // Create a deep copy of the current template's dietPlan
          const updatedDietPlan = JSON.parse(
            JSON.stringify(currentTemplate.dietPlan)
          );

          // Check if the variant exists
          if (!updatedDietPlan[variantName]) {
            throw new Error(
              `Variant "${variantName}" not found in template. Available variants: ${Object.keys(
                updatedDietPlan
              ).join(", ")}`
            );
          }

          // Find the meal by ID in the specified variant
          const mealIndex = updatedDietPlan[variantName].findIndex(
            (meal) => meal.id.toString() === mealId.toString()
          );

          if (mealIndex === -1) {
            const availableMealIds = updatedDietPlan[variantName].map(
              (meal) => meal.id
            );
            throw new Error(
              `Meal with ID "${mealId}" not found in variant "${variantName}". Available meal IDs: ${availableMealIds.join(
                ", "
              )}`
            );
          }

          // Add new foods to the existing foodList
          const existingFoodList =
            updatedDietPlan[variantName][mealIndex].foodList || [];
          updatedDietPlan[variantName][mealIndex].foodList = [
            ...existingFoodList,
            ...newFoods,
          ];

          // Update the items count
          updatedDietPlan[variantName][mealIndex].itemsCount =
            updatedDietPlan[variantName][mealIndex].foodList.length;

          // Call the API to update the template
          const response = await handleTheUpdateTemplate(updatedDietPlan);

          if (response?.status === 200) {
            showToast({
              type: "success",
              title: "Foods added to meal successfully",
            });

            setSelectedFoods([]);

            // Update local templates state
            setTemplates((prevTemplates) =>
              prevTemplates.map((template) =>
                template.id.toString() === templateId.toString()
                  ? { ...template, dietPlan: updatedDietPlan }
                  : template
              )
            );

            setTimeout(() => {
              router.push({
                pathname: "/owner/addTemplateCategoryPage",
                params: {
                  variantId: variantId,
                  variantName: variantName,
                  templateTitle: templateTitle,
                  templateId: templateId,
                },
              });
            }, 1000);

            return response;
          } else {
            throw new Error(response?.detail || "Failed to update template");
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error",
            desc: error.message || "Failed to add foods to meal",
          });
          return;
        }
      }
      // Handle regular diet log (existing functionality)
      else {
        const clientId = await getToken("client_id");

        const payload = {
          client_id: clientId,
          date: dateAdd?.toISOString().split("T")[0],
          diet_data: newFoods,
          gym_id: gymIdValue,
        };

        const response = await addClientDietAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: "Diet added successfully",
          });

          setSelectedFoods([]);
          setDateAdd(new Date());

          setTimeout(() => {
            router.push({
              pathname: "/client/myListedFoodLogs",
            });
          }, 1000);

          return response;
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const renderCustomFoodForm = () => (
    <Modal
      visible={addFoodModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setAddFoodModalVisible(false)}
    >
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => setAddFoodModalVisible(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Custom Food</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formScrollView}>
          <View style={styles.formContainer}>
            {/* Food Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Food Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.name && styles.inputError]}
                placeholder="Enter food name"
                value={customFoodForm.name}
                onChangeText={(value) => updateCustomFoodForm("name", value)}
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Quantity */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Quantity <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.quantity && styles.inputError]}
                placeholder="e.g., 1 cup, 100g, 1 piece"
                value={customFoodForm.quantity}
                onChangeText={(value) =>
                  updateCustomFoodForm("quantity", value)
                }
              />
              {formErrors.quantity && (
                <Text style={styles.errorText}>{formErrors.quantity}</Text>
              )}
            </View>

            {/* Calories */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Calories <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.calories && styles.inputError]}
                placeholder="Enter calories"
                value={customFoodForm.calories}
                onChangeText={(value) =>
                  updateCustomFoodForm("calories", value)
                }
                keyboardType="numeric"
              />
              {formErrors.calories && (
                <Text style={styles.errorText}>{formErrors.calories}</Text>
              )}
            </View>

            {/* Protein */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Protein (g) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.protein && styles.inputError]}
                placeholder="Enter protein in grams"
                value={customFoodForm.protein}
                onChangeText={(value) => updateCustomFoodForm("protein", value)}
                keyboardType="numeric"
              />
              {formErrors.protein && (
                <Text style={styles.errorText}>{formErrors.protein}</Text>
              )}
            </View>

            {/* Carbs */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Carbs (g) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.carbs && styles.inputError]}
                placeholder="Enter carbs in grams"
                value={customFoodForm.carbs}
                onChangeText={(value) => updateCustomFoodForm("carbs", value)}
                keyboardType="numeric"
              />
              {formErrors.carbs && (
                <Text style={styles.errorText}>{formErrors.carbs}</Text>
              )}
            </View>

            {/* Fat */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Fat (g) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, formErrors.fat && styles.inputError]}
                placeholder="Enter fat in grams"
                value={customFoodForm.fat}
                onChangeText={(value) => updateCustomFoodForm("fat", value)}
                keyboardType="numeric"
              />
              {formErrors.fat && (
                <Text style={styles.errorText}>{formErrors.fat}</Text>
              )}
            </View>

            {/* Fiber (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fiber (g)</Text>
              <TextInput
                style={[styles.input, formErrors.fiber && styles.inputError]}
                placeholder="Enter fiber in grams (optional)"
                value={customFoodForm.fiber}
                onChangeText={(value) => updateCustomFoodForm("fiber", value)}
                keyboardType="numeric"
              />
              {formErrors.fiber && (
                <Text style={styles.errorText}>{formErrors.fiber}</Text>
              )}
            </View>

            {/* Sugar (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sugar (g)</Text>
              <TextInput
                style={[styles.input, formErrors.sugar && styles.inputError]}
                placeholder="Enter sugar in grams (optional)"
                value={customFoodForm.sugar}
                onChangeText={(value) => updateCustomFoodForm("sugar", value)}
                keyboardType="numeric"
              />
              {formErrors.sugar && (
                <Text style={styles.errorText}>{formErrors.sugar}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <GradientButton
            title="Add Food"
            fromColor="#28A745"
            toColor="#007BFF"
            mainContainerStyle={{ width: "100%" }}
            containerStyle={{
              marginTop: 0,
              width: "100%",
              paddingVertical: 18,
            }}
            textStyle={{ fontSize: 14 }}
            onPress1={handleAddCustomFood}
            disabled={isAddingCustomFood}
          />
        </View>
      </View>
    </Modal>
  );

  const renderNoResultsMessage = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>
        Can't find the food you're looking for?
      </Text>
      <Text style={styles.noResultsSubText}>
        Add it to your custom food list
      </Text>
      <TouchableOpacity
        style={styles.addFoodButton}
        onPress={() => setAddFoodModalVisible(true)}
      >
        <Text style={styles.addFoodButtonText}>Add Custom Food</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath="/owner/addTemplateCategoryPage"
        enabled={true}
        params={{
          variantId: variantId,
          variantName: variantName,
          templateTitle: templateTitle,
          templateId: templateId,
        }}
      />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/owner/addTemplateCategoryPage",
              params: {
                variantId: variantId,
                variantName: variantName,
                templateTitle: templateTitle,
                templateId: templateId,
              },
            });
          }}
        >
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          {date && <Text>Log Your Food</Text>}
          {templateTitle && mealTitle && (
            <Text numberOfLines={1} style={styles.headerText}>
              Add Food To {mealTitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.search_bar}>
        <TouchableOpacity onPress={focusInput}>
          <Ionicons name="search-outline" size={20} color="#888" />
        </TouchableOpacity>

        <TextInput
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Type here..."
          style={styles.searchInput}
          ref={inputRef}
        />

        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {selectedDate && (
        <View style={styles.dateContainer}>
          <GradientButton2
            title={
              selectedDate
                ? format(selectedDate, "MMMM dd, yyyy")
                : "yyyy-MM-dd"
            }
            fromColor="#28A745"
            toColor="#007BFF"
            containerStyle={{ marginTop: 0 }}
            textStyle={{ fontSize: 12 }}
            onPress={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading foods...</Text>
        </View>
      ) : showNoResults && searchQuery.length > 1 ? (
        renderNoResultsMessage()
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <FoodCard
              id={item.id}
              image={item.pic}
              title={item.name}
              calories={item.calories}
              carbs={item.carbs}
              fat={item.fat}
              sugar={item.sugar}
              fiber={item.fiber}
              protein={item.protein}
              quantity={item?.quantity}
              isSelected={selectedFoods.some((f) => f.id === item.id)}
              onAdd={() => toggleFoodSelection(item)}
              updateFoodQuantity={updateFoodQuantity}
            />
          )}
          contentContainerStyle={styles.foodListContainer}
        />
      )}

      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""}{" "}
          selected
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton
          title={templateTitle || templateId ? "Add to Meal" : "Log Your Food"}
          fromColor="#28A745"
          toColor="#007BFF"
          mainContainerStyle={{
            width: "100%",
            alignItems: "flex",
          }}
          containerStyle={{ marginTop: 0, width: "100%", paddingVertical: 18 }}
          textStyle={{ fontSize: 12 }}
          onPress1={saveFoods}
          disabled={loading || selectedFoods.length === 0}
        />
      </View>

      <MissedMealsModal
        onClose={() => setMissedMealsModalVisible(!missedMealsModalVisible)}
        visible={missedMealsModalVisible}
        date={selectedDate}
        onChangeDate={(date) => setSelectedDate(date)}
        onSubmit={handleDateSelect}
      />

      {renderCustomFoodForm()}
    </View>
  );
};

export default FoodSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  headerTitleContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 30,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 5,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  dateContainer: {
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  foodListContainer: {
    paddingBottom: 10,
    paddingTop: 0,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 0,
  },
  // No results styles
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  noResultsSubText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  addFoodButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFoodButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  formScrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
  required: {
    color: "#FF0000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});
