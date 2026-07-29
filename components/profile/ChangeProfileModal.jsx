import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ChangePasswordModal = ({
  isVisible,
  onClose,
  passwordData,
  setPasswordData,
  handleChangePassword,
  styles
}) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [isVisible, setPasswordData]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.passwordInput, { paddingRight: 45 }]}
              placeholder="Old Password"
              secureTextEntry={!showOldPassword}
              value={passwordData.oldPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, oldPassword: text }))
              }
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowOldPassword(!showOldPassword)}
            >
              <Ionicons
                name={showOldPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.passwordInput, { paddingRight: 45 }]}
              placeholder="New Password"
              secureTextEntry={!showNewPassword}
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, newPassword: text }))
              }
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm New Password"
            secureTextEntry
            value={passwordData.confirmNewPassword}
            onChangeText={(text) =>
              setPasswordData((prev) => ({ ...prev, confirmNewPassword: text }))
            }
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChangePasswordModal;
