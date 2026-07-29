import React, { useState, useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Assuming you're using Ionicons

const ValidatedInput = ({
  item,
  onChange,
  //   styles,
  errors,
  setErrors,
  index,
  allData = [],
}) => {
  // Define validation rules
  const validateField = (value, key) => {
    if (!value.trim()) {
      return `${item.label} is required`;
    }

    switch (key) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'contact_number':
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(value.replace(/[^0-9]/g, ''))) {
          return 'Please enter a valid 10-digit phone number';
        }
        break;

      case 'dob':
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return 'Please enter a valid date (YYYY-MM-DD)';
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }

        if (date > new Date()) {
          return 'Date of birth cannot be in the future';
        }
        break;

      case 'age':
        const ageValue = parseInt(value.replace(/[^0-9]/g, ''));
        if (isNaN(ageValue) || ageValue <= 0 || ageValue > 120) {
          return 'Please enter a valid age (1-120)';
        }
        break;
    }

    return '';
  };

  // Validate on change
  const handleChange = (text) => {
    const error = validateField(text, item.key);

    setErrors((prev) => ({
      ...prev,
      [item.key]: error,
    }));

    onChange(text, index);
  };

  // Initial validation when component mounts
  useEffect(() => {
    if (item.value) {
      const error = validateField(item.value, item.key);
      setErrors((prev) => ({
        ...prev,
        [item.key]: error,
      }));
    }
  }, []);

  return (
    <View style={styles.inputContainer}>
      <View style={[styles.input, errors[item.key] && styles.inputError]}>
        {item.icon && (
          <Icon name={item.icon} size={20} style={styles.inputIcon} />
        )}
        <TextInput
          placeholder={item.label}
          value={item.value}
          onChangeText={handleChange}
          style={styles.textInput}
          keyboardType={
            item.key === 'contact_number'
              ? 'numeric'
              : item.key === 'age'
              ? 'numeric'
              : item.key === 'email'
              ? 'email-address'
              : 'default'
          }
        />
      </View>
      {errors[item.key] ? (
        <Text style={styles.errorText}>{errors[item.key]}</Text>
      ) : null}
    </View>
  );
};

export default ValidatedInput;

const styles = StyleSheet({
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
    color: '#666',
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
});
