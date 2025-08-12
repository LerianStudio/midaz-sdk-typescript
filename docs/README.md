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
- **API Versioning**: Support for multiple API versions with version transformers
- **Abort Control**: Support for cancellable requests using AbortController
- **Concurrency Management**: Tools for controlling parallel operations and throughput
- **Caching**: Configurable in-memory caching for improved performance
- **Access Manager**: Plugin-based authentication with external identity providers

## Documentation Structure

### Architecture

- [Overview](./architecture/overview.md) - High-level architecture overview and design principles
- [Service Layer](./architecture/service-layer.md) - Service layer design and patterns
- [Error Handling](./architecture/error-handling.md) - Error handling architecture and recovery mechanisms
- [Data Modeling](./architecture/data-modeling.md) - Data modeling approach and validation
- [Client Interface](./architecture/client-interface.md) - Client interface design and usage

### Core Concepts

- [Builder Pattern](./core-concepts/builder-pattern.md) - How to use builders for creating complex objects
- [Error Handling](./core-concepts/error-handling.md) - Error handling and recovery strategies

### Entities

- [Assets](./entities/assets.md) - Working with assets (currencies, commodities, etc.)
- [Accounts](./entities/accounts.md) - Working with accounts
- [Transactions](./entities/transactions.md) - Creating and managing transactions
- [Organizations](./entities/organizations.md) - Working with organizations
- [Ledgers](./entities/ledgers.md) - Managing ledgers
- [Asset Rates](./entities/asset-rates.md) - Managing exchange rates between assets
- [Balances](./entities/balances.md) - Working with account balances
- [Operations](./entities/operations.md) - Managing operations that make up transactions
- [Portfolios](./entities/portfolios.md) - Working with portfolios
- [Segments](./entities/segments.md) - Managing segments for analytics and grouping

### Utilities

- [Account Helpers](./utilities/account-helpers.md) - Helper functions for account operations
- [Cache](./utilities/cache.md) - Caching mechanisms for improved performance
- [Concurrency](./utilities/concurrency.md) - Utilities for managing concurrent operations
- [Config](./utilities/config.md) - Configuration management
- [Data](./utilities/data.md) - Data formatting and pagination utilities
- [Error Handling](./utilities/error-handling.md) - Error handling utilities and enhanced recovery
- [HTTP Client](./utilities/http-client.md) - Low-level HTTP client for API communication
- [Network](./utilities/network.md) - High-level networking utilities and retry mechanisms
- [Observability](./utilities/observability.md) - Tracing, metrics, and logging utilities
- [Pagination](./utilities/pagination.md) - Utilities for handling paginated responses
- [Validation](./utilities/validation.md) - Data validation utilities

## Authentication

The SDK supports multiple authentication methods:

### API Key Authentication

Simple authentication using an API key:

```typescript
const client = createClient({
  apiKey: 'your-api-key',
  environment: 'sandbox',
});
```

### Access Manager Authentication

For integration with external identity providers using OAuth:

```typescript
// Using the createClient function
const client = createClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  environment: 'sandbox',
});

// Using the builder pattern with environment-specific configurations
import { createSandboxConfigWithAccessManager, MidazClient } from 'midaz-sdk';

const client = new MidazClient(
  createSandboxConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
);
```

The Access Manager automatically handles:

- OAuth token acquisition using client credentials flow
- Token caching to minimize authentication requests
- Automatic token renewal before expiration
- Secure token management

## Basic Usage

```typescript
// Create a client
import { createClient } from 'midaz-sdk';

const client = createClient({
  apiKey: 'your-api-key',
  environment: 'sandbox',
});

// Create an asset
import { createAssetBuilder } from 'midaz-sdk';

const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

const asset = await client.entities.assets.createAsset('org_123', 'ledger_456', assetInput);

// Create an account
const accountInput = createAccountBuilder('Savings Account', 'USD')
  .withType('savings')
  .withAlias('personal-savings')
  .build();

const account = await client.entities.accounts.createAccount('org_123', 'ledger_456', accountInput);

// Create a transaction
const transactionInput = createTransactionBuilder()
  .withCode('payment_001')
  .withOperations([
    {
      accountId: 'source_account_id',
      assetCode: 'USD',
      amount: 100 * 100, // $100.00
      type: 'debit',
    },
    {
      accountId: 'destination_account_id',
      assetCode: 'USD',
      amount: 100 * 100, // $100.00
      type: 'credit',
    },
  ])
  .withMetadata({ purpose: 'Monthly payment' })
  .build();

// Use enhanced error recovery for critical operations
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction('org_123', 'ledger_456', transactionInput),
  {
    maxRetries: 3,
    enableSmartRecovery: true,
  }
);

if (result.status === 'success') {
  console.log('Transaction created:', result.result.id);
} else {
  console.error('Transaction failed:', result.error);
}

// Clean up resources when done
client.close();
```

## Installation

```bash
npm install midaz-sdk
# or
yarn add midaz-sdk
```

## System Requirements

### TypeScript Support

The Midaz SDK is written in TypeScript and provides full type definitions for all APIs. It requires TypeScript 5.8 or later.

### Node.js Compatibility

The SDK is compatible with Node.js versions 18.18.0 or later (but less than 24). It leverages modern JavaScript features while maintaining compatibility with the LTS versions of Node.js.

### Dependencies

The SDK has minimal production dependencies:

- `abort-controller`: For cancellable requests
- `axios`: For HTTP communication
- `node-fetch`: For network requests in Node.js environments

## Development

### Running Examples

The SDK includes numerous examples demonstrating various features:

```bash
# Run the complete workflow example
npm run example:workflow

# Run specific feature examples
npm run example:client-config
npm run example:api-versioning
npm run example:cache
npm run example:concurrency
npm run example:validation
npm run example:error-handling
npm run example:network
npm run example:data
npm run example:observability
```

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

- Automated testing across multiple Node.js versions
- Code quality checks with ESLint and Prettier
- Automated dependency updates via Dependabot
- Automated release process with semantic versioning
- Automated changelog generation

## Contributing

Please see our [Contributing Guide](../CONTRIBUTING.md) for details on how to contribute to the Midaz SDK.
