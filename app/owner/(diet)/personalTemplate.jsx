import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CreateTemplateModal from "../../../components/Diet/createTemplateModal";
import GradientButton from "../../../components/ui/GradientButton";
const { width, height } = Dimensions.get("window");

import Icon from "react-native-vector-icons/MaterialIcons";
import HardwareBackHandler from "../../../components/HardwareBackHandler";

import WorkoutScheduleSkeleton from "../../../components/ui/loaders/workoutScheduleSkeleton";
import EmptyStateCard from "../../../components/workout/EmptyDataComponent";
import {
  addDietTemplateAPI,
  deleteDietTemplateAPI,
  editAllDietTemplateAPI,
  editDietTemplateAPI,
  getDietTemplateAPI,
  getImportableTemplatesAPI,
  importTemplatesAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const mockData = [
  {
    id: "1",
    title: "Pre workout",
    tagline: "Energy boost",
    foodList: [],
    timeRange: "6:30-7:00 AM",
    itemsCount: 1,
  },
  {
    id: "2",
    title: "Post workout",
    tagline: "Recovery fuel",
    foodList: [],
    timeRange: "7:30-8:00 AM",
    itemsCount: 0,
  },
  {
    id: "3",
    title: "Early morning Detox",
    tagline: "Early morning nutrition",
    foodList: [],
    timeRange: "5:30-6:00 AM",
    itemsCount: 0,
  },
  {
    id: "4",
    title: "Pre-Breakfast / Pre-Meal Starter",
    tagline: "Pre-breakfast fuel",
    foodList: [],
    timeRange: "7:00-7:30 AM",
    itemsCount: 0,
  },
  {
    id: "5",
    title: "Breakfast",
    tagline: "Start your day right",
    foodList: [],
    timeRange: "8:30-9:30 AM",
    itemsCount: 1,
  },
  {
    id: "6",
    title: "Mid-Morning snack",
    tagline: "Healthy meal",
    foodList: [],
    timeRange: "10:00-11:00 AM",
    itemsCount: 0,
  },
  {
    id: "7",
    title: "Lunch",
    tagline: "Nutritious midday meal",
    foodList: [],
    timeRange: "1:00-2:00 PM",
    itemsCount: 0,
  },
  {
    id: "8",
    title: "Evening snack",
    tagline: "Healthy meal",
    foodList: [],
    timeRange: "4:00-5:00 PM",
    itemsCount: 0,
  },
  {
    id: "9",
    title: "Dinner",
    tagline: "End your day well",
    foodList: [],
    timeRange: "7:30-8:30 PM",
    itemsCount: 2,
  },
  {
    id: "10",
    title: "Bed time",
    tagline: "Rest well",
    foodList: [],
    timeRange: "9:30-10:00 PM",
    itemsCount: 0,
  },
];

const personalTemplate = (props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateTemplateModal, setOpenCreateTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isEditNameModalVisible, setEditNameModalVisible] = useState(false);
  const [templateId, setTemplateId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTemp, setEditTemp] = useState(null);
  const [editModal, setEditModal] = useState(false);

  // New states for import functionality
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importableTemplates, setImportableTemplates] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [isLoadingImportable, setIsLoadingImportable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const insets = useSafeAreaInsets();
  const method = "personal";

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
          title: response?.detail,
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

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
                  title: "GymId is not available",
                });
                return;
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
                  title: response?.detail,
                });
              }
            } catch (error) {
              const errorMessage = "Something went wrong, please try again.";
              showToast({
                type: "error",
                title: errorMessage,
              });
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleEditName = async () => {
    if (!newTemplateName.trim()) {
      showToast({
        type: "error",
        title: "Please enter a template name",
      });
      return;
    }

    if (newTemplateName.trim()) {
      const payload = {
        id: templateId,
        template_name: newTemplateName,
      };

      try {
        const response = await editDietTemplateAPI(payload);

        if (response?.status === 200) {
          showToast({
            type: "success",
            title: response?.message,
          });
          await getTemplates();
          setEditNameModalVisible(false);
          setNewTemplateName("");
        } else {
          showToast({
            type: "error",
            title:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong. Please try again later",
        });
      }
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
          title: "GymId is not available",
        });
        return;
      }
      const payload = {
        name: templateName,
        dietPlan: {
          variant1: mockData,
          variant2: mockData,
          variant3: mockData,
          variant4: mockData,
          variant5: mockData,
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
          title: response?.detail,
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: error || errorMessage,
      });
    }
  };

  // New functions for import functionality
  const getImportableTemplates = async () => {
    setIsLoadingImportable(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }

      const response = await getImportableTemplatesAPI(gymId);
      if (response?.status === 200) {
        setImportableTemplates(response?.data || []);
        if (response?.data?.length === 0) {
          showToast({
            type: "info",
            title: "No templates available for import",
          });
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to fetch importable templates",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoadingImportable(false);
    }
  };

  const toggleTemplateSelection = (templateId) => {
    if (selectedTemplateIds.includes(templateId)) {
      setSelectedTemplateIds(
        selectedTemplateIds.filter((id) => id !== templateId),
      );
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, templateId]);
    }
  };

  const handleImportTemplates = async () => {
    if (selectedTemplateIds.length === 0) {
      showToast({
        type: "error",
        title: "Please select at least one template to import",
      });
      return;
    }

    Alert.alert(
      "Confirm Import",
      `Are you sure you want to import ${selectedTemplateIds.length} template(s)?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Import",
          onPress: async () => {
            setIsImporting(true);
            try {
              const gymId = await getToken("gym_id");
              if (!gymId) {
                showToast({
                  type: "error",
                  title: "GymId is not available",
                });
                return;
              }

              const response = await importTemplatesAPI(
                selectedTemplateIds,
                gymId,
              );
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: response?.message || "Templates imported successfully",
                });

                // Reset states and refresh templates
                setSelectedTemplateIds([]);
                setImportModalVisible(false);
                getTemplates();
              } else {
                showToast({
                  type: "error",
                  title: response?.detail || "Failed to import templates",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Something went wrong, please try again.",
              });
            } finally {
              setIsImporting(false);
            }
          },
        },
      ],
    );
  };

  const openImportModal = () => {
    setSelectedTemplateIds([]);
    setImportModalVisible(true);
    getImportableTemplates();
  };

  const renderImportableTemplate = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.importableTemplateItem,
        selectedTemplateIds.includes(item.id) && styles.selectedTemplateItem,
      ]}
      onPress={() => toggleTemplateSelection(item.id)}
    >
      <View style={styles.templateInfo}>
        <View style={styles.templateHeader}>
          <Text style={styles.templateName}>{item.name}</Text>
          <View style={styles.selectionIcon}>
            {selectedTemplateIds.includes(item.id) ? (
              <Ionicons name="checkmark-circle" size={24} color="#28A745" />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color="#ccc" />
            )}
          </View>
        </View>
        <Text style={styles.gymName}>From: {item.gym_name}</Text>
        <Text style={styles.variantCount}>Variants: {item.variant_count}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderImportModal = () => (
    <Modal
      visible={importModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setImportModalVisible(false)}
    >
      <View
        style={[styles.importModalContainer, { paddingBottom: insets.bottom }]}
      >
        <View style={[styles.importModalHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => setImportModalVisible(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.importModalTitle}>Import Templates</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoadingImportable ? (
          <View style={styles.loadingContainer}>
            <Text>Loading available templates...</Text>
          </View>
        ) : importableTemplates.length === 0 ? (
          <View style={styles.emptyImportContainer}>
            <Text style={styles.emptyImportText}>
              No templates available for import
            </Text>
            <Text style={styles.emptyImportSubText}>
              Templates from your other gyms will appear here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionText}>
                {selectedTemplateIds.length} of {importableTemplates.length}{" "}
                selected
              </Text>
            </View>

            <FlatList
              data={importableTemplates}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderImportableTemplate}
              style={styles.importList}
            />

            <View style={styles.importButtonContainer}>
              <GradientButton
                title={`Import ${selectedTemplateIds.length} Template(s)`}
                fromColor="#28A745"
                toColor="#007BFF"
                mainContainerStyle={{ width: "100%" }}
                containerStyle={{
                  marginTop: 0,
                  width: "100%",
                  paddingVertical: 18,
                  opacity: selectedTemplateIds.length === 0 ? 0.5 : 1,
                }}
                textStyle={{ fontSize: 14 }}
                onPress1={handleImportTemplates}
                disabled={isImporting || selectedTemplateIds.length === 0}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );

  if (isLoading) {
    return <WorkoutScheduleSkeleton />;
  }

  return (
    <>
      <View style={[styles.sectionContainer, { paddingBottom: insets.bottom }]}>
        <HardwareBackHandler
          routePath="/owner/manageNutritionAndWorkoutTemplate"
          enabled={true}
        />

        <TouchableOpacity
          style={[
            styles.backButtonContainer,
            { padding: width * 0.04, paddingTop: insets.top + 10 },
          ]}
          onPress={() => {
            method === "personal"
              ? router.push("/owner/manageNutritionAndWorkoutTemplate")
              : router.push("/owner/manageNutritionAndWorkoutTemplate");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>
            {method === "personal" ? "Gym Diet Plans" : "Trainer Template"}
          </Text>
        </TouchableOpacity>

        {templates?.length === 0 && (
          <EmptyStateCard
            imageSource={require("../../../assets/images/workout/FOOD_NOT_AVAILABLE_CAT_V001 2.png")}
            onButtonPress={() => setModalVisible(!modalVisible)}
            buttonText={"Start Fresh"}
            message={
              "Looks like you have not created any template yet!\nTap below to create your diet templates and assign to clients"
            }
            belowButtonText={""}
            onButtonPress2={() => {}}
          />
        )}

        <ScrollView style={{ flex: 1 }}>
          {templates?.map((template, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={styles.templateButton}
                onPress={() => {
                  router.push({
                    pathname: "/owner/dietVariant",
                    params: {
                      templateId: template.id,
                    },
                  });
                }}
              >
                <View style={{ flexDirection: "column" }}>
                  <Text style={styles.templateButtonText}>{template.name}</Text>
                  <Text style={styles.variantText}>
                    No. of Variants: {Object.keys(template.dietPlan).length}
                  </Text>
                </View>

                <View style={styles.actionTemplates}>
                  <TouchableOpacity
                    onPress={() => {
                      editTemplate(template);
                      setTemplateName(template.name);
                    }}
                    style={{
                      padding: 10,
                      backgroundColor: "rgba(40, 167, 70, 0.10)",
                      borderRadius: "100%",
                    }}
                  >
                    <Icon name="edit" size={20} color="#28A745" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteTemplate(template.id)}
                    style={{
                      padding: 10,
                      backgroundColor: "rgba(220, 53, 70, 0.1)",
                      borderRadius: "100%",
                    }}
                  >
                    <Icon name="delete" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Button Container */}
        <View style={styles.bottomButtonsContainer}>
          {/* Import Templates Button - Show only if templates exist */}
          {templates?.length > 0 && (
            <TouchableOpacity
              style={styles.importButton}
              onPress={openImportModal}
            >
              <Ionicons name="download-outline" size={20} color="#007BFF" />
              <Text style={styles.importButtonText}>
                Import from Other Associated Gyms
              </Text>
            </TouchableOpacity>
          )}

          {/* Add Templates Button */}
          <GradientButton
            title="Add Templates"
            fromColor="#28A745"
            toColor="#007BFF"
            mainContainerStyle={{
              width: "100%",
              alignItems: "flex",
            }}
            containerStyle={{
              marginTop: templates?.length > 0 ? 12 : 0,
              width: "100%",
              paddingVertical: 18,
            }}
            textStyle={{ fontSize: 12 }}
            onPress1={() => setModalVisible(!modalVisible)}
          />
        </View>

        <CreateTemplateModal
          onClose={() => setOpenCreateTemplateModal(!openCreateTemplateModal)}
          value={templateName}
          visible={openCreateTemplateModal}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={() => {
            if (templateName) {
              router.push({
                pathname: "/owner/dietVariant",
                params: { templateTitle: templateName, method: method },
              });
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
        />

        <CreateTemplateModal
          onClose={() => setModalVisible(!modalVisible)}
          value={templateName}
          visible={modalVisible}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={() => {
            if (templateName) {
              createTemplate();
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
          title={"Create a New Template"}
          placeholder={"Ex:Weight Gain Diet Plan"}
        />

        <CreateTemplateModal
          onClose={() => setEditModal(false)}
          value={templateName}
          visible={editModal}
          onChange={(text) => {
            setTemplateName(text);
          }}
          onSubmit={async () => {
            if (templateName) {
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
                  name: templateName,
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
                    title:
                      response?.detail ||
                      "Something went wrong, please try again later.",
                  });
                }
              } catch (error) {
                const errorMessage =
                  error.response?.detail ||
                  "Something went wrong, please try again.";
                showToast({
                  type: "error",
                  title: errorMessage,
                });
              }
            } else {
              showToast({
                type: "error",
                title: "Enter the template name first",
              });
            }
          }}
          title={"Create a New Template"}
          placeholder={"Enter the Template Name"}
        />

        {/* Import Templates Modal */}
        {renderImportModal()}
      </View>
    </>
  );
};

export default personalTemplate;

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: height * 0.01,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: "500",
  },
  foodList: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  variantText: {
    paddingTop: 5,
    fontSize: 14,
    color: "#666",
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 5,
  },
  bottomButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  importButtonText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  // Import Modal Styles
  importModalContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  importModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalCloseButton: {
    padding: 4,
  },
  importModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyImportContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyImportText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  emptyImportSubText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
  selectionHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  importList: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  importableTemplateItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTemplateItem: {
    borderColor: "#28A745",
    backgroundColor: "#f8fff9",
  },
  templateInfo: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  selectionIcon: {
    marginLeft: 8,
  },
  gymName: {
    fontSize: 14,
    color: "#007BFF",
    marginBottom: 4,
  },
  variantCount: {
    fontSize: 14,
    color: "#666",
  },
  importButtonContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
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
});
