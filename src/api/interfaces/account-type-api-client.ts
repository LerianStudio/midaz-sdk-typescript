/**
 * Interface for account type API operations
 */

import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../../models/account-type';
import { ListOptions, ListResponse } from '../../models/common';
import { ApiClient } from './api-client';

/**
 * Interface for account type API operations.
 *
 * This interface defines the methods for interacting with account type endpoints,
 * abstracting away the HTTP details and focusing on business operations.
 */
export interface AccountTypeApiClient
  extends ApiClient<AccountType, CreateAccountTypeInput, UpdateAccountTypeInput> {
  /**
   * Lists account types with optional filters.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param options - Optional list options for pagination and filtering.
   * @returns A promise resolving to a paginated list of account types.
   */
  listAccountTypes(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<AccountType>>;

  /**
   * Gets an account type by ID.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param id - The account type ID.
   * @returns A promise resolving to the account type.
   */
  getAccountType(orgId: string, ledgerId: string, id: string): Promise<AccountType>;

  /**
   * Creates a new account type.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param input - The account type creation input.
   * @returns A promise resolving to the created account type.
   */
  createAccountType(
    orgId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType>;

  /**
   * Updates an existing account type.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param id - The account type ID.
   * @param input - The account type update input.
   * @returns A promise resolving to the updated account type.
   */
  updateAccountType(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountTypeInput
  ): Promise<AccountType>;

  /**
   * Deletes an account type.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param id - The account type ID.
   * @returns A promise resolving when the account type is deleted.
   */
  deleteAccountType(orgId: string, ledgerId: string, id: string): Promise<void>;
}
