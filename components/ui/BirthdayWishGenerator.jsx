import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { getToken } from "../../utils/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const BirthdayWishGenerator = ({ client, onClose }) => {
  const viewShotRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [isGenerating, setIsGenerating] = useState(false);
  const [gymName, setGymName] = useState("");

  useEffect(() => {
    loadGymName();
  }, []);

  const loadGymName = async () => {
    try {
      const name = await getToken("gym_name");
      setGymName(name);
    } catch (error) {
      console.error("Error loading gym name:", error);
    }
  };

  const captureAndShare = async () => {
    try {
      setIsGenerating(true);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device",
        );
        setIsGenerating(false);
        return;
      }

      // Capture the view`
      const uri = await viewShotRef.current.capture();

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Birthday Wish for ${client.name}`,
      });

      setIsGenerating(false);
    } catch (error) {
      console.error("Error capturing/sharing:", error);
      Alert.alert("Error", "Failed to generate birthday wish image");
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="chevron-back" size={24} color="#00000" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Birthday Wish</Text>
            <Text style={styles.headerSubtitle}>for {client.name}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.previewContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1.0 }}
            style={styles.birthdayCard}
          >
            <Image
              source={require("../../assets/images/bday_image.png")}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.textOverlay}>
              <Text style={styles.wishingText}>Wishing You a very</Text>
              <Text style={styles.happyText}>Happy</Text>
              <Text style={styles.birthdayText}>Birthday</Text>
              <Text style={styles.nameText}>{client.name}</Text>
              <Text style={styles.teamText}>{gymName}</Text>
              <Text style={styles.websiteText}>www.fymble.app</Text>
            </View>
          </ViewShot>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.shareButton, isGenerating && styles.buttonDisabled]}
            onPress={captureAndShare}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButtonGradient}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="share-social" size={24} color="white" />
                  <Text style={styles.shareButtonText}>
                    Share Birthday Wish
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    fontWeight: "400",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  birthdayCard: {
    width: width - 32,
    height: (width - 32) * 1.4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  textOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  wishingText: {
    fontSize: 24,
    fontFamily: "Pacifico_400Regular",
    color: "#ffbf50",
    marginBottom: 0,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  happyText: {
    fontSize: 55,
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: -8,
  },
  birthdayText: {
    fontSize: 55,
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 15,
  },
  nameText: {
    fontSize: 36,
    fontFamily: "Pacifico_400Regular",
    color: "#ffffff",
    marginBottom: 40,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  teamText: {
    fontSize: 18,
    fontFamily: "Roboto_400Regular",
    color: "#ffbf50",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  websiteText: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#ffbf50",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionContainer: {
    paddingVertical: 20,
  },
  shareButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 12,
  },
  shareButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default BirthdayWishGenerator;
