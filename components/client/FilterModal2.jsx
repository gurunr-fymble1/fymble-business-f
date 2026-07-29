import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FilterModalForUnverifiedUser = ({
  visible,
  onDismiss,
  activeTab,
  onTabChange,
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Filter Clients</Text>

        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              activeTab === 'active' && styles.filterOptionActive,
            ]}
            onPress={() => {
              onTabChange('active');
              onDismiss();
            }}
          >
            <MaterialCommunityIcons
              name="account-check"
              size={24}
              color={activeTab === 'active' ? '#FFFFFF' : '#4F46E5'}
            />
            <Text
              style={[
                styles.filterOptionText,
                activeTab === 'active' && styles.filterOptionTextActive,
              ]}
            >
              Active Clients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              activeTab === 'inactive' && styles.filterOptionActive,
            ]}
            onPress={() => {
              onTabChange('inactive');
              onDismiss();
            }}
          >
            <MaterialCommunityIcons
              name="account-off"
              size={24}
              color={activeTab === 'inactive' ? '#FFFFFF' : '#4F46E5'}
            />
            <Text
              style={[
                styles.filterOptionText,
                activeTab === 'inactive' && styles.filterOptionTextActive,
              ]}
            >
              Inactive Clients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              activeTab === 'all' && styles.filterOptionActive,
            ]}
            onPress={() => {
              onTabChange('all');
              onDismiss();
            }}
          >
            <MaterialCommunityIcons
              name="account-off"
              size={24}
              color={activeTab === 'all' ? '#FFFFFF' : '#4F46E5'}
            />
            <Text
              style={[
                styles.filterOptionText,
                activeTab === 'all' && styles.filterOptionTextActive,
              ]}
            >
              All Clients
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  filterOptions: {
    width: '100%',
    marginBottom: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#4B5563',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '500',
  },
  filterIndicator: {
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterHighlight: {
    fontWeight: 'bold',
    color: '#4F46E5',
    textTransform: 'capitalize',
  },
});

export default FilterModalForUnverifiedUser;