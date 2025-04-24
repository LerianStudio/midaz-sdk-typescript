/**
 * @file Account service interface for the Midaz SDK
 * @description Defines the interface for managing accounts within the Midaz ledger system
 */

import { Account, CreateAccountInput, UpdateAccountInput } from '../models/account';
import { ListOptions, ListResponse } from '../models/common';

/**
 * Service for managing accounts in the Midaz system
 *
 * The AccountsService provides methods for creating, retrieving, updating, and deleting
 * accounts within a specific organization and ledger. Accounts are the fundamental
 * entities for tracking assets and their movements within the ledger system.
 *
 * Each account:
 * - Belongs to a specific organization and ledger
 * - Holds a specific type of asset
 * - Can be categorized by type (e.g., deposit, loans, creditCard)
 * - Can be grouped into portfolios and segments for reporting
 *
 * @example
 * ```typescript
 * // Create a new account
 * const newAccount = await midazClient.entities.accounts.createAccount(
 *   "org_12345",
 *   "ldg_67890",
 *   {
 *     name: "Operating Cash",
 *     assetCode: "USD",
 *     type: "deposit"
 *   }
 * );
 *
 * // List accounts in a ledger
 * const accounts = await midazClient.entities.accounts.listAccounts(
 *   "org_12345",
 *   "ldg_67890",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export interface AccountsService {
  /**
   * Lists accounts with optional filters
   *
   * Retrieves a paginated list of accounts within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the accounts
   * @param ledgerId - Ledger ID that contains the accounts
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of accounts
   *
   * @example
   * ```typescript
   * // List the first 10 accounts in a ledger
   * const accounts = await accountsService.listAccounts(
   *   "org_12345",
   *   "ldg_67890",
   *   { limit: 10, offset: 0 }
   * );
   *
   * // List accounts with filtering
   * const filteredAccounts = await accountsService.listAccounts(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     limit: 20,
   *     filter: {
   *       assetCode: "USD",
   *       type: "deposit"
   *     }
   *   }
   * );
   * ```
   */
  listAccounts(orgId: string, ledgerId: string, opts?: ListOptions): Promise<ListResponse<Account>>;

  /**
   * Gets an account by ID
   *
   * Retrieves a single account by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to retrieve
   * @returns Promise resolving to the account
   *
   * @example
   * ```typescript
   * // Get account details
   * const account = await accountsService.getAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef"
   * );
   *
   * console.log(`Account name: ${account.name}`);
   * console.log(`Asset code: ${account.assetCode}`);
   * console.log(`Status: ${account.status.code}`);
   * ```
   */
  getAccount(orgId: string, ledgerId: string, id: string): Promise<Account>;

  /**
   * Creates a new account
   *
   * Creates a new account within the specified organization and ledger using
   * the provided account details. The account will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the account
   * @param ledgerId - Ledger ID that will contain the account
   * @param input - Account creation input with required properties
   * @returns Promise resolving to the created account
   *
   * @example
   * ```typescript
   * // Create a basic deposit account
   * const newAccount = await accountsService.createAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Operating Cash",
   *     assetCode: "USD",
   *     type: "deposit"
   *   }
   * );
   *
   * // Create an account with additional properties
   * const newAccountWithDetails = await accountsService.createAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   {
   *     name: "Corporate Credit Card",
   *     assetCode: "USD",
   *     type: "creditCard",
   *     alias: "corp-card",
   *     portfolioId: "pfl_12345",
   *     metadata: {
   *       department: "Finance",
   *       cardNumber: "XXXX-XXXX-XXXX-1234"
   *     }
   *   }
   * );
   * ```
   */
  createAccount(orgId: string, ledgerId: string, input: CreateAccountInput): Promise<Account>;

  /**
   * Updates an existing account
   *
   * Updates the properties of an existing account within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to update
   * @param input - Account update input with properties to change
   * @returns Promise resolving to the updated account
   *
   * @example
   * ```typescript
   * // Update an account's name
   * const updatedAccount = await accountsService.updateAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     name: "Primary Operating Cash"
   *   }
   * );
   *
   * // Update multiple properties
   * const updatedAccount = await accountsService.updateAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef",
   *   {
   *     name: "Primary Operating Cash",
   *     status: "INACTIVE",
   *     metadata: {
   *       department: "Treasury",
   *       purpose: "Daily operations"
   *     }
   *   }
   * );
   * ```
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
   * Deletes an account from the specified organization and ledger.
   * This operation may be restricted if the account has associated balances
   * or transactions. In many cases, accounts are soft-deleted (marked as deleted
   * but retained in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param id - Account ID to delete
   * @returns Promise that resolves when the account is deleted
   *
   * @example
   * ```typescript
   * // Delete an account
   * await accountsService.deleteAccount(
   *   "org_12345",
   *   "ldg_67890",
   *   "acc_abcdef"
   * );
   *
   * // Attempt to retrieve the deleted account (will throw an error)
   * try {
   *   const account = await accountsService.getAccount(
   *     "org_12345",
   *     "ldg_67890",
   *     "acc_abcdef"
   *   );
   * } catch (error) {
   *   console.error("Account not found or has been deleted");
   * }
   * ```
   */
  deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void>;
}
