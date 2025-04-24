/**
 * @file Validation utilities for the Midaz SDK
 * @description Provides comprehensive validation functions for data validation and error handling
 */

import { ErrorCategory, ErrorCode, MidazError } from '../error';

/**
 * ValidationError class for validation-specific errors
 *
 * Extends the base MidazError with field-specific error information,
 * allowing for more detailed validation feedback.
 */
export class ValidationError extends MidazError {
  /**
   * Field-specific errors
   * Maps field names to arrays of error messages
   */
  public readonly fieldErrors?: Record<string, string[]>;

  /**
   * Creates a new ValidationError instance
   *
   * @param message Error message
   * @param fieldErrors Optional field-specific errors
   * @param cause Optional cause of the error
   */
  constructor(message: string, fieldErrors?: Record<string, string[]>, cause?: Error) {
    super({
      message,
      code: ErrorCode.VALIDATION_ERROR,
      category: ErrorCategory.VALIDATION,
      cause,
    });

    this.fieldErrors = fieldErrors;
  }
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;

  /**
   * Optional error message if validation failed
   */
  message?: string;

  /**
   * Optional field-specific errors
   */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Address validation interface
 */
export interface Address {
  /**
   * First line of the address
   */
  line1: string;

  /**
   * Optional second line of the address
   */
  line2?: string;

  /**
   * City
   */
  city: string;

  /**
   * State or province
   */
  state: string;

  /**
   * Postal code
   */
  postalCode: string;

  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  countryCode: string;
}

/**
 * Options for number validation
 */
export interface NumberValidationOptions {
  /**
   * Minimum allowed value (inclusive)
   */
  min?: number;

  /**
   * Maximum allowed value (inclusive)
   */
  max?: number;

  /**
   * Whether the number should be an integer
   */
  integer?: boolean;

  /**
   * Whether to allow negative values
   */
  allowNegative?: boolean;

  /**
   * Whether to allow zero value
   */
  allowZero?: boolean;
}

/**
 * Validator function type
 *
 * Takes a value and returns a validation result
 */
export type Validator<T> = (value: T) => ValidationResult;

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG = {
  maxStringLength: 256,
  maxMetadataSize: 1024 * 10, // 10KB
  maxMetadataKeyLength: 64,
  maxMetadataValueLength: 1024,
};

/**
 * Common validation patterns
 */
export const PATTERNS = {
  ASSET_CODE: /^[A-Z0-9]{3,8}$/,
  CURRENCY_CODE: /^[A-Z]{3}$/,
  ACCOUNT_ALIAS: /^[a-zA-Z0-9_.-]{1,64}$/,
  COUNTRY_CODE: /^[A-Z]{2}$/,
  TRANSACTION_CODE: /^[a-zA-Z0-9._-]{1,64}$/,
};

/**
 * Valid account types
 */
export const VALID_ACCOUNT_TYPES = [
  'deposit',
  'savings',
  'loans',
  'marketplace',
  'creditCard',
  'external',
];

/**
 * Valid asset types
 */
export const VALID_ASSET_TYPES = ['currency', 'crypto', 'commodities', 'others'];

/**
 * Full validation configuration
 */
export interface ValidationConfig {
  /**
   * Maximum string length
   * @default 256
   */
  maxStringLength: number;

  /**
   * Maximum metadata size in bytes
   * @default 10240 (10KB)
   */
  maxMetadataSize: number;

  /**
   * Maximum metadata key length
   * @default 64
   */
  maxMetadataKeyLength: number;

  /**
   * Maximum metadata value length
   * @default 1024
   */
  maxMetadataValueLength: number;
}

/**
 * Combines multiple validation results into one
 *
 * If any validation fails, the combined result will be invalid.
 * Field errors and messages from all results are merged.
 *
 * @param results - Validation results to combine
 * @returns Combined validation result
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  if (results.length === 0) {
    return { valid: true };
  }

  const invalidResults = results.filter((result) => !result.valid);

  if (invalidResults.length === 0) {
    return { valid: true };
  }

  // Combine all error messages
  const messages = invalidResults
    .filter((result) => result.message)
    .map((result) => result.message as string);

  // Combine all field errors
  const fieldErrors: Record<string, string[]> = {};

  invalidResults.forEach((result) => {
    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([field, errors]) => {
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }

        fieldErrors[field].push(...errors);
      });
    }
  });

  return {
    valid: false,
    message: messages.length > 0 ? messages.join('; ') : 'Validation failed',
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

/**
 * Validates that a value is present and not undefined or null
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null) {
    return {
      valid: false,
      message: `${fieldName} is required`,
      fieldErrors: {
        [fieldName]: [`${fieldName} is required`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates that a string is not empty
 *
 * @param value - String value to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 * @throws {ValidationError} When validation fails and in test mode
 */
export function validateNotEmpty(
  value: string | null | undefined,
  fieldName: string
): ValidationResult {
  const requiredResult = validateRequired(value, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (value!.trim() === '') {
    return {
      valid: false,
      message: `${fieldName} cannot be empty`,
      fieldErrors: {
        [fieldName]: [`${fieldName} cannot be empty`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates that a string matches a pattern
 *
 * @param value - String value to validate
 * @param pattern - Regular expression pattern to match
 * @param fieldName - Name of the field being validated
 * @param patternDescription - Description of the pattern for error messages
 * @returns Validation result
 * @throws {ValidationError} When validation fails and in test mode
 */
export function validatePattern(
  value: string | null | undefined,
  pattern: RegExp,
  fieldName: string,
  patternDescription: string
): ValidationResult {
  const requiredResult = validateRequired(value, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (!pattern.test(value!)) {
    return {
      valid: false,
      message: `${fieldName} must match ${patternDescription}`,
      fieldErrors: {
        [fieldName]: [`${fieldName} must match ${patternDescription}`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates a number against constraints
 *
 * @param value - Number value to validate
 * @param fieldName - Name of the field being validated
 * @param options - Validation options
 * @returns Validation result
 * @throws {ValidationError} When validation fails and throwOnError is true
 */
export function validateNumber(
  value: number | null | undefined,
  fieldName: string,
  options: NumberValidationOptions = {}
): ValidationResult {
  const requiredResult = validateRequired(value, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const num = value as number;
  const errors: string[] = [];

  // Check for NaN
  if (Number.isNaN(num) && (options.min !== undefined || options.max !== undefined)) {
    errors.push(`${fieldName} cannot be NaN when range limits are specified`);
  }

  // Handle infinity cases
  if (!Number.isFinite(num)) {
    if (num === Infinity && options.max !== undefined && options.max !== Infinity) {
      errors.push(`${fieldName} (Infinity) exceeds maximum value of ${options.max}`);
    } else if (num === -Infinity && options.min !== undefined && options.min !== -Infinity) {
      errors.push(`${fieldName} (-Infinity) is below minimum value of ${options.min}`);
    }
  }

  // Check if integer is required for finite numbers
  if (Number.isFinite(num) && options.integer && !Number.isInteger(num)) {
    errors.push(`${fieldName} must be an integer`);
  }

  // Check for negative values for finite numbers
  if (Number.isFinite(num) && options.allowNegative === false && num < 0) {
    errors.push(`${fieldName} cannot be negative`);
  }

  // Check for zero
  if (options.allowZero === false && num === 0) {
    errors.push(`${fieldName} cannot be zero`);
  }

  // Check min/max constraints for finite numbers with special handling for Number.MAX_VALUE
  if (Number.isFinite(num)) {
    if (options.min !== undefined) {
      // Use a small epsilon for comparisons near MIN_VALUE
      if (num === Number.MIN_VALUE && options.min > 0) {
        errors.push(`${fieldName} must be at least ${options.min}`);
      } else if (num < options.min) {
        errors.push(`${fieldName} must be at least ${options.min}`);
      }
    }

    if (options.max !== undefined) {
      // Handle possible floating point issues near MAX_VALUE
      if (num === Number.MAX_VALUE && options.max < Number.MAX_VALUE) {
        errors.push(`${fieldName} must be at most ${options.max}`);
      } else if (num > options.max) {
        errors.push(`${fieldName} must be at most ${options.max}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.join('; '),
      fieldErrors: {
        [fieldName]: errors,
      },
    };
  }

  return { valid: true };
}

/**
 * Validates that a value is within a range
 *
 * @param value - Number value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  return validateNumber(value, fieldName, { min, max });
}

/**
 * Validates an asset code format
 *
 * @param assetCode - Asset code to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateAssetCode(
  assetCode: string | null | undefined,
  fieldName = 'assetCode'
): ValidationResult {
  // Empty strings should be invalid per tests
  if (assetCode === '') {
    return {
      valid: false,
      message: `${fieldName} must match an asset code format (3-8 uppercase letters or numbers)`,
      fieldErrors: {
        [fieldName]: [
          `${fieldName} must match an asset code format (3-8 uppercase letters or numbers)`,
        ],
      },
    };
  }

  const requiredResult = validateRequired(assetCode, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  return validatePattern(
    assetCode,
    PATTERNS.ASSET_CODE,
    fieldName,
    'an asset code format (3-8 uppercase letters or numbers)'
  );
}

/**
 * Validates a currency code format
 *
 * @param currencyCode - Currency code to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateCurrencyCode(
  currencyCode: string | null | undefined,
  fieldName = 'currencyCode'
): ValidationResult {
  const requiredResult = validateRequired(currencyCode, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  return validatePattern(
    currencyCode,
    PATTERNS.CURRENCY_CODE,
    fieldName,
    'a currency code format (3 uppercase letters)'
  );
}

/**
 * Validates an account type
 *
 * @param accountType - Account type to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateAccountType(
  accountType: string | null | undefined,
  fieldName = 'accountType'
): ValidationResult {
  const requiredResult = validateRequired(accountType, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (!VALID_ACCOUNT_TYPES.includes(accountType as string)) {
    return {
      valid: false,
      message: `${fieldName} must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}`,
      fieldErrors: {
        [fieldName]: [`${fieldName} must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates an asset type
 *
 * @param assetType - Asset type to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateAssetType(
  assetType: string | null | undefined,
  fieldName = 'assetType'
): ValidationResult {
  const requiredResult = validateRequired(assetType, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (!VALID_ASSET_TYPES.includes(assetType as string)) {
    return {
      valid: false,
      message: `${fieldName} must be one of: ${VALID_ASSET_TYPES.join(', ')}`,
      fieldErrors: {
        [fieldName]: [`${fieldName} must be one of: ${VALID_ASSET_TYPES.join(', ')}`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates an account alias format
 *
 * @param alias - Account alias to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateAccountAlias(
  alias: string | null | undefined,
  fieldName = 'alias'
): ValidationResult {
  if (alias === undefined || alias === null || alias === '') {
    // Alias is optional, so it's valid if not provided
    return { valid: true };
  }

  return validatePattern(
    alias,
    PATTERNS.ACCOUNT_ALIAS,
    fieldName,
    'an account alias format (1-64 letters, numbers, underscores, dots, or hyphens)'
  );
}

/**
 * Validates a country code format
 *
 * @param countryCode - Country code to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateCountryCode(
  countryCode: string | null | undefined,
  fieldName = 'countryCode'
): ValidationResult {
  const requiredResult = validateRequired(countryCode, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  return validatePattern(
    countryCode,
    PATTERNS.COUNTRY_CODE,
    fieldName,
    'a country code format (2 uppercase letters)'
  );
}

/**
 * Validates a transaction code format
 *
 * @param transactionCode - Transaction code to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function validateTransactionCode(
  transactionCode: string | null | undefined,
  fieldName = 'transactionCode'
): ValidationResult {
  if (transactionCode === undefined || transactionCode === null || transactionCode === '') {
    // Transaction code is optional, so it's valid if not provided
    return { valid: true };
  }

  return validatePattern(
    transactionCode,
    PATTERNS.TRANSACTION_CODE,
    fieldName,
    'a transaction code format (1-64 letters, numbers, underscores, dots, or hyphens)'
  );
}

/**
 * Validates a date range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param startFieldName - Name of the start date field
 * @param endFieldName - Name of the end date field
 * @returns Validation result
 */
export function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  startFieldName = 'startDate',
  endFieldName = 'endDate'
): ValidationResult {
  const startResult = validateRequired(startDate, startFieldName);
  const endResult = validateRequired(endDate, endFieldName);

  if (!startResult.valid || !endResult.valid) {
    return combineValidationResults([startResult, endResult]);
  }

  let startTimestamp: number;
  let endTimestamp: number;

  try {
    startTimestamp =
      typeof startDate === 'string' ? new Date(startDate).getTime() : (startDate as Date).getTime();

    endTimestamp =
      typeof endDate === 'string' ? new Date(endDate).getTime() : (endDate as Date).getTime();
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid date format',
      fieldErrors: {
        [startFieldName]: ['Invalid date format'],
        [endFieldName]: ['Invalid date format'],
      },
    };
  }

  if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
    return {
      valid: false,
      message: 'Invalid date format',
      fieldErrors: {
        [startFieldName]: ['Invalid date format'],
        [endFieldName]: ['Invalid date format'],
      },
    };
  }

  if (startTimestamp >= endTimestamp) {
    return {
      valid: false,
      message: `${startFieldName} must be before ${endFieldName}`,
      fieldErrors: {
        [startFieldName]: [`${startFieldName} must be before ${endFieldName}`],
        [endFieldName]: [`${endFieldName} must be after ${startFieldName}`],
      },
    };
  }

  return { valid: true };
}

/**
 * Validates metadata object
 *
 * @param metadata - Metadata object to validate
 * @param fieldName - Name of the field being validated
 * @param config - Validation configuration
 * @returns Validation result
 */
export function validateMetadata(
  metadata: Record<string, any> | null | undefined,
  fieldName = 'metadata',
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  if (metadata === undefined || metadata === null) {
    // Metadata is optional, so it's valid if not provided
    return { valid: true };
  }

  // Use provided config or default
  const {
    maxMetadataSize = DEFAULT_VALIDATION_CONFIG.maxMetadataSize,
    maxMetadataKeyLength = DEFAULT_VALIDATION_CONFIG.maxMetadataKeyLength,
    maxMetadataValueLength = DEFAULT_VALIDATION_CONFIG.maxMetadataValueLength,
    maxStringLength = DEFAULT_VALIDATION_CONFIG.maxStringLength,
  } = config;

  // Check if metadata is an object
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      valid: false,
      message: `${fieldName} must be an object`,
      fieldErrors: {
        [fieldName]: [`${fieldName} must be an object`],
      },
    };
  }

  // Check metadata size
  const metadataSize = JSON.stringify(metadata).length;

  if (metadataSize > maxMetadataSize) {
    return {
      valid: false,
      message: `${fieldName} size exceeds maximum of ${maxMetadataSize} bytes`,
      fieldErrors: {
        [fieldName]: [`${fieldName} size exceeds maximum of ${maxMetadataSize} bytes`],
      },
    };
  }

  // Check each key and value
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  fieldErrors[fieldName] = []; // Initialize the metadata field errors array

  for (const [key, value] of Object.entries(metadata)) {
    // Check empty key
    if (key.trim() === '') {
      errors.push(`${fieldName} keys cannot be empty`);
      fieldErrors[`${fieldName}.keys`] = [
        ...(fieldErrors[`${fieldName}.keys`] || []),
        `${fieldName} keys cannot be empty`,
      ];
    }

    // Check key length
    if (key.length > maxMetadataKeyLength) {
      errors.push(
        `${fieldName} key '${key}' exceeds maximum length of ${maxMetadataKeyLength} characters`
      );
      fieldErrors[`${fieldName}.keys`] = [
        ...(fieldErrors[`${fieldName}.keys`] || []),
        `${fieldName} key '${key}' exceeds maximum length of ${maxMetadataKeyLength} characters`,
      ];
    }

    // Check value
    if (typeof value === 'string') {
      // Get the custom string length limit, defaulting to the standard one if not provided
      const customMaxStringLength =
        config.maxStringLength !== undefined ? config.maxStringLength : maxStringLength;

      // Check against metadata-specific string length limit
      if (value.length > maxMetadataValueLength) {
        errors.push(
          `${fieldName} value for key '${key}' exceeds maximum length of ${maxMetadataValueLength} characters`
        );
        fieldErrors[`${fieldName}.${key}`] = [
          `${fieldName} value for key '${key}' exceeds maximum length of ${maxMetadataValueLength} characters`,
        ];
        // Add a general error for the metadata field
        fieldErrors[fieldName].push(`${fieldName} value exceeds maximum length`);
      }

      // Also check against general string length limit (which may be customized)
      if (value.length > customMaxStringLength) {
        const errorMsg = `${fieldName} value for key '${key}' exceeds maximum length of ${customMaxStringLength} characters`;
        errors.push(errorMsg);

        // Add specific error for the field
        if (!fieldErrors[`${fieldName}.${key}`]) {
          fieldErrors[`${fieldName}.${key}`] = [];
        }
        fieldErrors[`${fieldName}.${key}`].push(errorMsg);

        // Add a general error for the metadata field
        fieldErrors[fieldName].push(
          `${fieldName} value exceeds maximum length of ${customMaxStringLength} characters`
        );

        // Force validation to fail even if no other errors
        return {
          valid: false,
          message: errors.join('; '),
          fieldErrors,
        };
      }
    } else if (typeof value === 'number') {
      // Check if number is outside safe range
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
        errors.push(`${fieldName} numeric value for key '${key}' is outside of safe range`);
        fieldErrors[`${fieldName}.${key}`] = [
          `${fieldName} numeric value for key '${key}' is outside of safe range`,
        ];
      }

      // Also check for very large numbers that might cause issues
      if (value > 9999999999 || value < -9999999999) {
        errors.push(`${fieldName} numeric value for key '${key}' is outside of safe range`);
        fieldErrors[`${fieldName}.${key}`] = [
          `${fieldName} numeric value for key '${key}' is outside of safe range`,
        ];
      }
    }
  }

  if (errors.length > 0) {
    // Remove empty arrays from fieldErrors
    Object.keys(fieldErrors).forEach((key) => {
      if (fieldErrors[key].length === 0) {
        delete fieldErrors[key];
      }
    });

    return {
      valid: false,
      message: errors.join('; '),
      fieldErrors,
    };
  }

  return { valid: true };
}

/**
 * Validates an address object
 *
 * @param address - Address object to validate
 * @param fieldName - Name of the field being validated
 * @param config - Validation configuration
 * @returns Validation result
 */
export function validateAddress(
  address: Address | null | undefined,
  fieldName = 'address',
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const requiredResult = validateRequired(address, fieldName);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  // Use provided config or default
  const { maxStringLength = DEFAULT_VALIDATION_CONFIG.maxStringLength } = config;

  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  // Validate required address fields
  ['line1', 'city', 'state', 'postalCode', 'countryCode'].forEach((field) => {
    const value = (address as any)[field];

    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      errors.push(`${fieldName}.${field} is required`);
      fieldErrors[`${fieldName}.${field}`] = [`${fieldName}.${field} is required`];
    } else if (typeof value === 'string' && value.length > maxStringLength) {
      errors.push(`${fieldName}.${field} exceeds maximum length of ${maxStringLength} characters`);
      fieldErrors[`${fieldName}.${field}`] = [
        `${fieldName}.${field} exceeds maximum length of ${maxStringLength} characters`,
      ];
    }
  });

  // Validate line2 if provided
  if (
    address!.line2 !== undefined &&
    address!.line2 !== null &&
    typeof address!.line2 === 'string' &&
    address!.line2.length > maxStringLength
  ) {
    errors.push(`${fieldName}.line2 exceeds maximum length of ${maxStringLength} characters`);
    fieldErrors[`${fieldName}.line2`] = [
      `${fieldName}.line2 exceeds maximum length of ${maxStringLength} characters`,
    ];
  }

  // Validate country code if provided
  if (
    address!.countryCode !== undefined &&
    address!.countryCode !== null &&
    typeof address!.countryCode === 'string'
  ) {
    const countryResult = validateCountryCode(address!.countryCode, `${fieldName}.countryCode`);

    if (!countryResult.valid) {
      errors.push(countryResult.message!);

      if (countryResult.fieldErrors) {
        Object.entries(countryResult.fieldErrors).forEach(([field, fieldErrs]) => {
          fieldErrors[field] = [...(fieldErrors[field] || []), ...fieldErrs];
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.join('; '),
      fieldErrors,
    };
  }

  return { valid: true };
}

/**
 * Validates an account reference
 *
 * @param accountId - Account ID to validate
 * @param assetCode - Asset code to validate
 * @param fieldName - Base name for validation fields
 * @returns Validation result
 */
export function validateAccountReference(
  accountId: string | null | undefined,
  assetCode: string | null | undefined,
  fieldName = 'account'
): ValidationResult {
  const results: ValidationResult[] = [
    validateRequired(accountId, `${fieldName}Id`),
    validateAssetCode(assetCode, `${fieldName}AssetCode`),
  ];

  return combineValidationResults(results);
}

/**
 * Gets a formatted reference to an external account
 *
 * @param accountId - External account ID
 * @param assetCode - Asset code
 * @returns Formatted reference string
 */
export function getExternalAccountReference(
  accountId: string | null | undefined,
  assetCode: string | null | undefined
): string {
  if (!accountId || !assetCode) {
    return 'UNKNOWN ACCOUNT';
  }

  return `${accountId}:${assetCode}`;
}

/**
 * Validate function that throws on validation failure
 *
 * @param value - Value to validate
 * @param validator - Validator function to apply
 * @param message - Optional custom error message
 * @throws ValidationError if validation fails
 */
export function validate<T>(value: T, validator: Validator<T>, message?: string): void {
  const result = validator(value);

  if (!result.valid) {
    throw new ValidationError(message || result.message || 'Validation failed', result.fieldErrors);
  }
}
