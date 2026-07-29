import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";
import { getBiometricInterestPicsAPI } from "../../services/Api";

const { width } = Dimensions.get("window");

const BiometricRequest = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionsForSlot, setShowOptionsForSlot] = useState(null);

  // State for 6 door pictures
  const [doorPictures, setDoorPictures] = useState([
    { id: 1, uri: null, key: "pic_1" },
    { id: 2, uri: null, key: "pic_2" },
    { id: 3, uri: null, key: "pic_3" },
    { id: 4, uri: null, key: "pic_4" },
    { id: 5, uri: null, key: "pic_5" },
    { id: 6, uri: null, key: "pic_6" },
  ]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/owner/biometric");
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    fetchBiometricPics();
  }, []);

  const fetchBiometricPics = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        return;
      }
      const response = await getBiometricInterestPicsAPI(gymId);
      if (response?.status === 200 && response?.data?.pics) {
        // Map the response pics to the doorPictures state
        const updatedPictures = doorPictures.map((picture) => {
          const matchingPic = response.data.pics.find((p) => p.key === picture.key);
          if (matchingPic) {
            return {
              ...picture,
              uri: matchingPic.url,
              cdn_url: matchingPic.url,
            };
          }
          return picture;
        });
        setDoorPictures(updatedPictures);
      }
    } catch (error) {
      console.error("Error fetching biometric pics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePress = (id) => {
    if (showOptionsForSlot === id) {
      setShowOptionsForSlot(null);
    } else {
      setShowOptionsForSlot(id);
    }
  };

  const selectImage = async (id) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your photo library to upload images.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForSlot(null);
        const picture = doorPictures.find((p) => p.id === id);
        if (picture) {
          await handleUploadImage(result.assets[0], picture);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to select Image",
      });
    }
  };

  const takePhoto = async (id) => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast({
          type: "error",
          title: "Please allow access to your camera to take photos.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForSlot(null);
        const picture = doorPictures.find((p) => p.id === id);
        if (picture) {
          await handleUploadImage(result.assets[0], picture);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to take photo",
      });
    }
  };

  // Helper function to upload to S3 with retry
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
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
    return { success: false, error: lastError };
  };

  const handleUploadImage = async (imageAsset, picture) => {
    setIsLoading(true);
    try {
      const imageUri = imageAsset.uri;
      const uriParts = imageUri?.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const extension =
        fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : "";

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({
          type: "error",
          title: "Gym ID not found",
        });
        return;
      }

      // Step 1: Get upload URL from backend
      const { data: uploadResp } = await axiosInstance.get(
        "/biometric_interest/upload-url",
        {
          params: {
            gym_id: gym_id,
            extension: extension,
            scope: picture.key,
          },
        }
      );

      const { upload, cdn_url } = uploadResp.data;
      const form = new FormData();
      Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v));
      const contentType = upload.fields["Content-Type"];

      form.append("file", {
        uri: imageUri,
        name: upload.fields.key.split("/").pop(),
        type: contentType,
      });

      // Step 2: Upload to S3 with retry
      const uploadResult = await uploadToS3WithRetry(upload.url, form, 3);

      if (!uploadResult.success) {
        showToast({
          type: "error",
          title: "Failed to upload image after multiple attempts. Please try again.",
        });
        return;
      }

      // Step 3: Confirm upload with backend
      const res = await axiosInstance.post("/biometric_interest/confirm", {
        cdn_url,
        gym_id: gym_id,
        column_name: picture.key,
      });

      if (res?.status === 200) {
        // Update local state with uploaded image
        setDoorPictures((prev) =>
          prev.map((p) =>
            p.id === picture.id ? { ...p, uri: imageUri, cdn_url } : p
          )
        );
        showToast({
          type: "success",
          title: "Image uploaded successfully",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to upload image. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = (id) => {
    setShowOptionsForSlot(id);
  };

  const handleSubmit = () => {
    const uploadedCount = doorPictures.filter((p) => p.uri !== null).length;

    if (uploadedCount === 0) {
      showToast({
        type: "error",
        title: "Please upload at least one door picture",
      });
      return;
    }

    showToast({
      type: "success",
      title: `Request submitted with ${uploadedCount} picture(s)`,
    });

    // Navigate back or to confirmation page
    router.push("/owner/biometric");
  };

  const renderUploadSlot = (picture) => {
    const hasImage = picture.uri !== null;
    const isShowingOptions = showOptionsForSlot === picture.id;

    return (
      <View key={picture.id} style={styles.uploadSlot}>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handleImagePress(picture.id)}
          activeOpacity={0.7}
        >
          {hasImage ? (
            <>
              <Image
                source={{ uri: picture.uri }}
                style={styles.uploadedImage}
              />

              {/* Options Overlay */}
              {isShowingOptions && (
                <View style={styles.optionsOverlay}>
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => selectImage(picture.id)}
                    >
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.optionText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => takePhoto(picture.id)}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.optionText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.placeholderIcon}>
                <Ionicons name="image-outline" size={40} color="#BDBDBD" />
                <View style={styles.addIconBadge}>
                  <Ionicons name="add" size={16} color="#BDBDBD" />
                </View>
              </View>

              {/* Options Overlay for empty slot */}
              {isShowingOptions && (
                <View style={styles.optionsOverlay}>
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => selectImage(picture.id)}
                    >
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.optionText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => takePhoto(picture.id)}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.optionText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.uploadText}>
          {hasImage && !isShowingOptions ? (
            <Text
              style={styles.retakeText}
              onPress={() => handleRetake(picture.id)}
            >
              Retake
            </Text>
          ) : (
            "+Upload Your Door Picture"
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NewOwnerHeader
        text="Request for Biometric"
        onBackButtonPress={() => router.push("/owner/biometric")}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Upload Grid */}
          <View style={styles.uploadGrid}>
            {doorPictures.map((picture) => renderUploadSlot(picture))}
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BiometricRequest;

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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  uploadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  uploadSlot: {
    width: "48%",
    marginBottom: 24,
  },
  uploadBox: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  placeholderIcon: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  addIconBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BDBDBD",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadText: {
    fontSize: 12,
    color: "#007BFF",
    textAlign: "center",
    marginTop: 8,
  },
  retakeText: {
    fontSize: 12,
    color: "#FF5757",
    fontWeight: "600",
  },
  optionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    width: "90%",
    overflow: "hidden",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    marginVertical: 4,
    borderRadius: 8,
    justifyContent: "center",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  infoHighlight: {
    color: "#007BFF",
    fontWeight: "600",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  uploadingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
