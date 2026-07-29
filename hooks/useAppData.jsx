import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import {
  getGymHomeDataAPI,
  getGymLocationAPI,
  getProfileDataAPI,
  updateGymLocationAPI,
} from "../services/Api";
import { registerForPushNotificationsAsync } from "../components/usePushNotifications";
import { getToken } from "../utils/auth";
import { showToast } from "../utils/Toaster";

const useAppData = () => {
  // All state in one place
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gymId, setGymId] = useState(null);

  // Data states
  const [attendanceData, setAttendanceData] = useState({
    current: 0,
    expected: 1,
    names: [],
  });
  const [membersData, setMembersData] = useState({
    total_members: 0,
    active_members: 0,
    total_trainers: 0,
    total_pending_enquiries: 0,
  });
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);
  const [gymName, setGymName] = useState("");
  const [invoiceData, setInvoiceData] = useState([]);
  const [aboutToExpireList, setAboutToExpireList] = useState([]);
  const [expiredMembersList, setExpiredMembersList] = useState([]);
  const [attendanceChartData, setAttendanceChartData] = useState([]);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

  // Version checking states
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Cache and timing - Increased cache duration for better performance
  const lastFetchTime = useRef(null);
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache (increased from 5)

  // Version checking functions
  const checkAppVersion = useCallback(async () => {
    try {
      const currentVersion = Constants.expoConfig.version;

      // Replace with your actual version check endpoint
      //   const response = await fetch("YOUR_API_ENDPOINT/check-version");
      //   const data = await response.json();
      const data = {
        latestVersion: "1.0.5",
        forceUpdate: true,
        updateMessage: "A new version is available!",
      };
      if (isUpdateRequired(currentVersion, data.latestVersion)) {
        setUpdateInfo({
          currentVersion,
          latestVersion: data.latestVersion,
          forceUpdate: data.forceUpdate || false,
          updateMessage: data.updateMessage || "A new version is available!",
        });
        setShowUpdatePrompt(true);
      }
    } catch (error) {
      // Fail silently for version check
    }
  }, []);

  const isUpdateRequired = (current, latest) => {
    const currentParts = current.split(".").map(Number);
    const latestParts = latest.split(".").map(Number);

    for (
      let i = 0;
      i < Math.max(currentParts.length, latestParts.length);
      i++
    ) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (currentPart > latestPart) return false;
    }
    return false;
  };

  const handleUpdatePrompt = useCallback(() => {
    if (!updateInfo) return;

    const storeUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/in/app/fittbot-business/id6747059115"
        : "https://play.google.com/store/apps/details?id=com.fittbot.fittbot_business";

    Alert.alert(
      "Update Available",
      updateInfo.updateMessage,
      [
        ...(updateInfo.forceUpdate
          ? []
          : [
              {
                text: "Later",
                style: "cancel",
                onPress: () => setShowUpdatePrompt(false),
              },
            ]),
        {
          text: "Update Now",
          onPress: () => Linking.openURL(storeUrl),
        },
      ],
      { cancelable: !updateInfo.forceUpdate }
    );
  }, [updateInfo]);

  // Combined data fetching function with better caching
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Check cache validity
    const now = Date.now();
    if (
      !forceRefresh &&
      lastFetchTime.current &&
      now - lastFetchTime.current < CACHE_DURATION
    ) {
      // Return cached data without making API calls
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isLoading && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    try {
      // Get gym ID first
      const currentGymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      const trainerId = await getToken("trainer_id");
      const userRole = await getToken("role");

      if (!currentGymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      setGymId(Number(currentGymId));

      // Parallel API calls for better performance
      // Note: Only fetch location on first load, not every time
      const shouldCheckLocation = !lastFetchTime.current;

      const requests = [
        getGymHomeDataAPI(currentGymId),
        getProfileDataAPI(currentGymId, ownerId, null, trainerId, userRole),
        getToken("gym_name"),
      ];

      if (shouldCheckLocation) {
        requests.push(getGymLocationAPI(currentGymId));
      }

      const responses = await Promise.allSettled(requests);

      const [
        gymDataResponse,
        profileResponse,
        gymNameFromStorage,
        locationResponse,
      ] = responses;

      // Process gym home data
      if (
        gymDataResponse.status === "fulfilled" &&
        gymDataResponse.value?.status === 200
      ) {
        const data = gymDataResponse.value.data;

        setAttendanceData({
          current: data.attendance?.current_count || 0,
          expected: data.attendance?.expected_count || 1,
          names: data.attendance?.details || [],
        });

        setMembersData({
          total_members: data.members?.total_members || 0,
          active_members: data.members?.active_members || 0,
          total_trainers: data.members?.total_trainers || 0,
          total_pending_enquiries: data.members?.total_pending_enquiries || 0,
        });

        setInvoiceData(data.invoice_data || []);
        setAboutToExpireList(data.expiry_list?.about_to_expire || []);
        setExpiredMembersList(data.expiry_list?.expired || []);
        setAttendanceChartData(data.attendance_chart || []);
      }

      // Process location data (only if we checked it)
      if (shouldCheckLocation && locationResponse) {
        if (
          locationResponse.status === "fulfilled" &&
          locationResponse.value?.status === 200
        ) {
          setLocationModalVisible(!locationResponse.value.data);
        }
      }

      // Process profile data
      if (
        profileResponse.status === "fulfilled" &&
        profileResponse.value?.status === 200
      ) {
        setProfileData(profileResponse.value.data?.owner_data);
        setGymLogo(profileResponse.value.data?.gym_data?.logo);
      }

      // Set gym name
      if (gymNameFromStorage.status === "fulfilled") {
        setGymName(gymNameFromStorage.value || "");
      }

      // Register for push notifications
      if (ownerId) {
        await registerForPushNotificationsAsync(ownerId);
      }

      lastFetchTime.current = now;
    } catch (error) {
      console.error("Error fetching app data:", error);
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initialize app data and version check
  const initializeApp = useCallback(async () => {
    await Promise.all([
      fetchAllData(true), // Force refresh on init
      checkAppVersion(),
    ]);
  }, [fetchAllData, checkAppVersion]);

  // Refresh function for pull-to-refresh
  const refreshData = useCallback(() => {
    return fetchAllData(true);
  }, [fetchAllData]);

  // Auto-refresh function (call when needed)
  const autoRefresh = useCallback(() => {
    if (isInitialized) {
      fetchAllData(false); // Use cache if valid
    }
  }, [fetchAllData, isInitialized]);

  // Location update function
  const updateGymLocation = useCallback(
    async (coords) => {
      try {
        if (!gymId) {
          showToast({
            type: "error",
            title: "Gym ID not found",
          });
          return false;
        }

        const payload = {
          gym_id: gymId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        const response = await updateGymLocationAPI(payload);

        if (response.status === 200) {
          showToast({
            type: "success",
            title: "Your gym location has been updated!",
          });
          setLocationModalVisible(false);
          return true;
        } else {
          showToast({
            type: "error",
            title: response.detail || "Failed to update location",
          });
          return false;
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Something went wrong while updating your gym location",
        });
        return false;
      }
    },
    [gymId]
  );

  // Effect for showing update prompt
  useEffect(() => {
    if (showUpdatePrompt && updateInfo) {
      handleUpdatePrompt();
    }
  }, [showUpdatePrompt, updateInfo, handleUpdatePrompt]);

  return {
    // Loading states
    isLoading,
    isInitialized,

    // Data
    gymId,
    attendanceData,
    membersData,
    profileData,
    gymLogo,
    gymName,
    invoiceData,
    aboutToExpireList,
    expiredMembersList,
    attendanceChartData,
    isLocationModalVisible,
    setLocationModalVisible,

    // Version info
    updateInfo,
    currentVersion: Constants.expoConfig.version,

    // Functions
    initializeApp,
    refreshData,
    autoRefresh,
    updateGymLocation,
    checkAppVersion,

    // Cache info
    lastFetchTime: lastFetchTime.current,
    isCacheValid:
      lastFetchTime.current &&
      Date.now() - lastFetchTime.current < CACHE_DURATION,
  };
};

export default useAppData;
