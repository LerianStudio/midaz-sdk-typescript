/**
 * Transaction Route API Client Interface
 */

import { ApiClient } from './api-client';
import {
  TransactionRoute,
  CreateTransactionRouteInput,
  UpdateTransactionRouteInput,
} from '../../models/transaction-route';
import { PaginatedResponse, ListOptions } from '../../models/common';

/**
 * Interface for Transaction Route API operations
 */
export interface TransactionRouteApiClient
  extends ApiClient<TransactionRoute, CreateTransactionRouteInput, UpdateTransactionRouteInput> {
  /**
   * Retrieve a paginated list of transaction routes for a ledger
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated transaction routes
   */
  listTransactionRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<TransactionRoute>>;

  /**
   * Retrieve a specific transaction route by ID
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID
   * @returns Promise resolving to the transaction route
   */
  getTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<TransactionRoute>;

  /**
   * Create a new transaction route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param input - The transaction route creation data
   * @returns Promise resolving to the created transaction route
   */
  createTransactionRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateTransactionRouteInput
  ): Promise<TransactionRoute>;

  /**
   * Update an existing transaction route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID to update
   * @param input - The transaction route update data
   * @returns Promise resolving to the updated transaction route
   */
  updateTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string,
    input: UpdateTransactionRouteInput
  ): Promise<TransactionRoute>;

  /**
   * Delete a transaction route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID to delete
   * @returns Promise resolving when the transaction route is deleted
   */
  deleteTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<void>;
}
