# Error Handling

The Midaz SDK provides a comprehensive error handling system, including error categorization, enhanced recovery mechanisms, and utilities for consistent error management.

## Core Error Types

### MidazError

The base error type for all Midaz SDK errors:

```typescript
import { MidazError, ErrorCategory, ErrorCode } from 'midaz-sdk/util/error';

try {
  // SDK operation
} catch (error) {
  if (error instanceof MidazError) {
    console.error(`Error category: ${error.category}`);
    console.error(`Error code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    
    // Additional context if available
    if (error.resource && error.resourceId) {
      console.error(`Resource: ${error.resource} ${error.resourceId}`);
    }
  }
}
```

### Error Categories

Errors are organized into categories for better handling strategies:

```typescript
import { ErrorCategory } from 'midaz-sdk/util/error';

// Error categories include:
// - validation: Input data fails validation rules
// - authentication: Invalid or missing credentials
// - authorization: User lacks permission
// - not_found: Resource doesn't exist
// - conflict: Operation conflicts with current state
// - limit_exceeded: Rate limit or quota exceeded
// - timeout: Operation took too long
// - cancellation: Operation was cancelled
// - network: Network connection problem
// - internal: Unexpected API problem
// - unprocessable: Valid request that cannot be processed
```

## Enhanced Error Recovery

The SDK provides an enhanced recovery mechanism for operations that may fail transiently or require fallback strategies.

### Basic Usage

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

async function createAccount() {
  const result = await withEnhancedRecovery(
    async () => client.entities.accounts.createAccount(orgId, ledgerId, accountData),
    {
      maxRetries: 3,
      initialDelay: 500,
      backoffFactor: 2
    }
  );
  
  if (result.status === 'success') {
    return result.result;
  } else {
    throw result.error?.originalError;
  }
}
```

### Advanced Recovery Options

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

const result = await withEnhancedRecovery(
  () => sendPayment(sender, recipient, 1000),
  {
    // Basic retry settings
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    
    // Only retry network errors and rate limits
    retryCondition: (error) => isNetworkError(error) || isRateLimitError(error),
    
    // Log each retry attempt
    onRetry: (error, attempt) => {
      console.warn(`Retrying after error (attempt ${attempt}):`, error);
    },
    
    // Log when all retries are exhausted
    onExhausted: (error, attempts) => {
      console.error(`Failed after ${attempts} attempts:`, error);
    },
    
    // Enhanced recovery features
    fallbackAttempts: 2,
    transformOperation: (error, attempt) => {
      // If insufficient funds, try with a smaller amount
      if (isInsufficientFundsError(error)) {
        const newAmount = 1000 * 0.9; // 90% of original
        return () => sendPayment(sender, recipient, newAmount);
      }
      return null; // No transformation for other errors
    },
    
    // Handle duplicates as successful operations
    handleDuplicatesAsSuccess: true,
    
    // Periodically verify operation success
    usePolledVerification: true,
    pollingInterval: 1000,
    maxPollingAttempts: 5,
    verifyOperation: () => checkIfPaymentExists(paymentId)
  }
);

if (result.status === 'success' || result.status === 'duplicate') {
  console.log('Payment processed successfully');
  if (result.usedFallback) {
    console.log(`Used fallback strategy: ${result.recoveryStrategy}`);
  }
} else {
  console.error('Payment failed', result.error);
}
```

## Transaction-Specific Recovery

For financial transactions, the SDK provides specialized recovery handling:

```typescript
import { executeTransactionWithRecovery } from 'midaz-sdk/util/error';

const result = await executeTransactionWithRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
  {
    maxRetries: 3,
    enableSmartRecovery: true, // Enables specialized handling for transaction errors
    
    transformOperation: (error, attempt) => {
      // Custom transformation logic for specific error types
      if (isInsufficientBalanceError(error)) {
        const newAmount = Math.floor(transaction.amount * 0.9);
        const reducedTx = { ...transaction, amount: newAmount };
        return () => client.entities.transactions.createTransaction(orgId, ledgerId, reducedTx);
      }
      return null;
    }
  }
);

// Transaction result handling
if (result.status === 'success') {
  console.log('Transaction completed successfully', result.result);
} else if (result.status === 'duplicate') {
  console.log('Transaction was already processed');
} else {
  console.error('Transaction failed', result.error);
}
```

## Error Verification and Checking

The SDK provides utilities for error categorization and verification:

```typescript
import {
  isMidazError,
  isNetworkError,
  isRetryableError,
  isValidationError,
  isNotFoundError,
  isCancellationError
} from 'midaz-sdk/util/error';

function handleError(error) {
  if (isNetworkError(error)) {
    console.log('Network error - check connection');
  } else if (isValidationError(error)) {
    console.log('Validation error:', error.message);
  } else if (isNotFoundError(error)) {
    console.log('Resource not found');
  } else if (isCancellationError(error)) {
    console.log('Operation was cancelled');
  } else if (isRetryableError(error)) {
    console.log('Retryable error - will attempt again');
  } else if (isMidazError(error)) {
    console.log(`Other Midaz error: ${error.category}/${error.code}`);
  } else {
    console.log('Unknown error:', error);
  }
}
```

## Practical Examples

### Creating a Resource with Retries

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

async function createAssetWithRetries(client, orgId, assetData) {
  const result = await withEnhancedRecovery(
    () => client.entities.assets.createAsset(orgId, assetData),
    {
      maxRetries: 3,
      initialDelay: 500,
      backoffFactor: 2,
      
      // Only retry certain errors
      retryCondition: (error) => {
        return isNetworkError(error) || 
               isRateLimitError(error) || 
               isTimeoutError(error);
      },
      
      // Log retries
      onRetry: (error, attempt) => {
        console.warn(`Retrying asset creation (attempt ${attempt})`, error);
      }
    }
  );
  
  // Check result
  if (result.status === 'success') {
    console.log('Asset created successfully', result.result);
    return result.result;
  } else if (result.status === 'duplicate') {
    console.log('Asset already exists');
    // In this case, we might want to fetch the existing asset
    return client.entities.assets.getAsset(orgId, assetData.code);
  } else {
    console.error('Failed to create asset', result.error);
    throw result.error?.originalError || new Error('Failed to create asset');
  }
}
```

### Processing a Batch with Error Handling

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util/error';
import { workerPool } from 'midaz-sdk/util/concurrency';

async function processBatchWithErrorHandling(client, orgId, ledgerId, accounts) {
  const results = await workerPool({
    items: accounts,
    workerFn: async (account) => {
      // Process each account with enhanced recovery
      try {
        const result = await withEnhancedRecovery(
          () => updateAccount(client, orgId, ledgerId, account),
          {
            maxRetries: 2,
            initialDelay: 200,
            handleDuplicatesAsSuccess: true
          }
        );
        
        return {
          accountId: account.id,
          success: result.status === 'success' || result.status === 'duplicate',
          result: result.result,
          error: result.error
        };
      } catch (error) {
        return {
          accountId: account.id,
          success: false,
          error: error
        };
      }
    },
    options: {
      concurrency: 5
    }
  });
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Processed ${accounts.length} accounts`);
  console.log(`- ${successful.length} succeeded`);
  console.log(`- ${failed.length} failed`);
  
  return { successful, failed };
}

// Helper function for account update
async function updateAccount(client, orgId, ledgerId, account) {
  return client.entities.accounts.updateAccount(
    orgId,
    ledgerId,
    account.id,
    account
  );
}
```

### Critical Operation with Verification

```typescript
import { 
  withEnhancedRecovery, 
  createTransactionVerification 
} from 'midaz-sdk/util/error';

async function processCriticalPayment(client, orgId, ledgerId, payment) {
  // Create verification function
  const verifyTransaction = createTransactionVerification(
    async () => {
      try {
        // Check if transaction exists by ID
        const tx = await client.entities.transactions.getTransaction(
          orgId, 
          ledgerId, 
          payment.idempotencyKey || payment.id
        );
        return tx && tx.status === 'completed';
      } catch (error) {
        return false;
      }
    }
  );
  
  // Execute with enhanced recovery and verification
  const result = await withEnhancedRecovery(
    () => client.entities.transactions.createTransaction(orgId, ledgerId, payment),
    {
      // Retry settings
      maxRetries: 5,
      initialDelay: 500,
      maxDelay: 10000,
      
      // Enable verification
      usePolledVerification: true,
      pollingInterval: 2000,
      maxPollingAttempts: 10,
      verifyOperation: verifyTransaction,
      
      // Callback when verification succeeds
      onVerificationSuccess: (tx) => {
        console.log(`Transaction ${tx.id} verified as successful`);
      }
    }
  );
  
  // Handle result
  if (result.status === 'success') {
    if (result.verifiedSuccess) {
      return { 
        success: true, 
        verified: true, 
        transaction: result.result 
      };
    } else {
      return { 
        success: true, 
        verified: false, 
        transaction: result.result,
        message: 'Transaction created but not verified'
      };
    }
  } else {
    return {
      success: false,
      error: result.error
    };
  }
}
```

## Migrating from Legacy Error Handling

If you're migrating from an older version of the SDK that used functions like `executeWithEnhancedRecovery`, use these alternatives:

```typescript
// Old approach
import { executeWithEnhancedRecovery } from 'midaz-sdk';

const result = await executeWithEnhancedRecovery(
  () => createTransaction(data),
  {
    maxRetries: 3,
    delayBetweenRetries: 1000
  }
);

// New approach (preferred)
import { withEnhancedRecovery } from 'midaz-sdk/util/error';

const result = await withEnhancedRecovery(
  () => createTransaction(data),
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 1 // No exponential backoff in this case
  }
);
```

The new approach provides more flexibility, better control over retry behavior, and enhanced recovery options.
