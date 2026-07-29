import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import debounce from "lodash.debounce";

const SearchBar111 = ({
  data = [],
  onSearch,
  searchKeys = ["name"],
  placeholder = "Search...",
  debounceDelay = 300,
  style = {},
  inputStyle = {},
}) => {
  const [query, setQuery] = useState("");

  const debouncedSearch = useRef(
    debounce((text) => {
      if (text.trim() === "") {
        onSearch(data, text);
        return;
      }

      const filtered = data.filter((item) =>
        searchKeys.some((key) =>
          (item[key] || "")
            .toString()
            .toLowerCase()
            .includes(text.toLowerCase())
        )
      );

      onSearch(filtered, text);
    }, debounceDelay)
  ).current;

  const onChangeText = (text) => {
    setQuery(text);
    debouncedSearch(text);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Feather name="search" size={16} color="#666" style={styles.icon} />
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={query}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
      />
    </View>
  );
};

export default SearchBar111;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.10)",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: "#2c3e50",
    height: Platform.OS === "ios" ? 30 : "auto",
  },
});
