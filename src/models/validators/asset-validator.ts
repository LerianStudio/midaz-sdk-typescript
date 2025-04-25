/**
 * Asset validation functions
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validateNumber,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation/validation';
import { CreateAssetInput, UpdateAssetInput } from '../asset';
import { UpdateAssetRateInput } from '../asset-rate';

/**
 * Validates a CreateAssetInput object
 * 
 * @param input - The CreateAssetInput object to validate
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

  // Validate non-empty fields
  if (input.name) {
    results.push(validateNotEmpty(input.name, 'name'));
  }

  // Validate asset code format
  if (input.code) {
    results.push(
      validatePattern(
        input.code,
        /^[A-Z0-9]{2,10}$/,
        'code',
        'Asset code must be 2-10 uppercase letters or numbers'
      )
    );
  }

  // Validate asset type if provided
  if (input.type) {
    const validTypes = [
      'currency',
      'crypto',
      'security',
      'commodity',
      'loyalty',
      'custom',
    ];

    if (!validTypes.includes(input.type.toLowerCase())) {
      results.push({
        valid: false,
        message: `Asset type must be one of: ${validTypes.join(', ')}`,
        fieldErrors: {
          type: [`Asset type must be one of: ${validTypes.join(', ')}`]
        }
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetInput object
 * 
 * @param input - The UpdateAssetInput object to validate
 * @returns ValidationResult indicating if the input is valid
 */
export function validateUpdateAssetInput(input: UpdateAssetInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate that at least one field is being updated
  if (
    !input.name &&
    !input.status &&
    !input.metadata
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

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetRateInput object
 * 
 * @param input - The UpdateAssetRateInput object to validate
 * @returns ValidationResult indicating if the input is valid
 */
export function validateUpdateAssetRateInput(input: UpdateAssetRateInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateRequired(input.fromAsset, 'fromAsset'),
    validateRequired(input.toAsset, 'toAsset'),
    validateRequired(input.rate, 'rate'),
  ];

  // Validate asset codes
  if (input.fromAsset) {
    results.push(
      validatePattern(
        input.fromAsset,
        /^[A-Z0-9]{2,10}$/,
        'fromAsset',
        'From asset code must be 2-10 uppercase letters or numbers'
      )
    );
  }

  if (input.toAsset) {
    results.push(
      validatePattern(
        input.toAsset,
        /^[A-Z0-9]{2,10}$/,
        'toAsset',
        'To asset code must be 2-10 uppercase letters or numbers'
      )
    );
  }

  // Validate rate is a positive number
  if (input.rate !== undefined) {
    results.push(
      validateNumber(input.rate, 'rate', {
        min: 0,
        allowZero: false,
      })
    );
  }

  // Validate dates if provided
  // (Additional date validation logic would go here)

  return combineValidationResults(results);
}
