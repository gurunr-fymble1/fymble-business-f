import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";

const MuscleGroupCarousel = ({
  muscleGroups = [],
  containerWidth = 140,
  containerHeight = 130,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const isScrolling = useRef(false);

  const muscleGroupImages = {
    male: [
      {
        id: 1,
        muscle_group: "ABS",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/ABS_M_NEW.png",
      },
      {
        id: 3,
        muscle_group: "Leg",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/LEGS_M_NEW.png",
      },
      {
        id: 5,
        muscle_group: "Back",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/BACK_M_NEW.png",
      },
      {
        id: 7,
        muscle_group: "Chest",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/CHEST_M_NEW.png",
      },
      {
        id: 9,
        muscle_group: "Biceps",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/BICEPS_M_NEW.png",
      },
      {
        id: 11,
        muscle_group: "Cardio",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/CARDIO_M_NEW.png",
      },
      {
        id: 13,
        muscle_group: "Triceps",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/TRICEPS_M_NEW.png",
      },
      {
        id: 15,
        muscle_group: "Forearms",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/FOREARM_M_NEW.png",
      },
      {
        id: 17,
        muscle_group: "Shoulder",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/SHOULDERS_M_NEW.png",
      },
      {
        id: 19,
        muscle_group: "Core",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/CORE+MALE.png",
      },
      {
        id: 21,
        muscle_group: "Cycling",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/CYCLING_M.png",
      },
      {
        id: 23,
        muscle_group: "Treadmill",
        url: "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/muscle_group/MALE/TREADMILL_M_NEW.png",
      },
    ],
  };

  // Function to get muscle group image URL with case-insensitive matching
  const getMuscleGroupImageUrl = (muscleGroup) => {
    const genderImages = muscleGroupImages.male;
    const found = genderImages.find(
      (img) => img.muscle_group.toLowerCase() === muscleGroup.toLowerCase()
    );
    const url = found ? found.url : null;

    // If URL is not found, fall back to a local image
    if (!url) {
      return require("../../../assets/images/workout/sample.png");
    }

    return { uri: url };
  };

  // Create infinite loop data only if there are multiple items
  const createInfiniteData = () => {
    if (muscleGroups.length <= 1) return muscleGroups;

    // Add copies at the beginning and end for infinite effect
    const lastItem = muscleGroups[muscleGroups.length - 1];
    const firstItem = muscleGroups[0];
    return [lastItem, ...muscleGroups, firstItem];
  };

  const infiniteData = createInfiniteData();
  const hasInfiniteLoop = muscleGroups.length > 1;

  // Set initial scroll position to show the first real item (skip the duplicate at index 0)
  useEffect(() => {
    if (hasInfiniteLoop && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          x: containerWidth,
          animated: false,
        });
      }, 100);
    }
  }, [muscleGroups, containerWidth]);

  const handleScroll = (event) => {
    if (isScrolling.current) return;

    const offsetX = event.nativeEvent.contentOffset.x;

    if (hasInfiniteLoop) {
      const index = Math.round(offsetX / containerWidth);

      // Calculate the real index (excluding duplicates)
      let realIndex;
      if (index === 0) {
        realIndex = muscleGroups.length - 1;
      } else if (index === infiniteData.length - 1) {
        realIndex = 0;
      } else {
        realIndex = index - 1;
      }

      setCurrentIndex(realIndex);
    } else {
      const index = Math.round(offsetX / containerWidth);
      setCurrentIndex(index);
    }
  };

  const handleMomentumScrollEnd = (event) => {
    if (!hasInfiniteLoop) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / containerWidth);

    // Reset position for infinite loop
    if (index === 0) {
      // At the duplicate of last item, jump to actual last item
      isScrolling.current = true;
      scrollViewRef.current.scrollTo({
        x: containerWidth * muscleGroups.length,
        animated: false,
      });
      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    } else if (index === infiniteData.length - 1) {
      // At the duplicate of first item, jump to actual first item
      isScrolling.current = true;
      scrollViewRef.current.scrollTo({
        x: containerWidth,
        animated: false,
      });
      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    }
  };

  if (!muscleGroups || muscleGroups.length === 0) {
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: containerWidth,
            height: containerHeight,
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#ddd",
            marginTop: 10,
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF", "rgba(103,197,251,0.3)"]}
            style={{
              width: containerWidth,
              height: containerHeight,
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("../../../assets/images/workout/sample.png")}
                style={{
                  width: containerWidth - 20,
                  height: containerHeight - 50,
                }}
                contentFit="contain"
              />
            </View>
            <View style={{ paddingHorizontal: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#333",
                  textAlign: "center",
                  fontWeight: "600",
                  maxWidth: containerWidth - 16,
                }}
                numberOfLines={1}
              >
                Workout
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (muscleGroups.length === 1) {
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: containerWidth,
            height: containerHeight,
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#ddd",
            marginTop: 10,
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF", "rgba(103,197,251,0.3)"]}
            style={{
              width: containerWidth,
              height: containerHeight,
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <Image
                source={getMuscleGroupImageUrl(muscleGroups[0])}
                style={{
                  width: containerWidth - 20,
                  height: containerHeight - 40,
                }}
                contentFit="contain"
              />
            </View>
            <View style={{ paddingHorizontal: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#333",
                  textAlign: "center",
                  fontWeight: "600",
                  maxWidth: containerWidth - 16,
                }}
                numberOfLines={1}
              >
                {muscleGroups[0]}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: containerWidth,
          height: containerHeight,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ddd",
          marginTop: 10,
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentContainerStyle={{
            width: containerWidth * infiniteData.length,
            height: containerHeight,
          }}
        >
          {infiniteData.map((muscleGroup, index) => (
            <View
              key={`${muscleGroup}-${index}`}
              style={{
                width: containerWidth,
                height: containerHeight,
              }}
            >
              <LinearGradient
                colors={[
                  "#FFFFFF",
                  "#FFFFFF",
                  "#FFFFFF",
                  "rgba(103,197,251,0.3)",
                ]}
                style={{
                  width: containerWidth,
                  height: containerHeight,
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Image
                    source={getMuscleGroupImageUrl(muscleGroup)}
                    style={{
                      width: containerWidth - 20,
                      height: containerHeight - 40,
                    }}
                    contentFit="contain"
                  />
                </View>
                <View style={{ paddingHorizontal: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#333",
                      textAlign: "center",
                      fontWeight: "600",
                      maxWidth: containerWidth - 16,
                    }}
                    numberOfLines={1}
                  >
                    {muscleGroup}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots - only show for original muscle groups */}
        {muscleGroups.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              position: "absolute",
              bottom: -10,
              width: "100%",
            }}
          >
            {muscleGroups.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    currentIndex === index ? "#006FAD" : "rgba(0,0,0,0.3)",
                  marginHorizontal: 1,
                }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const TemplateList = ({
  template,
  setCurrentTemplate,
  openEditModal,
  handleAddWorkout,
  deleteTemplate,
  handleTemplateSelect,
}) => {
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Extract muscle groups from the template
  const muscleGroups = template.muscle_group || [];

  // Count number of variants (days with exercises)
  const variantCount = Object.keys(template.exercise_data || {}).length;

  const handleMenuPress = () => {
    setDropdownOpenId(dropdownOpenId === template.id ? null : template.id);
  };

  const handleDropdownClose = () => {
    setDropdownOpenId(null);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.routineHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.routineTitle}>{template.name}</Text>
              <View style={styles.infoRow}>
                {variantCount > 0 && (
                  <Text style={styles.variantCount}>
                    {variantCount} Variant{variantCount !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            </View>

            <MuscleGroupCarousel
              muscleGroups={muscleGroups}
              containerWidth={100}
              containerHeight={100}
            />

            <View style={styles.rightSection}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleMenuPress}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleAddWorkout}
            style={styles.actionButton}
          >
            <LinearGradient
              colors={["#D8ECFF", "#D8ECFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBackground}
            >
              <View style={styles.buttonContentWrapper}>
                <Ionicons name="eye" size={18} color="#007BFF" />
                <Text style={[styles.buttonText]}>
                  {" "}
                  View and Modify Workouts
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modal for Edit/Delete options */}
        <Modal
          visible={dropdownOpenId === template.id}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDropdownClose}
        >
          <TouchableWithoutFeedback onPress={handleDropdownClose}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownModal}>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      handleDropdownClose();
                      setTimeout(() => {
                        openEditModal(template);
                      }, 100);
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color="#333"
                      style={styles.modalOptionIcon}
                    />
                    <Text style={styles.modalOptionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      handleDropdownClose();
                      deleteTemplate(template.id);
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#f44336"
                      style={styles.modalOptionIcon}
                    />
                    <Text
                      style={[styles.modalOptionText, { color: "#f44336" }]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 6,
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
    marginTop: 7,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  variantCount: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "#E9E9E9",
    borderRadius: 8,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "center",
    position: "absolute",
    top: -10,
    right: 0,
  },
  menuButton: {
    marginBottom: 8,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 200,
    width: "70%",
    maxWidth: 300,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalOptionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
    marginTop: 6,
  },
  actionButton: {
    height: 28,
    justifyContent: "center",
    marginHorizontal: 10,
    marginVertical: 5,
  },
  buttonContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  gradientBackground: {
    height: "100%",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007BFF",
  },
});

export default TemplateList;
