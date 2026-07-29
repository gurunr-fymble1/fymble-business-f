import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// Status Update Modal Component
function StatusUpdateModal({ visible, action, onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState('');

  const reasonOptions = {
    'Follow Up': [
      'Will call back later',
      'Requested more information',
      'Schedule a meeting',
      'Interested but thinking',
      'Other',
    ],
    Joined: [
      'Signed contract',
      'Paid first installment',
      'Started services',
      'Completed onboarding',
      'Other',
    ],
    Rejected: [
      'Too expensive',
      'Found another option',
      'Not interested anymore',
      'Unreachable',
      'Other',
    ],
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update to {action}</Text>

              <Text style={styles.modalLabel}>Select Reason:</Text>
              <ScrollView style={styles.reasonContainer}>
                {action &&
                  reasonOptions[action].map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.reasonOption,
                        selectedReason === reason && styles.selectedReason,
                      ]}
                      onPress={() => setSelectedReason(reason)}
                    >
                      <Text
                        style={[
                          styles.reasonText,
                          selectedReason === reason &&
                            styles.selectedReasonText,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    !selectedReason && styles.disabledButton,
                  ]}
                  disabled={!selectedReason}
                  onPress={() => onSubmit(selectedReason)}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default StatusUpdateModal;

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
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#34495e',
  },
  reasonContainer: {
    maxHeight: 200,
  },
  reasonOption: {
    padding: 12,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedReason: {
    backgroundColor: '#3498db',
  },
  reasonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  selectedReasonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  updateButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
