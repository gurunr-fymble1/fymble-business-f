import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Swiper from "react-native-swiper";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import ImageUploadModal from "../../components/gymPlansPage/ImageUploadModal";
import { FullImageModal } from "../../components/profile/FullImageModal";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import {
  // Existing brochure APIs
  confirmBrochureUpload,
  deleteBrochure,
  getBrochurePresignedUrls,
  getGymPlansImages,
  // New gym photos APIs
  getGymPhotos,
  getGymPhotosPresignedUrls,
  confirmGymPhotoUpload,
  deleteGymPhoto,
  updateGymPhoto,
} from "../../services/Api";
import ImageWithFallback from "../../utils/ImagewithFallback";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import NoDataComponent from "../../utils/noDataComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);

// Gym area sections configuration
const GYM_AREAS = [
  {
    id: "entrance",
    name: "Entrance",
    icon: "login",
    iconLibrary: "MaterialIcons",
    description: "Main entrance and signage",
    color: "#4CAF50",
  },
  {
    id: "cardio",
    name: "Cardio Area",
    icon: "favorite",
    iconLibrary: "MaterialIcons",
    description: "Treadmills, bikes",
    color: "#FF5722",
  },
  {
    id: "weight",
    name: "Weight Area",
    icon: "fitness-center",
    iconLibrary: "MaterialIcons",
    description: "Free weights and machine",
    color: "#FF9800",
  },
  {
    id: "locker",
    name: "Locker Room",
    icon: "lock-closed",
    iconLibrary: "Ionicons",
    description: "Changing rooms",
    color: "#9C27B0",
  },
  {
    id: "reception",
    name: "Reception",
    icon: "desk",
    iconLibrary: "MaterialIcons",
    description: "Front desk and waiting area",
    color: "#2196F3",
  },
  {
    id: "other",
    name: "Other Areas",
    icon: "more-horiz",
    iconLibrary: "MaterialIcons",
    description: "Any other facility areas",
    color: "#607D8B",
  },
];

const GymPlans = () => {
  const router = useRouter();
  const [mainTab, setMainTab] = useState("gym_photos"); // 'brochures' or 'gym_photos'

  // Brochures tab state
  const [brochureCurrentSlideIndex, setBrochureCurrentSlideIndex] = useState(0);
  const [brochureModalVisible, setBrochureModalVisible] = useState(false);
  const [brochureImages, setBrochureImages] = useState([]);
  const brochureSwiperRef = useRef(null);

  // Gym Photos tab state
  const [gymPhotosCurrentSlideIndex, setGymPhotosCurrentSlideIndex] =
    useState(0);
  const [gymPhotosModalVisible, setGymPhotosModalVisible] = useState(false);
  const [gymPhotosImages, setGymPhotosImages] = useState([]); // All gym photos for carousel
  const [areaPhotos, setAreaPhotos] = useState({}); // Photos by area: {entrance: {image, id}, cardio: null, ...}
  const gymPhotosSwiperRef = useRef(null);

  // Shared state
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isFullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [fullImageSource, setFullImageSource] = useState(null);
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    fetchBrochures();
    fetchGymPhotos();
  }, []);

  // Process upload queue
  useEffect(() => {
    if (uploadQueue.length > 0 && !isProcessingUpload) {
      processNextUpload();
    }
  }, [uploadQueue, isProcessingUpload]);

  useEffect(() => {
    if (
      brochureCurrentSlideIndex >= brochureImages.length &&
      brochureImages.length > 0
    ) {
      setBrochureCurrentSlideIndex(brochureImages.length - 1);
    }
  }, [brochureImages]);

  useEffect(() => {
    if (
      gymPhotosCurrentSlideIndex >= gymPhotosImages.length &&
      gymPhotosImages.length > 0
    ) {
      setGymPhotosCurrentSlideIndex(gymPhotosImages.length - 1);
    }
  }, [gymPhotosImages]);

  const fetchBrochures = async () => {
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID not found" });
        return;
      }

      const response = await getGymPlansImages(gym_id);
      if (response.status === 200) {
        if (response.data && Array.isArray(response.data)) {
          const serverImages = response.data.map((item, index) => ({
            id: `brochure-server-${index}`,
            source: { uri: item.images },
            serverPath: item.images,
            brochureId: item.brouchre_id,
          }));
          setBrochureImages(serverImages);
        } else {
          setBrochureImages([]);
        }
      }
    } catch (error) {
      console.error("Error fetching brochures:", error);
      showToast({ type: "error", title: "Error fetching brochures" });
      setBrochureImages([]);
    }
  };

  const fetchGymPhotos = async () => {
    try {
      setLoading(true);
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID not found" });
        setLoading(false);
        return;
      }

      // Initialize empty areas first
      const areaPhotosMap = {};
      GYM_AREAS.forEach((area) => {
        areaPhotosMap[area.id] = null;
      });

      const response = await getGymPhotos(gym_id);
      if (response.status === 200) {
        if (response.data && Array.isArray(response.data)) {
          // Structure: [{area_type: 'entrance', image_url: 'url', photo_id: 1}, ...]
          const allPhotosForCarousel = [];

          // Fill with existing photos
          response.data.forEach((item, index) => {
            if (item && item.image_url && item.area_type) {
              const photoData = {
                id: `gym-photo-${item.photo_id || index}`,
                source: { uri: item.image_url },
                serverPath: item.image_url,
                photoId: item.photo_id,
                areaType: item.area_type,
              };

              // Add to area photos map
              areaPhotosMap[item.area_type] = photoData;
            }
          });

          // Create ordered carousel array based on GYM_AREAS order
          const orderedPhotosForCarousel = [];
          GYM_AREAS.forEach((area) => {
            if (areaPhotosMap[area.id]) {
              orderedPhotosForCarousel.push(areaPhotosMap[area.id]);
            }
          });

          setAreaPhotos(areaPhotosMap);
          setGymPhotosImages(orderedPhotosForCarousel);
        } else {
          setAreaPhotos(areaPhotosMap);
          setGymPhotosImages([]);
        }
      } else {
        setAreaPhotos(areaPhotosMap);
        setGymPhotosImages([]);
      }
    } catch (error) {
      console.error("Error fetching gym photos:", error);
      showToast({ type: "error", title: "Error fetching gym photos" });

      // Initialize empty areas on error
      const emptyAreas = {};
      GYM_AREAS.forEach((area) => {
        emptyAreas[area.id] = null;
      });
      setAreaPhotos(emptyAreas);
      setGymPhotosImages([]);
    } finally {
      setLoading(false);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const openFullImage = (image, index = 0) => {
    setFullImageSource(image);
    setFullImageIndex(index);
    setFullImageModalVisible(true);
  };

  const handleFullImageSwipeLeft = () => {
    const currentImages =
      mainTab === "brochures" ? brochureImages : gymPhotosImages;
    if (fullImageIndex > 0) {
      const newIndex = fullImageIndex - 1;
      setFullImageIndex(newIndex);
      setFullImageSource(currentImages[newIndex].source);
    }
  };

  const handleFullImageSwipeRight = () => {
    const currentImages =
      mainTab === "brochures" ? brochureImages : gymPhotosImages;
    if (fullImageIndex < currentImages.length - 1) {
      const newIndex = fullImageIndex + 1;
      setFullImageIndex(newIndex);
      setFullImageSource(currentImages[newIndex].source);
    }
  };

  // Brochure functions (existing functionality)
  const deleteBrochureImage = async (brochureId, imageIndex) => {
    try {
      setDeleting(true);
      const response = await deleteBrochure(brochureId);
      if (response.status === 200) {
        showToast({ type: "success", title: "Brochure deleted successfully" });
        if (
          imageIndex <= brochureCurrentSlideIndex &&
          brochureCurrentSlideIndex > 0
        ) {
          setBrochureCurrentSlideIndex((prev) => prev - 1);
        }
        await fetchBrochures();
      }
    } catch (error) {
      console.error("Error deleting brochure:", error);
      showToast({ type: "error", title: "Failed to delete brochure" });
    } finally {
      setDeleting(false);
    }
  };

  const handleBrochureDeleteFromModal = async (imageIndex) => {
    const image = brochureImages[imageIndex];
    if (image.serverPath || image.brochureId) {
      try {
        setDeleting(true);
        const response = await deleteBrochure(image.brochureId);
        if (response.status === 200) {
          showToast({
            type: "success",
            title: "Brochure deleted successfully",
          });
          if (
            imageIndex <= brochureCurrentSlideIndex &&
            brochureCurrentSlideIndex > 0
          ) {
            setBrochureCurrentSlideIndex((prev) => prev - 1);
          }
          await fetchBrochures();
        }
      } catch (error) {
        console.error("Error deleting brochure:", error);
        showToast({ type: "error", title: "Failed to delete brochure" });
      } finally {
        setDeleting(false);
      }
    } else {
      const updatedImages = brochureImages.filter(
        (_, index) => index !== imageIndex
      );
      setBrochureImages(updatedImages);
      if (
        imageIndex <= brochureCurrentSlideIndex &&
        brochureCurrentSlideIndex > 0
      ) {
        setBrochureCurrentSlideIndex((prev) => prev - 1);
      }
      setRefreshKey((prev) => prev + 1);
      showToast({ type: "success", title: "Local brochure removed" });
    }
  };

  const uploadBrochuresToS3 = async (updatedImages) => {
    try {
      setUploading(true);
      setUploadStatus("Preparing upload...");

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID not found" });
        return false;
      }

      const newImages = updatedImages.filter(
        (img) => !img.serverPath && img.source.uri
      );
      if (newImages.length === 0) {
        showToast({ type: "success", title: "No new brochures to upload" });
        return true;
      }

      const mediaMetadata = newImages.map((item) => {
        const uri = item.source.uri;
        const fileName = uri.split("/").pop();
        const fileType = fileName.split(".").pop().toLowerCase();
        return {
          type: "image",
          fileName: fileName || `brochure_${Date.now()}.${fileType}`,
          contentType: `image/${fileType}`,
          extension: fileType,
        };
      });

      setUploadStatus("Getting upload URLs...");
      const presignedResponse = await getBrochurePresignedUrls({
        gym_id: parseInt(gym_id),
        media: mediaMetadata,
      });

      if (
        presignedResponse?.status !== 200 ||
        !presignedResponse.data?.presigned_urls
      ) {
        throw new Error("Failed to get upload URLs");
      }

      const { presigned_urls } = presignedResponse.data;
      setUploadStatus("Uploading brochures...");

      const uploadPromises = newImages.map(async (item, index) => {
        const {
          upload_url,
          cdn_url,
          content_type,
          brochure_id: newBrochureId,
        } = presigned_urls[index];
        try {
          const uri = item.source.uri;
          const fileName = uri.split("/").pop();
          const fileType =
            content_type || `image/${fileName.split(".").pop().toLowerCase()}`;

          const formData = new FormData();
          Object.keys(upload_url.fields).forEach((key) => {
            formData.append(key, upload_url.fields[key]);
          });

          formData.append("file", {
            uri: uri,
            name: fileName,
            type: fileType,
          });

          const s3Response = await fetch(upload_url.url, {
            method: "POST",
            body: formData,
            headers: {},
          });

          if (s3Response.status === 204 || s3Response.status === 200) {
            return {
              success: true,
              cdn_url: cdn_url,
              brochure_id: newBrochureId,
            };
          } else {
            return { success: false };
          }
        } catch (error) {
          console.error("Upload error for brochure:", error);
          return { success: false };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const failedUploads = uploadResults.filter((result) => !result.success);

      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} brochures failed to upload`);
      }

      setUploadStatus("Finalizing...");
      const newCdnUrls = uploadResults.map((result) => ({
        cdn_url: result.cdn_url,
        brochure_id: result.brochure_id,
      }));

      for (const cdnUrl of newCdnUrls) {
        await confirmBrochureUpload({
          cdn_url: cdnUrl.cdn_url,
          gym_id: parseInt(gym_id),
          brouchure_id: cdnUrl.brochure_id,
        });
      }

      showToast({ type: "success", title: "Brochures uploaded successfully" });
      await fetchBrochures();
      return true;
    } catch (error) {
      console.error("Brochure upload error:", error);
      showToast({
        type: "error",
        title: error.message || "Failed to upload brochures",
      });
      return false;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(""), 2000);
    }
  };

  // Process upload queue one by one
  const processNextUpload = async () => {
    if (uploadQueue.length === 0 || isProcessingUpload) return;

    setIsProcessingUpload(true);
    const nextUpload = uploadQueue[0];

    try {
      await performUpload(
        nextUpload.areaId,
        nextUpload.imageUri,
        nextUpload.isReplacement
      );
      // Remove completed upload from queue
      setUploadQueue((prev) => prev.slice(1));
    } catch (error) {
      console.error("Upload queue processing error:", error);
      // Remove failed upload from queue
      setUploadQueue((prev) => prev.slice(1));
    } finally {
      setIsProcessingUpload(false);
      // Add small delay to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // Add upload to queue
  const queueUpload = (areaId, imageUri, isReplacement = false) => {
    setUploadQueue((prev) => [...prev, { areaId, imageUri, isReplacement }]);
  };

  // Gym Photos functions (new functionality)
  const handleAreaPhotoUpload = async (
    areaId,
    imageUri,
    isReplacement = false
  ) => {
    // Add to queue instead of processing immediately
    queueUpload(areaId, imageUri, isReplacement);
    showToast({
      type: "info",
      title: `${
        GYM_AREAS.find((a) => a.id === areaId)?.name
      } photo queued for upload`,
    });
  };

  const performUpload = async (areaId, imageUri, isReplacement = false) => {
    try {
      setUploading(true);
      const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name;
      setUploadStatus(`Uploading ${areaName} photo...`);

      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        throw new Error("Gym ID not found");
      }

      // If this is a replacement, delete the existing photo first
      if (isReplacement && areaPhotos[areaId]) {
        setUploadStatus(`Replacing ${areaName} photo...`);
        const existingPhoto = areaPhotos[areaId];
        if (existingPhoto.photoId) {
          const deleteResponse = await deleteGymPhoto(existingPhoto.photoId);
          if (deleteResponse.status !== 200) {
            throw new Error("Failed to delete existing photo");
          }
        }
      }

      const fileName = imageUri.split("/").pop();
      const fileType = fileName.split(".").pop().toLowerCase();

      const mediaMetadata = [
        {
          type: "image",
          fileName: fileName || `${areaId}_photo_${Date.now()}.${fileType}`,
          contentType: `image/${fileType}`,
          extension: fileType,
          area_type: areaId,
        },
      ];

      setUploadStatus(`Getting upload URL for ${areaName}...`);

      // Add retry logic for network requests
      let presignedResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          presignedResponse = await Promise.race([
            getGymPhotosPresignedUrls({
              gym_id: parseInt(gym_id),
              media: mediaMetadata,
            }),
            new Promise(
              (_, reject) =>
                setTimeout(() => reject(new Error("Request timeout")), 30000) // 30 second timeout
            ),
          ]);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(
              `Failed to get upload URLs after ${maxRetries} attempts: ${error.message}`
            );
          }
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }

      if (
        presignedResponse?.status !== 200 ||
        !presignedResponse.data?.presigned_urls
      ) {
        throw new Error("Invalid response from upload URL service");
      }

      const { upload_url, cdn_url, photo_id } =
        presignedResponse.data.presigned_urls[0];

      setUploadStatus(`Uploading ${areaName} photo to cloud...`);
      const formData = new FormData();
      Object.keys(upload_url.fields).forEach((key) => {
        formData.append(key, upload_url.fields[key]);
      });

      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      });

      // Add retry logic for S3 upload
      let s3Response;
      retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          s3Response = await Promise.race([
            fetch(upload_url.url, {
              method: "POST",
              body: formData,
              headers: {},
            }),
            new Promise(
              (_, reject) =>
                setTimeout(() => reject(new Error("S3 upload timeout")), 60000) // 60 second timeout for file upload
            ),
          ]);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(
              `Failed to upload to S3 after ${maxRetries} attempts: ${error.message}`
            );
          }
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount)
          );
        }
      }

      if (s3Response.status === 204 || s3Response.status === 200) {
        setUploadStatus(`Finalizing ${areaName} photo...`);

        // Add retry logic for confirmation
        retryCount = 0;
        while (retryCount < maxRetries) {
          try {
            await Promise.race([
              confirmGymPhotoUpload({
                cdn_url: cdn_url,
                gym_id: parseInt(gym_id),
                photo_id: photo_id,
                area_type: areaId,
              }),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Confirmation timeout")),
                  30000
                )
              ),
            ]);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw new Error(
                `Failed to confirm upload after ${maxRetries} attempts: ${error.message}`
              );
            }
            // Wait before retry
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        }

        showToast({
          type: "success",
          title: `${areaName} photo ${
            isReplacement ? "replaced" : "uploaded"
          } successfully`,
        });
        await fetchGymPhotos();
        return true;
      } else {
        const errorText = await s3Response.text();
        throw new Error(
          `S3 upload failed with status ${s3Response.status}: ${errorText}`
        );
      }
    } catch (error) {
      console.error("Gym photo upload error:", error);

      const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name;

      // Handle specific error types
      if (
        error.message.includes("Network request failed") ||
        error.message.includes("timeout")
      ) {
        showToast({
          type: "error",
          title: `Network error uploading ${areaName} photo`,
          message: "Please check your connection and try again",
        });
      } else if (error.message.includes("already exists")) {
        showToast({
          type: "error",
          title:
            "Photo already exists for this area. Please delete the existing photo first.",
        });
      } else {
        showToast({
          type: "error",
          title: `Failed to upload ${areaName} photo`,
          message: error.message || "Unknown error occurred",
        });
      }
      throw error; // Re-throw to be handled by queue processor
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(""), 2000);
    }
  };

  const handleAreaPhotoDelete = async (areaId) => {
    try {
      setDeleting(true);
      const areaPhoto = areaPhotos[areaId];

      if (!areaPhoto || !areaPhoto.photoId) {
        showToast({ type: "error", title: "No photo to delete" });
        return;
      }

      const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name;

      // Show confirmation dialog
      Alert.alert(
        "Delete Photo",
        `Are you sure you want to delete the ${areaName} photo?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setDeleting(false),
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await deleteGymPhoto(areaPhoto.photoId);
                if (response.status === 200) {
                  showToast({
                    type: "success",
                    title: `${areaName} photo deleted successfully`,
                  });
                  await fetchGymPhotos();
                } else {
                  throw new Error("Failed to delete photo");
                }
              } catch (error) {
                console.error("Error deleting gym photo:", error);
                showToast({
                  type: "error",
                  title: "Failed to delete gym photo",
                });
              } finally {
                setDeleting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting gym photo:", error);
      showToast({ type: "error", title: "Failed to delete gym photo" });
      setDeleting(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast({
        type: "error",
        title: "Permission denied",
        message: "Sorry, we need camera roll permissions to select images!",
      });
      return false;
    }
    return true;
  };

  const pickImageForArea = async (areaId) => {
    try {
      const areaName = GYM_AREAS.find((a) => a.id === areaId)?.name;

      // Show picker option to choose from gallery or camera
      Alert.alert("Upload Photo", `Choose an option for ${areaName}`, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Camera",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              showToast({
                type: "error",
                title: "Permission denied",
                message: "We need camera permissions to take photos",
              });
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
              const imageUri = result.assets[0].uri;
              const hasExistingPhoto = areaPhotos[areaId] !== null;

              if (hasExistingPhoto) {
                Alert.alert(
                  "Replace Photo",
                  `Replace the existing ${areaName} photo with the new one?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Replace",
                      style: "default",
                      onPress: () =>
                        handleAreaPhotoUpload(areaId, imageUri, true),
                    },
                  ]
                );
              } else {
                await handleAreaPhotoUpload(areaId, imageUri, false);
              }
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const hasPermission = await requestPermissions();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: false,
              allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
              const imageUri = result.assets[0].uri;
              const hasExistingPhoto = areaPhotos[areaId] !== null;

              if (hasExistingPhoto) {
                Alert.alert(
                  "Replace Photo",
                  `Replace the existing ${areaName} photo with the new one?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Replace",
                      style: "default",
                      onPress: () =>
                        handleAreaPhotoUpload(areaId, imageUri, true),
                    },
                  ]
                );
              } else {
                await handleAreaPhotoUpload(areaId, imageUri, false);
              }
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error picking image:", error);
      showToast({ type: "error", title: "Failed to select image" });
    }
  };

  const goToPrevSlide = (type) => {
    if (type === "brochures") {
      if (brochureSwiperRef.current && brochureCurrentSlideIndex > 0) {
        brochureSwiperRef.current.scrollBy(-1);
      }
    } else {
      if (gymPhotosSwiperRef.current && gymPhotosCurrentSlideIndex > 0) {
        gymPhotosSwiperRef.current.scrollBy(-1);
      }
    }
  };

  const goToNextSlide = (type) => {
    if (type === "brochures") {
      if (
        brochureSwiperRef.current &&
        brochureCurrentSlideIndex < brochureImages.length - 1
      ) {
        brochureSwiperRef.current.scrollBy(1);
      }
    } else {
      if (
        gymPhotosSwiperRef.current &&
        gymPhotosCurrentSlideIndex < gymPhotosImages.length - 1
      ) {
        gymPhotosSwiperRef.current.scrollBy(1);
      }
    }
  };

  const renderAreaIcon = (area) => {
    if (area.iconLibrary === "MaterialIcons") {
      return <MaterialIcons name={area.icon} size={24} color={area.color} />;
    } else {
      return <Ionicons name={area.icon} size={24} color={area.color} />;
    }
  };

  const renderBrochuresContent = () => {
    if (brochureImages.length === 0) {
      return (
        <NoDataComponent
          icon="file-tray-outline"
          title="No Brochures Available"
          message="Upload gym brochures and plan images to showcase to your members"
          buttonText="Add Brochures"
          onButtonPress={() => setBrochureModalVisible(true)}
        />
      );
    }

    return (
      <>
        <View style={styles.mediaWrapper}>
          <Swiper
            key={`brochures-${refreshKey}`}
            ref={brochureSwiperRef}
            style={styles.swiperContainer}
            showsPagination={false}
            loop={false}
            autoplay={false}
            onIndexChanged={(index) => setBrochureCurrentSlideIndex(index)}
            index={brochureCurrentSlideIndex}
          >
            {brochureImages.map((image, index) => (
              <View
                key={`brochure-slide-${image.id}-${refreshKey}`}
                style={styles.slideItem}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openFullImage(image.source, index)}
                  style={styles.mediaImageContainer}
                >
                  <ImageWithFallback
                    source={image.source}
                    style={styles.mediaImage}
                    resizeMode="contain"
                    fallbackText="Unable to load brochure image"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </Swiper>

          {brochureImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[
                  styles.navArrow,
                  styles.leftArrow,
                  brochureCurrentSlideIndex === 0 ? styles.disabledArrow : null,
                ]}
                onPress={() => goToPrevSlide("brochures")}
                disabled={brochureCurrentSlideIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={brochureCurrentSlideIndex === 0 ? "#fcfcfc" : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navArrow,
                  styles.rightArrow,
                  brochureCurrentSlideIndex === brochureImages.length - 1
                    ? styles.disabledArrow
                    : null,
                ]}
                onPress={() => goToNextSlide("brochures")}
                disabled={
                  brochureCurrentSlideIndex === brochureImages.length - 1
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    brochureCurrentSlideIndex === brochureImages.length - 1
                      ? "#ccc"
                      : "#fff"
                  }
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {brochureImages.length > 1 && (
          <View style={styles.indicatorContainer}>
            {brochureImages.map((_, index) => (
              <TouchableOpacity
                key={`brochure-indicator-${index}-${refreshKey}`}
                style={[
                  styles.customIndicator,
                  brochureCurrentSlideIndex === index &&
                    styles.activeCustomIndicator,
                ]}
                onPress={() => {
                  if (brochureSwiperRef.current) {
                    brochureSwiperRef.current.scrollBy(
                      index - brochureCurrentSlideIndex,
                      true
                    );
                  }
                }}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            (uploading || deleting) && styles.disabledButton,
          ]}
          onPress={() => setBrochureModalVisible(true)}
          disabled={uploading || deleting}
        >
          {uploading ? (
            <ActivityIndicator size={20} color="#FFF" />
          ) : (
            <Ionicons name="add" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderGymPhotosContent = () => {
    if (gymPhotosImages.length === 0) {
      return (
        <NoDataComponent
          icon="camerao"
          title="No Gym Photos Available"
          message="Upload photos of different gym areas to showcase your facilities"
          buttonText="Add Gym Photos"
          onButtonPress={() => setGymPhotosModalVisible(true)}
        />
      );
    }

    return (
      <>
        <View style={styles.mediaWrapper}>
          <Swiper
            key={`gym-photos-${refreshKey}`}
            ref={gymPhotosSwiperRef}
            style={styles.swiperContainer}
            showsPagination={false}
            loop={false}
            autoplay={false}
            onIndexChanged={(index) => setGymPhotosCurrentSlideIndex(index)}
            index={gymPhotosCurrentSlideIndex}
          >
            {gymPhotosImages.map((image, index) => (
              <View
                key={`gym-photo-slide-${image.id}-${refreshKey}`}
                style={styles.slideItem}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openFullImage(image.source, index)}
                  style={styles.mediaImageContainer}
                >
                  <ImageWithFallback
                    source={image.source}
                    style={styles.mediaImage}
                    resizeMode="contain"
                    fallbackText={`Unable to load ${image.areaType} image`}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </Swiper>

          {gymPhotosImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[
                  styles.navArrow,
                  styles.leftArrow,
                  gymPhotosCurrentSlideIndex === 0
                    ? styles.disabledArrow
                    : null,
                ]}
                onPress={() => goToPrevSlide("gym_photos")}
                disabled={gymPhotosCurrentSlideIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={gymPhotosCurrentSlideIndex === 0 ? "#fcfcfc" : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navArrow,
                  styles.rightArrow,
                  gymPhotosCurrentSlideIndex === gymPhotosImages.length - 1
                    ? styles.disabledArrow
                    : null,
                ]}
                onPress={() => goToNextSlide("gym_photos")}
                disabled={
                  gymPhotosCurrentSlideIndex === gymPhotosImages.length - 1
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    gymPhotosCurrentSlideIndex === gymPhotosImages.length - 1
                      ? "#ccc"
                      : "#fff"
                  }
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {gymPhotosImages.length > 1 && (
          <View style={styles.indicatorContainer}>
            {gymPhotosImages.map((_, index) => (
              <TouchableOpacity
                key={`gym-photo-indicator-${index}-${refreshKey}`}
                style={[
                  styles.customIndicator,
                  gymPhotosCurrentSlideIndex === index &&
                    styles.activeCustomIndicator,
                ]}
                onPress={() => {
                  if (gymPhotosSwiperRef.current) {
                    gymPhotosSwiperRef.current.scrollBy(
                      index - gymPhotosCurrentSlideIndex,
                      true
                    );
                  }
                }}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            (uploading || deleting) && styles.disabledButton,
          ]}
          onPress={() => setGymPhotosModalVisible(true)}
          disabled={uploading || deleting}
        >
          {uploading ? (
            <ActivityIndicator size={20} color="#FFF" />
          ) : (
            <Ionicons name="add" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderGymPhotosModal = () => {
    return (
      <Modal
        visible={gymPhotosModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGymPhotosModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={() => setGymPhotosModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Gym Photos</Text>
              {uploadQueue.length > 0 && (
                <View style={styles.queueBadge}>
                  <Text style={styles.queueBadgeText}>
                    {uploadQueue.length} queued
                  </Text>
                </View>
              )}
            </View>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.areasGrid}>
              {GYM_AREAS.map((area) => {
                const hasPhoto = areaPhotos[area.id] !== null;
                const photo = areaPhotos[area.id];

                return (
                  <View
                    key={area.id}
                    style={[
                      styles.areaCard,
                      { borderColor: area.color + "30" },
                    ]}
                  >
                    <View style={styles.areaCardHeader}>
                      <View
                        style={[
                          styles.areaCardIcon,
                          { backgroundColor: area.color + "20" },
                        ]}
                      >
                        {renderAreaIcon(area)}
                      </View>
                      <View style={styles.areaCardInfo}>
                        <Text style={styles.areaCardTitle}>{area.name}</Text>
                        <Text style={styles.areaCardDescription}>
                          {area.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.areaCardImageContainer}>
                      {hasPhoto && photo && photo.source ? (
                        <View style={styles.imagePreviewContainer}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => pickImageForArea(area.id)}
                            disabled={uploading || deleting}
                          >
                            <ImageWithFallback
                              source={photo.source}
                              style={styles.imagePreview}
                              resizeMode="cover"
                            />
                            {/* Replace overlay */}
                            <View style={styles.replaceOverlay}>
                              <Ionicons
                                name="create-outline"
                                size={16}
                                color="#FFF"
                              />
                              <Text style={styles.replaceText}>
                                Tap to replace
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Delete button */}
                          <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() => handleAreaPhotoDelete(area.id)}
                            disabled={deleting || uploading}
                          >
                            {deleting ? (
                              <ActivityIndicator size={16} color="#FFF" />
                            ) : (
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#FFF"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.uploadPlaceholder,
                            (uploading || deleting) &&
                              styles.disabledPlaceholder,
                          ]}
                          onPress={() => pickImageForArea(area.id)}
                          disabled={uploading || deleting}
                        >
                          {uploading ||
                          uploadQueue.some(
                            (item) => item.areaId === area.id
                          ) ? (
                            <ActivityIndicator size={20} color="#999" />
                          ) : (
                            <Ionicons
                              name="camera-outline"
                              size={20}
                              color="#999"
                            />
                          )}
                          <Text style={styles.uploadPlaceholderText}>
                            {uploading &&
                            uploadQueue.length > 0 &&
                            uploadQueue[0].areaId === area.id
                              ? "Uploading..."
                              : uploadQueue.some(
                                  (item) => item.areaId === area.id
                                )
                              ? "Queued..."
                              : "Upload image"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"Gym Management"}
      />

      {/* Main Tab Header */}
      <View style={[styles.mainTabHeader]}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === "gym_photos" && styles.activeMainTab,
          ]}
          onPress={() => setMainTab("gym_photos")}
        >
          <Text
            style={[
              styles.mainTabText,
              mainTab === "gym_photos" && styles.activeMainTabText,
            ]}
          >
            Gym Photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === "brochures" && styles.activeMainTab,
          ]}
          onPress={() => setMainTab("brochures")}
        >
          <Text
            style={[
              styles.mainTabText,
              mainTab === "brochures" && styles.activeMainTabText,
            ]}
          >
            Brochures
          </Text>
        </TouchableOpacity>
      </View>

      {/* Area Type Indicator for Gym Photos */}
      {mainTab === "gym_photos" && gymPhotosImages.length > 0 && (
        <View style={styles.areaTypeIndicator}>
          <View
            style={[
              styles.areaTypeContainer,
              {
                backgroundColor:
                  GYM_AREAS.find(
                    (area) =>
                      area.id ===
                      gymPhotosImages[gymPhotosCurrentSlideIndex]?.areaType
                  )?.color + "20" || "#E0E0E020",
              },
            ]}
          >
            <View style={styles.areaTypeIconContainer}>
              {gymPhotosImages[gymPhotosCurrentSlideIndex] &&
                renderAreaIcon(
                  GYM_AREAS.find(
                    (area) =>
                      area.id ===
                      gymPhotosImages[gymPhotosCurrentSlideIndex].areaType
                  )
                )}
            </View>
            <Text
              style={[
                styles.areaTypeText,
                {
                  color:
                    GYM_AREAS.find(
                      (area) =>
                        area.id ===
                        gymPhotosImages[gymPhotosCurrentSlideIndex]?.areaType
                    )?.color || "#666",
                },
              ]}
            >
              {GYM_AREAS.find(
                (area) =>
                  area.id ===
                  gymPhotosImages[gymPhotosCurrentSlideIndex]?.areaType
              )?.name || "Unknown Area"}
            </Text>
            <Text style={styles.areaTypeCount}>
              {gymPhotosCurrentSlideIndex + 1} of {gymPhotosImages.length}
            </Text>
          </View>
        </View>
      )}

      {/* Upload/Delete Status */}
      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>{uploadStatus}</Text>
        </View>
      )}

      {deleting && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#FF3B30" />
          <Text style={[styles.uploadingText, { color: "#FF3B30" }]}>
            Deleting...
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {mainTab === "brochures"
            ? renderBrochuresContent()
            : renderGymPhotosContent()}
        </View>
      )}

      {/* Brochure Upload Modal */}
      <ImageUploadModal
        visible={brochureModalVisible}
        onClose={() => setBrochureModalVisible(false)}
        images={brochureImages}
        setImages={setBrochureImages}
        postTheGymBrochures={uploadBrochuresToS3}
        uploading={uploading}
        onDeleteImage={handleBrochureDeleteFromModal}
      />

      {/* Gym Photos Modal */}
      {renderGymPhotosModal()}

      <FullImageModal
        isVisible={isFullImageModalVisible}
        imageSource={fullImageSource}
        onClose={() => setFullImageModalVisible(false)}
        images={mainTab === "brochures" ? brochureImages : gymPhotosImages}
        currentIndex={fullImageIndex}
        onSwipeLeft={handleFullImageSwipeLeft}
        onSwipeRight={handleFullImageSwipeRight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  contentContainer: {
    flex: 1,
  },
  // Main tab styles
  mainTabHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 20,

    flexDirection: "row",
    justifyContent: "center",
  },
  mainTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginHorizontal: 10,
  },
  activeMainTab: {
    borderBottomColor: "#4A90E2",
    borderBottomWidth: 3,
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeMainTabText: {
    color: "#4A90E2",
    fontWeight: "700",
  },
  // Area type indicator styles
  areaTypeIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  areaTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  areaTypeIconContainer: {
    marginRight: 8,
  },
  areaTypeText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  areaTypeCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
  },
  uploadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  uploadingText: {
    marginLeft: 10,
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  mediaWrapper: {
    flex: 0.8,
    width: responsiveWidth(100),
    height: responsiveWidth(100),
    marginTop: 10,
    backgroundColor: "#F7F7F7",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  swiperContainer: {
    height: responsiveWidth(100),
  },
  slideItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    position: "relative",
  },
  mediaImageContainer: {
    width: responsiveWidth(90),
    height: responsiveWidth(110),
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  customIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginHorizontal: 5,
  },
  activeCustomIndicator: {
    backgroundColor: "#007AFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  disabledArrow: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 5,
  },
  modalTitleContainer: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  queueBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  queueBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  areasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  areaCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areaCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  areaCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  areaCardInfo: {
    flex: 1,
  },
  areaCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  areaCardDescription: {
    fontSize: 11,
    color: "#666",
    lineHeight: 14,
  },
  areaCardImageContainer: {
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  imagePreviewContainer: {
    flex: 1,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  deletePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,59,48,0.8)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
    borderRadius: 8,
    margin: 1,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  disabledPlaceholder: {
    opacity: 0.6,
  },
  replaceOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  replaceText: {
    color: "#FFF",
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default GymPlans;
