// GymCard.js - Reusable Card Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

const GymCard = ({
  value,
  label,
  icon,
  backgroundColor = "#f0f5ff",
  onPress,
  width = "45%",
  height = 160,
  image,
  muscle = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor, width, height }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.iconContainer}>
        {/* {typeof icon === 'string' ? ( */}
        <Image
          source={image}
          contentFit="contain"
          style={[
            styles.icon,
            { height: muscle ? 75 : 75, width: muscle ? 66 : 75 },
          ]}
        />
        {/* // ) : ( // icon // )} */}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {/* <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={16} color="#5c9aff" />
      </View> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    marginHorizontal: 8,
    marginVertical: 0,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    // height: 140,
    // width: '100%',
    paddingVertical: 15,
  },
  icon: {
    // width: 100,
    // height: 100,
    // resizeMode: 'contain',
    width: 50,
    height: 75,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    // marginVertical: 10,
  },
  label: {
    color: "#8a94a6",
    fontSize: 12,
    marginTop: 5,
  },
  arrow: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -15 }],
    width: 30,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GymCard;
