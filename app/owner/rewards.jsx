import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  Pressable,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  Image,
  AppState,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import {
  getRewardsAPI,
  createRewardAPI,
  updateRewardAPI,
  deleteRewardAPI,
  confirmRewardImageAPI,
} from "../../services/Api";

import { getToken } from "../../utils/auth";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { router } from "expo-router";
import { showToast } from "../../utils/Toaster";

import RewardCard from "../../components/reward/RewardCard";
import RewardDetailsModal from "../../components/reward/RewardDetailsModal";
import DuplicateXPConfirmationModal from "../../components/reward/DuplicateXPConfirmationModal";
import { ShimmerNewsArticle } from "../../components/shimmerUI/ShimmerComponentsPreview";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { get } from "lodash";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrizeSkeleton from "../../components/ui/loaders/prizeSkeleton";

const { width, height } = Dimensions.get("window");

const DEFAULT_REWARD_IMAGES = [
  {
    id: "default_rewards",
    source: require("../../assets/images/rewards/rewards_img.png"),
    isDefault: true,
  },
  {
    id: "default_subscription",
    source: require("../../assets/images/rewards/subscription.png"),
    isDefault: true,
  },
  {
    id: "default_bag",
    source: require("../../assets/images/rewards/bag.png"),
    isDefault: true,
  },
  {
    id: "default_bottle",
    source: require("../../assets/images/rewards/bottle.png"),
    isDefault: true,
  },
  {
    id: "default_tshirt",
    source: require("../../assets/images/rewards/t-shirt.png"),
    isDefault: true,
  },
];

const getImageSourceById = (imageId) => {
  const image = DEFAULT_REWARD_IMAGES.find((img) => img.id === imageId);
  return image
    ? image.source
    : require("../../assets/images/rewards/rewards_img.png");
};

// Enhanced image source resolution for better iOS handling
const getRewardImageSource = (reward) => {
  if (!reward.image_url) {
    return getImageSourceById("default_rewards");
  }

  // If it's a URL (custom uploaded image)
  if (reward.image_url.startsWith("http")) {
    return { uri: reward.image_url };
  }

  // If it's a default image ID
  if (reward.image_url.startsWith("default_")) {
    return getImageSourceById(reward.image_url);
  }

  // Fallback to default
  return getImageSourceById("default_rewards");
};

// iOS-specific logging
const logRewardCreation = (stage, data) => {
  if (Platform.OS === "ios" && __DEV__) {
  }
};

// Enhanced uploadImageToS3 with iOS-specific handling
const uploadImageToS3 = async (presignedData, imageUri) => {
  try {
    logRewardCreation("S3Upload-Start", {
      imageUri,
      presignedUrl: presignedData.url,
    });

    const formData = new FormData();

    Object.keys(presignedData.fields).forEach((key) => {
      formData.append(key, presignedData.fields[key]);
    });

    // iOS-specific file handling
    const fileToUpload = {
      uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
      type: presignedData.fields["Content-Type"],
      name: `reward_image.${getFileExtension(imageUri)}`,
    };

    formData.append("file", fileToUpload);

    const response = await fetch(presignedData.url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    logRewardCreation("S3Upload-Response", {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("S3 upload failed:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    logRewardCreation("S3Upload-Error", error);
    console.error("S3 upload error:", error);
    throw error;
  }
};

const getFileExtension = (uri) => {
  const extension = uri.split(".").pop();
  return extension || "jpg";
};

const getContentType = (extension) => {
  const contentTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return contentTypes[extension.toLowerCase()] || "image/jpeg";
};

// Image preloading for iOS
const preloadCustomImage = (imageUrl) => {
  if (Platform.OS === "ios" && imageUrl && imageUrl.startsWith("http")) {
    Image.prefetch(imageUrl)
      .then(() => {
        logRewardCreation("ImagePreload-Success", imageUrl);
      })
      .catch((error) => {
        logRewardCreation("ImagePreload-Error", { imageUrl, error });
      });
  }
};

const ImagePickerModal = ({
  visible,
  onClose,
  onSelectImage,
  selectedImage,
}) => {
  const [currentSelection, setCurrentSelection] = useState(selectedImage);

  const handleSelectDefault = (imageData) => {
    setCurrentSelection(imageData);
  };

  const handlePickFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCurrentSelection({
          id: "custom_" + Date.now(),
          source: { uri: result.assets[0].uri },
          isDefault: false,
          uri: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast({ type: "error", title: "Error selecting image" });
    }
  };

  const handleConfirm = () => {
    onSelectImage(currentSelection);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerContainer}>
          <View style={styles.imagePickerHeader}>
            <Text style={styles.imagePickerTitle}>Select Reward Image</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.imagePickerContent}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickFromGallery}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.uploadButtonText}>Upload Custom Image</Text>
            </TouchableOpacity>

            {currentSelection && !currentSelection.isDefault && (
              <View style={styles.customImagePreview}>
                <Text style={styles.sectionTitle}>Selected Custom Image</Text>
                <Image
                  source={currentSelection.source}
                  style={styles.customImage}
                />
              </View>
            )}
            <Text style={styles.sectionTitle}>Default Images</Text>
            <View style={styles.defaultImagesContainer}>
              {DEFAULT_REWARD_IMAGES.map((imageData, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.imageOption,
                    currentSelection?.id === imageData.id &&
                      styles.selectedImageOption,
                  ]}
                  onPress={() => handleSelectDefault(imageData)}
                >
                  <Image
                    source={imageData.source}
                    style={styles.defaultImage}
                  />
                  {currentSelection?.id === imageData.id && (
                    <View style={styles.selectedOverlay}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#007AFF"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.imagePickerFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !currentSelection && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!currentSelection}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FullPageRewardModal = ({
  visible,
  onClose,
  rewardsInput,
  setRewardsInput,
  onSubmit,
  isEditing,
  isLoading,
  insets,
}) => {
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const addNewReward = () => {
    setRewardsInput([
      ...rewardsInput,
      { xp: "", gift: "", image: DEFAULT_REWARD_IMAGES[0] },
    ]);
  };

  const removeReward = (index) => {
    if (rewardsInput.length > 1) {
      const newRewards = rewardsInput.filter((_, i) => i !== index);
      setRewardsInput(newRewards);
    }
  };

  const updateReward = (index, field, value) => {
    const newRewards = [...rewardsInput];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setRewardsInput(newRewards);
  };

  const handleImageSelect = (index) => {
    setActiveImageIndex(index);
    setImagePickerVisible(true);
  };

  const handleImageSelected = (image) => {
    updateReward(activeImageIndex, "image", image);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.fullPageModal}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.fullPageModal]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={onClose} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Reward" : "Create Rewards"}
            </Text>
            <TouchableOpacity
              onPress={onSubmit}
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {rewardsInput.map((reward, index) => (
              <View key={index} style={styles.rewardInputContainer}>
                <View style={styles.rewardHeader}>
                  <Text style={styles.rewardNumber}>Reward {index + 1}</Text>
                  {!isEditing && rewardsInput.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeReward(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.imageSelector}
                  onPress={() => handleImageSelect(index)}
                >
                  <View style={styles.imageContainer}>
                    {reward.image ? (
                      <Image
                        source={reward.image.source || reward.image}
                        style={styles.selectedRewardImage}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={40} color="#999" />
                      </View>
                    )}
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={20} color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.imageSelectorText}>
                    Tap to select image
                  </Text>
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>XP Required</Text>
                  <TextInput
                    style={styles.textInput}
                    value={reward.xp}
                    onChangeText={(text) => updateReward(index, "xp", text)}
                    placeholder="Enter XP amount"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Reward Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    value={reward.gift}
                    onChangeText={(text) => updateReward(index, "gift", text)}
                    placeholder="Enter reward description (max 300)"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                    maxLength={300}
                  />
                </View>
              </View>
            ))}

            {!isEditing && (
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={addNewReward}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.addAnotherText}>Add Another Reward</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <ImagePickerModal
            visible={imagePickerVisible}
            onClose={() => setImagePickerVisible(false)}
            onSelectImage={handleImageSelected}
            selectedImage={rewardsInput[activeImageIndex]?.image}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const RewardsScreen = forwardRef(({ hideHeader = false }, ref) => {
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [multipleRewardsInput, setMultipleRewardsInput] = useState([
    { xp: "", gift: "", image: DEFAULT_REWARD_IMAGES[0] },
  ]);
  const [editIndex, setEditIndex] = useState(null);

  const [duplicateInfo, setDuplicateInfo] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [role, setRole] = useState("owner");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  // Enhanced fetchRewards with iOS-specific caching
  const fetchRewards = useCallback(
    async (forceRefresh = false) => {
      if (
        !forceRefresh &&
        Platform.OS === "ios" &&
        rewards.length > 0 &&
        !isLoading
      ) {
        // On iOS, don't refetch if we already have data unless forced
        logRewardCreation("FetchSkipped", "Already have data");
        return;
      }

      setIsLoading(true);
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) {
          showToast({ type: "error", title: "Missing gym information" });
          return;
        }

        logRewardCreation("FetchStart", { gymId });
        const response = await getRewardsAPI(gymId);

        if (response?.status === 200) {
          const fetchedRewards = response?.data || [];
          logRewardCreation("FetchSuccess", { count: fetchedRewards.length });

          setRewards(fetchedRewards);

          // Preload custom images on iOS
          if (Platform.OS === "ios") {
            fetchedRewards.forEach((reward) => {
              if (reward.image_url && reward.image_url.startsWith("http")) {
                preloadCustomImage(reward.image_url);
              }
            });
          }
        } else {
          logRewardCreation("FetchError", response?.detail);
          showToast({
            type: "error",
            title: response?.detail || "Failed to fetch rewards",
          });
        }
      } catch (error) {
        logRewardCreation("FetchException", error.message);
        const errorMessage = "Something went wrong, please try again.";
        showToast({ type: "error", title: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
    [rewards.length, isLoading],
  );

  // Enhanced state management with iOS checks
  const updateRewardsState = useCallback(
    (newReward) => {
      logRewardCreation("StateUpdate-Before", {
        currentCount: rewards.length,
        newReward: { id: newReward.id, image_url: newReward.image_url },
      });

      if (Platform.OS === "ios") {
        // Use multiple approaches to ensure state update on iOS
        setRewards((prev) => {
          const updated = [...prev, newReward];
          logRewardCreation("StateUpdate-After", { newCount: updated.length });
          return updated;
        });

        // Force re-render on iOS
        setTimeout(() => {
          setRewards((prev) => [...prev]);
        }, 100);
      } else {
        setRewards((prev) => [...prev, newReward]);
      }
    },
    [rewards.length],
  );

  useEffect(() => {
    fetchRewards(true);

    getToken("role").then((role) => {
      setRole(role || "owner");
    });

    // Add iOS-specific listeners for app state changes
    if (Platform.OS === "ios") {
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === "active") {
          // Refresh when app becomes active on iOS
          setTimeout(() => {
            fetchRewards(true);
          }, 500);
        }
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange,
      );
      return () => subscription?.remove();
    }
  }, []);

  // Debug rewards state on iOS
  useEffect(() => {
    if (__DEV__ && Platform.OS === "ios") {
    }
  }, [rewards]);

  const handleShowDetails = useCallback((item) => {
    setSelectedReward(item);
    setIsDetailModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  const handleEditReward = useCallback((item, index) => {
    setEditIndex(index);
    setSelectedReward(item);

    let imageData = DEFAULT_REWARD_IMAGES[0];
    if (
      item.image_url &&
      (item.image_url.startsWith("http") || item.image_url.startsWith("https"))
    ) {
      imageData = {
        id: "custom_edit",
        source: { uri: item.image_url },
        isDefault: false,
        uri: item.image_url,
      };
    } else if (item.image_url && item.image_url.startsWith("default_")) {
      const defaultImage = DEFAULT_REWARD_IMAGES.find(
        (img) => img.id === item.image_url,
      );
      if (defaultImage) {
        imageData = defaultImage;
      }
    }

    setMultipleRewardsInput([
      {
        xp: item.xp.toString(),
        gift: item.gift,
        image: imageData,
      },
    ]);
    setIsAddEditModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  const handleDeleteReward = useCallback(async (item) => {
    Alert.alert(
      "Delete Reward",
      "Are you sure you want to delete this reward?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            setIsLoading(true);
            try {
              const gymId = await getToken("gym_id");
              if (!gymId) {
                showToast({ type: "error", title: "Missing gym information" });
                setIsLoading(false);
                return;
              }
              const response = await deleteRewardAPI(item.id, gymId);
              if (response?.status === 200 || response?.status === 204) {
                setRewards((prevRewards) =>
                  prevRewards.filter((reward) => reward.id !== item.id),
                );
                showToast({
                  type: "success",
                  title: "Reward deleted successfully",
                });
              } else {
                showToast({
                  type: "error",
                  title: response?.detail || "Failed to delete reward",
                });
              }
            } catch (error) {
              showToast({ type: "error", title: "Failed to delete reward" });
              console.error("Delete reward error:", error);
            } finally {
              setIsLoading(false);
              setOpenDropdownId(null);
            }
          },
          style: "destructive",
        },
      ],
    );
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditIndex(null);
    setMultipleRewardsInput([
      { xp: "", gift: "", image: DEFAULT_REWARD_IMAGES[0] },
    ]);
    setIsAddEditModalVisible(true);
    setOpenDropdownId(null);
  }, []);

  // Expose handleOpenAddModal to parent component via ref
  useImperativeHandle(ref, () => ({
    handleOpenAddModal,
  }));

  const handleCloseAddEditModal = useCallback(() => {
    if (Platform.OS === "ios") {
      // On iOS, delay the modal close and force refresh
      setTimeout(() => {
        setIsAddEditModalVisible(false);
        setEditIndex(null);
        setMultipleRewardsInput([
          { xp: "", gift: "", image: DEFAULT_REWARD_IMAGES[0] },
        ]);
        // Force refresh after modal closes
        setTimeout(() => {
          fetchRewards(true);
        }, 200);
      }, 100);
    } else {
      setIsAddEditModalVisible(false);
      setEditIndex(null);
      setMultipleRewardsInput([
        { xp: "", gift: "", image: DEFAULT_REWARD_IMAGES[0] },
      ]);
    }
  }, [fetchRewards]);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedReward(null);
  }, []);

  const hasImageChanged = (currentImage, originalReward) => {
    if (originalReward.image_url) {
      if (currentImage.isDefault) {
        return originalReward.image_url !== currentImage.id;
      } else {
        return currentImage.uri !== originalReward.image_url;
      }
    }
    return currentImage.id !== "default_rewards";
  };

  const handleUpdateReward = useCallback(
    async (updatedRewardData) => {
      try {
        const gymId = await getToken("gym_id");
        if (!gymId) {
          showToast({ type: "error", title: "GymId is not available" });
          return false;
        }

        const originalReward = selectedReward;
        const imageChanged = hasImageChanged(
          updatedRewardData.image,
          originalReward,
        );

        const basePayload = {
          gym_id: gymId,
          record_id: originalReward.id,
          updated_reward: {
            xp: parseInt(updatedRewardData.xp),
            gift: updatedRewardData.gift,
          },
        };

        if (imageChanged) {
          if (!updatedRewardData.image.isDefault) {
            const extension = getFileExtension(updatedRewardData.image.uri);
            const contentType = getContentType(extension);

            basePayload.updated_reward.extension = extension;
            basePayload.updated_reward.content_type = contentType;
          } else {
            if (updatedRewardData.image.id === "default_rewards") {
              basePayload.updated_reward.image_url = null;
            } else {
              basePayload.updated_reward.image_url = updatedRewardData.image.id;
            }
            basePayload.updated_reward.extension = "jpg";
            basePayload.updated_reward.content_type = "image/jpeg";
          }
        }

        const response = await updateRewardAPI(basePayload);

        if (response?.status === 200) {
          if (
            imageChanged &&
            !updatedRewardData.image.isDefault &&
            response.data?.presigned
          ) {
            try {
              await uploadImageToS3(
                response.data.presigned,
                updatedRewardData.image.uri,
              );

              const confirmPayload = {
                reward_id: response.data.reward_id,
                cdn_url: response.data.cdn_url,
              };

              const confirmResponse =
                await confirmRewardImageAPI(confirmPayload);

              if (confirmResponse?.status === 200) {
                setRewards((prev) =>
                  prev.map((r) =>
                    r?.id === originalReward?.id
                      ? {
                          ...r,
                          xp: parseInt(updatedRewardData.xp),
                          gift: updatedRewardData.gift,
                          image_url: confirmResponse.data,
                        }
                      : r,
                  ),
                );
                showToast({
                  type: "success",
                  title: "Reward updated successfully with new image",
                });
                return true;
              } else {
                showToast({
                  type: "error",
                  title: "Failed to confirm image upload",
                });
                return false;
              }
            } catch (uploadError) {
              console.error("Image upload error:", uploadError);
              showToast({
                type: "error",
                title: "Failed to upload image",
              });
              return false;
            }
          } else {
            let finalImageUrl = originalReward.image_url;

            if (imageChanged) {
              if (updatedRewardData.image.isDefault) {
                finalImageUrl =
                  updatedRewardData.image.id === "default_rewards"
                    ? null
                    : updatedRewardData.image.id;
              }
            }

            setRewards((prev) =>
              prev.map((r) =>
                r?.id === originalReward?.id
                  ? {
                      ...r,
                      xp: parseInt(updatedRewardData.xp),
                      gift: updatedRewardData.gift,
                      image_url: finalImageUrl,
                    }
                  : r,
              ),
            );
            showToast({
              type: "success",
              title: "Reward updated successfully",
            });
            return true;
          }
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Failed to update reward",
          });
          return false;
        }
      } catch (error) {
        showToast({ type: "error", title: "Failed to update reward" });
        return false;
      }
    },
    [selectedReward],
  );

  // Enhanced createNewReward function with better iOS handling
  const createNewReward = async (rewardData) => {
    try {
      const gymId = await getToken("gym_id");
      logRewardCreation("CreateStart", {
        rewardData: rewardData.gift.substring(0, 20),
      });

      let createPayload = {
        gym_id: parseInt(gymId),
        xp: parseInt(rewardData.xp),
        gift: rewardData.gift,
      };

      if (rewardData.image.isDefault) {
        if (rewardData.image.id === "default_rewards") {
          createPayload.image_url = null;
          createPayload.extension = "jpg";
          createPayload.content_type = "image/jpeg";
        } else {
          createPayload.image_url = rewardData.image.id;
          createPayload.extension = "jpg";
          createPayload.content_type = "image/jpeg";
        }
      } else {
        const extension = getFileExtension(rewardData.image.uri);
        const contentType = getContentType(extension);

        createPayload.extension = extension;
        createPayload.content_type = contentType;
      }

      const response = await createRewardAPI(createPayload);

      if (response?.status === 200) {
        let finalImageUrl = createPayload.image_url || null;

        // Handle custom image upload
        if (!rewardData.image.isDefault && response.data.presigned) {
          try {
            await uploadImageToS3(
              response.data.presigned,
              rewardData.image.uri,
            );
            finalImageUrl = response.data.cdn_url;
            logRewardCreation("CustomImageUploaded", { url: finalImageUrl });
          } catch (uploadError) {
            console.error("S3 upload failed:", uploadError);
            logRewardCreation("S3UploadFailed", uploadError);
            // Fallback to default image on upload failure
            finalImageUrl = null;
          }
        }

        // Always call confirm API, even for default images
        const confirmPayload = {
          reward_id: response.data.reward_id,
          cdn_url: finalImageUrl || "",
        };

        const confirmResponse = await confirmRewardImageAPI(confirmPayload);

        if (confirmResponse?.status === 200) {
          const newReward = {
            id: response.data.reward_id,
            gym_id: parseInt(gymId),
            xp: parseInt(rewardData.xp),
            gift: rewardData.gift,
            image_url: confirmResponse.data || finalImageUrl, // Use confirmResponse.data as primary
          };

          logRewardCreation("RewardCreated", {
            id: newReward.id,
            image_url: newReward.image_url,
          });

          // Enhanced state update for iOS
          if (Platform.OS === "ios") {
            // Use setTimeout to ensure state update happens after any pending renders
            setTimeout(() => {
              setRewards((prev) => {
                const updated = [...prev, newReward];
                logRewardCreation("StateUpdate-iOS", {
                  newCount: updated.length,
                });
                return updated;
              });
            }, 0);

            // Preload the image if it's custom
            if (newReward.image_url && newReward.image_url.startsWith("http")) {
              preloadCustomImage(newReward.image_url);
            }
          } else {
            setRewards((prev) => [...prev, newReward]);
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      logRewardCreation("CreateError", error);
      console.error("Create reward error:", error);
      return false;
    }
  };

  // Enhanced handleSubmitRewards with better iOS handling
  const handleSubmitRewards = useCallback(async () => {
    setIsLoading(true);
    const gymId = await getToken("gym_id");
    if (!gymId) {
      showToast({ type: "error", title: "Missing gym information" });
      setIsLoading(false);
      return;
    }

    const validRewardEntries = multipleRewardsInput.filter(
      (reward) => String(reward.xp).trim() !== "" && reward.gift.trim() !== "",
    );

    if (validRewardEntries.length === 0) {
      showToast({
        type: "error",
        title: "Please fill in at least one reward completely",
      });
      setIsLoading(false);
      return;
    }

    const internalDuplicates = [];
    const xpValues = [];

    validRewardEntries.forEach((reward, index) => {
      const xpValue = String(reward.xp).trim();
      const existingIndex = xpValues.findIndex((xp) => xp === xpValue);

      if (existingIndex !== -1) {
        const duplicateInfo = {
          xp: xpValue,
          rewards: [
            { index: existingIndex, reward: validRewardEntries[existingIndex] },
            { index: index, reward: reward },
          ],
        };

        const existingDuplicate = internalDuplicates.find(
          (dup) => dup.xp === xpValue,
        );
        if (existingDuplicate) {
          existingDuplicate.rewards.push({ index: index, reward: reward });
        } else {
          internalDuplicates.push(duplicateInfo);
        }
      } else {
        xpValues.push(xpValue);
      }
    });

    if (internalDuplicates.length > 0) {
      const duplicateXPList = internalDuplicates
        .map((dup) => dup.xp)
        .join(", ");
      const duplicateDetails = internalDuplicates
        .map((dup) => `${dup.xp} XP (${dup.rewards.length} rewards)`)
        .join(", ");

      Alert.alert(
        "Duplicate XP Values Found",
        `You have multiple rewards with the same XP values: ${duplicateDetails}.\n\nPlease ensure each reward has a unique XP value before saving.`,
        [
          {
            text: "OK",
            style: "default",
            onPress: () => setIsLoading(false),
          },
        ],
      );
      return;
    }

    if (editIndex !== null && selectedReward) {
      const rewardToUpdate = {
        ...validRewardEntries[0],
        id: selectedReward.id,
      };

      const existingConflictingReward = rewards.find(
        (r) =>
          String(r.xp).trim() === String(rewardToUpdate.xp).trim() &&
          r.id !== rewardToUpdate.id,
      );

      if (existingConflictingReward) {
        Alert.alert(
          "XP Already Exists",
          `A reward with ${rewardToUpdate.xp} XP already exists ("${existingConflictingReward.gift}"). Do you want to replace it with "${rewardToUpdate.gift}"?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsLoading(false),
            },
            {
              text: "Replace",
              onPress: async () => {
                try {
                  await deleteRewardAPI(existingConflictingReward.id, gymId);

                  const success = await handleUpdateReward(rewardToUpdate);

                  if (success) {
                    showToast({
                      type: "success",
                      title: "Reward updated and duplicate removed",
                    });
                    handleCloseAddEditModal();
                    await fetchRewards(true);
                  }
                } catch (error) {
                  console.error("Replace conflict error:", error);
                  showToast({
                    type: "error",
                    title: "Failed to resolve XP conflict",
                  });
                } finally {
                  setIsLoading(false);
                }
              },
              style: "destructive",
            },
          ],
        );
        return;
      } else {
        const success = await handleUpdateReward(rewardToUpdate);
        if (success) {
          // Delay modal closing on iOS to ensure state updates complete
          if (Platform.OS === "ios") {
            setTimeout(() => {
              handleCloseAddEditModal();
            }, 100);
          } else {
            handleCloseAddEditModal();
          }
        }
        setIsLoading(false);
        return;
      }
    } else {
      const duplicatesFound = [];
      const rewardsToCreate = [];

      for (const newReward of validRewardEntries) {
        const existingDuplicate = rewards.find(
          (r) => String(r.xp).trim() === String(newReward.xp).trim(),
        );

        if (existingDuplicate) {
          duplicatesFound.push({
            newReward: newReward,
            existingReward: existingDuplicate,
            type: "existingDuplicateInDB",
          });
        } else {
          rewardsToCreate.push(newReward);
        }
      }

      // Process rewards sequentially to avoid race conditions on iOS
      let successCount = 0;
      for (const reward of rewardsToCreate) {
        try {
          const success = await createNewReward(reward);
          if (success) {
            successCount++;
          }
          // Small delay between creations on iOS to ensure proper state updates
          if (Platform.OS === "ios" && rewardsToCreate.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.error("Error creating reward:", error);
        }
      }

      setIsLoading(false);

      if (duplicatesFound.length > 0) {
        setDuplicateInfo(duplicatesFound);
        setIsAddEditModalVisible(false);
        setTimeout(
          () => {
            setIsDuplicateModalVisible(true);
          },
          Platform.OS === "ios" ? 500 : 300,
        ); // Longer delay for iOS
      } else {
        // Close modal with delay on iOS
        if (Platform.OS === "ios") {
          setTimeout(() => {
            handleCloseAddEditModal();
          }, 200);
        } else {
          handleCloseAddEditModal();
        }

        if (successCount > 0) {
          showToast({
            type: "success",
            title: `${successCount} reward(s) created successfully`,
          });
        }
      }
    }
  }, [
    multipleRewardsInput,
    editIndex,
    selectedReward,
    rewards,
    handleCloseAddEditModal,
    handleUpdateReward,
    fetchRewards,
  ]);

  const handleDuplicateAction = useCallback(
    async (actionType, rewardPair) => {
      setIsLoading(true);
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({ type: "error", title: "Gym ID is not available" });
        setIsLoading(false);
        return;
      }

      const { newReward, existingReward } = rewardPair;

      if (actionType === "replace") {
        try {
          await deleteRewardAPI(existingReward.id, gymId);

          const success = await createNewReward(newReward);

          if (success) {
            showToast({
              type: "success",
              title: "Reward replaced successfully",
            });
          } else {
            showToast({
              type: "error",
              title: "Failed to replace reward",
            });
          }
        } catch (error) {
          console.error("Replace reward error:", error);
          showToast({
            type: "error",
            title: "Failed to replace reward",
          });
        }
      } else if (actionType === "addAnyway") {
        const success = await createNewReward(newReward);
        if (success) {
          showToast({
            type: "success",
            title: "Reward created successfully",
          });
        } else {
          showToast({
            type: "error",
            title: "Failed to create reward",
          });
        }
      }

      setDuplicateInfo((prevInfo) =>
        prevInfo.filter((item) => item !== rewardPair),
      );

      if (duplicateInfo.length === 1) {
        setIsDuplicateModalVisible(false);
        setDuplicateInfo([]);
        await fetchRewards(true);
      }
      setIsLoading(false);
    },
    [duplicateInfo, fetchRewards],
  );

  const handleToggleCardDropdown = useCallback((rewardId) => {
    setOpenDropdownId((prevId) => (prevId === rewardId ? null : rewardId));
  }, []);

  const handleCloseDuplicateModal = useCallback(async () => {
    setIsDuplicateModalVisible(false);
    setDuplicateInfo([]);
    await fetchRewards(true);
  }, [fetchRewards]);

  if (isLoading && rewards.length === 0) {
    return <PrizeSkeleton />;
  }

  return (
    <View
      style={[
        styles.container,
        !hideHeader && { paddingBottom: insets.bottom },
      ]}
    >
      {!hideHeader && (
        <HardwareBackHandler routePath="/owner/home" enabled={true} />
      )}

      {!hideHeader && (
        <NewOwnerHeader
          onBackButtonPress={() => router.push("/owner/home")}
          text={"Manage Fitness Rewards"}
        />
      )}

      {rewards.length === 0 && !isLoading ? (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="fitness" size={80} color="#007AFF" />
            <View style={styles.emptyIconOverlay}>
              <Ionicons name="trophy" size={40} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.emptyStateText}>No Rewards Yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create exciting rewards to keep your members motivated!
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleOpenAddModal();
            }}
          >
            <Text style={styles.startButtonText}>Create First Reward</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <>
          {openDropdownId && (
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => setOpenDropdownId(null)}
              activeOpacity={1}
            />
          )}

          <Pressable
            onPress={() => setOpenDropdownId(null)}
            style={{ height: "100%", paddingBottom: 50 }}
          >
            <FlatList
              data={isLoading ? [1, 2, 3, 4, 5] : rewards}
              renderItem={({ item, index }) => {
                return isLoading ? (
                  <ShimmerNewsArticle
                    showImage={true}
                    imagePosition="left"
                    style={styles.newsShimmer}
                  />
                ) : (
                  <RewardCard
                    item={item}
                    index={index}
                    onPress={() => handleShowDetails(item)}
                    onEdit={handleEditReward}
                    onDelete={handleDeleteReward}
                    isDropdownOpen={openDropdownId === item?.id}
                    onToggleDropdown={handleToggleCardDropdown}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                    getImageSource={getRewardImageSource}
                    role={role}
                  />
                );
              }}
              keyExtractor={(item, index) =>
                isLoading ? `shimmer-${index}` : item?.id?.toString()
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </>
      )}

      {((!isLoading && rewards.length > 0) ||
        (!isLoading && rewards.length === 0 && isAddEditModalVisible)) &&
        role !== "trainer" &&
        !hideHeader && (
          <>
            <TouchableOpacity
              style={[styles.fab, { bottom: insets.bottom + 20 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleOpenAddModal();
              }}
            >
              <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
          </>
        )}

      <FullPageRewardModal
        visible={isAddEditModalVisible}
        onClose={handleCloseAddEditModal}
        rewardsInput={multipleRewardsInput}
        setRewardsInput={setMultipleRewardsInput}
        onSubmit={handleSubmitRewards}
        isEditing={editIndex !== null}
        isLoading={isLoading}
        insets={insets}
      />

      <RewardDetailsModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        reward={selectedReward}
        getImageSource={getRewardImageSource} // Pass the enhanced image resolver
      />

      {Platform.OS === "ios" ? (
        <Modal
          visible={isDuplicateModalVisible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          presentationStyle="overFullScreen"
          onRequestClose={handleCloseDuplicateModal}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseDuplicateModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <DuplicateXPConfirmationModal
                visible={isDuplicateModalVisible}
                duplicatePairs={duplicateInfo}
                onAction={handleDuplicateAction}
                onClose={handleCloseDuplicateModal}
                isLoading={isLoading}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        isDuplicateModalVisible && (
          <DuplicateXPConfirmationModal
            visible={isDuplicateModalVisible}
            duplicatePairs={duplicateInfo}
            onAction={handleDuplicateAction}
            onClose={handleCloseDuplicateModal}
            isLoading={isLoading}
          />
        )
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  emptyIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    padding: 5,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    elevation: 3,
  },
  startButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 500,
  },
  newsShimmer: {
    marginVertical: 8,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullPageModal: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFF",
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  rewardInputContainer: {
    backgroundColor: "#FFF",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rewardNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  imageSelector: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  selectedRewardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  imageOverlay: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#007AFF",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  imageSelectorText: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  addAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  addAnotherText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Image Picker Modal Styles
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerContainer: {
    backgroundColor: "#FFF",
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: "hidden",
  },
  imagePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  imagePickerContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  defaultImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imageOption: {
    width: (width * 0.9 - 48) / 2 - 8,
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedImageOption: {
    borderColor: "#007AFF",
  },
  defaultImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  selectedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 2,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  customImagePreview: {
    alignItems: "center",
  },
  customImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  imagePickerFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
});

export default RewardsScreen;
