import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";

const { width } = Dimensions.get("window");

const PunchInOutButtons = () => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gymLocation, setGymLocation] = useState(null);
  const [pulseAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchAttendanceStatus();
    fetchGymLocation();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchAttendanceStatus = async () => {
    try {
      const trainerId = await getToken("trainer_id");
      const gymId = await getToken("gym_id");
      if (!trainerId || !gymId) return;

      const response = await axiosInstance.get(
        `/trainer-attendance/check-status?trainer_id=${trainerId}&gym_id=${gymId}`
      );

      if (response?.data?.status === 200) {
        setAttendanceStatus(response.data);
      }
    } catch (error) {}
  };

  const fetchGymLocation = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      const response = await axiosInstance.get(
        `/owner/gym/get_location?gym_id=${gymId}`
      );
      if (response?.data?.status === 200) {
        setGymLocation(response.data.gym_location);
      }
    } catch (error) {}
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions to punch in/out.",
          [{ text: "OK" }]
        );
        return null;
      }

      // Get current location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Allow 10 second old location
        timeout: 30000, // 30 second timeout
      });

      setCurrentLocation(location.coords);
      return location.coords;
    } catch (error) {
      // Fallback to lower accuracy if high accuracy fails
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 30000, // Allow 30 second old location
          timeout: 15000, // 15 second timeout
        });

        setCurrentLocation(location.coords);
        return location.coords;
      } catch (fallbackError) {
        showToast({
          type: "error",
          title: "Location Error",
          subtitle: "Unable to get your current location. Please try again.",
        });
        return null;
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const validateLocation = (userLocation) => {
    if (!gymLocation || !userLocation) {
      return { valid: false, message: "Location data unavailable" };
    }

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      gymLocation.latitude,
      gymLocation.longitude
    );

    const allowedDistance = gymLocation.radius || 100; // Default 100m radius

    if (distance <= allowedDistance) {
      return { valid: true, distance };
    } else {
      return {
        valid: false,
        message: `You are ${Math.round(
          distance
        )}m away from the gym. Please move closer (within ${allowedDistance}m).`,
        distance,
      };
    }
  };

  const handlePunchIn = async () => {
    if (loading || locationLoading) return;

    setLoading(true);

    try {
      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        setLoading(false);
        return;
      }

      // Validate location
      const locationValidation = validateLocation(location);
      if (!locationValidation.valid) {
        Alert.alert("Location Validation Failed", locationValidation.message, [
          { text: "OK" },
        ]);
        setLoading(false);
        return;
      }

      // Proceed with punch in
      const trainerId = await getToken("trainer_id");
      const gymId = await getToken("gym_id");

      const response = await axiosInstance.post(
        "/trainer-attendance/punch-in",
        {
          trainer_id: trainerId,
          gym_id: gymId,
          location: `${location.latitude},${location.longitude}`,
        }
      );

      if (response?.data?.status === 200) {
        showToast({
          type: "success",
          title: "Punched In Successfully!",
          subtitle: "Your attendance has been recorded.",
        });
        fetchAttendanceStatus();
      } else {
        throw new Error(response?.data?.message || "Punch in failed");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Punch In Failed",
        subtitle:
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (loading || locationLoading) return;

    Alert.alert("Confirm Punch Out", "Are you sure you want to punch out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Punch Out", onPress: performPunchOut },
    ]);
  };

  const performPunchOut = async () => {
    setLoading(true);

    try {
      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        setLoading(false);
        return;
      }

      // Validate location (optional for punch out, but good practice)
      const locationValidation = validateLocation(location);
      if (!locationValidation.valid) {
        Alert.alert(
          "Location Warning",
          `${locationValidation.message}\n\nDo you still want to punch out?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setLoading(false),
            },
            { text: "Punch Out", onPress: () => continuePunchOut(location) },
          ]
        );
        return;
      }

      await continuePunchOut(location);
    } catch (error) {
      showToast({
        type: "error",
        title: "Punch Out Failed",
        subtitle:
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
      setLoading(false);
    }
  };

  const continuePunchOut = async (location) => {
    try {
      const trainerId = await getToken("trainer_id");
      const gymId = await getToken("gym_id");

      const response = await axiosInstance.post(
        "/trainer-attendance/punch-out",
        {
          trainer_id: trainerId,
          gym_id: gymId,
          location: `${location.latitude},${location.longitude}`,
        }
      );

      if (response?.data?.status === 200) {
        showToast({
          type: "success",
          title: "Punched Out Successfully!",
          subtitle: "Your session has been completed.",
        });
        fetchAttendanceStatus();
      } else {
        throw new Error(response?.data?.message || "Punch out failed");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Punch Out Failed",
        subtitle:
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--:--";
    try {
      // Check if it's already a full ISO string or just time
      const time = timeString.includes("T")
        ? new Date(timeString)
        : new Date(`1970-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "--:--";
    }
  };

  const isPunchedIn = attendanceStatus?.is_punched_in;
  const currentHours = 0; // Will need to get from today's attendance endpoint
  const currentSession = attendanceStatus?.current_session;

  return (
    <View style={styles.container}>
      {/* Compact Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.entryButton,
            isPunchedIn && styles.disabledButton,
          ]}
          onPress={handlePunchIn}
          disabled={isPunchedIn || loading || locationLoading}
        >
          <View style={styles.buttonIcon}>
            <Ionicons name="enter-outline" size={16} color="#10A0F6" />
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Punch In</Text>
            {currentSession?.punch_in && isPunchedIn && (
              <Text style={styles.buttonSubtitle}>
                {formatTime(currentSession.punch_in)}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.exitButton,
            !isPunchedIn && styles.disabledButton,
          ]}
          onPress={handlePunchOut}
          disabled={!isPunchedIn || loading || locationLoading}
        >
          <View style={styles.buttonIcon}>
            <Ionicons name="exit-outline" size={16} color="#FF5757" />
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Punch Out</Text>
            {isPunchedIn && (
              <Text style={styles.buttonSubtitle}>Active Session</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      {isPunchedIn && (
        <View style={styles.sessionInfo}>
          <View style={styles.sessionItem}>
            <FontAwesome5 name="clock" size={14} color="#64748b" />
            <Text style={styles.sessionLabel}>Started</Text>
            <Text style={styles.sessionValue}>
              {formatTime(currentSession?.punch_in) || "N/A"}
            </Text>
          </View>
          <View style={styles.sessionItem}>
            <FontAwesome5 name="hourglass-half" size={14} color="#64748b" />
            <Text style={styles.sessionLabel}>Hours Today</Text>
            <Text style={styles.sessionValue}>{currentHours}h</Text>
          </View>
        </View>
      )}

      {/* Location Status */}
      {locationLoading && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color="#10A0F6" />
          <Text style={styles.locationText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 5,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eaeef2",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8f9fa",
  },
  entryButton: {
    backgroundColor: "#f0f8ff",
    borderColor: "#10A0F6",
  },
  exitButton: {
    backgroundColor: "#fff5f5",
    borderColor: "#FF5757",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    lineHeight: 18,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  sessionInfo: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  sessionItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  sessionLabel: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
  sessionValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d3748",
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: "#10A0F6",
    marginLeft: 8,
  },
});

export default PunchInOutButtons;
