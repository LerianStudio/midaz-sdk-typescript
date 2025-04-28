# Key Design Patterns in Midaz SDK

This document outlines the key design patterns used in the Midaz SDK and provides examples of how they're implemented and used.

## Builder Pattern

The builder pattern is extensively used in the SDK to construct complex objects with a fluent interface.

### Implementation

```typescript
// Interface for a generic builder
export interface Builder<T, B extends Builder<T, B>> {
  build(): T;
}

// Asset builder interface
export interface AssetBuilder extends Builder<CreateAssetInput, AssetBuilder> {
  withName(name: string): AssetBuilder;
  withCode(code: string): AssetBuilder;
  withType(type: string): AssetBuilder;
  withMetadata(metadata: Record<string, any>): AssetBuilder;
}

// Implementation of the asset builder
class AssetBuilderImpl implements AssetBuilder {
  private model: CreateAssetInput;

  constructor(model: CreateAssetInput) {
    this.model = model;
  }

  withName(name: string): AssetBuilder {
    this.model.name = name;
    return this;
  }

  withCode(code: string): AssetBuilder {
    this.model.code = code;
    return this;
  }

  withType(type: string): AssetBuilder {
    this.model.type = type;
    return this;
  }

  withMetadata(metadata: Record<string, any>): AssetBuilder {
    this.model.metadata = metadata;
    return this;
  }

  build(): CreateAssetInput {
    return this.model;
  }
}

// Factory function to create a builder
export function createAssetBuilder(name: string, code: string): AssetBuilder {
  const model: CreateAssetInput = { name, code };
  return new AssetBuilderImpl(model);
}
```

### Usage

```typescript
// Create an asset using the builder
const assetInput = createAssetBuilder('USD Currency', 'USD')
  .withType('currency')
  .withMetadata({ precision: 2, symbol: '$' })
  .build();

// Use the asset input
const asset = await client.entities.assets.createAsset(
  organizationId,
  ledgerId,
  assetInput
);
```

## Facade Pattern

The `MidazClient` class implements the facade pattern, providing a simplified interface to the complex subsystem of services and API clients.

### Implementation

```typescript
export class MidazClient {
  public readonly entities: Entity;
  private readonly config: MidazConfig;
  private readonly httpClient: HttpClient;
  private readonly observability: Observability;

  constructor(configOrBuilder: MidazConfig | ClientConfigBuilder) {
    // Initialize components and services
    this.config = 'build' in configOrBuilder ? configOrBuilder.build() : configOrBuilder;
    this.observability = new Observability(this.config.observability);
    this.httpClient = this.config.httpClient || new HttpClient({ /* config */ });
    this.entities = new Entity(this.httpClient, this.config, this.observability);
  }

  public getObservability(): Observability {
    return this.observability;
  }
}
```

### Usage

```typescript
// Create a client
const client = new MidazClient(config);

// Use the facade to access subsystems
const assets = await client.entities.assets.listAssets(orgId, ledgerId);
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
const transactions = await client.entities.transactions.listTransactions(orgId, ledgerId);
```

## Factory Pattern

The SDK uses factory patterns to create instances with consistent configuration and dependencies.

### Implementation

```typescript
export class ApiFactory {
  private readonly httpClient: HttpClient;
  private readonly urlBuilder: UrlBuilder;
  private readonly observability: Observability;

  constructor(
    httpClient: HttpClient,
    config: MidazConfig,
    observability?: Observability
  ) {
    this.httpClient = httpClient;
    this.urlBuilder = new UrlBuilder(config);
    this.observability = observability || new Observability();
  }

  public createAssetApiClient(): AssetApiClient {
    return new HttpAssetApiClient(
      this.httpClient,
      this.urlBuilder,
      this.observability
    );
  }

  public createAccountApiClient(): AccountApiClient {
    return new HttpAccountApiClient(
      this.httpClient,
      this.urlBuilder,
      this.observability
    );
  }

  // Other factory methods...
}
```

### Usage

```typescript
// Inside the entity layer
this.apiFactory = new ApiFactory(httpClient, config, observability);
this.assetApiClient = this.apiFactory.createAssetApiClient();
this.accountApiClient = this.apiFactory.createAccountApiClient();
```

## Adapter Pattern

API client implementations adapt between the service layer and the HTTP communication layer, abstracting the details of HTTP requests.

### Implementation

```typescript
// API client interface
export interface AssetApiClient {
  listAssets(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Asset>>;
  
  getAsset(
    orgId: string,
    ledgerId: string,
    assetId: string
  ): Promise<Asset>;
  
  createAsset(
    orgId: string,
    ledgerId: string,
    input: CreateAssetInput
  ): Promise<Asset>;
  
  // Other methods...
}

// HTTP implementation (adapter)
export class HttpAssetApiClient implements AssetApiClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly urlBuilder: UrlBuilder,
    private readonly observability?: Observability
  ) {}

  public async listAssets(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Asset>> {
    const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId);
    return this.httpClient.get<ListResponse<Asset>>(url, { params: options });
  }

  public async getAsset(
    orgId: string,
    ledgerId: string,
    assetId: string
  ): Promise<Asset> {
    const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId, assetId);
    return this.httpClient.get<Asset>(url);
  }

  public async createAsset(
    orgId: string,
    ledgerId: string,
    input: CreateAssetInput
  ): Promise<Asset> {
    const url = this.urlBuilder.buildAssetUrl(orgId, ledgerId);
    return this.httpClient.post<Asset>(url, input);
  }

  // Other methods...
}
```

### Usage

```typescript
// In the service implementation
export class AssetsServiceImpl implements AssetsService {
  constructor(
    private readonly apiClient: AssetApiClient,
    private readonly observability?: Observability
  ) {}

  public async listAssets(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Asset>> {
    // Use the adapter
    return this.apiClient.listAssets(orgId, ledgerId, options);
  }

  // Other methods...
}
```

## Command Pattern

The transaction processing implements aspects of the command pattern, especially in batch operations where transactions are treated as commands to be executed.

### Implementation

```typescript
// Transaction batch builder
export interface BatchBuilder extends Builder<BatchInput, BatchBuilder> {
  withTransactions(transactions: TransactionInput[]): BatchBuilder;
  withMetadata(metadata: Record<string, any>): BatchBuilder;
}

// Batch executor
export async function executeBatch(
  client: MidazClient,
  batch: BatchInput
): Promise<BatchResult> {
  return client.entities.transactions.createBatchTransactions(
    batch.organizationId,
    batch.ledgerId,
    batch
  );
}
```

### Usage

```typescript
// Create transaction commands
const deposit = createTransactionBuilder()
  .withEntries([/* deposit entries */])
  .build();

const transfer = createTransactionBuilder()
  .withEntries([/* transfer entries */])
  .build();

// Create a batch of commands
const batch = createBatchBuilder()
  .withTransactions([deposit, transfer])
  .withMetadata({ batchReference: 'batch-123' })
  .build();

// Execute the batch of commands
const result = await executeBatch(client, batch);
```

## Observer Pattern

The observability utilities implement aspects of the observer pattern, allowing subscribers to be notified of events.

### Implementation

```typescript
export class Observability {
  private tracer: Tracer;
  private metrics: Metrics;
  private logger: Logger;
  private subscribers: EventSubscriber[] = [];

  // Add a subscriber for events
  public subscribe(subscriber: EventSubscriber): void {
    this.subscribers.push(subscriber);
  }

  // Notify subscribers of an event
  private notifySubscribers(event: ObservabilityEvent): void {
    this.subscribers.forEach(subscriber => {
      subscriber.onEvent(event);
    });
  }

  // Record a metric and notify subscribers
  public recordMetric(name: string, value: number, attributes?: Record<string, any>): void {
    this.metrics.record(name, value, attributes);
    
    this.notifySubscribers({
      type: 'metric',
      name,
      value,
      attributes
    });
  }

  // Other methods...
}
```

### Usage

```typescript
// Subscribe to observability events
const metricsCollector = new MetricsCollector();
observability.subscribe(metricsCollector);

// Record a metric (subscribers will be notified)
observability.recordMetric('transaction.amount', 1000, {
  transactionId: 'tx-123',
  assetId: 'asset-123'
});
```

## Strategy Pattern

The SDK's error handling uses the strategy pattern to implement different recovery strategies.

### Implementation

```typescript
// Recovery strategy interface
export interface RecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(operation: () => Promise<any>, error: Error): Promise<any>;
}

// Retry strategy
export class RetryStrategy implements RecoveryStrategy {
  constructor(
    private readonly retries: number,
    private readonly retryDelay: number,
    private readonly exponentialBackoff: boolean
  ) {}

  public canRecover(error: Error): boolean {
    return isRetryableError(error);
  }

  public async recover(
    operation: () => Promise<any>,
    error: Error
  ): Promise<any> {
    let lastError = error;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        // Calculate delay with exponential backoff if enabled
        const delay = this.exponentialBackoff
          ? this.retryDelay * Math.pow(2, attempt - 1)
          : this.retryDelay;
          
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the operation
        return await operation();
      } catch (err) {
        lastError = err;
      }
    }
    
    throw lastError;
  }
}

// Fallback strategy
export class FallbackStrategy implements RecoveryStrategy {
  constructor(
    private readonly fallback: () => Promise<any>
  ) {}

  public canRecover(): boolean {
    return true;
  }

  public async recover(): Promise<any> {
    return this.fallback();
  }
}
```

### Usage

```typescript
// Create recovery strategies
const retryStrategy = new RetryStrategy(3, 500, true);
const fallbackStrategy = new FallbackStrategy(alternativeOperation);

// Use strategies in enhanced recovery
const result = await withEnhancedRecovery(
  operation,
  {
    strategies: [retryStrategy, fallbackStrategy]
  }
);
```

## Template Method Pattern

Service implementations use aspects of the template method pattern to define a skeleton algorithm for common operations.

### Implementation

```typescript
// Base service class with template methods
export abstract class BaseService<T> {
  protected abstract resourceName: string;
  
  constructor(
    protected readonly apiClient: ApiClient,
    protected readonly observability?: Observability
  ) {}
  
  // Template method for creating a resource
  protected async createResource(
    input: any,
    context: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(`create${this.resourceName}`, context);
    
    try {
      // This step is customized by subclasses
      const result = await this.doCreateResource(input, context);
      
      this.recordMetric(`${this.resourceName.toLowerCase()}.create`, 1, context);
      span.setStatus('ok');
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus('error', error.message);
      throw error;
    } finally {
      span.end();
    }
  }
  
  // Abstract method to be implemented by subclasses
  protected abstract doCreateResource(
    input: any,
    context: Record<string, any>
  ): Promise<T>;
  
  // Other template methods...
}

// Concrete implementation
export class AssetsServiceImpl extends BaseService<Asset> implements AssetsService {
  protected resourceName = 'Asset';
  
  constructor(
    private readonly assetApiClient: AssetApiClient,
    observability?: Observability
  ) {
    super(assetApiClient, observability);
  }
  
  // Implementation of the abstract method
  protected async doCreateResource(
    input: CreateAssetInput,
    context: { orgId: string; ledgerId: string }
  ): Promise<Asset> {
    return this.assetApiClient.createAsset(
      context.orgId,
      context.ledgerId,
      input
    );
  }
  
  // Public method that uses the template method
  public async createAsset(
    orgId: string,
    ledgerId: string,
    input: CreateAssetInput
  ): Promise<Asset> {
    return this.createResource(input, { orgId, ledgerId });
  }
  
  // Other methods...
}
```

### Usage

```typescript
// Client code just calls the public method
const asset = await assetsService.createAsset(orgId, ledgerId, assetInput);
```

## Combining Design Patterns

The Midaz SDK combines multiple design patterns to create a cohesive architecture:

1. **Builder → Factory**: Builders create models that are passed to factory-created services
2. **Facade → Adapter**: The client facade delegates to adapters for API communication
3. **Strategy → Command**: Recovery strategies are applied to transaction commands
4. **Observer → Template**: Observability observers are notified during template method execution

This combination of patterns creates a flexible, maintainable, and extensible architecture for financial operations.

## Best Practices

When working with the Midaz SDK, keep these design pattern best practices in mind:

1. **Always use builders** for creating complex inputs to ensure proper validation
2. **Access services through the client facade** for consistent configuration
3. **Apply enhanced recovery** to critical operations using appropriate strategies
4. **Leverage observability** throughout your application for monitoring and debugging
5. **Use batch commands** for related transactions to ensure atomic execution
6. **Extend base classes** when creating custom implementations to ensure consistent behavior
