import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QuestDetailsModal = ({ visible, onClose, quest, insets }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{"Quest Details"}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {quest ? (
              <ScrollView>
                {/* <View style={styles.questImageContainer}>
              <Image
                source={quest.image}
                style={styles.questImage}
                resizeMode="contain"
              />
            </View> */}

                <Text style={styles.questDetailTitle}>{quest.about}</Text>
                <Text style={styles.questDescription}>{quest.description}</Text>

                <View style={styles.questRewardContainer}>
                  <Text style={styles.rewardHeading}>Reward</Text>
                  <View style={styles.xpContainer}>
                    <Image
                      source={require("../../assets/images/rewards/XP 1.png")}
                      style={styles.xpIcon}
                    />
                    <MaskedView
                      maskElement={
                        <Text style={styles.xpText}>{quest.xp} XP</Text>
                      }
                    >
                      <LinearGradient
                        colors={["#030A15", "#0154A0"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.4, y: 0 }}
                        style={{ justifyContent: "center" }}
                      >
                        <Text style={[{ opacity: 0 }, styles.xpText]}>
                          {quest.xp} XP
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                  </View>
                </View>

                {/* <View style={styles.criteriaContainer}>
                <Text style={styles.criteriaHeading}>Completion Criteria</Text>
                {quest.criteria.map((criterion, index) => (
                  <View key={index} style={styles.criteriaItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.criteriaIcon} />
                    <Text style={styles.criteriaText}>{criterion}</Text>
                  </View>
                ))}
              </View>
             
              <TouchableOpacity style={styles.startQuestButton}>
                <Text style={styles.startQuestText}>Start Quest</Text>
              </TouchableOpacity> */}
              </ScrollView>
            ) : (
              <Text style={styles.noDataText}>
                Quest information not available
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const EarnXP = ({ quest }) => {
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showQuestDetails, setShowQuestDetails] = useState(false);
  const [quests, setQuests] = useState(quest ? quest : []);
  const insets = useSafeAreaInsets();
  const handleQuestPress = (quest) => {
    setSelectedQuest(quest);
    setShowQuestDetails(true);
  };

  const getIcon = {
    attendance: require("../../assets/images/home/login_quest.png"),
    diet: require("../../assets/images/home/diet_quest.png"),
    workout: require("../../assets/images/rewards/Vector.png"),
  };

  const truncateText = (text, wordCount = 10) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(" ") + "...";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionContainer}>
        <MaskedView
          maskElement={
            <Text style={styles.sectionTitle}>Fymble User XP Quests</Text>
          }
        >
          <LinearGradient
            colors={["#030A15", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.sectionTitle]}>
              Fymble User XP Quests
            </Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.sectionSubtitle}>
          Fymble User's tasks to earn XP. Set up by Fymble{"\n"}It cannot be
          edited, deleted or modified.
        </Text>

        {quests?.map((quest) => (
          <TouchableOpacity
            key={quest.id}
            style={styles.questItemContainer}
            onPress={() => handleQuestPress(quest)}
          >
            <LinearGradient
              colors={[
                "rgba(236, 236, 236, 0.37)",
                "rgba(74, 162, 244, 0.31)",
              ].reverse()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.questItem}
            >
              <View style={styles.questContent}>
                <View style={styles.questIconContainer}>
                  <LinearGradient
                    colors={["#fff", "#E1E8F0"]}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Image
                      source={getIcon[quest?.tag]}
                      style={styles.questIcon}
                    />
                  </LinearGradient>
                </View>
                <View style={styles.questTextContainer}>
                  <Text
                    style={styles.questTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {quest?.about}
                  </Text>
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.questDescription} numberOfLines={2}>
                      {truncateText(quest?.description)}
                    </Text>
                    <TouchableOpacity onPress={() => handleQuestPress(quest)}>
                      <Text style={styles.readMoreText}>Read more</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.questRight}>
                <View style={styles.xpBadge}>
                  <Image
                    source={require("../../assets/images/rewards/XP 1.png")}
                    style={styles.xpBadgeIcon}
                  />
                  <Text style={styles.xpBadgeText}>{quest.xp}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <QuestDetailsModal
        visible={showQuestDetails}
        onClose={() => setShowQuestDetails(false)}
        quest={selectedQuest}
        insets={insets}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  questItemContainer: {
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.7)",
    marginBottom: 20,
    lineHeight: 18,
    textAlign: "center",
  },
  questItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  questContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  questIconContainer: {
    marginRight: 14,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // elevation: 1,
  },
  questIcon: {
    width: 28,
    height: 28,
  },
  questTextContainer: {
    flex: 1,
    width: "65%",
  },
  questTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    maxWidth: "95%",
  },
  questDescription: {
    fontSize: 10,
    color: "rgba(0,0,0,0.6)",
    flexShrink: 1,
  },
  readMoreText: {
    fontSize: 10,
    color: "#0154A0",
    fontWeight: "600",
    marginLeft: 4,
  },
  questRight: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
    justifyContent: "flex-end",
  },
  xpBadge: {
    backgroundColor: "#FEF3CD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  xpBadgeIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
  },
  xpBadgeText: {
    color: "#030A15",
    fontWeight: "600",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  questImageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  questImage: {
    width: 80,
    height: 80,
  },
  questDetailTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  questRewardContainer: {
    backgroundColor: "#F5F7FA",
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  rewardHeading: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  xpIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "600",
  },
  criteriaContainer: {
    marginBottom: 24,
  },
  criteriaHeading: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  criteriaIcon: {
    marginRight: 8,
  },
  criteriaText: {
    fontSize: 14,
  },
  startQuestButton: {
    backgroundColor: "#0154A0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  startQuestText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    marginVertical: 24,
    color: "rgba(0,0,0,0.5)",
  },
});

export default EarnXP;
