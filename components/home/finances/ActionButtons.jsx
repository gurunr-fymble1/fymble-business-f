// components/ActionButtons.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ActionButton = ({ text = '', onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#006FAD',
    paddingVertical: 14,
    // width: '48.5%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    paddingHorizontal: 25,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#006FAD',
  },
});

export default ActionButton;
