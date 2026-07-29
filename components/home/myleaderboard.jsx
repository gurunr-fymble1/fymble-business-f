import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { getClientLeaderboardAPI } from "../../services/clientApi";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from "expo-image";

import { showToast } from "../../utils/Toaster";
import { LinearGradient } from "expo-linear-gradient";
import LeaderboardTabSkeleton from "../ui/loaders/leaderboardTabSkeleton";

import * as SecureStore from "expo-secure-store";
const { width } = Dimensions.get("window");
const Avatar = ({ name, size, style, isFirst }) => {
  const initials = name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "#4A90E2",
    "#50C878",
    "#9B59B6",
    "#E67E22",
    "#E74C3C",
    "#16A085",
    "#2980B9",
    "#8E44AD",
    "#2C3E50",
  ];

  const colorIndex = name?.length % colors?.length;
  const backgroundColor = colors[colorIndex];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: isFirst ? "#FFD700" : "#4A90E2",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.4,
          fontWeight: "bold",
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const Crown = () => <Text style={styles.crown}>👑</Text>;

const TopThreePlayers = ({ players }) => {
  const positions = [1, 0, 2];

  return (
    <View style={styles.topThreeContainer}>
      {positions.map((pos, index) => {
        const player = players[pos];
        const isFirst = index === 1;

        return (
          <View
            key={player.client_id}
            style={[styles.topPlayerCard, isFirst ? styles.firstPlace : null]}
          >
            <View style={styles.avatarContainer}>
              {/* {isFirst && <Crown />} */}
              {isFirst && (
                <Image
                  source={player.profile}
                  style={{ width: 80, height: 80, borderRadius: 50 }}
                />
              )}
              {!isFirst && (
                <Image
                  source={player.profile}
                  style={{ width: 60, height: 60, borderRadius: 50 }}
                />
              )}
            </View>
            <Text style={styles.playerName}>
              {player.client_name.substring(0, 12)}
            </Text>
            <Text
              style={[styles.points, isFirst ? styles.firstPlacePoints : null]}
            >
              {player.xp}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const PlayerListItem = ({ player, position }) => (
  <View style={styles.listItem}>
    <Text style={styles.position}>{position}</Text>
    <Image
      source={player.profile}
      style={{ width: 30, height: 30, borderRadius: 50 }}
    />
    <View style={styles.playerInfo}>
      <Text style={styles.listPlayerName}>{player?.client_name}</Text>
      <Text style={styles.rankText}>
        {player?.badge} - {player?.level}
      </Text>
    </View>
    <Text style={styles.listPoints}>{player?.xp}</Text>
  </View>
);

const MyLeaderboard = ({}) => {
  const [activeTab, setActiveTab] = useState("Today");
  const tabs = ["Today", "This Month", "Overall"];
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTabData = (tab) => {
    switch (tab) {
      case "Today":
        return leaderboardData?.today;
      case "This Month":
        return leaderboardData?.month;
      case "Overall":
        return leaderboardData?.overall;
      default:
        return leaderboardData?.today;
    }
  };

  // useEffect(() => {
  //   if (tab) {
  //     onNullTab();
  //   }
  // }, []);

  const fetchLeaderboardDetails = async () => {
    setLoading(true);
    try {
      const gymId = await SecureStore.getItemAsync("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const response = await getClientLeaderboardAPI(gymId);

      if (response?.status === 200) {
        setLeaderboardData(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error Fetching Rewards",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardDetails();
  }, []);

  if (loading) {
    return <LeaderboardTabSkeleton />;
  }
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tab}
          >
            {activeTab === tab ? (
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

      <ScrollView style={styles.content}>
        {getTabData(activeTab).length > 3 && (
          <>
            <TopThreePlayers players={getTabData(activeTab)?.slice(0, 3)} />
            <View style={styles.listContainer}>
              {getTabData(activeTab)
                ?.slice(3)
                ?.map((player, index) => (
                  <PlayerListItem
                    key={player.client_id}
                    player={player}
                    position={index + 4}
                  />
                ))}
            </View>
          </>
        )}

        {getTabData(activeTab).length > 0 &&
          getTabData(activeTab).length < 3 && (
            <View style={styles.listContainer}>
              {getTabData(activeTab)?.map((player, index) => (
                <PlayerListItem
                  key={player.client_id}
                  player={player}
                  position={index + 1}
                />
              ))}
            </View>
          )}

        {getTabData(activeTab).length == 3 && (
          <>
            <TopThreePlayers players={getTabData(activeTab)?.slice(0, 3)} />
          </>
        )}

        {getTabData(activeTab).length === 0 && (
          <View style={styles.noData}>
            <Image
              source={require("../../assets/images/leaderboard_home.png")}
              style={{ width: 140, height: 180 }}
            />
            <Text style={styles.noDataText}>No Data Found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: width >= 786 ? 20 : Platform.OS === "ios" ? 15 : 5,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    marginTop: 10,
    marginHorizontal: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
  },
  activeTabGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  inactiveTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tabText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingBottom: 50,
  },
  topThreeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 30,
  },
  topPlayerCard: {
    alignItems: "center",
    marginHorizontal: 10,

    flex: 1,
  },
  firstPlace: {
    marginTop: -20,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  crown: {
    position: "absolute",
    top: -25,
    fontSize: 24,
  },
  playerName: {
    color: "#333",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  points: {
    color: "#3A6073",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  firstPlacePoints: {
    color: "#16222A",
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
    marginBottom: 100,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  position: {
    color: "#666",
    width: 20,
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  listPlayerName: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  rankText: {
    color: "#666",
    fontSize: 10,
  },
  listPoints: {
    color: "#3A6073",
    fontSize: 14,
    fontWeight: "bold",
  },
  noData: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 30,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default MyLeaderboard;
