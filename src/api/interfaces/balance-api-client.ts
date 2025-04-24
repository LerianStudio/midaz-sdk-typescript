/**
 * @file Balance API client interface
 * @description Defines the interface for balance API operations
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
   * @param orgId - Organization ID that owns the balances
   * @param ledgerId - Ledger ID that contains the balances
   * @param options - Optional list options for pagination, sorting, and filtering
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
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve balances for
   * @param options - Optional list options for pagination, sorting, and filtering
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
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to retrieve
   * @returns Promise resolving to the balance
   */
  getBalance(orgId: string, ledgerId: string, id: string): Promise<Balance>;

  /**
   * Updates an existing balance
   *
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to update
   * @param input - Balance update input with properties to change
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
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to delete
   * @returns Promise resolving when the balance is deleted
   */
  deleteBalance(orgId: string, ledgerId: string, id: string): Promise<void>;
}
