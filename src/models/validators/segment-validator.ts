/**
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateSegmentInput, UpdateSegmentInput } from '../segment';

/**
 * Validates a CreateSegmentInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. Required fields are present (name)
 * 2. Fields are not empty
 * 3. Field length constraints (name must be ≤ 256 characters)
 * 4. Metadata constraints (if provided)
 *
 * Segments allow for further categorization and grouping of accounts within a ledger,
 * enabling more detailed reporting and management. Common uses include business unit
 * categorization, geographic segmentation, and product line segmentation.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const input: CreateSegmentInput = {
 *   name: "North America",
 *   metadata: {
 *     regionCode: "NA",
 *     countries: ["US", "CA", "MX"]
 *   }
 * };
 *
 * const result = validateCreateSegmentInput(input);
 * if (result.valid) {
 *   // Proceed with segment creation
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateCreateSegmentInput(input: CreateSegmentInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Validate required fields
  const results: ValidationResult[] = [validateNotEmpty(input.name, 'name')];

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

  // Validate metadata if present
  if (input.metadata) {
    const metadataErrors = validateMetadata(input.metadata);
    if (metadataErrors.length > 0) {
      results.push({
        valid: false,
        message: 'Invalid metadata',
        fieldErrors: {
          metadata: metadataErrors,
        },
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates an UpdateSegmentInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated
 * 2. If name is provided, it's not empty and within length limits (≤ 256 characters)
 * 3. Metadata constraints (if provided)
 * 4. All provided fields meet their respective validation rules
 *
 * Note that unlike creation, updates don't require any specific fields as long as at least
 * one valid field is being updated.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const updateInput: UpdateSegmentInput = {
 *   name: "North America Region",
 *   status: StatusCode.ACTIVE,
 *   metadata: {
 *     regionCode: "NAR",
 *     countries: ["US", "CA", "MX"],
 *     timeZones: ["EST", "CST", "MST", "PST"]
 *   }
 * };
 *
 * const result = validateUpdateSegmentInput(updateInput);
 * if (result.valid) {
 *   // Proceed with segment update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateSegmentInput(input: UpdateSegmentInput): ValidationResult {
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

  // Validate metadata if present
  if (input.metadata) {
    const metadataErrors = validateMetadata(input.metadata);
    if (metadataErrors.length > 0) {
      results.push({
        valid: false,
        message: 'Invalid metadata',
        fieldErrors: {
          metadata: metadataErrors,
        },
      });
    }
  }

  return combineValidationResults(results);
}

/**
 * Validates metadata map keys and values to ensure they meet size constraints.
 *
 * This validator checks:
 * 1. Metadata keys are not too long (≤ 100 characters)
 * 2. String values are not too long (≤ 2000 characters)
 *
 * Metadata is used to store additional custom information about segments,
 * such as region codes, business unit identifiers, or reporting categories.
 *
 * @returns Array of validation error messages, empty if valid
 *
 * @example
 * ```typescript
 * const metadata = {
 *   regionCode: "NA",
 *   countries: ["US", "CA", "MX"],
 *   description: "North American operations including US, Canada, and Mexico"
 * };
 *
 * const errors = validateMetadata(metadata);
 * if (errors.length > 0) {
 *   console.error("Metadata validation failed:", errors);
 * }
 * ```
 */
function validateMetadata(metadata: Record<string, any>): string[] {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (key.length > 100) {
      errors.push(`Metadata key '${key}' must be at most 100 characters`);
    }

    if (typeof value === 'string' && value.length > 2000) {
      errors.push(`Metadata value for key '${key}' must be at most 2000 characters`);
    }
  }

  return errors;
}
