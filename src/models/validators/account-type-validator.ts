/**
 * Validator for AccountType models.
 */
import {
  ValidationResult,
  combineValidationResults,
  validateNotEmpty,
  validateRequired,
} from '../../util/validation';
import { CreateAccountTypeInput, UpdateAccountTypeInput } from '../account-type';

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 250;
const MAX_KEY_VALUE_LENGTH = 50;

/**
 * Validates the input for creating an account type.
 * @param input - The create account type input.
 * @returns A validation result.
 */
export function validateCreateAccountTypeInput(input: CreateAccountTypeInput): ValidationResult {
  const results: ValidationResult[] = [
    validateRequired(input, 'input'),
    validateNotEmpty(input?.name, 'name'),
    validateNotEmpty(input?.keyValue, 'keyValue'),
  ];

  if (input?.name && input.name.length > MAX_NAME_LENGTH) {
    results.push({
      valid: false,
      message: `name must not exceed ${MAX_NAME_LENGTH} characters`,
      fieldErrors: { name: [`name must not exceed ${MAX_NAME_LENGTH} characters`] },
    });
  }

  if (input?.keyValue && input.keyValue.length > MAX_KEY_VALUE_LENGTH) {
    results.push({
      valid: false,
      message: `keyValue must not exceed ${MAX_KEY_VALUE_LENGTH} characters`,
      fieldErrors: { keyValue: [`keyValue must not exceed ${MAX_KEY_VALUE_LENGTH} characters`] },
    });
  }

  if (input?.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    results.push({
      valid: false,
      message: `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      fieldErrors: {
        description: [`description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`],
      },
    });
  }

  return combineValidationResults(results);
}

/**
 * Validates the input for updating an account type.
 * @param input - The update account type input.
 * @returns A validation result.
 */
export function validateUpdateAccountTypeInput(input: UpdateAccountTypeInput): ValidationResult {
  const results: ValidationResult[] = [validateRequired(input, 'input')];

  if (input?.name && input.name.length > MAX_NAME_LENGTH) {
    results.push({
      valid: false,
      message: `name must not exceed ${MAX_NAME_LENGTH} characters`,
      fieldErrors: { name: [`name must not exceed ${MAX_NAME_LENGTH} characters`] },
    });
  }

  if (input?.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    results.push({
      valid: false,
      message: `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      fieldErrors: {
        description: [`description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`],
      },
    });
  }

  return combineValidationResults(results);
}
