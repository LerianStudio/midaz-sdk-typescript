# Midaz SDK Documentation

## Introduction

The Midaz SDK is a comprehensive TypeScript library designed to interface with the Midaz financial API platform. It provides a robust foundation for building financial applications with a strong focus on reliability, observability, and developer experience.

This SDK follows a layered architecture with clear separation of concerns and employs modern design patterns that enhance maintainability and extensibility. It's built to provide a type-safe and intuitive developer experience while handling the complexities of financial transactions and operations.

## Key Features

- **Type Safety**: Comprehensive TypeScript interfaces and types
- **Builder Pattern**: Fluent interfaces for constructing complex objects
- **Error Handling**: Sophisticated error handling with recovery mechanisms
- **Observability**: Built-in tracing, metrics, and logging capabilities
- **Layered Architecture**: Clear separation between client, entities, API, and model layers

## Documentation Structure

### Core Concepts
- [Builder Pattern](./core-concepts/builder-pattern.md) - How to use builders for creating complex objects
- [Error Handling](./core-concepts/error-handling.md) - Error handling and recovery strategies

### Entities
- [Assets](./entities/assets.md) - Working with assets (currencies, commodities, etc.)
- [Accounts](./entities/accounts.md) - Working with accounts
- [Transactions](./entities/transactions.md) - Creating and managing transactions
- [Organizations](./entities/organizations.md) - Working with organizations
- [Ledgers](./entities/ledgers.md) - Managing ledgers

### Utilities
- [HTTP Client](./utilities/http-client.md) - Network communication utilities
- [Observability](./utilities/observability.md) - Tracing, metrics, and logging
- [Pagination](./utilities/pagination.md) - Handling paginated responses

## Basic Usage

```typescript
// Create a client
import { MidazClient, ClientConfigBuilder } from 'midaz-sdk';

const client = new MidazClient(
  new ClientConfigBuilder()
    .withApiKey('your-api-key')
    .withEnvironment('sandbox')
    .build()
);

// Create an asset
import { createAssetBuilder } from 'midaz-sdk';

const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);

// Create an account
import { createAccountBuilder } from 'midaz-sdk';

const accountInput = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds([asset.id])
  .withMetadata({ accountType: 'savings' })
  .build();

const account = await client.entities.accounts.createAccount(
  organizationId,
  accountInput
);

// Create a transaction
import { createTransferTransaction } from 'midaz-sdk';

const transaction = createTransferTransaction(
  sourceAccountId,
  destinationAccountId,
  '100.00',
  assetId,
  { idempotencyKey: 'unique-tx-id-123' }
);

await client.entities.transactions.createTransaction(
  organizationId,
  ledgerId,
  transaction
);
```

## Advanced Features

For critical operations, use enhanced recovery:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(
    organizationId,
    ledgerId,
    transaction
  ),
  { 
    retries: 3,
    verification: async (tx) => {
      const verifiedTx = await client.entities.transactions.getTransaction(
        organizationId,
        ledgerId,
        tx.id
      );
      return verifiedTx.status === 'completed';
    }
  }
);

if (result.success) {
  console.log(`Transaction created: ${result.data.id}`);
}
