// components/SummaryCard.js
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const SummaryCard = ({
  title,
  amount,
  icon,
  iconColor,
  iconBgColor,
  leftImage,
  rightImage,
  width = false,
  isAmount = true,
}) => {
  return (
    <View style={styles.card}>
      {leftImage && (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Image
            source={leftImage}
            height={width ? 40 : 30}
            width={width ? 40 : 25}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.amount, { color: iconColor }]}>
          {isAmount ? "₹" : ""}
          {amount}
        </Text>
      </View>
      {rightImage && (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Image
            source={rightImage}
            height={width ? 40 : 30}
            width={width ? 40 : 25}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  textContainer: {
    // backgroundColor: 'pink',
  },
  iconContainer: {
    // width: 30,
    // height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 12,
  },
  title: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 5,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SummaryCard;
