/**
 * @file Asset validation functions for the Midaz SDK
 * @description Provides validation functions to ensure asset data meets required format and business rules
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validateNumber,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateAssetInput, UpdateAssetInput } from '../asset';
import { UpdateAssetRateInput } from '../asset-rate';

/**
 * Validates a CreateAssetInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (name, code)
 * 2. Name length is within limits (max 256 characters)
 * 3. Asset type is one of the allowed values (if provided)
 * 4. For currency assets, code follows ISO 4217 format (3 uppercase letters)
 *
 * @param input - The CreateAssetInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * // Validating a currency asset
 * const currencyInput: CreateAssetInput = {
 *   name: "US Dollar",
 *   code: "USD",
 *   type: "currency"
 * };
 *
 * // Validating a crypto asset
 * const cryptoInput: CreateAssetInput = {
 *   name: "Bitcoin",
 *   code: "BTC",
 *   type: "crypto"
 * };
 *
 * const result = validateCreateAssetInput(currencyInput);
 * if (result.valid) {
 *   // Proceed with asset creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreateAssetInput(input: CreateAssetInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateNotEmpty(input.name, 'name'),
    validateNotEmpty(input.code, 'code'),
  ];

  // Validate name length
  if (input.name && input.name.length > 256) {
    results.push({
      valid: false,
      message: 'Name must be at most 256 characters',
      fieldErrors: {
        name: ['Name must be at most 256 characters'],
      },
    });
  }

  // Validate asset type if provided
  if (input.type) {
    results.push(
      validatePattern(
        input.type,
        /^(currency|crypto|commodities|others)$/i,
        'type',
        'Asset type must be one of: currency, crypto, commodities, others'
      )
    );

    // If type is currency, validate currency code format
    if (input.type.toLowerCase() === 'currency') {
      results.push(
        validatePattern(
          input.code,
          /^[A-Z]{3}$/,
          'code',
          'Currency code must be a valid ISO 4217 code (e.g., USD, EUR)'
        )
      );
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If name is provided, it's not empty and within length limits
 * 3. All provided fields meet their respective validation rules
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated. Also, the asset code and type cannot be changed after creation.
 *
 * @param input - The UpdateAssetInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdateAssetInput = {
 *   name: "United States Dollar",
 *   status: StatusCode.ACTIVE,
 *   metadata: {
 *     symbol: "$",
 *     decimalPlaces: 2
 *   }
 * };
 *
 * const result = validateUpdateAssetInput(updateInput);
 * if (result.valid) {
 *   // Proceed with asset update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateAssetInput(input: UpdateAssetInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate that at least one field is being updated
  if (input.name === undefined && input.status === undefined && input.metadata === undefined) {
    return {
      valid: false,
      message: 'At least one field must be provided for update',
      fieldErrors: {
        input: ['At least one field must be provided for update'],
      },
    };
  }

  const results: ValidationResult[] = [];

  // Validate optional fields if they are provided
  if (input.name !== undefined) {
    results.push(validateNotEmpty(input.name, 'name'));

    if (input.name && input.name.length > 256) {
      results.push({
        valid: false,
        message: 'Name must be at most 256 characters',
        fieldErrors: {
          name: ['Name must be at most 256 characters'],
        },
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAssetRateInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (fromAsset, toAsset, rate)
 * 2. Rate is a positive number greater than zero
 * 3. Dates are valid and in the correct chronological order
 * 4. The effective date must be before the expiration date
 *
 * Asset rates define the exchange rate between two assets and must have a valid time period
 * during which the rate is applicable.
 *
 * @param input - The UpdateAssetRateInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const rateInput: UpdateAssetRateInput = {
 *   fromAsset: "USD",
 *   toAsset: "EUR",
 *   rate: 0.92,
 *   effectiveAt: "2023-09-15T00:00:00Z",
 *   expirationAt: "2023-09-16T00:00:00Z"
 * };
 *
 * const result = validateUpdateAssetRateInput(rateInput);
 * if (result.valid) {
 *   // Proceed with asset rate update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateAssetRateInput(input: UpdateAssetRateInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateNotEmpty(input.fromAsset, 'fromAsset'),
    validateNotEmpty(input.toAsset, 'toAsset'),
    validateNumber(input.rate, 'rate', { min: 0, allowZero: false }),
  ];

  // Validate dates
  const effectiveDate = new Date(input.effectiveAt);
  const expirationDate = new Date(input.expirationAt);

  if (isNaN(effectiveDate.getTime())) {
    results.push({
      valid: false,
      message: 'effectiveAt must be a valid date',
      fieldErrors: {
        effectiveAt: ['effectiveAt must be a valid date'],
      },
    });
  }

  if (isNaN(expirationDate.getTime())) {
    results.push({
      valid: false,
      message: 'expirationAt must be a valid date',
      fieldErrors: {
        expirationAt: ['expirationAt must be a valid date'],
      },
    });
  }

  if (effectiveDate >= expirationDate) {
    results.push({
      valid: false,
      message: 'effectiveAt must be before expirationAt',
      fieldErrors: {
        effectiveAt: ['effectiveAt must be before expirationAt'],
        expirationAt: ['expirationAt must be after effectiveAt'],
      },
    });
  }

  return combineValidationResults(results);
}
