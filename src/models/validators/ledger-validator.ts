/**
 * @file Ledger validation functions for the Midaz SDK
 * @description Provides validation functions to ensure ledger data meets required format and business rules
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validatePattern,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateLedgerInput, UpdateLedgerInput } from '../ledger';

/**
 * Validates a CreateLedgerInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (name)
 * 2. Name is not empty
 *
 * Ledgers are the primary containers for financial data in the Midaz system,
 * and while they have minimal validation requirements, the name is essential
 * for identification purposes.
 *
 * @param input - The CreateLedgerInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: CreateLedgerInput = {
 *   name: "Corporate General Ledger"
 * };
 *
 * const result = validateCreateLedgerInput(input);
 * if (result.valid) {
 *   // Proceed with ledger creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreateLedgerInput(input: CreateLedgerInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [validateNotEmpty(input.name, 'name')];

  return combineValidationResults(results);
}

/**
 * Validates an UpdateLedgerInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If name is provided, it's not empty
 * 3. All provided fields meet their respective validation rules
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated.
 *
 * @param input - The UpdateLedgerInput object to validate
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdateLedgerInput = {
 *   name: "Corporate General Ledger 2023",
 *   status: StatusCode.ACTIVE,
 *   metadata: {
 *     fiscalYear: "2023",
 *     accountingStandard: "GAAP"
 *   }
 * };
 *
 * const result = validateUpdateLedgerInput(updateInput);
 * if (result.valid) {
 *   // Proceed with ledger update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateLedgerInput(input: UpdateLedgerInput): ValidationResult {
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
  }

  return combineValidationResults(results);
}
