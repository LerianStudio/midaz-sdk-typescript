/**
 */

import { Balance, UpdateBalanceInput } from '../../models/balance';
import { ListOptions, ListResponse } from '../../models/common';
import { validateUpdateBalanceInput } from '../../models/validators/balance-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { BalanceApiClient } from '../interfaces/balance-api-client';
import { UrlBuilder } from '../url-builder';

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
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
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
   * Lists balances for a specific account
   *
   * @returns Promise resolving to a paginated list of balances
   */
  public async listAccountBalances(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: ListOptions
  ): Promise<ListResponse<Balance>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listAccountBalances');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, accountId });

      // Build the URL for account balances
      const baseUrl = `${this.urlBuilder.getBaseUrl('transaction')}/${this.urlBuilder.getApiVersion()}`;
      const url = `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/balances`;

      const result = await this.httpClient.get<ListResponse<Balance>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('balances.account.count', result.items.length, {
        orgId,
        ledgerId,
        accountId,
      });

      // Record total available amount metrics if available
      if (result.items.length > 0) {
        const totalAvailable = result.items.reduce(
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
