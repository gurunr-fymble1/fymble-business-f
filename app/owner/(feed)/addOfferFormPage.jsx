import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  MaterialIcons,
  Ionicons,
  Entypo,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { useRouter, useLocalSearchParams } from "expo-router";
import { showToast } from "../../../utils/Toaster";
import {
  confirmOfferImage,
  createOfferWithImage,
  postGymOffersAPI,
  updateGymOffersAPI,
  updateOfferWithImage,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
};

const formatDate = (dateString) => {
  const options = { month: "long", day: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const CATEGORIES = [
  { id: "membership", name: "Membership", icon: "id-card" },
  { id: "guest", name: "Guest Pass", icon: "user-friends" },
  { id: "training", name: "Training", icon: "dumbbell" },
  { id: "nutrition", name: "Nutrition", icon: "utensils" },
  { id: "merchandise", name: "Merchandise", icon: "tshirt" },
];

const TAGS = [
  { id: "new", name: "New" },
  { id: "popular", name: "Popular" },
  { id: "limited", name: "Limited Time" },
  { id: "exclusive", name: "Exclusive" },
  { id: "sale", name: "On Sale" },
];

const uploadImageToS3 = async (presignedData, imageUri) => {
  try {
    const formData = new FormData();

    Object.keys(presignedData.fields).forEach((key) => {
      formData.append(key, presignedData.fields[key]);
    });

    formData.append("file", {
      uri: imageUri,
      type: presignedData.fields["Content-Type"],
      name: `offer_image.${getFileExtension(imageUri)}`,
    });

    const response = await fetch(presignedData.url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

const getFileExtension = (uri) => {
  const parts = uri.split(".");
  return parts[parts.length - 1] || "jpg";
};

const getContentType = (extension) => {
  const ext = extension.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
};

const OfferPreview = ({ offer, isEven = true, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.offerContainer,
        isEven ? styles.offerEven : styles.offerOdd,
      ]}
      onPress={() => onPress && onPress(offer)}
      activeOpacity={0.9}
    >
      <View style={styles.offerImageContainer}>
        <LinearGradient
          colors={["#30818B", "#73C4CB"]}
          style={styles.offerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={
              offer?.bannerImage?.uri
                ? offer.bannerImage.uri
                : require("../../../assets/images/offer_card.png")
            }
            contentFit="cover"
            style={{ width: "100%", height: "55%" }}
          />
          <View style={styles.offerDetails}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerSubtitle}>{offer.description}</Text>
            <View style={styles.offerValidUntil}>
              <Ionicons
                name="time-outline"
                size={responsiveFontSize(14)}
                color="#FFF"
              />
              <Text style={styles.offerValidText}>
                Valid until {formatDate(offer.validity)}
              </Text>
            </View>
            <View style={styles.offerFooter}>
              <Text style={styles.offerCode}>Code: {offer.code}</Text>
              <View style={styles.viewDetailsContainer}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Entypo
                  name="chevron-right"
                  size={responsiveFontSize(14)}
                  color="#FFF"
                />
              </View>
            </View>
            <View style={styles.offerBadge}>
              <View style={styles.offerBadgeContainer}>
                <Image
                  source={require("../../../assets/images/offer_badge.png")}
                  contentFit="contain"
                  style={{ width: "100%", height: "100%" }}
                />
                <View style={styles.offerBadgeText}>
                  <Text style={styles.offerText1}>SPECIAL</Text>
                  <Text style={styles.offerText2}>OFFER</Text>
                  <Text style={styles.offerDiscount}>{offer.discount} %</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const FormField = ({
  label,
  placeholder,
  iconName,
  value,
  onChangeText,
  keyboardType,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  onFocus,
  rightIcon,
  style = {},
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.textAreaWrapper,
          style,
        ]}
      >
        {iconName && (
          <MaterialIcons
            name={iconName}
            size={20}
            color="#8E8E93"
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={onFocus}
        />
        {rightIcon}
      </View>
    </View>
  );
};

const OfferForm = ({
  initialFormData = {},
  onSubmit,
  onCancel,
  headerComponent,
  submitButtonText = "Create Offer",
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { offer } = useLocalSearchParams();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Add temporary date state for iOS picker
  const [tempDate, setTempDate] = useState(new Date());
  const [isUploading, setIsUploading] = useState(false);
  const [offerId, setOfferId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [formData, setFormData] = useState({
    gym_id: "",
    title: "",
    subdescription: "",
    description: "",
    discount: "",
    validity: new Date(),
    code: "",
    tag: "",
    category: "membership",
    bannerImage: null,
    uploadedImageUrl: null,
    ...initialFormData,
  });

  useEffect(() => {
    if (offer) {
      try {
        const offerData = JSON.parse(offer);
        setOfferId(offerData.id);

        setFormData({
          title: offerData.title || "",
          subdescription: offerData.subdescription || "",
          description: offerData.description || "",
          discount: offerData.discount
            ? offerData.discount.toString().replace("%", "")
            : "",
          validity: offerData.validity || "",
          code: offerData.code || "",
          tag: offerData.tag || "",
          category: offerData.category || "membership",
          bannerImage:
            offerData.image_url || offerData.image
              ? { uri: offerData.image_url || offerData.image }
              : null,
          uploadedImageUrl: offerData.image_url || offerData.image || null,
        });

        if (offerData.validity) {
          setSelectedDate(new Date(offerData.validity));
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Could not load offer data for editing",
        });
      }
    }
  }, [offer]);

  const validateImageRatio = (imageUri) => {
    return new Promise((resolve) => {
      RNImage.getSize(
        imageUri,
        (width, height) => {
          const aspectRatio = width / height;
          const expectedRatio = 2.0;
          const tolerance = 0.05;

          if (Math.abs(aspectRatio - expectedRatio) <= tolerance) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(true);
        }
      );
    });
  };

  const pickImage = async () => {
    try {
      setIsImageUploading(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({
          type: "error",
          title: "Camera roll permissions are required to upload images!",
        });
        setIsImageUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        const isValidRatio = await validateImageRatio(imageUri);

        if (!isValidRatio) {
          showToast({
            type: "error",
            title: "Invalid Image Ratio",
            desc: "Image should have a 2:1 ratio. Please try cropping again or select a different image.",
          });
          setIsImageUploading(false);
          return;
        }

        setFormData((prev) => ({
          ...prev,
          bannerImage: { uri: imageUri },
          uploadedImageUrl: null,
        }));

        showToast({
          type: "success",
          title:
            "New image selected! It will be uploaded when you save the offer.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error picking image. Please try again.",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      bannerImage: null,
      uploadedImageUrl: null,
    }));
    showToast({
      type: "success",
      title: "Image removed successfully!",
    });
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        setSelectedDate(selectedDate);
        const formattedDate = selectedDate.toISOString().split("T")[0];
        setFormData({ ...formData, validity: formattedDate });
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    const formattedDate = tempDate.toISOString().split("T")[0];
    setFormData({ ...formData, validity: formattedDate });
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const selectCategory = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    setShowCategoryModal(false);
  };

  const getCategoryName = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.name : "Select Category";
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const validateForm = () => {
    const requiredFields = ["title", "description", "validity", "category"];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (
        !formData[field] ||
        (typeof formData[field] === "string" && formData[field].trim() === "")
      ) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      showToast({
        type: "error",
        title: "Missing Information",
        desc: `Please fill in all required fields: ${missingFields.join(", ")}`,
      });
      return false;
    }

    if (formData.validity) {
      const today = new Date();
      const validDate = new Date(formData.validity);

      if (validDate < today) {
        showToast({
          type: "error",
          title: "Invalid Date",
          desc: "Please select a future date for the offer validity.",
        });
        return false;
      }
    }

    return true;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const gymId = await getToken("gym_id");

      if (offerId) {
        if (!formData.bannerImage || formData.uploadedImageUrl) {
          const updateData = {
            ...formData,
            gym_id: gymId,
            offer_id: offerId,
            image_url: formData.uploadedImageUrl,
          };

          const response = await updateGymOffersAPI(updateData);
          if (response.status === 200) {
            showToast({
              type: "success",
              title: "Offer updated successfully!",
            });
            router.push({
              pathname: "/owner/(tabs)/home",
              params: { activeTab: "My Gym", analyticsTab: "offers" },
            });
          }
          return;
        }

        if (formData.bannerImage && !formData.uploadedImageUrl) {
          setUploadProgress(25);

          const extension = getFileExtension(formData.bannerImage.uri);
          const contentType = getContentType(extension);

          const updateOfferData = {
            gym_id: parseInt(gymId),
            offer_id: offerId,
            title: formData.title,
            description: formData.description,
            validity: formData.validity,
            discount: parseFloat(formData.discount) || 0,
            category: formData.category,
            code: formData.code || "",
            extension: extension,
            content_type: contentType,
          };

          const createResponse = await updateOfferWithImage(updateOfferData);
          setUploadProgress(50);

          await uploadImageToS3(
            createResponse.data.presigned,
            formData.bannerImage.uri
          );
          setUploadProgress(75);

          await confirmOfferImage(
            createResponse.data.offer_id,
            createResponse.data.cdn_url
          );
          setUploadProgress(100);

          showToast({
            type: "success",
            title: "Offer updated successfully with new image!",
          });
          router.push({
            pathname: "/owner/(tabs)/home",
            params: { activeTab: "My Gym", analyticsTab: "offers" },
          });
          return;
        }
      } else {
        if (formData.bannerImage) {
          setUploadProgress(25);

          const extension = getFileExtension(formData.bannerImage.uri);
          const contentType = getContentType(extension);

          const createOfferData = {
            gym_id: parseInt(gymId),
            title: formData.title,
            description: formData.description,
            validity: formData.validity,
            discount: parseFloat(formData.discount) || 0,
            category: formData.category,
            code: formData.code || "",
            extension: extension,
            content_type: contentType,
          };

          const createResponse = await createOfferWithImage(createOfferData);
          setUploadProgress(50);

          await uploadImageToS3(
            createResponse.data.presigned,
            formData.bannerImage.uri
          );
          setUploadProgress(75);

          await confirmOfferImage(
            createResponse.data.offer_id,
            createResponse.data.cdn_url
          );
          setUploadProgress(100);

          showToast({
            type: "success",
            title: "Offer created successfully with image!",
          });
          router.push({
            pathname: "/owner/(tabs)/home",
            params: { activeTab: "My Gym", analyticsTab: "offers" },
          });
          return;
        } else {
          const offerData = {
            ...formData,
            gym_id: gymId,
          };

          const response = await postGymOffersAPI(offerData);
          if (response.status === 200) {
            showToast({
              type: "success",
              title: "Offer created successfully!",
            });
            router.push({
              pathname: "/owner/(tabs)/home",
              params: { activeTab: "My Gym", analyticsTab: "offers" },
            });
            return;
          }
        }
      }

      //
      router.push({
        pathname: "/owner/(tabs)/home",
        params: { activeTab: "My Gym", analyticsTab: "offers" },
      });
    } catch (error) {
      console.error("Form submission error:", error);

      let errorMessage = `An error occurred while ${
        offerId ? "updating" : "creating"
      } the offer. Please try again.`;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast({
        type: "error",
        title: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const previewData = {
    id: "1",
    title: formData.title || "New Offer",
    description: formData.description || "Description",
    discount: formData.discount || "0",
    validity: formData.validity || "2025-12-31",
    category: formData.category || "membership",
    code: formData.code || "CODE",
    bannerImage: formData.bannerImage?.uri
      ? { uri: formData.bannerImage.uri }
      : null,
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? insets.top : 0 },
      ]}
    >
      {headerComponent}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <NewOwnerHeader
          onBackButtonPress={() =>
            router.push({
              pathname: "/owner/(tabs)/home",
              params: { activeTab: "My Gym", analyticsTab: "offers" },
            })
          }
          text={offer ? "Update Offer Details" : "Add New Offer Details"}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <OfferPreview
              offer={previewData}
              isEven={true}
              onPress={() => {}}
            />

            <FormField
              label="Offer Title"
              placeholder="E.g., Summer Special"
              iconName="local-offer"
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
            />

            <FormField
              label="Description"
              placeholder="Describe your offer in detail..."
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline={true}
              numberOfLines={4}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Banner Image (Optional)</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, styles.uploadContainer]}
                onPress={pickImage}
                activeOpacity={0.8}
                disabled={isImageUploading || isUploading}
              >
                <MaterialIcons
                  name="add-photo-alternate"
                  size={24}
                  color="#8E8E93"
                  style={styles.uploadIcon}
                />
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadText}>
                    {isImageUploading
                      ? "Selecting Image..."
                      : formData.bannerImage
                      ? formData.uploadedImageUrl
                        ? "Change Existing Image"
                        : "Change Selected Image"
                      : "Upload Banner Image"}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    {isImageUploading
                      ? "Please wait..."
                      : formData.bannerImage
                      ? formData.uploadedImageUrl
                        ? "Current image • Tap to change • Will upload new on save"
                        : "New image selected • Will upload on save"
                      : "2:1 aspect ratio "}
                  </Text>
                </View>
                {formData.bannerImage?.uri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={formData.bannerImage.uri || null}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                      activeOpacity={0.7}
                      disabled={isUploading}
                    >
                      <MaterialIcons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </TouchableOpacity>

              {isUploading && uploadProgress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {uploadProgress < 50
                      ? offerId
                        ? "Updating offer..."
                        : "Creating offer..."
                      : uploadProgress < 75
                      ? "Uploading image..."
                      : uploadProgress < 100
                      ? "Finalizing..."
                      : "Complete!"}
                  </Text>
                </View>
              )}
            </View>

            <FormField
              label="Discount"
              placeholder="E.g., 20% or $50"
              iconName="discount"
              value={formData.discount}
              onChangeText={(text) => handleInputChange("discount", text)}
              keyboardType="numeric"
            />

            <FormField
              label="Valid Until"
              placeholder="Select end date"
              iconName="date-range"
              value={formatDate(formData.validity)}
              onChangeText={(text) => handleInputChange("validity", text)}
              onFocus={() => {
                setTempDate(selectedDate);
                setShowDatePicker(true);
              }}
            />

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.label}>Category</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="category"
                  size={20}
                  color="#8E8E93"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    {
                      color: formData.category ? "#000" : "#8E8E93",
                      marginTop: 35,
                    },
                  ]}
                >
                  {getCategoryName(formData.category)}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#8E8E93"
                />
              </View>
            </TouchableOpacity>

            <FormField
              label="Promo Code (Optional)"
              placeholder="E.g., SUMMER20"
              iconName="confirmation-number"
              value={formData.code}
              onChangeText={(text) => handleInputChange("code", text)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={cancelDateSelection}
        >
          <TouchableWithoutFeedback onPress={cancelDateSelection}>
            <View style={styles.pickerModalContainer}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={cancelDateSelection}>
                      <Text style={styles.pickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select Validity Date</Text>
                    <TouchableOpacity onPress={confirmDateSelection}>
                      <Text style={styles.pickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    themeVariant="light"
                    textColor="#000000"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    style={styles.iosPickerStyle}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={styles.modalScrollView}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.id &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => selectCategory(category.id)}
                >
                  <FontAwesome5
                    name={category.icon}
                    size={20}
                    color={
                      formData.category === category.id ? "#fff" : "#8E8E93"
                    }
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === category.id &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.buttonContainer, { bottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isUploading || isImageUploading) && styles.submitButtonDisabled,
          ]}
          onPress={handleFormSubmit}
          activeOpacity={0.8}
          disabled={isUploading || isImageUploading}
        >
          <LinearGradient
            colors={
              isUploading || isImageUploading
                ? ["#A0A0A0", "#808080"]
                : ["#1DA1F2", "#1DA1F2"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.submitButtonText}>
              {isImageUploading
                ? "Selecting Image..."
                : isUploading
                ? `Saving... ${uploadProgress}%`
                : offer
                ? "Update Offer"
                : submitButtonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AddOfferFormPage = () => {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <OfferForm onCancel={handleCancel} />
    </View>
  );
};

export default AddOfferFormPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D2D2D",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  inputIcon: {
    marginRight: 12,
  },
  uploadContainer: {
    padding: 15,
    height: "auto",
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
  },
  uploadIcon: {
    marginRight: 15,
  },
  uploadTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  uploadText: {
    fontSize: 16,
    color: "#2D2D2D",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#8E8E93",
  },
  imagePreviewContainer: {
    position: "relative",
  },
  previewImage: {
    width: 80,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5757",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1DA1F2",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    textAlign: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#2D2D2D",
    fontSize: 16,
  },
  textAreaWrapper: {
    height: 120,
    alignItems: "flex-start",
    paddingTop: 16,
  },
  textArea: {
    textAlignVertical: "top",
    paddingRight: 16,
  },
  buttonContainer: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    marginRight: responsiveWidth(1),
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    width: "85%",
    maxHeight: "70%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryItemSelected: {
    backgroundColor: "#1da1f2",
  },
  categoryIcon: {
    width: 24,
    textAlign: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: "#555",
  },
  categoryTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  // iOS Picker Modal Styles (added from previous examples)
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#1DA1F2",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  //------------ Offer Card Styling --------------------
  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    minHeight: responsiveHeight(30),
    maxHeight: responsiveHeight(35),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
  },
  offerDetails: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#196A75",
    borderBottomEndRadius: 10,
    height: "45%",
    padding: 10,
  },
  offerOdd: {
    backgroundColor: "#F5F5FF",
  },
  offerImageContainer: {
    height: "100%",
    width: "100%",
  },
  offerImage: {
    height: "100%",
    width: "100%",
  },
  offerImageStyle: {
    borderRadius: responsiveWidth(3),
  },
  offerGradient: {
    height: "100%",
    width: "100%",
    justifyContent: "space-between",
    borderRadius: responsiveWidth(3),
  },
  offerTag: {
    position: "absolute",
    top: responsiveHeight(1),
    right: responsiveWidth(4),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2),
  },
  offerTagText: {
    color: "#333",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
  offerIconContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(1),
  },
  offerBadgeContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 70,
    height: 70,
  },
  offerText1: {
    fontSize: 10,
    fontWeight: 400,
    color: "#A32669",
    textAlign: "center",
  },
  offerBadgeText: {
    position: "absolute",
    top: 3,
    right: 0,
    left: 0,
  },
  offerText2: {
    fontSize: 12,
    fontWeight: 900,
    color: "#D7001D",
    textAlign: "center",
  },
  offerDiscount: {
    color: "#000",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    textAlign: "center",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(15),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    opacity: 0.9,
    width: "80%",
    marginTop: responsiveHeight(0.5),
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(10),
    marginLeft: responsiveWidth(1),
    opacity: 0.9,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerCode: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "bold",
  },
});
