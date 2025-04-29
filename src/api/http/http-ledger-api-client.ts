/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../models/ledger';
import {
  validateCreateLedgerInput,
  validateUpdateLedgerInput,
} from '../../models/validators/ledger-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { LedgerApiClient } from '../interfaces/ledger-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the LedgerApiClient interface
 *
 * This class handles HTTP communication with ledger endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpLedgerApiClient implements LedgerApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpLedgerApiClient
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
        serviceName: 'midaz-ledger-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists ledgers for a specific organization
   *
   * @returns Promise resolving to a paginated list of ledgers
   */
  public async listLedgers(orgId: string, options?: ListOptions): Promise<ListResponse<Ledger>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listLedgers');
    span.setAttribute('orgId', orgId);

    if (options) {
      span.setAttribute('limit', options.limit || 0);
      span.setAttribute('offset', options.offset || 0);
      if (options.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId });

      // Build the URL and make the request
      const url = this.urlBuilder.buildLedgerUrl(orgId);
      const result = await this.httpClient.get<ListResponse<Ledger>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('ledgers.list.count', result.items.length, {
        orgId,
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
   * Gets a ledger by ID
   *
   * @returns Promise resolving to the ledger
   */
  public async getLedger(orgId: string, id: string): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildLedgerUrl(orgId, id);
      const result = await this.httpClient.get<Ledger>(url);

      // Record metrics
      this.recordMetrics('ledgers.get', 1, {
        orgId,
        ledgerId: id,
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
   * Creates a new ledger
   *
   * @returns Promise resolving to the created ledger
   */
  public async createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createLedger');
    span.setAttribute('orgId', orgId);

    // Set attributes for the ledger
    if (input.name) {
      span.setAttribute('ledgerName', input.name);
    }
    if (input.metadata) {
      span.setAttribute('hasMetadata', true);
    }
    if (input.status) {
      span.setAttribute('status', input.status);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId });

      // Validate input
      validate(input, validateCreateLedgerInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildLedgerUrl(orgId);
      const result = await this.httpClient.post<Ledger>(url, input);

      // Record metrics
      this.recordMetrics('ledgers.create', 1, {
        orgId,
      });

      span.setAttribute('ledgerId', result.id);
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
   * Updates an existing ledger
   *
   * @returns Promise resolving to the updated ledger
   */
  public async updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    // Set attributes for the update
    if (input.name) {
      span.setAttribute('updatedName', input.name);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }
    if (input.status) {
      span.setAttribute('updatedStatus', input.status);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, id });

      // Validate input
      validate(input, validateUpdateLedgerInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildLedgerUrl(orgId, id);
      const result = await this.httpClient.patch<Ledger>(url, input);

      // Record metrics
      this.recordMetrics('ledgers.update', 1, {
        orgId,
        ledgerId: id,
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
   * Deletes a ledger
   *
   * @returns Promise resolving when the ledger is deleted
   */
  public async deleteLedger(orgId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildLedgerUrl(orgId, id);
      await this.httpClient.delete(url);

      // Record metrics
      this.recordMetrics('ledgers.delete', 1, {
        orgId,
        ledgerId: id,
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
