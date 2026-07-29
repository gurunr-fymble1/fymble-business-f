import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "../../../utils/Toaster";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import {
  updateServicesAndHours,
  getOldServicesDataAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

const Services = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // State for copying data from oldest gym
  const [hasOtherGyms, setHasOtherGyms] = useState(false);
  const [oldGymName, setOldGymName] = useState("");
  const [oldServicesData, setOldServicesData] = useState(null);

  // Check for old gym data on mount
  useEffect(() => {
    const checkOldGymData = async () => {
      try {
        const ownerId = await getToken("owner_id");
        const gymId = await getToken("gym_id");

        if (!ownerId || !gymId) return;

        const response = await getOldServicesDataAPI(ownerId, gymId);

        if (
          response?.status === 200 &&
          response?.has_other_gyms &&
          response?.data
        ) {
          setHasOtherGyms(true);
          setOldGymName(response.oldest_gym_name || "other gym");
          setOldServicesData(response.data);
        }
      } catch (error) {}
    };

    checkOldGymData();
  }, []);

  const handleCopyFromOldGym = () => {
    if (oldServicesData) {
      let servicesArray = [];

      // Handle JSON string, array, or object formats
      if (typeof oldServicesData === "string") {
        try {
          servicesArray = JSON.parse(oldServicesData);
        } catch (e) {}
      } else if (Array.isArray(oldServicesData)) {
        servicesArray = oldServicesData;
      } else if (oldServicesData.services) {
        servicesArray = oldServicesData.services;
      }

      if (Array.isArray(servicesArray) && servicesArray.length > 0) {
        setSelectedServices(servicesArray);
        showToast({
          type: "success",
          title: `Services copied from ${oldGymName}`,
        });
      }
      // Hide the banner after copying
      setHasOtherGyms(false);
    }
  };

  const services = [
    "General Fitness",
    "Weight Training",
    "Cardio",
    "Personal Training",
    "Group Classes",
    "Yoga",
    "Pilates",
    "Gymnastics",
    "CrossFit",
    "Swimming",
    "Martial Arts",
    "Dance",
    "Physiotherapy",
    "Nutrition Counseling",
    "Sports Training",
    "Other",
  ];

  const toggleService = (service) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSave = async () => {
    if (selectedServices.length === 0) {
      showToast({
        type: "error",
        title: "Please select at least one service",
      });
      return;
    }

    setLoading(true);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID is not available",
        });
        setLoading(false);
        return;
      }

      const payload = {
        gym_id: gymId,
        data_type: "services",
        data: selectedServices,
      };

      const response = await updateServicesAndHours(payload);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Services saved successfully!",
        });
        setTimeout(() => {
          router.push("/owner/home");
        }, 500);
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to save services",
        });
      }
    } catch (error) {
      console.error("Save services error:", error);
      showToast({
        type: "error",
        title: "Failed to save services. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Select Services"
      />

      {/* Copy from Old Gym Banner */}
      {hasOtherGyms && oldServicesData && (
        <TouchableOpacity
          style={styles.copyBanner}
          onPress={handleCopyFromOldGym}
          activeOpacity={0.7}
        >
          <View style={styles.copyBannerLeft}>
            <View style={styles.copyIconContainer}>
              <Ionicons name="sync-outline" size={18} color="#FFF" />
            </View>
            <View style={styles.copyBannerTextContainer}>
              <Text style={styles.copyBannerTitle}>Copy from {oldGymName}</Text>
              <Text style={styles.copyBannerSubtitle}>
                Tap to use same services
              </Text>
            </View>
          </View>
          <View style={styles.copyBannerAction}>
            <Text style={styles.copyBannerActionText}>Apply</Text>
            <Ionicons name="arrow-forward" size={16} color="#0154A0" />
          </View>
        </TouchableOpacity>
      )}

      {/* Selected Services Pills */}
      {selectedServices.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedServices.length} service
              {selectedServices.length !== 1 ? "s" : ""} selected
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedServicesContainer}
            contentContainerStyle={styles.selectedServicesContent}
          >
            {selectedServices.map((service, index) => (
              <LinearGradient
                key={service}
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.servicePill, index > 0 && { marginLeft: 8 }]}
              >
                <Text style={styles.servicePillText}>{service}</Text>
                <TouchableOpacity
                  onPress={() => toggleService(service)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Services List */}
      <FlatList
        data={services}
        keyExtractor={(item) => item}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 20 + insets.bottom },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => toggleService(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.serviceText}>{item}</Text>
            {selectedServices.includes(item) && (
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: 10 + insets.bottom }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || selectedServices.length === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedServices.length === 0
                ? ["#CCC", "#CCC"]
                : ["#030A15", "#0154A0"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.saveButton,
              selectedServices.length === 0 && styles.saveButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Services</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  copyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FBFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E3F5",
    shadowColor: "#0154A0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  copyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  copyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0154A0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  copyBannerTextContainer: {
    flex: 1,
  },
  copyBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  copyBannerSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  copyBannerAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBannerActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0154A0",
  },
  selectedSection: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0154A0",
  },
  selectedServicesContainer: {
    backgroundColor: "#FFFFFF",
  },
  selectedServicesContent: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    flexDirection: "row",
    marginBottom: 10,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  servicePillText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "500",
    marginRight: 6,
  },
  closeButton: {
    padding: 4,
    marginLeft: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  serviceText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  checkmarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default Services;
