/**
 */

import { LedgerApiClient } from '../../api/interfaces/ledger-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreateLedgerInput, Ledger, UpdateLedgerInput } from '../../models/ledger';
import { Observability } from '../../util/observability/observability';
import { LedgersService } from '../ledgers';

/**
 * @inheritdoc
 */
export class LedgersServiceImpl implements LedgersService {
  /** Observability instance for tracing and metrics @private */
  private readonly observability: Observability;

  /** Creates a new LedgersServiceImpl */
  constructor(
    private readonly apiClient: LedgerApiClient,
    observability?: Observability
  ) {
    this.observability = observability || Observability.getInstance();
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
