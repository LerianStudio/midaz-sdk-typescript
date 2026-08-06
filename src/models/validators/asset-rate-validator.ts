/**
 */

import { ValidationResult } from '../../util/validation';
import { UpdateAssetRateInput } from '../asset-rate';

const ASSET_CODE_MIN_LENGTH = 2;

const ASSET_CODE_MAX_LENGTH = 10;

const SOURCE_MAX_LENGTH = 200;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateAssetCode(
  errors: Record<string, string>,
  field: 'from' | 'to',
  value: string | undefined
): void {
  if (!value) {
    errors[field] = `${field} is required`;
    return;
  }

  if (value.length < ASSET_CODE_MIN_LENGTH || value.length > ASSET_CODE_MAX_LENGTH) {
    errors[field] = `${field} must be between 2 and 10 characters`;
  }
}

function validateNonNegativeInteger(
  errors: Record<string, string>,
  field: 'scale' | 'ttl',
  value: number | undefined
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    errors[field] = `${field} must be a non-negative integer`;
  }
}

/**
 * Validates an UpdateAssetRateInput object against the ledger's asset rate contract.
 *
 * The ledger takes the rate as an integer paired with `scale`, never as a float:
 * 1 BRL = 5.20 USD is `{ rate: 520, scale: 2 }`. A fractional `rate` is rejected
 * here rather than surfacing as an opaque unmarshalling error from the server.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const result = validateUpdateAssetRateInput({
 *   from: "BRL",
 *   to: "USD",
 *   rate: 520,
 *   scale: 2,
 * });
 * ```
 */
export function validateUpdateAssetRateInput(input: UpdateAssetRateInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input) {
    return { valid: false, message: 'input is required' };
  }

  validateAssetCode(errors, 'from', input.from);
  validateAssetCode(errors, 'to', input.to);

  if (input.rate === undefined || input.rate === null) {
    errors.rate = 'rate is required';
  } else if (!Number.isInteger(input.rate)) {
    errors.rate = `rate must be an integer, use scale to express decimals (5.20 is rate 520 with scale 2)`;
  }

  validateNonNegativeInteger(errors, 'scale', input.scale);
  validateNonNegativeInteger(errors, 'ttl', input.ttl);

  if (input.source !== undefined && input.source.length > SOURCE_MAX_LENGTH) {
    errors.source = 'source must be at most 200 characters';
  }

  if (input.externalId !== undefined && !UUID_PATTERN.test(input.externalId)) {
    errors.externalId = 'externalId must be a UUID';
  }

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
