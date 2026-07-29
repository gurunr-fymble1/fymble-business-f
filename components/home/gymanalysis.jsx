import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Platform,
  Image,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import PieChart from "react-native-pie-chart";
import { getAnalysisAPI } from "../../services/Api";
import AnalysisSkeleton from "../ui/loaders/analysisSkeleton";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { getToken } from "../../utils/auth";
import { LinearGradient } from "expo-linear-gradient";
import EmptyStateCard from "../ui/EmptyDataComponent";
import { showToast } from "../../utils/Toaster";

const screenWidth = Dimensions.get("window").width;
const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

const GymAnalysis = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [entrantsModalVisible, setEntrantsModalVisible] = useState(false);
  const [hourlyAggData, setHourlyAggData] = useState({});
  const [analysisData, setAnalysisData] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Hourly");
  const [activeTabHeader, setActiveTabHeader] = useState("Hourly");

  const handleTabChange = (tab) => {
    setActiveTabHeader(tab);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymId is not available",
        });
        return;
      }
      const response = await getAnalysisAPI(gymId);

      if (response?.status === 200) {
        setHourlyAggData(response.data.hourly_agg || {});
        setAnalysisData(response.data.analysis || {});
        setMonthlyData(response.data.monthly_data || {});
      } else {
        showToast({
          type: "error",
          title: response?.detail,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderHourlyModalContent = () => {
    return Object.keys(hourlyAggData).map((timeRange, index) => (
      <View key={index} style={styles.modalTextContainer}>
        <Text style={styles.modalTimeText}>{timeRange}</Text>
        <Text style={styles.modalDataText}>
          {hourlyAggData[timeRange]} attendees
        </Text>
      </View>
    ));
  };

  const chartConfig = {
    backgroundGradient: true,
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `#007AFF`,
    labelColor: (opacity = 1) => `#007AFF`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: "#007AFF",
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: "#007AFF",
    },
  };

  const getSections = () => {
    if (!analysisData) return [];

    const sections = [
      {
        id: "gender",
        title: "Gender Distribution",
        data: processAnalysisData(analysisData.gender),
        category: "members",
      },
      {
        id: "goal_data",
        title: "Member Goals",
        data: processAnalysisData(analysisData.goal_data),
        category: "members",
      },
      {
        id: "expenditure",
        title: "Expenditure Distribution",
        data: processAnalysisData(analysisData.expenditure),
        category: "finance",
      },
      {
        id: "goal_income",
        title: "Income by Goal",
        data: processAnalysisData(analysisData.goal_income),
        category: "finance",
      },
      {
        id: "training_data",
        title: "Training Types",
        data: processAnalysisData(analysisData.training_data),
        category: "members",
      },
      {
        id: "training_income",
        title: "Income by Training Type",
        data: processAnalysisData(analysisData.training_income),
        category: "finance",
      },
      {
        id: "expenditure_data",
        title: "Detailed Expenditure",
        data: processAnalysisData(analysisData.expenditure_data),
        category: "finance",
      },
    ];

    return sections.filter(
      (section) => section.data && section.data.length > 0
    );
  };

  const processAnalysisData = (data) => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data
        .map((item) => ({
          name:
            typeof item.name === "string" ? formatName(item.name) : item.name,
          value: Number(item.value) || 0,
        }))
        .filter((item) => item.value > 0);
    }

    if (typeof data === "object" && data !== null) {
      return Object.entries(data)
        .map(([name, value]) => ({
          name: formatName(name),
          value: Number(value) || 0,
        }))
        .filter((item) => item.value > 0);
    }

    return [];
  };

  function formatName(name) {
    if (!name || typeof name !== "string") return name;

    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const truncateText = (text, maxLength = 10) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderPieChart = (data, title, key) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const values = data.map((item) => {
      const val = Number(item.value);
      return isNaN(val) ? 0 : val;
    });

    if (values.every((v) => v === 0)) {
      return null;
    }

    const filteredData = data.filter((item) => Number(item.value) > 0);
    const filteredValues = filteredData.map((item) => Number(item.value));

    if (filteredData.length === 0) {
      return null;
    }

    const colors = [
      "#1F90CE", // Primary blue
      "#21A065", // Green
      "#38B59C", // Teal
      "#108CB6", // Dark blue
      "#FF5757", // Red
      "#FFA726", // Orange
      "#AB47BC", // Purple
      "#26C6DA", // Cyan
      "#66BB6A", // Light green
      "#FFCA28", // Amber
      "#EC407A", // Pink
      "#8D6E63", // Brown
    ];

    const total = filteredValues.reduce((sum, val) => sum + val, 0);

    return (
      <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.donutChartContainer}>
          <View style={styles.chartWrapper}>
            <PieChart
              widthAndHeight={180}
              series={filteredValues}
              sliceColor={colors.slice(0, filteredValues.length)}
              doughnut={true}
              coverRadius={0.75}
              coverFill={"#F9FAFB"}
            />
            <View style={styles.centerLabelOverlay}>
              <Text style={styles.centerValue}>{total}</Text>
              <Text style={styles.centerSubtext}>Total</Text>
            </View>
          </View>

          <View style={styles.legendList}>
            {filteredData.map((item, index) => (
              <View
                key={`${key}-${index}`}
                style={[
                  styles.legendItem,
                  { backgroundColor: colors[index % colors.length] },
                ]}
              >
                <Text style={styles.legendText} numberOfLines={2}>
                  {truncateText(item.name, 14)}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderLineChart = (title, dataKey) => {
    const currentYear = new Date().getFullYear().toString();

    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Find the maximum month with data
    let maxMonthIndex = 0;
    const yearData = Array(12).fill(0);

    if (monthlyData[currentYear]) {
      monthlyData[currentYear].forEach((entry) => {
        const monthIndex = parseInt(entry.month_year.split("-")[1], 10) - 1;
        yearData[monthIndex] = entry[dataKey] || 0;
        if (monthIndex > maxMonthIndex) {
          maxMonthIndex = monthIndex;
        }
      });
    }

    // Only include data up to the max month
    const currentYearData = yearData.slice(0, maxMonthIndex + 1);
    const months = allMonths.slice(0, maxMonthIndex + 1);

    const validChartData = currentYearData.filter(
      (item) => item !== null && item !== undefined
    );

    const lineColors = {
      current: "rgba(0, 122, 255, 1)",
    };

    const data = {
      labels: months,
      datasets: [
        {
          data: currentYearData,
          color: (opacity = 1) => lineColors.current,
          strokeWidth: 2,
        },
      ],
    };

    const chartWidth = Math.max(screenWidth * 1, months.length * 60);

    return (
      <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.lineChartContainer}>
          {validChartData.length > 0 ? (
            <>
              <View style={styles.lineChartCard}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 10 }}
                >
                  <LineChart
                    data={data}
                    chartConfig={{
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      propsForLabels: {
                        fontSize: 12,
                      },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                      },
                      propsForBackgrounds: {
                        fill: "none",
                      },
                      propsForHorizontalLabels: {
                        fontSize: 12,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 12,
                    }}
                    width={chartWidth}
                    bezier={true}
                    height={220}
                    withDots={true}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    fromZero={false}
                    yAxisInterval={1}
                    verticalLabelRotation={0}
                    segments={5}
                    withShadow={false}
                  />
                </ScrollView>
              </View>
              <View style={styles.lineChartLegend}>
                <View style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: lineColors.current },
                    ]}
                  />
                  <Text style={styles.legendLabel}>
                    Current Year ({currentYear})
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No data available</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <AnalysisSkeleton priority="high" />;
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {["Hourly", "Ledger", "Members"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleTabChange(tab)}
          >
            {activeTabHeader === tab ? (
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeTabGradient}
              >
                <Text style={styles.activeTabText}>{tab}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTabButton}>
                <Text style={styles.tabText}>{tab}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <>
          {activeTabHeader === "Hourly" && (
            <>
              {Object.keys(hourlyAggData).length > 0 ? (
                <>
                  <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
                    <Text style={styles.sectionTitle}>Hourly Analysis</Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 10 }}
                    >
                      <BarChart
                        data={{
                          labels: Object.keys(hourlyAggData),
                          datasets: [
                            {
                              data: Object.values(hourlyAggData),
                            },
                          ],
                        }}
                        width={Math.max(
                          width - 40,
                          Object.keys(hourlyAggData).length * 80
                        )}
                        height={280}
                        chartConfig={{
                          backgroundGradientFrom: "#F9FAFB",
                          backgroundGradientTo: "#F9FAFB",
                          decimalPlaces: 0,
                          color: (opacity = 1) =>
                            `rgba(0, 122, 255, ${opacity})`,
                          labelColor: (opacity = 1) =>
                            `rgba(0, 0, 0, ${opacity})`,
                          style: {
                            borderRadius: 12,
                          },
                          barPercentage: 0.8,
                          fillShadowGradient: "#007AFF",
                          fillShadowGradientOpacity: 1,
                        }}
                        style={{
                          marginLeft: 5,
                          borderRadius: 12,
                        }}
                        withInnerLines={true}
                        withOuterLines={false}
                        fromZero={true}
                        yAxisInterval={1}
                        verticalLabelRotation={0}
                        segments={4}
                        showValuesOnTopOfBars
                      />
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View>
                  <Text style={styles.noHourTitle}>
                    No Hourly Data Available
                  </Text>
                  <Text style={styles.noHourSubTitle}>
                    Check back later for updates...
                  </Text>
                </View>
              )}
            </>
          )}

          {activeTabHeader === "Ledger" && (
            <>
              <ScrollView>
                {Object.keys(monthlyData).length > 0 ? (
                  renderLineChart("Income vs Time", "income")
                ) : (
                  <EmptyStateCard
                    title={"No Financial Data Available"}
                    message={
                      "We couldn't find any financial records to display. This could be because no transactions have been recorded yet or there might be an issue with data synchronization."
                    }
                  />
                )}

                {getSections().length > 0 ? (
                  getSections()?.map((item, index) => {
                    return (
                      <View key={index}>
                        {item.category === "finance" &&
                          renderPieChart(item.data, item.title, item.id)}
                      </View>
                    );
                  })
                ) : (
                  <EmptyStateCard
                    title={"No Financial Charts Available"}
                    message={
                      "We don't have enough financial data to generate charts. This could be because no financial categories have been set up or there's no transaction history yet."
                    }
                  />
                )}
              </ScrollView>
            </>
          )}

          {activeTabHeader === "Members" && (
            <ScrollView>
              {Object.keys(monthlyData).length > 0 ? (
                renderLineChart("New Entrants vs Time", "new_entrants")
              ) : (
                <EmptyStateCard
                  title={"No Member Data Available"}
                  message={
                    "We couldn't find any member data to display. This could be because no members have been added yet or there might be an issue with data synchronization."
                  }
                />
              )}

              {getSections().length > 0 ? (
                getSections()?.map((item, index) => {
                  return (
                    <View key={index}>
                      {item.category === "members" &&
                        renderPieChart(item.data, item.title, item.id)}
                    </View>
                  );
                })
              ) : (
                <EmptyStateCard
                  title={"No Member Charts Available"}
                  message={
                    "We don't have enough member data to generate demographic charts. This could be because member profiles are incomplete or we haven't collected enough information yet."
                  }
                />
              )}
            </ScrollView>
          )}
        </>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "ios" ? 80 : 0,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    marginTop: Platform.OS === "ios" ? 30 : 12,
    gap: 12,
  },
  tab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  lineChartContainer: {
    width: "100%",
    marginTop: 10,
  },
  lineChartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lineChartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 20,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    paddingLeft: 10,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutChartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
  },
  centerLabelOverlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
  },
  centerValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  centerSubtext: {
    fontSize: 12,
    color: "#999",
  },
  legendList: {
    justifyContent: "center",
    paddingLeft: 10,
  },
  legendItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 105,
    justifyContent: "center",
  },
  legendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
  },
  modalTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  modalTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalDataText: {
    fontSize: 15,
    color: "#666",
  },
  noHourTitle: {
    marginTop: 80,
    textAlign: "center",
    fontSize: 18,
  },
  noHourSubTitle: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 10,
  },
});

export default GymAnalysis;
