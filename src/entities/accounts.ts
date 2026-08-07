/**
 * Account service interface - Defines the interface for managing ledger accounts
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../models/account';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing accounts in a ledger system
 *
 * Accounts represent containers for holding specific assets, categorized by
 * type and organized into portfolios and segments.
 *
 * @example
 * ```typescript
 * // Create a new account
 * const newAccount = await client.entities.accounts.createAccount(
 *   "org_123",
 *   "ldg_456",
 *   {
 *     name: "Operating Cash",
 *     assetCode: "USD",
 *     type: "deposit"
 *   }
 * );
 * ```
 */
export interface AccountsService {
  /**
   * Lists accounts with pagination, sorting, and filtering
   *
   */
  listAccounts(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Account>>;

  /**
   * Gets an account by ID
   *
   */
  getAccount(orgId: string, ledgerId: string, id: string): Promise<Account>;

  /**
   * Gets an account by its alias
   *
   * The alias travels to the ledger raw: path parameters are never percent-decoded
   * there, so an encoded alias is looked up literally and 404s. `@` and `:` are legal;
   * an alias containing `/` is unreachable through this route.
   *
   */
  getAccountByAlias(orgId: string, ledgerId: string, alias: string): Promise<Account>;

  /**
   * Gets the external account of an asset, addressed by the bare asset code
   *
   * The ledger matches the code case-sensitively and prefixes `@external/` itself.
   *
   */
  getExternalAccount(orgId: string, ledgerId: string, assetCode: string): Promise<Account>;

  /**
   * Creates a new account
   *
   */
  /**
   * Counts the accounts of a ledger
   *
   * The ledger answers this over HEAD with the total in `X-Total-Count` and ignores
   * every query parameter, so the count cannot be filtered.
   *
   */
  countAccounts(orgId: string, ledgerId: string): Promise<number>;

  createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account>;

  /**
   * Updates an existing account
   *
   */
  updateAccount(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountInput
  ): Promise<Account>;

  /**
   * Deletes an account
   *
   */
  deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void>;
}
