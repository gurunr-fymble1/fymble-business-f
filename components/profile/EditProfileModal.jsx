import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const EditProfileModal = ({
  isVisible,
  onClose,
  personalDetails,
  setPersonalDetails,
  gymDetails,
  setGymDetails,
  paymentDetails,
  setPaymentDetails,
  styles,
  handleSubmit,
}) => {
  const [errors, setErrors] = useState({});

  const renderError = (error) =>
    error ? <Text style={styles.errorText}>{error}</Text> : null;
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: height * 0.8 }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>Edit Profile</Text>

            {/* Personal Details */}

            <View>
              <Text style={styles.formSectionTitle}>Personal Details</Text>
              {personalDetails?.map((item, index) => {
                if (item.show === false || item.edit === false) return null;
                return (
                  <View key={item.key + index}>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder={item.label}
                      value={item.value}
                      onChange={(e) => {
                        const newData = [...personalDetails];
                        newData[index].value = e.nativeEvent.text;
                        setPersonalDetails(newData);
                      }}
                    />
                    {renderError(errors.name)}
                  </View>
                );
              })}
            </View>

            <Text style={styles.formSectionTitle}>Gym Details</Text>

            <View>
              {gymDetails?.map((item, index) => {
                if (item.show === false || item.edit === false) return null;
                return (
                  <View key={item.key + index}>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder={item.label}
                      value={item.value}
                      onChange={(e) => {
                        const newData = [...gymDetails];
                        newData[index].value = e.nativeEvent.text;
                        setGymDetails(newData);
                      }}
                    />
                    {renderError(errors.name)}
                  </View>
                );
              })}
            </View>

            <Text style={styles.formSectionTitle}>Payment Details</Text>
            <View>
              {paymentDetails?.map((item, index) => {
                if (item.show === false || item.edit === false) return null;
                return (
                  <View key={item.key + index}>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder={item.label}
                      value={item.value}
                      onChange={(e) => {
                        const newData = [...paymentDetails];
                        newData[index].value = e.nativeEvent.text;
                        setPaymentDetails(newData);
                      }}
                    />
                    {renderError(errors.name)}
                  </View>
                );
              })}
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={onClose}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
