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
   * Lists the balances of the account addressed by its alias
   *
   * The alias reaches the ledger exactly as given: path parameters are never
   * percent-decoded there. The route takes no query parameters — the page is capped
   * at 10 server-side — and an unknown alias yields an empty page rather than a 404.
   *
   * @returns Promise resolving to a paginated list of balances
   */
  listAccountBalancesByAlias(
    orgId: string,
    ledgerId: string,
    alias: string
  ): Promise<ListResponse<Balance>>;

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
