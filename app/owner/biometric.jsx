import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from "react-native";
import React, { useEffect, useState } from "react";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getBiometricInterest } from "../../services/Api";
import { getToken } from "../../utils/auth";

const { width } = Dimensions.get("window");

const Biometric = () => {
  const router = useRouter();
  const [interest, setInterest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/owner/earnings");
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    fetchBiometricInterest();
  }, []);

  const fetchBiometricInterest = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        return;
      }
      const response = await getBiometricInterest(gymId);
      if (response?.status === 200) {
        setInterest(response?.interest);
      }
    } catch (error) {
      console.error("Error fetching biometric interest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Cloud Based Data Security & Privacy",
    "No fake or proxy attendance",
    "Exact entry & exit timings",
    "Auto-block access for expired memberships",
    "Attendance synced with Fymble Business App",
  ];

  const handleInterested = () => {
    router.push("/owner/biometric-request");
  };

  return (
    <View style={styles.container}>
      <NewOwnerHeader
        text="Biometric Machine"
        onBackButtonPress={() => router.push("/owner/earnings")}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/bio.png")}
              style={styles.biometricImage}
              resizeMode="contain"
            />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Upgrade from GPS to Biomax Biometric EM Door Machine and manage
              your gym with higher security and accuracy.
            </Text>
          </View>

          {/* What you get Section */}
          <View style={styles.sectionHeaderCard}>
            <Text style={styles.sectionHeaderText}>What you get:</Text>
          </View>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.checkIcon}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Section */}
          <View style={styles.sectionHeaderCard}>
            <Text style={styles.sectionHeaderText}>Pricing:</Text>
          </View>
          <View style={styles.pricingContentContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>Price Varies From </Text>
              <Text style={styles.priceAmount}>₹16,500</Text>
              <Text style={styles.priceText}> to </Text>
              <Text style={styles.priceAmount}>
                ₹20,000<Text style={{ color: "#FF5757" }}> *</Text>
              </Text>
            </View>
            <Text style={styles.priceNote}>
              <Text style={{ color: "#FF5757" }}> * </Text>Price will Vary based
              on door type of the gym.
            </Text>
          </View>

          {/* Interest Message */}
          {interest === true && (
            <View style={styles.interestMessageContainer}>
              <Text style={styles.interestMessageText}>
                You have shown the interest. Our team will get back to you.
              </Text>
            </View>
          )}

          {/* Button */}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleInterested}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>
                {interest === false
                  ? "Request for Biometric"
                  : "Modify Door Images"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Biometric;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 0,
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 0,
  },
  biometricImage: {
    width: width,
    height: 151,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  specsList: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
  },
  specRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  specLabel: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "700",
    marginLeft: 4,
  },
  descriptionContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 12,
    color: "#333",
    lineHeight: 20,
    textAlign: "center",
  },
  sectionHeaderCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  featuresContainer: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 167, 69, 0.10)",
    padding: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#333",
    flex: 1,
  },
  pricingContentContainer: {
    marginBottom: 10,
  },
  pricingContainer: {
    marginBottom: 14,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  priceText: {
    fontSize: 13,
    color: "#333",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  priceNote: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    marginVertical: 10,
  },
  gradientButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  interestMessageContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  interestMessageText: {
    fontSize: 13,
    color: "#2E7D32",
    textAlign: "center",
    fontWeight: "500",
  },
});
