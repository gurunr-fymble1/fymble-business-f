import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import ImagePreviewBox from "./ImagePreviewBox";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

// Removed file size and aspect ratio restrictions for brochures

const ImageUploadModal = ({
  visible,
  onClose,
  images,
  setImages,
  maxImages = 6,
  postTheGymBrochures,
  onDeleteImage,
  uploading,
}) => {
  const validateImage = async (imageUri, fileSize, width, height) => {
    // No validation needed - all images are accepted
    return true;
  };

  const getImagePickerOptions = () => {
    // No editing or aspect ratio restrictions
    return {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    };
  };

  const handleImageSelection = async (asset) => {
    // Use the dimensions from the asset if available, otherwise get them
    let imageWidth = asset.width;
    let imageHeight = asset.height;

    if (!imageWidth || !imageHeight) {
      // Fallback: get dimensions if not provided
      await new Promise((resolve) => {
        Image.getSize(
          asset.uri,
          (width, height) => {
            imageWidth = width;
            imageHeight = height;
            resolve();
          },
          () => {
            // If we can't get dimensions, use asset dimensions or defaults
            imageWidth = asset.width || 1000;
            imageHeight = asset.height || 1000;
            resolve();
          }
        );
      });
    }

    const isValid = await validateImage(
      asset.uri,
      asset.fileSize,
      imageWidth,
      imageHeight
    );

    if (isValid) {
      const newImage = {
        id: `image-${Date.now()}-${Math.random()}`,
        source: { uri: asset.uri },
        width: imageWidth,
        height: imageHeight,
        fileSize: asset.fileSize,
      };

      // Upload immediately to S3
      const updatedImages = [...images, newImage];
      await postTheGymBrochures(updatedImages);
    }
  };

  const pickImage = async () => {
    try {
      if (images.length >= maxImages) {
        showToast({
          type: "error",
          title: `You can only add up to ${maxImages} images.`,
        });
        return;
      }

      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast({
            type: "error",
            title: "Permission denied",
            desc: "We need camera roll permissions to upload images",
          });
          return;
        }
      }

      // Show picker option to choose from gallery or camera
      Alert.alert("Upload Image", "Choose an option", [
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
                desc: "We need camera permissions to take photos",
              });
              return;
            }
            const result = await ImagePicker.launchCameraAsync(
              getImagePickerOptions()
            );
            if (!result.canceled && result.assets?.[0]) {
              await handleImageSelection(result.assets[0]);
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync(
              getImagePickerOptions()
            );
            if (!result.canceled && result.assets?.[0]) {
              await handleImageSelection(result.assets[0]);
            }
          },
        },
      ]);
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to pick image",
      });
    }
  };

  const replaceImage = async (index) => {
    try {
      if (index < 0 || index >= images.length) {
        showToast({
          type: "error",
          title: "Invalid index for replacement",
        });
        return;
      }

      const imageToReplace = images[index];

      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast({
            type: "error",
            title: "Permission denied",
            desc: "We need camera roll permissions to upload images",
          });
          return;
        }
      }

      // Show picker option to choose from gallery or camera
      Alert.alert("Replace Image", "Choose an option", [
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
                desc: "We need camera permissions to take photos",
              });
              return;
            }
            const result = await ImagePicker.launchCameraAsync(
              getImagePickerOptions()
            );
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              let imageWidth = asset.width;
              let imageHeight = asset.height;

              if (!imageWidth || !imageHeight) {
                await new Promise((resolve) => {
                  Image.getSize(
                    asset.uri,
                    (width, height) => {
                      imageWidth = width;
                      imageHeight = height;
                      resolve();
                    },
                    () => {
                      imageWidth = asset.width || 1000;
                      imageHeight = asset.height || 1000;
                      resolve();
                    }
                  );
                });
              }

              const isValid = await validateImage(
                asset.uri,
                asset.fileSize,
                imageWidth,
                imageHeight
              );

              if (isValid) {
                // Delete old brochure first
                if (imageToReplace.brochureId) {
                  await onDeleteImage(index);
                }

                // Upload new brochure
                const newImage = {
                  id: `image-${Date.now()}-${Math.random()}`,
                  source: { uri: asset.uri },
                  width: imageWidth,
                  height: imageHeight,
                  fileSize: asset.fileSize,
                };

                const updatedImages = [...images];
                updatedImages[index] = newImage;
                await postTheGymBrochures(updatedImages);
              }
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync(
              getImagePickerOptions()
            );
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              let imageWidth = asset.width;
              let imageHeight = asset.height;

              if (!imageWidth || !imageHeight) {
                await new Promise((resolve) => {
                  Image.getSize(
                    asset.uri,
                    (width, height) => {
                      imageWidth = width;
                      imageHeight = height;
                      resolve();
                    },
                    () => {
                      imageWidth = asset.width || 1000;
                      imageHeight = asset.height || 1000;
                      resolve();
                    }
                  );
                });
              }

              const isValid = await validateImage(
                asset.uri,
                asset.fileSize,
                imageWidth,
                imageHeight
              );

              if (isValid) {
                // Delete old brochure first
                if (imageToReplace.brochureId) {
                  await onDeleteImage(index);
                }

                // Upload new brochure
                const newImage = {
                  id: `image-${Date.now()}-${Math.random()}`,
                  source: { uri: asset.uri },
                  width: imageWidth,
                  height: imageHeight,
                  fileSize: asset.fileSize,
                };

                const updatedImages = [...images];
                updatedImages[index] = newImage;
                await postTheGymBrochures(updatedImages);
              }
            }
          },
        },
      ]);
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to replace image",
      });
    }
  };

  const removeImage = async (index) => {
    if (index < 0 || index >= images.length) {
      return;
    }

    const imageToRemove = images[index];

    if (imageToRemove.serverPath || imageToRemove.brochureId) {
      await onDeleteImage(index);
    }
  };

  const renderItem = ({ item, index }) => {
    const isPlaceholder = item.isPlaceholder === true;

    return (
      <View style={styles.dragItem}>
        <ImagePreviewBox
          image={item}
          index={index}
          onRemove={() => !isPlaceholder && removeImage(index)}
          onReplace={() => !isPlaceholder && replaceImage(index)}
          onAddImage={pickImage}
          isPlaceholder={isPlaceholder}
          isSelected={false}
        />
      </View>
    );
  };

  const getRequirementsText = () => {
    return "Upload images from camera or gallery";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Brochures</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={uploading}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.requirementsText}>{getRequirementsText()}</Text>
          </View>

          <FlatList
            data={[
              ...images,
              ...Array(Math.max(0, maxImages - images.length)).fill({
                isPlaceholder: true,
              }),
            ]}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || `placeholder-${index}`}
            numColumns={3}
            contentContainerStyle={styles.imageGridContainer}
            style={styles.imageGrid}
          />

          {uploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  instructions: {
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  swapInstructions: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 5,
  },
  requirementsText: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  iosHint: {
    fontSize: 12,
    color: "#FF9500",
    marginTop: 3,
    fontStyle: "italic",
  },
  closeButton: {
    padding: 5,
  },
  imageGrid: {
    maxHeight: height * 0.5,
  },
  imageGridContainer: {
    paddingVertical: 10,
  },
  dragItem: {
    margin: 2,
  },
  selectedForSwap: {
    borderWidth: 2,
    borderColor: "#FF5757",
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
    minWidth: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#007bffb8",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginTop: 15,
  },
  uploadingText: {
    marginLeft: 10,
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ImageUploadModal;
