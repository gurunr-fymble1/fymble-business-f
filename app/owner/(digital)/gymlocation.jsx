import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "../../../utils/Toaster";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { getToken } from "../../../utils/auth";
import {
  getGymLocationPresignedAPI,
  saveGymLocationWithImageAPI,
} from "../../../services/Api";
import * as Location from "expo-location";
import ViewShot from "react-native-view-shot";
import * as ImagePicker from "expo-image-picker";
import { Camera, CameraView } from "expo-camera";

const { width, height } = Dimensions.get("window");

const GymLocation = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef(null);
  const cameraRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [finalImageUri, setFinalImageUri] = useState(null); // Image with timestamp
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // CDN URL after upload
  const [timestamp, setTimestamp] = useState("");
  const [locationText, setLocationText] = useState("Fetching location...");
  const [locationCoords, setLocationCoords] = useState(null);
  const [mode, setMode] = useState(null); // null = selection, 'camera' = camera, 'gallery' = gallery
  const [facing, setFacing] = useState("back");
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Update timestamp every second
  useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      const day = now.getDate();
      const month = now.toLocaleString("en-US", { month: "short" });
      const year = now.getFullYear();
      const time = now.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setTimestamp(`${day} ${month} ${year}, ${time}`);
    };

    updateTimestamp();
    const interval = setInterval(updateTimestamp, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationText("Location permission denied");
        showToast({
          type: "error",
          title: "Location permission is required to set your gym's location.",
        });
        return;
      }

      if (Platform.OS === "ios") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      let location = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!location && attempts < maxAttempts) {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? Location.LocationAccuracy.High
                : Location.LocationAccuracy.Best,
            maximumAge: 10000,
            timeout: 10000,
          });
          break;
        } catch (locationError) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            throw locationError;
          }
        }
      }

      if (location) {
        setLocationCoords(location.coords);

        // Reverse geocode to get address
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          // Build address without house number
          const parts = [];

          if (address.street) parts.push(address.street);
          if (address.district) parts.push(address.district);
          if (address.city) parts.push(address.city);
          if (address.region) parts.push(address.region);
          if (address.postalCode) parts.push(address.postalCode);
          if (address.country) parts.push(address.country);

          const fullAddress = parts.join(", ");
          setLocationText(fullAddress || "Location captured");
        } else {
          setLocationText("Location captured");
        }
      }
    } catch (error) {
      console.error("Location error:", error);
      setLocationText("Unable to get location");
      showToast({
        type: "error",
        title: "Could not get your current location. Please try again.",
      });
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      setCapturedImage(photo.uri);
    } catch (error) {
      console.error("Camera capture error:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant gallery access to upload photos.",
        );
        setMode(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      } else {
        setMode(null);
      }
    } catch (error) {
      console.error("Gallery picker error:", error);
      Alert.alert("Error", "Failed to pick image from gallery.");
      setMode(null);
    }
  };

  const handleSelectMode = async (selectedMode) => {
    if (selectedMode === "gallery") {
      setMode(selectedMode);
      pickImageFromGallery();
    } else if (selectedMode === "camera") {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(status === "granted");
        setMode(selectedMode);
      } catch (error) {
        console.error("Camera permission error:", error);
        Alert.alert("Error", "Failed to access camera permissions.");
      }
    }
  };

  const captureWithTimestamp = async () => {
    if (!viewShotRef.current) return;

    setIsCapturing(true);
    try {
      const uri = await viewShotRef.current.capture();
      setFinalImageUri(uri);

      // Upload image and get CDN URL
      await uploadImageAndGetUrl(uri);
    } catch (error) {
      console.error("ViewShot capture error:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadToS3WithRetry = async (url, formData, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const s3Resp = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (s3Resp.status === 204 || s3Resp.status === 201) {
          return { success: true, response: s3Resp };
        }

        lastError = new Error(`Upload failed with status: ${s3Resp.status}`);
      } catch (error) {
        lastError = error;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000),
        );
      }
    }
    return { success: false, error: lastError };
  };

  const uploadImageAndGetUrl = async (imageUri) => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      // Get presigned URL from backend
      const presignedRes = await getGymLocationPresignedAPI(gymId, "jpg");

      if (presignedRes?.status !== 200) {
        throw new Error("Failed to get upload URL");
      }

      const { upload, cdn_url } = presignedRes.data;

      // Create FormData for S3 upload
      const formData = new FormData();
      Object.keys(upload.fields).forEach((key) => {
        formData.append(key, upload.fields[key]);
      });
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "location.jpg",
      });

      // Upload to S3 with retry
      const uploadResult = await uploadToS3WithRetry(upload.url, formData, 3);

      if (!uploadResult.success) {
        showToast({
          type: "error",
          title:
            "Failed to upload image after multiple attempts. Please try again.",
        });
        return;
      }

      // Store the CDN URL
      setUploadedImageUrl(cdn_url);
    } catch (error) {
      console.error("Upload error:", error);
      showToast({
        type: "error",
        title: error?.message || "Failed to upload image. Please try again.",
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!locationCoords) {
      showToast({
        type: "error",
        title: "Location is required. Please try again.",
      });
      return;
    }

    if (!uploadedImageUrl) {
      showToast({
        type: "error",
        title: "Image upload is in progress. Please wait...",
      });
      return;
    }

    setLoading(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        setLoading(false);
        return;
      }

      // Save location data with gym_pic_url
      const payload = {
        gym_id: gymId,
        latitude: locationCoords.latitude,
        longitude: locationCoords.longitude,
        gym_pic_url: uploadedImageUrl,
      };

      const saveRes = await saveGymLocationWithImageAPI(payload);

      if (saveRes?.status === 200) {
        showToast({
          type: "success",
          title:
            "Gym location saved successfully! Your gym will now be listed on the Fymble App.",
        });
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        throw new Error(saveRes?.message || "Failed to save gym location");
      }
    } catch (error) {
      console.error("Save location error:", error);
      showToast({
        type: "error",
        title:
          error?.message || "Failed to save gym location. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setFinalImageUri(null);
    setUploadedImageUrl(null);
    setMode(null);
  };

  const handleConfirmLocation = async () => {
    await handleSaveLocation();
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Confirmation screen - show when final image with timestamp is ready
  if (finalImageUri) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <NewOwnerHeader
          onBackButtonPress={handleRetake}
          text="Confirm Location"
        />

        <ScrollView
          style={styles.confirmContainer}
          contentContainerStyle={styles.confirmScrollContent}
          bounces={false}
        >
          {/* Image Preview */}
          <View style={styles.confirmImageContainer}>
            <Image
              source={{ uri: finalImageUri }}
              style={styles.confirmImage}
              resizeMode="contain"
            />
          </View>

          {/* Location Details */}
          <View style={styles.confirmDetailsCard}>
            <View style={styles.confirmDetailRow}>
              <Ionicons name="location" size={20} color="#0154A0" />
              <View style={styles.confirmDetailContent}>
                <Text style={styles.confirmDetailLabel}>Address</Text>
                <Text style={styles.confirmDetailValue}>{locationText}</Text>
              </View>
            </View>

            {locationCoords && (
              <>
                <View style={styles.confirmDivider} />

                <View style={styles.confirmDetailRow}>
                  <Ionicons name="navigate" size={20} color="#0154A0" />
                  <View style={styles.confirmDetailContent}>
                    <Text style={styles.confirmDetailLabel}>Coordinates</Text>
                    <Text style={styles.confirmDetailValue}>
                      {locationCoords.latitude.toFixed(6)},{" "}
                      {locationCoords.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.confirmActions,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <TouchableOpacity
              style={styles.confirmRetakeButton}
              onPress={handleRetake}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.confirmRetakeText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
              disabled={loading || isCapturing || !uploadedImageUrl}
            >
              {loading || isCapturing ? (
                <ActivityIndicator color="#fff" />
              ) : !uploadedImageUrl ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.confirmButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirm Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mode selection screen
  if (!mode && !capturedImage) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Gym Location"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Location Status */}
          <View style={styles.locationStatusCard}>
            <View style={styles.locationStatusHeader}>
              <Ionicons name="navigate-circle" size={24} color="#22c55e" />
              <Text style={styles.locationStatusTitle}>Location Status</Text>
            </View>
            <View style={styles.locationStatusContent}>
              <Text style={styles.locationLabel}>Current Location:</Text>
              <Text style={styles.locationValue}>{locationText}</Text>
              {locationCoords && (
                <View style={styles.coordsContainer}>
                  <Text style={styles.coordsText}>
                    Lat: {locationCoords.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.coordsText}>
                    Lng: {locationCoords.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Upload Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Photo Source</Text>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleSelectMode("camera")}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={32} color="#0154A0" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDescription}>
                  Use camera to capture your gym.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.description}>
              Upload a photo of your gym. This information will be used to list
              your gym on the Fymble App's{" "}
              <Text style={styles.boldText}>Fitness Studios</Text> page,
              allowing clients to discover your gym, book memberships, daily
              passes, and sessions, and easily{" "}
              <Text style={styles.boldText}> reach your location.</Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Camera permission denied
  if (mode === "camera" && cameraPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Gym Location"
        />
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to capture your gym's location photo.
          </Text>
          <TouchableOpacity
            onPress={() => handleSelectMode("camera")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode(null)}
          >
            <Text style={styles.backButtonText}>Back to Options</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show captured image preview
  if (capturedImage) {
    return (
      <View style={styles.captureContainer}>
        {/* Preview Image with Timestamp */}
        <View style={styles.previewArea}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 0.9 }}
            style={styles.viewShot}
          >
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
            />
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>
                {timestamp} | {locationText}
              </Text>
            </View>
          </ViewShot>
        </View>

        {/* Bottom Buttons */}
        <View
          style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
        >
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.usePhotoButton}
            onPress={captureWithTimestamp}
            disabled={isCapturing || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.buttonText}>Save Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Gallery mode - show loading while picker is open
  if (mode === "gallery") {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Gym Location"
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0154A0" />
          <Text style={styles.loadingText}>Opening gallery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  if (mode === "camera" && cameraPermission === true) {
    return (
      <View style={styles.captureContainer}>
        {/* Camera */}
        <View style={styles.cameraArea}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mirror={facing === "front"}
          />
          {/* Timestamp overlay on camera */}
          <View style={styles.timestampBadge}>
            <Text style={styles.timestampText}>
              {timestamp} | {locationText}
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View
          style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
        >
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  infoSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FBFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F2FC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "600",
    color: "#0154A0",
  },
  locationStatusCard: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  locationStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  locationStatusContent: {
    padding: 16,
  },
  locationLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    marginBottom: 8,
  },
  coordsContainer: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  coordsText: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F8FBFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  noteCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#0369A1",
    lineHeight: 20,
    marginLeft: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#666",
    marginTop: 16,
    fontSize: 14,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: "#0154A0",
    fontSize: 14,
    fontWeight: "500",
  },
  captureContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraArea: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  previewArea: {
    flex: 1,
    position: "relative",
  },
  viewShot: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  timestampBadge: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timestampText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1f2937",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  placeholderButton: {
    width: 56,
    height: 56,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6b7280",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  usePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Confirmation Screen Styles
  confirmContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  confirmScrollContent: {
    flexGrow: 1,
  },
  confirmImageContainer: {
    backgroundColor: "#000",
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmImage: {
    width: "100%",
    height: "100%",
  },
  confirmDetailsCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  confirmDetailContent: {
    flex: 1,
    marginLeft: 12,
  },
  confirmDetailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  confirmDetailValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    lineHeight: 20,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  confirmInfoCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  confirmInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    lineHeight: 20,
    marginLeft: 10,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  confirmRetakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  confirmRetakeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default GymLocation;
