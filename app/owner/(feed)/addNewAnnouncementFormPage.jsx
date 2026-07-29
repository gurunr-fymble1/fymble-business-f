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
  ImageBackground,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NewOwnerHeader from "../../../components/ui/Header/NewOwnerHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  postGymAnnouncementsAPI,
  updateGymAnnouncementsAPI,
} from "../../../services/Api";
import { getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const responsiveWidth = (percentage) => width * (percentage / 100);
const responsiveHeight = (percentage) => height * (percentage / 100);
const responsiveFontSize = (fontSize) => {
  const standardScreenHeight = 820;
  const standardFontScale = fontSize / standardScreenHeight;
  return Math.round(height * standardFontScale);
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
  submitButtonText = "Post Announcement",
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUploading, setIsUploading] = useState(false);

  const { announcement } = useLocalSearchParams();
  const [announcementId, setAnnouncementId] = useState(null);
  const [activePriority, setActivePriority] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: activePriority,
  });

  useEffect(() => {
    if (announcement) {
      let data = JSON.parse(announcement);
      setAnnouncementId(data.id);
      setFormData({
        title: data.title,
        description: data.content,
        priority: data.priority,
      });
      setActivePriority(data.priority);
    }
  }, [announcement]);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      showToast({
        type: "error",
        title: "Please enter a title for your announcement",
      });
      return;
    }

    if (!formData.description.trim()) {
      showToast({
        type: "error",
        title: "Please enter a description for your announcement",
      });
      return;
    }

    setIsUploading(true);

    try {
      const currentDateTime = new Date();
      const gymId = await getToken("gym_id");

      const payload = {
        gym_id: gymId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        datetime: currentDateTime,
        priority: formData.priority,
      };

      let response;

      if (announcementId) {
        payload.announcement_id = announcementId;

        response = await updateGymAnnouncementsAPI(payload);
      } else {
        response = await postGymAnnouncementsAPI(payload);
      }

      if (response.status === 200) {
        showToast({
          type: "success",
          title: announcementId
            ? "Announcement updated successfully!"
            : "Announcement posted successfully!",
        });
        router.push({
          pathname: "/owner/(tabs)/home",
          params: { activeTab: "My Gym", analyticsTab: "announcements" },
        });
      } else {
        showToast({
          type: "error",
          title:
            response.message ||
            `Failed to ${
              announcementId ? "update" : "post"
            } announcement. Please try again.`,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: `An error occurred while ${
          announcementId ? "updating" : "posting"
        } the announcement. Please try again.`,
      });
    } finally {
      setIsUploading(false);
    }
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
              params: { activeTab: "My Gym", analyticsTab: "announcements" },
            })
          }
          text={announcement ? "Update Announcement" : "Post Announcement"}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <FormField
              label="Title"
              placeholder="E.g., Holiday Announcement"
              iconName="local-offer"
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
            />

            <FormField
              label="Description"
              placeholder="Describe your announcement in detail..."
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline={true}
              numberOfLines={4}
            />

            <View>
              <Text style={styles.label}>Priority</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {["high", "medium", "low"]?.map((item) => {
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setActivePriority(item);
                        handleInputChange("priority", item);
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        padding: 10,
                        borderRadius: 8,
                        width: "30%",
                        borderColor:
                          activePriority === item ? "#003cff" : "#ccc",
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          color:
                            activePriority === item ? "#003cff" : "#a7a7a7",
                          fontWeight:
                            activePriority === item ? "bold" : "normal",
                          textTransform: "capitalize",
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.buttonContainer, { bottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleFormSubmit}
          activeOpacity={0.8}
          disabled={isUploading}
        >
          <LinearGradient
            colors={["#FF5757", "#FF5757"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.submitButtonText}>
              {isUploading
                ? "Saving..."
                : announcement
                ? "Update Announcement"
                : submitButtonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OfferForm;

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
  previewImage: {
    width: 80,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
    backgroundColor: "#FFF5F5",
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
    color: "#FF5757",
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

  offerContainer: {
    marginBottom: responsiveHeight(2.5),
    borderRadius: responsiveWidth(3),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    height: responsiveHeight(30),
  },
  offerEven: {
    backgroundColor: "#FFF5F5",
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
    padding: responsiveWidth(4),
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
  offerDiscount: {
    color: "#FFF",
    fontSize: responsiveFontSize(28),
    fontWeight: "bold",
  },
  offerTitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    marginTop: responsiveHeight(0.5),
  },
  offerSubtitle: {
    color: "#FFF",
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
    marginTop: responsiveHeight(0.5),
  },
  offerValidUntil: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(1),
  },
  offerValidText: {
    color: "#FFF",
    fontSize: responsiveFontSize(12),
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
    fontSize: responsiveFontSize(14),
    fontWeight: "bold",
  },
});
