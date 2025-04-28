/**
 * @file Batch interface compatible with the workflow example
 * @description Simple wrapper around transaction-batch for compatibility
 */

import { MidazClient as _MidazClient } from '../client';
import { createTransactionBatch as _createTransactionBatch, TransactionBatchResult as _TransactionBatchResult, TransactionBatchOptions } from './transaction-batch';
import { CreateTransactionInput as _CreateTransactionInput } from './transaction';

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
 * @param options - Batch options
 * @returns A new TransactionBatch instance
 */
export function createBatch(options: TransactionBatchOptions = {}): TransactionBatch {
  return new TransactionBatch(options);
}

/**
 * Executes a transaction batch
 * 
 * @param batch - The transaction batch to execute
 * @returns Array of results from the batch execution
 */
export async function executeBatch(batch: TransactionBatch): Promise<any[]> {
  const results: any[] = [];
  
  for (const txFn of batch.getTransactions()) {
    try {
      const result = await txFn();
      results.push({ 
        status: 'success', 
        result
      });
    } catch (error) {
      results.push({ 
        status: 'failed',
        error
      });
    }
  }
  
  return results;
}