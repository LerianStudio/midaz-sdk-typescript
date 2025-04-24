/**
 * @file Account validation functions for the Midaz SDK
 * @description Provides validation functions to ensure account data meets required format and business rules
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateAccountInput, UpdateAccountInput } from '../account';

/**
 * Validates a CreateAccountInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (name, type, assetCode)
 * 2. Asset code follows ISO 4217 format (3 uppercase letters)
 * 3. Account type is one of the allowed values
 *
 * @param input - The CreateAccountInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: CreateAccountInput = {
 *   name: "Checking Account",
 *   type: "deposit",
 *   assetCode: "USD"
 * };
 *
 * const result = validateCreateAccountInput(input);
 * if (result.valid) {
 *   // Proceed with account creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreateAccountInput(input: CreateAccountInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateNotEmpty(input.name, 'name'),
    validateNotEmpty(input.type, 'type'),
    validateNotEmpty(input.assetCode, 'assetCode'),
  ];

  // Validate asset code format (ISO 4217)
  results.push(
    validatePattern(
      input.assetCode,
      /^[A-Z]{3}$/,
      'assetCode',
      'Asset code must be a valid ISO 4217 code (e.g., USD, EUR)'
    )
  );

  // Validate account type
  results.push(
    validatePattern(
      input.type,
      /^(deposit|savings|loans|marketplace|creditCard|external)$/,
      'type',
      'Account type must be one of: deposit, savings, loans, marketplace, creditCard, external'
    )
  );

  return combineValidationResults(results);
}

/**
 * Validates an UpdateAccountInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If name is provided, it's not empty
 * 3. All provided fields meet their respective validation rules
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated.
 *
 * @param input - The UpdateAccountInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdateAccountInput = {
 *   name: "Primary Checking Account",
 *   status: StatusCode.INACTIVE
 * };
 *
 * const result = validateUpdateAccountInput(updateInput);
 * if (result.valid) {
 *   // Proceed with account update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateAccountInput(input: UpdateAccountInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate that at least one field is being updated
  if (
    input.name === undefined &&
    input.segmentId === undefined &&
    input.portfolioId === undefined &&
    input.status === undefined &&
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
  if (input.name !== undefined) {
    results.push(validateNotEmpty(input.name, 'name'));
  }

  return combineValidationResults(results);
}
