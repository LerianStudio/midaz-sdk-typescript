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

### Architecture
- [System Overview](./architecture/overview.md) - Core components and layers
- [Design Patterns](./architecture/patterns.md) - Key patterns used in the SDK

### Getting Started
- [Installation](./getting-started/installation.md) - How to install the SDK
- [Configuration](./getting-started/configuration.md) - Configuring the SDK
- [Quick Start](./getting-started/quick-start.md) - Simple examples to get started

### Core Concepts
- [Client](./core-concepts/client.md) - Main entry point
- [Builder Pattern](./core-concepts/builder-pattern.md) - How to use builders
- [Error Handling](./core-concepts/error-handling.md) - Error handling strategies

### Entities
- [Assets](./entities/assets.md) - Working with assets
- [Accounts](./entities/accounts.md) - Working with accounts
- [Transactions](./entities/transactions.md) - Working with transactions
- [Organizations](./entities/organizations.md) - Working with organizations

### Utilities
- [Observability](./utilities/observability.md) - Tracing, metrics, and logging
- [Enhanced Recovery](./utilities/enhanced-recovery.md) - Advanced error recovery
- [HTTP Client](./utilities/http-client.md) - Network communication utilities

## Basic Usage

```typescript
// Create a client
import { MidazClient, createClientConfig } from 'midaz-sdk';

const config = createClientConfig()
  .withApiKey('your-api-key')
  .withEnvironment('sandbox')
  .build();

const client = new MidazClient(config);

// Create an asset using the builder pattern
const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  createAssetBuilder('USD Currency', 'USD')
    .withType('currency')
    .withMetadata({ precision: 2, symbol: '$' })
    .build()
);

// List accounts with pagination
const accounts = await client.entities.accounts.listAccounts(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

// Use enhanced error recovery
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(organizationId, ledgerId, transaction)
);
```

## Architecture Overview

The Midaz SDK follows a layered architecture:

1. **Client Layer**: Main entry point that bootstraps all services
2. **Entity Layer**: Service interfaces and implementations that encapsulate business logic
3. **API Layer**: Handles direct communication with backend services
4. **Model Layer**: Defines data structures with builders and validators
5. **Utility Layer**: Provides cross-cutting functionality like error handling and observability

## Builder Pattern

The SDK uses a builder pattern for creating complex objects with clear, chainable methods. This provides a fluent interface while hiding implementation details:

```typescript
// Create an account using the builder pattern
const account = createAccountBuilder('Savings Account', ledgerId)
  .withAssetIds(['asset1', 'asset2'])
  .withMetadata({ accountType: 'savings' })
  .build();

// Create an organization using the builder pattern
const organization = createOrganizationBuilder('Acme Corp')
  .withMetadata({ industry: 'Technology' })
  .build();
```

For more details on specific components and usage patterns, refer to the relevant documentation pages linked above.
