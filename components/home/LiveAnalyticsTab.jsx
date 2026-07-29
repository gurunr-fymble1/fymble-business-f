import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useMemo } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LiveDistribution from "./LiveDistribution";
import WorkoutDistributionChart from "./LiveDistributionChart";
import GymCard from "../ui/GymCard";

import GymOffers from "../ui/Feed/gymoffers";
import GymAnnouncements from "../ui/Feed/announcements";
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

const RenderAnalyticsTab = ({
  styles,
  analyticsData,
  scrollY = new Animated.Value(0),
  headerHeight = 120,
}) => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (params.analyticsTab) {
      setActiveTab(params.analyticsTab);
    }
  }, [params.analyticsTab]);
  const tabs = [
    { id: "analytics", title: "Live Stats", color: "#1F90CE" },
    { id: "offers", title: "Offers", color: "#53A4AC" },
    { id: "announcements", title: "Announcements", color: "#FE9800" },
  ];

  // Memoize chart data preparation to avoid recalculations
  const prepareChartData = useMemo(() => {
    const chartData = {
      muscle_group: {
        labels: [],
        datasets: [{ data: [] }],
      },
      training: {
        labels: [],
        datasets: [{ data: [] }],
      },
      goals: {
        labels: [],
        datasets: [{ data: [] }],
      },
    };
    const muscleSummary =
      analyticsData?.muscleSummary || analyticsData?.muscle_summary;
    if (muscleSummary && Object.keys(muscleSummary).length > 0) {
      chartData.muscle_group.labels = Object.keys(muscleSummary);
      chartData.muscle_group.datasets[0].data =
        chartData.muscle_group.labels.map(
          (muscle) => muscleSummary[muscle].count || 0
        );
    }

    const goalsSummary =
      analyticsData?.goalsSummary || analyticsData?.goals_summary;
    if (goalsSummary && Object.keys(goalsSummary).length > 0) {
      chartData.goals.labels = Object.keys(goalsSummary);
      chartData.goals.datasets[0].data = chartData.goals.labels.map(
        (goal) => goalsSummary[goal].count || 0
      );
    }

    const trainingTypeSummary =
      analyticsData?.trainingTypeSummary ||
      analyticsData?.training_type_summary;
    if (trainingTypeSummary && Object.keys(trainingTypeSummary).length > 0) {
      chartData.training.labels = Object.keys(trainingTypeSummary);
      chartData.training.datasets[0].data = chartData.training.labels.map(
        (training) => trainingTypeSummary[training].count || 0
      );
    }

    return chartData;
  }, [analyticsData]); // Only recalculate when analyticsData changes

  const chartData = prepareChartData;

  const renderTabContent = () => {
    switch (activeTab) {
      case "analytics":
        return renderAnalyticsContent();
      case "offers":
        return (
          <GymOffers
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            headerHeight={headerHeight}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      case "announcements":
        return (
          <GymAnnouncements
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            headerHeight={headerHeight}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        );
      default:
        return renderAnalyticsContent();
    }
  };

  const renderAnalyticsContent = () => {
    if (analyticsData?.liveCount === 0) {
      return (
        <View style={styles.containerLive}>
          <Ionicons name="fitness-outline" size={80} color="#A0A0A0" />
          <Text style={styles.mainText}>Currently no one is in the gym</Text>
          <Text style={styles.subText}>
            Check back later for real-time updates
          </Text>
        </View>
      );
    }

    const sections = [
      {
        id: "gym-cards",
        type: "gym-cards",
        component: (
          <View
            style={[styles.sectionContainer, { backgroundColor: "#FFFFFF" }]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: 10,
              }}
            >
              <GymCard
                value={analyticsData?.liveCount}
                label="Active Members"
                image={require("../../assets/images/home/live_1.png")}
              />
              <GymCard
                value={analyticsData?.top_muscle || "NA"}
                label="Popular Now"
                image={
                  analyticsData?.url ||
                  require("../../assets/images/home/live_2.png")
                }
                muscle={true}
              />
            </View>
          </View>
        ),
      },
      {
        id: "live-distribution",
        type: "live-distribution",
        component: (
          <LiveDistribution USERS={analyticsData?.present_clients || []} />
        ),
      },
      {
        id: "workout-distribution",
        type: "workout-distribution",
        component: <WorkoutDistributionChart chartData={chartData} />,
      },
    ];

    const renderSection = ({ item }) => (
      <View key={item.id}>{item.component}</View>
    );

    return (
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // For offers and announcements tabs, render them directly
  if (activeTab === "offers" || activeTab === "announcements") {
    return (
      <View style={{ flex: 1 }}>
        {/* Tab Navigation */}
        <View style={tabStyles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={tabStyles.tabButton}
              onPress={() => setActiveTab(tab.id)}
            >
              {activeTab === tab.id ? (
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tabStyles.activeTabGradient}
                >
                  <Text style={tabStyles.activeTabText}>{tab.title}</Text>
                </LinearGradient>
              ) : (
                <View style={tabStyles.inactiveTab}>
                  <Text style={tabStyles.tabText}>{tab.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    );
  }

  // For analytics tab, show tabs + scrollable content
  return (
    <View style={{ flex: 1 }}>
      {/* Tab Navigation */}
      <View style={tabStyles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={tabStyles.tabButton}
            onPress={() => setActiveTab(tab.id)}
          >
            {activeTab === tab.id ? (
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tabStyles.activeTabGradient}
              >
                <Text style={tabStyles.activeTabText}>{tab.title}</Text>
              </LinearGradient>
            ) : (
              <View style={tabStyles.inactiveTab}>
                <Text style={tabStyles.tabText}>{tab.title}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
    marginTop: width >= 786 ? 20 : Platform.OS === "ios" ? 20 : 7,
  },
  tabButton: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
});

export default RenderAnalyticsTab;
