import {
  ActivityIndicator,
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { showToast } from "../../../utils/Toaster";
import { getToken } from "../../../utils/auth";
import axiosInstance from "../../../services/axiosInstance";
import { getDocumentPicsAPI } from "../../../services/Api";

const { width } = Dimensions.get("window");

const Document = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // State for documents
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: "Bank Document",
      subtitle: "Passbook / Cancelled Cheque / Account Statement",
      icon: "business-outline",
      image_url: null,
      key: "bank_document",
    },
    {
      id: 2,
      title: "PAN Card",
      subtitle: "Clear photo of your PAN Card",
      icon: "card-outline",
      image_url: null,
      key: "pan_card",
    },
  ]);

  const [showOptionsForId, setShowOptionsForId] = useState(null);

  // Fetch documents on component mount
  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [])
  );

  const fetchDocuments = async () => {
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

      const response = await getDocumentPicsAPI(gymId);

      if (response?.status === 200 && response?.data?.documents) {
        const fetchedDocs = response.data.documents;

        setDocuments((prev) =>
          prev.map((doc) => {
            const fetchedDoc = fetchedDocs.find((d) => d.key === doc.key);
            return {
              ...doc,
              image_url: fetchedDoc?.image_url || null,
            };
          })
        );
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to fetch documents",
      });
    } finally {
      setIsFetching(false);
    }
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
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForId(null);
        const document = documents.find((d) => d.id === id);
        if (document) {
          await handleUploadImage(result.assets[0], document);
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
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        setShowOptionsForId(null);
        const document = documents.find((d) => d.id === id);
        if (document) {
          await handleUploadImage(result.assets[0], document);
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to take photo",
      });
    }
  };

  const handleUploadClick = (document) => {
    // Toggle options visibility
    if (showOptionsForId === document.id) {
      setShowOptionsForId(null);
    } else {
      setShowOptionsForId(document.id);
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

  const handleUploadImage = async (imageAsset, document) => {
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
        "/owner_registration/document-upload",
        {
          params: {
            gym_id: gym_id,
            extension: extension,
            scope: document.key,
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
            "Failed to upload document after multiple attempts. Please try again.",
        });
        return;
      }

      // Step 3: Confirm upload with backend (with retry)
      let confirmSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!confirmSuccess && retryCount < maxRetries) {
        try {
          const res = await axiosInstance.post(
            "/owner_registration/document-confirm",
            {
              cdn_url,
              gym_id: gym_id,
              column_name: document.key,
            }
          );

          if (res?.status === 200) {
            confirmSuccess = true;
            // Update local state
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === document.id ? { ...d, image_url: cdn_url } : d
              )
            );
            showToast({
              type: "success",
              title: "Document uploaded successfully",
            });
          }
        } catch (confirmError) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          } else {
            throw confirmError;
          }
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to upload document. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.container}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text={"Documents"}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1EA1F3" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text={"Documents"}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#1EA1F3" />
          <Text style={styles.infoText}>
            Please upload clear images of your documents for smoother
            verification process.
          </Text>
        </View>

        {/* Documents List */}
        {documents.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            {/* Document Header with Icon */}
            <View style={styles.documentHeader}>
              <View style={styles.documentIconContainer}>
                <Ionicons name={document.icon} size={24} color="#1EA1F3" />
              </View>
              <View style={styles.documentTitleContainer}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentSubtitle}>{document.subtitle}</Text>
              </View>
              {document.image_url && (
                <View style={styles.uploadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}
            </View>

            <View style={styles.imageContainer}>
              {document.image_url ? (
                <Image
                  source={{ uri: document.image_url }}
                  style={styles.documentImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={48}
                    color="#999"
                  />
                  <Text style={styles.placeholderText}>Upload Photo</Text>
                </View>
              )}

              {/* Options Overlay - Shows when upload is clicked */}
              {showOptionsForId === document.id && (
                <View style={styles.optionsOverlay}>
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => selectImage(document.id)}
                    >
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color="#525252"
                      />
                      <Text style={styles.optionText}>Upload From Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => takePhoto(document.id)}
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
                showOptionsForId === document.id && styles.cancelButton,
                document.image_url &&
                  showOptionsForId !== document.id &&
                  styles.retakeButton,
              ]}
              onPress={() => handleUploadClick(document)}
            >
              <Text style={styles.uploadButtonText}>
                {showOptionsForId === document.id
                  ? "Cancel"
                  : document.image_url
                  ? "Retake"
                  : "Upload"}
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
            <Text style={styles.uploadingText}>Uploading document...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Document;

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
  documentCard: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  documentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentTitleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  documentSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  uploadedBadge: {
    marginLeft: 8,
  },
  imageContainer: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
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
