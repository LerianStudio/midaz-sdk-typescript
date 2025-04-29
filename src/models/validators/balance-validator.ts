/**
 */

import { validateRequired, ValidationResult } from '../../util/validation';
import { UpdateBalanceInput } from '../balance';

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
