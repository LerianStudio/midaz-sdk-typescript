# Error Handling in Midaz SDK

The Midaz SDK implements sophisticated error handling with recovery mechanisms to ensure resilient applications. This document outlines the error handling strategies available in the SDK.

## Error Handling Approach

The SDK provides several layers of error handling:

1. **Basic Error Handling**: Standard try-catch patterns with typed errors
2. **Error Classification**: Errors are categorized by type (network, validation, etc.)
3. **Retry Policies**: Configurable retry policies for transient errors
4. **Enhanced Recovery**: Advanced recovery with fallback strategies and verification
5. **Circuit Breaking**: Prevents cascading failures in high-load scenarios

## Basic Error Handling

All SDK operations can throw errors that are properly categorized and include useful context:

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

## Enhanced Recovery

The SDK provides an enhanced recovery mechanism through the `withEnhancedRecovery` function, which replaces the deprecated `executeWithEnhancedRecovery` function:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    retries: 3,                 // Number of retry attempts
    retryDelay: 500,            // Base delay between retries (ms)
    exponentialBackoff: true,   // Whether to use exponential backoff
    fallback: async () => {     // Optional fallback operation
      return alternativeOperation();
    },
    verification: async (result) => {  // Optional verification function
      return result && result.id ? true : false;
    }
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

## Recovery Options

The `withEnhancedRecovery` function accepts the following options:

| Option | Type | Description |
|--------|------|-------------|
| `retries` | number | Maximum number of retry attempts |
| `retryDelay` | number | Base delay between retries in milliseconds |
| `exponentialBackoff` | boolean | Whether to use exponential backoff for retries |
| `retryableErrors` | string[] | Array of error codes that should trigger retries |
| `fallback` | function | Alternative operation to run if retries fail |
| `verification` | function | Function to verify the operation result |
| `timeout` | number | Overall timeout for the operation including retries |

## Error Classification

Errors are classified into the following categories:

- **Network Errors**: Communication issues with the API
- **Validation Errors**: Input data doesn't meet requirements
- **Authentication Errors**: API key or credentials are invalid
- **Authorization Errors**: Insufficient permissions for the operation
- **Not Found Errors**: Requested resource doesn't exist
- **Rate Limit Errors**: API rate limits have been exceeded
- **Server Errors**: Backend server issues
- **Client Errors**: Issues in the SDK client

Each error includes:
- `code`: Error code identifier
- `message`: Human-readable error message
- `details`: Additional error context
- `httpStatus`: HTTP status code (for API errors)
- `retryable`: Whether the error is potentially recoverable with a retry

## Circuit Breaking

For high-load scenarios, the SDK includes circuit breaking capabilities:

```typescript
import { createCircuitBreaker } from 'midaz-sdk/util';

const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5,           // Number of failures before opening circuit
  resetTimeout: 30000,           // Time (ms) before trying to close circuit
  fallback: () => defaultValue,  // Function to call when circuit is open
});

const result = await circuitBreaker.execute(
  () => client.entities.assets.getAsset(orgId, ledgerId, assetId)
);
```

## Best Practices

1. **Always use `withEnhancedRecovery` for critical operations**:
   ```typescript
   const result = await withEnhancedRecovery(
     () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction)
   );
   ```

2. **Check for specific error codes to provide better user feedback**:
   ```typescript
   try {
     // Operation...
   } catch (error) {
     if (error.code === 'RATE_LIMIT_EXCEEDED') {
       console.log('Rate limit reached. Try again later.');
     }
   }
   ```

3. **Implement appropriate fallback strategies**:
   ```typescript
   const result = await withEnhancedRecovery(
     primaryOperation,
     { fallback: alternativeOperation }
   );
   ```

4. **Use verification for critical operations**:
   ```typescript
   const result = await withEnhancedRecovery(
     operation,
     { 
       verification: async (data) => {
         // Custom verification logic
         return isValid(data);
       }
     }
   );
   ```

5. **Consider circuit breaking for high-volume scenarios**:
   This prevents cascading failures when the backend is experiencing issues.
