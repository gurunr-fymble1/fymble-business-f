import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

// Date Filter Modal
const DateFilterModal = ({ showDateFilterModal, setShowDateFilterModal, dateFilter, setDateFilter }) => (
  <Modal
    transparent
    animationType="fade"
    visible={showDateFilterModal}
    onRequestClose={() => setShowDateFilterModal(false)}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={() => setShowDateFilterModal(false)}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Filter by Date</Text>

        <TouchableOpacity
          style={[
            styles.filterOption,
            dateFilter === 'all' && styles.selectedFilter,
          ]}
          onPress={() => {
            setDateFilter('all');
            setShowDateFilterModal(false);
          }}
        >
          <Text style={styles.filterText}>All Dates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            dateFilter === 'today' && styles.selectedFilter,
          ]}
          onPress={() => {
            setDateFilter('today');
            setShowDateFilterModal(false);
          }}
        >
          <Text style={styles.filterText}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            dateFilter === 'lastWeek' && styles.selectedFilter,
          ]}
          onPress={() => {
            setDateFilter('lastWeek');
            setShowDateFilterModal(false);
          }}
        >
          <Text style={styles.filterText}>Last Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            dateFilter === 'lastMonth' && styles.selectedFilter,
          ]}
          onPress={() => {
            setDateFilter('lastMonth');
            setShowDateFilterModal(false);
          }}
        >
          <Text style={styles.filterText}>Last Month</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

export default DateFilterModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: '#bebebe',
  },
  selectedFilter: {
    backgroundColor: '#FF5757',
  },
  filterText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});
