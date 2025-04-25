/**
 * Account validation functions
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validatePattern,
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

  // Validate required fields
  const results: ValidationResult[] = [
    validateRequired(input.name, 'name'),
    validateRequired(input.assetCode, 'assetCode'),
    validateRequired(input.type, 'type'),
  ];

  // Validate non-empty fields
  if (input.name) {
    results.push(validateNotEmpty(input.name, 'name'));
  }

  // Validate asset code format (ISO 4217-like, 2-10 uppercase letters or numbers)
  if (input.assetCode) {
    results.push(
      validatePattern(
        input.assetCode, 
        /^[A-Z0-9]{2,10}$/, 
        'assetCode',
        'Asset code must be 2-10 uppercase letters or numbers'
      )
    );
  }

  // Validate account type is one of the allowed values
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
      results.push({
        valid: false,
        message: `Account type must be one of: ${validTypes.join(', ')}`,
        fieldErrors: {
          type: [`Account type must be one of: ${validTypes.join(', ')}`]
        }
      });
    }
  }

  return combineValidationResults(results);
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
      message: 'At least one field must be updated',
      fieldErrors: {
        input: ['At least one field must be updated']
      }
    };
  }

  const results: ValidationResult[] = [];

  // Validate name if provided
  if (input.name !== undefined) {
    results.push(validateNotEmpty(input.name, 'name'));
  }

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
