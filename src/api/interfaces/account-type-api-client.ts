/**
 * Account Type API Client Interface
 */

import { ApiClient } from './api-client';
import { AccountType, CreateAccountTypeInput, UpdateAccountTypeInput } from '../../models/account-type';
import { PaginatedResponse, ListOptions } from '../../models/common';

/**
 * Interface for Account Type API operations
 */
export interface AccountTypeApiClient extends ApiClient<AccountType, CreateAccountTypeInput, UpdateAccountTypeInput> {
  /**
   * Retrieve a paginated list of account types for a ledger
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated account types
   */
  listAccountTypes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<AccountType>>;

  /**
   * Retrieve a specific account type by ID
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param accountTypeId - The account type ID
   * @returns Promise resolving to the account type
   */
  getAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<AccountType>;

  /**
   * Create a new account type
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param input - The account type creation data
   * @returns Promise resolving to the created account type
   */
  createAccountType(
    organizationId: string,
    ledgerId: string,
    input: CreateAccountTypeInput
  ): Promise<AccountType>;

  /**
   * Update an existing account type
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param accountTypeId - The account type ID to update
   * @param input - The account type update data
   * @returns Promise resolving to the updated account type
   */
  updateAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string,
    input: UpdateAccountTypeInput
  ): Promise<AccountType>;

  /**
   * Delete an account type
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param accountTypeId - The account type ID to delete
   * @returns Promise resolving when the account type is deleted
   */
  deleteAccountType(
    organizationId: string,
    ledgerId: string,
    accountTypeId: string
  ): Promise<void>;
}