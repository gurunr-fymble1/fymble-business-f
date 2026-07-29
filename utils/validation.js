
/**
 * Validation rules for form fields
 * Each rule is a function that takes a value and returns true if valid
 */

export const validationRules = {
  // Basic required field check
  required: (value) =>
    value !== undefined && value !== null && value.toString().trim() !== '',

  // Email validation
  email: (value) => {
    if (!value) return true; // Optional email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // Phone number validation (basic)
  phone: (value) => {
    if (!value) return true; // Optional phone
    const phoneRegex = /^\d{10,12}$/;
    return phoneRegex.test(value.replace(/[^\d]/g, ''));
  },

  // Minimum length validation
  minLength: (length) => (value) => {
    if (!value) return true; // Optional
    return value.length >= length;
  },

  // Maximum length validation
  maxLength: (length) => (value) => {
    if (!value) return true; // Optional
    return value.length <= length;
  },
};

/**
 * Field validation schema
 * @typedef {Object} ValidationSchema
 * @property {Array<Function>} rules - Array of validation functions
 * @property {string} message - Error message when validation fails
 */

/**
 * Validates form data against a schema
 * @param {Object} data - Form data object
 * @param {Object.<string, ValidationSchema>} schema - Validation schema
 * @returns {Object} - { isValid: boolean, errors: Object }
 */

export const validateForm = (data, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach((fieldName) => {
    const field = schema[fieldName];
    const value = data[fieldName];

    // For each field, iterate through its rules
    for (const validation of field.validations) {
      const isFieldValid = validation.rule(value);

      if (!isFieldValid) {
        isValid = false;
        errors[fieldName] = validation.message;
        break; // Stop on first validation error for this field
      }
    }
  });

  return { isValid, errors };
};

/**
 * Creates a validation schema for a form
 * @param {Object} schemaDefinition - Schema definition object
 * @returns {Object} - Validation schema
 */

export const createValidationSchema = (schemaDefinition) => {
  return schemaDefinition;
};
