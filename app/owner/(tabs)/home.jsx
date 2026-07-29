import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getGymHomeDataAPI,
  getGymLocationAPI,
  getProfileDataAPI,
  updateGymLocationAPI,
  markAgreementClickedAPI,
} from "../../../services/Api";
import * as Linking from "expo-linking";

import HomeSkeleton from "../../../components/ui/loaders/homeSkeleton";
import OverviewTabSkeleton from "../../../components/ui/loaders/overviewTabSkeleton";
// import useBackHandler from '../../../components/UseBackHandler ';
import { getToken } from "../../../utils/auth";
import { useNavigation } from "../../../context/NavigationContext";
import MenuItems from "../../../components/ui/Header/tabs";
import { registerForPushNotificationsAsync } from "../../../components/usePushNotifications";
import { showToast } from "../../../utils/Toaster";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import Constants from "expo-constants";
const OverViewTabs = lazy(
  () => import("../../../components/home/OverViewTabs"),
);
const UpdateGymLocationModal = lazy(
  () => import("../../../components/home/UpdateGymLocationModal"),
);
const SideNavigation = lazy(
  () => import("../../../components/ui/Header/SideNavigation"),
);

const { width, height } = Dimensions.get("window");
const CONTAINER_HEIGHT = height * 0.2;
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};
const currentVersion = Constants.expoConfig.version;

const isTablet = width >= 768;

const POSTERS = [
  {
    id: 2,
    url: require("../../../assets/images/posters/addclient.png"),
    type: "clients",
  },
  {
    id: 3,
    url: require("../../../assets/images/posters/daily_pass.png"),
    type: "dailypass",
  },
  {
    id: 4,
    url: require("../../../assets/images/posters/sessions.png"),
    type: "session",
  },
  {
    id: 7,
    url: require("../../../assets/images/posters/no_cost_emi.png"),
    type: "nocostemi",
  },
  {
    id: 5,
    url: require("../../../assets/images/posters/memberships.png"),
    type: "plans",
  },
  {
    id: 6,
    url: require("../../../assets/images/posters/pt.png"),
    type: "pt",
  },

  {
    id: 8,
    url: require("../../../assets/images/posters/couple.png"),
    type: "couplemembership",
  },
  {
    id: 8,
    url: require("../../../assets/images/posters/buddy.png"),
    type: "buddy",
  },
];
export default function AllDashboard(props) {
  return <Dashboard {...props} />;
}

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState({
    current: 0,
    expected: 1,
    names: [],
  });
  const [posters, setPosters] = useState([]);
  const [useManualPosters, setUseManualPosters] = useState(false);
  const [manualPosters, setManualPosters] = useState([]);
  const [bdayClients, setBdayClients] = useState(null);
  const [isAttendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [gymName, setGymName] = useState("");
  const [aboutToExpireList, setAboutToExpireList] = useState([]);
  const [expiredMembersList, setExpiredMembersList] = useState([]);
  const [attendanceChartData, setAttendanceChartData] = useState([]);
  const [oldGym, setOldGym] = useState(false);
  const [bookingCounts, setBookingCounts] = useState({
    dailypass: 0,
    sessions: 0,
    membership: 0,
  });
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);
  const [role, setRole] = useState(null);
  const [registrationSteps, setRegistrationSteps] = useState(null);
  const [prefilledAgreement, setPrefilledAgreement] = useState(null);
  const [servicesOld, setServicesOld] = useState(null);

  const [membersData, setMembersData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    retentionRate: 0,
    unpaidCount: 0,
    averageVisits: 0,
    averageAge: 0,
  });
  const { isSideNavVisible, closeSideNav, toggleSideNav } = useNavigation();

  const { panHandlers, SwipeIndicator } = useEdgeSwipe({
    onSwipeComplete: toggleSideNav,
    isEnabled: true,
    isBlocked: isSideNavVisible,
    config: {
      edgeSwipeThreshold: 30,
      swipeMinDistance: 50,
      swipeMinVelocity: 0.3,
      preventIOSBackSwipe: true,
    },
  });

  const userData = {
    name: "Yesh Singh",
    email: "Yeshsingh@gmail.com",
  };

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const toggleAttendanceModal = () =>
    setAttendanceModalVisible(!isAttendanceModalVisible);

  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const getGymLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== "granted") {
        setIsLocationLoading(false);

        if (!canAskAgain) {
          Alert.alert(
            "Permission Blocked",
            "Location access has been blocked. Please enable it manually from your phone's settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ],
          );
        } else {
          showToast({
            type: "error",
            title:
              "Location permission is required to set your gym's location.",
          });
        }
        return;
      }

      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      let location = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!location && attempts < maxAttempts) {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? Location.LocationAccuracy.High
                : Location.LocationAccuracy.Best,
            maximumAge: 10000,
            timeout: 10000,
          });
          break;
        } catch (locationError) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw locationError;
          }
        }
      }

      if (!location) {
        throw new Error("Unable to get location after multiple attempts");
      }

      setIsLocationLoading(false);
      return location.coords;
    } catch (error) {
      setIsLocationLoading(false);
      console.error("Location error:", error);

      let errorMessage =
        "Could not get your current location. Please try again.";

      if (error.message.includes("denied")) {
        errorMessage =
          "Location access was denied. Please enable location permissions in settings.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.message.includes("unavailable")) {
        errorMessage =
          "Location services are unavailable. Please check your device settings.";
      } else if (error.message.includes("multiple attempts")) {
        errorMessage =
          "Unable to get accurate location. Please ensure location services are enabled and try again.";
      }

      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const getProfileData = async () => {
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      const trainerId = await getToken("trainer_id");
      const userRole = await getToken("role");
      if (!gymId || !ownerId) {
        showToast({
          type: "error",
          title: "GymID or OwnerID not found",
        });
        return;
      }

      const response = await getProfileDataAPI(
        gymId,
        ownerId,
        null,
        trainerId,
        userRole,
      );

      setProfileData(response?.data?.owner_data);
      setGymLogo(response?.data?.gym_data?.logo);
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    }
  };

  const updateGymLocation = async () => {
    try {
      setIsLocationLoading(true);
      const coords = await getGymLocation();
      if (!coords) {
        setIsLocationLoading(false);
        return;
      }
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setIsLocationLoading(false);
        return;
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
      } else {
        showToast({
          type: "error",
          title: response.detail || "Failed to update location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong while updating your gym location",
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const checkGymLocation = async () => {
    try {
      const gymId = await getToken("gym_id");
      const ownerId = await getToken("owner_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym Id is not there",
        });
        return;
      }
      await registerForPushNotificationsAsync(ownerId);
      const response = await getGymLocationAPI(gymId);

      if (response.status === 200) {
        setLocationModalVisible(!response?.data);
      } else {
        showToast({
          type: "error",
          title: "Failed to check gym location",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error checking gym location",
      });
    }
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Some Error Occured",
        });
        return;
      }

      const response = await getGymHomeDataAPI(gymId);

      if (response?.status === 200) {
        setRegistrationSteps(response?.data?.registration_steps);
        setServicesOld(response?.data?.services_old || false);
        setPrefilledAgreement(response?.data?.prefilled_agreement);
        const data = response.data?.attendance || {};
        setPosters(response?.data?.posters || []);
        setUseManualPosters(response?.data?.use_manual_posters || false);
        setManualPosters(response?.data?.manual_posters || []);
        setAttendanceData({
          current: data.current_count || 0,
          expected: data.expected_count,
          names: data.details || [],
        });
        setBdayClients(response?.data?.bday_clients || []);
        setInvoiceData(response.data?.invoice_data || []);
        const members = response.data?.members;
        let memberData = {
          total_members: members?.total_members,
          active_members: members?.active_members,
          total_trainers: members?.total_trainers,
          total_pending_enquiries: members?.total_pending_enquiries,
        };
        setMembersData(memberData);
        setAboutToExpireList(response.data?.expiry_list?.about_to_expire);
        setExpiredMembersList(response.data?.expiry_list?.expired);
        setAttendanceChartData(response.data?.attendance_chart);
        setOldGym(response.data?.old_gym_data || false);
        setBookingCounts(response?.data?.booking_counts);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again later.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceData();
      checkGymLocation();
      getToken("gym_name").then(setGymName);
      getProfileData();
      getToken("role").then(setRole);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (isSideNavVisible) {
          closeSideNav();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.remove();
      };
    }, [isSideNavVisible, closeSideNav]),
  );

  const handleAgreementClicked = async () => {
    if (prefilledAgreement?.s3_link) {
      try {
        // Open the PDF link
        await Linking.openURL(prefilledAgreement.s3_link);

        // Mark as clicked in backend
        const gymId = await getToken("gym_id");
        if (gymId) {
          await markAgreementClickedAPI(gymId);
          // Hide the card after clicking
          setPrefilledAgreement(null);
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Failed to open agreement",
        });
      }
    }
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<OverviewTabSkeleton />}>
        <OverViewTabs
          styles={styles}
          attendanceData={attendanceData}
          toggleAttendanceModal={toggleAttendanceModal}
          membersData={membersData}
          isAttendanceModalVisible={isAttendanceModalVisible}
          invoiceData={invoiceData}
          role={role}
          members={attendanceData?.members}
          aboutToExpireList={aboutToExpireList}
          expiredMembersList={expiredMembersList}
          attendanceChartData={attendanceChartData}
          bdayClients={bdayClients}
          posters={
            useManualPosters && manualPosters.length > 0
              ? manualPosters.map((url, index) => ({
                  id: index + 1,
                  url,
                  type: "manual",
                }))
              : POSTERS
          }
          registrationSteps={registrationSteps}
          prefilledAgreement={prefilledAgreement}
          onAgreementClicked={handleAgreementClicked}
          oldGym={oldGym}
          bookingCounts={bookingCounts}
          servicesOld={servicesOld}
          openDailyPassScanner={params?.openDailyPassScanner}
        />
      </Suspense>
    );
  };

  if (isLoading) {
    return <HomeSkeleton priority="high" />;
  }

  return (
    <View style={styles.container} {...panHandlers}>
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <View style={styles.companyContainer}>
            <TouchableOpacity onPress={toggleSideNav}>
              <Ionicons
                name="menu-outline"
                size={isTablet ? 36 : 28}
                color={"#000"}
              />
            </TouchableOpacity>
            <Text style={[styles.logoText, isTablet && styles.logoTextTablet]}>
              <Text style={styles.logoFirstPart}>Fymble</Text>
              <Text style={styles.logoSecondPart}> Business</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => router.push("/owner/ownerprofile")}
          >
            <View style={styles.profileContent}>
              <Text
                style={[
                  styles.gymNameText,
                  isTablet && styles.gymNameTextTablet,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {gymName?.length > 16
                  ? gymName.substring(0, 16) + "..."
                  : gymName}
              </Text>
              <View
                style={[
                  styles.profileIcon,
                  isTablet && styles.profileIconTablet,
                ]}
              >
                <Image
                  source={{ uri: gymLogo }}
                  style={[
                    styles.profileImage,
                    isTablet && styles.profileImageTablet,
                  ]}
                  resizeMode="cover"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {isMenuVisible && (
          <View style={styles.menuDropdown}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isSideNavVisible && (
        <Suspense fallback={null}>
          <SideNavigation
            isVisible={isSideNavVisible}
            onClose={closeSideNav}
            userData={userData}
            color1={"#5c2b9b"}
            color2={"#ff3c7a"}
            profileData={profileData}
            gymLogo={gymLogo}
          />
        </Suspense>
      )}

      <View style={styles.contentContainer}>{renderContent()}</View>

      <Suspense fallback={null}>
        <UpdateGymLocationModal
          styles={styles}
          isLocationModalVisible={isLocationModalVisible}
          updateGymLocation={updateGymLocation}
          isLocationLoading={isLocationLoading}
        />
      </Suspense>

      <SwipeIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  customHeader: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 12,
    paddingHorizontal: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  logoTextTablet: {
    fontSize: 22,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#666",
    fontWeight: "bold",
  },
  profileSection: {
    padding: 4,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gymNameText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "500",
  },
  gymNameTextTablet: {
    fontSize: 18,
  },
  profileIcon: {
    width: 46,
    height: 46,
    borderRadius: 25,
    overflow: "hidden",
  },
  profileIconTablet: {
    width: 45,
    height: 45,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileImageTablet: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  menuDropdown: {
    position: "absolute",
    top: 90,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemText: {
    fontSize: 14,
    color: "#374151",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundGradient: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: "700",
    color: "#333",
  },
  navigationTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: width * 0.02,
    borderRadius: 12,
    padding: width * 0.02,
    marginBottom: height * 0.02,
  },
  navTab: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
    borderRadius: 8,
  },
  activeNavTab: {
    backgroundColor: "#FF5757",
  },
  navTabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeNavTabText: {
    color: "#FFF",
    fontWeight: "700",
  },
  scrollViewContent: {
    paddingBottom: height * 0.1,
    backgroundColor: "#ffffff",
  },
  sectionContainer: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#FF5757",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  horizontalScrollView: {
    paddingHorizontal: width * 0.02,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
  },
  statCard: {
    width: width * 0.4,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.04,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIconContainer: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.08,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  cardTitle: {
    fontSize: width * 0.035,
    color: "#FF5757",
    marginBottom: height * 0.005,
  },
  cardValue: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#333",
  },
  halfWidthCard: {
    width: width * 0.4,
  },
  batchContainer: {
    paddingHorizontal: width * 0.05,
  },
  batchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: width * 0.04,
    borderRadius: 10,
    marginBottom: height * 0.01,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  batchName: {
    fontSize: width * 0.04,
    fontWeight: "500",
    color: "#333",
  },
  batchCount: {
    fontSize: width * 0.035,
    color: "#666",
  },
  profitContainer: {
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  profitGradient: {
    borderRadius: 15,
    padding: width * 0.05,
  },
  profitContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  profitIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
    padding: width * 0.03,
    marginBottom: height * 0.01,
  },
  profitLabel: {
    color: "#fff",
    fontSize: width * 0.04,
    textAlign: "center",
    marginBottom: height * 0.005,
  },
  profitValue: {
    color: "#fff",
    fontSize: width * 0.06,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  profitDetailsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profitDetailText: {
    color: "#fff",
    fontSize: width * 0.035,
  },
  chartPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.05,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: width * 0.05,
    height: height * 0.3,
  },
  chartPlaceholderText: {
    color: "#666",
    fontSize: width * 0.04,
  },
  emptyTabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  emptyTabText: {
    fontSize: width * 0.05,
    color: "#666",
    textAlign: "center",
  },
  performanceInsightsContainer: {
    flexDirection: "column",
    paddingHorizontal: width * 0.05,
  },
  performanceInsightCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  performanceInsightTitle: {
    fontSize: width * 0.04,
    fontWeight: "600",
    marginLeft: width * 0.03,
    color: "#333",
  },
  performanceInsightValue: {
    fontSize: width * 0.06,
    fontWeight: "700",
    color: "#333",
    marginBottom: height * 0.005,
  },
  performanceInsightDescription: {
    fontSize: width * 0.035,
    color: "#666",
  },
  trainingDistributionBackground: {
    width: "100%",
    height: height * 0.3,
    borderRadius: 15,
    overflow: "hidden",
  },
  trainingScroll: {
    height: CONTAINER_HEIGHT,
  },
  trainingScrollContainer: {
    flexGrow: 1,
  },
  trainingDistributionOverlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: width * 0.01,
  },
  trainingProgressContainer: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 15,
    padding: width * 0.04,
  },
  trainingProgressItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  trainingProgressLabel: {
    flex: 2,
    fontSize: width * 0.035,
    color: "#333",
  },
  trainingProgressBar: {
    flex: 3,
    height: height * 0.02,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    marginHorizontal: width * 0.03,
  },
  trainingProgressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  trainingProgressCount: {
    fontSize: width * 0.035,
    fontWeight: "600",
    color: "#666",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: responsiveHeight(1),
  },

  flatListContainer: {
    width: "100%",
    alignItems: "center",
    textAlign: "center",
  },
  flatListContentContainer: {
    alignItems: "center",
    paddingHorizontal: responsiveWidth(5),
  },
  pieChartContainer: {
    width: responsiveWidth(90),
    alignItems: "center",
    marginHorizontal: responsiveWidth(2),
  },

  greetingContainer: {
    marginTop: responsiveHeight(3),
    alignItems: "center",
    paddingHorizontal: responsiveWidth(4),
    width: "100%",
  },
  greeting: {
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    color: "#FF5757",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subGreeting: {
    fontSize: responsiveFontSize(16),
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    letterSpacing: 0.5,
  },
  sliderIndicator: {
    flexDirection: "row",
    marginTop: responsiveHeight(1),
  },
  dot: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    marginHorizontal: responsiveWidth(1),
  },
  activeDot: {
    backgroundColor: "#FF5757",
  },
  inactiveDot: {
    backgroundColor: "#E0E0E0",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    width: responsiveWidth(90),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    marginVertical: responsiveHeight(1.5),
    alignItems: "center",
    width: responsiveWidth(90),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: responsiveWidth(2),
    marginVertical: responsiveHeight(0.5),
  },
  colorDot: {
    width: responsiveWidth(3),
    height: responsiveWidth(3),
    borderRadius: responsiveWidth(1.5),
    marginRight: responsiveWidth(1),
  },
  labelText: {
    fontSize: responsiveFontSize(12),
    color: "#555",
  },
  chartConfig: {
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(255, 111, 60, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  },
  attendanceContainer: {
    flex: 1,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    paddingBottom: responsiveHeight(1),
  },
  attendanceCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    alignItems: "center",
    justifyContent: "center",
    width: responsiveWidth(90), // Maintain full width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  attendanceProgressText: {
    fontSize: responsiveFontSize(16), // Adjusted to be more responsive
    fontWeight: "bold",
    color: "#FF5757", // Optional: match the progress circle color
  },
  clientCard: {
    backgroundColor: "#FFF",
    borderRadius: responsiveWidth(5),
    padding: responsiveWidth(4),
    width: responsiveWidth(90),
    height: responsiveHeight(30),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  clientScrollContent: {
    paddingVertical: responsiveHeight(1),
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: responsiveHeight(0.5),
    paddingVertical: responsiveHeight(0.5),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: responsiveWidth(2),
    backgroundColor: "#FFDDDD",
  },
  greenDot: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    backgroundColor: "#4CAF50",
    marginRight: responsiveWidth(2),
  },
  clientName: {
    fontSize: responsiveFontSize(14),
    fontWeight: "500",
    color: "#555",
  },

  legend: {
    fontSize: responsiveFontSize(12),
    color: "#666",
    marginTop: responsiveHeight(1),
    textAlign: "center",
  },
  updatedGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#50C878",
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  updatedModalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  updatedModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
  },
  listContainer: {
    paddingVertical: 4,
  },
  updatedClientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  nameSection: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  updatedGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  updatedClientName: {
    fontSize: 15,
    color: "#333333",
    flex: 1,
  },
  timeText: {
    flex: 1,
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
  },
  updatedCloseButton: {
    backgroundColor: "#FF5757",
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updatedCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    paddingHorizontal: 16,
  },

  actionButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  viewReceiptsContainer: {
    alignItems: "center", // Center the button horizontally
    marginTop: 5, // Add some space above this button
    marginBottom: 20, // Add some space below this button
    paddingHorizontal: 16, // Match horizontal padding if needed
  },

  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 10,
  },

  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },

  // Header Row
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#FF5757",
    paddingVertical: 8,
    marginBottom: 8,
  },

  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    flex: 1, // Ensures equal spacing
    textAlign: "center",
  },

  // Table Row
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  rowText: {
    fontSize: 15,
    color: "#555",
    flex: 1, // Ensures equal spacing
    textAlign: "center",
  },

  scrollableList: {
    flexGrow: 0,
    marginBottom: 16,
  },

  closeButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  newEntrantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 120,
  },
  newEntrantIconContainer: {
    marginBottom: 12,
  },
  newEntrantTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  newEntrantValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  newEntrantModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  newEntrantModalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  // Modal Header
  newEntrantModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
    backgroundColor: "#FFFFFF",
  },
  newEntrantModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 4,
  },
  newEntrantModalSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  newEntrantHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  newEntrantHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    paddingRight: 8,
  },

  newEntrantList: {
    paddingVertical: 4,
  },
  newEntrantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  newEntrantNameCell: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  newEntrantDateCell: {
    flex: 1,
    textAlign: "left",
  },
  newEntrantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5757",
    marginRight: 8,
  },
  newEntrantText: {
    fontSize: 14,
    color: "#333333",
  },
  newEntrantCloseButton: {
    backgroundColor: "#FF5757",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  newEntrantCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  viewAllButton: {
    marginTop: 15,
  },
  viewAllText: {
    fontSize: width * 0.035,
    fontWeight: "500",
    color: "#FF5757",
    textDecorationLine: "underline",
    textAlign: "right",
  },
  modalContainerBatch: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 16,
  },
  batchItemModal: {
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  batchNameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  batchNameModal: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  batchCountModal: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  containerLive: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  mainText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  noDataCard: {
    minHeight: 150,
  },
  noClient: {
    padding: 0,
    color: "#FF5757",
    fontSize: 16,
    fontWeight: "bold",
  },
  locationInfoText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
    color: "#333",
  },
  locationUpdateButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 15,
    alignSelf: "center",
  },
  locationUpdateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  locationLoader: {
    marginVertical: 20,
  },
  addExpenseContainer: {
    alignItems: "flex-end",
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  addExpenseButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addExpenseText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
  },

  // Form styles
  formContainer: {
    width: "100%",
    marginVertical: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#FF5757",
    fontSize: 14,
    marginTop: 5,
  },

  // RNPicker styles
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
  },
  pickerPlaceholder: {
    color: "#888",
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerItemSelected: {
    backgroundColor: "#e8f5e9",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
  },
  pickerItemTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },

  // Modal button styles
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#a5d6a7",
    opacity: 0.7,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeIconButton: {
    padding: 8,
  },
  monthPickerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  monthPickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  monthPickerText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  incomeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#555",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5757",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  confirmModalText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  confirmCancelButtonText: {
    fontSize: 16,
    color: "#444",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#0154A0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777",
  },
  activeTabText: {
    color: "#0154A0",
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
  },
});
