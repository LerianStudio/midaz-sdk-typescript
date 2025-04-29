/**
 */

import { OperationApiClient } from '../../api/interfaces/operation-api-client';
import { ListOptions } from '../../models/common';
import { Operation } from '../../models/transaction';
import { BasePaginator, PaginatorConfig } from '../../util/data/pagination-abstraction';
import { Observability } from '../../util/observability/observability';
import { OperationPaginator } from '../operations';

/**
 * Implementation of the OperationPaginator interface
 *
 * This class extends the BasePaginator to provide operation-specific functionality
 * while leveraging the standardized pagination logic.
 * 
 */
export class OperationPaginatorImpl extends BasePaginator<Operation> implements OperationPaginator {
  /**
   * Organization ID
   */
  private readonly orgId: string;

  /**
   * Ledger ID
   */
  private readonly ledgerId: string;

  /**
   * Account ID
   */
  private readonly accountId: string;

  /**
   * Operation API client
   */
  private readonly operationApiClient: OperationApiClient;

  /**
   * Creates a new OperationPaginatorImpl
   *
   */
  constructor(
    operationApiClient: OperationApiClient,
    orgId: string,
    ledgerId: string,
    accountId: string,
    opts?: ListOptions,
    observability?: Observability
  ) {
    // Create the configuration for the base paginator
    const config: PaginatorConfig<Operation> = {
      fetchPage: (options) => operationApiClient.listOperations(orgId, ledgerId, accountId, options),
      initialOptions: opts,
      observability,
      serviceName: 'operation-paginator',
      spanAttributes: {
        orgId,
        ledgerId,
        accountId
      }
    };

    super(config);

    this.orgId = orgId;
    this.ledgerId = ledgerId;
    this.accountId = accountId;
    this.operationApiClient = operationApiClient;
  }

  /**
   * Gets the next page of operations
   *
   * Retrieves the next page of operations based on the pagination settings.
   * If there are no more operations, returns an empty array.
   *
   * This implementation adds operation-specific metrics in addition to the
   * standard pagination metrics.
   *
   * @returns Promise resolving to the next page of operations
   */
  public async next(): Promise<Operation[]> {
    const span = this.createSpan('next');
    
    try {
      // Check if there are more operations to retrieve
      if (!(await this.hasNext())) {
        span.setAttribute('operationCount', 0);
        span.setStatus('ok');
        return [];
      }
      
      // Prepare options with cursor
      const paginationOpts = {
        ...this.options,
        cursor: this.nextCursor,
      };
      
      // Make the API request
      this.lastFetchTimestamp = Date.now();
      const response = await this.operationApiClient.listOperations(
        this.orgId,
        this.ledgerId,
        this.accountId,
        paginationOpts
      );
      
      // Update pagination state
      this.nextCursor = response.meta?.nextCursor;
      this.hasMorePages = !!this.nextCursor;
      this.currentPage = response.items;
      this.pagesFetched++;
      this.itemsFetched += response.items.length;

      // Record standard metrics
      this.observability.recordMetric('operations.paginator.page', response.items.length, {
        orgId: this.orgId,
        ledgerId: this.ledgerId,
        accountId: this.accountId,
      });
      
      // Record operation-specific metrics
      if (this.currentPage) {
        // Count debit and credit operations
        const debitCount = this.currentPage.filter((op) => op.type === 'DEBIT').length;
        const creditCount = this.currentPage.filter((op) => op.type === 'CREDIT').length;

        if (debitCount > 0) {
          this.observability.recordMetric('operations.paginator.debit', debitCount, {
            orgId: this.orgId,
            ledgerId: this.ledgerId,
            accountId: this.accountId,
          });
        }

        if (creditCount > 0) {
          this.observability.recordMetric('operations.paginator.credit', creditCount, {
            orgId: this.orgId,
            ledgerId: this.ledgerId,
            accountId: this.accountId,
          });
        }
      }
      
      span.setAttribute('operationCount', response.items.length);
      span.setAttribute('hasMore', this.hasMorePages);
      span.setStatus('ok');
      
      return this.currentPage || [];
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Gets all operations
   * 
   * Retrieves all operations that match the filters, handling
   * pagination automatically.
   * 
   * @returns Promise resolving to all matching operations
   */
  public async getAllOperations(): Promise<Operation[]> {
    return this.getAllItems();
  }

  /**
   * Tracks operations by type
   * 
   * Iterates through all operations and processes them by type.
   * 
   */
  public async trackOperationsByType(
    debitHandler: (op: Operation) => Promise<void>,
    creditHandler: (op: Operation) => Promise<void>
  ): Promise<void> {
    const span = this.createSpan('trackOperationsByType');
    let debitCount = 0;
    let creditCount = 0;
    
    try {
      await this.forEachItem(async (operation) => {
        if (operation.type === 'DEBIT') {
          await debitHandler(operation);
          debitCount++;
        } else if (operation.type === 'CREDIT') {
          await creditHandler(operation);
          creditCount++;
        }
      });
      
      span.setAttribute('debitCount', debitCount);
      span.setAttribute('creditCount', creditCount);
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