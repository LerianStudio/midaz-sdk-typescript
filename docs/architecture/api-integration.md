# API Integration

This document explains how the Midaz SDK integrates with the Midaz API, including URL construction, authentication, versioning, and handling of API responses.

## Overview

The Midaz SDK communicates with the Midaz API through a well-defined architecture that abstracts the complexities of HTTP communication. The integration consists of several key components:

1. **URL Builder**: Constructs appropriate URLs for different API endpoints
2. **HTTP Client**: Manages HTTP communication with error handling and retries
3. **API Clients**: Implement service-specific API interfaces
4. **Authentication**: Manages API keys and authentication headers
5. **Response Processing**: Transforms API responses into model instances

## URL Construction

The SDK uses a `UrlBuilder` to generate the appropriate URLs for different API endpoints based on the configured environment:

```typescript
export class UrlBuilder {
  private readonly baseUrl: string;
  
  constructor(config: MidazConfig) {
    this.baseUrl = config.baseUrl || this.getEnvironmentUrl(config.environment);
  }
  
  private getEnvironmentUrl(environment: Environment): string {
    switch (environment) {
      case 'development':
        return 'https://dev-api.midaz.io';
      case 'sandbox':
        return 'https://sandbox-api.midaz.io';
      case 'production':
        return 'https://api.midaz.io';
      default:
        return 'https://sandbox-api.midaz.io';
    }
  }
  
  public buildAssetUrl(orgId: string, ledgerId: string, assetId?: string): string {
    const base = `${this.baseUrl}/v1/organizations/${orgId}/ledgers/${ledgerId}/assets`;
    return assetId ? `${base}/${assetId}` : base;
  }
  
  public buildAccountUrl(orgId: string, accountId?: string): string {
    const base = `${this.baseUrl}/v1/organizations/${orgId}/accounts`;
    return accountId ? `${base}/${accountId}` : base;
  }
  
  public buildTransactionUrl(orgId: string, ledgerId: string, transactionId?: string): string {
    const base = `${this.baseUrl}/v1/organizations/${orgId}/ledgers/${ledgerId}/transactions`;
    return transactionId ? `${base}/${transactionId}` : base;
  }
  
  // Other URL building methods...
}
```

## Authentication

The SDK includes authentication information in API requests through HTTP headers:

```typescript
// In the HttpClient class
private setupRequestInterceptors(): void {
  this.axiosInstance.interceptors.request.use((config) => {
    // Add API key to all requests
    if (this.options.apiKey) {
      config.headers['Api-Key'] = this.options.apiKey;
    }
    
    // Add other default headers
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    
    return config;
  });
}
```

## API Versioning

The SDK handles API versioning through the URL path and optional version headers:

```typescript
// In the UrlBuilder class
private readonly apiVersion: string;

constructor(config: MidazConfig) {
  this.baseUrl = config.baseUrl || this.getEnvironmentUrl(config.environment);
  this.apiVersion = config.apiVersion || 'v1';
}

public buildAssetUrl(orgId: string, ledgerId: string, assetId?: string): string {
  const base = `${this.baseUrl}/${this.apiVersion}/organizations/${orgId}/ledgers/${ledgerId}/assets`;
  return assetId ? `${base}/${assetId}` : base;
}

// In the HttpClient class
private setupRequestInterceptors(): void {
  this.axiosInstance.interceptors.request.use((config) => {
    // Add version header if specified
    if (this.options.apiVersion) {
      config.headers['Api-Version'] = this.options.apiVersion;
    }
    
    // Other headers...
    return config;
  });
}
```

## API Client Implementation

Each API client implements a specific interface for a particular resource type:

```typescript
// Asset API client interface
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
  
  updateAsset(
    orgId: string,
    ledgerId: string,
    assetId: string,
    input: UpdateAssetInput
  ): Promise<Asset>;
  
  // Other methods...
}

// HTTP implementation
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
    const span = this.observability?.startSpan('HttpAssetApiClient.listAssets');
    
    try {
      span?.setAttribute('orgId', orgId);
      span?.setAttribute('ledgerId', ledgerId);
      
      const response = await this.httpClient.get<ListResponse<Asset>>(
        url, 
        { params: options }
      );
      
      span?.setStatus('ok');
      return response;
    } catch (error) {
      span?.recordException(error);
      span?.setStatus('error', error.message);
      throw error;
    } finally {
      span?.end();
    }
  }
  
  // Other methods...
}
```

## Response Processing

The HTTP client processes API responses, handling errors and transforming data:

```typescript
// In the HttpClient class
public async get<T>(url: string, options?: RequestOptions): Promise<T> {
  try {
    const response = await this.axiosInstance.get<T>(url, options);
    return response.data;
  } catch (error) {
    throw this.processError(error);
  }
}

private processError(error: any): Error {
  if (axios.isAxiosError(error)) {
    // Transform Axios error to SDK error
    const sdkError = new SdkError(
      this.getErrorCode(error),
      this.getErrorMessage(error),
      error.response?.status
    );
    
    // Add additional context
    sdkError.details = error.response?.data;
    sdkError.retryable = this.isRetryableError(error);
    
    return sdkError;
  }
  
  // Return original error if not an Axios error
  return error;
}

private getErrorCode(error: AxiosError): string {
  // Map HTTP status codes to error codes
  if (!error.response) {
    return 'NETWORK_ERROR';
  }
  
  const status = error.response.status;
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
  }
}
```

## Pagination

The API clients handle pagination for list operations:

```typescript
// In the HttpAssetApiClient class
public async listAssetsWithAutoPagination(
  orgId: string,
  ledgerId: string,
  options?: ListOptions
): Promise<Asset[]> {
  const allAssets: Asset[] = [];
  let currentOffset = options?.offset || 0;
  const limit = options?.limit || 50;
  let hasMore = true;
  
  while (hasMore) {
    const response = await this.listAssets(orgId, ledgerId, {
      ...options,
      offset: currentOffset,
      limit
    });
    
    allAssets.push(...response.data);
    currentOffset += limit;
    hasMore = response.data.length === limit;
  }
  
  return allAssets;
}
```

## Rate Limiting

The SDK handles API rate limits through exponential backoff and retry logic:

```typescript
// In the HttpClient class
private async executeWithRetry<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  let attempt = 0;
  let lastError: Error;
  
  while (attempt < this.options.retries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Check if the error is retryable
      if (!this.isRetryableError(error)) {
        throw error;
      }
      
      // If this is a rate limit error, use the retry-after header if available
      let delayMs = this.options.retryDelay;
      if (error.httpStatus === 429 && error.details?.retryAfter) {
        delayMs = error.details.retryAfter * 1000;
      } else if (this.options.exponentialBackoff) {
        delayMs = this.options.retryDelay * Math.pow(2, attempt);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempt++;
    }
  }
  
  throw lastError;
}

private isRetryableError(error: any): boolean {
  // Network errors are always retryable
  if (!error.httpStatus) {
    return true;
  }
  
  // Check if the status code is in the retryable list
  const status = error.httpStatus;
  return this.options.retryableStatusCodes.includes(status);
}
```

## Idempotency

For non-idempotent operations like POST requests, the SDK supports idempotency keys:

```typescript
// In the HttpTransactionApiClient class
public async createTransaction(
  orgId: string,
  ledgerId: string,
  input: TransactionInput,
  options?: RequestOptions
): Promise<Transaction> {
  const url = this.urlBuilder.buildTransactionUrl(orgId, ledgerId);
  
  // Generate an idempotency key if not provided
  const idempotencyKey = options?.headers?.['Idempotency-Key'] || 
    `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestOptions = {
    ...options,
    headers: {
      ...options?.headers,
      'Idempotency-Key': idempotencyKey
    }
  };
  
  return this.httpClient.post<Transaction>(url, input, requestOptions);
}
```

## Webhook Verification

The SDK provides utilities for verifying webhooks from the Midaz API:

```typescript
import { createHmac } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return signature === expectedSignature;
}

// Usage
function handleWebhook(
  body: string,
  signature: string,
  webhookSecret: string
): void {
  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    throw new Error('Invalid webhook signature');
  }
  
  // Process webhook
  const event = JSON.parse(body);
  console.log(`Received webhook event: ${event.type}`);
  
  // Handle different event types
  switch (event.type) {
    case 'transaction.created':
      // Handle transaction created event
      break;
    case 'account.updated':
      // Handle account updated event
      break;
    // Other event types...
  }
}
```

## API Integration Best Practices

1. **Use Environment-Specific URLs**: Always use the appropriate environment URL for your development stage (development, sandbox, production).

2. **Handle Pagination**: Use the pagination utilities to efficiently process large result sets.

3. **Implement Retry Logic**: Configure appropriate retry policies for your application to handle transient failures.

4. **Add Idempotency Keys**: Always use idempotency keys for non-idempotent operations to prevent duplicates.

5. **Verify Webhooks**: Always verify webhook signatures to ensure they are legitimate.

6. **Monitor Rate Limits**: Keep track of rate limit headers to avoid being throttled.

7. **Handle API Versions**: Specify the API version in your configuration to ensure compatibility.

## Example: Comprehensive API Integration

```typescript
import { 
  MidazClient, 
  createClientConfig,
  createAssetBuilder,
  withEnhancedRecovery
} from 'midaz-sdk';

async function integrationExample() {
  // Initialize client with API integration options
  const client = new MidazClient(
    createClientConfig()
      .withApiKey('your-api-key')
      .withEnvironment('sandbox')
      .withApiVersion('v1')
      .withRetryOptions({
        maxRetries: 3,
        retryDelay: 500,
        exponentialBackoff: true,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      })
      .withTimeout(15000)
      .withHttpOptions({
        headers: {
          'Application-Name': 'My Financial App',
          'Application-Version': '1.0.0'
        }
      })
      .build()
  );
  
  // Create an asset with enhanced recovery and idempotency
  const assetInput = createAssetBuilder('Euro', 'EUR')
    .withType('currency')
    .withMetadata({ precision: 2, symbol: '€' })
    .build();
  
  const idempotencyKey = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const result = await withEnhancedRecovery(
    () => client.entities.assets.createAsset(
      orgId,
      ledgerId,
      assetInput,
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    )
  );
  
  if (result.success) {
    console.log(`Asset created: ${result.data.id}`);
    
    // Get the created asset to verify
    const asset = await client.entities.assets.getAsset(
      orgId,
      ledgerId,
      result.data.id
    );
    
    console.log(`Verified asset: ${asset.name} (${asset.code})`);
  } else {
    console.error(`Failed to create asset: ${result.error.message}`);
    
    if (result.error.httpStatus === 429) {
      console.log('Rate limit exceeded, try again later');
    }
  }
}
```
