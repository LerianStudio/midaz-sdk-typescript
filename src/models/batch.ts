/**
 */

import {
  TransactionBatchOptions,
} from './transaction-batch';

/**
 * Batch class compatible with the workflow example
 */
export class TransactionBatch {
  private transactions: Array<() => Promise<any>> = [];
  private options: TransactionBatchOptions;

  constructor(options: TransactionBatchOptions = {}) {
    this.options = options;
  }

  /**
   * Add a transaction function to the batch
   */
  add(transactionFn: () => Promise<any>): void {
    this.transactions.push(transactionFn);
  }

  /**
   * Get all transaction functions
   */
  getTransactions(): Array<() => Promise<any>> {
    return this.transactions;
  }

  /**
   * Get the options for this batch
   */
  getOptions(): TransactionBatchOptions {
    return this.options;
  }
}

/**
 * Creates a new transaction batch
 *
 * @returns A new TransactionBatch instance
 */
export function createBatch(options: TransactionBatchOptions = {}): TransactionBatch {
  return new TransactionBatch(options);
}

/**
 * Executes a transaction batch
 *
 * @returns Array of results from the batch execution
 */
export async function executeBatch(batch: TransactionBatch): Promise<any[]> {
  const results: any[] = [];

  for (const txFn of batch.getTransactions()) {
    try {
      const result = await txFn();
      results.push({
        status: 'success',
        result,
      });
    } catch (error) {
      results.push({
        status: 'failed',
        error,
      });
    }
  }

  return results;
}
