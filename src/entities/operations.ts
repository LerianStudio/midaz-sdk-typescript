/**
 * @file Operation service interface for the Midaz SDK
 * @description Defines the interface for managing operations within the Midaz ledger system
 */

import { ListOptions, ListResponse } from '../models/common';
import { Operation } from '../models/transaction';

/**
 * Service for managing operations in the Midaz system
 *
 * The OperationsService provides methods for retrieving and managing operations
 * within a specific organization, ledger, and account. Operations are the individual
 * entries that make up transactions and represent the actual debits and credits to accounts.
 *
 * Each operation:
 * - Belongs to a specific transaction
 * - Affects a specific account
 * - Has a type (debit or credit)
 * - Has an amount
 * - Is immutable once created (with limited metadata updates)
 * - Has a unique identifier
 *
 * @example
 * ```typescript
 * // List operations for an account
 * const operations = await midazClient.entities.operations.listOperations(
 *   "org_12345",
 *   "ldg_67890",
 *   "acc_abcdef",
 *   { limit: 10, offset: 0 }
 * );
 *
 * // Get a specific operation
 * const operation = await midazClient.entities.operations.getOperation(
 *   "org_12345",
 *   "ldg_67890",
 *   "acc_abcdef",
 *   "op_123456"
 * );
 * ```
 */
export interface OperationsService {
  /**
   * Lists operations for an account with optional filters
   *
   * Retrieves a paginated list of operations for a specific account within the
   * specified organization and ledger. The results can be filtered, sorted, and
   * paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of operations
   *
   * @example
   * ```typescript
   * // List the first 10 operations for an account
   * const operations = await operationsService.listOperations(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List operations with filtering
   * const filteredOperations = await operationsService.listOperations(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     limit: 20,
   *     filter: {
   *       type: "debit",
   *       createdAt: { gte: "2023-01-01T00:00:00Z" }
   *     }
   *   }
   * );
   *
   * // List operations with sorting
   * const sortedOperations = await operationsService.listOperations(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "amount",
   *       order: "DESC"
   *     }
   *   }
   * );
   * ```
   */
  listOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Operation>>;

  /**
   * Gets an operation by ID
   *
   * Retrieves a single operation by its unique identifier within the specified
   * organization, ledger, and account. Optionally, a transaction ID can be provided
   * to narrow down the search.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID that contains the operation
   * @param operationId - Operation ID to retrieve
   * @param transactionId - Optional transaction ID that contains the operation
   * @returns Promise resolving to the operation
   *
   * @example
   * ```typescript
   * // Get operation details
   * const operation = await operationsService.getOperation(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   "op_123456"
   * );
   *
   * console.log(`Operation type: ${operation.type}`);
   * console.log(`Amount: ${operation.amount}`);
   * console.log(`Transaction ID: ${operation.transactionId}`);
   * console.log(`Created at: ${operation.createdAt}`);
   *
   * // Get operation with transaction ID
   * const operation = await operationsService.getOperation(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   "op_123456",
   *   "txn_789012"
   * );
   * ```
   */
  getOperation(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string,
    transactionId?: string
  ): Promise<Operation>;

  /**
   * Updates an existing operation
   *
   * Updates the metadata of an existing operation within the specified
   * organization, ledger, and account. Note that most operation properties
   * are immutable once created to maintain the integrity of the ledger.
   * Typically, only metadata fields can be updated.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID that contains the operation
   * @param operationId - Operation ID to update
   * @param input - Operation update input with properties to change
   * @returns Promise resolving to the updated operation
   *
   * @example
   * ```typescript
   * // Update operation metadata
   * const updatedOperation = await operationsService.updateOperation(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   "op_123456",
   *   {
   *     metadata: {
   *       category: "Salary",
   *       description: "Monthly salary payment",
   *       reference: "PAY-2025-04"
   *     }
   *   }
   * );
   *
   * console.log(`Updated operation metadata: ${JSON.stringify(updatedOperation.metadata)}`);
   * ```
   */
  updateOperation(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string,
    input: Record<string, any>
  ): Promise<Operation>;

  /**
   * Gets an operation paginator for iterating through operations
   *
   * Creates a paginator object that can be used to iterate through operations
   * page by page. This is useful for processing large numbers of operations
   * without loading them all into memory at once.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Operation paginator for iterating through operations
   *
   * @example
   * ```typescript
   * // Create a paginator for operations
   * const paginator = operationsService.getOperationPaginator(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     limit: 100,
   *     filter: {
   *       type: "credit"
   *     }
   *   }
   * );
   *
   * // Iterate through pages of operations
   * while (await paginator.hasNext()) {
   *   const operations = await paginator.next();
   *   console.log(`Processing ${operations.length} operations...`);
   *
   *   // Process each operation in the page
   *   for (const operation of operations) {
   *     // Do something with the operation
   *     console.log(`Operation ID: ${operation.id}, Amount: ${operation.amount}`);
   *   }
   * }
   * ```
   */
  getOperationPaginator(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): OperationPaginator;

  /**
   * Iterates through all operations
   *
   * Returns an async generator that yields pages of operations, automatically
   * handling pagination. This is useful for processing large numbers of operations
   * using modern JavaScript async iteration.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for sorting and filtering
   * @returns Async generator yielding pages of operations
   *
   * @example
   * ```typescript
   * // Iterate through all operations using for-await-of
   * const generator = operationsService.iterateOperations(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     filter: {
   *       createdAt: { gte: "2023-01-01T00:00:00Z" }
   *     }
   *   }
   * );
   *
   * // Process each page of operations
   * for await (const operationPage of generator) {
   *   console.log(`Processing ${operationPage.length} operations...`);
   *
   *   // Process each operation in the page
   *   for (const operation of operationPage) {
   *     // Do something with the operation
   *     console.log(`Operation ID: ${operation.id}, Amount: ${operation.amount}`);
   *   }
   * }
   * ```
   */
  iterateOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): AsyncGenerator<Operation[], void, unknown>;

  /**
   * Gets all operations (convenience method that handles pagination)
   *
   * Retrieves all operations for a specific account matching the specified criteria,
   * automatically handling pagination. This is a convenience method that loads all
   * matching operations into memory at once.
   *
   * Note: For large result sets, consider using getOperationPaginator() or
   * iterateOperations() instead to avoid memory issues.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for sorting and filtering
   * @returns Promise resolving to all operations
   *
   * @example
   * ```typescript
   * // Get all operations for a specific date range
   * const allOperations = await operationsService.getAllOperations(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
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
   * console.log(`Found ${allOperations.length} operations`);
   *
   * // Calculate total amount
   * const totalDebit = allOperations
   *   .filter(op => op.type === 'debit')
   *   .reduce((sum, op) => sum + op.amount, 0);
   *
   * const totalCredit = allOperations
   *   .filter(op => op.type === 'credit')
   *   .reduce((sum, op) => sum + op.amount, 0);
   *
   * console.log(`Total debit: ${totalDebit}, Total credit: ${totalCredit}`);
   * ```
   */
  getAllOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): Promise<Operation[]>;
}

/**
 * Interface for paginating through operations
 *
 * The OperationPaginator provides methods for iterating through pages of
 * operations, allowing for efficient processing of large result sets.
 *
 * @example
 * ```typescript
 * // Create a paginator
 * const paginator = operationsService.getOperationPaginator(
 *   "org_12345",
 *   "ldg_67890",
 *   "acc_abcdef",
 *   { limit: 50 }
 * );
 *
 * // Process all pages
 * while (await paginator.hasNext()) {
 *   const operations = await paginator.next();
 *   // Process the page of operations
 * }
 * ```
 */
export interface OperationPaginator {
  /**
   * Checks if there are more operations to retrieve
   *
   * Determines if there are additional pages of operations available.
   * Returns true if there are more operations to retrieve, false otherwise.
   *
   * @returns Promise resolving to true if there are more operations
   *
   * @example
   * ```typescript
   * // Check if there are more operations
   * if (await paginator.hasNext()) {
   *   console.log("More operations available");
   * } else {
   *   console.log("No more operations");
   * }
   * ```
   */
  hasNext(): Promise<boolean>;

  /**
   * Gets the next page of operations
   *
   * Retrieves the next page of operations based on the pagination settings.
   * If there are no more operations, returns an empty array.
   *
   * @returns Promise resolving to the next page of operations
   *
   * @example
   * ```typescript
   * // Get the next page of operations
   * const operations = await paginator.next();
   * console.log(`Retrieved ${operations.length} operations`);
   *
   * // Process each operation in the page
   * for (const operation of operations) {
   *   console.log(`Operation ID: ${operation.id}, Amount: ${operation.amount}`);
   * }
   * ```
   */
  next(): Promise<Operation[]>;
}
