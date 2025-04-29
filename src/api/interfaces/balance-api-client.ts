/**
 */

import { Balance, UpdateBalanceInput } from '../../models/balance';
import { ListOptions, ListResponse } from '../../models/common';

import { ApiClient } from './api-client';

/**
 * Interface for balance API operations
 *
 * This interface defines the methods for interacting with balance endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface BalanceApiClient extends ApiClient<Balance, never, UpdateBalanceInput> {
  /**
   * Lists balances for a ledger with optional filters
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listBalances(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Balance>>;

  /**
   * Lists balances for a specific account
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: ListOptions
  ): Promise<ListResponse<Balance>>;

  /**
   * Gets a balance by ID
   *
   * @returns Promise resolving to the balance
   */
  getBalance(orgId: string, ledgerId: string, id: string): Promise<Balance>;

  /**
   * Updates an existing balance
   *
   * @returns Promise resolving to the updated balance
   */
  updateBalance(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateBalanceInput
  ): Promise<Balance>;

  /**
   * Deletes a balance
   *
   * @returns Promise resolving when the balance is deleted
   */
  deleteBalance(orgId: string, ledgerId: string, id: string): Promise<void>;
}
