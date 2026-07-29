import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BirthdayWishGenerator from "../../components/ui/BirthdayWishGenerator";

const { width, height } = Dimensions.get("window");

const BirthdayClientsPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [selectedClient, setSelectedClient] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Parse the bdayClients from params
  const bdayClients = params.bdayClients ? JSON.parse(params.bdayClients) : [];

  const handleSendWish = (client) => {
    setSelectedClient(client);
    setShowGenerator(true);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    setSelectedClient(null);
  };

  const renderClientItem = ({ item }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={["#FF5757", "#FF5757"]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientPhone}>{item.mobile_number}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.wishButton}
        onPress={() => handleSendWish(item)}
      >
        <LinearGradient
          colors={["#FF5757", "#FF5757"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.wishButtonGradient}
        >
          <Ionicons name="gift" size={18} color="white" />
          <Text style={styles.wishButtonText}>Send Wish</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={60} color="#FFD700" />
      </View>
      <Text style={styles.emptyTitle}>No Birthdays Today</Text>
      <Text style={styles.emptySubtitle}>
        Check back tomorrow to celebrate with your clients!
      </Text>
    </View>
  );

  if (showGenerator && selectedClient) {
    return (
      <BirthdayWishGenerator
        client={selectedClient}
        onClose={handleCloseGenerator}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF"].reverse()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🎉 Today's Birthdays</Text>
            <Text style={styles.headerSubtitle}>
              {bdayClients.length}{" "}
              {bdayClients.length === 1 ? "client" : "clients"} celebrating
              today
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        <FlatList
          data={bdayClients}
          keyExtractor={(item, index) => `${item.mobile_number}-${index}`}
          renderItem={renderClientItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            bdayClients.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.7)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  clientCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: "#666",
  },
  wishButton: {
    marginLeft: 12,
  },
  wishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  wishButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});

export default BirthdayClientsPage;
