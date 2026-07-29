// SearchBar.js
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react'; // Removed useCallback
import { StyleSheet, View } from 'react-native';
import { debounce } from '../../utils/debounce';
import SearchInput from './SearchInput';

const SearchBar = ({
  data = [],
  onSearch,
  searchKeys = [],
  placeholder = 'Search...',
  debounceDelay = 300,
  style = {},
  inputStyle = {},
  value,
  onChangeText, // This prop is now stable from the parent
}) => {

  
  const debouncedFilter = useRef(
    // ... (debounce logic remains the same)
    debounce((text, currentData) => {
       if (!Array.isArray(currentData)) {
         console.error('SearchBar: data prop must be an array');
         onSearch([], text);
         return;
       }
       const trimmedText = text.trim();
       if (trimmedText === '') {
         onSearch(currentData, text);
         return;
       }
       const lowerCaseText = trimmedText.toLowerCase();
       const filtered = currentData.filter((item) =>
         searchKeys.some((key) => {
           const itemValue = item[key];
           return (
             itemValue != null &&
             String(itemValue).toLowerCase().includes(lowerCaseText)
           );
         })
       );
       onSearch(filtered, text);
     }, debounceDelay)
  ).current;

  useEffect(() => {
    debouncedFilter(value, data);
  }, [value, data, debouncedFilter]); // Keep dependencies

  return (
    <View style={[styles.container, style]}>
      <Feather name="search" size={20} color="#666" style={styles.icon} />
      <SearchInput
        value={value}
        onChangeText={onChangeText} // <-- Pass the stable prop directly
        placeholder={placeholder}
        inputStyle={inputStyle}
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dfe4ea',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
});
