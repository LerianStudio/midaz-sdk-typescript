# HTTP Client Utility

The HTTP Client utility in the Midaz SDK provides a robust and consistent way to make HTTP requests to the Midaz API, with built-in error handling, retries, and observability integration.

## Overview

The HTTP client wraps the underlying Axios library and adds the following features:

1. **Automatic Retries**: Retry failed requests with configurable backoff strategies
2. **Error Standardization**: Convert HTTP errors into consistent SDK error objects
3. **Request/Response Interceptors**: Add logging, authentication, and other cross-cutting concerns
4. **Observability Integration**: Automatic tracing and metrics for all HTTP requests
5. **Request Cancellation**: Support for cancelling in-flight requests

## Basic Usage

The HTTP client is usually instantiated by the SDK automatically, but you can also create and configure it directly:

```typescript
import { HttpClient } from 'midaz-sdk/util/network';

const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io',
  timeout: 10000,
  headers: {
    'Api-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  retries: 3,
  retryDelay: 500
});

// Make GET request
const response = await httpClient.get('/resources/123');

// Make POST request
const result = await httpClient.post('/resources', { name: 'New Resource' });

// Make PUT request
const updated = await httpClient.put('/resources/123', { name: 'Updated Resource' });

// Make DELETE request
await httpClient.delete('/resources/123');
```

## Configuration Options

The HTTP client accepts the following configuration options:

```typescript
interface HttpClientOptions {
  // Base URL for all requests
  baseUrl?: string;
  
  // Default request timeout in milliseconds
  timeout?: number;
  
  // Default headers to include with every request
  headers?: Record<string, string>;
  
  // Number of times to retry failed requests
  retries?: number;
  
  // Base delay between retries in milliseconds
  retryDelay?: number;
  
  // Whether to use exponential backoff for retries
  exponentialBackoff?: boolean;
  
  // HTTP status codes that should trigger retries
  retryableStatusCodes?: number[];
  
  // Observability instance for tracing and metrics
  observability?: Observability;
}
```

## Making Requests with Options

You can provide additional options for individual requests:

```typescript
// GET request with query parameters
const users = await httpClient.get('/users', { 
  params: { 
    limit: 10, 
    offset: 0 
  }
});

// POST request with specific headers
const resource = await httpClient.post('/resources', 
  { name: 'New Resource' },
  { 
    headers: { 
      'Idempotency-Key': 'unique-key-123' 
    } 
  }
);

// Request with custom timeout
const result = await httpClient.get('/slow-resource', { 
  timeout: 30000 
});

// Request with signal for cancellation
const controller = new AbortController();
const resource = await httpClient.get('/resources/123', { 
  signal: controller.signal 
});

// Cancel the request
controller.abort();
```

## Error Handling

The HTTP client converts Axios errors into standardized SDK error objects:

```typescript
try {
  const resource = await httpClient.get('/resources/123');
} catch (error) {
  console.error(`Error code: ${error.code}`);
  console.error(`HTTP status: ${error.httpStatus}`);
  console.error(`Message: ${error.message}`);
  console.error(`Details: ${JSON.stringify(error.details)}`);
  
  // Handle specific error types
  if (error.httpStatus === 404) {
    console.log('Resource not found');
  } else if (error.httpStatus === 429) {
    console.log('Rate limit exceeded');
  }
}
```

## Automatic Retries

The HTTP client automatically retries failed requests based on the configured retry policy:

```typescript
// Configure with retry options
const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io',
  retries: 3,                    // Number of retry attempts
  retryDelay: 500,               // Base delay in milliseconds
  exponentialBackoff: true,      // Use exponential backoff
  retryableStatusCodes: [
    429,                         // Too many requests
    500, 502, 503, 504           // Server errors
  ]
});

// The client will automatically retry failed requests
try {
  const result = await httpClient.get('/occasionally-failing-endpoint');
} catch (error) {
  // This error will only be thrown after all retry attempts have failed
  console.error(`Failed after ${error.retryAttempts} retry attempts`);
}
```

## Interceptors

You can add request and response interceptors to the HTTP client:

```typescript
// Add request interceptor
httpClient.addRequestInterceptor((config) => {
  // Add timestamp to all requests
  config.headers['Request-Time'] = Date.now().toString();
  
  // Log outgoing requests
  console.log(`Making ${config.method} request to ${config.url}`);
  
  return config;
});

// Add response interceptor
httpClient.addResponseInterceptor(
  // Success handler
  (response) => {
    // Process successful response
    console.log(`Received response with status ${response.status}`);
    return response;
  },
  // Error handler
  (error) => {
    // Process error response
    console.error(`Request failed with status ${error.response?.status}`);
    return Promise.reject(error);
  }
);
```

## Integration with Observability

The HTTP client integrates with the SDK's observability utilities for tracing and metrics:

```typescript
import { Observability } from 'midaz-sdk/util/observability';
import { HttpClient } from 'midaz-sdk/util/network';

// Create observability instance
const observability = new Observability({
  serviceName: 'my-financial-app'
});

// Create HTTP client with observability
const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io',
  observability: observability
});

// Make a request (automatically traced)
const result = await httpClient.get('/resources/123');

// The request will:
// 1. Create a span for the HTTP request
// 2. Add attributes for URL, method, status code
// 3. Record metrics for request duration and result
// 4. Record error information if the request fails
```

## Combining with Enhanced Recovery

For critical operations, you can combine the HTTP client with the enhanced recovery utility:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';
import { HttpClient } from 'midaz-sdk/util/network';

const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io'
});

// Make a request with enhanced recovery
const result = await withEnhancedRecovery(
  () => httpClient.post('/critical-endpoint', criticalData),
  {
    retries: 5,
    exponentialBackoff: true,
    verification: async (response) => {
      // Verify the response
      return response && response.data && response.data.status === 'success';
    }
  }
);

if (result.success) {
  console.log('Request succeeded:', result.data);
} else {
  console.error('Request failed:', result.error);
}
```

## Best Practices

### Request Timeouts

Set appropriate timeouts based on the expected response time:

```typescript
// Global timeout for all requests
const httpClient = new HttpClient({
  baseUrl: 'https://api.midaz.io',
  timeout: 10000  // 10 seconds
});

// Custom timeout for a specific long-running request
const result = await httpClient.get('/long-running-operation', {
  timeout: 60000  // 1 minute
});
```

### Idempotency

For non-idempotent operations like POST requests, use idempotency keys:

```typescript
// Generate a unique idempotency key
const idempotencyKey = `idempotent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Make a POST request with the idempotency key
const result = await httpClient.post('/transactions', 
  transactionData,
  {
    headers: {
      'Idempotency-Key': idempotencyKey
    }
  }
);
```

### Cancellation

For long-running requests that might need cancellation:

```typescript
// Create an abort controller
const controller = new AbortController();

// Start a long-running request
const requestPromise = httpClient.get('/long-running-operation', {
  signal: controller.signal
});

// Set up a timeout to cancel the request after 30 seconds
const timeoutId = setTimeout(() => {
  console.log('Request taking too long, cancelling...');
  controller.abort();
}, 30000);

try {
  const result = await requestPromise;
  clearTimeout(timeoutId);
  console.log('Request completed successfully');
  return result;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError' || error.code === 'CANCELLED') {
    console.log('Request was cancelled');
  } else {
    console.error('Request failed with error:', error);
  }
  throw error;
}
```

### Batch Requests

For making multiple requests efficiently:

```typescript
// Sequential requests (when order matters)
async function fetchSequentially(ids) {
  const results = [];
  for (const id of ids) {
    const result = await httpClient.get(`/resources/${id}`);
    results.push(result);
  }
  return results;
}

// Parallel requests (when order doesn't matter)
async function fetchInParallel(ids) {
  const promises = ids.map(id => httpClient.get(`/resources/${id}`));
  return Promise.all(promises);
}

// Controlled concurrency (limit to 5 concurrent requests)
async function fetchWithConcurrency(ids, concurrency = 5) {
  const results = [];
  const chunks = [];
  
  // Split into chunks
  for (let i = 0; i < ids.length; i += concurrency) {
    chunks.push(ids.slice(i, i + concurrency));
  }
  
  // Process chunks sequentially, but requests within a chunk in parallel
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(id => httpClient.get(`/resources/${id}`))
    );
    results.push(...chunkResults);
  }
  
  return results;
}
```
