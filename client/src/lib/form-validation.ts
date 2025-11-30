
/**
 * Form Validation Utilities
 * Provides consistent validation rules and error handling across all forms
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface FieldValidation {
  [key: string]: ValidationRule;
}

export const validateField = (
  value: any,
  rules: ValidationRule,
  fieldName: string
): string | null => {
  // Required check
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return null;
  }

  const stringValue = String(value).trim();

  // Min length check
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Max length check
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} must not exceed ${rules.maxLength} characters`;
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldName} format is invalid`;
  }

  // Min value check (for numbers)
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `${fieldName} must be at least ${rules.min}`;
  }

  // Max value check (for numbers)
  if (rules.max !== undefined && Number(value) > rules.max) {
    return `${fieldName} must not exceed ${rules.max}`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (
  data: Record<string, any>,
  validationRules: FieldValidation,
  fieldNames?: Record<string, string>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(validationRules).forEach((field) => {
    const displayName = fieldNames?.[field] || field;
    const error = validateField(data[field], validationRules[field], displayName);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+\.?\d*$/,
  url: /^https?:\/\/.+/,
};

// Common validation rules
export const COMMON_RULES = {
  email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    maxLength: 100,
  },
  phone: {
    pattern: VALIDATION_PATTERNS.phone,
    minLength: 10,
    maxLength: 20,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  price: {
    required: true,
    min: 0,
    custom: (value: any) => {
      if (isNaN(Number(value))) {
        return "Price must be a valid number";
      }
      return null;
    },
  },
  quantity: {
    required: true,
    min: 0,
    custom: (value: any) => {
      if (isNaN(Number(value))) {
        return "Quantity must be a valid number";
      }
      return null;
    },
  },
};

// Error message mapper for server errors
export const mapServerError = (error: any): { message: string; errors?: Record<string, string> } => {
  // Validation errors
  if (error?.response?.data?.errors) {
    return {
      message: "Please fix the errors below",
      errors: error.response.data.errors,
    };
  }

  // Duplicate entry
  if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
    return {
      message: error.message || "This entry already exists",
      errors: {},
    };
  }

  // Generic error
  return {
    message: error?.response?.data?.message || error?.message || "An error occurred",
    errors: {},
  };
};
