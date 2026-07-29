import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PlanDurationCard = memo(({ label, price, onPress, disabled = false }) => {
  const hasPrice = price && price > 0;

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rightSection}>
        <View style={[styles.priceWrapper, hasPrice && styles.priceWrapperSet]}>
          <Text style={styles.currencySymbol}>&#8377;</Text>
          {hasPrice && <Text style={styles.priceText}>{price}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    minWidth: 60,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  priceWrapperSet: {
    backgroundColor: "#F0F0F0",
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
    marginLeft: 2,
  },
});

export default PlanDurationCard;
