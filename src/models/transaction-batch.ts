/**
 */

import { MidazClient } from '../client';
import { workerPool } from '../util/concurrency/worker-pool';
import { executeTransaction } from '../util/error/error-handler';
import { executeTransactionWithRecovery } from '../util/error/enhanced-error-recovery';
import { CreateTransactionInput } from './transaction';

/**
 * Options for transaction batch processing
 */
export interface TransactionBatchOptions {
  /**
   * Maximum number of concurrent transactions
   * @default 3
   */
  concurrency?: number;

  /**
   * Whether to use enhanced error recovery for transactions
   * @default true
   */
  useEnhancedRecovery?: boolean;

  /**
   * Maximum number of retry attempts per transaction
   * @default 2
   */
  maxRetries?: number;

  /**
   * Whether to stop processing on the first error
   * @default false
   */
  stopOnError?: boolean;

  /**
   * Function called for each successful transaction
   */
  onTransactionSuccess?: (transaction: CreateTransactionInput, index: number, result: any) => void;

  /**
   * Function called for each failed transaction
   */
  onTransactionError?: (transaction: CreateTransactionInput, index: number, error: any) => void;

  /**
   * Additional metadata to add to all transactions
   */
  batchMetadata?: Record<string, any>;

  /**
   * Delay between transactions in milliseconds
   * @default 0
   */
  delayBetweenTransactions?: number;
}

/**
 * Result of a transaction batch operation
 */
export interface TransactionBatchResult {
  /**
   * Count of successful transactions
   */
  successCount: number;

  /**
   * Count of failed transactions
   */
  failureCount: number;

  /**
   * Count of duplicate transactions
   */
  duplicateCount: number;

  /**
   * Results for each transaction
   */
  results: Array<{
    /**
     * Status of the transaction (success, failed, duplicate)
     */
    status: string;

    /**
     * Index of the transaction in the batch
     */
    index: number;

    /**
     * Result of the transaction if successful
     */
    result?: any;

    /**
     * Error information if failed
     */
    error?: any;
  }>;

  /**
   * Unique batch ID
   */
  batchId: string;
}

/**
 * Creates a batch of related transactions
 *
 * This function processes multiple transactions as a single batch
 * with controlled concurrency, error handling, and recovery.
 *
 * @returns Promise resolving to the batch result
 *
 * @example
 * ```typescript
 * // Create a batch of related transactions
 * const transactions = [
 *   createDepositTransaction('external/USD', 'acc_1', 1000, 'USD'),
 *   createTransferTransaction('acc_1', 'acc_2', 500, 'USD'),
 *   createTransferTransaction('acc_1', 'acc_3', 300, 'USD')
 * ];
 *
 * const result = await createTransactionBatch(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   transactions,
 *   {
 *     concurrency: 2,
 *     batchMetadata: { batchSource: 'monthly-processing', category: 'payroll' },
 *     onTransactionSuccess: (tx, index, result) => {
 *       console.log(`Transaction ${index + 1}/${transactions.length} completed: ${result.id}`);
 *     }
 *   }
 * );
 *
 * console.log(`Batch completed: ${result.successCount} successful, ${result.failureCount} failed`);
 * ```
 */
export async function createTransactionBatch(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  transactions: CreateTransactionInput[],
  options: TransactionBatchOptions = {}
): Promise<TransactionBatchResult> {
  // Generate batch ID
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Merge options with defaults
  const mergedOptions: Required<TransactionBatchOptions> = {
    concurrency: options.concurrency ?? 3,
    useEnhancedRecovery: options.useEnhancedRecovery ?? true,
    maxRetries: options.maxRetries ?? 2,
    stopOnError: options.stopOnError ?? false,
    onTransactionSuccess:
      options.onTransactionSuccess ??
      (() => {
        /* empty success handler */
      }),
    onTransactionError:
      options.onTransactionError ??
      (() => {
        /* empty error handler */
      }),
    batchMetadata: {
      batchId,
      createdAt: new Date().toISOString(),
      ...options.batchMetadata,
    },
    delayBetweenTransactions: options.delayBetweenTransactions ?? 0,
  };

  // Initialize result
  const result: TransactionBatchResult = {
    successCount: 0,
    failureCount: 0,
    duplicateCount: 0,
    results: [],
    batchId,
  };

  // Prepare transactions with batch metadata
  const preparedTransactions = transactions.map((tx) => ({
    ...tx,
    metadata: {
      ...tx.metadata,
      ...mergedOptions.batchMetadata,
    },
  }));

  // Process transactions with worker pool for concurrency control
  const batchResults = await workerPool(
    preparedTransactions,
    async (transaction, index) => {
      try {
        // Use either enhanced or standard error recovery
        const txResult = mergedOptions.useEnhancedRecovery
          ? await executeTransactionWithRecovery(() =>
              client.entities.transactions.createTransaction(organizationId, ledgerId, transaction)
            )
          : await executeTransaction(
              () =>
                client.entities.transactions.createTransaction(
                  organizationId,
                  ledgerId,
                  transaction
                ),
              { maxRetries: mergedOptions.maxRetries }
            );

        // Handle different result statuses
        if (txResult.status === 'success') {
          result.successCount++;
          mergedOptions.onTransactionSuccess(transaction, index, txResult.result);
        } else if (txResult.status === 'duplicate') {
          result.duplicateCount++;
          // Consider duplicates as success in the UI but track separately
          mergedOptions.onTransactionSuccess(
            transaction,
            index,
            txResult.result || { id: 'duplicate' }
          );
        } else {
          result.failureCount++;
          mergedOptions.onTransactionError(transaction, index, txResult.error);
        }

        return {
          status: txResult.status,
          index,
          result: txResult.result,
          error: txResult.error,
        };
      } catch (error) {
        // Handle any unexpected errors
        result.failureCount++;
        mergedOptions.onTransactionError(transaction, index, error);

        return {
          status: 'failed',
          index,
          error,
        };
      } finally {
        // Add delay between transactions if specified
        if (mergedOptions.delayBetweenTransactions > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, mergedOptions.delayBetweenTransactions)
          );
        }
      }
    },
    {
      concurrency: mergedOptions.concurrency,
      continueOnError: !mergedOptions.stopOnError,
    }
  );

  // Add detailed results
  result.results = batchResults;

  return result;
}

/**
 * Creates a batch of related deposit transactions
 *
 * This function creates deposit transactions for multiple accounts
 * with the same external source and asset.
 *
 * @returns Promise resolving to the batch result
 *
 * @example
 * ```typescript
 * // Deposit funds to multiple accounts
 * const destinationAccounts = ['acc_1', 'acc_2', 'acc_3', 'acc_4'];
 *
 * const result = await createDepositBatch(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   'external/USD',
 *   destinationAccounts,
 *   1000,
 *   'USD',
 *   {
 *     batchMetadata: { purpose: 'initial-funding' }
 *   }
 * );
 *
 * console.log(`Deposited to ${result.successCount} accounts`);
 * ```
 */
export async function createDepositBatch(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  sourceAccountId: string,
  destinationAccountIds: string[],
  amount: number,
  assetCode: string,
  options: TransactionBatchOptions = {}
): Promise<TransactionBatchResult> {
  // Create deposit transactions for each destination account
  const transactions = destinationAccountIds.map((destinationId) => ({
    chartOfAccountsGroupName: 'default',
    description: `Batch deposit to ${destinationId}`,
    operations: [
      {
        accountId: sourceAccountId.startsWith('@') ? sourceAccountId : `@external/${assetCode}`,
        type: 'DEBIT' as const, // Type assertion using as const
        amount: amount.toString(),
        assetCode,
      },
      {
        accountId: destinationId,
        type: 'CREDIT' as const, // Type assertion using as const
        amount: amount.toString(),
        assetCode,
      },
    ],
    metadata: {
      transactionType: 'deposit',
      ...(options.batchMetadata || {}),
    },
  }));

  // Process as a batch
  return createTransactionBatch(
    client,
    organizationId,
    ledgerId,
    transactions as CreateTransactionInput[],
    options
  );
}

/**
 * Creates a batch of related transfer transactions
 *
 * This function creates transfer transactions between pairs of accounts.
 *
 * @returns Promise resolving to the batch result
 *
 * @example
 * ```typescript
 * // Create multiple transfers between accounts
 * const accountPairs = [
 *   { source: 'acc_main', destination: 'acc_user1' },
 *   { source: 'acc_main', destination: 'acc_user2' },
 *   { source: 'acc_main', destination: 'acc_user3' }
 * ];
 *
 * const amounts = [150, 225, 300];
 *
 * const result = await createTransferBatch(
 *   client,
 *   'org_123',
 *   'ledger_456',
 *   accountPairs,
 *   amounts,
 *   'USD',
 *   {
 *     batchMetadata: { purpose: 'salary-payments' }
 *   }
 * );
 *
 * console.log(`Completed ${result.successCount} transfers`);
 * ```
 */
export async function createTransferBatch(
  client: MidazClient,
  organizationId: string,
  ledgerId: string,
  accountPairs: Array<{ source: string; destination: string }>,
  amounts: number[],
  assetCode: string,
  options: TransactionBatchOptions = {}
): Promise<TransactionBatchResult> {
  if (accountPairs.length !== amounts.length) {
    throw new Error('Number of account pairs must match number of amounts');
  }

  // Create transfer transactions for each account pair
  const transactions = accountPairs.map((pair, index) => ({
    chartOfAccountsGroupName: 'default',
    description: `Batch transfer from ${pair.source} to ${pair.destination}`,
    operations: [
      {
        accountId: pair.source,
        type: 'DEBIT' as const, // Type assertion using as const
        amount: amounts[index].toString(),
        assetCode,
      },
      {
        accountId: pair.destination,
        type: 'CREDIT' as const, // Type assertion using as const
        amount: amounts[index].toString(),
        assetCode,
      },
    ],
    metadata: {
      transactionType: 'transfer',
      ...(options.batchMetadata || {}),
    },
  }));

  // Process as a batch
  return createTransactionBatch(
    client,
    organizationId,
    ledgerId,
    transactions as CreateTransactionInput[],
    options
  );
}
