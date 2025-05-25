/**
 * Validation Utility Example
 *
 * This example demonstrates how to use the validation utilities from the Midaz SDK
 * to implement robust data validation with structured error handling.
 */

import {
  validate,
  validateCountryCode,
  validateNotEmpty,
  validateNumber,
  validatePattern,
  validateRequired,
  ValidationError,
  ValidationResult,
} from '../src/util/validation';

// Example 1: Basic Field Validation
function basicValidationExample() {
  console.log('\n=== Basic Field Validation Example ===');

  // Required field validation
  const emptyString = '';
  const nullValue = null;
  const undefinedValue = undefined;
  const validValue = 'Hello';

  console.log('Validating required field (empty string):', validateRequired(emptyString, 'Field'));
  console.log('Validating required field (null):', validateRequired(nullValue, 'Field'));
  console.log('Validating required field (undefined):', validateRequired(undefinedValue, 'Field'));
  console.log('Validating required field (valid value):', validateRequired(validValue, 'Field'));

  // Not empty validation
  console.log('Validating not empty (empty string):', validateNotEmpty(emptyString, 'Field'));
  console.log('Validating not empty (valid value):', validateNotEmpty(validValue, 'Field'));

  // Pattern validation
  const zipCode = '12345';
  const invalidZipCode = 'ABC';

  console.log(
    `Validating pattern for "${zipCode}" (US zip code):`,
    validatePattern(zipCode, /^\d{5}(-\d{4})?$/, 'ZipCode', 'a valid US zip code')
  );
  console.log(
    `Validating pattern for "${invalidZipCode}" (US zip code):`,
    validatePattern(invalidZipCode, /^\d{5}(-\d{4})?$/, 'ZipCode', 'a valid US zip code')
  );

  // Number validation
  const validAge = 25;
  const invalidAge = -5;

  console.log(
    `Validating number ${validAge}:`,
    validateNumber(validAge, 'Age', { min: 0, max: 120 })
  );
  console.log(
    `Validating number ${invalidAge}:`,
    validateNumber(invalidAge, 'Age', { min: 0, max: 120 })
  );

  // Country code validation
  const validCountry = 'US';
  const invalidCountry = 'USA';

  console.log(
    `Validating country code "${validCountry}":`,
    validateCountryCode(validCountry, 'Country')
  );
  console.log(
    `Validating country code "${invalidCountry}":`,
    validateCountryCode(invalidCountry, 'Country')
  );
}

// Example 2: Object Validation
function objectValidationExample() {
  console.log('\n=== Object Validation Example ===');

  // Define a user object type
  interface User {
    id: string;
    email: string;
    name: string;
    age: number;
    phone?: string;
    zipCode?: string;
  }

  // Valid user
  const validUser: User = {
    id: 'user123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    age: 30,
    phone: '+1 (555) 123-4567',
    zipCode: '12345',
  };

  // Invalid user
  const invalidUser: any = {
    id: '', // Missing required field
    email: 'not-an-email', // Invalid email
    name: 'J', // Too short
    age: 'thirty', // Not a number
    phone: '123', // Invalid phone
    zipCode: 'ABC', // Invalid pattern
  };

  // Define validation schema
  const userValidationSchema = {
    id: (value: string): ValidationResult => validateRequired(value, 'User ID'),
    name: (value: string): ValidationResult => {
      const requiredResult = validateRequired(value, 'Name');
      if (!requiredResult.valid) return requiredResult;

      if (value.length < 2 || value.length > 50) {
        return {
          valid: false,
          message: 'Name must be between 2 and 50 characters',
          fieldErrors: {
            name: ['Name must be between 2 and 50 characters'],
          },
        };
      }

      return { valid: true };
    },
    age: (value: any): ValidationResult => {
      if (typeof value !== 'number') {
        return {
          valid: false,
          message: 'Age must be a number',
          fieldErrors: {
            age: ['Age must be a number'],
          },
        };
      }

      return validateNumber(value, 'Age', { min: 18, max: 120 });
    },
    email: (value: string): ValidationResult => {
      const requiredResult = validateRequired(value, 'Email');
      if (!requiredResult.valid) return requiredResult;

      // Simple email validation pattern
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return {
          valid: false,
          message: 'Email must be a valid email address',
          fieldErrors: {
            email: ['Email must be a valid email address'],
          },
        };
      }

      return { valid: true };
    },
    zipCode: (value: string | undefined): ValidationResult => {
      if (!value) return { valid: true }; // Optional field
      return validatePattern(value, /^\d{5}(-\d{4})?$/, 'ZipCode', 'a valid US zip code');
    },
  };

  // Validate the objects
  console.log('Validating valid user:');
  try {
    // Manual validation
    const idResult = userValidationSchema.id(validUser.id);
    const nameResult = userValidationSchema.name(validUser.name);
    const ageResult = userValidationSchema.age(validUser.age);
    const zipResult = userValidationSchema.zipCode(validUser.zipCode);

    if (!idResult.valid || !nameResult.valid || !ageResult.valid || !zipResult.valid) {
      const fieldErrors: Record<string, string[]> = {};

      if (!idResult.valid && idResult.fieldErrors) Object.assign(fieldErrors, idResult.fieldErrors);
      if (!nameResult.valid && nameResult.fieldErrors)
        Object.assign(fieldErrors, nameResult.fieldErrors);
      if (!ageResult.valid && ageResult.fieldErrors)
        Object.assign(fieldErrors, ageResult.fieldErrors);
      if (!zipResult.valid && zipResult.fieldErrors)
        Object.assign(fieldErrors, zipResult.fieldErrors);

      throw new ValidationError('Validation failed', fieldErrors);
    }

    console.log('Validation passed');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation failed:', error.message);
      console.error('Field errors:', error.fieldErrors);
    } else {
      console.error('Unexpected error:', error);
    }
  }

  console.log('\nValidating invalid user:');
  // Directly validate and display results for invalid user
  console.log('Validating fields:');
  const idResult = userValidationSchema.id(invalidUser.id);
  const nameResult = userValidationSchema.name(invalidUser.name);
  const ageResult = userValidationSchema.age(invalidUser.age);
  const emailResult = userValidationSchema.email(invalidUser.email);
  const zipResult = userValidationSchema.zipCode(invalidUser.zipCode);

  const fieldErrors: Record<string, string[]> = {};
  let hasErrors = false;

  console.log('  ID validation result:', idResult);
  if (!idResult.valid && idResult.fieldErrors) {
    hasErrors = true;
    Object.assign(fieldErrors, idResult.fieldErrors);
  }

  console.log('  Name validation result:', nameResult);
  if (!nameResult.valid && nameResult.fieldErrors) {
    hasErrors = true;
    Object.assign(fieldErrors, nameResult.fieldErrors);
  }

  console.log('  Age validation result:', ageResult);
  if (!ageResult.valid && ageResult.fieldErrors) {
    hasErrors = true;
    Object.assign(fieldErrors, ageResult.fieldErrors);
  }

  console.log('  Email validation result:', emailResult);
  if (!emailResult.valid && emailResult.fieldErrors) {
    hasErrors = true;
    Object.assign(fieldErrors, emailResult.fieldErrors);
  }

  console.log('  ZipCode validation result:', zipResult);
  if (!zipResult.valid && zipResult.fieldErrors) {
    hasErrors = true;
    Object.assign(fieldErrors, zipResult.fieldErrors);
  }

  console.log('\nCombined validation result:');
  if (hasErrors) {
    console.log('  Valid: false');
    console.log('  Field errors:', fieldErrors);
  } else {
    console.log('  Valid: true');
  }
}

// Example 3: Using the validate helper
function validateHelperExample() {
  console.log('\n=== Validate Helper Example ===');

  // Define a validator function
  const validateAge = (age: number): ValidationResult => {
    return validateNumber(age, 'Age', { min: 18, max: 120 });
  };

  // Valid case
  try {
    console.log('Validating valid age (25):');
    validate(25, validateAge);
    console.log('Validation passed');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation failed:', error.message);
      console.error('Field errors:', error.fieldErrors);
    } else {
      console.error('Unexpected error:', error);
    }
  }

  // Invalid case
  try {
    console.log('\nValidating invalid age (15):');
    validate(15, validateAge);
    console.log('Validation passed');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation failed:', error.message);
      console.error('Field errors:', error.fieldErrors);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run the examples
function runExamples() {
  try {
    basicValidationExample();
    objectValidationExample();
    validateHelperExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
