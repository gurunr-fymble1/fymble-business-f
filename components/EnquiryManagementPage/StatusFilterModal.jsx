import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const StatusFilterModal = ({
  showStatusFilterModal,
  setShowStatusFilterModal,
  statusFilter,
  setStatusFilter,
  filterKeyList,
}) => (
  <Modal
    transparent
    animationType="fade"
    visible={showStatusFilterModal}
    onRequestClose={() => setShowStatusFilterModal(false)}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={() => setShowStatusFilterModal(false)}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Filter by Status</Text>

        <TouchableOpacity
          style={[
            styles.filterOption,
            statusFilter === 'all' && styles.selectedFilter,
          ]}
          onPress={() => {
            setStatusFilter('all');
            setShowStatusFilterModal(false);
          }}
        >
          <Text style={styles.filterText}>All Status</Text>
        </TouchableOpacity>

        <FlatList
          data={filterKeyList}
          // keyExtractor={(item) => item?.enquiry_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterOption,
                statusFilter === item && styles.selectedFilter,
              ]}
              onPress={() => {
                setStatusFilter(item);
                setShowStatusFilterModal(false);
              }}
            >
              <Text style={styles.filterText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableOpacity>
  </Modal>
);

export default StatusFilterModal;

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
