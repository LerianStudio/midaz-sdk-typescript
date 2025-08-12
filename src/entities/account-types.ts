/**
 * Account Types Service Interface
 */

import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../models/account-type';
import { PaginatedResponse, ListOptions } from '../models/common';

/**
 * Service interface for Account Type operations
 *
 * Account types define templates or categories for accounts, specifying
 * their behavior and characteristics within the ledger system.
 */
export interface AccountTypesService {
  /**
   * Retrieve a paginated list of account types for a ledger
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated account types
   *
   * @example
   * ```typescript
   * const accountTypes = await client.entities.accountTypes.listAccountTypes(
   *   'org_123',
   *   'ledger_456',
   *   { limit: 10, page: 1 }
   * );
   *
   * console.log(`Found ${accountTypes.items.length} account types`);
   * accountTypes.items.forEach(type => {
   *   console.log(`${type.name}: ${type.keyValue}`);
   * });
   * ```
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
   *
   * @example
   * ```typescript
   * const accountType = await client.entities.accountTypes.getAccountType(
   *   'org_123',
   *   'ledger_456',
   *   'type_789'
   * );
   *
   * console.log(`Account Type: ${accountType.name}`);
   * console.log(`Key Value: ${accountType.keyValue}`);
   * ```
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
   *
   * @example
   * ```typescript
   * import { createAccountTypeBuilder } from 'midaz-sdk';
   *
   * const input = createAccountTypeBuilder('Cash Account', 'CASH')
   *   .withDescription('Account for liquid cash assets')
   *   .withMetadata({
   *     category: 'assets',
   *     liquidity: 'high'
   *   })
   *   .build();
   *
   * const accountType = await client.entities.accountTypes.createAccountType(
   *   'org_123',
   *   'ledger_456',
   *   input
   * );
   *
   * console.log(`Created account type: ${accountType.id}`);
   * ```
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
   *
   * @example
   * ```typescript
   * import { createUpdateAccountTypeBuilder } from 'midaz-sdk';
   *
   * const input = createUpdateAccountTypeBuilder()
   *   .withDescription('Updated description for cash account')
   *   .withMetadata({
   *     category: 'assets',
   *     liquidity: 'very_high',
   *     updated: new Date().toISOString()
   *   })
   *   .build();
   *
   * const accountType = await client.entities.accountTypes.updateAccountType(
   *   'org_123',
   *   'ledger_456',
   *   'type_789',
   *   input
   * );
   *
   * console.log(`Updated account type: ${accountType.name}`);
   * ```
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
   *
   * @example
   * ```typescript
   * await client.entities.accountTypes.deleteAccountType(
   *   'org_123',
   *   'ledger_456',
   *   'type_789'
   * );
   *
   * console.log('Account type deleted successfully');
   * ```
   */
  deleteAccountType(organizationId: string, ledgerId: string, accountTypeId: string): Promise<void>;
}
