/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import { Operation } from '../../models/transaction';

import { ApiClient } from './api-client';

/**
 * Interface for operation API operations
 *
 * This interface defines the methods for interacting with operation endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface OperationApiClient extends ApiClient<Operation, never, Record<string, any>> {
  /**
   * Lists operations for a specific organization, ledger, and account
   *
   * @returns Promise resolving to a paginated list of operations
   */
  listOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: ListOptions
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
}
