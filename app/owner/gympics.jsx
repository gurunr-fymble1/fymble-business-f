import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState, useCallback } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { showToast } from "../../utils/Toaster";
import { getGymPicsAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";

const { width } = Dimensions.get("window");

const GymPics = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // State for gym pictures
  const [gymPictures, setGymPictures] = useState([]);

  const [showOptionsForId, setShowOptionsForId] = useState(null);

  // Fetch gym pictures on component mount
  useFocusEffect(
    useCallback(() => {
      fetchGymPictures();
    }, [])
  );

  const fetchGymPictures = async () => {
    try {
      setIsFetching(true);
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym ID is not available",
        });
        return;
      }

      const response = await getGymPicsAPI(gymId);

      if (response?.status === 200 && response?.data?.photos) {
        const formattedPictures = response.data.photos.map((photo) => ({
          id: photo.id,
          title: photo.title || formatTitle(photo.key),
          image_url: photo.image_url,
          is_sample: photo.is_sample,
          key: photo.key,
        }));
        setGymPictures(formattedPictures);
      } else {
        showToast({
          type: "error",
          title: response?.message || "Failed to fetch gym pictures",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to fetch gym pictures",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const formatTitle = (key) => {
    // Convert key like "machinery_1" to "Machinery 1"
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleImagePress = (id) => {
    if (showOptionsForId === id) {
      setShowOptionsForId(null);
    } else {
      setShowOptionsForId(id);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForId(null);
        const picture = gymPictures.find((p) => p.id === id);
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
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForId(null);
        const picture = gymPictures.find((p) => p.id === id);
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

  const handleUploadClick = (picture) => {
    // Toggle options visibility
    if (showOptionsForId === picture.id) {
      setShowOptionsForId(null);
    } else {
      setShowOptionsForId(picture.id);
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
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
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
        "/gym_onboarding_pics/upload-url",
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
          title:
            "Failed to upload image after multiple attempts. Please try again.",
        });
        return;
      }

      // Step 3: Confirm upload with backend
      const res = await axiosInstance.post("/gym_onboarding_pics/confirm", {
        cdn_url,
        gym_id: gym_id,
        column_name: picture.key,
      });

      if (res?.status === 200) {
        await fetchGymPictures();
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

  if (isFetching) {
    return (
      <View style={styles.container}>
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"My Gym Pictures"}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1EA1F3" />
          <Text style={styles.loadingText}>Loading gym pictures...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"My Gym Pictures"}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Header */}
        <View style={styles.infoHeader}>
          <Text style={styles.infoHeaderText}>
            <Ionicons name="flame" size={16} color="#FF5722" /> Upload HD Photos
            = More Visibility{"\n"}More Members, More Sales{" "}
            <Ionicons name="rocket" size={16} color="#FF5757" />
          </Text>
        </View>
        {gymPictures.filter((p) => !p.is_sample).length < 3 && (
          <Text style={styles.minPhotoText}>
            Minimum 3 photos should be uploaded
          </Text>
        )}

        {/* Gym Pictures List */}
        {gymPictures.map((picture) => (
          <View key={picture.id} style={styles.pictureCard}>
            <Text style={styles.pictureTitle}>{picture.title}</Text>

            <View style={styles.imageContainer}>
              <Image
                source={{ uri: picture.image_url }}
                style={styles.gymImage}
                contentFit="cover"
              />

              {/* Overlay for sample images */}
              {picture.is_sample && showOptionsForId !== picture.id && (
                <TouchableOpacity
                  style={styles.sampleOverlay}
                  onPress={() => handleUploadClick(picture)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sampleBadge}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.sampleBadgeText}>
                      Upload Your Photo
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Options Overlay - Shows when upload is clicked on sample or retake is clicked */}
              {showOptionsForId === picture.id && (
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
                      <Text style={styles.optionText}>Upload From Gallery</Text>
                    </TouchableOpacity>

                    {/* <View style={styles.optionDivider} /> */}

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
            </View>

            {/* Upload/Retake Button */}
            <TouchableOpacity
              style={[
                styles.uploadButton,
                showOptionsForId === picture.id && styles.cancelButton,
                !picture.is_sample &&
                  showOptionsForId !== picture.id &&
                  styles.retakeButton,
              ]}
              onPress={() => handleUploadClick(picture)}
            >
              <Text style={styles.uploadButtonText}>
                {showOptionsForId === picture.id
                  ? "Cancel"
                  : picture.is_sample
                  ? "Upload"
                  : "Retake"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color="#1EA1F3" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default GymPics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingHorizontal: 10,
  },
  infoHeader: {
    backgroundColor: "rgba(0, 123, 255, 0.08)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  infoHeaderText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  minPhotoText: {
    fontSize: 13,
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    lineHeight: 18,
  },
  pictureCard: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pictureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  imageContainer: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  gymImage: {
    width: "100%",
    height: "100%",
  },
  sampleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  sampleBadge: {
    backgroundColor: "rgba(0, 123, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sampleBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  retakeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 87, 87, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retakeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FF5757",
  },
  retakeButton: {
    backgroundColor: "#FF5757",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
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
    // backgroundColor: "#fff",
    width: "80%",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
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
