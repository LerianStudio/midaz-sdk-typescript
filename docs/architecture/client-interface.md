# Client Interface Architecture

The Midaz SDK client interface serves as the primary entry point for SDK consumers. This document explains the design of the client interface, its responsibilities, and how it organizes access to the SDK's capabilities.

## Client Design Goals

The client interface is designed with the following goals:

1. **Simplicity**: Provide a straightforward, intuitive API surface
2. **Discoverability**: Make available operations easy to discover
3. **Consistency**: Maintain consistent patterns across all operations
4. **Configurability**: Allow customization of client behavior
5. **Resource Management**: Handle resources like connections efficiently
6. **Authentication**: Manage API credentials securely

## Client Structure

The client interface is structured hierarchically:

```
┌─────────────────────────────────────────────┐
│                   Client                    │
├─────────────────────────────────────────────┤
│ - configuration management                  │
│ - authentication                            │
│ - global error handling                     │
│ - resource management                       │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│               Entity Groups                 │
├─────────────────────────────────────────────┤
│ - client.entities.*                         │
│ - client.utilities.*                        │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             Entity Services                 │
├─────────────────────────────────────────────┤
│ - client.entities.accounts                  │
│ - client.entities.transactions              │
│ - client.entities.assets                    │
│ - etc.                                      │
└─────────────────────────────────────────────┘
```

## Client Creation

The client is created using a factory function:

```typescript
import { createClient } from 'midaz-sdk';

// Create client with default configuration
const client = createClient();

// Create client with custom configuration
const client = createClient({
  apiKey: 'your-api-key',
  environment: 'production',
  httpOptions: {
    timeout: 30000,
    keepAlive: true,
  },
});
```

The factory function accepts configuration options and returns a fully initialized client instance.

## Client Interface Implementation

The client interface is implemented as follows:

```typescript
/**
 * Main client interface for the Midaz SDK
 */
class Client {
  /** HTTP client for API requests */
  private httpClient: HttpClient;

  /** Configuration service instance */
  private config: ConfigService;

  /** Entity services container */
  private _entities?: EntityServices;

  /** Utility services container */
  private _utilities?: UtilityServices;

  /**
   * Creates a new client instance
   * @param config Client configuration
   */
  constructor(config: ClientConfig) {
    // Initialize configuration service
    this.config = ConfigService.getInstance();

    // Apply configuration overrides
    if (config) {
      ConfigService.configure({
        apiUrls: {
          onboardingUrl: config.onboardingUrl,
          transactionUrl: config.transactionUrl,
        },
        httpClient: {
          apiKey: config.apiKey,
          timeout: config.httpOptions?.timeout,
          keepAlive: config.httpOptions?.keepAlive,
        },
      });
    }

    // Initialize HTTP client
    this.httpClient = new HttpClient({
      apiKey: config.apiKey,
    });
  }

  /**
   * Access entity services
   */
  get entities(): EntityServices {
    if (!this._entities) {
      this._entities = {
        accounts: createAccountsService(this.httpClient),
        assets: createAssetsService(this.httpClient),
        transactions: createTransactionsService(this.httpClient),
        // Other entity services...
      };
    }
    return this._entities;
  }

  /**
   * Access utility services
   */
  get utilities(): UtilityServices {
    if (!this._utilities) {
      this._utilities = {
        validation: createValidationService(),
        formatting: createFormattingService(),
        // Other utility services...
      };
    }
    return this._utilities;
  }

  /**
   * Update client configuration
   * @param config New configuration options
   */
  updateConfig(config: Partial<ClientConfig>): void {
    // Update configuration service
    ConfigService.configure({
      apiUrls: {
        onboardingUrl: config.onboardingUrl,
        transactionUrl: config.transactionUrl,
      },
      httpClient: {
        apiKey: config.apiKey,
        timeout: config.httpOptions?.timeout,
        keepAlive: config.httpOptions?.keepAlive,
      },
    });

    // Update HTTP client configuration
    this.httpClient.updateConfig({
      apiKey: config.apiKey,
      timeout: config.httpOptions?.timeout,
      keepAlive: config.httpOptions?.keepAlive,
    });
  }

  /**
   * Close the client and release resources
   */
  close(): void {
    this.httpClient.destroy();
  }
}
```

## Client Configuration

The client can be configured with various options:

```typescript
/**
 * Client configuration options
 */
interface ClientConfig {
  /** API key for authentication */
  apiKey?: string;

  /** Environment (production, sandbox, development) */
  environment?: 'production' | 'sandbox' | 'development';

  /** Custom onboarding URL */
  onboardingUrl?: string;

  /** Custom transaction URL */
  transactionUrl?: string;

  /** HTTP client options */
  httpOptions?: {
    /** Request timeout in milliseconds */
    timeout?: number;

    /** Keep-alive connections */
    keepAlive?: boolean;

    /** Maximum sockets per host */
    maxSockets?: number;

    /** Enable debug mode */
    debug?: boolean;
  };

  /** Observability options */
  observability?: {
    /** Enable tracing */
    enableTracing?: boolean;

    /** Enable metrics */
    enableMetrics?: boolean;

    /** Enable logging */
    enableLogging?: boolean;

    /** Service name */
    serviceName?: string;
  };
}
```

The client uses environment-specific defaults for certain settings:

```typescript
// Environment-specific defaults
const environmentDefaults = {
  production: {
    onboardingUrl: 'https://api.midaz.io/v1/onboarding',
    transactionUrl: 'https://api.midaz.io/v1/transaction',
    timeout: 10000,
  },
  sandbox: {
    onboardingUrl: 'https://api-sandbox.midaz.io/v1/onboarding',
    transactionUrl: 'https://api-sandbox.midaz.io/v1/transaction',
    timeout: 30000,
  },
  development: {
    onboardingUrl: 'http://localhost:3000',
    transactionUrl: 'http://localhost:3001',
    timeout: 60000,
  },
};
```

## Entity Services Organization

Entity services are organized into namespaces for discoverability:

```typescript
// Entity services container
interface EntityServices {
  /** Account management */
  accounts: AccountsService;

  /** Asset management */
  assets: AssetsService;

  /** Asset rates management */
  assetRates: AssetRatesService;

  /** Balance management */
  balances: BalancesService;

  /** Ledger management */
  ledgers: LedgersService;

  /** Operation management */
  operations: OperationsService;

  /** Organization management */
  organizations: OrganizationsService;

  /** Portfolio management */
  portfolios: PortfolioService;

  /** Segment management */
  segments: SegmentService;

  /** Transaction management */
  transactions: TransactionsService;
}
```

## Utility Services Organization

Utility services are organized into their own namespace:

```typescript
// Utility services container
interface UtilityServices {
  /** Validation utilities */
  validation: ValidationService;

  /** Formatting utilities */
  formatting: FormattingService;

  /** Data processing utilities */
  data: DataService;

  /** Account helper utilities */
  account: AccountHelperService;

  /** Caching utilities */
  cache: CacheService;

  /** Concurrency utilities */
  concurrency: ConcurrencyService;
}
```

## Resource Management

The client interface manages resources to ensure efficient usage and proper cleanup:

```typescript
// Creating a client with proper resource management
const client = createClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

try {
  // Use the client...
  const accounts = await client.entities.accounts.listAccounts('org_123', 'ledger_456');
} finally {
  // Always close the client when done
  client.close();
}
```

## Singleton vs Multiple Clients

The SDK supports both singleton and multiple client patterns:

```typescript
// Singleton pattern (reuse the same client)
const defaultClient = createClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

// Multiple clients pattern (different configurations)
const productionClient = createClient({
  apiKey: 'prod-api-key',
  environment: 'production',
});

const sandboxClient = createClient({
  apiKey: 'sandbox-api-key',
  environment: 'sandbox',
});
```

## Authentication Management

The client handles authentication through API keys:

```typescript
// Create client with API key
const client = createClient({
  apiKey: 'your-api-key',
});

// Update API key later
client.updateConfig({
  apiKey: 'new-api-key',
});
```

## API Version Management

The client supports multiple API versions:

```typescript
// Create client with specific API version
const client = createClient({
  apiKey: 'your-api-key',
  apiVersion: '2023-01-01',
});
```

## Builder Support

The client interface integrates with the builder pattern for creating complex objects:

```typescript
// Get a builder from the client
const assetBuilder = client.entities.assets
  .createBuilder('US Dollar', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' });

// Build and use in one operation
const asset = await client.entities.assets.createAsset(
  'org_123',
  'ledger_456',
  assetBuilder.build()
);
```

## Enhanced Recovery Support

The client supports enhanced recovery for operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

// Execute with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction('org_123', 'ledger_456', transaction),
  {
    maxRetries: 3,
  }
);
```

## Examples

### Basic Client Usage

```typescript
import { createClient } from 'midaz-sdk';

// Create a client
const client = createClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

// Use the client
async function processAccounts() {
  try {
    // List accounts
    const accountsResponse = await client.entities.accounts.listAccounts('org_123', 'ledger_456', {
      limit: 10,
    });

    console.log(`Found ${accountsResponse.items.length} accounts`);

    // Create a new account
    const newAccount = await client.entities.accounts.createAccount('org_123', 'ledger_456', {
      name: 'Savings Account',
      type: 'savings',
      assetCode: 'USD',
    });

    console.log(`Created account: ${newAccount.id}`);

    // Get an account by ID
    const account = await client.entities.accounts.getAccount(
      'org_123',
      'ledger_456',
      newAccount.id
    );

    console.log(`Retrieved account: ${account.name}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the client
    client.close();
  }
}

processAccounts();
```

### Advanced Client Configuration

```typescript
import { createClient } from 'midaz-sdk';
import { ConfigService } from 'midaz-sdk/util/config';

// Configure environment settings first
ConfigService.configure({
  apiUrls: {
    onboardingUrl: 'https://custom-api.example.com/v1/onboarding',
    transactionUrl: 'https://custom-api.example.com/v1/transaction',
  },
  observability: {
    enableTracing: true,
    serviceName: 'my-financial-service',
  },
  httpClient: {
    timeout: 15000,
    keepAlive: true,
    maxSockets: 20,
  },
});

// Create a client with minimal config (will use configured settings)
const client = createClient({
  apiKey: 'your-api-key',
});

// Use the client...
```

### Client Extension

The client interface can be extended for custom needs:

```typescript
import { createClient, Client } from 'midaz-sdk';

// Extend the client with custom functionality
class EnhancedClient {
  private client: Client;

  constructor(config) {
    this.client = createClient(config);
  }

  get entities() {
    return this.client.entities;
  }

  get utilities() {
    return this.client.utilities;
  }

  // Add custom methods
  async createAccountWithInitialBalance(
    orgId: string,
    ledgerId: string,
    accountData: CreateAccountInput,
    initialBalance: number
  ) {
    // Create the account
    const account = await this.client.entities.accounts.createAccount(orgId, ledgerId, accountData);

    // If initial balance is greater than zero, create a transaction
    if (initialBalance > 0) {
      await this.client.entities.transactions.createTransaction(orgId, ledgerId, {
        code: `initial-balance-${account.id}`,
        operations: [
          {
            accountId: account.id,
            assetCode: account.assetCode,
            amount: initialBalance,
            type: 'credit',
          },
        ],
      });
    }

    return account;
  }

  // Close the client
  close() {
    this.client.close();
  }
}

// Usage
const enhancedClient = new EnhancedClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

const account = await enhancedClient.createAccountWithInitialBalance(
  'org_123',
  'ledger_456',
  {
    name: 'Savings Account',
    type: 'savings',
    assetCode: 'USD',
  },
  1000 // Initial balance
);
```
