# Validation

The Midaz SDK provides comprehensive data validation utilities with structured error handling. These validation functions help ensure data integrity and proper error reporting.

## Core Validation Concepts

### Validation Results

All validation functions return a standardized `ValidationResult` object:

```typescript
interface ValidationResult {
  valid: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}
```

### Validation Errors

When validation fails, a `ValidationError` is thrown with detailed field-level errors:

```typescript
import { ValidationError } from 'midaz-sdk/util/validation';

// Example of a validation error
const error = new ValidationError(
  'Validation failed',
  {
    assetCode: ['Asset code must be 3-10 uppercase letters and numbers'],
    amount: ['Amount must be greater than zero']
  }
);
```

## Basic Validation Functions

### Required Fields

```typescript
import { validateRequired } from 'midaz-sdk/util/validation';

// Check if a field is present
const result = validateRequired(input.name, 'name');
if (!result.valid) {
  console.error(result.message);
}
```

### String Validation

```typescript
import { validateNotEmpty, validatePattern } from 'midaz-sdk/util/validation';

// Check if a string is not empty
const nameResult = validateNotEmpty(input.name, 'name');

// Check if a string matches a pattern
const emailResult = validatePattern(
  input.email,
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  'email',
  'valid email address'
);
```

### Number Validation

```typescript
import { validateNumber, validateRange } from 'midaz-sdk/util/validation';

// Check if a number meets various constraints
const amountResult = validateNumber(input.amount, 'amount', {
  min: 0,
  allowZero: false,
  integer: false
});

// Check if a number is within a range
const quantityResult = validateRange(input.quantity, 1, 100, 'quantity');
```

## Domain-Specific Validation

The SDK includes several domain-specific validators:

### Financial Data Validation

```typescript
import {
  validateAssetCode,
  validateCurrencyCode,
  validateAccountType,
  validateAssetType
} from 'midaz-sdk/util/validation';

// Validate financial identifiers
const assetCodeResult = validateAssetCode(input.assetCode);
const currencyResult = validateCurrencyCode(input.currency);
const accountTypeResult = validateAccountType(input.accountType);
const assetTypeResult = validateAssetType(input.assetType);
```

### Reference Validation

```typescript
import { validateAccountReference } from 'midaz-sdk/util/validation';

// Validate account references
const accountRefResult = validateAccountReference(
  input.accountId,
  input.assetCode,
  'sourceAccount'
);
```

### Date and Time Validation

```typescript
import { validateDateRange } from 'midaz-sdk/util/validation';

// Validate date ranges
const dateRangeResult = validateDateRange(
  input.startDate,
  input.endDate,
  'startDate',
  'endDate'
);
```

### Object Validation

```typescript
import { validateMetadata, validateAddress } from 'midaz-sdk/util/validation';

// Validate metadata object
const metadataResult = validateMetadata(input.metadata, 'metadata', {
  maxMetadataSize: 5120, // 5KB
  maxMetadataKeyLength: 50
});

// Validate address object
const addressResult = validateAddress(input.address, 'address');
```

## Combining Validation Results

You can combine multiple validation results into a single result:

```typescript
import { combineValidationResults } from 'midaz-sdk/util/validation';

// Validate multiple fields
const results = [
  validateRequired(input.name, 'name'),
  validateAssetCode(input.assetCode),
  validateNumber(input.amount, 'amount', { min: 0 })
];

// Combine all validation results
const combinedResult = combineValidationResults(results);

if (!combinedResult.valid) {
  console.error(combinedResult.message);
  console.error('Field errors:', combinedResult.fieldErrors);
}
```

## Validation with Throwing

For immediate validation that throws on failure:

```typescript
import { validate, validateRequired } from 'midaz-sdk/util/validation';

try {
  // This will throw a ValidationError if validation fails
  validate(input.name, (value) => validateRequired(value, 'name'));
  validate(input.email, (value) => validatePattern(
    value,
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'email',
    'valid email address'
  ));
  
  // Code here only runs if all validations pass
  console.log('Input is valid');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field errors:', error.fieldErrors);
  }
}
```

## Custom Validation Configuration

You can customize validation behavior with configuration options:

```typescript
import { validateMetadata, ValidationConfig } from 'midaz-sdk/util/validation';

// Custom validation configuration
const config: Partial<ValidationConfig> = {
  maxStringLength: 100,
  maxMetadataSize: 2048, // 2KB
  maxMetadataKeyLength: 32,
  maxMetadataValueLength: 256
};

// Use custom configuration
const result = validateMetadata(input.metadata, 'metadata', config);
```

## Integrating with Builder Pattern

When using the builder pattern for creating complex objects, validation happens at runtime rather than during build. Combine validation with the builder pattern like this:

```typescript
import { createAssetBuilder } from 'midaz-sdk';
import { validate, validateAssetCode, validateNotEmpty } from 'midaz-sdk/util/validation';

// Create a builder
const assetBuilder = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' });

// Build the object
const assetInput = assetBuilder.build();

// Validate after building
try {
  validate(assetInput.name, (value) => validateNotEmpty(value, 'name'));
  validate(assetInput.code, (value) => validateAssetCode(value, 'code'));
  
  // Proceed with creating the asset
  const asset = await client.entities.assets.createAsset(
    organizationId,
    ledgerId,
    assetInput
  );
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Asset validation failed:', error.message);
  }
}
```

## Example: Complete Validation

```typescript
import {
  validate,
  validateRequired,
  validateNotEmpty,
  validateAssetCode,
  validateNumber,
  validateMetadata,
  combineValidationResults,
  ValidationError
} from 'midaz-sdk/util/validation';

function validateTransactionInput(input) {
  // Collect all validation results
  const results = [
    validateRequired(input.accountId, 'accountId'),
    validateRequired(input.assetCode, 'assetCode'),
    validateAssetCode(input.assetCode),
    validateRequired(input.amount, 'amount'),
    validateNumber(input.amount, 'amount', {
      min: 0,
      allowZero: false
    })
  ];
  
  // Add optional field validations if fields are present
  if (input.description !== undefined) {
    results.push(validateNotEmpty(input.description, 'description'));
  }
  
  if (input.metadata !== undefined) {
    results.push(validateMetadata(input.metadata, 'metadata'));
  }
  
  // Combine results and check validity
  const combinedResult = combineValidationResults(results);
  
  if (!combinedResult.valid) {
    throw new ValidationError(
      combinedResult.message || 'Transaction validation failed',
      combinedResult.fieldErrors
    );
  }
  
  // Return the validated input
  return input;
}

// Usage
try {
  const validatedInput = validateTransactionInput({
    accountId: 'acc_12345',
    assetCode: 'USD',
    amount: 100.50,
    description: 'Monthly payment',
    metadata: {
      category: 'subscription',
      recurring: true
    }
  });
  
  // Process the validated input
  console.log('Input validation passed:', validatedInput);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field errors:', error.fieldErrors);
  } else {
    console.error('Unexpected error:', error);
  }
}
```
