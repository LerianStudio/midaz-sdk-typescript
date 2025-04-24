/**
 * @file Operations service implementation for the Midaz SDK
 * @description Implements the OperationsService interface for managing operations within the Midaz system
 */

import { OperationApiClient } from '../../api/interfaces/operation-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { Operation } from '../../models/transaction';
import { Observability } from '../../util/observability/observability';
import { OperationPaginator, OperationsService } from '../operations';

import { OperationPaginatorImpl } from './operation-paginator-impl';

/**
 * Implementation of the OperationsService interface
 *
 * This class provides the concrete implementation of the OperationsService interface,
 * handling operations-related business logic and delegating API communication to
 * the OperationApiClient. It validates inputs, manages pagination, and transforms
 * responses as needed.
 *
 * Operations represent the individual entries that make up transactions and record
 * the actual debits and credits to accounts in the ledger system.
 *
 * @implements {OperationsService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done by the MidazClient)
 * const operationApiClient = apiFactory.createOperationApiClient();
 * const operationsService = new OperationsServiceImpl(operationApiClient);
 *
 * // Using the service to list operations
 * const operations = await operationsService.listOperations(
 *   "org_123",
 *   "ldg_456",
 *   "acc_789"
 * );
 * ```
 */
export class OperationsServiceImpl implements OperationsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new OperationsServiceImpl
   *
   * @param operationApiClient - Operation API client for making API requests
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(
    private readonly operationApiClient: OperationApiClient,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-operations-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists operations for an account with optional filters
   *
   * Retrieves a paginated list of operations for a specific account within the
   * specified organization and ledger. The results can be filtered, sorted, and
   * paginated using the options parameter.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of operations
   */
  public async listOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Operation>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listOperations');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to the API client
      const result = await this.operationApiClient.listOperations(orgId, ledgerId, accountId, opts);

      // Record metrics
      this.observability.recordMetric('operations.list.count', result.items.length, {
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
   * Gets an operation by ID
   *
   * Retrieves a single operation by its unique identifier within the specified
   * organization, ledger, and account. Optionally, a transaction ID can be provided
   * to narrow down the search.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID that contains the operation
   * @param operationId - Operation ID to retrieve
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
      // Delegate to the API client
      const result = await this.operationApiClient.getOperation(
        orgId,
        ledgerId,
        accountId,
        operationId,
        transactionId
      );

      // Record metrics
      this.observability.recordMetric('operation.get', 1, {
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
   * Updates the metadata of an existing operation within the specified
   * organization, ledger, and account. Note that most operation properties
   * are immutable once created to maintain the integrity of the ledger.
   * Typically, only metadata fields can be updated.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID that contains the operation
   * @param operationId - Operation ID to update
   * @param input - Operation update input with properties to change
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
      // Delegate to the API client
      const result = await this.operationApiClient.updateOperation(
        orgId,
        ledgerId,
        accountId,
        operationId,
        input
      );

      // Record metrics
      this.observability.recordMetric('operation.update', 1, {
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
   * Gets an operation paginator for iterating through operations
   *
   * Creates a paginator object that can be used to iterate through operations
   * page by page. This is useful for processing large numbers of operations
   * without loading them all into memory at once.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for pagination, sorting, and filtering
   * @returns An operation paginator for iterating through operations
   */
  public getOperationPaginator(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): OperationPaginator {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getOperationPaginator');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Record metrics
      this.observability.recordMetric('operations.paginator.create', 1, {
        orgId,
        ledgerId,
        accountId,
      });

      // Create a new paginator with the API client
      const paginator = new OperationPaginatorImpl(
        this.operationApiClient,
        orgId,
        ledgerId,
        accountId,
        opts,
        this.observability
      );

      span.setStatus('ok');
      return paginator;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Iterates through all operations
   *
   * Returns an async generator that yields pages of operations, automatically
   * handling pagination. This is useful for processing large numbers of operations
   * using modern JavaScript async iteration.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for sorting and filtering
   * @returns Async generator yielding pages of operations
   */
  public async *iterateOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): AsyncGenerator<Operation[], void, unknown> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('iterateOperations');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (opts) {
      span.setAttribute('hasOptions', true);
    }

    try {
      // Record metrics
      this.observability.recordMetric('operations.iterate.start', 1, {
        orgId,
        ledgerId,
        accountId,
      });

      // Use the paginator to iterate through operations
      const paginator = this.getOperationPaginator(orgId, ledgerId, accountId, opts);
      let pageCount = 0;
      let totalOperations = 0;

      while (await paginator.hasNext()) {
        const operations = await paginator.next();
        pageCount++;
        totalOperations += operations.length;

        // Record metrics for each page
        this.observability.recordMetric('operations.iterate.page', operations.length, {
          orgId,
          ledgerId,
          accountId,
          pageNumber: pageCount,
        });

        yield operations;
      }

      // Record final metrics
      this.observability.recordMetric('operations.iterate.complete', totalOperations, {
        orgId,
        ledgerId,
        accountId,
        pageCount,
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
   * Gets all operations (convenience method that handles pagination)
   *
   * Retrieves all operations for a specific account matching the specified criteria,
   * automatically handling pagination. This is a convenience method that loads all
   * matching operations into memory at once.
   *
   * Note: For large result sets, consider using getOperationPaginator() or
   * iterateOperations() instead to avoid memory issues.
   *
   * @param orgId - Organization ID that owns the account
   * @param ledgerId - Ledger ID that contains the account
   * @param accountId - Account ID to retrieve operations for
   * @param opts - List options for sorting and filtering
   * @returns Promise resolving to all operations
   */
  public async getAllOperations(
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions
  ): Promise<Operation[]> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAllOperations');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('accountId', accountId);

    if (opts) {
      span.setAttribute('hasOptions', true);
    }

    try {
      // Record metrics
      this.observability.recordMetric('operations.getAll.start', 1, {
        orgId,
        ledgerId,
        accountId,
      });

      // Use the async generator to collect all operations
      const operations: Operation[] = [];

      for await (const page of this.iterateOperations(orgId, ledgerId, accountId, opts)) {
        operations.push(...page);
      }

      // Record metrics
      this.observability.recordMetric('operations.getAll.count', operations.length, {
        orgId,
        ledgerId,
        accountId,
      });

      // Record metrics for debit and credit operations if present
      const debitCount = operations.filter((op: Operation) => op.type === 'DEBIT').length;
      const creditCount = operations.filter((op: Operation) => op.type === 'CREDIT').length;

      if (debitCount > 0) {
        this.observability.recordMetric('operations.getAll.debit', debitCount, {
          orgId,
          ledgerId,
          accountId,
        });
      }

      if (creditCount > 0) {
        this.observability.recordMetric('operations.getAll.credit', creditCount, {
          orgId,
          ledgerId,
          accountId,
        });
      }

      span.setStatus('ok');
      return operations;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
