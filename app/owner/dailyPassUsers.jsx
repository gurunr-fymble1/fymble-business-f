import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import {
  getDailyPassPriceAPI,
  updateDailyPassPriceAPI,
} from "../../services/Api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
const { width, height } = Dimensions.get("window");
const DailyPassUsersPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const recommendedPrice = 90;
  const maxAllowedPrice = 199;

  const [isDailyPassEnabled, setIsDailyPassEnabled] = useState(false);
  const [finalPrice, setFinalPrice] = useState(recommendedPrice);
  const [pricingStrategy, setPricingStrategy] = useState("recommended");
  const [customPrice, setCustomPrice] = useState("");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isPriceSaved, setIsPriceSaved] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const insets = useSafeAreaInsets();

  const loadPriceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) return;

      const data = await getDailyPassPriceAPI(gymId);

      if (data && data.status === 200) {
        const isEnabled = data.dailypass_enabled === true;
        setIsDailyPassEnabled(isEnabled);

        const existingFinalPrice = parseInt(
          data.discount_price || data.price || 0,
          10,
        );

        if (existingFinalPrice > 0) {
          setFinalPrice(existingFinalPrice);
          setIsEditingPrice(false);
          setIsPriceSaved(true);

          if (existingFinalPrice === recommendedPrice) {
            setPricingStrategy("recommended");
            setCustomPrice("");
          } else {
            setPricingStrategy("custom");
            setCustomPrice(existingFinalPrice.toString());
          }
        } else {
          setPricingStrategy("recommended");
          setCustomPrice("");
          setFinalPrice(recommendedPrice);
          setIsEditingPrice(isEnabled);
          setIsPriceSaved(false);
        }
      }
    } catch (error) {
      console.error("Error loading price:", error);
    } finally {
      setIsLoading(false);
    }
  }, [recommendedPrice]);

  useEffect(() => {
    loadPriceData();
  }, [loadPriceData]);

  useEffect(() => {
    if (pricingStrategy === "custom") {
      setFinalPrice(customPrice ? parseInt(customPrice, 10) : 0);
    } else {
      setFinalPrice(recommendedPrice);
    }
  }, [pricingStrategy, customPrice, recommendedPrice]);

  const handleToggleDailyPass = async () => {
    const newState = !isDailyPassEnabled;
    setIsDailyPassEnabled(newState);

    if (newState) {
      setPricingStrategy("recommended");
      setCustomPrice("");
      setFinalPrice(recommendedPrice);
      setIsEditingPrice(true);
      setIsPriceSaved(false);
    } else {
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) return;

        const payload = {
          gym_id: gymId,
          dailypass_enabled: false,
          price: 0,
          discount_percentage: null,
          discount_price: null,
        };

        const data = await updateDailyPassPriceAPI(payload);

        if (data && data.status === 200) {
          showToast({
            type: "success",
            title: "Daily pass feature disabled",
          });
          setPricingStrategy("recommended");
          setCustomPrice("");
          setFinalPrice(recommendedPrice);
          setIsEditingPrice(false);
          setIsPriceSaved(false);
        } else {
          throw new Error("Failed to disable daily pass");
        }
      } catch (error) {
        console.error("Error disabling daily pass:", error);
        setIsDailyPassEnabled(!newState);
        showToast({
          type: "error",
          title: "Error disabling daily pass",
        });
      }
    }
  };

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setIsPriceSaved(false);
  };

  const handleCustomPriceChange = useCallback(
    (value) => {
      const onlyDigits = value.replace(/[^0-9]/g, "");
      if (!onlyDigits) {
        setCustomPrice("");
        return;
      }

      const numericValue = parseInt(onlyDigits, 10);
      if (numericValue > maxAllowedPrice) {
        Alert.alert("Error", `Maximum price allowed is ₹${maxAllowedPrice}`);
        return;
      }

      setCustomPrice(onlyDigits);
    },
    [maxAllowedPrice],
  );

  const handlePriceSave = async () => {
    if (!finalPrice || finalPrice <= 0) {
      showToast({
        type: "error",
        title: "Please enter a valid price",
      });
      return;
    }

    if (finalPrice > maxAllowedPrice) {
      showToast({
        type: "error",
        title: `Maximum price allowed is ₹${maxAllowedPrice}`,
      });
      return;
    }

    setIsSavingPrice(true);

    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Authentication error",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        dailypass_enabled: true,
        price: finalPrice,
        discount_percentage: null,
        discount_price: finalPrice,
      };

      const data = await updateDailyPassPriceAPI(payload);

      if (data && data.status === 200) {
        setIsEditingPrice(false);
        setIsPriceSaved(true);
        setIsDailyPassEnabled(true);
        showToast({
          type: "success",
          title: data.message || "Daily pass price updated successfully",
        });

        setTimeout(() => {
          loadPriceData();
          router.push("/owner/(sessions)/availableSessions");
        }, 500);
      } else {
        throw new Error("Failed to update price");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      showToast({
        type: "error",
        title: "Error updating price",
      });
    } finally {
      setIsSavingPrice(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Daily Pass Pricing"
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Loading daily pass details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Daily Pass Pricing"
      />

      <ScrollView
        style={styles.priceContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.priceScrollContent}
      >
        <View style={styles.toggleSection}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleTitle}>Daily Pass Booking</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isDailyPassEnabled && styles.toggleButtonActive,
            ]}
            onPress={handleToggleDailyPass}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.toggleCircle,
                isDailyPassEnabled && styles.toggleCircleActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {isDailyPassEnabled && (
          <>
            {!isEditingPrice && isPriceSaved ? (
              <>
                <TouchableOpacity
                  style={styles.finalPriceCardWrapper}
                  onPress={handlePriceEdit}
                  activeOpacity={0.7}
                >
                  <View style={styles.finalPriceCardBadges}>
                    <View style={styles.finalPriceBadgeSolid}>
                      <Text style={styles.finalPriceBadgeText}>
                        Final Price
                      </Text>
                    </View>
                  </View>

                  <View style={styles.finalPriceCard}>
                    <View style={styles.finalPriceContent}>
                      <View style={styles.finalPriceLeft}>
                        <Ionicons name="calendar" size={24} color="#007AFF" />
                        <Text style={styles.finalPriceLabel}>
                          Daily Pass Price
                        </Text>
                      </View>
                      <View style={styles.finalPriceRight}>
                        <Text style={styles.finalPriceAmountBlue}>
                          ₹{finalPrice}
                        </Text>
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <Image
                  source={require("../../assets/images/sessions/daily_pass.png")}
                  style={styles.dailypassImage}
                />

                {finalPrice > 90 ? (
                  <View style={styles.priceTipCard}>
                    <Text style={styles.priceTipTitle}>For more clients</Text>
                    <Text style={styles.priceTipText}>
                      Keep your daily pass at{" "}
                      <Text style={styles.priceTipHighlight}>₹90</Text> to
                      attract more walk-ins and become everyone's first choice.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.priceTipCard, styles.priceTipCardGreen]}>
                    <Text
                      style={[styles.priceTipTitle, styles.priceTipTitleGreen]}
                    >
                      Great Choice!
                    </Text>
                    <Text style={styles.priceTipText}>
                      Your price of{" "}
                      <Text style={styles.priceTipHighlightGreen}>
                        ₹{finalPrice}
                      </Text>{" "}
                      is perfect to attract walk-ins and grow your client base.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Select Pricing Strategy</Text>
                <View style={styles.pricingOptionsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.pricingOptionCard,
                      styles.pricingOptionCardRecommended,
                      { backgroundColor: "#EDFAF2", borderColor: "#E5E7EB" },
                      pricingStrategy === "recommended" &&
                        styles.pricingOptionCardSelected,
                    ]}
                    onPress={() => {
                      setPricingStrategy("recommended");
                      setCustomPrice("");
                    }}
                  >
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>
                        Recommended
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.pricingOptionAmount}>
                        ₹{recommendedPrice}
                        <Text style={styles.pricingPerDay}>/day</Text>
                      </Text>
                      <Text style={styles.pricingOptionSubtext}>
                        Most Popular
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pricingRadio,
                        pricingStrategy === "recommended" &&
                          styles.pricingRadioSelected,
                      ]}
                    >
                      {pricingStrategy === "recommended" && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.pricingOrRow}>
                  <View style={styles.pricingOrLine} />
                  <Text style={styles.pricingOrText}>OR</Text>
                  <View style={styles.pricingOrLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.customPricingCard,
                    pricingStrategy === "custom" &&
                      styles.pricingOptionCardSelected,
                  ]}
                  onPress={() => setPricingStrategy("custom")}
                  activeOpacity={0.9}
                >
                  <View style={styles.rupeeImage}>
                    <Image
                      source={require("../../assets/images/sessions/session_rs.png")}
                      style={{ width: 30, height: 30 }}
                    />
                  </View>
                  <View style={styles.customPricingLeft}>
                    <Text style={styles.customPricingTitle}>
                      Set Custom Price
                    </Text>
                    {pricingStrategy === "custom" && (
                      <View style={styles.customInputWrap}>
                        <Text style={styles.customInputCurrency}>₹</Text>
                        <TextInput
                          style={styles.customPriceInput}
                          placeholder="Enter amount"
                          placeholderTextColor="#9CA3AF"
                          value={customPrice}
                          onChangeText={handleCustomPriceChange}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.pricingRadio,
                      pricingStrategy === "custom" &&
                        styles.pricingRadioSelected,
                    ]}
                  >
                    {pricingStrategy === "custom" && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>

                <Text style={styles.selectedPriceText}>
                  Selected Price: ₹{finalPrice || 0}/day
                </Text>
                <Text style={styles.maxPriceHint}>
                  The Maximum Daily Pass price allowed is{" "}
                  <Text style={styles.maxPriceAmount}>₹{maxAllowedPrice}</Text>
                </Text>

                <View style={styles.priceButtonSection}>
                  <TouchableOpacity
                    style={[
                      styles.savePriceButtonWrapper,
                      (!finalPrice || finalPrice <= 0 || isSavingPrice) &&
                        styles.disabledSaveButton,
                    ]}
                    onPress={handlePriceSave}
                    disabled={!finalPrice || finalPrice <= 0 || isSavingPrice}
                    activeOpacity={0.8}
                  >
                    {isSavingPrice ? (
                      <View style={styles.saveButtonLoaderWrap}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={["#007BFF", "#007BFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.savePriceButton}
                      >
                        <Text style={styles.savePriceButtonText}>
                          Confirm Price
                        </Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  priceContainer: {
    flex: 1,
  },
  priceScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 150,
  },
  toggleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#007AFF",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  finalPriceCardWrapper: {
    marginBottom: 16,
    position: "relative",
  },
  finalPriceCardBadges: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: -8,
    zIndex: 2,
  },
  finalPriceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  finalPriceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  finalPriceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  finalPriceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  finalPriceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  finalPriceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  finalPriceAmountBlue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  finalPriceBadgeSolid: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    elevation: 2,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 6,
    marginBottom: 12,
  },
  pricingOptionsWrap: {
    gap: 10,
    marginBottom: 12,
  },
  pricingOptionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingOptionCardRecommended: {
    position: "relative",
  },
  pricingOptionCardSelected: {
    borderColor: "#A7CCFF",
    backgroundColor: "#F3F8FF",
  },
  recommendedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#22C55E",
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 3,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pricingOptionAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2A2A2A",
    lineHeight: 26,
  },
  pricingPerDay: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  pricingOptionSubtext: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
  pricingRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#60A5FA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pricingRadioSelected: {
    backgroundColor: "#1278FF",
    borderColor: "#1278FF",
  },
  pricingOrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    marginBottom: 16,
  },
  pricingOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  pricingOrText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  customPricingCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rupeeImage: {
    width: 40,
    height: 40,
    backgroundColor: "#F4F4F4",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  customPricingLeft: {
    flex: 1,
    marginRight: 12,
  },
  customPricingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  customInputWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: 150,
    paddingHorizontal: 10,
  },
  customInputCurrency: {
    fontSize: 16,
    color: "#9CA3AF",
    marginRight: 8,
  },
  customPriceInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#111827",
  },
  selectedPriceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  maxPriceHint: {
    fontSize: 12,
    color: "#474A48",
    marginBottom: 12,
    textAlign: "center",
  },
  maxPriceAmount: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  priceButtonSection: {
    paddingHorizontal: 0,
  },
  savePriceButtonWrapper: {
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#030A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  savePriceButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  savePriceButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  saveButtonLoaderWrap: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9CA3AF",
  },
  disabledSaveButton: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
  },
  dailypassImage: {
    width: width - 32,
    aspectRatio: 1.5,
    alignSelf: "center",
    marginTop: 40,
  },
  priceTipCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
  },
  priceTipCardGreen: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  priceTipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 6,
    textAlign: "center",
  },
  priceTipTitleGreen: {
    color: "#16A34A",
  },
  priceTipText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
  },
  priceTipHighlight: {
    fontWeight: "700",
    color: "#1F2937",
  },
  priceTipHighlightGreen: {
    fontWeight: "700",
    color: "#16A34A",
  },
});

export default DailyPassUsersPage;
