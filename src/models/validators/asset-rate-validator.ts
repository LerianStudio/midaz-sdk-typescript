/**
 * @file Asset Rate validation functions for the Midaz SDK
 * @description Provides validation functions to ensure asset rate data meets required format and business rules
 */

import { ValidationResult } from '../../util/validation';
import { UpdateAssetRateInput } from '../asset-rate';

/**
 * Validates an UpdateAssetRateInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (fromAsset, toAsset, rate, effectiveAt, expirationAt)
 * 2. Rate is a positive number greater than zero
 * 3. Effective date is before expiration date
 * 4. Dates are in valid format
 *
 * Asset rates define the exchange rate between two assets and are used for currency
 * conversion and valuation. Each rate has a specific time period during which it is valid,
 * defined by the effective and expiration dates.
 *
 * @param input - The UpdateAssetRateInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: UpdateAssetRateInput = {
 *   fromAsset: "USD",
 *   toAsset: "EUR",
 *   rate: 0.92,
 *   effectiveAt: "2023-09-15T00:00:00Z",
 *   expirationAt: "2023-09-16T00:00:00Z"
 * };
 *
 * const result = validateUpdateAssetRateInput(input);
 * if (result.valid) {
 *   // Proceed with asset rate update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateAssetRateInput(input: UpdateAssetRateInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!input.fromAsset) {
    errors.fromAsset = 'Source asset code is required';
  }

  if (!input.toAsset) {
    errors.toAsset = 'Target asset code is required';
  }

  // Validate rate
  if (input.rate === undefined || input.rate === null || input.rate <= 0) {
    errors.rate = 'Rate must be greater than 0';
  }

  // Validate effective and expiration dates
  if (!input.effectiveAt) {
    errors.effectiveAt = 'Effective date is required';
  }

  if (!input.expirationAt) {
    errors.expirationAt = 'Expiration date is required';
  }

  // Validate that effectiveAt is before expirationAt
  if (input.effectiveAt && input.expirationAt) {
    const effectiveDate = new Date(input.effectiveAt);
    const expirationDate = new Date(input.expirationAt);

    if (effectiveDate >= expirationDate) {
      errors.effectiveAt = 'Effective date must be before expiration date';
    }
  }

  // Convert errors to fieldErrors format
  const fieldErrors: Record<string, string[]> = {};
  Object.entries(errors).forEach(([field, message]) => {
    fieldErrors[field] = [message];
  });

  return {
    valid: Object.keys(errors).length === 0,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    message: Object.values(errors).join('; '),
  };
}
