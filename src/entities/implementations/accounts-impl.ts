/**
 * @file Accounts service implementation for the Midaz SDK
 * @description Implements the AccountsService interface for managing accounts within the Midaz ledger system
 */

import { AccountApiClient } from '../../api/interfaces/account-api-client';
import { Account, CreateAccountInput, UpdateAccountInput } from '../../models/account';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { AccountsService } from '../accounts';

/**
 * Implementation of the AccountsService interface
 *
 * This class provides the concrete implementation of the AccountsService interface,
 * handling operations for account-related API endpoints. It relies on the AccountApiClient
 * to perform the actual HTTP communication, allowing for better separation of concerns.
 *
 * @implements {AccountsService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const accountApiClient = apiFactory.createAccountApiClient();
 * const accountsService = new AccountsServiceImpl(accountApiClient);
 *
 * // Using the service
 * const accounts = await accountsService.listAccounts("org_123", "ldg_456");
 * ```
 */
export class AccountsServiceImpl implements AccountsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new AccountsServiceImpl
   *
   * @param accountApiClient - Account API client for making API requests
   * @param observability - Optional observability provider for tracing and metrics
   */
  constructor(private readonly accountApiClient: AccountApiClient, observability?: Observability) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-accounts-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

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
   * @throws Error if organization ID or ledger ID is missing
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // List all accounts in a ledger
   * const accounts = await accountsService.listAccounts("org_123", "ldg_456");
   *
   * // List accounts with pagination
   * const paginatedAccounts = await accountsService.listAccounts(
   *   "org_123",
   *   "ldg_456",
   *   { limit: 10, offset: 20 }
   * );
   *
   * // List accounts with filtering
   * const filteredAccounts = await accountsService.listAccounts(
   *   "org_123",
   *   "ldg_456",
   *   { filter: { assetCode: "USD", type: "deposit" } }
   * );
   * ```
   */
  public async listAccounts(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Account>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccounts');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.listAccounts(orgId, ledgerId, opts);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   * @throws Error if organization ID, ledger ID, or account ID is missing
   * @throws Error if the account does not exist
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Get account details
   * try {
   *   const account = await accountsService.getAccount(
   *     "org_123",
   *     "ldg_456",
   *     "acc_789"
   *   );
   *
   *   console.log(`Account name: ${account.name}`);
   *   console.log(`Asset code: ${account.assetCode}`);
   * } catch (error) {
   *   console.error("Failed to retrieve account:", error);
   * }
   * ```
   */
  public async getAccount(orgId: string, ledgerId: string, id: string): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.getAccount(orgId, ledgerId, id);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   * @throws Error if organization ID or ledger ID is missing
   * @throws Error if the input validation fails
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Create a basic deposit account
   * try {
   *   const newAccount = await accountsService.createAccount(
   *     "org_123",
   *     "ldg_456",
   *     {
   *       name: "Operating Cash",
   *       assetCode: "USD",
   *       type: "deposit"
   *     }
   *   );
   *
   *   console.log(`Created account with ID: ${newAccount.id}`);
   * } catch (error) {
   *   console.error("Failed to create account:", error);
   * }
   * ```
   */
  public async createAccount(
    orgId: string,
    ledgerId: string,
    input: CreateAccountInput
  ): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountName', input.name);
    span.setAttribute('assetCode', input.assetCode);
    span.setAttribute('accountType', input.type);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.createAccount(orgId, ledgerId, input);

      span.setAttribute('accountId', result.id);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   * @throws Error if organization ID, ledger ID, or account ID is missing
   * @throws Error if the input validation fails
   * @throws Error if the account does not exist
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Update an account's name
   * try {
   *   const updatedAccount = await accountsService.updateAccount(
   *     "org_123",
   *     "ldg_456",
   *     "acc_789",
   *     {
   *       name: "Primary Operating Cash"
   *     }
   *   );
   *
   *   console.log(`Updated account name to: ${updatedAccount.name}`);
   * } catch (error) {
   *   console.error("Failed to update account:", error);
   * }
   * ```
   */
  public async updateAccount(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateAccountInput
  ): Promise<Account> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      const result = await this.accountApiClient.updateAccount(orgId, ledgerId, id, input);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

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
   * @throws Error if organization ID, ledger ID, or account ID is missing
   * @throws Error if the account does not exist
   * @throws Error if the account cannot be deleted (e.g., has balances)
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Delete an account
   * try {
   *   await accountsService.deleteAccount(
   *     "org_123",
   *     "ldg_456",
   *     "acc_789"
   *   );
   *
   *   console.log("Account successfully deleted");
   * } catch (error) {
   *   console.error("Failed to delete account:", error);
   * }
   * ```
   */
  public async deleteAccount(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteAccount');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', id);

    try {
      // Delegate to the API client
      await this.accountApiClient.deleteAccount(orgId, ledgerId, id);

      span.setStatus('ok');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
