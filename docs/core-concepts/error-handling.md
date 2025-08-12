# Error Handling in Midaz SDK

The Midaz SDK implements sophisticated error handling with recovery mechanisms to ensure resilient applications. This document outlines the error handling strategies available in the SDK.

## Basic Error Handling

The SDK provides standardized error handling throughout its operations. Errors are caught, logged, and categorized by type:

```typescript
try {
  const asset = await client.entities.assets.getAsset(orgId, ledgerId, assetId);
  // Process asset...
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    // Handle not found case
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network issue
  } else {
    // Handle other errors
  }
}
```

## Error Classification

Errors in the SDK are classified into different types:

- **Network Errors**: Communication issues with the API
- **Validation Errors**: Input data doesn't meet requirements
- **Authentication Errors**: API key or credentials are invalid
- **Authorization Errors**: Insufficient permissions for the operation
- **Not Found Errors**: Requested resource doesn't exist
- **Rate Limit Errors**: API rate limits have been exceeded
- **Server Errors**: Backend server issues
- **Client Errors**: Issues in the SDK client

## Enhanced Recovery

The SDK provides an enhanced recovery mechanism through the `withEnhancedRecovery` function, which replaces the deprecated `executeWithEnhancedRecovery` function:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    retries: 3, // Number of retry attempts
    retryDelay: 500, // Base delay between retries (ms)
    exponentialBackoff: true, // Whether to use exponential backoff
    fallback: async () => {
      // Optional fallback operation
      return alternativeOperation();
    },
    verification: async (result) => {
      // Optional verification function
      return result && result.id ? true : false;
    },
  }
);

if (result.success) {
  // Operation completed successfully
  const data = result.data;
  console.log(`Operation succeeded with ID: ${data.id}`);
} else {
  // Operation failed even after recovery attempts
  console.error(`Error: ${result.error.message}`);

  if (result.attemptedRecovery) {
    console.log(`Recovery was attempted ${result.recoveryAttempts} times`);
  }
}
```

## Retry Policies

The SDK supports configurable retry policies for transient errors:

```typescript
// Configure retry behavior in HTTP client
const httpClient = new HttpClient({
  retries: 3,
  retryDelay: 500,
  exponentialBackoff: true,
  retryableStatusCodes: [429, 500, 502, 503, 504],
});
```

## Circuit Breaking

For high-load scenarios, the SDK includes circuit breaking capabilities to prevent cascading failures:

```typescript
// Create a circuit breaker
const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5, // Number of failures before opening circuit
  resetTimeout: 30000, // Time (ms) before trying to close circuit
});

// Execute operation with circuit breaker
const result = await circuitBreaker.execute(() =>
  client.entities.assets.getAsset(orgId, ledgerId, assetId)
);
```

## Best Practices

1. **Use Enhanced Recovery for Critical Operations**

   Always wrap critical operations with enhanced recovery:

   ```typescript
   const result = await withEnhancedRecovery(() =>
     client.entities.transactions.createTransaction(orgId, ledgerId, transaction)
   );
   ```

2. **Implement Appropriate Retry Policies**

   Configure retry policies based on the operation type:

   ```typescript
   // For less critical operations
   const lightRecovery = {
     retries: 2,
     retryDelay: 250,
   };

   // For critical operations
   const robustRecovery = {
     retries: 5,
     retryDelay: 500,
     exponentialBackoff: true,
   };
   ```

3. **Use Verification for Critical Operations**

   Add verification to ensure operations complete successfully:

   ```typescript
   const result = await withEnhancedRecovery(operation, {
     verification: async (data) => {
       // Custom verification logic
       return isValid(data);
     },
   });
   ```

4. **Handle Specific Error Types**

   Check for specific error codes to provide better user feedback:

   ```typescript
   try {
     // Operation...
   } catch (error) {
     if (error.code === 'RATE_LIMIT_EXCEEDED') {
       console.log('Rate limit reached. Try again later.');
     }
   }
   ```

5. **Implement Fallback Strategies**

   Provide fallback operations for critical functionality:

   ```typescript
   const result = await withEnhancedRecovery(primaryOperation, { fallback: alternativeOperation });
   ```
