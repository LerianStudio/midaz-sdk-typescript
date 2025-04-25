/**
 * @file Account service interface
 * @description Defines the interface for managing ledger accounts
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../models/account';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing accounts in a ledger system
 * 
 * Accounts represent containers for holding specific assets, categorized by
 * type (e.g., deposit, loans, creditCard) and organized into portfolios
 * and segments.
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
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param opts - List options
   */
  listAccounts(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Account>>;

  /** 
   * Gets an account by ID
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Account ID to retrieve
   */
  getAccount(orgId: string, ledgerId: string, id: string): Promise<Account>;

  /**
   * Creates a new account
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param input - Account creation input
   */
  createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account>;

  /**
   * Updates an existing account
   * 
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Account ID to update
   * @param input - Account update input
   */
  updateAccount(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountInput
  ): Promise<Account>;

  /**
   * Deletes an account (typically soft-deleted to maintain history)
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param id - Account ID to delete
   */
  deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void>;
}
