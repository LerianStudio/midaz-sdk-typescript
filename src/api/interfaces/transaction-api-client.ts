/**
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
   * @returns Promise resolving to the transaction
   */
  getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction>;

  /**
   * Creates a new transaction
   *
   * @returns Promise resolving to the created transaction
   */
  createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction>;
}
