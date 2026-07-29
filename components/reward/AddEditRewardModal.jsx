// components/reward/AddEditRewardModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../utils/Toaster';

const AddEditRewardModal = ({
  visible,
  onClose,
  rewardsInput,
  setRewardsInput,
  onSubmit,
  isEditing,
  isLoading,
}) => {
  // State to track if there are validation errors
  const [hasErrors, setHasErrors] = useState(false);
  const [xpErrorMessages, setXpErrorMessages] = useState({}); // Stores errors specific to XP fields

  // Effect to reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setHasErrors(false);
      setXpErrorMessages({});
    }
  }, [visible]);

  const handleRewardInputChange = (text, index, field) => {
    const newRewardsInput = [...rewardsInput];
    newRewardsInput[index][field] = text;
    setRewardsInput(newRewardsInput);

    // --- Real-time XP validation ---
    if (field === 'xp') {
      validateXPInput(newRewardsInput, index);
    }
  };

  const addRewardField = () => {
    setRewardsInput([...rewardsInput, { xp: '', gift: '' }]);
  };

  const removeRewardField = (index) => {
    const newRewardsInput = rewardsInput.filter((_, i) => i !== index);
    setRewardsInput(newRewardsInput);
    // Re-validate all XPs after removal to catch new duplicates or clear old errors
    const updatedErrors = {};
    newRewardsInput.forEach((_, i) =>
      validateXPInput(newRewardsInput, i, updatedErrors)
    );
    setXpErrorMessages(updatedErrors);
    setHasErrors(Object.keys(updatedErrors).length > 0);
  };

  // New validation function
  const validateXPInput = (
    currentInputs,
    currentIndex,
    errors = xpErrorMessages
  ) => {
    const currentXP = String(currentInputs[currentIndex].xp).trim();
    let errorFound = false;
    let newErrors = { ...errors }; // Create a mutable copy

    // Check for empty XP
    if (currentXP === '') {
      newErrors[currentIndex] = 'XP cannot be empty.';
      errorFound = true;
    } else if (isNaN(currentXP) || parseInt(currentXP) <= 0) {
      newErrors[currentIndex] = 'XP must be a positive number.';
      errorFound = true;
    } else {
      // Check for duplicates *within the current input batch*
      const duplicateIndex = currentInputs.findIndex(
        (reward, idx) =>
          idx !== currentIndex && String(reward.xp).trim() === currentXP
      );

      if (duplicateIndex !== -1) {
        newErrors[
          currentIndex
        ] = `Duplicate XP: ${currentXP} already used above.`;
        errorFound = true;
      } else {
        delete newErrors[currentIndex]; // Clear error if no duplicate
      }
    }

    setXpErrorMessages(newErrors);
    setHasErrors(Object.keys(newErrors).length > 0); // Update overall error state
    return errorFound; // Return true if an error was found for this specific field
  };

  const handleFormSubmit = () => {
    let formValid = true;
    let allErrors = {};

    // Validate all fields for completeness and internal XP duplicates
    rewardsInput.forEach((reward, index) => {
      const xp = String(reward.xp).trim();
      const gift = reward.gift.trim();

      if (xp === '' || gift === '') {
        showToast({
          type: 'error',
          title: 'Please fill in all XP and Gift fields.',
        });
        formValid = false;
        return; // Exit loop if incomplete
      }
      if (isNaN(xp) || parseInt(xp) <= 0) {
        showToast({
          type: 'error',
          title: `XP for reward ${index + 1} must be a positive number.`,
        });
        formValid = false;
        return;
      }

      // Re-run internal XP validation for submission
      const xpErrorExists = validateXPInput(rewardsInput, index, allErrors);
      if (xpErrorExists) {
        formValid = false;
      }
    });

    if (!formValid) {
      setHasErrors(true); // Ensure error styling is applied
      setXpErrorMessages(allErrors); // Update errors for display
      return; // Prevent submission
    }

    // If we're editing, ensure only one item is submitted
    if (isEditing && rewardsInput.length > 1) {
      showToast({
        type: 'error',
        title: 'Only one reward can be edited at a time.',
      });
      return;
    }

    // If we reach here, internal validation passed
    // Now call the parent onSubmit, which will handle database-level duplicates
    onSubmit();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => onClose()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Reward' : 'Add New Reward'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollView}>
                {rewardsInput.map((reward, index) => (
                  <View key={index} style={styles.rewardInputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>XP</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.xpInput,
                          xpErrorMessages[index] && styles.inputErrorBorder,
                        ]}
                        placeholder="e.g., 100"
                        keyboardType="numeric"
                        value={reward.xp}
                        onChangeText={(text) =>
                          handleRewardInputChange(text, index, 'xp')
                        }
                      />
                      {xpErrorMessages[index] && (
                        <Text style={styles.errorText}>
                          {xpErrorMessages[index]}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Gift/Reward</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Free T-shirt"
                        value={reward.gift}
                        onChangeText={(text) =>
                          handleRewardInputChange(text, index, 'gift')
                        }
                      />
                    </View>

                    {!isEditing && rewardsInput.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeRewardField(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons
                          name="remove-circle"
                          size={24}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {!isEditing && (
                  <TouchableOpacity
                    onPress={addRewardField}
                    style={styles.addMoreButton}
                  >
                    <Ionicons name="add-circle" size={24} color="#007AFF" />
                    <Text style={styles.addMoreText}>Add More Rewards</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading || (hasErrors && styles.submitButtonDisabled),
                ]}
                onPress={handleFormSubmit}
                disabled={isLoading || hasErrors}
              >
                {isLoading ? (
                  <Text style={styles.submitButtonText}>Saving...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Update Reward' : 'Add Reward(s)'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%', // Limit height for scrollable content
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    flexGrow: 1,
  },
  rewardInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    // backgroundColor: '#F8F8F8',
    borderRadius: 10,
    // padding: 10,
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    // padding: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 5,
    fontSize: 16,
    backgroundColor: '#FFF',
    height: 50,
  },
  xpInput: {
    width: 100, // Smaller width for XP input
  },
  removeButton: {
    padding: 5,
    marginTop: 20, // Align with text input
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
  },
  addMoreText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  submitButton: {
    // backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    // color: '#007AFF',
    width: '50%',
    alignSelf: 'center',
  },
  submitButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0C8FF', // Lighter shade when disabled
  },
  errorText: {
    color: '#D32F2F', // Red for errors
    fontSize: 12,
    marginTop: 4,
  },
  inputErrorBorder: {
    borderColor: '#D32F2F', // Red border for error
  },
});

export default AddEditRewardModal;
