/**
 * Transaction service interface - Defines the interface for managing transactions
 */

import { ListOptions, ListResponse } from '../models/common';
import {
  BlockFundsInput,
  CreateAnnotationInput,
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  RevertTransactionOptions,
  Transaction,
  TransactionStateTransitionOptions,
  UnblockFundsInput,
  UpdateTransactionInput,
} from '../models/transaction';

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
   * Patches the description and metadata of an existing transaction
   *
   * Only these two fields are patchable; the endpoint refuses any other key. The
   * operations, amounts and status of a transaction stay immutable, so a booked
   * movement is still corrected by a revert rather than an edit.
   *
   * Two behaviours are surprising enough to plan around:
   *
   * - `metadata` **merges**. `{only: 'this'}` patched over `{n: 7, patched: 'yes'}`
   *   leaves all three keys. Mapping a key to `null` removes it; there is no way to
   *   replace the whole map in one call.
   * - `description: ''` is **ignored**, so a description can be changed but never
   *   cleared.
   *
   * The SDK sends the patch exactly as given. It deliberately does not read the
   * transaction first to emulate replace semantics, because the read and the write
   * would race any concurrent patch.
   *
   * @returns Promise resolving to the patched transaction
   */
  updateTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction>;

  /**
   * Creates an inflow, funding accounts from outside the ledger
   *
   * The ledger synthesizes the debit from `@external/{asset}`, so the input carries a
   * `distribute` only. Inflows are never pending.
   *
   * @returns Promise resolving to the created transaction
   */
  createInflow(orgId: string, ledgerId: string, input: CreateInflowInput): Promise<Transaction>;

  /**
   * Creates an outflow, moving funds out of the ledger
   *
   * The ledger synthesizes the credit to `@external/{asset}`, so the input carries a
   * `source` only. Unlike inflows, outflows support `pending`.
   *
   * @returns Promise resolving to the created transaction
   */
  createOutflow(orgId: string, ledgerId: string, input: CreateOutflowInput): Promise<Transaction>;

  /**
   * Blocks funds by moving them and labelling the operations `BLOCK`
   *
   * Balances move exactly as they would for a plain transfer; only the persisted
   * operation type differs. The endpoint takes the full transaction body but does not
   * honour `pending`, which it forces to false.
   *
   * @returns Promise resolving to the created transaction
   */
  blockFunds(orgId: string, ledgerId: string, input: BlockFundsInput): Promise<Transaction>;

  /**
   * Unblocks funds, the mirror of `blockFunds`, labelling the operations `UNBLOCK`
   *
   * @returns Promise resolving to the created transaction
   */
  unblockFunds(orgId: string, ledgerId: string, input: UnblockFundsInput): Promise<Transaction>;

  /**
   * Creates an annotation: a transaction that records intent and moves no money
   *
   * The ledger forces status `NOTED` and writes operations carrying
   * `amount.value: "0"` with `balanceAffected: false`, so every balance stays exactly
   * as it was. `NOTED` is terminal — a subsequent commit or revert returns `409/0099`,
   * so an annotation must not be used as the first leg of a two-phase flow.
   *
   * @returns Promise resolving to the created transaction
   */
  createAnnotation(
    orgId: string,
    ledgerId: string,
    input: CreateAnnotationInput
  ): Promise<Transaction>;

  /**
   * Commits a pending transaction, settling the funds held since it was created
   *
   * Legal only from `PENDING`. A second commit on an already-committed transaction
   * returns a terminal `0486` conflict, which the SDK never retries.
   *
   * @returns Promise resolving to the committed transaction
   */
  commitTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction>;

  /**
   * Cancels a pending transaction, releasing the funds held since it was created
   *
   * Legal only from `PENDING`, and produces a single `RELEASE` operation on the source.
   *
   * @returns Promise resolving to the canceled transaction
   */
  cancelTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction>;

  /**
   * Reverts an approved transaction by creating its mirror image
   *
   * Legal only from `APPROVED`. The result is a new transaction carrying
   * `parentTransactionId` with the legs swapped, not the reverted one.
   *
   * @returns Promise resolving to the reversing transaction
   */
  revertTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: RevertTransactionOptions
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
