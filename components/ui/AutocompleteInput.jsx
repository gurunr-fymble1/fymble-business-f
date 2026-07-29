import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontFamily } from "../../GlobalStyles";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const AutocompleteInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  suggestions = [],
  onSelectSuggestion,
  required = false,
  error = false,
  keyboardType = "default",
  maxLength,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleTextChange = (text) => {
    onChangeText(text);
    setShowSuggestions(text.length > 0 && suggestions.length > 0);
  };

  const handleSelectSuggestion = (item) => {
    onSelectSuggestion(item);
    setShowSuggestions(false);
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Ionicons name="location-outline" size={16} color="#FF5757" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          <Ionicons name={icon} size={16} color="#FF5757" /> {label}{" "}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>

      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor="#767676"
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => {
          if (value.length > 0 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

export default AutocompleteInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative",
    zIndex: 1,
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
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginTop: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 10,
  },
  suggestionText: {
    fontSize: isTablet ? 15 : 14,
    color: "#333",
    fontFamily: FontFamily.urbanistMedium,
  },
});
