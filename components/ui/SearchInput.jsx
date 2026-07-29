// SearchInput.js
import React, { memo } from 'react';
import { StyleSheet, TextInput } from 'react-native';

// Make it a purely controlled component
const SearchInput = memo(function SearchInput({
  value, // <-- Get value from props
  onChangeText, // <-- Get handler from props
  placeholder,
  inputStyle,
}) {
  // No internal state needed anymore
  // const [inputValue, setInputValue] = useState(''); // REMOVE
  // const handleChange = (text) => { ... }; // REMOVE

  return (
    <TextInput
      style={[styles.input, inputStyle]} // Apply base and custom styles
      placeholder={placeholder || 'Search...'}
      value={value} // <-- Use value from props
      onChangeText={onChangeText} // <-- Use onChangeText from props
      placeholderTextColor="#999"
      autoCapitalize="none" // Often useful for search inputs
    />
  );
});

export default SearchInput;

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
