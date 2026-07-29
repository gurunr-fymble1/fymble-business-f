// components/ReceiptsCard.js
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const ReceiptsCard = ({ count, newCount, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../../assets/images/finances/receipt.png")}
            style={styles.receiptIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>{count} Receipts</Text>
          <Text style={styles.subtitle}>Excluding Daily Gym Pass</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={28} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  receiptIcon: {
    width: 41,
    height: 40,
    opacity: 0.7,
  },
  textContent: {
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#006FAD",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
});

export default ReceiptsCard;
