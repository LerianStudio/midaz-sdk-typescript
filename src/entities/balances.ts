/**
 * @file Balance service interface for the Midaz SDK
 * @description Defines the interface for managing account balances within the Midaz ledger system
 */

import { Balance, UpdateBalanceInput } from '../models/balance';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing balances in the Midaz system
 *
 * The BalancesService provides methods for retrieving, updating, and managing
 * account balances within a specific organization and ledger. Balances represent
 * the current state of value in accounts and are automatically updated when
 * transactions are processed.
 *
 * Each balance:
 * - Belongs to a specific account within an organization and ledger
 * - Tracks the available amount (funds that can be used)
 * - Tracks the on-hold amount (funds that are reserved but not yet settled)
 * - Has a timestamp indicating when it was last updated
 * - Is denominated in the same asset as its associated account
 *
 * @example
 * ```typescript
 * // List balances in a ledger
 * const balances = await midazClient.entities.balances.listBalances(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 *
 * // Get balances for a specific account
 * const accountBalances = await midazClient.entities.balances.listAccountBalances(
 *   "org_12345",
 *   "ldg_67890",
 *   "acc_abcdef"
 * );
 * ```
 */
export interface BalancesService {
  /**
   * Lists balances for a ledger with optional filters
   *
   * Retrieves a paginated list of balances within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the balances
   * @param ledgerId - Ledger ID that contains the balances
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of balances
   *
   * @example
   * ```typescript
   * // List the first 10 balances in a ledger
   * const balances = await balancesService.listBalances(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List balances with filtering
   * const filteredBalances = await balancesService.listBalances(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       availableAmount: { gt: 0 }
   *     }
   *   }
   * );
   *
   * // List balances with sorting
   * const sortedBalances = await balancesService.listBalances(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 10,
   *     sort: {
   *       field: "availableAmount",
   *       order: "DESC"
   *     }
   *   }
   * );
   * ```
   */
  listBalances(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Balance>>;

  /**
   * Lists balances for a specific account
   *
   * Retrieves a paginated list of balances for a specific account within the
   * specified organization and ledger. Most accounts will have only one balance,
   * but some may have multiple balances for different purposes or time periods.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve balances for
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of balances
   *
   * @example
   * ```typescript
   * // List all balances for an account
   * const accountBalances = await balancesService.listAccountBalances(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef"
   * );
   *
   * // Get the total available amount across all balances
   * const totalAvailable = accountBalances.data.reduce(
   *   (sum, balance) => sum + balance.availableAmount,
   *   0
   * );
   *
   * console.log(`Total available: ${totalAvailable}`);
   *
   * // List account balances with filtering
   * const filteredAccountBalances = await balancesService.listAccountBalances(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     filter: {
   *       updatedAt: { gte: "2023-01-01T00:00:00Z" }
   *     }
   *   }
   * );
   * ```
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
   * Retrieves a single balance by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to retrieve
   * @returns Promise resolving to the balance
   *
   * @example
   * ```typescript
   * // Get balance details
   * const balance = await balancesService.getBalance(
   *   "org_12345",
   *   "ldg_67890",
   *   "bal_abcdef"
   * );
   *
   * console.log(`Account ID: ${balance.accountId}`);
   * console.log(`Available amount: ${balance.availableAmount}`);
   * console.log(`On-hold amount: ${balance.onHoldAmount}`);
   * console.log(`Last updated: ${balance.updatedAt}`);
   * ```
   */
  getBalance(orgId: string, ledgerId: string, id: string): Promise<Balance>;

  /**
   * Updates an existing balance
   *
   * Updates the properties of an existing balance within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * Note: In most cases, balances should be updated through transactions
   * rather than direct updates to maintain proper accounting records.
   * This method is primarily for administrative or corrective actions.
   *
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to update
   * @param input - Balance update input with properties to change
   * @returns Promise resolving to the updated balance
   *
   * @example
   * ```typescript
   * // Update a balance's available amount
   * const updatedBalance = await balancesService.updateBalance(
   *   "org_12345",
   *   "ldg_67890",
   *   "bal_abcdef",
   *   {
   *     availableAmount: 1000
   *   }
   * );
   *
   * // Update both available and on-hold amounts
   * const updatedBalance = await balancesService.updateBalance(
   *   "org_12345",
   *   "ldg_67890",
   *   "bal_abcdef",
   *   {
   *     availableAmount: 950,
   *     onHoldAmount: 50
   *   }
   * );
   * ```
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
   * Deletes a balance from the specified organization and ledger.
   * This operation is typically restricted and should be used with caution,
   * as it can affect the integrity of the ledger's accounting records.
   *
   * Note: In most cases, accounts should maintain at least one balance.
   * Consider updating the balance to zero instead of deleting it.
   *
   * @param orgId - Organization ID that owns the balance
   * @param ledgerId - Ledger ID that contains the balance
   * @param id - Balance ID to delete
   * @returns Promise resolving to void when the balance is deleted
   *
   * @example
   * ```typescript
   * // Delete a balance
   * await balancesService.deleteBalance(
   *   "org_12345",
   *   "ldg_67890",
   *   "bal_abcdef"
   * );
   *
   * // Attempt to retrieve the deleted balance (will throw an error)
   * try {
   *   const balance = await balancesService.getBalance(
   *     "org_12345",
   *     "ldg_67890",
   *     "bal_abcdef"
   *   );
   * } catch (error) {
   *   console.error("Balance not found or has been deleted");
   * }
   * ```
   */
  deleteBalance(orgId: string, ledgerId: string, id: string): Promise<void>;
}
