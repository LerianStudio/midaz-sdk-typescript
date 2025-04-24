/**
 * @file Transaction API client interface
 * @description Defines the interface for transaction API operations
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreateTransactionInput, Transaction } from '../../models/transaction';

import { ApiClient } from './api-client';

/**
 * Interface for transaction API operations
 *
 * This interface defines the methods for interacting with transaction endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface TransactionApiClient
  extends ApiClient<Transaction, CreateTransactionInput, never> {
  /**
   * Lists transactions for a specific organization and ledger
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of transactions
   */
  listTransactions(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Transaction>>;

  /**
   * Gets a transaction by ID
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Transaction ID
   * @returns Promise resolving to the transaction
   */
  getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction>;

  /**
   * Creates a new transaction
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Transaction creation input
   * @returns Promise resolving to the created transaction
   */
  createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction>;
}
