/**
 * Transaction service interface - Defines the interface for managing transactions
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateTransactionInput, Transaction } from '../models/transaction';

/**
 * Service for managing transactions
 *
 * Transactions represent financial events that affect account balances
 * and are the core of the double-entry accounting system.
 *
 * @example
 * ```typescript
 * // Create a new transaction
 * const newTransaction = await midazClient.entities.transactions.createTransaction(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     type: "transfer",
 *     operations: [
 *       {
 *         accountId: "acc_source",
 *         amount: 100,
 *         type: "debit"
 *       },
 *       {
 *         accountId: "acc_destination",
 *         amount: 100,
 *         type: "credit"
 *       }
 *     ]
 *   }
 * );
 * ```
 */
export interface TransactionsService {
  /**
   * Lists transactions with optional filters
   *
   * @returns Promise resolving to a paginated list of transactions
   */
  listTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Transaction>>;

  /**
   * Gets a transaction by ID
   *
   * @returns Promise resolving to the transaction
   */
  getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction>;

  /**
   * Creates a new transaction
   *
   * Creates a transaction that follows double-entry accounting principles
   * (debits equal credits). Once created, transactions cannot be updated
   * or deleted to maintain ledger integrity.
   *
   * @returns Promise resolving to the created transaction
   */
  createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction>;

  /**
   * Creates a paginator for iterating through transactions
   *
   * @returns Transaction paginator instance
   */
  getTransactionPaginator(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): TransactionPaginator;

  /**
   * Iterates through all transactions
   *
   * Returns an async generator that yields pages of transactions, automatically
   * handling pagination.
   *
   * @returns Async generator yielding pages of transactions
   */
  iterateTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): AsyncGenerator<Transaction[], void, unknown>;

  /**
   * Gets all transactions (convenience method that handles pagination)
   *
   * Retrieves all transactions matching the specified criteria, automatically
   * handling pagination.
   *
   * @returns Promise resolving to all transactions
   */
  getAllTransactions(orgId: string, ledgerId: string, opts?: ListOptions): Promise<Transaction[]>;
}

/**
 * Interface for paginating through transactions
 *
 * Provides methods for iterating through pages of transactions,
 * allowing for efficient processing of large result sets.
 *
 * @example
 * ```typescript
 * // Create a paginator
 * const paginator = transactionsService.getTransactionPaginator(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 50 }
 * );
 *
 * // Process all pages
 * while (await paginator.hasNext()) {
 *   const transactions = await paginator.next();
 *   // Process the page of transactions
 * }
 *
 * // Or use convenience methods
 * const allTransactions = await paginator.getAllTransactions();
 *
 * // Or categorize transactions
 * const categories = await paginator.categorizeTransactions(
 *   async (transaction, category) => {
 *     console.log(`Transaction ${transaction.id} is in category: ${category}`);
 *   }
 * );
 * ```
 */
export interface TransactionPaginator {
  /**
   * Checks if there are more transactions to retrieve
   *
   * @returns Promise resolving to true if there are more transactions
   */
  hasNext(): Promise<boolean>;

  /**
   * Gets the next page of transactions
   *
   * @returns Promise resolving to the next page of transactions
   */
  next(): Promise<Transaction[]>;

  /**
   * Gets the current page of transactions
   *
   * @returns Promise resolving to the current page of transactions
   */
  getCurrentPage(): Promise<Transaction[]>;

  /**
   * Gets all remaining transactions
   *
   * @returns Promise resolving to all transactions
   */
  getAllTransactions(): Promise<Transaction[]>;

  /**
   * Process transactions by category
   *
   * @returns Map of categories to transaction counts
   */
  categorizeTransactions(
    categoryHandler: (transaction: Transaction, category: string) => Promise<void>
  ): Promise<Map<string, number>>;
}
