# Service Layer Architecture

The Midaz SDK implements a multi-layered service architecture that separates concerns while providing a consistent interface for SDK consumers. This document explains the design of the service layer, its components, and interactions.

## Service Layer Structure

The service layer is structured in a hierarchical manner:

```
┌─────────────────────────────────┐
│        Client Interface         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│       Entity Services Layer     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│       Core Services Layer       │
└─────────────────────────────────┘
```

### Client Interface

The client interface serves as the primary entry point for SDK consumers:

```typescript
import { createClient } from 'midaz-sdk';

const client = createClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

// Access entity services through the client
const account = await client.entities.accounts.getAccount('org_123', 'ledger_456', 'account_789');
```

Key characteristics:

- **Unified Access Point**: Provides access to all SDK capabilities
- **Configuration Management**: Handles API keys, environment settings, etc.
- **Service Discovery**: Exposes available services in a discoverable manner
- **Instance Management**: Ensures proper initialization and cleanup

### Entity Services Layer

Entity services represent domain-specific operations around specific business entities:

```typescript
// Example entity service for Accounts
interface AccountsService {
  createAccount(orgId: string, ledgerId: string, account: CreateAccountInput): Promise<Account>;
  getAccount(orgId: string, ledgerId: string, accountId: string): Promise<Account>;
  updateAccount(
    orgId: string,
    ledgerId: string,
    accountId: string,
    account: UpdateAccountInput
  ): Promise<Account>;
  deleteAccount(orgId: string, ledgerId: string, accountId: string): Promise<void>;
  listAccounts(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Account>>;
}
```

The SDK includes entity services for:

- Accounts
- Assets
- Asset Rates
- Balances
- Ledgers
- Operations
- Organizations
- Portfolios
- Segments
- Transactions

Each entity service follows a consistent pattern, typically including:

- **CRUD Operations**: Create, read, update, delete methods for the entity
- **List Operations**: Methods to list entities with filtering, sorting, and pagination
- **Specialized Operations**: Entity-specific methods for unique operations

### Core Services Layer

Core services provide foundational capabilities used by entity services:

- **HTTP Client**: Manages API communication
- **Error Handling**: Provides consistent error processing
- **Validation**: Ensures data integrity
- **Caching**: Optimizes performance for frequently accessed data
- **Configuration**: Manages SDK settings
- **Observability**: Provides monitoring capabilities

## Service Interactions

The service layers interact in a top-down manner, with higher layers depending on lower layers:

1. **Client Interface → Entity Services**: The client provides access to entity services
2. **Entity Services → Core Services**: Entity services use core services for implementation

Example interaction flow:

```
Client.entities.accounts.getAccount()
  │
  ▼
AccountsService implementation
  │
  ▼
HttpClient.get()
  │
  ▼
Error handling, validation, etc.
  │
  ▼
Return response to consumer
```

## Service Implementation Pattern

Entity services follow a consistent implementation pattern:

```typescript
// Example implementation pattern (simplified)
class AccountsServiceImpl implements AccountsService {
  private httpClient: HttpClient;
  private basePath: string;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
    this.basePath = 'accounts';
  }

  async createAccount(
    orgId: string,
    ledgerId: string,
    account: CreateAccountInput
  ): Promise<Account> {
    // Validate input
    validate(account, validateAccountInput);

    // Make API request
    try {
      const response = await this.httpClient.post(
        `organizations/${orgId}/ledgers/${ledgerId}/${this.basePath}`,
        account
      );

      return response as Account;
    } catch (error) {
      // Enhanced error handling
      throw processError(error, {
        operation: 'createAccount',
        resource: 'Account',
        resourceId: account.id,
      });
    }
  }

  // Other methods follow similar pattern...
}
```

Key aspects of this pattern:

- **Dependency Injection**: Services receive dependencies via constructor
- **Path Construction**: Consistent URL path building
- **Input Validation**: Pre-request validation
- **Error Enhancement**: Enriching errors with context
- **Response Typing**: Type casting for response objects

## Service Factory Pattern

Services are created using a factory pattern:

```typescript
// Factory function to create a service instance
function createAccountsService(httpClient: HttpClient, config?: ServiceConfig): AccountsService {
  return new AccountsServiceImpl(httpClient, config);
}

// Used by the client interface
const client = createClient({ apiKey: 'your-key' });
const accountsService = createAccountsService(client.httpClient);
client.entities.accounts = accountsService;
```

The factory pattern provides:

- **Abstraction**: Hides implementation details
- **Configuration**: Allows customizing service behavior
- **Testing**: Enables easier mocking for tests

## Service Discovery

The client interface implements service discovery through property accessors:

```typescript
class Client {
  private _entities: {
    accounts?: AccountsService;
    assets?: AssetsService;
    // Other services...
  } = {};

  private httpClient: HttpClient;

  constructor(config: ClientConfig) {
    this.httpClient = new HttpClient(config);
  }

  get entities() {
    // Lazy initialization of services
    if (!this._entities.accounts) {
      this._entities.accounts = createAccountsService(this.httpClient);
    }

    if (!this._entities.assets) {
      this._entities.assets = createAssetsService(this.httpClient);
    }

    // Initialize other services as needed...

    return this._entities;
  }
}
```

This approach provides:

- **Lazy Loading**: Services are created only when needed
- **Resource Efficiency**: Minimizes memory usage
- **Discoverability**: IDE auto-completion shows available services

## Service Configuration

Services can be configured through both global and service-specific settings:

```typescript
// Global configuration through ConfigService
ConfigService.configure({
  apiUrls: {
    onboardingUrl: 'https://custom-api.example.com/v1',
  },
});

// Service-specific configuration
const accountsService = createAccountsService(httpClient, {
  cacheEnabled: true,
  cacheTtl: 60000, // 1 minute
});
```

## Service Interface Stability

The SDK maintains interface stability through several practices:

1. **Interface Separation**: Interfaces are defined separately from implementations
2. **Versioned Interfaces**: Major changes are released in new versions
3. **Optional Parameters**: New features are added as optional parameters
4. **Deprecated Markers**: Methods scheduled for removal are marked as deprecated
5. **Migration Guides**: Documentation guides users through breaking changes

## Error Handling in Services

Services implement a consistent error handling pattern:

```typescript
try {
  // Make API request
  const response = await this.httpClient.post(path, data);
  return response;
} catch (error) {
  // Process and enhance error
  throw processError(error, {
    operation: 'operationName',
    resource: 'ResourceName',
    resourceId: resourceId,
    // Additional context
    details: {
      /* operation-specific details */
    },
  });
}
```

This pattern:

- **Contextualizes Errors**: Adds operational context to errors
- **Categorizes Errors**: Maps HTTP errors to domain-specific categories
- **Standardizes Format**: Ensures consistent error structure
- **Preserves Details**: Maintains original error information

## Service Testing Strategy

Services are designed for thorough testing:

1. **Unit Tests**: Test service methods in isolation with mocked dependencies
2. **Integration Tests**: Test services with real (or realistic) HTTP client implementation
3. **Contract Tests**: Verify service interfaces conform to defined contracts
4. **Mock Responses**: Use recorded API responses for reliable testing
5. **Error Scenarios**: Test error handling for various failure modes
