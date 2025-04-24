/**
 * @file Organization validation functions for the Midaz SDK
 * @description Provides validation functions to ensure organization data meets required format and business rules
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateOrganizationInput, UpdateOrganizationInput } from '../organization';

/**
 * Validates a CreateOrganizationInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (legalName, legalDocument)
 * 2. Fields are not empty
 * 3. Address is valid (if provided)
 * 4. Optional fields meet their respective validation rules
 *
 * Organizations are the top-level entities in the Midaz system and represent
 * legal entities like companies, institutions, or other business entities.
 *
 * @param input - The CreateOrganizationInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: CreateOrganizationInput = {
 *   legalName: "Acme Corporation",
 *   legalDocument: "123456789",
 *   doingBusinessAs: "Acme Inc.",
 *   address: {
 *     line1: "123 Main St",
 *     city: "San Francisco",
 *     state: "CA",
 *     country: "US",
 *     postalCode: "94105"
 *   }
 * };
 *
 * const result = validateCreateOrganizationInput(input);
 * if (result.valid) {
 *   // Proceed with organization creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreateOrganizationInput(input: CreateOrganizationInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateNotEmpty(input.legalName, 'legalName'),
    validateNotEmpty(input.legalDocument, 'legalDocument'),
  ];

  // Validate optional fields if they exist
  if (input.doingBusinessAs !== undefined) {
    results.push(validateNotEmpty(input.doingBusinessAs, 'doingBusinessAs'));
  }

  // Validate address if it exists
  if (input.address) {
    results.push(validateAddress(input.address, 'address'));
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateOrganizationInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If fields are provided, they meet their respective validation rules
 * 3. Address is valid (if provided)
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated.
 *
 * @param input - The UpdateOrganizationInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdateOrganizationInput = {
 *   legalName: "Acme Corporation International",
 *   doingBusinessAs: "Acme Global",
 *   status: StatusCode.ACTIVE,
 *   address: {
 *     line1: "1 Market St",
 *     city: "San Francisco",
 *     state: "CA",
 *     country: "US",
 *     postalCode: "94105"
 *   }
 * };
 *
 * const result = validateUpdateOrganizationInput(updateInput);
 * if (result.valid) {
 *   // Proceed with organization update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateOrganizationInput(input: UpdateOrganizationInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate that at least one field is being updated
  if (
    input.legalName === undefined &&
    input.doingBusinessAs === undefined &&
    input.status === undefined &&
    input.address === undefined &&
    input.parentOrganizationId === undefined &&
    input.metadata === undefined
  ) {
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
  if (input.legalName !== undefined) {
    results.push(validateNotEmpty(input.legalName, 'legalName'));
  }

  if (input.doingBusinessAs !== undefined) {
    results.push(validateNotEmpty(input.doingBusinessAs, 'doingBusinessAs'));
  }

  // Validate address if it exists
  if (input.address) {
    results.push(validateAddress(input.address, 'address'));
  }

  return combineValidationResults(results);
}

/**
 * Validates an address object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required address fields are present (line1, city, state, country)
 * 2. Fields are not empty
 * 3. Country code follows ISO 3166-1 alpha-2 format (2 uppercase letters)
 * 4. Postal code is valid (if provided)
 *
 * Address validation is important for ensuring that organizations have valid
 * physical locations for legal and operational purposes.
 *
 * @param address - The address object to validate
 * @param fieldName - Field name for error message context
 * @returns ValidationResult indicating if the address is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const address = {
 *   line1: "123 Main St",
 *   line2: "Suite 100",
 *   city: "San Francisco",
 *   state: "CA",
 *   country: "US",
 *   postalCode: "94105"
 * };
 *
 * const result = validateAddress(address, "address");
 * if (!result.valid) {
 *   console.error("Address validation failed:", result.message);
 * }
 * ```
 */
function validateAddress(address: any, fieldName: string): ValidationResult {
  const results: ValidationResult[] = [
    validateRequired(address, fieldName),
    validateNotEmpty(address.line1, `${fieldName}.line1`),
    validateNotEmpty(address.city, `${fieldName}.city`),
    validateNotEmpty(address.state, `${fieldName}.state`),
    validateNotEmpty(address.country, `${fieldName}.country`),
  ];

  // Validate postalCode if provided
  if (address.postalCode) {
    results.push(validateNotEmpty(address.postalCode, `${fieldName}.postalCode`));
  }

  // Validate country code format (ISO 3166-1 alpha-2)
  if (address.country) {
    results.push(
      validatePattern(
        address.country,
        /^[A-Z]{2}$/,
        `${fieldName}.country`,
        'Country must be a valid ISO 3166-1 alpha-2 code (e.g., US, GB)'
      )
    );
  }

  return combineValidationResults(results);
}
