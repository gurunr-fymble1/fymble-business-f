import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

import ManagePlansSkeleton from "../../components/ui/loaders/managePlansSkeleton";
import {
  addBatchAPI,
  addPlanAPI,
  checkBatchAssignmentsAPI,
  checkPlanAssignmentsAPI,
  deleteBatchAPI,
  deletePlanAPI,
  editBatchAPI,
  editPlanAPI,
  getPlansandBatchesAPI,
  noCostBNPLSetAPI,
  getNoCostBNPLSetAPI,
  modalAllPagesAPI,
} from "../../services/Api";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import TabHeader from "../../components/home/finances/TabHeader";
import EntityModal from "../../components/managePlans/EntityModal";
import PlanCard from "../../components/managePlans/PlanCard";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const AssignmentWarningModal = ({
  visible,
  onClose,
  assignedUsers,
  entityType,
  entityName,
  onRedirect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="warning" size={28} color="#FFA500" />
            <Text style={styles.modalTitle}>Cannot Delete {entityType}</Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalText}>
              The following users are assigned to this{" "}
              {entityType.toLowerCase()} "{entityName}":
            </Text>

            {assignedUsers.map((user, index) => (
              <View key={index} style={styles.userItem}>
                <Icon name="person" size={20} color="#666" />
                <Text style={styles.userName}>{user.name}</Text>
              </View>
            ))}

            <Text style={styles.modalWarning}>
              Please reassign these users to a different{" "}
              {entityType.toLowerCase()} before deleting.
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={onClose}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={onRedirect}
            >
              <Text style={styles.modalPrimaryButtonText}>
                Go to Assignment Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const GymManagementPage = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(params.tab || "plans");
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [entityToDelete, setEntityToDelete] = useState({
    type: "",
    name: "",
    id: null,
  });
  const [noCostEMI, setNoCostEMI] = useState(false);
  const [bnpl, setBnpl] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const fetchPlansAndBatches = async () => {
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
      const response = await getPlansandBatchesAPI(gymId);

      if (response?.status === 200) {
        setPlans(response.data.plans);
        setBatches(response.data.batches);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Error fetching data",
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

  const fetchNoCostBNPLSettings = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        return;
      }

      const response = await getNoCostBNPLSetAPI(gymId);

      if (response?.status === 200) {
        setNoCostEMI(response?.data?.no_cost_emi || false);
        setBnpl(response?.data?.bnpl || false);
      }
    } catch (error) {}
  };

  const fetchModalData = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      const response = await modalAllPagesAPI(gymId, "plan");
      if (
        response?.status === 200 &&
        (response?.dailypass || response?.session)
      ) {
        setShowGeneralModal(true);
      }
    } catch (error) {
      console.error("Error fetching modal data:", error);
    }
  };

  const handleModalButtonClick = () => {
    setShowGeneralModal(false);
    router.push("/owner/(sessions)/availableSessions");
  };

  useEffect(() => {
    fetchPlansAndBatches();
    fetchNoCostBNPLSettings();
    fetchModalData();
  }, []);

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  // Open modal for adding new entity
  const openAddModal = () => {
    // Navigate to quick plan setup page with current plan sub tab
    if (activeTab === "plans") {
      router.push({
        pathname: "/owner/quickplansetup",
        params: {
          planSubTab: planSubTab,
        },
      });
    } else {
      // For batches, use the old modal
      setIsEditMode(false);
      setSelectedItem(null);
      setIsModalVisible(true);
    }
  };

  // Open modal for editing entity
  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
    setIsEditMode(false);
  };

  // Handle adding or editing plan
  const handleSavePlan = async (planData) => {
    try {
      let response;

      if (isEditMode) {
        // Edit existing plan
        const payload = {
          id: planData.id,
          plan_name: planData.plans,
          amount: planData.amount
            ? Number(planData.amount)
            : Number(planData.original),
          duration: Number(planData.duration),
          description: planData.description || "",
          personal_training: planData.personal_training || false,
          services: planData.services || [],
          bonus: planData?.bonus,
          original: planData?.original,
          bonus_type: planData?.bonus_type,
          pause: planData?.pause,
          pause_type: planData?.pause_type,
          is_couple: planData?.is_couple || false,
          plan_for: planData?.plan_for || "individual",
          buddy_count: planData?.buddy_count || null,
          sessions_count: planData?.sessions_count || null,
        };

        response = await editPlanAPI(payload);
      } else {
        // Add new plan
        const gymId = await getToken("gym_id");
        if (!gymId) {
          showToast({
            type: "error",
            title: "GymId is not available",
          });
          return;
        }

        const payload = {
          gym_id: gymId,
          plan_name: planData.plans,
          amount: Number(planData.amount),
          duration: Number(planData.duration),
          description: planData.description || "",
          personal_training: planData.personal_training || false,
          services: planData.services || [],
          bonus: planData?.bonus,
          original: planData?.original,
          bonus_type: planData?.bonus_type,
          pause: planData?.pause,
          pause_type: planData?.pause_type,
          is_couple: planData?.is_couple,
          plan_for: planData?.plan_for || "individual",
          buddy_count: planData?.buddy_count || null,
          sessions_count: planData?.sessions_count || null,
        };

        response = await addPlanAPI(payload);
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditMode
            ? "Plan updated successfully"
            : response.message || "Plan added successfully",
        });
        await fetchPlansAndBatches();
        closeModal();
      } else {
        showToast({
          type: "error",
          title: isEditMode ? "Failed to update plan" : "Failed to add plan",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: isEditMode ? "Error updating plan" : "Error adding plan",
      });
    }
  };

  // Handle adding or editing batch
  const handleSaveBatch = async (batchData) => {
    try {
      let response;

      if (isEditMode) {
        // Edit existing batch
        response = await editBatchAPI(batchData);
      } else {
        // Add new batch
        const gymId = await getToken("gym_id");
        if (!gymId) {
          showToast({
            type: "error",
            title: "GymId is not available",
          });
          return;
        }

        const payload = {
          gym_id: gymId,
          batch_name: batchData.batch_name,
          timing: batchData.timing,
          description: batchData.description || "",
        };

        response = await addBatchAPI(payload);
      }

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: isEditMode
            ? "Batch updated successfully"
            : "Batch added successfully",
        });
        await fetchPlansAndBatches();
        closeModal();
      } else {
        showToast({
          type: "error",
          title: isEditMode ? "Failed to update batch" : "Failed to add batch",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: isEditMode ? "Error updating batch" : "Error adding batch",
      });
    }
  };

  // Handle save action based on active tab
  const handleSave = (data) => {
    if (activeTab === "plans") {
      handleSavePlan(data);
    } else {
      handleSaveBatch(data);
    }
  };

  // Check if plan has assigned users before deletion
  const handleDeletePlan = async (id, planName) => {
    try {
      setIsLoading(true);
      const response = await checkPlanAssignmentsAPI(id);
      setIsLoading(false);

      if (response?.status === 200) {
        const assignedUsers = response.data;

        if (assignedUsers && assignedUsers.length > 0) {
          setAssignedUsers(assignedUsers);
          setEntityToDelete({ type: "Plan", name: planName, id });

          // Check if there are alternative plans for reassignment
          if (plans.length <= 1) {
            Alert.alert(
              "Cannot Delete Plan",
              "This plan has assigned users and it's your only plan. Please add another plan before deleting this one.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add New Plan",
                  onPress: () => {
                    setActiveTab("plans");
                    openAddModal();
                  },
                },
              ],
            );
          } else {
            setWarningModalVisible(true);
          }
        } else {
          showDeleteConfirmation(id, "Plan");
        }
      } else {
        showToast({
          type: "error",
          title: "Failed to check plan assignments",
        });
      }
    } catch (error) {
      setIsLoading(false);
      showToast({
        type: "error",
        title: "Error checking plan assignments",
      });
    }
  };

  // Check if batch has assigned users before deletion
  const handleDeleteBatch = async (id, batchName) => {
    try {
      setIsLoading(true);
      const response = await checkBatchAssignmentsAPI(id);
      setIsLoading(false);

      if (response?.status === 200) {
        const assignedUsers = response.data;

        if (assignedUsers && assignedUsers.length > 0) {
          setAssignedUsers(assignedUsers);
          setEntityToDelete({ type: "Batch", name: batchName, id });

          // Check if there are alternative batches for reassignment
          if (batches.length <= 1) {
            Alert.alert(
              "Cannot Delete Batch",
              "This batch has assigned users and it's your only batch. Please add another batch before deleting this one.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Add New Batch",
                  onPress: () => {
                    setActiveTab("batches");
                    openAddModal();
                  },
                },
              ],
            );
          } else {
            setWarningModalVisible(true);
          }
        } else {
          showDeleteConfirmation(id, "batch");
        }
      } else {
        showToast({
          type: "error",
          title: "Failed to check batch assignments",
        });
      }
    } catch (error) {
      setIsLoading(false);
      showToast({
        type: "error",
        title: "Error checking batch assignments",
      });
    }
  };

  const showDeleteConfirmation = (id, type) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete this ${type}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setIsLoading(true);
              const response =
                type === "Plan"
                  ? await deletePlanAPI(id)
                  : await deleteBatchAPI(id);

              setIsLoading(false);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: `${
                    type.charAt(0).toUpperCase() + type.slice(1)
                  } deleted successfully!`,
                });
                await fetchPlansAndBatches();
              } else {
                showToast({
                  type: "error",
                  title: `Failed to delete ${type}`,
                });
              }
            } catch (error) {
              setIsLoading(false);
              showToast({
                type: "error",
                title: `Failed to delete ${type}`,
              });
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  // Navigate to assignment page
  const navigateToAssignment = () => {
    setWarningModalVisible(false);

    // Check if there are enough alternative plans/batches for reassignment
    if (entityToDelete.type === "Plan" && plans.length <= 1) {
      // Show alert that at least one more plan is needed
      Alert.alert(
        "Cannot Reassign Users",
        "You only have one plan available. Please add another plan before deleting this one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add New Plan",
            onPress: () => {
              setActiveTab("plans");
              openAddModal();
            },
          },
        ],
      );
    } else if (entityToDelete.type === "Batch" && batches.length <= 1) {
      // Show alert that at least one more batch is needed
      Alert.alert(
        "Cannot Reassign Users",
        "You only have one batch available. Please add another batch before deleting this one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add New Batch",
            onPress: () => {
              setActiveTab("batches");
              openAddModal();
            },
          },
        ],
      );
    } else {
      // There are multiple plans/batches, navigate to assignment page
      router.push({
        pathname: "/owner/assignplans",
        params: {
          tab: activeTab === "plans" ? "Plan" : "Batch",
        },
      });
    }
  };

  // Handle saving No Cost EMI and BNPL settings
  const handleNoCostEMIChange = async (value) => {
    setNoCostEMI(value);
    await saveNoCostBNPLSettings(value, bnpl);
  };

  const handleBNPLChange = async (value) => {
    setBnpl(value);
    await saveNoCostBNPLSettings(noCostEMI, value);
  };

  const saveNoCostBNPLSettings = async (noCostEMIValue, bnplValue) => {
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
        gym_id: gymId,
        no_cost_emi: noCostEMIValue,
        bnpl: bnplValue,
      };

      const response = await noCostBNPLSetAPI(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Settings updated successfully",
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to update settings",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error updating settings",
      });
    }
  };

  const tabs = [
    { id: "plans", label: "Plans" },
    { id: "batches", label: "Batches" },
  ];

  const [planSubTab, setPlanSubTab] = useState("membership");
  const planTabScrollRef = useRef(null);

  const planSubTabs = [
    { id: "membership", label: "Individual" },
    { id: "couple_membership", label: "Couple" },
    { id: "buddy_membership", label: "Buddy" },
    { id: "pt", label: "Individual PT" },
    { id: "couple_pt", label: "Couple PT" },
    { id: "buddy_pt", label: "Buddy PT" },
  ];

  // Filter and sort plans based on sub tab (sorted by duration: lesser to higher)
  const getFilteredPlans = () => {
    let filteredPlans = [];

    if (planSubTab === "membership") {
      // Individual plans (not couple, not buddy, not PT)
      filteredPlans =
        plans?.filter(
          (plan) =>
            (plan.plan_for === "individual" ||
              (!plan.is_couple && !plan.plan_for)) &&
            !plan.personal_training,
        ) || [];
    } else if (planSubTab === "couple_membership") {
      // Couple plans (not PT)
      filteredPlans =
        plans?.filter(
          (plan) =>
            (plan.plan_for === "couple" || plan.is_couple) &&
            !plan.personal_training,
        ) || [];
    } else if (planSubTab === "buddy_membership") {
      // Buddy plans (not PT)
      filteredPlans =
        plans?.filter(
          (plan) => plan.plan_for === "buddy" && !plan.personal_training,
        ) || [];
    } else if (planSubTab === "pt") {
      // Individual PT plans
      filteredPlans =
        plans?.filter(
          (plan) =>
            plan.personal_training &&
            (plan.plan_for === "individual" ||
              (!plan.is_couple && !plan.plan_for)),
        ) || [];
    } else if (planSubTab === "couple_pt") {
      // Couple PT plans
      filteredPlans =
        plans?.filter(
          (plan) =>
            plan.personal_training &&
            (plan.plan_for === "couple" || plan.is_couple),
        ) || [];
    } else if (planSubTab === "buddy_pt") {
      // Buddy PT plans
      filteredPlans =
        plans?.filter(
          (plan) => plan.personal_training && plan.plan_for === "buddy",
        ) || [];
    }

    // Sort by duration (lesser to higher)
    return filteredPlans.sort((a, b) => (a.duration || 0) - (b.duration || 0));
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <NewOwnerHeader
          text={"Manage Plans and Batches"}
          onBackButtonPress={() => router.push("/owner/home")}
        />
        <TabHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ManagePlansSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <OwnerHeader /> */}

      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        text={"Manage Plans and Batches"}
        onBackButtonPress={() => router.push("/owner/home")}
      />

      {/* Custom Tab Container */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tab}
          >
            {activeTab === tab.id ? (
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeTabText}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabButton}>
                <Text style={styles.tabText}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "plans" ? (
          <>
            <View style={styles.noCostEmiCard}>
              <View style={styles.noCostEmiContent}>
                <View style={styles.noCostEmiTextContainer}>
                  <Text style={styles.noCostEmiTitle}>No-Cost EMI</Text>
                  <Text style={styles.noCostEmiSubtitle}>
                    Available on 3 & 6 months tenure
                  </Text>
                </View>
                <Switch
                  value={noCostEMI}
                  onValueChange={handleNoCostEMIChange}
                  trackColor={{ false: "#D1D5DB", true: "#007BFF" }}
                  thumbColor={noCostEMI ? "#FFFFFF" : "#F3F4F6"}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <Text style={styles.noCostEmiTerms}>View T&C</Text>
              </TouchableOpacity>
            </View>

            {/* Plan Sub Tabs - Horizontal Scrollable */}
            <View style={styles.planTabsContainer}>
              <ScrollView
                ref={planTabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.planTabScrollContent}
              >
                {planSubTabs.map((tab, index) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.planTab,
                      planSubTab === tab.id && styles.planTabActive,
                    ]}
                    onPress={() => {
                      setPlanSubTab(tab.id);
                      // Auto-scroll to keep selected tab visible with context
                      const tabWidth = 120; // approximate tab width
                      let scrollX = 0;

                      if (index === 0) {
                        // First tab - scroll to start
                        scrollX = 0;
                      } else if (index >= planSubTabs.length - 2) {
                        // Last 2 tabs - scroll to end
                        scrollX = (planSubTabs.length - 3) * tabWidth;
                      } else {
                        // Middle tabs - position with one tab visible on left
                        scrollX = (index - 1) * tabWidth;
                      }

                      planTabScrollRef.current?.scrollTo({
                        x: Math.max(0, scrollX),
                        animated: true,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.planTabText,
                        planSubTab === tab.id && styles.planTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              <View style={styles.paginationDots}>
                {planSubTabs.map((tab) => (
                  <View
                    key={tab.id}
                    style={[
                      styles.paginationDot,
                      planSubTab === tab.id && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Horizontal Scrollable Plan Cards */}
            {getFilteredPlans().length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCardsContainer}
              >
                {getFilteredPlans().map((item) => (
                  <PlanCard
                    key={item.id}
                    item={item}
                    name={item.plans}
                    type={activeTab}
                    onEdit={openEditModal}
                    onDelete={handleDeletePlan}
                    showPersonalTrainingBadge={item.personal_training}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noFeedContainer}>
                <MaterialCommunityIcons
                  name="card-account-details"
                  size={80}
                  color="#CBD5E0"
                />
                <Text style={styles.noFeedTitle}>No Plans to Show</Text>
                <Text style={styles.noFeedSubtitle}>Add Plans to Start.</Text>
              </View>
            )}
          </>
        ) : (
          <FlatList
            data={batches}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PlanCard
                item={item}
                name={item.batch_name}
                type={activeTab}
                onEdit={openEditModal}
                onDelete={handleDeleteBatch}
                showPersonalTrainingBadge={false}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardsList}
            ListEmptyComponent={
              <View style={styles.noFeedContainer}>
                <MaterialCommunityIcons
                  name="card-account-details"
                  size={80}
                  color="#CBD5E0"
                />
                <Text style={styles.noFeedTitle}>No Batches to Show</Text>
                <Text style={styles.noFeedSubtitle}>Add Batches to Start.</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Bottom Buttons Row - 75% Add New, 25% Reassign */}
      <View
        style={[
          styles.bottomButtonsContainer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.addNewButton} onPress={openAddModal}>
            <Ionicons name="add-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addNewButtonText}>
              Add New {activeTab === "plans" ? "Plan" : "Batch"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unified Modal for both Plans and Batches */}
      <EntityModal
        visible={isModalVisible}
        onClose={closeModal}
        onSave={handleSave}
        entityType={activeTab}
        isEditMode={isEditMode}
        initialData={selectedItem || {}}
        styles={styles}
        insets={insets}
      />

      {/* Warning Modal for deletion with assigned users */}
      <AssignmentWarningModal
        visible={warningModalVisible}
        onClose={() => setWarningModalVisible(false)}
        assignedUsers={assignedUsers}
        entityType={entityToDelete.type}
        entityName={entityToDelete.name}
        onRedirect={navigateToAssignment}
        styles={styles}
      />

      {/* General Modal */}
      <Modal
        visible={showGeneralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGeneralModal(false)}
      >
        <View style={styles.generalModalOverlay}>
          <View style={styles.generalModalContent}>
            <TouchableOpacity
              style={styles.generalCloseButton}
              onPress={() => setShowGeneralModal(false)}
            >
              <Feather name="x" size={20} color="#333" />
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 0 }}>
              <Image
                source={require("../../assets/images/modal/session.png")}
                style={styles.generalModalImage}
                resizeMode="cover"
              />
            </View>

            <TouchableOpacity
              style={styles.generalButtonWrapper}
              onPress={handleModalButtonClick}
            >
              <View style={styles.generalButton}>
                <Text style={styles.generalButtonText}>Set Now</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalContainer}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.termsModalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  A 5% processing fee will be deducted from the total payment
                  amount received by the gym owner.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  Clients can pay using 3-month or 6-month EMI tenure option.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  No Cost EMI is available only for plans with amount ₹4,000 or
                  above.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  The EMI interest is borne by the gym owner through the 5%
                  deduction.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  Clients will see 0% interest on their EMI payments.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  The full payment (minus 5% deduction) will be settled to the
                  gym owner within standard settlement timelines.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  This feature can be enabled or disabled at any time from the
                  gym settings.
                </Text>
              </View>

              <View style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>
                  Razorpay's standard EMI terms and conditions apply.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.termsModalFooter}>
              <TouchableOpacity
                style={styles.termsCloseButton}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.termsCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GymManagementPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  reassignButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0078FF",
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reassignButtonText: {
    color: "#0078FF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    padding: 15,
    alignItems: "center",
    paddingTop: 10,
  },
  headerTitle: {
    color: "#FF5757",
    fontSize: 22,
    fontWeight: "bold",
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    marginBottom: 0,
    marginTop: 10,
    marginHorizontal: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tabText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // List Styles
  listContainer: {
    flex: 1,
    padding: 15,
    paddingBottom: 140,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
    width: "90%",
  },
  addButton: {
    backgroundColor: "#FF5757",
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  listItem: {
    backgroundColor: "white",
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  cardLayout: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    maxWidth: "100%",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#FF5757",
  },
  listItemDuration: {
    paddingVertical: 4,
    fontSize: 14,
    color: "#666",
  },
  amount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  listItemDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iconTextGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 4,
  },

  // Add Screen Styles
  screenContainer: {
    flex: 1,
    backgroundColor: "#f4f4f8",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: width * 0.05,
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    color: "#333",
    fontWeight: "bold",
  },
  inputLabelMuted: {
    color: "#8888",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: width * 0.04,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#FF5757",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#FF5757",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionTemplates: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionButton: {
    padding: 5,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFFF",
    marginTop: 50,
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
    color: "#FF5757",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "90%",
    maxHeight: height * 0.7,
    padding: 0,
    elevation: 5,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#F8F9FA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  modalBody: {
    padding: 15,
    maxHeight: height * 0.4,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
  },
  modalWarning: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalPrimaryButton: {
    backgroundColor: "#0078FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  modalPrimaryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalSecondaryButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  modalSecondaryButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: {
    fontSize: 16,
    marginLeft: 10,
    color: "#444",
  },
  addNewButton: {
    flex: 3,
    backgroundColor: "#0078FF",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  noCostEmiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  noCostEmiContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noCostEmiTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  noCostEmiTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  noCostEmiSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 18,
  },
  noCostEmiTerms: {
    fontSize: 12,
    color: "#007BFF",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  planTabsContainer: {
    paddingVertical: 8,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  planTabScrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  planTab: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  planTabActive: {
    backgroundColor: "#E8F4FD",
    borderColor: "#007BFF",
    borderWidth: 2,
  },
  planTabText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  planTabTextActive: {
    color: "#007BFF",
    fontWeight: "600",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  paginationDotActive: {
    backgroundColor: "#007BFF",
  },
  horizontalCardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 150,
  },
  generalModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  generalModalContent: {
    width: "95%",
    backgroundColor: "#FF5757",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generalCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  generalModalImage: {
    width: "100%",
    height: height * 0.55,
  },
  generalButtonWrapper: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: "70%",
    zIndex: 10,
  },
  generalButton: {
    paddingVertical: width > 400 ? 14 : 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 3,
    backgroundColor: "#0A2342",
    borderBottomColor: "#0A2342",
  },
  generalButtonText: {
    color: "#FFFFFF",
    fontSize: width > 400 ? 16 : 14,
    fontWeight: "700",
  },
  termsModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "98%",
    maxHeight: height * 0.7,
    overflow: "hidden",
    elevation: 5,
  },
  termsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  termsModalBody: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  termsItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  termsBullet: {
    fontSize: 16,
    color: "#007BFF",
    marginRight: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  termsModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  termsCloseButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  termsCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
