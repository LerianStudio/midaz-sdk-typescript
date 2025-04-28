# Enhanced Recovery Utility

The Enhanced Recovery utility in the Midaz SDK provides robust error handling and recovery mechanisms for critical operations. This guide explains how to use the `withEnhancedRecovery` function, which replaces the deprecated `executeWithEnhancedRecovery` function.

## Overview

The Enhanced Recovery utility handles various failure scenarios that can occur during API operations:

1. **Transient network failures**: Automatically retries operations that fail due to temporary network issues
2. **Rate limiting**: Implements backoff strategies when rate limits are encountered
3. **Verification**: Ensures the operation was successful through verification callbacks
4. **Fallback strategies**: Provides alternative operations when primary operations fail

## Basic Usage

The `withEnhancedRecovery` function wraps any asynchronous operation and provides enhanced error handling:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Wrap an operation with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.assets.createAsset(orgId, ledgerId, assetInput)
);

if (result.success) {
  // Operation was successful
  const asset = result.data;
  console.log(`Asset created: ${asset.id}`);
} else {
  // Operation failed even after recovery attempts
  console.error(`Failed to create asset: ${result.error.message}`);
  
  if (result.attemptedRecovery) {
    console.log(`Recovery was attempted ${result.recoveryAttempts} times`);
  }
}
```

## Advanced Configuration

The `withEnhancedRecovery` function accepts an options object to customize its behavior:

```typescript
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(orgId, ledgerId, txInput),
  {
    // Number of retry attempts
    retries: 3,
    
    // Base delay between retries in milliseconds
    retryDelay: 500,
    
    // Whether to use exponential backoff for retries
    exponentialBackoff: true,
    
    // Array of error codes that should trigger retries
    retryableErrors: ['NETWORK_ERROR', 'RATE_LIMIT_EXCEEDED', 'SERVER_ERROR'],
    
    // Alternative operation to run if retries fail
    fallback: async () => {
      return alternativeOperation();
    },
    
    // Function to verify the operation result
    verification: async (result) => {
      // Return true if result is valid, false otherwise
      return result && result.id ? true : false;
    },
    
    // Overall timeout for the operation including retries (in milliseconds)
    timeout: 30000
  }
);
```

## Result Object

The `withEnhancedRecovery` function returns an enhanced result object:

```typescript
interface EnhancedOperationResult<T> {
  // Whether the operation was successful
  success: boolean;
  
  // The result data (if successful)
  data?: T;
  
  // The error that occurred (if unsuccessful)
  error?: Error;
  
  // Whether recovery was attempted
  attemptedRecovery: boolean;
  
  // Number of recovery attempts made
  recoveryAttempts: number;
  
  // Whether a fallback operation was used
  usedFallback: boolean;
  
  // Whether verification was successful (if verification function was provided)
  verified?: boolean;
}
```

## Best Practices

### When to Use Enhanced Recovery

Enhanced recovery is particularly useful for:

1. **Critical financial operations**: Transactions, transfers, and balance updates
2. **Client-facing operations**: API calls that directly impact user experience
3. **Operations that need verification**: When you need to ensure the operation was successful

### Configuring Retry Policies

Adjust retry policies based on the operation type:

```typescript
// For less critical operations with minimal impact
const lightRecovery = {
  retries: 2,
  retryDelay: 250,
  exponentialBackoff: true
};

// For critical operations that must succeed
const robustRecovery = {
  retries: 5,
  retryDelay: 500,
  exponentialBackoff: true,
  timeout: 60000,
  verification: verifyFunction
};

// Usage
await withEnhancedRecovery(nonCriticalOperation, lightRecovery);
await withEnhancedRecovery(criticalOperation, robustRecovery);
```

### Implementing Verification Functions

Verification functions should check that the operation succeeded correctly:

```typescript
// Verify a transaction was created with the correct status
const verifyTransaction = async (transaction) => {
  if (!transaction || !transaction.id) {
    return false;
  }
  
  // Additional verification logic
  const freshData = await client.entities.transactions.getTransaction(
    orgId, ledgerId, transaction.id
  );
  
  return freshData.status === 'completed';
};

// Use the verification function
await withEnhancedRecovery(
  () => createTransaction(),
  { verification: verifyTransaction }
);
```

### Implementing Fallback Strategies

Fallback functions provide alternative ways to accomplish the same goal:

```typescript
// Primary operation
const primaryOperation = () => client.entities.transactions.createTransaction(
  orgId, ledgerId, complexTransaction
);

// Fallback operation (simpler transaction that's more likely to succeed)
const fallbackOperation = async () => {
  const simpleTransaction = createSimplifiedTransaction(/* parameters */);
  return client.entities.transactions.createTransaction(
    orgId, ledgerId, simpleTransaction
  );
};

// Use with enhanced recovery
const result = await withEnhancedRecovery(
  primaryOperation,
  { fallback: fallbackOperation }
);

if (result.usedFallback) {
  console.log('Used fallback strategy to complete operation');
}
```

## Examples

### Simple Transaction with Recovery

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';
import { createTransactionBuilder } from 'midaz-sdk';

async function createTransferWithRecovery(
  client, orgId, ledgerId, sourceAccountId, destinationAccountId, assetId, amount
) {
  const transaction = createTransactionBuilder()
    .withEntries([
      {
        accountId: sourceAccountId,
        assetId: assetId,
        amount: -amount,
        type: 'debit'
      },
      {
        accountId: destinationAccountId,
        assetId: assetId,
        amount: amount,
        type: 'credit'
      }
    ])
    .withMetadata({ reference: `TRANSFER-${Date.now()}` })
    .build();

  const result = await withEnhancedRecovery(
    () => client.entities.transactions.createTransaction(orgId, ledgerId, transaction),
    {
      retries: 3,
      exponentialBackoff: true,
      verification: async (tx) => {
        if (!tx || !tx.id) return false;
        
        // Verify the transaction status
        const verifiedTx = await client.entities.transactions.getTransaction(
          orgId, ledgerId, tx.id
        );
        return verifiedTx.status === 'completed';
      }
    }
  );

  return result;
}
```

### Complex Recovery Strategy

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

async function robustBatchOperation(client, orgId, ledgerId, batchInput) {
  // Define custom logger for recovery attempts
  const logRecovery = (attempt, error) => {
    console.warn(`Recovery attempt ${attempt} after error: ${error.message}`);
  };

  // Define verification logic
  const verifyBatch = async (batch) => {
    if (!batch || !batch.id) return false;
    
    // Verify all transactions in the batch are completed
    const batchDetails = await client.entities.transactions.getBatchTransactions(
      orgId, ledgerId, batch.id
    );
    
    return batchDetails.transactions.every(tx => tx.status === 'completed');
  };

  // Define fallback logic for smaller batches
  const fallbackToSmallerBatches = async () => {
    console.log('Attempting fallback: splitting into smaller batches');
    
    // Split the batch into smaller groups
    const transactions = batchInput.transactions;
    const batches = [];
    
    // Create smaller batches (max 5 transactions per batch)
    for (let i = 0; i < transactions.length; i += 5) {
      const batchSlice = transactions.slice(i, i + 5);
      const smallerBatch = createBatchBuilder()
        .withTransactions(batchSlice)
        .withMetadata({ ...batchInput.metadata, partialBatch: true, batchIndex: i / 5 })
        .build();
        
      batches.push(smallerBatch);
    }
    
    // Process each smaller batch
    const results = await Promise.all(
      batches.map(batch => 
        client.entities.transactions.createBatchTransactions(orgId, ledgerId, batch)
      )
    );
    
    // Combine results
    return {
      id: `multi-batch-${Date.now()}`,
      batches: results,
      transactions: results.flatMap(r => r.transactions)
    };
  };

  // Execute with robust recovery strategy
  const result = await withEnhancedRecovery(
    () => client.entities.transactions.createBatchTransactions(orgId, ledgerId, batchInput),
    {
      retries: 4,
      retryDelay: 1000,
      exponentialBackoff: true,
      retryableErrors: ['NETWORK_ERROR', 'RATE_LIMIT_EXCEEDED', 'SERVER_ERROR'],
      fallback: fallbackToSmallerBatches,
      verification: verifyBatch,
      timeout: 60000,
      onRetry: logRecovery
    }
  );

  return result;
}
```
