/**
 * Operation service interface - Defines the interface for managing operations
 */

import { ListOptions, ListResponse } from '../models/common';
import { Operation } from '../models/transaction';

/**
 * Service for managing operations
 *
 * Operations are the individual entries that make up transactions
 * and represent the actual debits and credits to accounts.
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
 * ```
 */
export interface OperationsService {
  /**
   * Lists operations for an account with optional filters
   *
   * @returns Promise resolving to a paginated list of operations
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
   * @returns Promise resolving to the operation
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
   * @returns Promise resolving to the updated operation
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
   * @returns Operation paginator for iterating through operations
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
   * @returns Async generator yielding pages of operations
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
   * @returns Promise resolving to all operations
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
 * Provides methods for iterating through pages of operations,
 * allowing for efficient processing of large result sets.
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
 * ```
 */
export interface OperationPaginator {
  /**
   * Checks if there are more operations to retrieve
   *
   * @returns Promise resolving to true if there are more operations
   */
  hasNext(): Promise<boolean>;

  /**
   * Gets the next page of operations
   *
   * @returns Promise resolving to the next page of operations
   */
  next(): Promise<Operation[]>;
}
