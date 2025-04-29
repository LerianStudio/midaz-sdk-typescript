# Working with Transactions

This guide explains how to work with transactions using the Midaz SDK.

## Transaction Model

The Transaction model has the following structure:

```typescript
interface Transaction {
  id: string;
  orgId: string;
  ledgerId: string;
  type: TransactionType;
  status: TransactionStatus;
  entries: TransactionEntry[];
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface TransactionEntry {
  accountId: string;
  assetId: string;
  amount: string;
  direction: 'credit' | 'debit';
}
```

## Creating Transactions

### Using the Transaction Builder

```typescript
import { createTransactionBuilder } from 'midaz-sdk';

// Create a transaction using the builder
const transactionInput = createTransactionBuilder()
  .withEntry({
    accountId: 'account1',
    assetId: 'asset1',
    amount: '100.00',
    direction: 'credit'
  })
  .withEntry({
    accountId: 'account2',
    assetId: 'asset1',
    amount: '100.00',
    direction: 'debit'
  })
  .withIdempotencyKey('unique-transaction-key-123')
  .withMetadata({ 
    purpose: 'Monthly transfer',
    category: 'Recurring'
  })
  .build();

// Create the transaction
const transaction = await client.entities.transactions.createTransaction(
  organizationId,
  ledgerId,
  transactionInput
);
```

### Common Transaction Types

The SDK provides specialized creator functions for common transaction types:

```typescript
// Create a deposit transaction
import { createDepositTransaction } from 'midaz-sdk';

const depositTx = createDepositTransaction(
  accountId,
  '500.00',
  assetId,
  { 
    idempotencyKey: 'deposit-123',
    metadata: { source: 'Bank transfer' }
  }
);

// Create a transfer transaction
import { createTransferTransaction } from 'midaz-sdk';

const transferTx = createTransferTransaction(
  sourceAccountId,
  destinationAccountId,
  '250.00',
  assetId,
  { 
    idempotencyKey: 'transfer-123',
    metadata: { purpose: 'Loan repayment' }
  }
);

// Create a withdrawal transaction
import { createWithdrawalTransaction } from 'midaz-sdk';

const withdrawalTx = createWithdrawalTransaction(
  accountId,
  '100.00',
  assetId,
  { 
    idempotencyKey: 'withdrawal-123',
    metadata: { destination: 'External account' }
  }
);
```

## Retrieving Transactions

### Get a Specific Transaction

```typescript
// Get a specific transaction by ID
const transaction = await client.entities.transactions.getTransaction(
  organizationId,
  ledgerId,
  transactionId
);

console.log(`Transaction: ${transaction.id}`);
console.log(`Status: ${transaction.status}`);
console.log(`Entries: ${transaction.entries.length}`);
```

### List Transactions

```typescript
// List transactions with filtering and pagination
const transactionList = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { 
    limit: 50, 
    offset: 0,
    status: 'completed',
    fromDate: '2023-01-01T00:00:00Z',
    toDate: '2023-12-31T23:59:59Z'
  }
);

console.log(`Total transactions: ${transactionList.total}`);
for (const tx of transactionList.data) {
  console.log(`- ${tx.id} (${tx.type}): ${tx.status}`);
}
```

### Get Transaction by Idempotency Key

```typescript
// Get a transaction by idempotency key
const transaction = await client.entities.transactions.getTransactionByIdempotencyKey(
  organizationId,
  ledgerId,
  'unique-transaction-key-123'
);

if (transaction) {
  console.log(`Found transaction: ${transaction.id}`);
} else {
  console.log('No transaction found with that idempotency key');
}
```

## Error Handling with Transactions

Transactions are critical operations, so enhanced recovery is particularly important:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a transaction with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(
    organizationId,
    ledgerId,
    transactionInput
  ),
  {
    retries: 3,
    retryDelay: 500,
    verification: async (tx) => {
      // Verify transaction was created and recorded
      try {
        const verifiedTx = await client.entities.transactions.getTransaction(
          organizationId,
          ledgerId,
          tx.id
        );
        return verifiedTx.status !== 'failed';
      } catch (e) {
        return false;
      }
    }
  }
);

if (result.success) {
  const transaction = result.data;
  console.log(`Transaction created: ${transaction.id}`);
} else {
  console.error(`Failed to create transaction: ${result.error.message}`);
}
```

## Batch Processing Transactions

For processing multiple transactions efficiently, use the batch processing utility:

```typescript
import { createBatch, executeBatch } from 'midaz-sdk/util';

// Create multiple transactions
const transactions = [
  createDepositTransaction(account1Id, '100.00', assetId),
  createTransferTransaction(account1Id, account2Id, '50.00', assetId),
  createWithdrawalTransaction(account2Id, '25.00', assetId)
];

// Create and execute a batch
const batch = createBatch(transactions);
const results = await executeBatch(
  client.entities.transactions,
  organizationId,
  ledgerId,
  batch
);

// Process results
for (const result of results) {
  if (result.success) {
    console.log(`Transaction ${result.data.id} completed successfully`);
  } else {
    console.error(`Transaction failed: ${result.error.message}`);
  }
}
```

## Example: Complete Transaction Management

```typescript
// Transaction management example
async function manageTransactions(client, organizationId, ledgerId, accounts, assets) {
  try {
    // Create a deposit transaction
    const depositTx = createDepositTransaction(
      accounts[0].id,
      '1000.00',
      assets[0].id,
      { 
        idempotencyKey: `deposit-${Date.now()}`,
        metadata: { source: 'Initial funding' }
      }
    );
    
    const deposit = await client.entities.transactions.createTransaction(
      organizationId,
      ledgerId,
      depositTx
    );
    console.log(`Created deposit transaction: ${deposit.id}`);

    // Create a transfer transaction
    const transferTx = createTransferTransaction(
      accounts[0].id,
      accounts[1].id,
      '500.00',
      assets[0].id,
      { 
        idempotencyKey: `transfer-${Date.now()}`,
        metadata: { purpose: 'Allocation to secondary account' }
      }
    );
    
    const transfer = await client.entities.transactions.createTransaction(
      organizationId,
      ledgerId,
      transferTx
    );
    console.log(`Created transfer transaction: ${transfer.id}`);

    // Get transaction details
    const retrievedTx = await client.entities.transactions.getTransaction(
      organizationId,
      ledgerId,
      transfer.id
    );
    console.log(`Retrieved transaction: ${retrievedTx.id}`);
    console.log(`Status: ${retrievedTx.status}`);
    
    // List transactions
    const transactions = await client.entities.transactions.listTransactions(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${transactions.data.length} transactions`);

    // Create and execute a batch of transactions
    const batchTransactions = [
      createDepositTransaction(accounts[1].id, '200.00', assets[0].id),
      createWithdrawalTransaction(accounts[0].id, '100.00', assets[0].id)
    ];
    
    const batch = createBatch(batchTransactions);
    const batchResults = await executeBatch(
      client.entities.transactions,
      organizationId,
      ledgerId,
      batch
    );
    
    console.log(`Executed batch with ${batchResults.length} transactions`);
    const successfulBatchTxs = batchResults.filter(r => r.success).length;
    console.log(`${successfulBatchTxs} successful, ${batchResults.length - successfulBatchTxs} failed`);

    return {
      deposit,
      transfer,
      retrieved: retrievedTx,
      list: transactions.data,
      batchResults
    };
  } catch (error) {
    console.error(`Transaction management error: ${error.message}`);
    throw error;
  }
}
```
