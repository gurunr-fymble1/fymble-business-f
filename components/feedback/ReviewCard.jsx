import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

/**
 * ReviewCard Component
 * @param {Object} props
 * @param {string} props.quote - The headline quote of the review
 * @param {string} props.description - The description text of the review
 * @param {string} props.userName - The name of the reviewer
 * @param {string} props.userLocation - The location of the reviewer (City, Country)
 * @param {number} props.rating - Rating out of 5 (1-5)
 * @param {string|Object} props.userImage - URI or require() for user avatar
 * @param {Object} props.containerStyle - Optional additional styles for container
 * @param {Object} props.quoteStyle - Optional additional styles for quote text
 * @param {Object} props.descriptionStyle - Optional additional styles for description text
 */
const ReviewCard = ({
  quote = "Perfect Atmosphere for Workouts",
  description = "The equipment is well-maintained, and the ambiance is just right",
  userName = "Getty",
  userLocation = "(Delhi, India)",
  rating = 5,
  userImage = require("../../assets/images/user_1.png"), // Replace with your default image
  containerStyle = {},
  quoteStyle = {},
  descriptionStyle = {},
  id,
}) => {
  const [showDescription, setShowDescription] = useState(false);
  // Generate the stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Text key={i} style={styles.starFilled}>
            ★
          </Text>
        );
      } else {
        stars.push(
          <Text key={i} style={styles.starEmpty}>
            ☆
          </Text>
        );
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.quote, quoteStyle]}>{quote}</Text>
        <Text style={[styles.description, descriptionStyle]}>
          {description.length > 60 && !showDescription
            ? description.slice(0, 60) + "..."
            : description}
        </Text>
        {description.length > 60 && (
          <Text
            style={styles.viewMoreText}
            onPress={() => setShowDescription(!showDescription)}
          >
            {showDescription ? "view less" : "view more"}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Image
            source={
              typeof userImage === "string" ? { uri: userImage } : userImage
            }
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userLocation}>{userLocation}</Text>
          </View>
        </View>

        {renderStars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 500,
    width: "100%",
    marginBottom: 20,
  },
  contentContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 20,
  },
  quote: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#6f6f6f",
    // lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 25,
    marginRight: 12,
  },
  userTextContainer: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4285F4",
  },
  userLocation: {
    fontSize: 10,
    color: "#666666",
  },
  starsContainer: {
    flexDirection: "row",
  },
  starFilled: {
    color: "#FFD700",
    fontSize: 16,
    marginLeft: 2,
  },
  starEmpty: {
    color: "#D3D3D3",
    fontSize: 16,
    marginLeft: 2,
  },
});

export default ReviewCard;
