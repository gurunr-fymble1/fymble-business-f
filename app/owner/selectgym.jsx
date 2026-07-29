import { StyleSheet, Text, View } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native";
import { ScrollView } from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { showToast } from "../../utils/Toaster";
import { saveToken, getToken } from "../../utils/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const selectgym = () => {
  const [selectedGym, setSelectedGym] = useState(null);
  const { gyms, user_id, access_token, refresh_token, name, role } =
    useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userRole = role || "owner";

  let gymsList = [];

  try {
    gymsList = gyms ? JSON.parse(gyms) : [];
  } catch (error) {
    showToast({
      type: "error",
      title: "Error parsing gyms data",
    });
  }

  // Pre-select current gym on load
  useEffect(() => {
    const loadCurrentGym = async () => {
      const currentGymId = await getToken("gym_id");
      if (currentGymId && gymsList.length > 0) {
        const currentGym = gymsList.find(
          (gym) => gym.gym_id.toString() === currentGymId.toString()
        );
        if (currentGym) {
          setSelectedGym(currentGym);
        }
      }
    };
    loadCurrentGym();
  }, [gyms]);

  const goToGym = async () => {
    if (selectedGym) {
      try {
        await saveToken("gym_id", selectedGym.gym_id.toString());
        await saveToken("owner_id", selectedGym.owner_id.toString());
        userRole === "trainer" &&
          (await saveToken("trainer_id", user_id.toString()));
        await saveToken("gym_name", selectedGym.name);
        await saveToken("role", userRole);
        await saveToken("name", name);
        await saveToken("access_token", access_token);
        await saveToken("refresh_token", refresh_token);
        await saveToken("gym_logo", selectedGym.logo ? selectedGym.logo : "");

        router.push("/owner/home");
      } catch (error) {
        showToast({
          type: "error",
          title: "An error occurred. Please try again.",
        });
      }
    } else {
      showToast({
        type: "error",
        title: "Please select a gym",
      });
    }
  };

  const getRoleSpecificIcon = () => {
    return userRole === "trainer" ? "barbell" : "business";
  };

  const getRoleSpecificTitle = () => {
    return userRole === "trainer" ? "Select Your Gym" : "Select Your Gym";
  };

  const getRoleSpecificSubtitle = () => {
    return userRole === "trainer"
      ? "Choose the gym where you train clients"
      : "Choose the gym you want to manage";
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.contentContainer}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.roleIndicator}>
            <Ionicons name={getRoleSpecificIcon()} size={24} color="#3498db" />
            <Text style={styles.roleText}>
              {userRole === "trainer" ? "Trainer" : "Gym Owner"}
            </Text>
          </View>
          <Text style={styles.headerSelectionTitle}>
            {getRoleSpecificTitle()}
          </Text>
          <Text style={styles.headerSubtitle}>{getRoleSpecificSubtitle()}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.listContainer}>
            {gymsList.map((gym) => (
              <TouchableOpacity
                key={gym.gym_id}
                style={[
                  styles.gymItem,
                  selectedGym?.gym_id === gym.gym_id && styles.selectedGymItem,
                ]}
                onPress={() => setSelectedGym(gym)}
              >
                <View style={styles.gymContent}>
                  <View style={styles.leftContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        selectedGym?.gym_id === gym.gym_id &&
                          styles.selectedIconContainer,
                      ]}
                    >
                      <Ionicons
                        name="barbell"
                        size={24}
                        color={
                          selectedGym?.gym_id === gym.gym_id
                            ? "#FFFFFF"
                            : "#666666"
                        }
                      />
                    </View>
                    <View style={styles.gymInfo}>
                      <Text style={styles.gymName}>{gym.name}</Text>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color="#666666" />
                        <Text style={styles.locationText}>
                          {gym.location || "Location not specified"}
                        </Text>
                      </View>
                      {userRole === "trainer" && (
                        <View style={styles.trainerBadge}>
                          <Ionicons name="fitness" size={12} color="#3498db" />
                          <Text style={styles.trainerBadgeText}>
                            Training Location
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.rightContent}>
                    {selectedGym?.gym_id === gym.gym_id ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#3498db"
                      />
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#CCCCCC"
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, styles.confirmButtonActive]}
            onPress={goToGym}
          >
            <Ionicons
              name="checkmark-sharp"
              size={20}
              color="#FFFFFF"
              style={styles.confirmIcon}
            />
            <Text style={[styles.confirmButtonText, styles.confirmButtonTextActive]}>
              Confirm Selection
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default selectgym;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  contentContainer: {
    flex: 1,
    width: "90%",
    alignSelf: "center",
    maxWidth: 600,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 20,
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginLeft: 8,
  },
  headerSelectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498db",
    textAlign: "center",
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  listContainer: {
    padding: 20,
  },
  gymItem: {
    borderWidth: 2,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  selectedGymItem: {
    borderColor: "#3498db",
    backgroundColor: "rgba(52, 152, 219, 0.05)",
  },
  gymContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIconContainer: {
    backgroundColor: "#3498db",
  },
  gymInfo: {
    marginLeft: 16,
    flex: 1,
  },
  gymName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  trainerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  trainerBadgeText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
    fontWeight: "500",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  memberCount: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  confirmButtonActive: {
    backgroundColor: "#3498db",
  },
  confirmButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  confirmIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonTextActive: {
    color: "#FFFFFF",
  },
  confirmButtonTextDisabled: {
    color: "#999999",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
});
