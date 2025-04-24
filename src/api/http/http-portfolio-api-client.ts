/**
 * @file HTTP implementation of portfolio API client
 * @description Implements the portfolio API client interface using HTTP
 */

import { ListOptions, ListResponse } from '../../models/common';
import { CreatePortfolioInput, Portfolio, UpdatePortfolioInput } from '../../models/portfolio';
import {
  validateCreatePortfolioInput,
  validateUpdatePortfolioInput,
} from '../../models/validators/portfolio-validator';
import { HttpClient } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import { validate } from '../../util/validation';
import { PortfolioApiClient } from '../interfaces/portfolio-api-client';
import { UrlBuilder } from '../url-builder';

/**
 * HTTP implementation of the PortfolioApiClient interface
 *
 * This class handles HTTP communication with portfolio endpoints, including
 * URL construction, request formation, response handling, and error management.
 */
export class HttpPortfolioApiClient implements PortfolioApiClient {
  private readonly observability: Observability;

  /**
   * Creates a new HttpPortfolioApiClient
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
        serviceName: 'midaz-portfolio-api-client',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists portfolios for a ledger with optional filters
   *
   * @param orgId - Organization ID that owns the portfolios
   * @param ledgerId - Ledger ID that contains the portfolios
   * @param options - Optional list options for filtering and pagination
   * @returns Promise resolving to a paginated list of portfolios
   */
  public async listPortfolios(
    orgId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<ListResponse<Portfolio>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listPortfolios');
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
      const url = this.urlBuilder.buildPortfolioUrl(orgId, ledgerId, undefined);
      const result = await this.httpClient.get<ListResponse<Portfolio>>(url, {
        params: options,
      });

      // Record metrics
      this.recordMetrics('portfolios.list.count', result.items.length, {
        orgId,
        ledgerId,
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
   * Gets a portfolio by ID
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to retrieve
   * @returns Promise resolving to the portfolio
   */
  public async getPortfolio(orgId: string, ledgerId: string, id: string): Promise<Portfolio> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getPortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = this.urlBuilder.buildPortfolioUrl(orgId, ledgerId, id);
      const result = await this.httpClient.get<Portfolio>(url);

      // Record metrics
      this.recordMetrics('portfolios.get', 1, {
        orgId,
        ledgerId,
        portfolioId: id,
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
   * Creates a new portfolio
   *
   * @param orgId - Organization ID that will own the portfolio
   * @param ledgerId - Ledger ID that will contain the portfolio
   * @param input - Portfolio creation input with required properties
   * @returns Promise resolving to the created portfolio
   */
  public async createPortfolio(
    orgId: string,
    ledgerId: string,
    input: CreatePortfolioInput
  ): Promise<Portfolio> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createPortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioName', input.name);
    span.setAttribute('entityId', input.entityId);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId });

      // Validate input
      validate(input, validateCreatePortfolioInput);

      // Build the URL and make the request
      const url = this.urlBuilder.buildPortfolioUrl(orgId, ledgerId, undefined);
      const result = await this.httpClient.post<Portfolio>(url, input);

      // Record metrics
      this.recordMetrics('portfolios.create', 1, {
        orgId,
        ledgerId,
        portfolioName: input.name,
      });

      span.setAttribute('portfolioId', result.id);
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
   * Updates an existing portfolio
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to update
   * @param input - Portfolio update input with properties to change
   * @returns Promise resolving to the updated portfolio
   */
  public async updatePortfolio(
    orgId: string,
    ledgerId: string,
    id: string,
    input: UpdatePortfolioInput
  ): Promise<Portfolio> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updatePortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', id);

    // Set attributes for the update
    if (input.name) {
      span.setAttribute('updatedName', input.name);
    }
    if (input.status) {
      span.setAttribute('updatedStatus', input.status);
    }
    if (input.metadata) {
      span.setAttribute('updatedMetadata', true);
    }

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Validate input
      validate(input, validateUpdatePortfolioInput);

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildPortfolioUrl(orgId, ledgerId, id)}`;
      const result = await this.httpClient.patch<Portfolio>(url, input);

      // Record metrics
      this.recordMetrics('portfolios.update', 1, {
        orgId,
        ledgerId,
        portfolioId: id,
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
   * Deletes a portfolio
   *
   * @param orgId - Organization ID that owns the portfolio
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param id - Portfolio ID to delete
   * @returns Promise resolving when the portfolio is deleted
   */
  public async deletePortfolio(orgId: string, ledgerId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deletePortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', id);

    try {
      // Validate required parameters
      this.validateRequiredParams(span, { orgId, ledgerId, id });

      // Build the URL and make the request
      const url = `${this.urlBuilder.buildPortfolioUrl(orgId, ledgerId, id)}`;
      await this.httpClient.delete(url);

      // Record metrics
      this.recordMetrics('portfolios.delete', 1, {
        orgId,
        ledgerId,
        portfolioId: id,
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
  private recordMetrics(name: string, value: number, tags?: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags || {});
  }
}
