import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import NewEnquiryForm from "../../components/EnquiryManagementPage/NewEnquiryForm";

import CompletedEnquiries from "../../components/EnquiryManagementPage/CompletedEnquiries";
import PendingEnquiries from "../../components/EnquiryManagementPage/PendingEnquiries";
import {
  AddClientEnquiry,
  getClientEnquiry,
  updateClientEnquiryStatus,
} from "../../services/Api";

import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../components/home/finances/TabHeader";
import { useRouter } from "expo-router";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { showToast } from "../../utils/Toaster";

const AddEnquiry = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("new");
  const [enquiries, setEnquiries] = useState([]);
  const [completedEnquiries, setCompletedEnquiries] = useState([]);

  const fetchClientQueries = async () => {
    let gym_id = await getToken("gym_id");
    let response = await getClientEnquiry(gym_id);

    if (response?.status === 200) {
      setEnquiries(response?.data?.incomplete_enquiries);
      setCompletedEnquiries(response?.data?.completed_enquiries);
    }
  };

  useEffect(() => {
    fetchClientQueries();
  }, []);

  const addNewEnquiry = async (enquiry) => {
    try {
      let payload = {
        gym_id: await getToken("gym_id"),
        data: {
          ...enquiry,
          status: "Pending",
          statusReason: "",
        },
      };

      let response = await AddClientEnquiry(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Enquiry added successfully",
        });
        fetchClientQueries();
      }

      return response;
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Error adding enquiry",
      });
    } finally {
    }
  };

  const updateEnquiryStatus = async (enquiry_id, status, reason) => {
    const enquiryToUpdate = enquiries.find(
      (item) => item.enquiry_id === enquiry_id
    );

    if (enquiryToUpdate) {
      let payload = {
        enquiry_id: enquiry_id,
        gym_id: await getToken("gym_id"),
        status,
        statusReason: reason,
      };

      const response = await updateClientEnquiryStatus(payload);

      if (response.status === 200) {
        showToast({
          type: "success",
          title: "Enquiry status updated succesfully",
        });
        fetchClientQueries();
      }
    }
  };

  const tabs = [
    { id: "new", label: "New", icon: "add-circle" },
    { id: "pending", label: "Pending", icon: "time" },
    { id: "completed", label: "Completed", icon: "checkmark-done" },
  ];

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Manage Enquiries"}
      />

      <View style={styles.card}>
        {/* <EnquiryHeader activeTab={activeTab} setActiveTab={setActiveTab} /> */}

        <TabHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <View style={styles.content}>
          {activeTab === "new" && (
            <NewEnquiryForm addNewEnquiry={addNewEnquiry} />
          )}

          {activeTab === "pending" && (
            <PendingEnquiries
              enquiries={enquiries}
              updateEnquiryStatus={updateEnquiryStatus}
            />
          )}

          {activeTab === "completed" && (
            <CompletedEnquiries enquiries={completedEnquiries} />
          )}
        </View>
      </View>
    </View>
  );
};

export default AddEnquiry;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    // padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
    flex: 1,
    padding: 10,
  },
  header: {
    backgroundColor: "#2c3e50",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 15,
  },
  tabContainer: {
    flexDirection: "row",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: "#FF5757",
  },
  tabText: {
    color: "#fff",
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 15,
  },
});
