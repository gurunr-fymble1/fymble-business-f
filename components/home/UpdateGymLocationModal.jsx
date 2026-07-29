import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const UpdateGymLocationModal = ({
  styles,
  isLocationModalVisible,
  updateGymLocation,
  isLocationLoading,
}) => {
  return (
    <Modal
      visible={isLocationModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        Alert.alert(
          "Cannot Dismiss",
          "You need to update your gym location to continue.",
          [{ text: "OK" }],
        );
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.updatedModalContainer}>
          <Text style={styles.updatedModalTitle}>Gym Location Required</Text>

          <Text style={styles.locationInfoText}>
            You need to setup your gym's location to verify the gym's
            information. Your current location will be used as your gym's
            location.
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
                Update Location
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UpdateGymLocationModal;
