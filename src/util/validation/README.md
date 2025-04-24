# Midaz SDK Validation Utilities

This document provides a comprehensive guide to the validation utilities available in the Midaz SDK. These utilities help ensure data integrity and consistency when working with the SDK's models and API calls.

## Table of Contents

- [Overview](#overview)
- [Core Validation Concepts](#core-validation-concepts)
- [Validation Constants](#validation-constants)
- [Basic Validation Functions](#basic-validation-functions)
- [Domain-Specific Validation Functions](#domain-specific-validation-functions)
- [Complex Object Validation](#complex-object-validation)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Overview

The validation utilities in the Midaz SDK provide a robust set of functions to validate various types of data, from simple strings and numbers to complex objects like accounts, assets, and transactions. These utilities help ensure that data meets the required format and business rules before being processed by the SDK.

## Core Validation Concepts

### ValidationResult

All validation functions return a `ValidationResult` object with the following structure:

```typescript
interface ValidationResult {
  valid: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}
```

- `valid`: Indicates whether the validation passed
- `message`: Optional error message if validation failed
- `fieldErrors`: Optional field-specific errors

### ValidationError

When validation fails and an error needs to be thrown, the `ValidationError` class is used:

```typescript
class ValidationError extends MidazError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors?: Record<string, string[]>,
    cause?: Error
  ) {
    // ...
  }
}
```

### Validator Type

The `Validator<T>` type defines a function that takes a value and returns a validation result:

```typescript
type Validator<T> = (value: T) => ValidationResult;
```

## Validation Constants

### Patterns

Common validation patterns are defined in the `PATTERNS` constant:

```typescript
const PATTERNS = {
  ASSET_CODE: /^[A-Z0-9]{3,8}$/,
  CURRENCY_CODE: /^[A-Z]{3}$/,
  ACCOUNT_ALIAS: /^[a-zA-Z0-9_.-]{1,64}$/,
  COUNTRY_CODE: /^[A-Z]{2}$/,
  TRANSACTION_CODE: /^[a-zA-Z0-9._-]{1,64}$/,
};
```

### Valid Types

Valid account and asset types are defined in constants:

```typescript
const VALID_ACCOUNT_TYPES = [
  "deposit",
  "savings",
  "loans",
  "marketplace",
  "creditCard",
  "external",
];

const VALID_ASSET_TYPES = [
  "currency",
  "crypto",
  "commodities",
  "others",
];
```

### Configuration

Default validation configuration is provided:

```typescript
const DEFAULT_VALIDATION_CONFIG = {
  maxStringLength: 256,
  maxMetadataSize: 1024 * 10, // 10KB
  maxMetadataKeyLength: 64,
  maxMetadataValueLength: 1024,
};
```

## Basic Validation Functions

### validateRequired

Validates that a value is present and not undefined or null.

```typescript
function validateRequired<T>(value: T | undefined | null, fieldName: string): ValidationResult;
```

### validateNotEmpty

Validates that a string is not empty.

```typescript
function validateNotEmpty(value: string | null | undefined, fieldName: string): ValidationResult;
```

### validatePattern

Validates that a string matches a pattern.

```typescript
function validatePattern(
  value: string | null | undefined,
  pattern: RegExp,
  fieldName: string,
  patternDescription: string
): ValidationResult;
```

### validateNumber

Validates a number against constraints.

```typescript
function validateNumber(
  value: number | null | undefined,
  fieldName: string,
  options: NumberValidationOptions = {}
): ValidationResult;
```

Options for number validation:

```typescript
interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  allowNegative?: boolean;
  allowZero?: boolean;
}
```

### validateRange

Validates that a value is within a range.

```typescript
function validateRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): ValidationResult;
```

## Domain-Specific Validation Functions

### validateAssetCode

Validates an asset code format (3-8 uppercase letters or numbers).

```typescript
function validateAssetCode(
  assetCode: string | null | undefined,
  fieldName: string = "assetCode"
): ValidationResult;
```

### validateCurrencyCode

Validates a currency code format (3 uppercase letters, ISO 4217).

```typescript
function validateCurrencyCode(
  currencyCode: string | null | undefined,
  fieldName: string = "currencyCode"
): ValidationResult;
```

### validateAccountType

Validates an account type against the allowed values.

```typescript
function validateAccountType(
  accountType: string | null | undefined,
  fieldName: string = "accountType"
): ValidationResult;
```

### validateAssetType

Validates an asset type against the allowed values.

```typescript
function validateAssetType(
  assetType: string | null | undefined,
  fieldName: string = "assetType"
): ValidationResult;
```

### validateAccountAlias

Validates an account alias format.

```typescript
function validateAccountAlias(
  alias: string | null | undefined,
  fieldName: string = "alias"
): ValidationResult;
```

### validateCountryCode

Validates a country code format (ISO 3166-1 alpha-2).

```typescript
function validateCountryCode(
  countryCode: string | null | undefined,
  fieldName: string = "countryCode"
): ValidationResult;
```

### validateTransactionCode

Validates a transaction code format.

```typescript
function validateTransactionCode(
  transactionCode: string | null | undefined,
  fieldName: string = "transactionCode"
): ValidationResult;
```

### validateDateRange

Validates a date range to ensure the start date is before the end date.

```typescript
function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  startFieldName: string = "startDate",
  endFieldName: string = "endDate"
): ValidationResult;
```

## Complex Object Validation

### validateMetadata

Validates metadata object against size and format constraints.

```typescript
function validateMetadata(
  metadata: Record<string, any> | null | undefined,
  fieldName: string = "metadata",
  config: Partial<ValidationConfig> = {}
): ValidationResult;
```

### validateAddress

Validates an address object.

```typescript
function validateAddress(
  address: Address | null | undefined,
  fieldName: string = "address",
  config: Partial<ValidationConfig> = {}
): ValidationResult;
```

Address interface:

```typescript
interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}
```

### validateAccountReference

Validates an account reference (accountId and assetCode).

```typescript
function validateAccountReference(
  accountId: string | null | undefined,
  assetCode: string | null | undefined,
  fieldName: string = "account"
): ValidationResult;
```

## Utility Functions

### combineValidationResults

Combines multiple validation results into one.

```typescript
function combineValidationResults(results: ValidationResult[]): ValidationResult;
```

### getExternalAccountReference

Gets a formatted reference to an external account.

```typescript
function getExternalAccountReference(
  accountId: string | null | undefined,
  assetCode: string | null | undefined
): string;
```

### validate

Validate function that throws on validation failure.

```typescript
function validate<T>(
  value: T,
  validator: Validator<T>,
  message?: string
): void;
```

## Usage Examples

### Basic Validation

```typescript
import { validateRequired, validateNotEmpty, validatePattern, PATTERNS } from "@midaz/sdk";

// Validate required field
const requiredResult = validateRequired(input.name, "name");
if (!requiredResult.valid) {
  console.error(requiredResult.message);
  return;
}

// Validate non-empty string
const notEmptyResult = validateNotEmpty(input.code, "code");
if (!notEmptyResult.valid) {
  console.error(notEmptyResult.message);
  return;
}

// Validate pattern
const patternResult = validatePattern(
  input.assetCode,
  PATTERNS.ASSET_CODE,
  "assetCode",
  "an asset code format (3-8 uppercase letters or numbers)"
);
if (!patternResult.valid) {
  console.error(patternResult.message);
  return;
}
```

### Combining Validation Results

```typescript
import { combineValidationResults, validateRequired, validateNotEmpty } from "@midaz/sdk";

const results = [
  validateRequired(input.name, "name"),
  validateNotEmpty(input.name, "name"),
  validateRequired(input.code, "code"),
];

const combinedResult = combineValidationResults(results);
if (!combinedResult.valid) {
  console.error(combinedResult.message);
  console.error(combinedResult.fieldErrors);
  return;
}
```

### Using the Validate Function

```typescript
import { validate, validateAssetCode } from "@midaz/sdk";

try {
  // Will throw ValidationError if validation fails
  validate(assetCode, (value) => validateAssetCode(value));
  
  // Proceed with valid asset code
  console.log("Asset code is valid");
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
    console.error(error.fieldErrors);
  }
}
```

### Validating Complex Objects

```typescript
import { validateMetadata, validateAddress, DEFAULT_VALIDATION_CONFIG } from "@midaz/sdk";

// Validate metadata
const metadataResult = validateMetadata(
  input.metadata,
  "metadata",
  { maxMetadataSize: DEFAULT_VALIDATION_CONFIG.maxMetadataSize * 2 } // Custom config
);
if (!metadataResult.valid) {
  console.error(metadataResult.message);
  return;
}

// Validate address
const address = {
  line1: "123 Main St",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  countryCode: "US"
};

const addressResult = validateAddress(address);
if (!addressResult.valid) {
  console.error(addressResult.message);
  return;
}
```

## Best Practices

1. **Always validate user input**: Use validation functions to ensure data meets the required format and business rules before processing.

2. **Combine validation results**: Use `combineValidationResults` to validate multiple fields at once and collect all validation errors.

3. **Use domain-specific validators**: Use specialized validators like `validateAssetCode` and `validateAccountType` for domain-specific validation.

4. **Handle validation errors gracefully**: Catch `ValidationError` and provide user-friendly error messages.

5. **Customize validation messages**: Use the `fieldName` parameter to provide context-specific error messages.

6. **Use validation patterns**: Leverage the predefined `PATTERNS` for consistent validation across your application.
