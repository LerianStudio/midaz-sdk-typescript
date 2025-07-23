/**
 * AccountTypesService interface - Defines the interface for managing account types.
 */
import {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '../models/account-type';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing account types in a ledger system.
 * Account types provide a classification layer for accounts.
 *
 * @example
 * ```typescript
 * // Create a new account type
 * const newAccountType = await client.entities.accountTypes.createAccountType(
 *   "org_123",
 *   "ldg_456",
 *   {
 *     name: "Cash Equivalents",
 *     keyValue: "CASH_EQUIVALENTS",
 *   }
 * );
 * ```
 */
export interface AccountTypesService {
  /**
   * Lists account types with pagination and filtering.
   * @param orgId - The organization ID.
   * @param ledgerId - The ledger ID.
   * @param opts - Optional list options.
   * @returns A promise resolving to a list of account types.
   */
  listAccountTypes(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
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
   * @param input - The creation input.
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
   * @param id - The account type ID to update.
   * @param input - The update input.
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
   * @param id - The account type ID to delete.
   * @returns A promise that resolves when deletion is complete.
   */
  deleteAccountType(orgId: string, ledgerId: string, id: string): Promise<void>;
}
