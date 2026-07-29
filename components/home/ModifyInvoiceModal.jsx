import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const ModifyInvoiceModal = ({ visible, onClose, invoice, onSave }) => {
  const [editedInvoice, setEditedInvoice] = useState(invoice);

  const handleChange = (field, value) => {
    setEditedInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(editedInvoice);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView>
            <Text style={styles.heading}>Edit Invoice</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editedInvoice.name}
              onChangeText={(text) => handleChange('name', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={editedInvoice.address}
              onChangeText={(text) => handleChange('address', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact"
              value={editedInvoice.contact}
              onChangeText={(text) => handleChange('contact', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Payment Method"
              value={editedInvoice.paymentMethod}
              onChangeText={(text) => handleChange('paymentMethod', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Bank Details"
              value={editedInvoice.bankDetails}
              onChangeText={(text) => handleChange('bankDetails', text)}
            />

            {/* Add more fields or items logic if needed */}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ModifyInvoiceModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 10,
  },
  cancelText: {
    color: '#ef4444',
    textAlign: 'center',
  },
});
