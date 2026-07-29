import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Platform,
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { Tabs, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS = {
  home: require("../../assets/images/TabNavigatore/home.png"),
  home_active: require("../../assets/images/TabNavigatore/home_active.png"),
  bookings: require("../../assets/images/TabNavigatore/bookings.png"),
  bookings_active: require("../../assets/images/TabNavigatore/bookings_active.png"),
  clients: require("../../assets/images/TabNavigatore/clients.png"),
  clients_active: require("../../assets/images/TabNavigatore/clients_active.png"),
  earnings: require("../../assets/images/TabNavigatore/earnings.png"),
  earnings_active: require("../../assets/images/TabNavigatore/earnings_active.png"),
  trainees: require("../../assets/images/TabNavigatore/trainees_inactive.png"),
  trainees_active: require("../../assets/images/TabNavigatore/trainees_active.png"),
};

const TAB_COLORS = {
  home: "#014D92",
  bookings: "#014D92",
  add: "#297DB3",
  client: "#014D92",
  earnings: "#014D92",
  trainees: "#014D92",
  default: "#014D92",
};

export default function TabNavigator({
  isSliderVisible,
  toggleSlider,
  rotateButton,
  scaleButton,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [isTrainer, setIsTrainer] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const pathParts = pathname.split("/");
    const currentTab = pathParts[pathParts.length - 1];

    if (TAB_COLORS[currentTab] && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [pathname, activeTab]);

  useFocusEffect(
    useCallback(() => {
      async function fetchRole() {
        try {
          const role = await getToken("role");
          setIsTrainer(role === "trainer");
        } catch (error) {
          console.error("Error getting user role:", error);
          setIsTrainer(false);
        }
      }
      fetchRole();
    }, []),
  );

  const getTabColor = useMemo(() => {
    return (routeName) => {
      if (routeName === activeTab) {
        return TAB_COLORS[routeName] || TAB_COLORS.default;
      }
      return "#979797";
    };
  }, [activeTab]);

  const tabBarStyle = useMemo(() => {
    const isMarketplace = pathname.includes("/marketplace");
    return Platform.select({
      ios: {
        position: "absolute",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0,
        paddingTop: 5,
        height: 70 + insets.bottom,
        paddingBottom: insets.bottom,
        display: isMarketplace ? "none" : "flex",
      },
      default: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderColor: "#FFDDDD",
        paddingTop: 5,
        height: 70 + insets.bottom,
        paddingBottom: insets.bottom,
        display: isMarketplace ? "none" : "flex",
      },
    });
  }, [pathname, insets.bottom]);

  const handleTabPress = (routeName) => {
    setActiveTab(routeName);
    router.replace({
      pathname: `/owner/${routeName}`,
      params: {
        is_active: false,
      },
    });
  };

  const TabIcon = ({ name, focused }) => {
    const iconKey = focused ? `${name}_active` : name;
    const iconSource =
      name === "clients"
        ? focused
          ? TAB_ICONS.clients_active
          : TAB_ICONS.clients
        : TAB_ICONS[iconKey];

    return (
      <View style={styles.iconContainer}>
        <Image style={styles.tabIcon} source={iconSource} />
      </View>
    );
  };

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#979797",
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarStyle,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIconStyle: styles.tabBarIcon,
      tabBarItemStyle: styles.tabBarItem,
      tabBarHideOnKeyboard: true,
    }),
    [tabBarStyle],
  );

  if (isTrainer === null) return null;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarActiveTintColor: getTabColor(route.name),
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("home");
          },
        }}
      />

      <Tabs.Screen
        name="client"
        options={{
          title: "Clients",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clients" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("client");
          },
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: ({ children }) => (
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={toggleSlider}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.addButton,
                  {
                    transform: [
                      { rotate: rotateButton },
                      { scale: scaleButton },
                      { scale: !isSliderVisible ? 1 : 0 },
                    ],
                  },
                ]}
              >
                <Ionicons name="add" size={32} color="#FFF" />
              </Animated.View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bookings" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("bookings");
          },
        }}
      />

      {/* Earnings tab - only show for non-trainers */}
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          href: isTrainer ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="earnings" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("earnings");
          },
        }}
      />

      {/* Trainees tab - only show for trainers */}
      <Tabs.Screen
        name="trainees"
        options={{
          title: "Trainees",
          href: !isTrainer ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="trainees" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress("trainees");
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabIcon: {
    width: 30,
    height: 25,
    resizeMode: "contain",
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    paddingBottom: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2159D0",
    alignItems: "center",
    justifyContent: "center",
  },
});
