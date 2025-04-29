/**
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreatePortfolioInput, UpdatePortfolioInput } from '../portfolio';

/**
 * Validates a CreatePortfolioInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (entityId, name)
 * 2. Fields are not empty
 * 3. Field length constraints (name and entityId must be ≤ 256 characters)
 *
 * Portfolios are used to group accounts for investment management, reporting,
 * and performance tracking purposes. The entityId links the portfolio to a client,
 * customer, department, or other entity.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: CreatePortfolioInput = {
 *   entityId: "client_12345",
 *   name: "Retirement Portfolio"
 * };
 *
 * const result = validateCreatePortfolioInput(input);
 * if (result.valid) {
 *   // Proceed with portfolio creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreatePortfolioInput(input: CreatePortfolioInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [
    validateNotEmpty(input.entityId, 'entityId'),
    validateNotEmpty(input.name, 'name'),
  ];

  // Validate field length constraints
  if (input.name && input.name.length > 256) {
    results.push({
      valid: false,
      message: 'Name must be at most 256 characters',
      fieldErrors: {
        name: ['Name must be at most 256 characters'],
      },
    });
  }

  if (input.entityId && input.entityId.length > 256) {
    results.push({
      valid: false,
      message: 'Entity ID must be at most 256 characters',
      fieldErrors: {
        entityId: ['Entity ID must be at most 256 characters'],
      },
    });
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdatePortfolioInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If name is provided, it's not empty and within length limits (≤ 256 characters)
 * 3. All provided fields meet their respective validation rules
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated. Also, the entityId cannot be changed after portfolio creation.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdatePortfolioInput = {
 *   name: "Retirement Portfolio - Growth Strategy",
 *   status: StatusCode.ACTIVE,
 *   metadata: {
 *     riskProfile: "moderate",
 *     targetReturn: "8-10%"
 *   }
 * };
 *
 * const result = validateUpdatePortfolioInput(updateInput);
 * if (result.valid) {
 *   // Proceed with portfolio update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdatePortfolioInput(input: UpdatePortfolioInput): ValidationResult {
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
    if (input.name === '') {
      results.push({
        valid: false,
        message: 'Name cannot be empty',
        fieldErrors: {
          name: ['Name cannot be empty'],
        },
      });
    } else if (input.name.length > 256) {
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
