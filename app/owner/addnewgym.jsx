import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontFamily } from "../../GlobalStyles";
import { showToast } from "../../utils/Toaster";
import AutocompleteInput from "../../components/ui/AutocompleteInput";
import { filterCities, filterStates } from "../../data/indianCitiesStates";
import { addNewGymToOwnerAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

// Fitness type options
const FITNESS_TYPES = [
  { id: "gym", label: "Gym", icon: "fitness-outline" },
  { id: "yoga", label: "Yoga", icon: "body-outline" },
  { id: "zumba", label: "Zumba", icon: "musical-notes-outline" },
  { id: "swimming", label: "Swimming", icon: "water-outline" },
  { id: "crossfit", label: "CrossFit", icon: "barbell-outline" },
  { id: "sports", label: "Sports", icon: "football-outline" },
  { id: "pilates", label: "Pilates", icon: "ribbon-outline" },
  { id: "dance", label: "Dance", icon: "musical-note-outline" },
  { id: "martial_arts", label: "Martial Arts", icon: "flash-outline" },
  { id: "aerobics", label: "Aerobics", icon: "heart-outline" },
  { id: "boxing", label: "Boxing", icon: "hand-right-outline" },
  { id: "cycling", label: "Cycling", icon: "bicycle-outline" },
];

const AddNewGym = () => {
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFitnessTypes, setSelectedFitnessTypes] = useState(["gym"]);
  const [fitnessTypesExpanded, setFitnessTypesExpanded] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const [form, setForm] = useState({
    gymName: "",
    gymMobile: "",
    address: {
      doorNo: "",
      building: "",
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    const loadOwnerData = async () => {
      const id = await getToken("owner_id");
      const name = await getToken("name");
      const access = await getToken("access_token");
      const refresh = await getToken("refresh_token");
      setOwnerId(id);
      setOwnerName(name || "");
      setAccessToken(access || "");
      setRefreshToken(refresh || "");
    };
    loadOwnerData();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));

    if (field === "pincode" && value.length === 6) {
      fetchLocationFromPincode(value);
    }

    if (field === "city") {
      setCitySuggestions(filterCities(value));
    } else if (field === "state") {
      setStateSuggestions(filterStates(value));
    }

    const errorKey = `address${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const fetchLocationFromPincode = async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await response.json();

      if (
        data &&
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        const city = postOffice.District || postOffice.Block || "";
        const state = postOffice.State || "";

        setForm((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            city: city,
            state: state,
          },
        }));

        showToast({
          type: "success",
          title: "Location Found",
          message: `${city}, ${state}`,
        });
      } else {
        showToast({
          type: "error",
          title: "Invalid Pincode",
          message: "No location found for this pincode",
        });
      }
    } catch (error) {
      console.error("Pincode API error:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch location. Please enter manually.",
      });
    } finally {
      setPincodeLoading(false);
    }
  };

  const toggleFitnessType = (typeId) => {
    setSelectedFitnessTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
    // Clear fitness type error when user selects/deselects
    if (errors.fitness_type) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.fitness_type;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.gymName.trim()) {
      newErrors.gymName = "Fitness Studio name is required";
    }
    if (!form.gymMobile.trim()) {
      newErrors.gymMobile = "Fitness Studio mobile is required";
    } else if (!/^\d{10}$/.test(form.gymMobile.trim())) {
      newErrors.gymMobile = "Mobile number must be 10 digits";
    }

    // Fitness type validation
    if (selectedFitnessTypes.length === 0) {
      newErrors.fitness_type = "Please select at least one fitness type";
    }

    if (!form.address.doorNo.trim()) {
      newErrors.addressdoorNo = "Door number is required";
    }
    if (!form.address.building.trim()) {
      newErrors.addressbuilding = "Building/Floor is required";
    }
    if (!form.address.street.trim()) {
      newErrors.addressstreet = "Street is required";
    }
    if (!form.address.area.trim()) {
      newErrors.addressarea = "Area is required";
    }
    if (!form.address.city.trim()) {
      newErrors.addresscity = "City is required";
    }
    if (!form.address.state.trim()) {
      newErrors.addressstate = "State is required";
    }
    if (!form.address.pincode.trim()) {
      newErrors.addresspincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.address.pincode.trim())) {
      newErrors.addresspincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill all required fields correctly",
      });
      return;
    }

    if (!ownerId) {
      showToast({
        type: "error",
        title: "Error",
        message: "Owner information not found. Please login again.",
      });
      return;
    }

    setSubmitted(true);

    try {
      const formData = {
        owner_id: parseInt(ownerId),
        device: "mobile",
        gym: {
          name: form.gymName,
          contact_number: form.gymMobile,
          fitness_type: selectedFitnessTypes,

          location: `${form.address.city}, ${form.address.state}`,
          address: {
            doorNo: form.address.doorNo,
            building: form.address.building,
            street: form.address.street,
            area: form.address.area,
            city: form.address.city,
            state: form.address.state,
            pincode: form.address.pincode,
          },
        },
      };

      const response = await addNewGymToOwnerAPI(formData);

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Fitness Studio Added Successfully!",
          message: "You can now switch to your new fitness studio",
        });

        // Navigate to selectgym with the updated gyms list
        const gymsData = response.data?.gyms || [];
        router.push({
          pathname: "/owner/selectgym",
          params: {
            gyms: JSON.stringify(gymsData),
            user_id: ownerId,
            access_token: accessToken,
            refresh_token: refreshToken,
            name: ownerName,
            role: "owner",
          },
        });
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to add fitness studio. Please try again.",
        });
      }
    } catch (error) {
      console.error("Add fitness studio error:", error);
      showToast({
        type: "error",
        title: error.message || "Failed to add fitness studio",
      });
    } finally {
      setSubmitted(false);
    }
  };

  const renderInputField = (
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    options = {},
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          <Ionicons name={icon} size={16} color="#FF5757" /> {label}{" "}
          {options.required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>
      <View style={{ position: "relative" }}>
        <TextInput
          style={[
            styles.input,
            options.error && styles.inputError,
            options.disabled && styles.disabledInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#767676"
          keyboardType={options.keyboardType || "default"}
          maxLength={options.maxLength}
          editable={!options.disabled}
        />
        {options.loading && (
          <View style={styles.loadingIndicator}>
            <Ionicons name="refresh" size={20} color="#FF5757" />
            <Text style={styles.loadingText}>Fetching...</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Another Fitness Studio</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Registration Card */}
          <View style={styles.card}>
            {/* Gym Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="fitness-outline" size={18} color="#FF5757" />{" "}
                Fitness Studio Details
              </Text>

              {renderInputField(
                "Fitness Studio Name",
                form.gymName,
                (value) => handleInputChange("gymName", value),
                "Enter fitness studio name",
                "business-outline",
                { required: true, error: errors.gymName },
              )}
              {errors.gymName && (
                <Text style={styles.errorText}>{errors.gymName}</Text>
              )}

              {/* Fitness Type Selection */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>
                    <Ionicons
                      name="barbell-outline"
                      size={16}
                      color="#FF5757"
                    />{" "}
                    Fitness Studio Type <Text style={styles.required}>*</Text>
                  </Text>
                  {selectedFitnessTypes.length > 0 && (
                    <Text style={styles.selectedCount}>
                      {selectedFitnessTypes.length} selected
                    </Text>
                  )}
                </View>
                <View style={styles.fitnessTypesContainer}>
                  {(fitnessTypesExpanded
                    ? FITNESS_TYPES
                    : FITNESS_TYPES.slice(0, 4)
                  ).map((type) => {
                    const isSelected = selectedFitnessTypes.includes(type.id);
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.fitnessTypeChip,
                          isSelected && styles.fitnessTypeChipSelected,
                        ]}
                        onPress={() => toggleFitnessType(type.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : type.icon}
                          size={18}
                          color={isSelected ? "#FFFFFF" : "#767676"}
                        />
                        <Text
                          style={[
                            styles.fitnessTypeChipText,
                            isSelected && styles.fitnessTypeChipTextSelected,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() =>
                      setFitnessTypesExpanded(!fitnessTypesExpanded)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButtonText}>
                      {fitnessTypesExpanded ? "Less" : "More"}
                    </Text>
                    <Ionicons
                      name={
                        fitnessTypesExpanded ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color="#FF5757"
                    />
                  </TouchableOpacity>
                </View>
                {errors.fitness_type && (
                  <Text style={styles.errorText}>{errors.fitness_type}</Text>
                )}
              </View>

              {renderInputField(
                "Fitness Studio Mobile",
                form.gymMobile,
                (value) => handleInputChange("gymMobile", value),
                "Enter fitness studio mobile number",
                "call-outline",
                {
                  required: true,
                  keyboardType: "phone-pad",
                  maxLength: 10,
                  error: errors.gymMobile,
                },
              )}
              {errors.gymMobile && (
                <Text style={styles.errorText}>{errors.gymMobile}</Text>
              )}

              {/* Address Section */}
              <Text style={styles.sectionSubTitle}>
                <Ionicons name="location-outline" size={16} color="#FF5757" />{" "}
                Fitness Studio Address
              </Text>

              {/* Door No and Building/Floor in same row */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderInputField(
                    "Door No",
                    form.address.doorNo,
                    (value) => handleAddressChange("doorNo", value),
                    "Enter Door No",
                    "home-outline",
                    { required: true, error: errors.addressdoorNo },
                  )}
                  {errors.addressdoorNo && (
                    <Text style={styles.errorText}>{errors.addressdoorNo}</Text>
                  )}
                </View>
                <View style={styles.halfWidth}>
                  {renderInputField(
                    "Building/Floor",
                    form.address.building,
                    (value) => handleAddressChange("building", value),
                    "Building/Floor",
                    "business-outline",
                    { required: true, error: errors.addressbuilding },
                  )}
                  {errors.addressbuilding && (
                    <Text style={styles.errorText}>
                      {errors.addressbuilding}
                    </Text>
                  )}
                </View>
              </View>

              {renderInputField(
                "Street",
                form.address.street,
                (value) => handleAddressChange("street", value),
                "Enter street address",
                "home-outline",
                { required: true, error: errors.addressstreet },
              )}
              {errors.addressstreet && (
                <Text style={styles.errorText}>{errors.addressstreet}</Text>
              )}

              {renderInputField(
                "Area",
                form.address.area,
                (value) => handleAddressChange("area", value),
                "Enter area/locality",
                "map-outline",
                { required: true, error: errors.addressarea },
              )}
              {errors.addressarea && (
                <Text style={styles.errorText}>{errors.addressarea}</Text>
              )}

              {renderInputField(
                "Pincode",
                form.address.pincode,
                (value) => handleAddressChange("pincode", value),
                "Enter 6-digit pincode",
                "keypad-outline",
                {
                  required: true,
                  keyboardType: "numeric",
                  maxLength: 6,
                  error: errors.addresspincode,
                  loading: pincodeLoading,
                },
              )}
              {errors.addresspincode && (
                <Text style={styles.errorText}>{errors.addresspincode}</Text>
              )}

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <AutocompleteInput
                    label="City"
                    value={form.address.city}
                    onChangeText={(value) => handleAddressChange("city", value)}
                    placeholder="City"
                    icon="business-outline"
                    suggestions={citySuggestions}
                    onSelectSuggestion={(city) => {
                      handleAddressChange("city", city);
                      setCitySuggestions([]);
                    }}
                    required={true}
                    error={errors.addresscity}
                  />
                  {errors.addresscity && (
                    <Text style={styles.errorText}>{errors.addresscity}</Text>
                  )}
                </View>
                <View style={styles.halfWidth}>
                  <AutocompleteInput
                    label="State"
                    value={form.address.state}
                    onChangeText={(value) =>
                      handleAddressChange("state", value)
                    }
                    placeholder="State"
                    icon="flag-outline"
                    suggestions={stateSuggestions}
                    onSelectSuggestion={(state) => {
                      handleAddressChange("state", state);
                      setStateSuggestions([]);
                    }}
                    required={true}
                    error={errors.addressstate}
                  />
                  {errors.addressstate && (
                    <Text style={styles.errorText}>{errors.addressstate}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                submitted && styles.registerButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitted}
            >
              {submitted ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Add Fitness Studio</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AddNewGym;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  background: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingTop: height * 0.02,
    paddingBottom: 300,
    paddingHorizontal: width * 0.05,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: isTablet ? 600 : 400,
    paddingHorizontal: isTablet ? 30 : 20,
    paddingTop: isTablet ? 30 : 20,
    paddingBottom: isTablet ? 40 : 30,
    marginTop: height * 0.01,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  subtitle: {
    fontSize: isTablet ? 25 : 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FontFamily.urbanistMedium,
  },
  section: {
    marginBottom: 20,
    overflow: "visible",
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  sectionSubTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 15,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif-medium",
  },
  inputGroup: {
    marginBottom: 16,
    position: "relative",
    overflow: "visible",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    color: "#333",
    flexDirection: "row",
    alignItems: "center",
  },
  required: {
    color: "#F44336",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: isTablet ? 14 : 10,
    fontSize: isTablet ? 16 : 14,
    backgroundColor: "#F8F8F8",
    color: "#767676",
    fontFamily: FontFamily.urbanistMedium,
    height: isTablet ? 55 : 45,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: "#F44336",
  },
  disabledInput: {
    backgroundColor: "#F0F0F0",
    color: "#999",
  },
  loadingIndicator: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    color: "#FF5757",
    fontFamily: FontFamily.urbanistMedium,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: FontFamily.urbanistMedium,
  },
  registerButton: {
    backgroundColor: "#FF5757",
    paddingVertical: isTablet ? 16 : 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonDisabled: {
    backgroundColor: "#FFB8B8",
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  cancelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  cancelLink: {
    color: "#666",
    fontSize: 14,
    fontFamily: FontFamily.urbanistMedium,
  },
  fitnessTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  fitnessTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fitnessTypeChipSelected: {
    backgroundColor: "#FF5757",
    borderColor: "#FF5757",
    elevation: 3,
    shadowColor: "#FF5757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fitnessTypeChipText: {
    fontSize: isTablet ? 14 : 13,
    color: "#767676",
    fontWeight: "500",
    fontFamily: FontFamily.urbanistMedium,
  },
  fitnessTypeChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectedCount: {
    fontSize: 12,
    color: "#FF5757",
    fontWeight: "600",
    fontFamily: FontFamily.urbanistMedium,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFB8B8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expandButtonText: {
    fontSize: isTablet ? 14 : 13,
    color: "#FF5757",
    fontWeight: "600",
    fontFamily: FontFamily.urbanistMedium,
  },
});
