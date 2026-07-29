import React, { memo, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

const MonthlyPriceInput = memo(
  ({ value, onChangeText, label = "1 Month Plan" }) => {
    const inputRef = useRef(null);

    const handleChange = (text) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      onChangeText(cleaned);
    };

    return (
      <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>&#8377;</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={handleChange}
            placeholder="0"
            placeholderTextColor="#CBD5E0"
            keyboardType="numeric"
            maxLength={7}
          />
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    marginRight: 2,
  },
  input: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    minWidth: 50,
    textAlign: "right",
    padding: 0,
  },
});

export default MonthlyPriceInput;
