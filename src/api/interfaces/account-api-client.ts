/**
 * @file Account API client interface
 * @description Defines the interface for account API operations
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../../models/account';
import { ListOptions, ListResponse } from '../../models/common';

import { ApiClient } from './api-client';

/**
 * Interface for account API operations
 *
 * This interface defines the methods for interacting with account endpoints.
 * It abstracts away the HTTP details and focuses on the business operations.
 */
export interface AccountApiClient
  extends ApiClient<Account, CreateAccountInput, UpdateAccountInput> {
  /**
   * Lists accounts with optional filters
   *
   * @param orgId - Organization ID that owns the accounts
   * @param ledgerId - Ledger ID that contains the accounts
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of accounts
   */
  listAccounts(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Account>>;

  /**
   * Gets an account by ID
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to retrieve
   * @returns Promise resolving to the account
   */
  getAccount(orgId: string, ledgerId: string, id: string): Promise<Account>;

  /**
   * Creates a new account
   *
   * @param orgId - Organization ID that will own the account
   * @param ledgerId - Ledger ID that will contain the account
   * @param input - Account creation input with required properties
   * @returns Promise resolving to the created account
   */
  createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account>;

  /**
   * Updates an existing account
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to update
   * @param input - Account update input with properties to change
   * @returns Promise resolving to the updated account
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
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to delete
   * @returns Promise resolving when the account is deleted
   */
  deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void>;
}
