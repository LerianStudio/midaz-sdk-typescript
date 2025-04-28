# Working with Transactions

This guide explains how to work with transactions using the Midaz SDK.

## What is a Transaction?

In the Midaz financial platform, a transaction represents a financial activity involving one or more accounts. Transactions consist of entries that represent debits and credits across accounts, ensuring that the total balance across all entries sums to zero (double-entry accounting).

## Transaction Model

The Transaction model has the following structure:

```typescript
interface Transaction {
  id: string;
  ledgerId: string;
  organizationId: string;
  status: TransactionStatus;
  entries: TransactionEntry[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface TransactionEntry {
  accountId: string;
  assetId: string;
  amount: number;
  type: 'credit' | 'debit';
}
```

## Creating Transactions

### Using the Builder Pattern

The recommended way to create transactions is using the builder pattern through the `createTransactionBuilder` function:

```typescript
import { createTransactionBuilder } from 'midaz-sdk';

// Create a transaction input using the builder
const transactionInput = createTransactionBuilder()
  .withEntries([
    {
      accountId: sourceAccountId,
      assetId: assetId,
      amount: -100,  // Negative for debit
      type: 'debit'
    },
    {
      accountId: destinationAccountId,
      assetId: assetId,
      amount: 100,   // Positive for credit
      type: 'credit'
    }
  ])
  .withMetadata({ reference: 'Transfer #12345', initiatedBy: 'user123' })
  .build();

// Create the transaction
const transaction = await client.entities.transactions.createTransaction(
  organizationId,
  ledgerId,
  transactionInput
);
```

Note that:
- The transaction entries must balance (sum to zero) across all accounts for a given asset
- The `status` field is set in the model but not included in the output of the builder
- Additional properties can be set using the chainable `with*` methods

### Common Transaction Types

#### Transfer Between Accounts

```typescript
const transferTransaction = createTransactionBuilder()
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
  .withMetadata({ transactionType: 'transfer', reference: reference })
  .build();
```

#### Deposit to Account

```typescript
const depositTransaction = createTransactionBuilder()
  .withEntries([
    {
      accountId: externalAccountId,
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
  .withMetadata({ transactionType: 'deposit', reference: reference })
  .build();
```

#### Withdrawal from Account

```typescript
const withdrawalTransaction = createTransactionBuilder()
  .withEntries([
    {
      accountId: sourceAccountId,
      assetId: assetId,
      amount: -amount,
      type: 'debit'
    },
    {
      accountId: externalAccountId,
      assetId: assetId,
      amount: amount,
      type: 'credit'
    }
  ])
  .withMetadata({ transactionType: 'withdrawal', reference: reference })
  .build();
```

### Batch Transactions

For creating multiple transactions in a single API call:

```typescript
import { createBatchBuilder } from 'midaz-sdk';

// Create multiple transaction inputs
const transaction1 = createTransactionBuilder()
  .withEntries([/* entries */])
  .build();

const transaction2 = createTransactionBuilder()
  .withEntries([/* entries */])
  .build();

// Create a batch of transactions
const batchInput = createBatchBuilder()
  .withTransactions([transaction1, transaction2])
  .withMetadata({ batchReference: 'batch-123' })
  .build();

// Execute the batch
const batchResult = await client.entities.transactions.createBatchTransactions(
  organizationId,
  ledgerId,
  batchInput
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
for (const entry of transaction.entries) {
  console.log(`Entry: Account ${entry.accountId}, ${entry.type}, Amount: ${entry.amount}`);
}
```

### List Transactions

```typescript
// List transactions with pagination
const transactionList = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

console.log(`Total transactions: ${transactionList.total}`);
for (const transaction of transactionList.data) {
  console.log(`- Transaction ${transaction.id} (${transaction.status})`);
}
```

### List Transactions for an Account

```typescript
// List transactions for a specific account
const accountTransactions = await client.entities.transactions.listAccountTransactions(
  organizationId,
  ledgerId,
  accountId,
  { limit: 50, offset: 0 }
);

console.log(`Transactions for account ${accountId}: ${accountTransactions.total}`);
```

## Error Handling

Use enhanced recovery for critical operations:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a transaction with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(
    organizationId,
    ledgerId,
    transactionInput
  )
);

if (result.success) {
  const transaction = result.data;
  console.log(`Transaction created: ${transaction.id}`);
} else {
  console.error(`Failed to create transaction: ${result.error.message}`);
}
```

## Best Practices

1. **Use the Builder Pattern**
   Always use the `createTransactionBuilder` function to create transaction inputs, as it ensures proper structure and validation.

2. **Ensure Balanced Entries**
   Make sure that transaction entries balance (sum to zero) for each asset involved in the transaction.

3. **Include Meaningful Metadata**
   The metadata field is useful for storing application-specific information about the transaction, such as references, user IDs, or transaction types.

4. **Use Batch Operations for Multiple Transactions**
   When creating multiple related transactions, use batch operations to ensure atomic execution.

5. **Use Error Recovery**
   For critical operations, use the enhanced recovery mechanism to handle transient errors automatically.

6. **Check Transaction Status**
   Always check the status of a transaction to ensure it was processed successfully, especially in async processing workflows.

## Example: Complete Transaction Management

```typescript
// Transaction management example
async function manageTransactions(client, organizationId, ledgerId, sourceAccountId, destinationAccountId, assetId) {
  try {
    // Create a transfer transaction
    const transactionInput = createTransactionBuilder()
      .withEntries([
        {
          accountId: sourceAccountId,
          assetId: assetId,
          amount: -100,
          type: 'debit'
        },
        {
          accountId: destinationAccountId,
          assetId: assetId,
          amount: 100,
          type: 'credit'
        }
      ])
      .withMetadata({ 
        transactionType: 'transfer',
        reference: `TR-${Date.now()}`,
        description: 'Funds transfer'
      })
      .build();

    // Use enhanced recovery for critical operations
    const result = await withEnhancedRecovery(
      () => client.entities.transactions.createTransaction(
        organizationId,
        ledgerId,
        transactionInput
      )
    );

    if (!result.success) {
      throw new Error(`Transaction failed: ${result.error.message}`);
    }

    const transaction = result.data;
    console.log(`Created transaction: ${transaction.id}`);

    // Get the transaction details
    const retrievedTransaction = await client.entities.transactions.getTransaction(
      organizationId,
      ledgerId,
      transaction.id
    );
    console.log(`Retrieved transaction: ${retrievedTransaction.id}, Status: ${retrievedTransaction.status}`);

    // List recent transactions
    const transactions = await client.entities.transactions.listTransactions(
      organizationId,
      ledgerId,
      { limit: 10 }
    );
    console.log(`Listed ${transactions.data.length} transactions`);

    // List transactions for the source account
    const accountTransactions = await client.entities.transactions.listAccountTransactions(
      organizationId,
      ledgerId,
      sourceAccountId,
      { limit: 10 }
    );
    console.log(`Listed ${accountTransactions.data.length} transactions for account ${sourceAccountId}`);

    return {
      created: transaction,
      list: transactions.data,
      accountTransactions: accountTransactions.data
    };
  } catch (error) {
    console.error(`Transaction management error: ${error.message}`);
    throw error;
  }
}
```
