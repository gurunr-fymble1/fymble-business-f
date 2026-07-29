import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AssignmentWarningModal = ({
  visible,
  onClose,
  assignedUsers,
  entityType,
  entityName,
  onRedirect,
  styles,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="alert" size={28} color="#FFA500" />
            <Text style={styles.modalTitle}>Cannot Delete {entityType}</Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalText}>
              The following users are assigned to this{' '}
              {entityType.toLowerCase()} "{entityName}":
            </Text>

            {assignedUsers.map((user, index) => (
              <View key={index} style={styles.userItem}>
                <Icon name="account" size={20} color="#666" />
                <Text style={styles.userName}>{user.name}</Text>
              </View>
            ))}

            <Text style={styles.modalWarning}>
              Please reassign these users to a different{' '}
              {entityType.toLowerCase()} before deleting.
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={onClose}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={onRedirect}
            >
              <Text style={styles.modalPrimaryButtonText}>
                Go to Assignment Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
