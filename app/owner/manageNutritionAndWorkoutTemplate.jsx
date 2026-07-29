import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import OwnerHeader from "../../components/ui/OwnerHeader";
import DietTracker from "./diet";
import WorkoutTracker from "./workout_schedule";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import WorkoutCard from "../../components/workout/WorkoutCard";
import HardwareBackHandler from "../../components/HardwareBackHandler";

const { width, height } = Dimensions.get("window");

const ManageNutritionAndWorkoutTemplate = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <HardwareBackHandler
        routePath={
          pathname === "/owner/manageNutritionAndWorkoutTemplate"
            ? "/owner/home"
            : ""
        }
        enabled={true}
        key="manage-nutrition-back-handler"
      />

      <NewOwnerHeader
        onBackButtonPress={() => router.replace("/owner/home")}
        text="Manage Diet and Workout Plans"
      />

      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <WorkoutCard
            title={"Workout Plans"}
            subtitle={
              "Create Predefined Plans for each day and assign to clients in single tap"
            }
            imagePath={require("../../assets/images/workout_plans.png")}
            buttonText="Manage Workout"
            onPress={() => router.push("/owner/(workout)/personalTemplate")}
            textColor={"#000000"}
            paraTextColor={"#00000081"}
            buttonTextColor={"#62D2D3"}
            bg1={"#F7F7F7"}
            bg2={"#F7F7F7"}
            border1={"#28a74629"}
            border2={"#297eb32f"}
            charWidth={100}
          />

          <WorkoutCard
            title={"Diet Plans"}
            subtitle={
              "Create Predefined Plans for each day and assign to clients in single tap"
            }
            imagePath={require("../../assets/images/diet_plans.png")}
            buttonText="Manage Diet"
            onPress={() => router.push("/owner/(diet)/personalTemplate")}
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

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Fymble Business is not a medical service provider. Please consult a
            healthcare professional for diagnosis, treatment, or medical advice.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ManageNutritionAndWorkoutTemplate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    padding: 15,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FF5757",
    fontSize: 22,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#FF5757",
  },
  tabText: {
    color: "#888",
    fontSize: 16,
  },
  activeTabText: {
    color: "#FF5757",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    padding: 15,
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
    backgroundColor: "#F7F7F7",
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
    backgroundColor: "#FF5757",
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
  disclaimerContainer: {
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
});
