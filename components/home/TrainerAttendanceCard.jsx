import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";

import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";

const { width, height } = Dimensions.get("window");

const CircularProgress = ({ percentage }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
      </View>
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <Defs>
          <SvgLinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#5B2B9B" />
            <Stop offset="100%" stopColor="#FF3C7B" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90, 50, 50)"
        />
      </Svg>
    </View>
  );
};

const TrainerAttendanceCard = ({ onViewAllPress }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainerAttendance();
  }, []);

  const fetchTrainerAttendance = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      const response = await axiosInstance.get(
        `/trainer-attendance/today/${gymId}`
      );
      if (response?.data?.status === 200) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to load trainer attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>Trainer Attendance</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color="#FF5757" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!attendanceData?.summary) {
    return (
      <TouchableOpacity
        style={[styles.attendanceCard, styles.noDataCard]}
        onPress={onViewAllPress}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>Trainer Attendance</Text>
        </View>
        <Text style={styles.noDataText}>
          No trainer attendance data available
        </Text>
      </TouchableOpacity>
    );
  }

  const { summary, trainers } = attendanceData;
  const percentage =
    summary.total_trainers > 0
      ? Math.round((summary.present_today / summary.total_trainers) * 100)
      : 0;

  return (
    <TouchableOpacity style={styles.attendanceCard} onPress={onViewAllPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderTitle}>Trainer Attendance</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.attendanceLeftSection}>
          <View style={styles.circularProgressContainer}>
            <CircularProgress
              percentage={percentage}
              radius={40}
              strokeWidth={10}
              activeColor="#8A2BE2"
              inactiveColor="#E0E0E0"
            />
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <Image
                source={require("../../assets/images/user_trainer.png")}
                style={styles.trophyIcon}
              />
              <Text style={styles.statLabel}>Present</Text>
              <Text style={styles.statValue}>{summary.present_today || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Image
                source={require("../../assets/images/total_trainer.png")}
                style={styles.trophyIcon}
              />
              <Text style={styles.statLabel}>Total Trainers</Text>
              <Text style={styles.statValue}>
                {summary.total_trainers || 0}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.attendanceRightSection}>
          <Image
            source={require("../../assets/images/trainer attendance.png")}
            style={styles.attendanceImage}
            contentFit="contain"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  attendanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 0,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    // paddingVertical:10,
    marginTop: 0,
    overflow: "visible",
  },
  attendanceLeftSection: {
    width: width >= 786 ? "70%" : "60%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attendanceRightSection: {
    width: width >= 786 ? "20%" : "33%",
    flexDirection: "row",
    alignItems: "center",
  },
  circularProgressContainer: {
    width: "32%",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  progressTextContainer: {
    width: width >= 786 ? 150 : 80,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8A2BE2",
  },
  attendanceStats: {
    flexDirection: "column",
    marginLeft: 0,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 5,
    borderRadius: 8,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: "white",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  trophyIcon: {
    width: width >= 786 ? 24 : 15,
    height: width >= 786 ? 24 : 15,
  },
  statLabel: {
    fontSize: width >= 786 ? 16 : 12,
    color: "#666",
    marginRight: 6,
  },
  statValue: {
    fontSize: width >= 786 ? 18 : 14,
    fontWeight: "bold",
    color: "#333",
  },
  attendanceImage: {
    width: width >= 786 ? 130 : 100,
    height: width >= 786 ? 150 : 115,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  noDataCard: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
});

export default TrainerAttendanceCard;
