import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MealsCategoryCard from "../../../components/Diet/MealsCategoryCard";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { getSingleDietTemplate } from "../../../services/Api";
import axiosInstance from "../../../services/axiosInstance";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AddTemplateCategoryPage = () => {
  const router = useRouter();
  const [templateData, setTemplateData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullDietPlan, setFullDietPlan] = useState({});

  const { templateTitle, templateId, variantName, variantId } =
    useLocalSearchParams();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (templateId) {
      singleDietTemplateData();
    }
  }, [templateId]);

  const singleDietTemplateData = async () => {
    try {
      const gymId = await getToken("gym_id");

      if (!gymId || !templateId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Missing required information. Please try again.",
        });
        return;
      }

      const response = await getSingleDietTemplate(gymId, templateId);

      if (response?.status === 200) {
        const { dietPlan } = response.data;
        setFullDietPlan(dietPlan);

        // Get the specific variant data
        const variantData = dietPlan[variantName] || [];
        setTemplateData(variantData);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Failed to load template data",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Failed to load template data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDietTemplate = async ({ mealId, categoryID }) => {
    try {
      const clientId = await getToken("gym_id");

      // Find the category and remove the meal
      const updatedTemplateData = templateData.map((category) => {
        if (category.id === categoryID) {
          const updatedFoodList = category.foodList.filter(
            (item) => item.id !== mealId
          );
          return {
            ...category,
            foodList: updatedFoodList,
            itemsCount: updatedFoodList.length,
          };
        }
        return category;
      });

      // Update the full diet plan with the new variant data
      const updatedFullDietPlan = {
        ...fullDietPlan,
        [variantName]: updatedTemplateData,
      };

      const payload = {
        gym_id: clientId,
        id: templateId,
        dietPlan: updatedFullDietPlan,
      };

      // Save to backend
      const response = await axiosInstance.put(
        "/gym_diet_template/update_diet_template",
        payload
      );

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: response.data?.message || "Meal removed successfully",
        });
        setTemplateData(updatedTemplateData);
        setFullDietPlan(updatedFullDietPlan);
      } else {
        throw new Error(response?.data?.detail || "Failed to update meal");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: error.message || "Failed to update meal. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading template...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        routePath="/owner/dietVariant"
        enabled={true}
        params={{
          variantId: variantId,
          variantName: variantName,
          templateId: templateId,
        }}
      />
      <NewOwnerHeader
        onBackButtonPress={() =>
          router.push({
            pathname: "/owner/dietVariant",
            params: {
              variantId: variantId,
              variantName: variantName,
              templateId: templateId,
            },
          })
        }
        text={`${templateTitle}/${variantName}` || "Diet Template"}
      />

      <FlatList
        data={templateData}
        keyExtractor={(item, index) => index}
        renderItem={({ item }) => (
          <MealsCategoryCard
            title={item.title}
            timeRange={item.timeRange}
            itemsCount={item.foodList?.length || 0}
            foodList={item.foodList || []}
            onPress={() =>
              router.push({
                pathname: "/owner/addFoodListPage",
                params: {
                  templateTitle: templateTitle,
                  mealTitle: item.title,
                  mealTimeRange: item.timeRange,
                  mealId: item.id,
                  templateId: templateId,
                  variantName: variantName,
                  method: "edit",
                },
              })
            }
            templateTitle={templateTitle}
            templateId={templateId}
            updateDietTemplate={(mealId) =>
              updateDietTemplate({ mealId, categoryID: item.id })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default AddTemplateCategoryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  variantHeader: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
