import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const WorkoutCard = ({
  title,
  subtitle,
  imagePath,
  onPress,
  buttonText = "",
  variant = "workout",
  textColor = "#297DB3",
  paraTextColor = "#00000075",
  buttonTextColor = "#000",
  bg1 = "#28A745",
  bg2 = "#297DB3",
  border1,
  border2,
  charWidth = 140,
  charHeight = 140,
  childComponent = null,
  nospace = false,
  smallWidth = false,
}) => {
  const isMealCard = variant === "meal";

  return (
    <TouchableOpacity
      style={[styles.card, nospace && { marginBottom: 0 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Main card content */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={[bg1, bg2]}
          start={{ x: 0.2, y: 0.3 }}
          end={{ x: 0.25, y: 1.3 }}
          style={styles.contentContainer}
        >
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                isMealCard && styles.mealTitle,
                { color: textColor },
              ]}
            >
              {title}
            </Text>

            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  isMealCard && styles.mealSubtitle,
                  { color: paraTextColor },
                  smallWidth && { maxWidth: "90%" },
                ]}
              >
                {subtitle}
              </Text>
            )}

            {childComponent && childComponent}

            {buttonText && (
              <View style={styles.button}>
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                  {buttonText}
                </Text>
                <Ionicons
                  name={"arrow-forward"}
                  size={12}
                  color={buttonTextColor}
                  style={styles.icon}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Image positioned outside to ensure visibility */}
      {imagePath && (
        <View style={styles.imageContainer}>
          <Image
            source={imagePath}
            style={[
              styles.workoutImage,
              {
                width: width >= 786 ? 150 : charWidth,
                height: width >= 786 ? 150 : charHeight,
              },
            ]}
            resizeMode="contain"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    height: width >= 786 ? 180 : 150,
    // Removed overflow hidden and borderRadius from here
    paddingTop: 25,
    position: "relative",
    // Add extra margin/padding to accommodate overflowing image
    marginBottom: 20,
  },
  cardWrapper: {
    width: "100%",
    height: "100%",
    padding: 1,
    position: "relative",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    // Remove overflow hidden from here
  },
  textContainer: {
    height: "100%",
    maxWidth: "70%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontSize: width >= 786 ? 20 : 14,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: width >= 786 ? 16 : 12,
    color: "rgba(0,0,0,0.5)",
    marginTop: 4,
    width: "100%",
  },
  mealTitle: {
    fontSize: 16,
  },
  mealSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  imageContainer: {
    position: "absolute",
    right: width >= 786 ? 30 : 0,
    bottom: 0,
    zIndex: 10,
    // Key: positioned relative to the main card container, not the gradient
  },
  workoutImage: {
    // Image styling
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: width >= 786 ? 16 : 12,
    fontWeight: "600",
  },
  icon: {
    marginLeft: 4,
  },
});

export default WorkoutCard;
