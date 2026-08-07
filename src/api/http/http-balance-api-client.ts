/**
 */

import {
  AccountBalanceListOptions,
  AccountBalancePage,
  Balance,
  BalanceHistory,
  CreateBalanceInput,
  UpdateBalanceInput,
} from '../../models/balance';
import { ListOptions, ListResponse } from '../../models/common';
import {
  validateBalanceHistoryDate,
  validateCreateBalanceInput,
  validateUpdateBalanceInput,
} from '../../models/validators/balance-validator';
import { newValidationError } from '../../util/error';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { BalanceApiClient } from '../interfaces/balance-api-client';
import { UrlBuilder } from '../url-builder';
import { getEnv } from '../../util/runtime/environment';
/**
 * HTTP implementation of the BalanceApiClient interface
 *
 * This class handles HTTP communication with balance endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpBalanceApiClient implements BalanceApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpBalanceApiClient
   *
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly urlBuilder: UrlBuilder,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-balance-api-client',
        enableTracing: getEnv('MIDAZ_ENABLE_TRACING')
          ? getEnv('MIDAZ_ENABLE_TRACING')?.toLowerCase() === 'true'
          : false,
        enableMetrics: getEnv('MIDAZ_ENABLE_METRICS')
          ? getEnv('MIDAZ_ENABLE_METRICS')?.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists balances for a ledger with optional filters
   *
   * @returns Promise resolving to a paginated list of balances
   */
  public async listBalances(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Balance>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Build the URL and make the request
      const url = this.urlBuilder.buildBalanceUrl(orgId, ledgerId);
      const result = await this.httpClient.get<ListResponse<Balance>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('balances.list.count', result.items.length, {
        orgId,
        ledgerId,
      });

      // Record total available amount metrics if available
      if (result.items.length > 0) {
        const totalAvailable = result.items.reduce(
          (sum: number, balance: Balance) => sum + (balance.available || 0),
          0
        );

        this.recordMetrics('balances.total.available', totalAvailable, {
          orgId,
          ledgerId,
        });
      }

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
   * @returns Promise resolving to a page of balances and the cursors around it
   */
  public async listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: AccountBalanceListOptions
  ): Promise<AccountBalancePage> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccountBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('hasCursor', Boolean(options.cursor));
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, accountId });

      const params = this.toAccountBalanceListParams(options);

      const url = this.urlBuilder.buildAccountBalanceUrl(orgId, ledgerId, accountId);
      const result = await this.httpClient.get<Record<string, any>>(url, { params });

      const page = this.toAccountBalancePage(result);

      // Record metrics
      this.recordMetrics('balances.account.count', page.items.length, {
        orgId,
        ledgerId,
        accountId,
      });

      // Record total available amount metrics if available
      if (page.items.length > 0) {
        const totalAvailable = page.items.reduce(
          (sum: number, balance: Balance) => sum + (balance.available || 0),
          0
        );

        this.recordMetrics('balances.account.available', totalAvailable, {
          orgId,
          ledgerId,
          accountId,
        });
      }

      span.setStatus('ok');
      return page;
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
   * @returns Promise resolving to the created balance
   */
  public async createAccountBalance(
    orgId: string,
    ledgerId: string,
    accountId: string,
    input: CreateBalanceInput
  ): Promise<Balance> {
    const span = this.observability.startSpan('createAccountBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, accountId });

      validate(input, validateCreateBalanceInput);

      const url = this.urlBuilder.buildAccountBalanceUrl(orgId, ledgerId, accountId);
      const result = await this.httpClient.post<Balance>(url, input);

      this.recordMetrics('balance.create', 1, {
        orgId,
        ledgerId,
        accountId,
        key: input.key,
      });

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
   * The route answers a bare array rather than a pagination envelope.
   *
   * @returns Promise resolving to the snapshots of the account's balances
   */
  public async listAccountBalanceHistory(
    orgId: string,
    ledgerId: string,
    accountId: string,
    date: string
  ): Promise<BalanceHistory[]> {
    const span = this.observability.startSpan('listAccountBalanceHistory');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);
    span.setAttribute('date', date);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, accountId });
      this.validateHistoryDate(span, date);

      const url = this.urlBuilder.buildAccountBalanceHistoryUrl(orgId, ledgerId, accountId);
      const result = await this.httpClient.get<BalanceHistory[]>(url, { params: { date } });

      this.recordMetrics('balances.account.history.count', result?.length ?? 0, {
        orgId,
        ledgerId,
        accountId,
      });

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
   */
  public async getBalanceHistory(
    orgId: string,
    ledgerId: string,
    balanceId: string,
    date: string
  ): Promise<BalanceHistory> {
    const span = this.observability.startSpan('getBalanceHistory');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', balanceId);
    span.setAttribute('date', date);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, balanceId });
      this.validateHistoryDate(span, date);

      const url = this.urlBuilder.buildBalanceHistoryUrl(orgId, ledgerId, balanceId);
      const result = await this.httpClient.get<BalanceHistory>(url, { params: { date } });

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
   * @returns Promise resolving to a paginated list of balances
   */
  public async listAccountBalancesByAlias(
    orgId: string,
    ledgerId: string,
    alias: string
  ): Promise<ListResponse<Balance>> {
    const span = this.observability.startSpan('listAccountBalancesByAlias');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('alias', alias);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, alias });

      const url = this.urlBuilder.buildAccountAliasBalancesUrl(orgId, ledgerId, alias);

      // The route accepts no query parameters: the core hardcodes a page of 10.
      const result = await this.httpClient.get<ListResponse<Balance>>(url);

      this.recordMetrics('balances.alias.count', result.items.length, {
        orgId,
        ledgerId,
        alias,
      });

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
   * Lists the balances of an asset's external account
   *
   * @returns Promise resolving to a paginated list of balances
   */
  public async listExternalAccountBalances(
    orgId: string,
    ledgerId: string,
    assetCode: string
  ): Promise<ListResponse<Balance>> {
    const span = this.observability.startSpan('listExternalAccountBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('assetCode', assetCode);

    try {
      this.validateRequiredParams(span, { orgId, ledgerId, assetCode });

      const url = this.urlBuilder.buildExternalAccountBalancesUrl(orgId, ledgerId, assetCode);

      // The route accepts no query parameters: the core hardcodes a page of 10.
      const result = await this.httpClient.get<ListResponse<Balance>>(url);

      this.recordMetrics('balances.external.count', result.items.length, {
        orgId,
        ledgerId,
        assetCode,
      });

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
   * @returns Promise resolving to the balance
   */
  public async getBalance(orgId: string, ledgerId: string, id: string): Promise<Balance> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildBalanceUrl(orgId, ledgerId)}/${id}`;
      const result = await this.httpClient.get<Balance>(url);

      // Record metrics for the balance amounts
      if (result.available !== undefined) {
        this.recordMetrics('balance.available', result.available, {
          orgId,
          ledgerId,
          balanceId: id,
          accountId: result.accountId || 'unknown',
        });
      }

      if (result.onHold !== undefined) {
        this.recordMetrics('balance.onHold', result.onHold, {
          orgId,
          ledgerId,
          balanceId: id,
          accountId: result.accountId || 'unknown',
        });
      }

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
   * @returns Promise resolving to the updated balance
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
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Validate input
      validate(input, validateUpdateBalanceInput);

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildBalanceUrl(orgId, ledgerId)}/${id}`;
      const result = await this.httpClient.patch<Balance>(url, input);

      // Record metrics for the balance update
      this.recordMetrics('balance.update', 1, {
        orgId,
        ledgerId,
        balanceId: id,
        accountId: result.accountId || 'unknown',
      });

      // Record metrics for the updated permissions
      if (input.allowSending !== undefined) {
        this.recordMetrics('balance.update.allowSending', input.allowSending ? 1 : 0, {
          orgId,
          ledgerId,
          balanceId: id,
        });
      }

      if (input.allowReceiving !== undefined) {
        this.recordMetrics('balance.update.allowReceiving', input.allowReceiving ? 1 : 0, {
          orgId,
          ledgerId,
          balanceId: id,
        });
      }

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
   * @returns Promise resolving when the balance is deleted
   */
  public async deleteBalance(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteBalance');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('balanceId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildBalanceUrl(orgId, ledgerId)}/${id}`;
      await this.httpClient.delete(url);

      // Record metrics for the balance deletion
      this.recordMetrics('balance.delete', 1, {
        orgId,
        ledgerId,
        balanceId: id,
      });

      span.setStatus('ok');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Translates the SDK's options into the query parameters the ledger reads
   *
   * @private
   */
  private toAccountBalanceListParams(options?: AccountBalanceListOptions): Record<string, any> {
    const params: Record<string, any> = {};

    if (!options) {
      return params;
    }

    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) {
        throw newValidationError(
          `limit must be an integer between 1 and 100, got ${options.limit}`,
          { operation: 'listAccountBalances' }
        );
      }
      params.limit = options.limit;
    }

    if (options.cursor !== undefined) {
      params.cursor = options.cursor;
    }

    if (options.sortOrder !== undefined) {
      params.sort_order = options.sortOrder;
    }

    // The ledger takes the date range whole or not at all, answering 400/0083 to one bound.
    if ((options.startDate === undefined) !== (options.endDate === undefined)) {
      throw newValidationError('startDate and endDate must be supplied together', {
        operation: 'listAccountBalances',
      });
    }

    if (options.startDate !== undefined) {
      params.start_date = options.startDate;
      params.end_date = options.endDate;
    }

    return params;
  }

  /**
   * Reshapes the ledger's cursor envelope into the SDK's page
   *
   * @private
   */
  private toAccountBalancePage(response: Record<string, any>): AccountBalancePage {
    const page: AccountBalancePage = {
      items: response?.items ?? [],
      limit: response?.limit,
    };

    if (response?.next_cursor) {
      page.nextCursor = response.next_cursor;
    }

    if (response?.prev_cursor) {
      page.prevCursor = response.prev_cursor;
    }

    return page;
  }

  /**
   * Refuses a history timestamp the ledger would reject, before it reaches the wire
   *
   * @private
   */
  private validateHistoryDate(span: Span, date: string): void {
    const result = validateBalanceHistoryDate(date);

    if (!result.valid) {
      const error = newValidationError(result.message as string, {
        operation: 'balanceHistory',
      });
      span.recordException(error);
      throw error;
    }
  }

  /**
   * Validates required parameters and throws an error if any are missing
   *
   * @private
   */
  private validateRequiredParams(span: Span, params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        const error = new Error(`${key} is required`);
        span.recordException(error);
        throw error;
      }
    }
  }

  /**
   * Records metrics for an operation
   *
   * @private
   */
  private recordMetrics(name: string, value: number, tags?: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags || {});
  }
}
