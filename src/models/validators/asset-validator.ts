/**
 * Asset validation functions
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation/validation';
import { CreateAssetInput, UpdateAssetInput } from '../asset';

/**
 * Validates a CreateAssetInput object
 *
 * @returns ValidationResult indicating if the input is valid
 */
export function validateCreateAssetInput(input: CreateAssetInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateRequired(input.name, 'name'),
    validateRequired(input.code, 'code'),
  ];

  // Validate non-empty fields and length
  if (input.name) {
    results.push(validateNotEmpty(input.name, 'name'));

    // Add validation for name length
    if (input.name.length > 256) {
      results.push({
        valid: false,
        message: 'Asset name cannot exceed 256 characters',
        fieldErrors: {
          name: ['Asset name cannot exceed 256 characters'],
        },
      });
    }
  }

  // Validate asset code format
  if (input.code) {
    results.push(
      validatePattern(
        input.code,
        /^[A-Z0-9]{2,10}$/,
        'code',
        'Currency code must follow ISO 4217 standard format'
      )
    );
  }

  // Validate asset type if provided
  if (input.type) {
    const validTypes = ['currency', 'crypto', 'security', 'commodity', 'loyalty', 'custom'];

    if (!validTypes.includes(input.type.toLowerCase())) {
      results.push({
        valid: false,
        message: `Asset type must be one of: ${validTypes.join(', ')}`,
        fieldErrors: {
          type: [`Asset type must be one of: ${validTypes.join(', ')}`],
        },
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetInput object
 *
 * @returns ValidationResult indicating if the input is valid
 */
export function validateUpdateAssetInput(input: UpdateAssetInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Special case for empty name
  if (input.name !== undefined) {
    if (input.name === '' || input.name.trim() === '') {
      return {
        valid: false,
        message: 'Asset name cannot be empty',
        fieldErrors: {
          name: ['Asset name cannot be empty'],
        },
      };
    }
  }

  // Validate that at least one field is being updated
  if (!input.name && !input.status && !input.metadata) {
    return {
      valid: false,
      message: 'At least one field must be updated',
      fieldErrors: {
        input: ['At least one field must be updated'],
      },
    };
  }

  const results: ValidationResult[] = [];

  // Validate name if provided
  if (input.name !== undefined) {
    // Check for empty name
    if (input.name === '') {
      results.push({
        valid: false,
        message: 'Asset name cannot be empty',
        fieldErrors: {
          name: ['Asset name cannot be empty'],
        },
      });
    }

    // Add validation for name length
    if (input.name.length > 256) {
      results.push({
        valid: false,
        message: 'Asset name cannot exceed 256 characters',
        fieldErrors: {
          name: ['Asset name cannot exceed 256 characters'],
        },
      });
    }
  }

  return combineValidationResults(results);
}
