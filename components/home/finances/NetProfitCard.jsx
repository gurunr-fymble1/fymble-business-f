// components/NetProfitCard.js
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";

const NetProfitCard = ({ amount }) => {
  return (
    <LinearGradient
      colors={["rgba(0, 109, 173, 0.400)", "#BDE5FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Net Profit</Text>
        <Text style={styles.amount}>₹{amount}</Text>
      </View>
      <Image
        source={require("../../../assets/images/finances/profit.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#5DB0D7",
    borderRadius: 12,
    padding: 24,
    marginBottom: 10,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  image: {
    width: 60,
    height: 60,
  },
});

export default NetProfitCard;
