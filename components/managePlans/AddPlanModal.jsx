import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToast } from '../../utils/Toaster';

const AddPlanModal = ({
  visible,
  onClose,
  onSave,
  isEditMode = false,
  initialData = {},
}) => {
  const [planName, setPlanName] = useState(initialData.plans || '');
  const [planAmount, setPlanAmount] = useState(
    initialData.amount ? String(initialData.amount).replace('₹', '') : ''
  );
  const [planDuration, setPlanDuration] = useState(
    initialData.duration ? String(initialData.duration) : ''
  );
  const [planDescription, setPlanDescription] = useState(
    initialData.description || ''
  );

  const handleSave = useCallback(() => {
    Keyboard.dismiss();
    if (!planName.trim() || !planAmount.trim() || !planDuration.trim()) {
      showToast({
        type: 'error',
        title: 'Please fill in all required fields',
      });
      return;
    }

    onSave({
      plans: planName,
      amount: planAmount,
      duration: parseInt(planDuration, 10),
      description: planDescription,
    });

    // Reset form
    setPlanName('');
    setPlanAmount('');
    setPlanDuration('');
    setPlanDescription('');
  }, [planName, planAmount, planDuration, planDescription, onSave]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Plan</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* Plan Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plan Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter plan name"
                  value={planName}
                  onChangeText={setPlanName}
                  returnKeyType="next"
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={planAmount}
                  onChangeText={setPlanAmount}
                  returnKeyType="next"
                />
              </View>

              {/* Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter duration in months"
                  keyboardType="numeric"
                  value={planDuration}
                  onChangeText={setPlanDuration}
                  returnKeyType="next"
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Add Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  multiline={true}
                  numberOfLines={4}
                  value={planDescription}
                  onChangeText={setPlanDescription}
                  returnKeyType="done"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0078FF',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0078FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPlanModal;
