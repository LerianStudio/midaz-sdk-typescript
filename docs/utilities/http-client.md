# HTTP Client

The Midaz SDK provides a robust HTTP client for communication with the Midaz API. This document explains how to use and configure the HTTP client for optimal performance and reliability.

## Overview

The `HttpClient` class encapsulates HTTP communication details and provides features like:

- Automatic retry for transient failures
- Request/response logging
- Error handling and categorization
- Authentication
- Observability integration

## Basic Usage

The HTTP client is typically used internally by the SDK's services, but you can access it directly if needed:

```typescript
// Access the HTTP client from the MidazClient instance
const httpClient = client.getHttpClient();

// Make a GET request
const response = await httpClient.get<AssetResponse>(
  'https://api.midaz.io/v1/organizations/org123/assets/asset456'
);

// Make a POST request
const createdAsset = await httpClient.post<AssetResponse>(
  'https://api.midaz.io/v1/organizations/org123/assets',
  { name: 'USD', code: 'USD', type: 'currency' }
);
```

## Base URL

The HTTP client's base URL comes from the SDK configuration. Midaz serves every service from a
single ledger host, so `baseUrls.ledger` is the only key you need:

```typescript
import { MidazClient, createClientConfigBuilder } from 'midaz-sdk';

const client = new MidazClient(
  createClientConfigBuilder().withBaseUrls({ ledger: 'http://localhost:3002' })
);
```

`MIDAZ_LEDGER_URL` sets the same value from the environment.

The deprecated `onboarding` and `transaction` keys are still accepted for configurations written
against earlier releases. When present, each one wins for its own service family and `ledger`
covers the rest, so they can be removed one at a time.

## Configuration

When initializing the SDK, you can configure the HTTP client behavior:

```typescript
import { MidazClient, createClientConfigWithAccessManager } from 'midaz-sdk';

const client = new MidazClient(
  createClientConfigWithAccessManager({
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  })
    .withEnvironment('sandbox')
    .withHttpClientConfig({
      baseUrl: 'https://api.custom-domain.com/v1',
      timeout: 10000,
      retries: 3,
      retryDelay: 500,
      exponentialBackoff: true,
      headers: {
        'Custom-Header': 'custom-value',
      },
    })
);
```

## Available Methods

The HTTP client provides the following methods:

```typescript
// GET request
httpClient.get<T>(url, config?): Promise<T>

// POST request
httpClient.post<T>(url, data?, config?): Promise<T>

// PUT request
httpClient.put<T>(url, data?, config?): Promise<T>

// PATCH request
httpClient.patch<T>(url, data?, config?): Promise<T>

// DELETE request
httpClient.delete<T>(url, config?): Promise<T>
```

## Error Handling

The HTTP client automatically categorizes errors based on their HTTP status codes:

```typescript
try {
  const response = await httpClient.get('/some-resource');
} catch (error) {
  if (error.isNetworkError) {
    // Handle network connectivity issues
  } else if (error.status === 404) {
    // Handle not found
  } else if (error.status === 401 || error.status === 403) {
    // Handle authentication/authorization issues
  } else if (error.status >= 500) {
    // Handle server errors
  }
}
```

## Retry Configuration

The HTTP client can automatically retry failed requests:

```typescript
const httpClient = new HttpClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  retries: 3, // Number of retry attempts
  retryDelay: 500, // Base delay in milliseconds
  exponentialBackoff: true, // Use exponential backoff
  retryableStatusCodes: [
    429, // Too Many Requests
    500,
    502,
    503,
    504, // Server errors
  ],
  retryableNetworkErrors: true, // Retry on network errors
});
```

## Custom Headers

You can set custom headers for all requests:

```typescript
const httpClient = new HttpClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  headers: {
    'Custom-Header': 'value',
  },
});
```

Or for individual requests:

```typescript
const response = await httpClient.post(url, data, {
  headers: {
    'X-Custom-Value': 'some-value',
  },
});
```

> Do not set `X-Idempotency` as a client-level default header. A single key reused
> across every request would make the server treat unrelated transactions as
> duplicates. Pass it per request instead — see below.

## Observability Integration

The HTTP client integrates with the SDK's observability system:

```typescript
// The HttpClient automatically creates spans for requests
const httpClient = new HttpClient({
  accessManager: {
    enabled: true,
    address: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
  observability: observabilityInstance,
});

// The span will include:
// - HTTP method
// - URL (sanitized)
// - Status code
// - Error information (if applicable)
// - Response time
```

## Best Practices

1. **Idempotency on Transaction Creation**

   The only header Midaz reads for idempotency is `X-Idempotency`, and it only applies
   to transaction creation. There are two ways to use it:

   **Let the server deduplicate (default).** If you send no `X-Idempotency` header, the
   server derives a deduplication key from the SHA-256 hash of the request body. Two
   identical bodies are treated as the same transaction. The SDK does not generate a key
   for you.

   ```typescript
   // No idempotency header sent — server deduplicates by request body hash
   const response = await httpClient.post('/transactions', transactionData);
   ```

   **Supply your own key.** Pass an explicit key when you need control over the
   deduplication boundary — which attempts count as the same operation. It does not
   change how long the server retains the key. Use it to retry a transaction whose body
   legitimately changed, or to deduplicate across bodies that differ only in a timestamp.

   ```typescript
   const response = await httpClient.post('/transactions', transactionData, {
     headers: {
       'X-Idempotency': `tx-${uuidv4()}`,
     },
   });
   ```

   Generate the key once per logical operation and reuse it across retries of that
   operation. A key generated inside a retry loop defeats the purpose.

2. **Configure Appropriate Timeouts**

   Set reasonable timeouts based on expected operation duration:

   ```typescript
   // For quick operations
   const quickConfig = { timeout: 5000 };

   // For operations that might take longer
   const longRunningConfig = { timeout: 30000 };
   ```

3. **Handle Rate Limiting**

   Implement backoff when encountering rate limits:

   ```typescript
   try {
     return await httpClient.get(url);
   } catch (error) {
     if (error.status === 429) {
       const retryAfter = error.headers['retry-after'] || 1;
       await sleep(retryAfter * 1000);
       return httpClient.get(url);
     }
     throw error;
   }
   ```

4. **Use Enhanced Recovery for Critical Operations**

   Combine the HTTP client with enhanced recovery for critical operations:

   ```typescript
   import { withEnhancedRecovery } from 'midaz-sdk/util';

   const result = await withEnhancedRecovery(() => httpClient.post('/critical-endpoint', data), {
     retries: 5,
     exponentialBackoff: true,
   });
   ```
