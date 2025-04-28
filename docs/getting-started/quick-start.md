# Quick Start Guide

This guide will help you quickly get started with the Midaz SDK for TypeScript.

## Installation

Install the Midaz SDK using npm or yarn:

```bash
# Using npm
npm install midaz-sdk

# Using yarn
yarn add midaz-sdk
```

## Basic Usage

### Initialize the Client

The first step is to create a client instance using the builder pattern:

```typescript
import { MidazClient, createClientConfig } from 'midaz-sdk';

// Create a configuration using the builder pattern
const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('sandbox')  // Options: 'development', 'sandbox', 'production'
  .withObservability({
    enabled: true,
    serviceName: 'my-financial-app'
  })
  .build();

// Initialize the client
const client = new MidazClient(config);
```

### Working with Organizations

Create and manage organizations:

```typescript
import { createOrganizationBuilder } from 'midaz-sdk';

// Create an organization
const organizationInput = createOrganizationBuilder('Acme Corp')
  .withMetadata({ industry: 'Technology' })
  .build();

const organization = await client.entities.organizations.createOrganization(
  organizationInput
);

// Get organization details
const orgDetails = await client.entities.organizations.getOrganization(
  organization.id
);

// List all organizations
const organizations = await client.entities.organizations.listOrganizations();
```

### Working with Assets

Create and manage financial assets:

```typescript
import { createAssetBuilder } from 'midaz-sdk';

// Create an asset
const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);

// Get asset details
const assetDetails = await client.entities.assets.getAsset(
  organizationId, 
  ledgerId,
  asset.id
);

// List all assets
const assets = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }  // Pagination options
);
```

### Working with Accounts

Create and manage accounts:

```typescript
import { createAccountBuilder } from 'midaz-sdk';

// Create an account
const accountInput = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ accountType: 'savings' })
  .build();

const account = await client.entities.accounts.createAccount(
  organizationId,
  accountInput
);

// Get account details
const accountDetails = await client.entities.accounts.getAccount(
  organizationId,
  account.id
);

// List all accounts
const accounts = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }  // Pagination options
);
```

### Working with Transactions

Create and manage financial transactions:

```typescript
import { createTransactionBuilder } from 'midaz-sdk';

// Create a transaction
const transactionInput = createTransactionBuilder()
  .withEntries([
    {
      accountId: sourceAccountId,
      assetId: assetId,
      amount: -100,  // Negative for debit
      type: 'debit'
    },
    {
      accountId: destinationAccountId,
      assetId: assetId,
      amount: 100,   // Positive for credit
      type: 'credit'
    }
  ])
  .withMetadata({ reference: 'Transfer #12345' })
  .build();

// Use enhanced recovery for critical operations
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(
    organizationId,
    ledgerId,
    transactionInput
  )
);

if (result.success) {
  const transaction = result.data;
  console.log(`Transaction created with ID: ${transaction.id}`);
} else {
  console.error(`Failed to create transaction: ${result.error.message}`);
}

// Get transaction details
const transactionDetails = await client.entities.transactions.getTransaction(
  organizationId,
  ledgerId,
  transaction.id
);

// List transactions
const transactions = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { limit: 20, offset: 0 }
);
```

## Error Handling

Handle errors gracefully using try-catch or the enhanced recovery utility:

```typescript
try {
  const asset = await client.entities.assets.getAsset(
    organizationId,
    ledgerId,
    assetId
  );
} catch (error) {
  console.error(`Error code: ${error.code}`);
  console.error(`Error message: ${error.message}`);
  
  // Handle specific error types
  if (error.code === 'NOT_FOUND') {
    console.log('Asset not found, creating a new one...');
    // Create asset...
  }
}
```

## Pagination

Handle paginated results for list operations:

```typescript
// Manual pagination
let offset = 0;
const limit = 50;
let hasMore = true;

while (hasMore) {
  const response = await client.entities.accounts.listAccounts(
    organizationId,
    ledgerId,
    { limit, offset }
  );
  
  for (const account of response.data) {
    // Process each account...
    console.log(`Account: ${account.name} (${account.id})`);
  }
  
  offset += limit;
  hasMore = response.data.length === limit;
}

// Or use the pagination utility
import { processPaginatedResults } from 'midaz-sdk/util/data';

const allAccounts = await processPaginatedResults(
  (options) => client.entities.accounts.listAccounts(organizationId, ledgerId, options)
);
```

## Next Steps

Once you're comfortable with the basics, explore more advanced topics:

- [Error Handling and Recovery](../core-concepts/error-handling.md)
- [Using the Builder Pattern](../core-concepts/builder-pattern.md)
- [SDK Architecture](../architecture/overview.md)
- [Utilities Overview](../utilities/overview.md)
