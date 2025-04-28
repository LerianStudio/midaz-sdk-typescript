/**
 * Account validation functions
 */

import {
  validateNotEmpty as _validateNotEmpty,
  validatePattern as _validatePattern,
  combineValidationResults,
  validateRequired,
  ValidationResult,
} from '../../util/validation/validation';
import { CreateAccountInput, UpdateAccountInput } from '../account';

/**
 * Validates a CreateAccountInput object
 * 
 * @param input - The CreateAccountInput object to validate
 * @returns ValidationResult indicating if the input is valid
 */
export function validateCreateAccountInput(input: CreateAccountInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Create a validations array to collect all errors
  const fieldErrors: Record<string, string[]> = {};
  
  // Check required fields
  if (!input.name) {
    fieldErrors.name = ['name is required'];
  }
  
  if (!input.assetCode) {
    fieldErrors.assetCode = ['assetCode is required'];
  }
  
  if (!input.type) {
    fieldErrors.type = ['type is required'];
  }
  
  // Also validate type if present
  if (input.type) {
    const validTypes = [
      'deposit',
      'savings',
      'loans',
      'marketplace',
      'creditCard',
      'external',
    ];

    if (!validTypes.includes(input.type)) {
      fieldErrors.type = fieldErrors.type || [];
      fieldErrors.type.push(`Account type must be one of: ${validTypes.join(', ')}`);
    }
  }
  
  // Validate asset code format if present
  if (input.assetCode) {
    if (!/^[A-Z]{3}$/.test(input.assetCode)) {
      fieldErrors.assetCode = fieldErrors.assetCode || [];
      fieldErrors.assetCode.push('ISO 4217 currency code format required (exactly 3 uppercase letters)');
    }
  }
  
  // Validate non-empty name if present
  if (input.name && input.name.trim() === '') {
    fieldErrors.name = fieldErrors.name || [];
    fieldErrors.name.push('name cannot be empty');
  }
  
  // Return all validation errors together
  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      message: Object.entries(fieldErrors)
        .map(([_field, errors]) => errors[0])
        .join('; '),
      fieldErrors
    };
  }
  
  // If we made it here, all validations passed
  return { valid: true };
}

/**
 * Validates an UpdateAccountInput object
 * 
 * @param input - The UpdateAccountInput object to validate
 * @returns ValidationResult indicating if the input is valid
 */
export function validateUpdateAccountInput(input: UpdateAccountInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Special case for empty name - handle it before other validations
  if (input.name !== undefined) {
    if (input.name === '' || input.name.trim() === '') {
      return {
        valid: false,
        message: 'name cannot be empty',
        fieldErrors: {
          name: ['name cannot be empty']
        }
      };
    }
  }

  // Validate that at least one field is being updated
  if (
    !input.name &&
    !input.status &&
    !input.metadata &&
    input.portfolioId === undefined &&
    input.segmentId === undefined
  ) {
    return {
      valid: false,
      message: 'At least one field must be provided',
      fieldErrors: {
        input: ['At least one field must be provided']
      }
    };
  }

  const results: ValidationResult[] = [];

  // Validate status if provided
  if (input.status) {
    const validStatuses = [
      'ACTIVE',
      'INACTIVE',
      'PENDING',
      'SUSPENDED',
      'ARCHIVED',
      'DELETED',
    ];

    if (!validStatuses.includes(input.status)) {
      results.push({
        valid: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        fieldErrors: {
          status: [`Status must be one of: ${validStatuses.join(', ')}`]
        }
      });
    }
  }

  return combineValidationResults(results);
}
