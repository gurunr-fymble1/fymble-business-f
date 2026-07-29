// components/reward/DuplicateXPConfirmationModal.js (New structure)
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../utils/Toaster';

const DuplicateXPConfirmationModal = ({
  visible,
  onClose,
  duplicatePairs,
  onAction,
  isLoading,
}) => {
  if (!visible) return null;

  const renderDuplicateItem = ({ item }) => {
    const { newReward, existingReward, type } = item;

    // Determine the message based on the type of duplicate
    let message = `A reward with ${newReward.xp} XP already exists.`;
    if (type === 'editConflictWithDB' || type === 'existingDuplicateInDB') {
      message += ` (Existing: "${existingReward.gift}")`;
    }

    return (
      <View style={styles.rewardItem}>
        <View style={styles.rewardDetails}>
          <Text style={styles.rewardXP}>
            New: <Text style={styles.boldText}>{newReward.xp} XP</Text> -{' '}
            {newReward.gift}
          </Text>
          {existingReward &&
            (type === 'editConflictWithDB' ||
              type === 'existingDuplicateInDB') && (
              <Text style={styles.rewardGift}>
                Existing:{' '}
                <Text style={styles.boldText}>{existingReward.xp} XP</Text> -{' '}
                {existingReward.gift}
              </Text>
            )}
          <Text style={styles.messageText}>
            {message} What would you like to do?
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          {/* Only show 'Replace' if it's an actual database conflict */}
          {(type === 'editConflictWithDB' ||
            type === 'existingDuplicateInDB') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.replaceButton]}
              onPress={() => onAction('replace', item)}
              disabled={isLoading}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#FFF" />
              <Text style={styles.buttonText}>Replace</Text>
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity
            style={[styles.actionButton, styles.addAnywayButton]}
            onPress={() => onAction('addAnyway', item)}
            disabled={isLoading}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Add Anyway</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Duplicate XP Detected!</Text>
          <Text style={styles.modalSubtitle}>
            Some rewards you're trying to add/update have XP values that already
            exist in your rewards list. Please choose an action for each:
          </Text>

          <FlatList
            data={duplicatePairs}
            renderItem={renderDuplicateItem}
            keyExtractor={(item, index) =>
              `${item.newReward.xp}-${index}-${item.type}`
            } // Improved key
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.closeButtonText}>Done / Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F', // Red for warning
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 10,
  },
  rewardItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rewardDetails: {
    marginBottom: 10,
  },
  rewardXP: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  rewardGift: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100', // Orange for internal warning
    fontStyle: 'italic',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    gap: 10, // Space between buttons
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  replaceButton: {
    backgroundColor: '#007AFF', // Blue for primary action
  },
  addAnywayButton: {
    backgroundColor: '#28A745', // Green for alternative add
  },
  skipButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30', // Red for close/cancel
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DuplicateXPConfirmationModal;
