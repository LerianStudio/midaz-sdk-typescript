/**
 * @file Operation paginator implementation for the Midaz SDK
 * @description Implements the OperationPaginator interface for paginating through operations
 */

import { OperationApiClient } from '../../api/interfaces/operation-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { Operation } from '../../models/transaction';
import { HttpClient } from '../../util/network/http-client';
import { Observability } from '../../util/observability/observability';
import { OperationPaginator } from '../operations';

/**
 * Implementation of the OperationPaginator interface
 *
 * This class provides the concrete implementation of the OperationPaginator interface,
 * handling the pagination of operations when retrieving them from the Midaz API.
 * It maintains state about the current page, cursor, and whether there are more
 * operations to retrieve.
 *
 * @implements {OperationPaginator}
 */
export class OperationPaginatorImpl implements OperationPaginator {
  private nextCursor?: string;
  private hasNextPage = true;
  private currentPage?: Operation[];

  /**
   * Creates a new OperationPaginatorImpl
   *
   * @param operationApiClient - Operation API client for making API requests
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param accountId - Account ID
   * @param opts - List options for pagination, sorting, and filtering
   * @param observability - Optional observability instance for tracing and metrics
   */
  constructor(
    private readonly operationApiClient: OperationApiClient,
    private readonly orgId: string,
    private readonly ledgerId: string,
    private readonly accountId: string,
    private readonly opts?: ListOptions,
    private readonly observability?: Observability
  ) {}

  /**
   * Checks if there are more operations to retrieve
   *
   * Determines if there are additional pages of operations available.
   * Returns true if there are more operations to retrieve, false otherwise.
   *
   * This method is based on the presence of a nextCursor in the API response.
   *
   * @returns Promise resolving to true if there are more operations
   */
  public async hasNext(): Promise<boolean> {
    // Create a span for tracing if observability is available
    const span = this.observability?.startSpan('operationPaginator.hasNext');
    span?.setAttribute('orgId', this.orgId);
    span?.setAttribute('ledgerId', this.ledgerId);
    span?.setAttribute('accountId', this.accountId);

    try {
      // If we already know there are no more pages, return false
      if (!this.hasNextPage) {
        span?.setStatus('ok');
        return false;
      }

      // If we have a current page and no next cursor, we're done
      if (this.currentPage && !this.nextCursor) {
        this.hasNextPage = false;
        span?.setStatus('ok');
        return false;
      }

      // Otherwise, there are more operations to retrieve
      span?.setStatus('ok');
      return true;
    } catch (error) {
      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Gets the next page of operations
   *
   * Retrieves the next page of operations based on the pagination settings.
   * If there are no more operations, returns an empty array.
   *
   * This method:
   * 1. Checks if there are more operations to retrieve
   * 2. Prepares the API parameters with the current cursor
   * 3. Makes the API request for the next page of operations
   * 4. Updates the cursor and hasNextPage flag based on the response
   * 5. Returns the current page of operations
   *
   * @returns Promise resolving to the next page of operations
   */
  public async next(): Promise<Operation[]> {
    // Create a span for tracing if observability is available
    const span = this.observability?.startSpan('operationPaginator.next');
    span?.setAttribute('orgId', this.orgId);
    span?.setAttribute('ledgerId', this.ledgerId);
    span?.setAttribute('accountId', this.accountId);
    if (this.nextCursor) {
      span?.setAttribute('cursor', this.nextCursor);
    }

    try {
      // Check if there are more operations to retrieve
      if (!(await this.hasNext())) {
        return [];
      }

      // Prepare the request parameters
      const params = { ...this.opts };
      if (this.nextCursor) {
        params.cursor = this.nextCursor;
      }

      // Make the API request
      const response = await this.operationApiClient.listOperations(
        this.orgId,
        this.ledgerId,
        this.accountId,
        params
      );

      // Update the cursor and current page
      this.nextCursor = response.meta?.nextCursor;
      this.currentPage = response.items;

      // If there's no next cursor, we've reached the end
      if (!this.nextCursor) {
        this.hasNextPage = false;
      }

      // Record metrics if observability is available
      if (this.observability && this.currentPage) {
        this.observability.recordMetric('operations.paginator.page', this.currentPage.length, {
          orgId: this.orgId,
          ledgerId: this.ledgerId,
          accountId: this.accountId,
        });

        // Record metrics for debit and credit operations if present
        const debitCount = this.currentPage.filter((op: Operation) => op.type === 'DEBIT').length;
        const creditCount = this.currentPage.filter((op: Operation) => op.type === 'CREDIT').length;

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

      span?.setStatus('ok');
      return this.currentPage || [];
    } catch (error) {
      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span?.end();
    }
  }
}
