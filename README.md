# Midaz SDK for TypeScript

A TypeScript client library for interacting with the Midaz API. This SDK provides a robust interface for accessing Midaz's financial ledger services with full TypeScript type safety.

## Overview

The Midaz SDK enables seamless integration with Midaz's financial services platform. It offers a comprehensive set of tools for managing organizations, ledgers, accounts, transactions, and other financial entities with a clean, intuitive interface.

## Features

- **Type-Safe API**: Full TypeScript support with accurate type definitions
- **Comprehensive Error Handling**: Structured error types with detailed information
- **Observability**: Built-in tracing, metrics, and logging capabilities
- **Automatic Retries**: Configurable retry policies for transient failures
- **Pagination Helpers**: Utilities for handling large dataset queries
- **Transaction Builders**: Helper functions for creating common transaction types
- **Validation**: Extensive input validation with clear error messages

## Installation

```bash
npm install midaz-sdk
```

## Quick Start

```typescript
import { MidazClient } from 'midaz-sdk';

// Initialize the client
const client = new MidazClient({
  apiKey: 'your-api-key',
  environment: 'sandbox', // Options: 'development', 'sandbox', 'production'
});

// IMPORTANT: Always use client.entities (not client.entity which is deprecated)

// Use the client to interact with the API
async function example() {
  try {
    // Create an organization
    const organization = await client.entities.organizations.createOrganization({
      legalName: 'Acme Inc.',
      legalDocument: '123456789',
      doingBusinessAs: 'Acme',
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US',
      }
    });
    
    console.log(`Created organization: ${organization.id}`);
    
    // Create a ledger within the organization
    const ledger = await client.entities.ledgers.createLedger(
      organization.id,
      {
        name: 'Main Ledger'
      }
    );
    
    console.log(`Created ledger: ${ledger.id}`);
    
    // Create accounts
    const sourceAccount = await client.entities.accounts.createAccount(
      organization.id,
      ledger.id,
      {
        name: 'Operating Account',
        alias: 'operating',
        type: 'deposit'
      }
    );
    
    const destinationAccount = await client.entities.accounts.createAccount(
      organization.id,
      ledger.id,
      {
        name: 'Savings Account',
        alias: 'savings',
        type: 'savings'
      }
    );
    
    // Create a transfer transaction
    const transaction = await client.entities.transactions.createTransaction(
      organization.id,
      ledger.id,
      {
        description: 'Monthly transfer',
        operations: [
          {
            accountId: sourceAccount.id,
            type: 'DEBIT',
            amount: { value: 1000, assetCode: 'USD', scale: 2 }
          },
          {
            accountId: destinationAccount.id,
            type: 'CREDIT',
            amount: { value: 1000, assetCode: 'USD', scale: 2 }
          }
        ],
        metadata: { category: 'internal-transfer' }
      }
    );
    
    console.log(`Created transaction: ${transaction.id}`);
    
    // Check account balances
    const balances = await client.entities.balances.listBalances(
      organization.id,
      ledger.id,
      { filter: { accountId: destinationAccount.id } }
    );
    
    console.log('Account balances:', balances.items);
  } catch (error) {
    if (error.category && error.code) {
      console.error(`Error ${error.category}/${error.code}: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

example();
```

## Transaction Helpers

The SDK provides helper functions for creating common transaction types:

```typescript
import { 
  createDepositTransaction,
  createWithdrawalTransaction,
  createTransferTransaction
} from 'midaz-sdk';

// Create a deposit transaction
const depositTx = createDepositTransaction(
  '@external/USD',  // Source (external account)
  'acc_12345',      // Destination account
  1000,             // Amount
  'USD',            // Asset code
  2,                // Scale (2 decimal places)
  'Customer deposit'
);

// Create a withdrawal transaction
const withdrawalTx = createWithdrawalTransaction(
  'acc_12345',      // Source account
  '@external/USD',  // Destination (external account)
  500,              // Amount
  'USD',            // Asset code
  2,                // Scale
  'Customer withdrawal'
);

// Create a transfer transaction
const transferTx = createTransferTransaction(
  'acc_savings',    // Source account
  'acc_checking',   // Destination account
  200,              // Amount
  'USD',            // Asset code
  2,                // Scale
  'Monthly transfer'
);

// Execute transactions
await client.entities.transactions.createTransaction(orgId, ledgerId, depositTx);
await client.entities.transactions.createTransaction(orgId, ledgerId, withdrawalTx);
await client.entities.transactions.createTransaction(orgId, ledgerId, transferTx);
```

## Working with Large Datasets

For handling large collections of data, the SDK provides paginator objects:

```typescript
// Create a transaction paginator
const paginator = client.entities.transactions.getTransactionPaginator(
  organizationId,
  ledgerId,
  { limit: 100 }
);

// Process transactions page by page
while (await paginator.hasNext()) {
  const transactions = await paginator.next();
  for (const transaction of transactions) {
    // Process each transaction
    console.log(`Processing transaction ${transaction.id}`);
  }
}

// Alternatively, use async iteration
for await (const transactions of client.entities.transactions.iterateTransactions(
  organizationId,
  ledgerId
)) {
  for (const transaction of transactions) {
    // Process each transaction
    console.log(`Processing transaction ${transaction.id}`);
  }
}
```

## Error Handling

The SDK provides structured error handling:

```typescript
try {
  const account = await client.entities.accounts.getAccount(
    organizationId,
    ledgerId,
    'non-existent-id'
  );
} catch (error) {
  if (error.category === 'not_found') {
    console.log('Account not found');
  } else if (error.category === 'validation') {
    console.log(`Validation error: ${error.message}`);
    if (error.fieldErrors) {
      for (const [field, errors] of Object.entries(error.fieldErrors)) {
        console.log(`- ${field}: ${errors.join(', ')}`);
      }
    }
  } else if (error.category === 'network') {
    console.log(`Network error: ${error.message}`);
    // Implement retry logic or fallback
  } else {
    console.log(`Unexpected error: ${error.message}`);
  }
}
```

## Advanced Configuration

The SDK supports advanced configuration options:

```typescript
const client = new MidazClient({
  // Authentication
  apiKey: 'your-api-key',
  
  // Environment
  environment: 'sandbox', // 'development', 'sandbox', or 'production'
  
  // Custom base URLs
  baseUrls: {
    onboarding: 'https://custom.onboarding.api.example.com/v1',
    transaction: 'https://custom.transaction.api.example.com/v1'
  },
  
  // Network settings
  timeout: 60000, // 60 seconds
  retries: {
    maxRetries: 5,
    initialDelay: 200,
    maxDelay: 3000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryCondition: (error) => error.message.includes('timeout')
  },
  
  // Observability
  observability: {
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    serviceName: 'my-application',
    collectorEndpoint: 'http://localhost:4318'
  }
});
```

## SDK Documentation

The SDK provides comprehensive entity APIs:

| Entity        | Description                                       |
| ------------- | ------------------------------------------------- |
| Organizations | Manage companies or business entities             |
| Ledgers       | Financial record-keeping systems                  |
| Accounts      | Individual accounts within ledgers                |
| Transactions  | Financial movements between accounts              |
| Operations    | Individual debits and credits within transactions |
| Assets        | Currencies or other value stores                  |
| Asset Rates   | Exchange rates between assets                     |
| Balances      | Account balances for specific assets              |
| Portfolios    | Collections of assets                             |
| Segments      | Subdivisions within portfolios                    |

Each entity service follows a consistent pattern with methods for creating, retrieving, updating, and listing resources.

## Development

For contributors to the Midaz SDK:

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Generate documentation
npm run docs
```

## Documentation

- [API Response Patterns](./docs/api-patterns.md): Standardized patterns for API responses and client interaction
- [JSDoc Documentation](./docs/jsdoc/): Detailed API documentation for all classes and methods
- [TypeDoc Documentation](./docs/typedoc/): TypeScript interface documentation

## License

Apache-2.0