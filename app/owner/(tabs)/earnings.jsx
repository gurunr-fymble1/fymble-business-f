import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  BackHandler,
} from "react-native";
import ClientPageSkeleton from "../../../components/ui/loaders/clientPageSkeleton";
import SideNavigation from "../../../components/ui/Header/SideNavigation";
import MenuItems from "../../../components/ui/Header/tabs";
import { useNavigation } from "../../../context/NavigationContext";
import { getProfileDataAPI } from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import useEdgeSwipe from "../../../hooks/useEdgeSwipe";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutCard from "../../../components/ui/workout/WorkoutCard";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

const EarningsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [gymName, setGymName] = useState("");
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [gymLogo, setGymLogo] = useState(null);

  const { menuItems } = MenuItems({ setIsMenuVisible });

  const { isSideNavVisible, closeSideNav } = useNavigation();

  const { toggleSideNav } = useNavigation();
  const insets = useSafeAreaInsets();
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
      setGymName(response?.data?.gym_data?.name || "Gym");
      setIsLoading(false);
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getProfileData();
    }, []),
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/owner/home");
        return true;
      },
    );

    return () => backHandler.remove();
  }, [router]);

  const cardsData = [
    {
      title: "Daily Pass & Class Earnings",
      subtitle: "Earnings Via Fymble Daily Pass\n& Fitness Class Bookings",
      imagePath: require("../../../assets/images/client/pass_sessions.png"),
      onPress: () => router.push("/owner/dailyPassSessions"),
      buttonText: "View",
      charWidth: 120,
      charHeight: 120,
    },
    {
      title: "Membership & PT Earnings",
      subtitle: "Earnings Via Fymble Membership\n& PT Plans",
      imagePath: require("../../../assets/images/client/membership.png"),
      onPress: () => router.push("/owner/membershipPTClients"),
      buttonText: "View",
      charWidth: 120,
      charHeight: 140,
    },
  ];

  const renderContent = () => {
    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {cardsData.map((card, index) => (
            <View key={index} style={styles.cardWrapper}>
              <WorkoutCard
                title={card.title}
                subtitle={card.subtitle}
                imagePath={card.imagePath}
                onPress={card.onPress}
                buttonText={card.buttonText}
                textColor={"#000000"}
                bg1={
                  Platform.OS === "ios"
                    ? "rgba(0, 0, 0, 0.048)"
                    : "rgba(0, 0, 0, 0.012)"
                }
                bg2={
                  Platform.OS === "ios"
                    ? "rgba(0, 0, 0, 0.048)"
                    : "rgba(0, 0, 0, 0.012)"
                }
                border1={"rgba(0, 0, 0, 0.012)"}
                border2={"#fff"}
                charWidth={card.charWidth}
                charHeight={card.charHeight}
                nospace={true}
                buttonTextColor="#007AFF"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container} {...panHandlers}>
      {isLoading ? (
        <ClientPageSkeleton priority="high" />
      ) : (
        <>
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
                <Text
                  style={[styles.logoText, isTablet && styles.logoTextTablet]}
                >
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
            <SideNavigation
              isVisible={isSideNavVisible}
              onClose={closeSideNav}
              color1={"#022950"}
              color2={"#0154A0"}
              profileData={profileData}
              gymLogo={gymLogo}
            />
          )}

          <View style={styles.contentContainer}>{renderContent()}</View>

          <SwipeIndicator />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: Platform.OS === "ios" ? 60 : 0,
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    paddingTop: 0,
    paddingBottom: 0,
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
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
    paddingTop: 5,
    paddingBottom: 50,
    backgroundColor: "#FFFFFF",
  },
  cardWrapper: {
    marginBottom: 8,
  },
  biometricImageWrapper: {
    width: "100%",
    marginTop: 15,
    alignItems: "center",
  },
  biometricImage: {
    width: "100%",
    height: 151,
  },
});

export default EarningsPage;
