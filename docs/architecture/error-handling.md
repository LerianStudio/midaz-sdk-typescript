# Error Handling Architecture

The Midaz SDK implements a sophisticated error handling system designed to provide consistent, informative errors while enabling robust recovery mechanisms. This document explains the error handling architecture, its components, and best practices for working with errors.

## Error System Design Goals

The error handling system is designed with the following goals:

1. **Consistency**: All errors follow the same structure and pattern
2. **Categorization**: Errors are categorized for easier handling
3. **Context Preservation**: Original error context is preserved
4. **Recovery Support**: Enable intelligent recovery from transient failures
5. **Actionable Information**: Provide enough information for consumers to act on errors
6. **Type Safety**: All error types are fully typed for TypeScript users

## Error Hierarchy

The error system is built around a central `MidazError` class:

```
            Error (native)
                 ↑
            MidazError
          ↗     ↑    ↖
ValidationError  NetworkError  OtherSpecializedErrors...
```

### Base Error Type

The `MidazError` class extends the native JavaScript `Error` class:

```typescript
class MidazError extends Error {
  /** Error category for grouping similar errors */
  public readonly category: ErrorCategory;
  
  /** Specific error code */
  public readonly code: ErrorCode;
  
  /** Human-readable error message */
  public readonly message: string;
  
  /** Operation that was being performed */
  public readonly operation?: string;
  
  /** Resource type involved */
  public readonly resource?: string;
  
  /** Resource identifier */
  public readonly resourceId?: string;
  
  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;
  
  /** Request ID for support reference */
  public readonly requestId?: string;
  
  /** Original error that caused this error */
  public readonly cause?: Error;
  
  constructor(params: {
    category: ErrorCategory;
    code: ErrorCode;
    message: string;
    operation?: string;
    resource?: string;
    resourceId?: string;
    statusCode?: number;
    requestId?: string;
    cause?: Error;
  }) {
    super(params.message);
    // Initialize properties...
    
    // Ensure the name property is set correctly
    this.name = 'MidazError';
    
    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MidazError);
    }
  }
}
```

### Error Categories

Errors are grouped into categories to enable consistent handling of similar errors:

```typescript
enum ErrorCategory {
  /** Validation errors occur when input data fails validation rules */
  VALIDATION = 'validation',

  /** Authentication errors occur when credentials are invalid or missing */
  AUTHENTICATION = 'authentication',

  /** Authorization errors occur when the user lacks permission for an operation */
  AUTHORIZATION = 'authorization',

  /** Not found errors occur when a requested resource doesn't exist */
  NOT_FOUND = 'not_found',

  /** Conflict errors occur when an operation conflicts with the current state */
  CONFLICT = 'conflict',

  /** Limit exceeded errors occur when a rate limit or quota is exceeded */
  LIMIT_EXCEEDED = 'limit_exceeded',

  /** Timeout errors occur when an operation takes too long to complete */
  TIMEOUT = 'timeout',

  /** Cancellation errors occur when an operation is cancelled */
  CANCELLATION = 'cancellation',

  /** Network errors occur when there's a problem with the network connection */
  NETWORK = 'network',

  /** Internal errors occur when there's an unexpected problem with the API */
  INTERNAL = 'internal',

  /** Unprocessable errors occur when a request is valid but cannot be processed */
  UNPROCESSABLE = 'unprocessable',
}
```

### Error Codes

Within each category, specific error codes identify the exact error:

```typescript
enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  INVALID_INPUT = 'invalid_input',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  EXPIRED_CREDENTIALS = 'expired_credentials',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  UNAUTHORIZED = 'unauthorized',
  
  // Not found errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  
  // Conflict errors
  RESOURCE_ALREADY_EXISTS = 'resource_already_exists',
  CONFLICTING_REQUEST = 'conflicting_request',
  
  // Limit exceeded errors
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // Timeout errors
  REQUEST_TIMEOUT = 'request_timeout',
  OPERATION_TIMEOUT = 'operation_timeout',
  
  // Cancellation errors
  CANCELLED = 'cancelled',
  
  // Network errors
  NETWORK_ERROR = 'network_error',
  CONNECTION_ERROR = 'connection_error',
  
  // Internal errors
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  // Unprocessable errors
  UNPROCESSABLE_ENTITY = 'unprocessable_entity',
  BUSINESS_RULE_VIOLATION = 'business_rule_violation',
  
  // Transaction specific errors
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  
  // Generic error
  UNEXPECTED_ERROR = 'unexpected_error',
}
```

### Specialized Error Types

The error system includes specialized error classes for specific scenarios:

```typescript
/** Validation-specific error with field-level error details */
class ValidationError extends MidazError {
  /** Maps field names to arrays of error messages */
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>, cause?: Error) {
    super({
      message,
      code: ErrorCode.VALIDATION_ERROR,
      category: ErrorCategory.VALIDATION,
      cause,
    });

    this.fieldErrors = fieldErrors;
  }
}
```

## Error Creation

Errors can be created through factory functions for consistency:

```typescript
// Create a standard error
const error = new MidazError({
  category: ErrorCategory.NOT_FOUND,
  code: ErrorCode.RESOURCE_NOT_FOUND,
  message: 'Account not found',
  resource: 'Account',
  resourceId: 'acc_12345'
});

// Factory functions for common errors
const notFoundError = newNotFoundError(
  'Account not found',
  { resource: 'Account', resourceId: 'acc_12345' }
);

const validationError = newValidationError(
  'Invalid input',
  {
    amount: ['Must be greater than zero'],
    assetCode: ['Invalid asset code format']
  }
);

const networkError = newNetworkError(
  'Failed to connect to API',
  { cause: originalError }
);
```

## Error Processing Pipeline

The error handling system processes errors through a pipeline:

1. **Error Detection**: Application code detects an error condition
2. **Error Creation**: An appropriate error is created
3. **Error Enhancement**: Error is enhanced with additional context
4. **Error Handling**: The error is handled (logged, reported, etc.)
5. **Error Recovery**: Recovery mechanisms attempt to resolve the error
6. **Error Propagation**: If unrecoverable, the error is propagated to the consumer

### Error Enhancement

Errors are enhanced with additional context using the `processError` function:

```typescript
// Raw error (e.g., from HTTP client)
const rawError = new Error('HTTP 404 Not Found');

// Process and enhance the error
const enhancedError = processError(rawError, {
  operation: 'getAccount',
  resource: 'Account',
  resourceId: 'acc_12345',
  details: { /* additional context */ }
});

// Enhanced error now has categorization, code, and context
console.log(enhancedError.category); // 'not_found'
console.log(enhancedError.code); // 'resource_not_found'
console.log(enhancedError.resource); // 'Account'
console.log(enhancedError.resourceId); // 'acc_12345'
```

### Error Handling Utilities

The error system provides utilities for handling errors:

```typescript
// Check if an error is a Midaz error
if (isMidazError(error)) {
  // Handle Midaz-specific error
}

// Check if an error is retryable
if (isRetryableError(error)) {
  // Retry the operation
}

// Check specific error types
if (isValidationError(error)) {
  // Handle validation error
  const fieldErrors = error.fieldErrors;
}

if (isNotFoundError(error)) {
  // Handle not found error
}

if (isNetworkError(error)) {
  // Handle network error
}
```

## Enhanced Recovery Mechanisms

The error system includes sophisticated recovery mechanisms through the `withEnhancedRecovery` function:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

// Execute an operation with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    // Basic retry settings
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    
    // Only retry certain errors
    retryCondition: (error) => isRetryableError(error),
    
    // Log retry attempts
    onRetry: (error, attempt) => {
      console.log(`Retrying after error (attempt ${attempt}):`, error);
    },
    
    // Enhanced recovery features
    fallbackAttempts: 2,
    transformOperation: (error, attempt) => {
      // If insufficient funds, try with a lower amount
      if (error.code === ErrorCode.INSUFFICIENT_FUNDS) {
        const newAmount = transaction.amount * 0.9;
        const reducedTx = { ...transaction, amount: newAmount };
        return () => client.entities.transactions.createTransaction(
          orgId, ledgerId, reducedTx
        );
      }
      return null; // No transformation for other errors
    },
    
    // Handle duplicates as success
    handleDuplicatesAsSuccess: true,
    
    // Enable advanced recovery for specific error types
    enableSmartRecovery: true
  }
);

// Check result
if (result.status === 'success') {
  console.log('Transaction completed successfully', result.result);
} else if (result.status === 'duplicate') {
  console.log('Transaction was already processed');
} else {
  console.error('Transaction failed after all recovery attempts', result.error);
}
```

## Transaction-Specific Error Handling

For financial transactions, specialized error handling is available:

```typescript
import { executeTransactionWithRecovery } from 'midaz-sdk/util/error';

// Execute a transaction with specialized recovery
const result = await executeTransactionWithRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    maxRetries: 3,
    enableSmartRecovery: true
  }
);
```

Transaction-specific error types are categorized for better handling:

```typescript
enum TransactionErrorCategory {
  /** Insufficient funds in the account */
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  
  /** Invalid account or account not found */
  INVALID_ACCOUNT = 'invalid_account',
  
  /** Invalid amount (e.g., negative or zero) */
  INVALID_AMOUNT = 'invalid_amount',
  
  /** Duplicate transaction (idempotency key already used) */
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  
  /** Account has been frozen or suspended */
  ACCOUNT_FROZEN = 'account_frozen',
  
  /** Currency conversion issues */
  CURRENCY_CONVERSION = 'currency_conversion',
  
  /** Limit exceeded (e.g., daily transaction limit) */
  LIMIT_EXCEEDED = 'limit_exceeded',
  
  /** Other transaction-related errors */
  OTHER = 'other_transaction_error'
}
```

## Error Handling in API Layers

Different layers of the SDK handle errors appropriately:

### HTTP Client Layer

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw errorFromHttpResponse(response);
  }
  return await response.json();
} catch (error) {
  throw processError(error, { 
    operation: 'httpRequest',
    details: { url, method: options.method }
  });
}
```

### Entity Service Layer

```typescript
async getAccount(orgId: string, ledgerId: string, accountId: string): Promise<Account> {
  try {
    const response = await this.httpClient.get(
      `organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}`
    );
    return response as Account;
  } catch (error) {
    throw processError(error, {
      operation: 'getAccount',
      resource: 'Account',
      resourceId: accountId
    });
  }
}
```

### Client Interface Layer

```typescript
// Consumers handle errors at their level
try {
  const account = await client.entities.accounts.getAccount(orgId, ledgerId, accountId);
  console.log('Account:', account);
} catch (error) {
  if (error.category === 'not_found') {
    console.error('Account not found:', error.resourceId);
  } else if (error.category === 'authentication') {
    console.error('Authentication failed');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices for Error Handling

When working with the Midaz SDK's error system, follow these best practices:

### For SDK Consumers

1. **Catch Specific Categories**: Handle errors by category for consistent behavior
   ```typescript
   try {
     // SDK operation
   } catch (error) {
     if (error.category === 'validation') {
       // Handle validation errors
     } else if (error.category === 'not_found') {
       // Handle not found errors
     } else {
       // Handle other errors
     }
   }
   ```

2. **Use Enhanced Recovery**: For critical operations, use enhanced recovery mechanisms
   ```typescript
   const result = await withEnhancedRecovery(
     () => criticalOperation(),
     { maxRetries: 3 }
   );
   ```

3. **Check Result Status**: When using enhanced recovery, check the result status
   ```typescript
   if (result.status === 'success') {
     // Operation succeeded
   } else if (result.status === 'duplicate') {
     // Operation was a duplicate
   } else {
     // Operation failed
   }
   ```

4. **Log Detailed Errors**: Include all relevant error information in logs
   ```typescript
   console.error(
     `Operation ${error.operation} failed:`,
     {
       category: error.category,
       code: error.code,
       resource: error.resource,
       resourceId: error.resourceId,
       requestId: error.requestId
     }
   );
   ```

### For SDK Developers

1. **Create Specific Errors**: Use factory functions to create specific error types
   ```typescript
   throw newNotFoundError('Account not found', {
     resource: 'Account',
     resourceId: accountId
   });
   ```

2. **Preserve Context**: Always include operation context when processing errors
   ```typescript
   throw processError(error, {
     operation: 'getAccount',
     resource: 'Account',
     resourceId: accountId
   });
   ```

3. **Test Error Scenarios**: Implement tests for both happy paths and error scenarios
   ```typescript
   it('should handle not found errors', async () => {
     // Set up a scenario that will cause a not found error
     const error = await getErrorFromOperation();
     expect(error.category).toBe('not_found');
     expect(error.resource).toBe('Account');
   });
   ```

4. **Document Error Behavior**: Document which errors can be thrown and how to handle them
   ```typescript
   /**
    * Gets an account by ID
    * @throws {MidazError} with category 'not_found' if the account does not exist
    * @throws {MidazError} with category 'authentication' if API key is invalid
    */
   async getAccount(orgId: string, ledgerId: string, accountId: string): Promise<Account>
   ```
