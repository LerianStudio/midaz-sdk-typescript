# Midaz SDK for TypeScript

A TypeScript client library for interacting with the Midaz API. This SDK provides a robust interface for accessing Midaz's financial ledger services with full TypeScript type safety.

## Overview

The Midaz SDK enables seamless integration with Midaz's financial services platform. It offers a comprehensive set of tools for managing organizations, ledgers, accounts, transactions, and other financial entities with a clean, intuitive interface.

## Features

- **Type-Safe API**: Full TypeScript support with accurate type definitions
- **Builder Pattern**: Fluent interfaces for constructing complex objects
- **Comprehensive Error Handling**: Sophisticated error handling with recovery mechanisms
- **Observability**: Built-in tracing, metrics, and logging capabilities
- **Layered Architecture**: Clear separation between client, entities, API, and model layers
- **Automatic Retries**: Configurable retry policies for transient failures
- **Concurrency Controls**: Utilities for managing parallel operations with controlled throughput
- **Caching**: In-memory caching mechanisms for improved performance
- **Validation**: Extensive input validation with clear error messages
- **API Versioning**: Support for multiple API versions with version transformers
- **Abort Control**: Support for cancellable requests using AbortController
- **Access Manager**: Plugin-based authentication with external identity providers
- **Comprehensive Examples**: Detailed examples for all major features

## Installation

```bash
npm install midaz-sdk
# or
yarn add midaz-sdk
```

## Quick Start

```typescript
import { createClient } from 'midaz-sdk';

// Initialize the client
const client = createClient({
  apiKey: 'your-api-key',
  environment: 'sandbox', // Options: 'development', 'sandbox', 'production'
});

// Create an asset using the builder pattern
import { createAssetBuilder } from 'midaz-sdk';

const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

const asset = await client.entities.assets.createAsset('org_123', 'ledger_456', assetInput);

// Create an account
import { createAccountBuilder } from 'midaz-sdk';

const accountInput = createAccountBuilder('Savings Account', 'USD')
  .withType('savings')
  .withAlias('personal-savings')
  .build();

const account = await client.entities.accounts.createAccount('org_123', 'ledger_456', accountInput);

// Create a transaction
import { createTransactionBuilder } from 'midaz-sdk';

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

// Clean up resources when done
client.close();
```

### Using Access Manager for Authentication

For applications that need to integrate with external identity providers, the SDK provides an Access Manager:

```typescript
import { createClientConfigWithAccessManager, MidazClient } from 'midaz-sdk';

// Initialize the client with Access Manager authentication
const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com', // Identity provider address
    clientId: 'your-client-id', // OAuth client ID
    clientSecret: 'your-client-secret', // OAuth client secret
    tokenEndpoint: '/oauth/token', // Optional, defaults to '/oauth/token'
    refreshThresholdSeconds: 300, // Optional, defaults to 300 (5 minutes)
  })
    .withEnvironment('sandbox')
    .withApiVersion('v1')
);

// The SDK will automatically handle token acquisition and renewal
// You can now use the client as normal
const organizations = await client.entities.organizations.listOrganizations();

// For environment-specific configurations with Access Manager
const sandboxClient = new MidazClient(
  createSandboxConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
);

// Clean up resources when done
client.close();
```

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
const client = createClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  environment: 'sandbox',
});
```

The Access Manager automatically handles token acquisition, caching, and renewal, eliminating the need to manage authentication tokens manually.

## Documentation

For detailed documentation, see the [SDK Documentation](./docs/README.md) which includes:

### Architecture

- [Overview](./docs/architecture/overview.md) - High-level architecture overview and design principles
- [Service Layer](./docs/architecture/service-layer.md) - Service layer design and patterns
- [Error Handling](./docs/architecture/error-handling.md) - Error handling architecture and recovery mechanisms
- [Data Modeling](./docs/architecture/data-modeling.md) - Data modeling approach and validation
- [Client Interface](./docs/architecture/client-interface.md) - Client interface design and usage

### Core Concepts

- [Builder Pattern](./docs/core-concepts/builder-pattern.md) - How to use builders for creating complex objects
- [Error Handling](./docs/core-concepts/error-handling.md) - Error handling and recovery strategies

### Entities

- [Assets](./docs/entities/assets.md) - Working with assets (currencies, commodities, etc.)
- [Accounts](./docs/entities/accounts.md) - Working with accounts
- [Transactions](./docs/entities/transactions.md) - Creating and managing transactions
- [Organizations](./docs/entities/organizations.md) - Working with organizations
- [Ledgers](./docs/entities/ledgers.md) - Managing ledgers
- [Asset Rates](./docs/entities/asset-rates.md) - Managing exchange rates between assets
- [Balances](./docs/entities/balances.md) - Working with account balances
- [Operations](./docs/entities/operations.md) - Managing operations that make up transactions
- [Portfolios](./docs/entities/portfolios.md) - Working with portfolios
- [Segments](./docs/entities/segments.md) - Managing segments for analytics and grouping

### Utilities

- [Account Helpers](./docs/utilities/account-helpers.md) - Helper functions for account operations
- [Cache](./docs/utilities/cache.md) - Caching mechanisms for improved performance
- [Concurrency](./docs/utilities/concurrency.md) - Utilities for managing concurrent operations
- [Config](./docs/utilities/config.md) - Configuration management
- [Data](./docs/utilities/data.md) - Data formatting and pagination utilities
- [Error Handling](./docs/utilities/error-handling.md) - Error handling utilities and enhanced recovery
- [HTTP Client](./docs/utilities/http-client.md) - Low-level HTTP client for API communication
- [Network](./docs/utilities/network.md) - High-level networking utilities and retry mechanisms
- [Observability](./docs/utilities/observability.md) - Tracing, metrics, and logging utilities
- [Pagination](./docs/utilities/pagination.md) - Utilities for handling paginated responses
- [Validation](./docs/utilities/validation.md) - Data validation utilities

## TypeScript Support

The Midaz SDK is written in TypeScript and provides full type definitions for all APIs. It requires TypeScript 5.8 or later.

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

- Automated testing across multiple Node.js versions
- Code quality checks with ESLint and Prettier
- Automated dependency updates via Dependabot
- Automated release process with semantic versioning
- Automated changelog generation

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to contribute to the Midaz SDK.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.
