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
    'Idempotency-Key': 'unique-key-123',
  },
});
```

Or for individual requests:

```typescript
const response = await httpClient.post(url, data, {
  headers: {
    'Idempotency-Key': 'unique-key-456',
  },
});
```

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

1. **Use Idempotency Keys for Mutations**

   Always include idempotency keys for non-idempotent operations:

   ```typescript
   const response = await httpClient.post('/transactions', transactionData, {
     headers: {
       'Idempotency-Key': `tx-${uuidv4()}`,
     },
   });
   ```

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
