import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ClientInformation from "../../../components/client/ClientInformation";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import TabHeader from "../../../components/home/finances/TabHeader";
import Toast from "react-native-toast-message";
import ClientDietReport from "../../../components/client/ClientDietReport";
import ClientWorkoutReport from "../../../components/client/ClientWorkoutReport";
import FeeStatusModal from "../../../components/client/FeeStatusModal";
import FeeDetailsModal from "../../../components/client/FeeDetailsModal";
import ReceiptModal from "../../../components/client/Receipt";
import { useRouter } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import AccessDeniedComponent from "../../../utils/accessDeniedComponent";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
import {
  getFeeDetailsAPI,
  getPlansandBatchesAPI,
  updateFeeStatusAPI,
  deleteFeeStatusAPI,
  getClientsAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { paymentOptions } from "../../../components/home/data";
import { dateUtils } from "../../../utils/date";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const gstTypeOptions = [
  { label: "Inclusive", value: "inclusive" },
  { label: "Exclusive", value: "exclusive" },
  { label: "No GST", value: "no_gst" },
];

const ClientInfo = () => {
  const {
    id,
    client: clientString,
    role,
    trainerPermissions,
  } = useLocalSearchParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeDetailsModalVisible, setFeeDetailsModalVisible] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [originalFee, setOriginalFee] = useState(0);
  const [discountedFee, setDiscountedFee] = useState(0);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("cash");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");
  const [gstType, setGstType] = useState("no_gst");
  const [gstPercentage, setGstPercentage] = useState("");
  const [gymData, setGymData] = useState(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (clientString) {
      try {
        // Safely decode and parse client data
        let decodedString = clientString;
        try {
          decodedString = decodeURIComponent(clientString);
        } catch (decodeError) {
          console.warn("[ClientInfo] Failed to decode URI, using raw string:", decodeError);
        }

        const clientData = JSON.parse(decodedString);

        // Validate essential fields
        if (!clientData || typeof clientData !== "object") {
          throw new Error("Invalid client data structure");
        }

        // Ensure id exists
        if (!clientData.id && !clientData.client_id) {
          console.warn("[ClientInfo] Client data missing id:", clientData);
        }

        setClient(clientData);
        setSelectedClient(clientData);
      } catch (error) {
        console.error("[ClientInfo] Error parsing client data:", error, clientString?.substring?.(0, 100));
        showToast({
          type: "error",
          title: "Error loading client",
          desc: "Please go back and try again",
        });
        // Optionally navigate back
        // router.back();
      }
    }
  }, [clientString]);

  // Helper function to check if user has access to workout/diet reports
  const hasAccessToReports = useCallback(() => {
    if (role === "owner") {
      return client?.data_sharing;
    } else if (role === "trainer") {
      // For trainers, check both data_sharing and trainer permissions
      return client?.data_sharing && trainerPermissions == "true";
    }
    return false;
  }, [role, client?.data_sharing, trainerPermissions]);

  // Fetch plans and batches
  const fetchPlansAndBatches = useCallback(async () => {
    try {
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
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching plans and batches",
      });
    }
  }, []);

  // Fetch gym data
  const fetchGymData = useCallback(async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getClientsAPI(gymId);
      if (response?.status === 200 && response?.gym_data) {
        setGymData(response.gym_data);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching gym data",
      });
    }
  }, []);

  useEffect(() => {
    fetchPlansAndBatches();
    fetchGymData();
  }, [fetchPlansAndBatches, fetchGymData]);

  const openFeeDetailsModal = useCallback(async (clientData) => {
    try {
      const response = await getFeeDetailsAPI(clientData.training_id);
      if (response?.status === 200) {
        setOriginalFee(response?.data?.amount || 0);
        setSelectedPlan(response?.data);
        setDiscountedFee(response.data.amount || 0);
        setGstType("no_gst");
        setGstPercentage("");
        setFeeDetailsModalVisible(true);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Could not fetch fee details",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to fetch fee details",
      });
    }
  }, []);

  const toggleFeeStatus = useCallback(
    (clientData) => {
      if (clientData.is_old_client === false) {
        openFeeDetailsModal(clientData);
      } else {
        setFeeModalVisible(true);
      }
    },
    [openFeeDetailsModal]
  );

  const handleOriginalFee = useCallback((value) => {
    if (value) {
      setOriginalFee(value);
      setDiscountedFee(0);
    }
  }, []);

  const updateFeeStatus = useCallback(async () => {
    if (selectedClient) {
      try {
        const finalFee = discountedFee ? discountedFee : originalFee;

        const gstAmount =
          gstType === "no_gst" || !gstPercentage
            ? 0
            : (finalFee * parseFloat(gstPercentage)) / 100;

        const totalAmount =
          gstType === "no_gst"
            ? finalFee
            : gstType === "exclusive"
              ? finalFee + gstAmount
              : finalFee;

        const payload = {
          client_id: selectedClient.id,
          gym_id: selectedClient.gym_id,
          type: "fees",
          plan_id: selectedPlan.id,
          fees: discountedFee ? discountedFee : originalFee,
          payment_method: selectedPaymentOption,
          payment_reference_number: paymentReferenceNumber,
          gst_type: gstType,
          gst_percentage:
            gstType !== "no_gst" ? parseFloat(gstPercentage) || 0 : 0,
          total_amount: totalAmount,
        };

        const response = await updateFeeStatusAPI(payload);

        if (response?.status === 200) {
          setFeeModalVisible(false);
          setFeeDetailsModalVisible(false);
          showToast({
            type: "success",
            title: `Fee status for ${selectedClient?.name} updated successfully`,
          });

          setClient((prev) => ({
            ...prev,
            feePaid: "Paid",
          }));
        } else {
          showToast({
            type: "error",
            title: response?.message,
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Failed to update fee status",
        });
      }
    }
  }, [
    selectedClient,
    discountedFee,
    originalFee,
    selectedPaymentOption,
    paymentReferenceNumber,
    gstType,
    gstPercentage,
    selectedPlan,
  ]);

  const deleteFeeStatus = useCallback(async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await deleteFeeStatusAPI(selectedClient.id, gymId);

      if (response?.status === 200) {
        setFeeModalVisible(false);
        showToast({
          type: "success",
          title: `Fee status for ${selectedClient.name} updated successfully`,
        });

        setClient((prev) => ({
          ...prev,
          feePaid: "Not Paid",
        }));
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to update fee status",
      });
    }
  }, [selectedClient]);

  const handleUpdateFeesPress = () => {
    if (client) {
      toggleFeeStatus(client);
    }
  };



  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler
        onBackPress={() => {
          router.back();
          return true;
        }}
        enabled={true}
      />
      <NewOwnerHeader
        text="Client Details"
        onBackButtonPress={() => router.back()}
      />



      <View style={styles.container}>
        <ClientInformation client={client} />
      </View>

      <Toast />
    </View>
  );
};

export default ClientInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  comingSoon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: "#666",
  },
});
