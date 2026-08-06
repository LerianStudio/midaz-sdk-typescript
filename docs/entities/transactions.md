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

`idempotencyKey` is an input-only field: it belongs to `CreateTransactionInput` and is not
returned on the `Transaction` response. See [Idempotency](#idempotency).

## Idempotency

Midaz deduplicates transaction creation — and only transaction creation. No other endpoint
participates in idempotency.

The single header the server reads is **`X-Idempotency`**. There are two ways to use it:

**Let the server deduplicate (default).** Send no key and the SDK sends no idempotency
header at all. The server derives a deduplication key from the SHA-256 hash of the request
body, so two identical creation payloads resolve to the same transaction. This covers the
common case — a retry after a timeout — without any work on your side.

> **Batches of identical payloads collapse.** Because the default key is the body hash, a
> batch that contains two or more byte-identical transactions produces a single transaction:
> the server replays the first one for every repeat. `createTransactionBatch` counts those
> repeats in `duplicateCount` rather than `successCount`, but still fires the
> `onTransactionSuccess` callback for them, so callback-driven code sees every item
> succeed. When a batch can legitimately contain repeats — the same
> amount to the same account twice — give each item its own `idempotencyKey`, or make the
> payloads distinct with `externalId` or `metadata`.

```typescript
// No idempotencyKey: the server deduplicates by request-body hash
const transaction = await client.entities.transactions.createTransaction(organizationId, ledgerId, {
  chartOfAccountsGroupName: 'TRANSFER',
  description: 'Monthly transfer',
  send: {
    /* ... */
  },
});
```

**Supply your own key.** Set `idempotencyKey` on the input and the SDK sends it as
`X-Idempotency`. Do this when the body-hash default is not the deduplication boundary you
want — for example when the payload carries a timestamp or a generated reference, so two
attempts at the _same_ logical transaction would hash differently.

```typescript
const transaction = await client.entities.transactions.createTransaction(organizationId, ledgerId, {
  idempotencyKey: 'unique-transaction-key-123',
  chartOfAccountsGroupName: 'TRANSFER',
  description: 'Monthly transfer',
  metadata: {
    purpose: 'Monthly transfer',
    category: 'Recurring',
  },
  send: {
    /* ... */
  },
});
```

Generate the key once per logical operation and reuse it across every retry of that
operation. A key generated inside the retry loop produces a new key per attempt and
disables deduplication.

> The SDK no longer auto-generates idempotency keys. The `createIdempotencyKey` helper is
> deprecated; nothing in the request path calls it.

## Creating Transactions

### Common Transaction Types

The SDK provides specialized creator functions for common transaction types:

These helpers take positional arguments and return a `CreateTransactionInput`. None of
them accept an idempotency key — attach one to the returned input when you need an
explicit key, or omit it and let the server deduplicate by body hash.

```typescript
// Create a deposit transaction
import { createDepositTransaction } from 'midaz-sdk';

const depositTx = createDepositTransaction(
  '@external/USD',
  accountId,
  '500.00',
  assetCode,
  'Bank transfer deposit',
  'default',
  { source: 'Bank transfer' }
);

// Create a transfer transaction
import { createTransferTransaction } from 'midaz-sdk';

const transferTx = createTransferTransaction(
  sourceAccountId,
  destinationAccountId,
  '250.00',
  assetCode,
  'Loan repayment'
);

// Create a withdrawal transaction
import { createWithdrawalTransaction } from 'midaz-sdk';

const withdrawalTx = createWithdrawalTransaction(
  accountId,
  '@external/USD',
  100,
  assetCode,
  0,
  'Withdrawal to external account'
);
```

To pin an explicit idempotency key on any of these, set it on the returned input:

```typescript
const deposit = await client.entities.transactions.createTransaction(organizationId, ledgerId, {
  ...depositTx,
  idempotencyKey: 'deposit-123',
});
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
    toDate: '2023-12-31T23:59:59Z',
  }
);

console.log(`Total transactions: ${transactionList.total}`);
for (const tx of transactionList.data) {
  console.log(`- ${tx.id} (${tx.type}): ${tx.status}`);
}
```

> There is no lookup-by-idempotency-key endpoint. An idempotency key is a deduplication
> token, not an addressable identifier — you cannot resolve one back to a transaction.
> If you need to find a transaction again later, put your own reference in `metadata` or
> `externalId` and retain the returned `transaction.id`.

## Error Handling with Transactions

Transactions are critical operations, so enhanced recovery is particularly important:

```typescript
import { withEnhancedRecovery } from 'midaz-sdk/util';

// Create a transaction with enhanced recovery
const result = await withEnhancedRecovery(
  () => client.entities.transactions.createTransaction(organizationId, ledgerId, transactionInput),
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
    },
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
  createWithdrawalTransaction(account2Id, '25.00', assetId),
];

// Create and execute a batch
const batch = createBatch(transactions);
const results = await executeBatch(client.entities.transactions, organizationId, ledgerId, batch);

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
import { randomUUID } from 'node:crypto';

// Transaction management example
async function manageTransactions(client, organizationId, ledgerId, accounts, assets) {
  try {
    // Create a deposit transaction.
    // No idempotencyKey: the server deduplicates by request-body hash.
    const depositTx = createDepositTransaction(
      '@external/USD',
      accounts[0].id,
      '1000.00',
      assets[0].code,
      'Initial funding',
      'default',
      { source: 'Initial funding' }
    );

    const deposit = await client.entities.transactions.createTransaction(
      organizationId,
      ledgerId,
      depositTx
    );
    console.log(`Created deposit transaction: ${deposit.id}`);

    // Create a transfer transaction with an explicit idempotency key.
    // Generated once, outside any retry loop, so retries reuse the same key.
    // Use a UUID, not a timestamp: two transfers started in the same millisecond
    // would share a key and the second would come back as a replay of the first.
    const transferKey = `transfer-${randomUUID()}`;
    const transferTx = createTransferTransaction(
      accounts[0].id,
      accounts[1].id,
      '500.00',
      assets[0].code,
      'Allocation to secondary account'
    );

    const transfer = await client.entities.transactions.createTransaction(
      organizationId,
      ledgerId,
      { ...transferTx, idempotencyKey: transferKey }
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
    // Distinct payloads, so the body-hash default cannot collapse them.
    const batchTransactions = [
      createDepositTransaction(
        '@external/USD',
        accounts[1].id,
        '200.00',
        assets[0].code,
        'Batch top-up'
      ),
      createWithdrawalTransaction(
        accounts[0].id,
        '@external/USD',
        100,
        assets[0].code,
        0,
        'Batch withdrawal'
      ),
    ];

    const batch = createBatch(batchTransactions);
    const batchResults = await executeBatch(
      client.entities.transactions,
      organizationId,
      ledgerId,
      batch
    );

    console.log(`Executed batch with ${batchResults.length} transactions`);
    const successfulBatchTxs = batchResults.filter((r) => r.success).length;
    console.log(
      `${successfulBatchTxs} successful, ${batchResults.length - successfulBatchTxs} failed`
    );

    return {
      deposit,
      transfer,
      retrieved: retrievedTx,
      list: transactions.data,
      batchResults,
    };
  } catch (error) {
    console.error(`Transaction management error: ${error.message}`);
    throw error;
  }
}
```
