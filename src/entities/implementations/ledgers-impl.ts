/**
 * @file Ledgers service implementation for the Midaz SDK
 * @description Implements the LedgersService interface for managing ledgers within the Midaz system
 */

import { LedgerApiClient } from '../../api/interfaces/ledger-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../models/ledger';
import { Observability } from '../../util/observability/observability';
import { LedgersService } from '../ledgers';

/**
 * Implementation of the LedgersService interface
 *
 * This class provides the concrete implementation of the LedgersService interface,
 * delegating HTTP communication to the provided API client while focusing on business logic.
 * It handles validation, error handling, observability, and pagination.
 *
 * @implements {LedgersService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done through dependency injection)
 * const apiClient = new HttpLedgerApiClient(httpClient, urlBuilder);
 * const ledgersService = new LedgersServiceImpl(apiClient);
 *
 * // Using the service
 * const ledgers = await ledgersService.listLedgers("org_123");
 * ```
 */
export class LedgersServiceImpl implements LedgersService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new LedgersServiceImpl
   *
   * @param apiClient - API client for ledger-related operations
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(private readonly apiClient: LedgerApiClient, observability?: Observability) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-ledgers-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists ledgers with optional filters
   *
   * Retrieves a paginated list of ledgers within the specified organization.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the ledgers
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of ledgers
   */
  public async listLedgers(orgId: string, opts?: ListOptions): Promise<ListResponse<Ledger>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listLedgers');
    span.setAttribute('orgId', orgId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.listLedgers(orgId, opts);

      // Record metrics
      this.observability.recordMetric('ledgers.list.count', result.items.length, {
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
   * Retrieves a single ledger by its unique identifier within the specified
   * organization.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to retrieve
   * @returns Promise resolving to the ledger
   */
  public async getLedger(orgId: string, id: string): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.getLedger(orgId, id);

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
   * Creates a new ledger within the specified organization using
   * the provided ledger details. The ledger will be initialized with the
   * specified properties and assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the ledger
   * @param input - Ledger creation input with required properties
   * @returns Promise resolving to the created ledger
   */
  public async createLedger(orgId: string, input: CreateLedgerInput): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createLedger');
    span.setAttribute('orgId', orgId);

    // Set attributes for the ledger if available
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
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.createLedger(orgId, input);

      // Record metrics
      this.observability.recordMetric('ledgers.create', 1, {
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
   * Updates the properties of an existing ledger within the specified
   * organization. Only the properties included in the input
   * will be modified; others will remain unchanged.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to update
   * @param input - Ledger update input with properties to change
   * @returns Promise resolving to the updated ledger
   */
  public async updateLedger(orgId: string, id: string, input: UpdateLedgerInput): Promise<Ledger> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('updateLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    // Set attributes for the update if available
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
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.updateLedger(orgId, id, input);

      // Record metrics
      this.observability.recordMetric('ledgers.update', 1, {
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
   * Deletes a ledger from the specified organization.
   * This operation may be restricted if the ledger has associated accounts,
   * balances, or transactions. In many cases, ledgers are soft-deleted (marked as deleted
   * but retained in the system) to maintain audit history.
   *
   * @param orgId - Organization ID that owns the ledger
   * @param id - Ledger ID to delete
   * @returns Promise that resolves when the ledger is deleted
   */
  public async deleteLedger(orgId: string, id: string): Promise<void> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('deleteLedger');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', id);

    try {
      // Delegate to API client (validation happens there)
      await this.apiClient.deleteLedger(orgId, id);

      // Record metrics
      this.observability.recordMetric('ledgers.delete', 1, {
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
}
