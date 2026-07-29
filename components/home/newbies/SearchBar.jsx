import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ onPress, onChange, query, showFilter = true }) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={'#666'} />
        <TextInput
          value={query}
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#666"
          onChangeText={onChange}
        />
      </View>
      {showFilter && (
        <TouchableOpacity onPress={onPress} style={styles.filterButton}>
          <Ionicons size={20} name="filter-outline" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    // paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'white',
    borderRadius: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
});

export default SearchBar;
