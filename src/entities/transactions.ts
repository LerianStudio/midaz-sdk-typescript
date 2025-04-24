/**
 * @file Transaction service interface for the Midaz SDK
 * @description Defines the interface for managing transactions within the Midaz ledger system
 */

import { ListOptions, ListResponse } from '../models/common';
import { CreateTransactionInput, Transaction } from '../models/transaction';

/**
 * Service for managing transactions in the Midaz system
 *
 * The TransactionsService provides methods for creating, retrieving, and listing
 * transactions within a specific organization and ledger. Transactions represent
 * financial events that affect account balances and are the core of the double-entry
 * accounting system.
 *
 * Each transaction:
 * - Belongs to a specific organization and ledger
 * - Contains one or more operations (debits and credits)
 * - Must be balanced (total debits equal total credits)
 * - Has a specific type (e.g., transfer, payment, deposit)
 * - Is immutable once created (cannot be updated or deleted)
 * - Has a unique identifier and timestamp
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
 *
 * // List transactions in a ledger
 * const transactions = await midazClient.entities.transactions.listTransactions(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface TransactionsService {
  /**
   * Lists transactions with optional filters
   *
   * Retrieves a paginated list of transactions within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of transactions
   *
   * @example
   * ```typescript
   * // List the first 10 transactions in a ledger
   * const transactions = await transactionsService.listTransactions(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List transactions with filtering
   * const filteredTransactions = await transactionsService.listTransactions(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       type: "transfer",
   *       createdAt: { gte: "2023-01-01T00:00:00Z" }
   *     }
   *   }
   * );
   *
   * // List transactions with sorting
   * const sortedTransactions = await transactionsService.listTransactions(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "createdAt",
   *       order: "DESC"
   *     }
   *   }
   * );
   * ```
   */
  listTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Transaction>>;

  /**
   * Gets a transaction by ID
   *
   * Retrieves a single transaction by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the transaction
   * @param ledgerId - Ledger ID that contains the transaction
   * @param id - Transaction ID to retrieve
   * @returns Promise resolving to the transaction
   *
   * @example
   * ```typescript
   * // Get transaction details
   * const transaction = await transactionsService.getTransaction(
   *   "org_12345",
   *   "ldg_67890",
   *   "txn_abcdef"
   * );
   *
   * console.log(`Transaction type: ${transaction.type}`);
   * console.log(`Amount: ${transaction.amount}`);
   * console.log(`Created at: ${transaction.createdAt}`);
   * console.log(`Operations: ${transaction.operations.length}`);
   * ```
   */
  getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction>;

  /**
   * Creates a new transaction
   *
   * Creates a new transaction within the specified organization and ledger using
   * the provided transaction details. The transaction will be validated to ensure
   * it follows double-entry accounting principles (debits equal credits) before
   * being created.
   *
   * Once created, transactions cannot be updated or deleted to maintain the
   * integrity of the ledger.
   *
   * @param orgId - Organization ID that will own the transaction
   * @param ledgerId - Ledger ID that will contain the transaction
   * @param input - Transaction creation input with required properties
   * @returns Promise resolving to the created transaction
   *
   * @example
   * ```typescript
   * // Create a simple transfer transaction
   * const newTransaction = await transactionsService.createTransaction(
   *   "org_12345",
   *   "ldg_67890",
   *   {
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
   *
   * // Create a transaction with metadata
   * const newTransactionWithMetadata = await transactionsService.createTransaction(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     operations: [
   *       {
   *         accountId: "acc_payable",
   *         amount: 250,
   *         type: "debit"
   *       },
   *       {
   *         accountId: "acc_cash",
   *         amount: 250,
   *         type: "credit"
   *       }
   *     ],
   *     metadata: {
   *       invoiceNumber: "INV-12345",
   *       paymentMethod: "bank_transfer",
   *       description: "Payment for services rendered"
   *     }
   *   }
   * );
   * ```
   */
  createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction>;

  /**
   * Gets a transaction paginator for iterating through transactions
   *
   * Creates a paginator object that can be used to iterate through transactions
   * page by page. This is useful for processing large numbers of transactions
   * without loading them all into memory at once.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Transaction paginator for iterating through transactions
   *
   * @example
   * ```typescript
   * // Create a paginator for transactions
   * const paginator = transactionsService.getTransactionPaginator(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 100,
   *     filter: {
   *       type: "transfer"
   *     }
   *   }
   * );
   *
   * // Iterate through pages of transactions
   * while (await paginator.hasNext()) {
   *   const transactions = await paginator.next();
   *   console.log(`Processing ${transactions.length} transactions...`);
   *
   *   // Process each transaction in the page
   *   for (const transaction of transactions) {
   *     // Do something with the transaction
   *     console.log(`Transaction ID: ${transaction.id}`);
   *   }
   * }
   * ```
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
   * handling pagination. This is useful for processing large numbers of transactions
   * using modern JavaScript async iteration.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for sorting and filtering
   * @returns Async generator yielding pages of transactions
   *
   * @example
   * ```typescript
   * // Iterate through all transactions using for-await-of
   * const generator = transactionsService.iterateTransactions(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     filter: {
   *       createdAt: { gte: "2023-01-01T00:00:00Z" }
   *     }
   *   }
   * );
   *
   * // Process each page of transactions
   * for await (const transactionPage of generator) {
   *   console.log(`Processing ${transactionPage.length} transactions...`);
   *
   *   // Process each transaction in the page
   *   for (const transaction of transactionPage) {
   *     // Do something with the transaction
   *     console.log(`Transaction ID: ${transaction.id}`);
   *   }
   * }
   * ```
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
   * handling pagination. This is a convenience method that loads all matching
   * transactions into memory at once.
   *
   * Note: For large result sets, consider using getTransactionPaginator() or
   * iterateTransactions() instead to avoid memory issues.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for sorting and filtering
   * @returns Promise resolving to all transactions
   *
   * @example
   * ```typescript
   * // Get all transactions for a specific date range
   * const allTransactions = await transactionsService.getAllTransactions(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     filter: {
   *       createdAt: {
   *         gte: "2023-01-01T00:00:00Z",
   *         lte: "2023-01-31T23:59:59Z"
   *       }
   *     }
   *   }
   * );
   *
   * console.log(`Found ${allTransactions.length} transactions`);
   *
   * // Process all transactions
   * const totalAmount = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
   * console.log(`Total amount: ${totalAmount}`);
   * ```
   */
  getAllTransactions(orgId: string, ledgerId: string, opts?: ListOptions): Promise<Transaction[]>;
}

/**
 * Interface for paginating through transactions
 *
 * The TransactionPaginator provides methods for iterating through pages of
 * transactions, allowing for efficient processing of large result sets.
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
 * ```
 */
export interface TransactionPaginator {
  /**
   * Checks if there are more transactions to retrieve
   *
   * Determines if there are additional pages of transactions available.
   * Returns true if there are more transactions to retrieve, false otherwise.
   *
   * @returns Promise resolving to true if there are more transactions
   *
   * @example
   * ```typescript
   * // Check if there are more transactions
   * if (await paginator.hasNext()) {
   *   console.log("More transactions available");
   * } else {
   *   console.log("No more transactions");
   * }
   * ```
   */
  hasNext(): Promise<boolean>;

  /**
   * Gets the next page of transactions
   *
   * Retrieves the next page of transactions based on the pagination settings.
   * If there are no more transactions, returns an empty array.
   *
   * @returns Promise resolving to the next page of transactions
   *
   * @example
   * ```typescript
   * // Get the next page of transactions
   * const transactions = await paginator.next();
   * console.log(`Retrieved ${transactions.length} transactions`);
   *
   * // Process each transaction in the page
   * for (const transaction of transactions) {
   *   console.log(`Transaction ID: ${transaction.id}`);
   * }
   * ```
   */
  next(): Promise<Transaction[]>;
}
