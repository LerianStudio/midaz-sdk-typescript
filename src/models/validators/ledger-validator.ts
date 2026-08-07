/**
 */

import {
  combineValidationResults,
  validateNotEmpty,
  validateRequired,
  ValidationResult,
} from '../../util/validation';
import { CreateLedgerInput, UpdateLedgerInput, UpdateLedgerSettingsInput } from '../ledger';

type SettingsFieldType = 'boolean' | 'string' | 'number';

/**
 * The ledger's own settings allowlist, mirrored so a patch it would refuse with
 * `0147`/`0148`/`0149`/`0176` never reaches the wire.
 */
const SETTINGS_SCHEMA: Record<string, Record<string, SettingsFieldType>> = {
  accounting: {
    validateAccountType: 'boolean',
    validateRoutes: 'boolean',
    requireHolder: 'boolean',
  },
  tracer: {
    mode: 'string',
    failPosture: 'string',
    timeoutMs: 'number',
  },
  overrides: {
    allowFeeSkip: 'boolean',
    allowTracerSkip: 'boolean',
    allowHolderSkip: 'boolean',
  },
};

/**
 * Values the ledger accepts for the fields whose type alone is too wide
 */
const SETTINGS_ENUMS: Record<string, readonly string[]> = {
  'tracer.mode': ['off', 'advisory', 'enforce'],
  'tracer.failPosture': ['open', 'closed'],
};

/**
 * Group each nested field belongs to, so a field written at the root can be
 * refused with the path it should have had
 */
const SETTINGS_FIELD_GROUP: Record<string, string> = Object.fromEntries(
  Object.entries(SETTINGS_SCHEMA).flatMap(([group, fields]) =>
    Object.keys(fields).map((field) => [field, group])
  )
);

/**
 * @returns A failed validation carrying one message on one field path
 */
function settingsError(path: string, message: string): ValidationResult {
  return {
    valid: false,
    message,
    fieldErrors: { [path]: [message] },
  };
}

/**
 * @returns The rejection for a leaf whose value the ledger would refuse, or undefined
 */
function validateSettingsField(
  path: string,
  expected: SettingsFieldType,
  value: unknown
): ValidationResult | undefined {
  if (typeof value !== expected) {
    return settingsError(path, `${path} must be a ${expected}`);
  }

  if (expected === 'number' && !Number.isFinite(value)) {
    return settingsError(path, `${path} must be a finite number`);
  }

  const allowed = SETTINGS_ENUMS[path];

  if (allowed && !allowed.includes(value as string)) {
    return settingsError(path, `${path} must be one of ${allowed.join(', ')}`);
  }

  return undefined;
}

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

/**
 * Validates a settings merge-patch against the ledger's allowlist.
 *
 * Unlike validateUpdateLedgerInput, an empty patch is valid: the ledger accepts
 * `{}` and answers with the document unchanged.
 *
 * @returns ValidationResult indicating if the patch is valid, with error messages if not
 *
 * @example
 * ```typescript
 * const result = validateUpdateLedgerSettingsInput({
 *   overrides: { allowFeeSkip: true }
 * });
 * ```
 */
export function validateUpdateLedgerSettingsInput(
  input: UpdateLedgerSettingsInput
): ValidationResult {
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const group = SETTINGS_SCHEMA[key];

    if (!group) {
      const owner = SETTINGS_FIELD_GROUP[key];

      return owner
        ? settingsError(
            `${owner}.${key}`,
            `${key} is a field of ${owner}, so it must be sent as ${owner}.${key}, not at the root of the patch`
          )
        : settingsError(key, `${key} is not a ledger settings group`);
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      return settingsError(key, `${key} must be an object carrying the fields to patch`);
    }

    for (const [field, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      const path = `${key}.${field}`;
      const expected = group[field];

      if (!expected) {
        return settingsError(path, `${path} is not a ledger settings field`);
      }

      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }

      const failure = validateSettingsField(path, expected, fieldValue);

      if (failure) {
        return failure;
      }
    }
  }

  return { valid: true };
}
