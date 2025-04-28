# Validation Utilities

The Midaz SDK provides validation utilities to ensure data integrity and proper input validation. This document explains how to use these utilities to validate your data before sending it to the API.

## Overview

Validation in the Midaz SDK happens at runtime rather than during build, as mentioned in the builder pattern implementation. The validation utilities help ensure that the data you send to the API meets the required constraints.

## Basic Validation

### Model Validation

You can validate models before using them:

```typescript
import { validateModel } from 'midaz-sdk/util/validation';

// Create an asset input using the builder
const assetInput = createAssetBuilder('USD Currency', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

// Validate the model
const validationResult = validateModel(assetInput);

if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
} else {
  // Model is valid, proceed with API call
  const asset = await client.entities.assets.createAsset(
    organizationId,
    ledgerId,
    assetInput
  );
}
```

### Field Validation

You can also validate individual fields:

```typescript
import { 
  isValidAssetCode, 
  isValidAccountName, 
  isValidAmount 
} from 'midaz-sdk/util/validation';

// Validate an asset code
if (!isValidAssetCode('USD')) {
  console.error('Invalid asset code');
}

// Validate an account name
if (!isValidAccountName('Savings Account')) {
  console.error('Invalid account name');
}

// Validate a transaction amount
if (!isValidAmount(100.50)) {
  console.error('Invalid amount');
}
```

## Transaction Validation

Transactions require special validation to ensure they adhere to double-entry accounting principles:

```typescript
import { validateTransaction } from 'midaz-sdk/util/validation';

// Create a transaction
const transaction = createTransactionBuilder()
  .withEntries([
    {
      accountId: sourceAccountId,
      assetId: assetId,
      amount: -100,
      type: 'debit'
    },
    {
      accountId: destinationAccountId,
      assetId: assetId,
      amount: 100,
      type: 'credit'
    }
  ])
  .build();

// Validate the transaction
const validationResult = validateTransaction(transaction);

if (!validationResult.valid) {
  console.error('Transaction validation errors:', validationResult.errors);
} else {
  // Transaction is valid, proceed with API call
  const result = await client.entities.transactions.createTransaction(
    organizationId,
    ledgerId,
    transaction
  );
}
```

## Schema Validation

The SDK provides schema validators for all model types:

```typescript
import { 
  assetSchema, 
  accountSchema, 
  transactionSchema,
  organizationSchema
} from 'midaz-sdk/util/validation/schemas';

import { validateSchema } from 'midaz-sdk/util/validation';

// Validate against a specific schema
const asset = { name: 'USD', code: 'USD', type: 'currency' };
const validationResult = validateSchema(asset, assetSchema);

if (!validationResult.valid) {
  console.error('Schema validation errors:', validationResult.errors);
}
```

## Type Guards

Type guards help ensure type safety at runtime:

```typescript
import { 
  isAsset, 
  isAccount, 
  isTransaction, 
  isOrganization 
} from 'midaz-sdk/util/validation/guards';

// Check if an object is a valid Asset
function processFinancialObject(obj: unknown) {
  if (isAsset(obj)) {
    // TypeScript now knows obj is an Asset
    console.log(`Processing asset: ${obj.name} (${obj.code})`);
  } else if (isAccount(obj)) {
    // TypeScript now knows obj is an Account
    console.log(`Processing account: ${obj.name}`);
  } else if (isTransaction(obj)) {
    // TypeScript now knows obj is a Transaction
    console.log(`Processing transaction with ${obj.entries.length} entries`);
  } else {
    console.error('Unknown object type');
  }
}
```

## Validation in Builders

While builders handle some validation automatically, you can also perform explicit validation:

```typescript
import { createAssetBuilder } from 'midaz-sdk';
import { validateAssetInput } from 'midaz-sdk/util/validation';

// Start building an asset
const builder = createAssetBuilder('USD Currency', 'USD')
  .withType('currency');

// Validate the current state before building
const validationResult = validateAssetInput(builder.getCurrentState());

if (!validationResult.valid) {
  console.error('Asset validation errors:', validationResult.errors);
} else {
  // Proceed with building and API call
  const assetInput = builder.build();
  const asset = await client.entities.assets.createAsset(
    organizationId,
    ledgerId,
    assetInput
  );
}
```

## Validation with Error Handling

Combine validation with error handling:

```typescript
import { validateTransaction } from 'midaz-sdk/util/validation';
import { withEnhancedRecovery } from 'midaz-sdk/util';

async function createValidatedTransaction(
  client, orgId, ledgerId, transactionInput
) {
  // Validate the transaction
  const validationResult = validateTransaction(transactionInput);
  
  if (!validationResult.valid) {
    throw new Error(`Invalid transaction: ${validationResult.errors.join(', ')}`);
  }
  
  // Create with enhanced recovery
  const result = await withEnhancedRecovery(
    () => client.entities.transactions.createTransaction(
      orgId, ledgerId, transactionInput
    )
  );
  
  return result;
}
```

## Common Validation Functions

Here are some of the common validation functions provided by the SDK:

### String Validations

```typescript
import {
  isValidString,
  isValidName,
  isValidCode,
  isValidId,
  isValidMetadataKey
} from 'midaz-sdk/util/validation';

// Check if a string is valid (non-empty, trimmed)
isValidString('Hello'); // true
isValidString(''); // false
isValidString('   '); // false

// Check if a name is valid (1-64 chars, alphanumeric+spaces)
isValidName('Savings Account'); // true
isValidName('Account-123'); // true
isValidName(''); // false

// Check if a code is valid (1-8 chars, uppercase alphanumeric)
isValidCode('USD'); // true
isValidCode('USD123'); // true
isValidCode('usd'); // false (lowercase)

// Check if an ID is valid (UUID format)
isValidId('a1b2c3d4-e5f6-7890-abcd-ef1234567890'); // true
isValidId('invalid-id'); // false

// Check if a metadata key is valid
isValidMetadataKey('customField'); // true
isValidMetadataKey(''); // false
```

### Numeric Validations

```typescript
import {
  isValidAmount,
  isValidLimit,
  isValidOffset,
  isNonNegativeNumber
} from 'midaz-sdk/util/validation';

// Check if an amount is valid (non-null number)
isValidAmount(100.50); // true
isValidAmount(0); // true
isValidAmount(null); // false
isValidAmount('100'); // false (string)

// Check if a limit value is valid (positive integer)
isValidLimit(50); // true
isValidLimit(0); // false
isValidLimit(-10); // false

// Check if an offset value is valid (non-negative integer)
isValidOffset(0); // true
isValidOffset(100); // true
isValidOffset(-10); // false

// Check if a number is non-negative
isNonNegativeNumber(0); // true
isNonNegativeNumber(100); // true
isNonNegativeNumber(-10); // false
```

### Model Validations

```typescript
import {
  validateAssetInput,
  validateAccountInput,
  validateTransactionInput,
  validateOrganizationInput
} from 'midaz-sdk/util/validation';

// Validate asset input
const assetValidation = validateAssetInput({
  name: 'US Dollar',
  code: 'USD',
  type: 'currency'
});

// Validate account input
const accountValidation = validateAccountInput({
  name: 'Savings Account',
  ledgerId: 'ledger-123',
  assetIds: ['asset-123', 'asset-456']
});

// Validate transaction input
const transactionValidation = validateTransactionInput({
  entries: [
    { accountId: 'account-1', assetId: 'asset-1', amount: -100, type: 'debit' },
    { accountId: 'account-2', assetId: 'asset-1', amount: 100, type: 'credit' }
  ]
});

// Validate organization input
const organizationValidation = validateOrganizationInput({
  name: 'Acme Corp'
});
```

## Best Practices

1. **Validate Early**: Validate inputs before sending them to the API to catch errors early
2. **Combine with Builders**: Use builders to create valid objects and validation utilities to double-check
3. **Handle Validation Errors**: Provide clear error messages when validation fails
4. **Custom Validation Logic**: Extend the built-in validation for domain-specific rules
5. **Validate at Boundaries**: Always validate data coming from external sources (user input, file imports, etc.)

## Example: Comprehensive Validation

```typescript
import { createTransactionBuilder } from 'midaz-sdk';
import { 
  validateTransaction, 
  isValidAmount, 
  isValidId 
} from 'midaz-sdk/util/validation';
import { withEnhancedRecovery } from 'midaz-sdk/util';

async function createValidatedTransfer(
  client, orgId, ledgerId, sourceAccountId, destinationAccountId, assetId, amount
) {
  // Validate inputs individually
  const validationErrors = [];
  
  if (!isValidId(orgId)) {
    validationErrors.push('Invalid organization ID');
  }
  
  if (!isValidId(ledgerId)) {
    validationErrors.push('Invalid ledger ID');
  }
  
  if (!isValidId(sourceAccountId)) {
    validationErrors.push('Invalid source account ID');
  }
  
  if (!isValidId(destinationAccountId)) {
    validationErrors.push('Invalid destination account ID');
  }
  
  if (!isValidId(assetId)) {
    validationErrors.push('Invalid asset ID');
  }
  
  if (!isValidAmount(amount) || amount <= 0) {
    validationErrors.push('Invalid amount: must be positive');
  }
  
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }
  
  // Create transaction model
  const transaction = createTransactionBuilder()
    .withEntries([
      {
        accountId: sourceAccountId,
        assetId: assetId,
        amount: -amount,
        type: 'debit'
      },
      {
        accountId: destinationAccountId,
        assetId: assetId,
        amount: amount,
        type: 'credit'
      }
    ])
    .withMetadata({ 
      transactionType: 'transfer',
      reference: `TRANSFER-${Date.now()}`
    })
    .build();
  
  // Validate the transaction model
  const transactionValidation = validateTransaction(transaction);
  
  if (!transactionValidation.valid) {
    throw new Error(
      `Transaction validation failed: ${transactionValidation.errors.join(', ')}`
    );
  }
  
  // Create with enhanced recovery
  const result = await withEnhancedRecovery(
    () => client.entities.transactions.createTransaction(
      orgId, ledgerId, transaction
    )
  );
  
  return result;
}
```
