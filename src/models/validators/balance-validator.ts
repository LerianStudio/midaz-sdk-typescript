/**
 */

import { validateRequired, ValidationResult } from '../../util/validation';
import { BalanceSettingsInput, CreateBalanceInput, UpdateBalanceInput } from '../balance';

/**
 * Validates an UpdateBalanceInput object to ensure it meets all business rules and constraints.
 *
 * This validator checks:
 * 1. At least one field is being updated (allowSending or allowReceiving)
 * 2. The input object exists and is valid
 *
 * Balance updates are used to control whether an account can send or receive funds.
 * These flags are important for implementing account freezes, holds, or other
 * operational controls on accounts.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 *
 * @example
 * ```typescript
 * // Example: Freeze an account (prevent both sending and receiving)
 * const freezeInput: UpdateBalanceInput = {
 *   allowSending: false,
 *   allowReceiving: false
 * };
 *
 * // Example: Allow receiving but prevent sending
 * const holdInput: UpdateBalanceInput = {
 *   allowSending: false,
 *   allowReceiving: true
 * };
 *
 * const result = validateUpdateBalanceInput(freezeInput);
 * if (result.valid) {
 *   // Proceed with balance update
 * } else {
 *   console.error("Validation failed:", result.message);
 *   // Handle validation errors
 * }
 * ```
 */
export function validateUpdateBalanceInput(input: UpdateBalanceInput): ValidationResult {
  // First, validate that the input exists
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Check if at least one field is being updated
  if (input.allowSending === undefined && input.allowReceiving === undefined) {
    return {
      valid: false,
      message: 'At least one field must be provided for update (allowSending or allowReceiving)',
      fieldErrors: {
        input: ['At least one field must be provided for update (allowSending or allowReceiving)'],
      },
    };
  }

  return { valid: true };
}

/**
 * Timestamp forms the balance history routes accept.
 *
 * The ledger's own error names only `'yyyy-mm-dd hh:mm:ss'`, but RFC 3339 with `Z`, with
 * an offset, with fractional seconds, and with no zone at all were all measured as `200`.
 * What it refuses is a date without a time, which it answers `400/0131`.
 */
const BALANCE_HISTORY_DATE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const BALANCE_KEY_MAX_LENGTH = 100;

/**
 * Validates the `date` a balance history route is read at.
 *
 * The parameter is optional in the ledger's OpenAPI document and required by the handler,
 * which answers `400/0142` when it is missing.
 *
 * @returns ValidationResult indicating whether the timestamp is one the ledger accepts
 */
export function validateBalanceHistoryDate(date: string): ValidationResult {
  if (!date) {
    return failure('date', 'date is required');
  }

  if (!BALANCE_HISTORY_DATE.test(date)) {
    return failure(
      'date',
      `date must carry a time component: 'yyyy-mm-dd hh:mm:ss' or RFC 3339 ` +
        `('2026-08-07T02:45:14Z', '2026-08-07T02:45:14-03:00'), got '${date}'`
    );
  }

  return { valid: true };
}

/**
 * Validates a CreateBalanceInput against the rules the ledger enforces on the route.
 *
 * Each refusal here mirrors one the ledger issues: an unusable key is `400`, an
 * inconsistent overdraft pair is `400/0172`, and an internal balance scope is `400/0172`
 * because that scope belongs to the balances the ledger creates for itself.
 *
 * @returns ValidationResult indicating if the input is valid, with error messages if not
 */
export function validateCreateBalanceInput(input: CreateBalanceInput): ValidationResult {
  const requiredResult = validateRequired(input, 'input');
  if (!requiredResult.valid) {
    return requiredResult;
  }

  const keyResult = validateBalanceKey(input.key);
  if (!keyResult.valid) {
    return keyResult;
  }

  return validateBalanceSettings(input.settings);
}

function validateBalanceKey(key: string): ValidationResult {
  if (!key) {
    return failure('key', 'key is required');
  }

  if (/\s/.test(key)) {
    return failure('key', 'key must not contain whitespace');
  }

  if (key.length > BALANCE_KEY_MAX_LENGTH) {
    return failure('key', `key must be at most ${BALANCE_KEY_MAX_LENGTH} characters`);
  }

  return { valid: true };
}

function validateBalanceSettings(settings?: BalanceSettingsInput): ValidationResult {
  if (!settings) {
    return { valid: true };
  }

  if (settings.balanceScope === 'internal') {
    return failure(
      'settings.balanceScope',
      'settings.balanceScope internal is reserved for balances the ledger manages itself'
    );
  }

  if (!settings.overdraftLimitEnabled) {
    return settings.overdraftLimit === undefined
      ? { valid: true }
      : failure(
          'settings.overdraftLimit',
          'settings.overdraftLimit must be absent when settings.overdraftLimitEnabled is false'
        );
  }

  if (settings.overdraftLimit === undefined || settings.overdraftLimit === '') {
    return failure(
      'settings.overdraftLimit',
      'settings.overdraftLimit is required when settings.overdraftLimitEnabled is true'
    );
  }

  const limit = Number(settings.overdraftLimit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return failure(
      'settings.overdraftLimit',
      `settings.overdraftLimit must be a decimal greater than zero, got '${settings.overdraftLimit}'`
    );
  }

  return { valid: true };
}

function failure(field: string, message: string): ValidationResult {
  return { valid: false, message, fieldErrors: { [field]: [message] } };
}
