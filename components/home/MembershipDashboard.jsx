import React from "react";
import { useRouter } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { formatDate } from "date-fns";

const MemberCard = ({ member }) => {
  return (
    <View style={styles.membercardContainer}>
      <View style={styles.memberCard}>
        <View style={styles.avatarContainer}>
          <Image style={styles.avatar} source={{ uri: member.dp }} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberPhone}>{member.number}</Text>
        </View>
        <View style={styles.expiryInfo}>
          <Text style={styles.memberId}>{member.id}</Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.memberPlan}>{member.plan_description}</Text>
        {member.expires_in && (
          <Text style={styles.expiryDate}>{member.expires_in} Days</Text>
        )}
      </View>
    </View>
  );
};

const MembershipSection = ({ title, members, onViewMore }) => {
  return (
    <View style={styles.section}>
      <MaskedView
        maskElement={<Text style={styles.sectionTitle}>{title}</Text>}
      >
        <LinearGradient
          colors={["#5B2B9B", "#FF3C7B"].reverse()}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ justifyContent: "center" }}
        >
          <Text style={[{ opacity: 0 }, styles.sectionTitle]}>{title}</Text>
        </LinearGradient>
      </MaskedView>

      {members?.length === 0 ? (
        <View>
          <Text style={{ textAlign: "center", marginVertical: 10 }}>
            No members found..
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.membersContainer}>
            {members.map((member, index) => (
              <MemberCard key={index} member={member} />
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
        <MaskedView
          maskElement={<Text style={styles.viewMoreText}>View More</Text>}
        >
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.viewMoreText]}>View More</Text>
          </LinearGradient>
        </MaskedView>
      </TouchableOpacity>
    </View>
  );
};

const AttendanceTrendSection = ({ trendData }) => {
  const chartData = trendData && trendData.length > 0 ? [...trendData] : [];
  const screenWidth = Dimensions.get("window").width - 64;

  const validChartData = chartData.filter(
    (item) =>
      typeof item.attendance_count === "number" &&
      isFinite(item.attendance_count),
  );

  // Calculate y-axis values for the fixed axis
  const getYAxisValues = () => {
    if (validChartData.length === 0) return [];

    const values = validChartData.map((item) => item.attendance_count);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Create 5 evenly spaced values (segments + 1)
    const segments = 4;
    const step = (maxValue - minValue) / segments;
    const yAxisValues = [];

    for (let i = segments; i >= 0; i--) {
      yAxisValues.push(Math.round(minValue + step * i));
    }

    return yAxisValues;
  };

  const yAxisValues = getYAxisValues();

  const data = {
    labels: validChartData.map((item) => {
      const date = new Date(item.date);
      const month = date.toLocaleString("default", { month: "short" });
      const day = date.getDate();
      return `${month} ${day}`;
    }),
    datasets: [
      {
        data: validChartData.map((item) => item.attendance_count),
        color: (opacity = 1) => `rgba(255, 60, 123, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Attendance"],
  };

  const chartWidth = Math.max(screenWidth * 0.85, validChartData.length * 60);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 60, 123, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "2",
      strokeWidth: "2",
      stroke: "#FF3C7B",
    },
    propsForLabels: {
      fontSize: 12,
    },
    paddingRight: 40,
    paddingLeft: 0,
    formatYLabel: () => "",
    yAxisLabelWidth: 0,
    paddingTop: 10,
  };

  return (
    <View style={styles.section}>
      <MaskedView
        maskElement={<Text style={styles.sectionTitle}>Attendance Trend</Text>}
      >
        <LinearGradient
          colors={["#5B2B9B", "#FF3C7B"].reverse()}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ justifyContent: "center" }}
        >
          <Text style={[{ opacity: 0 }, styles.sectionTitle]}>
            Attendance Trend
          </Text>
        </LinearGradient>
      </MaskedView>

      {validChartData.length > 0 ? (
        <View style={styles.chartWithFixedAxis}>
          {/* Fixed Y-Axis */}
          <View style={styles.fixedYAxis}>
            {yAxisValues.map((value, index) => (
              <Text key={index} style={styles.yAxisLabel}>
                {value}
              </Text>
            ))}
          </View>

          {/* Scrollable Chart Content */}
          <ScrollView
            horizontal
            style={styles.scrollableChart}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.chartContainer}>
              <LineChart
                data={data}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                bezier={true}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                withInnerLines={true}
                withOuterLines={true}
                withHorizontalLabels={false}
                fromZero={false}
                yAxisInterval={1}
                verticalLabelRotation={0}
                segments={4}
                withDots={true}
                withShadow={false}
                hidePointsAtIndex={[]}
              />
            </View>
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.noDataText}>No attendance data available</Text>
      )}
    </View>
  );
};

const MembershipDashboard = ({
  aboutToExpireList,
  expiredMembersList,
  attendanceChartData,
}) => {
  const router = useRouter();

  const handleNavigateToExpiringList = () => {
    if (aboutToExpireList) {
      router.push("/owner/clientEstimate");
    }
  };

  const handleNavigateToExpiredList = () => {
    if (expiredMembersList) {
      router.push("/owner/unpaidMembers");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MembershipSection
        title="About to Expire"
        members={aboutToExpireList}
        onViewMore={handleNavigateToExpiringList}
        gradientColors={["#5B2B9B", "#FF3C7B"]}
      />

      <MembershipSection
        title="Expired"
        members={expiredMembersList}
        onViewMore={handleNavigateToExpiredList}
        gradientColors={["#5B2B9B", "#FF3C7B"]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  membersContainer: {
    gap: 12,
  },
  membercardContainer: {
    padding: 12,
    borderWidth: 0.5,
    borderRadius: 12,
    borderColor: "rgba(217, 217, 217, 1)",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: "3B3B3B",
  },
  memberPhone: {
    fontSize: 12,
    color: "#3B3B3B",
    marginVertical: 2,
  },
  memberPlan: {
    fontSize: 14,
    color: "#666",
  },
  expiryInfo: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  memberId: {
    fontSize: 12,
    color: "#3B3B3B",
    fontWeight: "500",
  },
  expiryDate: {
    fontSize: 14,
    color: "#666",
  },
  viewMoreButton: {
    alignItems: "center",
    marginTop: 16,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#5B2B9B",
    fontWeight: "500",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 40,
    marginHorizontal: 50,
  },
  chartWithFixedAxis: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  fixedYAxis: {
    width: 40,
    height: 225,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 45,
    paddingBottom: 0,
  },
  yAxisLabel: {
    fontSize: 12,
    color: "#000",
    textAlign: "right",
  },
  scrollableChart: {
    flex: 1,
  },
  chartContainer: {
    alignItems: "center",
  },
});

export default MembershipDashboard;
