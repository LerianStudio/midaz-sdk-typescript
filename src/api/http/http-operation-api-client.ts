/**
 * @file HTTP implementation of operation API client
 * @description Implements the operation API client interface using HTTP
 */

import { ListOptions, ListResponse } from '../../models/common';
import { Operation } from '../../models/transaction';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { OperationApiClient } from '../interfaces/operation-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the OperationApiClient interface
 *
 * This class handles HTTP communication with operation endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpOperationApiClient implements OperationApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpOperationApiClient
   *
   * @param httpClient - HTTP client for making API requests
   * @param urlBuilder - URL builder for constructing endpoint URLs
   * @param observability - Optional observability provider (if not provided, a new one will be created)
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
        serviceName: 'midaz-operation-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists operations for a specific organization, ledger, and account
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of operations
   */
  public async listOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    options?: ListOptions
  ): Promise<ListResponse<Operation>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listOperations');
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

      // Build the URL and make the request
      const url = this.buildOperationsUrl(orgId, ledgerId, accountId);
      const result = await this.httpClient.get<ListResponse<Operation>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('operations.list.count', result.items.length, {
        orgId,
        ledgerId,
        accountId,
      });

      // Record metrics for debit and credit operations if present
      const debitCount = result.items.filter((op) => op.type === 'DEBIT').length;
      const creditCount = result.items.filter((op) => op.type === 'CREDIT').length;

      if (debitCount > 0) {
        this.recordMetrics('operations.debit.count', debitCount, {
          orgId,
          ledgerId,
          accountId,
        });
      }

      if (creditCount > 0) {
        this.recordMetrics('operations.credit.count', creditCount, {
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
   * Gets an operation by ID
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @param operationId - Operation ID
   * @param transactionId - Optional transaction ID that contains the operation
   * @returns Promise resolving to the operation
   */
  public async getOperation(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string,
    transactionId?: string
  ): Promise<Operation> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getOperation');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);
    span.setAttribute('operationId', operationId);

    if (transactionId) {
      span.setAttribute('transactionId', transactionId);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, {
        orgId,
        ledgerId,
        accountId,
        operationId,
      });

      // Build the URL and make the request
      const url = this.buildOperationUrl(orgId, ledgerId, accountId, operationId, transactionId);
      const result = await this.httpClient.get<Operation>(url);

      // Record metrics
      this.recordMetrics('operation.get', 1, {
        orgId,
        ledgerId,
        accountId,
        operationId,
        operationType: result.type || 'unknown',
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
   * Updates an existing operation
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @param operationId - Operation ID
   * @param input - Operation update input
   * @returns Promise resolving to the updated operation
   */
  public async updateOperation(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string,
    input: Record<string, any>
  ): Promise<Operation> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateOperation');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);
    span.setAttribute('operationId', operationId);

    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, {
        orgId,
        ledgerId,
        accountId,
        operationId,
      });

      // Build the URL and make the request
      const url = this.buildOperationUrl(orgId, ledgerId, accountId, operationId);
      const result = await this.httpClient.patch<Operation>(url, input);

      // Record metrics
      this.recordMetrics('operation.update', 1, {
        orgId,
        ledgerId,
        accountId,
        operationId,
        operationType: result.type || 'unknown',
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
   * Builds the URL for operations API calls
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @returns Full URL for the operations API endpoint
   * @private
   */
  private buildOperationsUrl(orgId: string, ledgerId: string, accountId: string): string {
    // Use the UrlBuilder to construct the URL
    const baseUrl = this.urlBuilder.getBaseUrl('transaction');
    return `${baseUrl}/organizations/${orgId}/ledgers/${ledgerId}/accounts/${accountId}/operations`;
  }

  /**
   * Builds the URL for a specific operation
   *
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @param operationId - Operation ID
   * @param transactionId - Optional transaction ID
   * @returns Full URL for the specific operation
   * @private
   */
  private buildOperationUrl(
    orgId: string,
    ledgerId: string,
    accountId: string,
    operationId: string,
    transactionId?: string
  ): string {
    const baseUrl = this.buildOperationsUrl(orgId, ledgerId, accountId);

    if (transactionId) {
      return `${baseUrl}?transactionId=${transactionId}&operationId=${operationId}`;
    }

    return `${baseUrl}/${operationId}`;
  }

  /**
   * Validates required parameters and throws an error if any are missing
   *
   * @param span - The current tracing span
   * @param params - The parameters to validate
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
   * @param name - Metric name
   * @param value - Metric value
   * @param tags - Metric tags
   * @private
   */
  private recordMetrics(name: string, value: number, tags: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags);
  }
}
