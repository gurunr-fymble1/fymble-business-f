import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopPageBar from "../ui/TopPageBar";
import GradientButton from "../ui/GradientButton";

const { width } = Dimensions.get("window");

const StickyYAxis = ({ data, height, chartConfig }) => {
  const maxValue = Math.max(...data, 1);

  const getYAxisLabels = () => {
    // Handle edge cases
    if (maxValue <= 0) return [0];
    if (maxValue === 1) return [0, 1];

    // Calculate number of intervals (typically 4-6 for good readability)
    const targetIntervals = 4;

    // Calculate raw step size
    const rawStep = maxValue / targetIntervals;

    // Round step to a "nice" number
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalizedStep = rawStep / magnitude;

    let niceStep;
    if (normalizedStep <= 1) {
      niceStep = 1 * magnitude;
    } else if (normalizedStep <= 2) {
      niceStep = 2 * magnitude;
    } else if (normalizedStep <= 5) {
      niceStep = 5 * magnitude;
    } else {
      niceStep = 10 * magnitude;
    }

    // Generate labels
    const labels = [];
    let currentValue = 0;

    // Always start with 0
    labels.push(0);

    // Add intermediate values
    while (currentValue < maxValue) {
      currentValue += niceStep;
      labels.push(currentValue);
    }

    // Ensure we don't have too many labels (max 6)
    if (labels.length > 6) {
      const step = Math.ceil(labels.length / 6);
      return labels.filter((_, index) => index % step === 0);
    }

    return labels;
  };

  const yAxisLabels = getYAxisLabels();

  return (
    <View
      style={{
        height,
        justifyContent: "space-between",
        paddingVertical: 10,
        minWidth: 40, // Ensure consistent width for alignment
      }}
    >
      {yAxisLabels.reverse().map((label, index) => (
        <Text
          key={index}
          style={{
            fontSize: 12,
            color: chartConfig.labelColor(1),
            textAlign: "right",
            paddingRight: 5,
          }}
        >
          {/* Format large numbers with K, M suffixes */}
          {label >= 1000000
            ? `${(label / 1000000).toFixed(1)}M`
            : label >= 1000
            ? `${(label / 1000).toFixed(1)}K`
            : label}
        </Text>
      ))}
    </View>
  );
};

// Main component
const LiveDistributionChart = ({ chartData }) => {
  const insets = useSafeAreaInsets();

  // States for tracking active insight type
  const [selectedInsightType, setSelectedInsightType] =
    useState("muscle_group");
  const aggregatedChartScrollViewRef = useRef(null);

  // Check if we have data to display
  const hasChartData = chartData && Object.keys(chartData).length > 0;

  // Chart configurations
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(41, 125, 179, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
    propsForYLabels: {
      opacity: 0,
    },
  };

  const barChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(41, 125, 179, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.8,
    fillShadowGradient: "#0a4f79ff",
    fillShadowGradientOpacity: 1,
    propsForYLabels: {
      opacity: 0,
    },
  };

  // Get current chart data based on selected insight type
  const getCurrentChartData = () => {
    if (!hasChartData || !chartData[selectedInsightType]) {
      return null;
    }
    return chartData[selectedInsightType];
  };

  // Render the tabs for different insight types
  const renderInsightTabs = () => {
    const insightTypes = hasChartData ? Object.keys(chartData) : [];

    return (
      <View style={styles.tabContainer}>
        {insightTypes.map((type, index) => (
          <GradientButton
            key={index}
            fromColor={selectedInsightType === type ? "#297DB3" : "#fff"}
            toColor={selectedInsightType === type ? "#183243" : "#fff"}
            textStyle={{
              color: selectedInsightType !== type ? "#4b4b4b" : "#fff",
              fontWeight: "bold",
              fontSize: 12,
            }}
            containerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}
            onPress1={() => setSelectedInsightType(type)}
            title={
              type === "muscle_group"
                ? "Muscle Group"
                : type === "training"
                ? "Training"
                : "Goals"
            }
          />
        ))}
      </View>
    );
  };

  const currentData = getCurrentChartData();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopPageBar
        addColorLeft={"rgba(41, 126, 179, 0.158)"}
        addColorRight={"rgba(24, 50, 67, 0.135)"}
        title="Workout Distribution"
      />

      {hasChartData ? (
        <View style={styles.chartSectionContainer}>
          {renderInsightTabs()}

          {currentData && currentData.labels.length > 0 ? (
            <View style={styles.barChartCard}>
              <Text style={styles.cardHeader}>
                {selectedInsightType === "muscle_group"
                  ? "Muscle Group Distribution"
                  : selectedInsightType === "training"
                  ? "Training Type Distribution"
                  : "Goals Distribution"}
              </Text>

              <View style={styles.chartContainer}>
                {/* Sticky Y-axis for bar chart */}
                <StickyYAxis
                  data={currentData.datasets[0].data}
                  height={220}
                  chartConfig={barChartConfig}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  ref={aggregatedChartScrollViewRef}
                  style={styles.chartScrollView}
                >
                  <View style={styles.barChartWrapper}>
                    <BarChart
                      data={currentData}
                      width={Math.max(
                        width * 0.6,
                        currentData.labels.length * 80
                      )}
                      height={220}
                      chartConfig={barChartConfig}
                      fromZero
                      showValuesOnTopOfBars
                      withInnerLines={true}
                      style={{ marginLeft: 15 }}
                      withHorizontalLabels={false}
                    />
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No data available for {selectedInsightType.replace("_", " ")}.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No workout insights available yet.
          </Text>
          <Text style={styles.emptyStateSubText}>
            Track more workouts to see insights.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  chartSectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#1976D2",
  },
  tabText: {
    color: "#666",
    fontSize: 14,
  },
  activeTabText: {
    color: "#FFF",
    fontWeight: "500",
  },
  barChartCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  chartContainer: {
    flexDirection: "row",
  },
  chartScrollView: {
    flex: 1,
  },
  barChartWrapper: {
    marginLeft: -15,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});

export default LiveDistributionChart;
