import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Badge from "./Badge";
import { Ionicons } from "@expo/vector-icons";

const ClientItem = React.memo(({ client }) => {
  return (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client?.name}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.contactRow}>
          <Ionicons style={styles.contactIcon} name="call" />
          <Text style={styles.contactText}>{client?.phone}</Text>
        </View>

        <View style={styles.badgeContainer}>
          <View style={styles.availabilityBadge}>
            <Ionicons style={styles.availabilityIcon} name="time-outline" />
            <Text style={styles.availabilityText}>{client?.joined_date}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

ClientItem.displayName = "ClientItem";

const styles = StyleSheet.create({
  clientCard: {
    flexDirection: "column",
    justifyContent: "space-between",
    // alignItems: 'flex-end',
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: "#666",
  },
  contactText: {
    color: "#666",
    fontSize: 12,
  },
  badgeContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    // backgroundColor: 'pink',
  },
  availabilityIcon: {
    // width: 16,
    // height: 16,
    marginRight: 4,
    tintColor: "#666",
  },
  availabilityText: {
    color: "#666",
    fontSize: 12,
  },
  detailsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default ClientItem;
