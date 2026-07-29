import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import OwnerHeader from "../../components/ui/OwnerHeader";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {
  deleteUnverifiedClientsAPI,
  getUnverifiedClientsAPI,
  updateUnverifiedClientsAPI,
} from "../../services/Api";

import { getToken } from "../../utils/auth";
import AllClientsSkeleton from "../../components/ui/loaders/allClientsSkeleton";
const { width, height } = Dimensions.get("window");

const ViewClientDetails = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [clients, setClients] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [load, setLoad] = useState(false);
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
  };

  const searchClients = (clients) => {
    if (!searchQuery) return clients;

    const lowercaseQuery = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowercaseQuery) ||
        client.contact.includes(lowercaseQuery) ||
        client.email.toLowerCase().includes(lowercaseQuery)
    );
  };
  const filteredClients = searchClients(clients);

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditMobile(client.contact);
    setEditModalVisible(true);
  };

  const fetchUnverifiedClients = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "An Unexpected Error Occured",
        });
        return;
      }
      const response = await getUnverifiedClientsAPI(gymId);
      if (response?.status === 200) {
        setClients(response?.data);
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
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnverifiedClients();
  }, []);

  const handleSaveClient = async () => {
    if (!editName.trim()) {
      showToast({
        type: "error",
        title: "Name cannot be empty",
      });
      return;
    }

    if (!validateEmail(editEmail)) {
      showToast({
        type: "error",
        title: "Please enter a valid email address",
      });
      return;
    }

    if (!validateMobile(editMobile)) {
      showToast({
        type: "error",
        title: "Mobile number must be 10 digits",
      });
      return;
    }
    try {
      setLoad(true);
      const payload = {
        name: editName,
        email: editEmail,
        contact: editMobile,
        id: selectedClient.id,
      };
      const response = await updateUnverifiedClientsAPI(payload);
      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Client Details Updated Successfully",
        });
        await fetchUnverifiedClients();
        setEditModalVisible(false);
        setLoad(false);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Error Updating Client Details",
        });
        setLoad(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error Updating Client Details",
      });
      setLoad(false);
    }
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteUnverifiedClientsAPI(client.id);
              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: "Client Deleted Successfully",
                });
                await fetchUnverifiedClients();
              } else {
                showToast({
                  type: "error",
                  title: response?.detail || "Error Deleting Client",
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Error Deleting Client",
              });
            }
          },
        },
      ]
    );
  };

  const renderClientItem = ({ item }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientDetail}>{item.contact}</Text>
        <Text style={styles.clientDetail}>{item.email}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditClient(item)}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteClient(item)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return <AllClientsSkeleton />;
  }

  if (clients.length === 0) {
    return (
      <>
        <View style={styles.noFeedContainer}>
          <Text style={styles.headerTitle}>Unverified Clients</Text>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={80}
            color="#CBD5E0"
          />

          <Text style={styles.noFeedTitle}>No Unverified Clients Found</Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Clients Pending Verification</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients by name, mobile, or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Client Details</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile"
              value={editMobile}
              onChangeText={setEditMobile}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveClient}
              >
                {load ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#FF5757",
  },
  tabText: {
    color: "#333",
    fontWeight: "600",
  },
  activeTabText: {
    color: "white",
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  clientCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  clientDetail: {
    color: "#666",
    marginBottom: 3,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#FF5757",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  saveButton: {
    backgroundColor: "#FF5757",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    paddingRight: 40,
  },
  clearSearchButton: {
    position: "absolute",
    right: 20,
    padding: 5,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyListText: {
    color: "#666",
    fontSize: 16,
  },
  title: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#FF5757",
    textAlign: "center",
    marginVertical: height * 0.02,
  },
  noFeedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default ViewClientDetails;
