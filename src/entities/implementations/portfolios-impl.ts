/**
 * @file Portfolio service implementation for the Midaz SDK
 * @description Implements the PortfoliosService interface for managing portfolios within the Midaz system
 */

import { PortfolioApiClient } from '../../api/interfaces/portfolio-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreatePortfolioInput, Portfolio, UpdatePortfolioInput } from '../../models/portfolio';
import { Observability } from '../../util/observability/observability';
import { PortfoliosService } from '../portfolios';

/**
 * Implementation of the PortfoliosService interface
 *
 * This class provides the concrete implementation of the PortfoliosService interface,
 * handling operations for portfolio-related API endpoints. It relies on the PortfolioApiClient
 * to perform the actual HTTP communication, allowing for better separation of concerns.
 *
 * Portfolios represent collections of accounts that can be grouped together for reporting,
 * analysis, or organizational purposes within a ledger. They provide a way to categorize
 * and manage related accounts as a single unit.
 *
 * @implements {PortfoliosService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const portfolioApiClient = apiFactory.createPortfolioApiClient();
 * const portfoliosService = new PortfoliosServiceImpl(portfolioApiClient);
 *
 * // Using the service to list portfolios
 * const portfolios = await portfoliosService.listPortfolios(
 *   "org_123",
 *   "ldg_456",
 *   { limit: 10, offset: 0 }
 * );
 * ```
 */
export class PortfoliosServiceImpl implements PortfoliosService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new PortfoliosServiceImpl
   *
   * @param portfolioApiClient - Portfolio API client for making API requests
   * @param observability - Optional observability provider for tracing and metrics
   */
  constructor(
    private readonly portfolioApiClient: PortfolioApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-portfolios-service',
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
   * Retrieves a paginated list of portfolios for a specific organization and ledger.
   * The results can be filtered, sorted, and paginated using the optional parameters.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param ledgerId - Ledger ID that contains the portfolios
   * @param opts - Optional list options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of portfolios
   *
   * @example
   * ```typescript
   * // List all portfolios for a ledger
   * const portfolios = await portfoliosService.listPortfolios(
   *   "org_123",
   *   "ldg_456"
   * );
   *
   * // List portfolios with pagination
   * const paginatedPortfolios = await portfoliosService.listPortfolios(
   *   "org_123",
   *   "ldg_456",
   *   { limit: 10, offset: 0 }
   * );
   * ```
   */
  public async listPortfolios(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Portfolio>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listPortfolios');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    if (opts?.limit) {
      span.setAttribute('limit', opts.limit);
    }
    if (opts?.offset) {
      span.setAttribute('offset', opts.offset);
    }

    try {
      // Delegate to the API client
      const result = await this.portfolioApiClient.listPortfolios(orgId, ledgerId, opts);

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
   * Gets a specific portfolio by ID
   *
   * Retrieves the details of a specific portfolio identified by its ID.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param portfolioId - ID of the portfolio to retrieve
   * @returns Promise resolving to the portfolio details
   *
   * @example
   * ```typescript
   * // Get a specific portfolio
   * const portfolio = await portfoliosService.getPortfolio(
   *   "org_123",
   *   "ldg_456",
   *   "pfl_789"
   * );
   *
   * console.log(`Portfolio name: ${portfolio.name}`);
   * console.log(`Portfolio description: ${portfolio.description}`);
   * ```
   */
  public async getPortfolio(
    orgId: string,
    ledgerId: string,
    portfolioId: string
  ): Promise<Portfolio> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getPortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', portfolioId);

    try {
      // Delegate to the API client
      const result = await this.portfolioApiClient.getPortfolio(orgId, ledgerId, portfolioId);

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
   * Creates a new portfolio in the specified organization and ledger.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param ledgerId - Ledger ID where the portfolio will be created
   * @param input - Portfolio details to create
   * @returns Promise resolving to the created portfolio
   *
   * @example
   * ```typescript
   * // Create a new portfolio
   * const newPortfolio = await portfoliosService.createPortfolio(
   *   "org_123",
   *   "ldg_456",
   *   {
   *     name: "Investment Portfolio",
   *     entityId: "client_123",
   *     metadata: {
   *       risk_level: "moderate",
   *       manager: "Jane Doe"
   *     }
   *   }
   * );
   *
   * console.log(`Created portfolio with ID: ${newPortfolio.id}`);
   * ```
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

    try {
      // Delegate to the API client
      const result = await this.portfolioApiClient.createPortfolio(orgId, ledgerId, input);

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
   * Updates the details of an existing portfolio identified by its ID.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param portfolioId - ID of the portfolio to update
   * @param input - Updated portfolio details
   * @returns Promise resolving to the updated portfolio
   *
   * @example
   * ```typescript
   * // Update an existing portfolio
   * const updatedPortfolio = await portfoliosService.updatePortfolio(
   *   "org_123",
   *   "ldg_456",
   *   "pfl_789",
   *   {
   *     name: "Revised Investment Portfolio",
   *     metadata: {
   *       risk_level: "high",
   *       manager: "John Smith"
   *     }
   *   }
   * );
   *
   * console.log(`Updated portfolio: ${updatedPortfolio.name}`);
   * ```
   */
  public async updatePortfolio(
    orgId: string,
    ledgerId: string,
    portfolioId: string,
    input: UpdatePortfolioInput
  ): Promise<Portfolio> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updatePortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', portfolioId);
    if (input.name) {
      span.setAttribute('portfolioName', input.name);
    }

    try {
      // Delegate to the API client
      const result = await this.portfolioApiClient.updatePortfolio(
        orgId,
        ledgerId,
        portfolioId,
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
   * Deletes a portfolio
   *
   * Permanently removes a portfolio from the system.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param ledgerId - Ledger ID that contains the portfolio
   * @param portfolioId - ID of the portfolio to delete
   * @returns Promise that resolves when the portfolio is deleted
   *
   * @example
   * ```typescript
   * // Delete a portfolio
   * await portfoliosService.deletePortfolio(
   *   "org_123",
   *   "ldg_456",
   *   "pfl_789"
   * );
   *
   * console.log("Portfolio successfully deleted");
   * ```
   */
  public async deletePortfolio(
    orgId: string,
    ledgerId: string,
    portfolioId: string
  ): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deletePortfolio');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('portfolioId', portfolioId);

    try {
      // Delegate to the API client
      await this.portfolioApiClient.deletePortfolio(orgId, ledgerId, portfolioId);

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
