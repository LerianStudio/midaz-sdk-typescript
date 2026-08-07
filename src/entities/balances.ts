/**
 * Balance service interface - Defines the interface for managing account balances
 */

import {
  AccountBalanceListOptions,
  AccountBalancePage,
  Balance,
  BalanceHistory,
  CreateBalanceInput,
  UpdateBalanceInput,
} from '../models/balance';
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
   * Lists the balances of one account, one cursor-paginated page at a time
   *
   * This is the only balance listing that truly paginates. `page` and `metadata.*` are
   * absent from the options on purpose: the ledger parses them and discards them.
   *
   * @returns Promise resolving to a page of balances and the cursors around it
   */
  listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: AccountBalanceListOptions
  ): Promise<AccountBalancePage>;

  /**
   * Creates an additional balance on an account, under a key of its own
   *
   * @returns Promise resolving to the created balance
   */
  createAccountBalance(
    orgId: string,
    ledgerId: string,
    accountId: string,
    input: CreateBalanceInput
  ): Promise<Balance>;

  /**
   * Reads every balance of an account as it stood at a point in time
   *
   * The route answers a bare array. `date` is required and must carry a time component;
   * a timestamp preceding a balance's creation is answered `404`.
   *
   * @returns Promise resolving to the snapshots of the account's balances
   */
  listAccountBalanceHistory(
    orgId: string,
    ledgerId: string,
    accountId: string,
    date: string
  ): Promise<BalanceHistory[]>;

  /**
   * Reads one balance as it stood at a point in time
   *
   * The route answers a single snapshot object, not a collection.
   *
   * @returns Promise resolving to the snapshot of the balance
   */
  getBalanceHistory(
    orgId: string,
    ledgerId: string,
    balanceId: string,
    date: string
  ): Promise<BalanceHistory>;

  /**
   * Lists the balances of the account addressed by its alias
   *
   * The alias travels to the ledger raw: path parameters are never percent-decoded
   * there. The route takes no query parameters — the page is capped at 10 server-side —
   * and an unknown alias yields an empty page rather than a 404.
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listAccountBalancesByAlias(
    orgId: string,
    ledgerId: string,
    alias: string
  ): Promise<AccountBalancePage>;

  /**
   * Lists the balances of an asset's external account, addressed by the bare asset code
   *
   * The ledger matches the code case-sensitively. The route takes no query parameters —
   * the page is capped at 10 server-side — and an unknown code yields an empty page.
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listExternalAccountBalances(
    orgId: string,
    ledgerId: string,
    assetCode: string
  ): Promise<AccountBalancePage>;

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
