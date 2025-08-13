# Midaz SDK Architecture Overview

This document provides a high-level overview of the Midaz SDK architecture, its design principles, and key components.

## Architecture Goals

The Midaz SDK is designed with the following architectural goals:

1. **Type Safety** - Provide a fully typed API surface for optimal developer experience in TypeScript
2. **Modular Design** - Allow consumers to import only what they need
3. **Robustness** - Handle network failures, retries, and edge cases gracefully
4. **Performance** - Optimize for efficient API interactions and resource usage
5. **Extensibility** - Enable extension points for custom behavior
6. **Developer Experience** - Provide an intuitive, consistent API surface

## High-Level Architecture

The Midaz SDK follows a layered architecture pattern:

```
┌───────────────────────────────────────────────────────┐
│                    Client Interface                    │
└───────────────────────────────────┬───────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────┐
│                   Entity Services                      │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Accounts │ │  Assets  │ │ Balances │ │   ...    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└───────────────────────────────┬───────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────┐
│                   Core Services                        │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   HTTP   │ │   Error  │ │  Cache   │ │   ...    │  │
│  │  Client  │ │ Handling │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└───────────────────────────────────────────────────────┘
```

### Main Components

1. **Client Interface** - The main entry point for SDK consumers, providing a unified interface to all services
2. **Entity Services** - Services for working with domain entities like accounts, assets, transactions
3. **Core Services** - Foundational services for HTTP communication, error handling, validation, etc.
4. **Utility Modules** - Reusable utilities for common tasks like data formatting, pagination, etc.

## Design Patterns

The SDK implements several design patterns to enhance maintainability, extensibility, and usability:

### Builder Pattern

The SDK uses a builder pattern for creating complex objects:

```typescript
// Using the builder pattern to create an asset
const assetInput = createAssetBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

// Pass the built object to the API
const asset = await client.entities.assets.createAsset(organizationId, ledgerId, assetInput);
```

The builder pattern provides:

- Fluent interface for constructing complex objects
- Parameter validation at build-time
- Immutable intermediate objects
- Separation of construction from representation

### Singleton Pattern

Used for services that should exist only once throughout the application:

```typescript
// ConfigService is a singleton
const config = ConfigService.getInstance();
```

### Factory Pattern

Factory methods create and return instances of services:

```typescript
// Factory function to create a client with PluginAccessManager
const client = createClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withEnvironment('production')
);
```

### Facade Pattern

The client interface acts as a facade to simplify the complex subsystems:

```typescript
// Instead of interacting with HTTP client directly, use PluginAccessManager
const client = createClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
);

// Simple interface to complex operations
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
```

### Enhanced Recovery Pattern

The SDK implements enhanced recovery mechanisms for operations that may fail transiently:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

// Execute with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, tx),
  {
    maxRetries: 3,
    fallbackAttempts: 2,
    enableSmartRecovery: true,
  }
);
```

## Core Modules

### Client

The client is the main entry point to the SDK. It manages authentication and provides access to all entity services.

```typescript
import { createClient } from 'midaz-sdk';

const client = createClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withEnvironment('production')
);

// Access entity services
const accountsService = client.entities.accounts;
const assetsService = client.entities.assets;
```

### Entity Services

Entity services provide domain-specific operations:

```typescript
// AccountsService
interface AccountsService {
  createAccount(orgId, ledgerId, account): Promise<Account>;
  getAccount(orgId, ledgerId, accountId): Promise<Account>;
  updateAccount(orgId, ledgerId, accountId, account): Promise<Account>;
  deleteAccount(orgId, ledgerId, accountId): Promise<void>;
  listAccounts(orgId, ledgerId, options?): Promise<ListResponse<Account>>;
}
```

Each entity service follows a consistent API pattern with CRUD operations and listing capabilities.

### HTTP Client

The HTTP client provides a robust implementation for making API requests:

```typescript
class HttpClient {
  get(url, options);
  post(url, data, options);
  put(url, data, options);
  patch(url, data, options);
  delete(url, options);
}
```

Features:

- Automatic retries for transient failures
- Consistent error handling
- Support for authentication
- Connection pooling
- Observability integration

### Error Handling

The SDK provides a comprehensive error handling system:

```typescript
class MidazError extends Error {
  category: ErrorCategory;
  code: ErrorCode;
  resource?: string;
  resourceId?: string;
  // ...
}
```

Features:

- Categorized errors (validation, authentication, network, etc.)
- Specific error codes for detailed error types
- Enhanced recovery mechanisms for retrying failed operations
- Structured error information for debugging

### Validation

The SDK includes validation utilities for ensuring data integrity:

```typescript
const validationResult = validateAssetCode(assetCode);
if (!validationResult.valid) {
  console.error(validationResult.message);
}
```

Features:

- Field-level validation functions
- Structured validation results
- Combined validation for complex objects
- Integration with error handling

## Dependency Management

The SDK minimizes external dependencies to reduce bundle size and potential conflicts:

- **Production Dependencies**: Limited to essential packages
- **Development Dependencies**: Tools for building, testing, and documenting
- **Peer Dependencies**: Frameworks or libraries that consumers should provide

## Configuration Management

Configuration is centralized through the `ConfigService`:

```typescript
import { ConfigService } from 'midaz-sdk/util/config';

// Override configuration
ConfigService.configure({
  apiUrls: {
    onboardingUrl: 'https://custom-api.example.com/v1',
  },
});
```

Features:

- Environment variable support
- Programmatic configuration overrides
- Service-specific configuration groups
- Default values for all settings

## Error Recovery Strategy

The SDK implements sophisticated error recovery:

1. **Automatic Retries**: Retries operations that fail due to transient errors
2. **Exponential Backoff**: Gradually increases delay between retries
3. **Fallback Mechanisms**: Attempts alternative approaches when regular retries fail
4. **Smart Recovery**: Adapts recovery strategy based on error type
5. **Verification**: Confirms operation success through polling

## Testing Strategy

The SDK is designed for comprehensive testing:

1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: Interactions between components
3. **End-to-End Tests**: Complete SDK workflows
4. **Mock HTTP Client**: Simulates API responses for deterministic testing
5. **Recording Mode**: Captures real API interactions for playback in tests

## API Design Principles

The SDK's API is designed following these principles:

1. **Consistency**: Similar operations have similar interfaces
2. **Predictability**: Functions behave as expected with clear documentation
3. **Discoverability**: Types and functions are named intuitively
4. **Flexibility**: Optional parameters allow customization
5. **Error Clarity**: Detailed error information for troubleshooting

## Extension Points

The SDK provides several extension points:

1. **Custom HTTP Client**: Inject a custom HTTP client implementation
2. **Custom Error Handlers**: Provide custom error handling logic
3. **Middleware Support**: Add custom pre/post processing for API requests
4. **Observability Hooks**: Integrate with custom monitoring solutions
5. **Custom Validation Rules**: Extend validation with domain-specific rules

## Security Considerations

The SDK is designed with security in mind:

1. **Authentication Management**: Secure handling of OAuth credentials through PluginAccessManager
2. **TLS Support**: Secure communication with API endpoints
3. **Input Validation**: Prevents injection attacks
4. **Output Sanitization**: Prevents leakage of sensitive information
5. **Minimized Attack Surface**: Limited exposed functionality
