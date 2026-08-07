/**
 */

import { BalanceApiClient } from '../../api/interfaces/balance-api-client';
import {
  AccountBalanceListOptions,
  AccountBalancePage,
  Balance,
  BalanceHistory,
  CreateBalanceInput,
  UpdateBalanceInput,
} from '../../models/balance';
import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';
import { BalancesService } from '../balances';

/**
 * Implementation of the BalancesService interface
 *
 * This class provides the concrete implementation of the BalancesService interface,
 * handling operations for balance-related API endpoints. It relies on the BalanceApiClient
 * to perform the actual HTTP communication, allowing for better separation of concerns.
 *
 * Balances represent the current financial state of accounts within the Midaz system.
 * Each balance is associated with a specific account and asset, and tracks the amount
 * of that asset held in the account. Balances are automatically updated when transactions
 * affect the associated account.
 *
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const balanceApiClient = apiFactory.createBalanceApiClient();
 * const balancesService = new BalancesServiceImpl(balanceApiClient);
 *
 * // Using the service to list balances for a ledger
 * const balances = await balancesService.listBalances(
 *   "org_123",
 *   "ldg_456"
 * );
 * ```
 */
export class BalancesServiceImpl implements BalancesService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new BalancesServiceImpl
   *
   */
  constructor(
    private readonly balanceApiClient: BalanceApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability = observability || Observability.getInstance();
  }

  /**
   * Lists balances for a ledger with optional filters
   *
   * Retrieves a paginated list of balances within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @returns Promise resolving to a paginated list of balances
   *
   * @throws Error if organization ID or ledger ID is missing
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // List all balances in a ledger
   * const balances = await balancesService.listBalances(
   *   "org_123",
   *   "ldg_456"
   * );
   *
   * // List balances with pagination
   * const paginatedBalances = await balancesService.listBalances(
   *   "org_123",
   *   "ldg_456",
   *   { limit: 10, offset: 20 }
   * );
   *
   * // List balances with filtering
   * const filteredBalances = await balancesService.listBalances(
   *   "org_123",
   *   "ldg_456",
   *   { filter: { available: { gt: 0 } } }
   * );
   * ```
   */
  public async listBalances(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Balance>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listBalances');
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
      const result = await this.balanceApiClient.listBalances(orgId, ledgerId, opts);

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
   * Lists the balances of one account, one cursor-paginated page at a time
   *
   * This is the only balance listing that truly paginates. `page` and `metadata.*` are
   * absent from the options on purpose: the ledger parses them and discards them.
   *
   * @returns Promise resolving to a page of balances and the cursors around it
   *
   * @throws Error if organization ID, ledger ID, or account ID is missing
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Walk the account's balances page by page
   * let page = await balancesService.listAccountBalances("org_123", "ldg_456", "acc_789", {
   *   limit: 50,
   * });
   *
   * while (page.nextCursor) {
   *   page = await balancesService.listAccountBalances("org_123", "ldg_456", "acc_789", {
   *     limit: 50,
   *     cursor: page.nextCursor,
   *   });
   * }
   * ```
   */
  public async listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: AccountBalanceListOptions
  ): Promise<AccountBalancePage> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccountBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('hasCursor', Boolean(opts.cursor));
    }

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.listAccountBalances(
        orgId,
        ledgerId,
        accountId,
        opts
      );

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
   * Creates an additional balance on an account, under a key of its own
   *
   * An account starts with a single `default` balance; this adds another. The key
   * `overdraft` is reserved by the ledger and refused.
   *
   * @returns Promise resolving to the created balance
   *
   * @throws Error if any required ID is missing
   * @throws Error if the input validation fails
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * const frozen = await balancesService.createAccountBalance(
   *   "org_123",
   *   "ldg_456",
   *   "acc_789",
   *   { key: "asset-freeze", direction: "debit" }
   * );
   * ```
   */
  public async createAccountBalance(
    orgId: string,
    ledgerId: string,
    accountId: string,
    input: CreateBalanceInput
  ): Promise<Balance> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createAccountBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.createAccountBalance(
        orgId,
        ledgerId,
        accountId,
        input
      );

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
   * Reads every balance of an account as it stood at a point in time
   *
   * The route answers a bare array. `date` is required and must carry a time component;
   * a timestamp preceding a balance's creation is answered `404`.
   *
   * @returns Promise resolving to the snapshots of the account's balances
   *
   * @throws Error if any required ID is missing
   * @throws Error if the date carries no time component
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * const snapshots = await balancesService.listAccountBalanceHistory(
   *   "org_123",
   *   "ldg_456",
   *   "acc_789",
   *   "2026-08-07T02:45:14Z"
   * );
   * ```
   */
  public async listAccountBalanceHistory(
    orgId: string,
    ledgerId: string,
    accountId: string,
    date: string
  ): Promise<BalanceHistory[]> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccountBalanceHistory');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);
    span.setAttribute('date', date);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.listAccountBalanceHistory(
        orgId,
        ledgerId,
        accountId,
        date
      );

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
   * Reads one balance as it stood at a point in time
   *
   * The route answers a single snapshot object, not a collection.
   *
   * @returns Promise resolving to the snapshot of the balance
   *
   * @throws Error if any required ID is missing
   * @throws Error if the date carries no time component
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * const before = await balancesService.getBalanceHistory(
   *   "org_123",
   *   "ldg_456",
   *   "bal_789",
   *   "2026-08-07 02:44:32"
   * );
   * ```
   */
  public async getBalanceHistory(
    orgId: string,
    ledgerId: string,
    balanceId: string,
    date: string
  ): Promise<BalanceHistory> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getBalanceHistory');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', balanceId);
    span.setAttribute('date', date);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.getBalanceHistory(
        orgId,
        ledgerId,
        balanceId,
        date
      );

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
   * Lists the balances of the account addressed by its alias
   *
   * The alias travels to the ledger raw: path parameters are never percent-decoded
   * there. The route takes no query parameters — the page is capped at 10 server-side —
   * and an unknown alias yields an empty page rather than a 404.
   *
   * @returns Promise resolving to a paginated list of balances
   */
  public async listAccountBalancesByAlias(
    orgId: string,
    ledgerId: string,
    alias: string
  ): Promise<AccountBalancePage> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccountBalancesByAlias');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('alias', alias);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.listAccountBalancesByAlias(orgId, ledgerId, alias);

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
   * Lists the balances of an asset's external account, addressed by the bare asset code
   *
   * The ledger matches the code case-sensitively. The route takes no query parameters —
   * the page is capped at 10 server-side — and an unknown code yields an empty page.
   *
   * @returns Promise resolving to a paginated list of balances
   */
  public async listExternalAccountBalances(
    orgId: string,
    ledgerId: string,
    assetCode: string
  ): Promise<AccountBalancePage> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listExternalAccountBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetCode', assetCode);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.listExternalAccountBalances(
        orgId,
        ledgerId,
        assetCode
      );

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
   * Gets a balance by ID
   *
   * Retrieves a single balance by its unique identifier within the specified
   * organization and ledger.
   *
   * @returns Promise resolving to the balance
   *
   * @throws Error if organization ID, ledger ID, or balance ID is missing
   * @throws Error if the balance does not exist
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Get balance details
   * try {
   *   const balance = await balancesService.getBalance(
   *     "org_123",
   *     "ldg_456",
   *     "bal_789"
   *   );
   *
   *   console.log(`Account ID: ${balance.accountId}`);
   *   console.log(`Available amount: ${balance.available}`);
   *   console.log(`On-hold amount: ${balance.onHold}`);
   * } catch (error) {
   *   console.error("Failed to retrieve balance:", error);
   * }
   * ```
   */
  public async getBalance(orgId: string, ledgerId: string, id: string): Promise<Balance> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', id);

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.getBalance(orgId, ledgerId, id);

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
   * Updates an existing balance
   *
   * Updates the properties of an existing balance within the specified
   * organization and ledger. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * Note: In most cases, balances should be updated through transactions
   * rather than direct updates to maintain proper accounting records.
   * This method is primarily for administrative or corrective actions.
   *
   * @returns Promise resolving to the updated balance
   *
   * @throws Error if organization ID, ledger ID, or balance ID is missing
   * @throws Error if the input validation fails
   * @throws Error if the balance does not exist
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Update a balance's available amount
   * try {
   *   const updatedBalance = await balancesService.updateBalance(
   *     "org_123",
   *     "ldg_456",
   *     "bal_789",
   *     {
   *       allowSending: true,
   *       allowReceiving: false
   *     }
   *   );
   *
   *   console.log(`Updated allow sending: ${updatedBalance.allowSending}`);
   *   console.log(`Updated allow receiving: ${updatedBalance.allowReceiving}`);
   * } catch (error) {
   *   console.error("Failed to update balance:", error);
   * }
   * ```
   */
  public async updateBalance(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdateBalanceInput
  ): Promise<Balance> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', id);

    // Set attributes for the update if available
    if (input.allowSending !== undefined) {
      span.setAttribute('updatedAllowSending', input.allowSending);
    }
    if (input.allowReceiving !== undefined) {
      span.setAttribute('updatedAllowReceiving', input.allowReceiving);
    }

    try {
      // Delegate to the API client
      const result = await this.balanceApiClient.updateBalance(orgId, ledgerId, id, input);

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
   * Deletes a balance
   *
   * Deletes a balance from the specified organization and ledger.
   * This operation may be restricted in many cases, as balances are typically
   * managed automatically by the system. Deleting a balance should only be
   * done in exceptional circumstances, such as correcting erroneous data.
   *
   * @returns Promise resolving to void
   *
   * @throws Error if any required ID is missing
   * @throws Error if the balance does not exist
   * @throws Error if the balance cannot be deleted
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * // Delete a balance (use with caution)
   * try {
   *   await balancesService.deleteBalance(
   *     "org_123",
   *     "ldg_456",
   *     "bal_789"
   *   );
   *
   *   console.log("Balance successfully deleted");
   * } catch (error) {
   *   console.error("Failed to delete balance:", error);
   *   console.error("Note: Balances are typically managed automatically by the system");
   * }
   * ```
   */
  public async deleteBalance(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', id);

    try {
      // Delegate to the API client
      await this.balanceApiClient.deleteBalance(orgId, ledgerId, id);

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
