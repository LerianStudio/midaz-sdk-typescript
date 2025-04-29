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
          name: ['Asset name cannot exceed 256 characters']
        }
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
          name: ['Asset name cannot be empty']
        }
      };
    }
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
    // Check for empty name
    if (input.name === '') {
      results.push({
        valid: false,
        message: 'Asset name cannot be empty',
        fieldErrors: {
          name: ['Asset name cannot be empty']
        }
      });
    }
    
    // Add validation for name length
    if (input.name.length > 256) {
      results.push({
        valid: false,
        message: 'Asset name cannot exceed 256 characters',
        fieldErrors: {
          name: ['Asset name cannot exceed 256 characters']
        }
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetRateInput object
 * 
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
  if (input.effectiveAt && input.expirationAt) {
    const effectiveDate = new Date(input.effectiveAt);
    const expirationDate = new Date(input.expirationAt);
    
    // Check if dates are valid
    if (isNaN(effectiveDate.getTime())) {
      results.push({
        valid: false,
        message: 'effectiveAt must be a valid date',
        fieldErrors: {
          effectiveAt: ['Must be a valid date format']
        }
      });
    }
    
    if (isNaN(expirationDate.getTime())) {
      results.push({
        valid: false,
        message: 'expirationAt must be a valid date',
        fieldErrors: {
          expirationAt: ['Must be a valid date format']
        }
      });
    }
    
    // Check if expiration is after effective date
    if (!isNaN(effectiveDate.getTime()) && !isNaN(expirationDate.getTime()) &&
        effectiveDate >= expirationDate) {
      results.push({
        valid: false,
        message: 'effectiveAt must be before expirationAt',
        fieldErrors: {
          expirationAt: ['Expiration date must be after effective date']
        }
      });
    }
  }

  return combineValidationResults(results);
}
