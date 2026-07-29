import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const UpdateGymLocationModal = ({
  isLocationModalVisible,
  isLocationLoading,
  updateGymLocation,
  setLocationModalVisible,
  styles,
}) => {
  return (
    <Modal
      visible={isLocationModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.updatedModalContainer}>
          <Text style={styles.updatedModalTitle}>Update Gym Location</Text>

          <Text style={styles.locationInfoText}>
            Your Gym's Location is used to verify the live attendance of the
            clients. Your current location will be used as your gym's location.
          </Text>

          {isLocationLoading ? (
            <ActivityIndicator
              size="large"
              color="#FF5757"
              style={styles.locationLoader}
            />
          ) : (
            <TouchableOpacity
              style={styles.locationUpdateButton}
              onPress={updateGymLocation}
            >
              <Text style={styles.locationUpdateButtonText}>
                Update Gym Location
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.locationUpdateButton}
            onPress={() => setLocationModalVisible(false)}
          >
            <Text style={styles.locationUpdateButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateGymLocationModal;
