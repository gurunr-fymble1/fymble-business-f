import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const EarnBadge = memo(({ amount, index }) => (
  <View
    style={[
      styles.earnBadge,
      index === 0
        ? styles.earnBadgeTop
        : index === 1
          ? styles.earnBadgeMid
          : styles.earnBadgeBottom,
    ]}
  >
    <Text style={styles.earnBadgeIcon}>
      {index === 0 ? "🔥" : index === 1 ? "💰" : "⭐"}
    </Text>
    <Text style={styles.earnBadgeText}>Earn ₹{amount} More</Text>
  </View>
));

const PtPackCard = memo(({ item, index }) => {
  const potentialRevenue = item.ownerPerSession * 30;

  return (
    <View style={styles.card}>
      {item.earnMore > 0 && <EarnBadge amount={item.earnMore} index={index} />}
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <Text style={styles.passLabel}>{item.label}</Text>
          <View style={styles.revenueRow}>
            <Ionicons name="trending-up" size={13} color="#38A169" />
            <Text style={styles.revenueText}>
              Potential Monthly Revenue{" "}
              <Text style={styles.revenueAmount}>₹{potentialRevenue}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.priceText}>₹{item.packTotal}</Text>
          {item.extraPercent > 0 && (
            <Text style={styles.extraText}>+{item.extraPercent}% Extra</Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "visible",
    position: "relative",
  },
  earnBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 10,
    marginBottom: 2,
    position: "absolute",
    zIndex: 1,
    top: -10,
  },
  earnBadgeTop: {
    backgroundColor: "#00A63E",
  },
  earnBadgeMid: {
    backgroundColor: "#FF4C14",
  },
  earnBadgeBottom: {
    backgroundColor: "#ECA101",
  },
  earnBadgeIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  earnBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  passLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 4,
  },
  revenueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueText: {
    fontSize: 10,
    color: "#8A8A99",
    marginLeft: 3,
    fontWeight: "500",
  },
  revenueAmount: {
    fontWeight: "700",
    color: "#38A169",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D3748",
  },
  extraText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#38A169",
    marginTop: 2,
  },
});

export default PtPackCard;
