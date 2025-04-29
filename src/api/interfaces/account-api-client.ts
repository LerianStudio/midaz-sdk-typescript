/**
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
   * @returns Promise resolving to the account
   */
  getAccount(orgId: string, ledgerId: string, id: string): Promise<Account>;

  /**
   * Creates a new account
   *
   * @returns Promise resolving to the created account
   */
  createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account>;

  /**
   * Updates an existing account
   *
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
   * @returns Promise resolving when the account is deleted
   */
  deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void>;
}
