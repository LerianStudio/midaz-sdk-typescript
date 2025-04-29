/**
 * Balance service interface - Defines the interface for managing account balances
 */

import { Balance, UpdateBalanceInput } from '../models/balance';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing balances
 *
 * Provides methods for retrieving, updating, and managing
 * account balances within an organization and ledger.
 *
 * @example
 * ```typescript
 * // List balances in a ledger
 * const balances = await midazClient.entities.balances.listBalances(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface BalancesService {
  /**
   * Lists balances for a ledger with optional filters
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listBalances(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Balance>>;

  /**
   * Lists balances for a specific account
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
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
