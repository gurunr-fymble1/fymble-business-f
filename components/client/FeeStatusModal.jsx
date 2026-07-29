import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const FeeStatusModal = ({
  visible,
  onClose,
  selectedClient,
  onMarkPaid,
  onMarkUnpaid,
}) => {
  const isPaid = selectedClient?.feePaid === 'Paid';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Fee Status</Text>

          <Text style={styles.modalMessage}>
            Are you sure you want to mark the fee as "{isPaid ? 'Unpaid' : 'Paid'}" for{' '}
            {selectedClient?.name}?
          </Text>

          <View style={styles.modalButtonContainer}>
            <Button
              mode="contained"
              onPress={isPaid ? onMarkUnpaid : onMarkPaid}
              style={styles.updateButton}
              labelStyle={styles.buttonLabel}
            >
              Yes
            </Button>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.cancelButton}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FeeStatusModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF5757',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#FF5757',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#FF5757',
  },
  buttonLabel: {
    fontSize: 16,
  },
});
