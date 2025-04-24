/**
 * @file Transactions service implementation for the Midaz SDK
 * @description Implements the TransactionsService interface for managing transactions within the Midaz system
 */

import { TransactionApiClient } from '../../api/interfaces/transaction-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreateTransactionInput, Transaction } from '../../models/transaction';
import { Observability } from '../../util/observability/observability';
import { TransactionPaginator, TransactionsService } from '../transactions';

/**
 * Implementation of the TransactionsService interface
 *
 * This class provides the concrete implementation of the TransactionsService interface,
 * delegating HTTP communication to the provided API client while focusing on business logic.
 * It handles validation, error handling, observability, and pagination.
 *
 * Transactions are the core financial records in the Midaz system, representing
 * monetary movements between accounts. Each transaction consists of multiple operations
 * that must balance (total debits = total credits).
 *
 * @implements {TransactionsService}
 *
 * @example
 * ```typescript
 * // Creating an instance (typically done through dependency injection)
 * const apiClient = new HttpTransactionApiClient(httpClient, urlBuilder);
 * const transactionsService = new TransactionsServiceImpl(apiClient);
 *
 * // Using the service to list transactions
 * const transactions = await transactionsService.listTransactions(
 *   "org_123",
 *   "ldg_456"
 * );
 * ```
 */
export class TransactionsServiceImpl implements TransactionsService {
  /**
   * Observability instance for tracing and metrics
   * @private
   */
  private readonly observability: Observability;

  /**
   * Creates a new TransactionsServiceImpl
   *
   * @param apiClient - API client for transaction-related operations
   * @param observability - Optional observability provider (if not provided, a new one will be created)
   */
  constructor(private readonly apiClient: TransactionApiClient, observability?: Observability) {
    // Initialize observability with service name
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-transactions-service',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Lists transactions with optional filters
   *
   * Retrieves a paginated list of transactions within the specified organization and ledger.
   * The results can be filtered, sorted, and paginated using the options parameter.
   *
   * This method includes automatic error handling and observability.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Promise resolving to a paginated list of transactions
   */
  public async listTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<ListResponse<Transaction>> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('listTransactions');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (opts) {
      span.setAttribute('limit', opts.limit || 0);
      span.setAttribute('offset', opts.offset || 0);
      if (opts.filter) {
        span.setAttribute('hasFilters', true);
      }
    }

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.listTransactions(orgId, ledgerId, opts);

      // Record metrics
      this.observability.recordMetric('transactions.list.count', result.items.length, {
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
   * Gets a transaction paginator for iterating through transactions
   *
   * Creates a paginator object that can be used to iterate through transactions
   * page by page. This is useful for processing large numbers of transactions
   * without loading them all into memory at once.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for pagination, sorting, and filtering
   * @returns Transaction paginator for iterating through transactions
   */
  public getTransactionPaginator(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): TransactionPaginator {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getTransactionPaginator');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    try {
      // Create a paginator with the API client
      const paginator = new TransactionPaginatorImpl(
        this.apiClient,
        orgId,
        ledgerId,
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
   * Iterates through all transactions
   *
   * Returns an async generator that yields pages of transactions, automatically
   * handling pagination. This is useful for processing large numbers of transactions
   * using modern JavaScript async iteration.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for sorting and filtering
   * @returns Async generator yielding pages of transactions
   */
  public async *iterateTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): AsyncGenerator<Transaction[], void, unknown> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('iterateTransactions');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    try {
      const paginator = this.getTransactionPaginator(orgId, ledgerId, opts);
      let pageCount = 0;

      while (await paginator.hasNext()) {
        const transactions = await paginator.next();
        pageCount++;

        // Record metrics for each page
        this.observability.recordMetric('transactions.iterate.page', 1, {
          orgId,
          ledgerId,
          pageCount,
          transactionCount: transactions.length,
        });

        yield transactions;
      }

      span.setAttribute('totalPages', pageCount);
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
   * Gets all transactions (convenience method that handles pagination)
   *
   * Retrieves all transactions matching the specified criteria, automatically
   * handling pagination. This is a convenience method that loads all matching
   * transactions into memory at once.
   *
   * @param orgId - Organization ID that owns the transactions
   * @param ledgerId - Ledger ID that contains the transactions
   * @param opts - List options for sorting and filtering
   * @returns Promise resolving to all transactions
   */
  public async getAllTransactions(
    orgId: string,
    ledgerId: string,
    opts?: ListOptions
  ): Promise<Transaction[]> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getAllTransactions');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    try {
      const transactions: Transaction[] = [];

      for await (const page of this.iterateTransactions(orgId, ledgerId, opts)) {
        transactions.push(...page);
      }

      // Record metrics
      this.observability.recordMetric('transactions.getAll.count', transactions.length, {
        orgId,
        ledgerId,
      });

      span.setAttribute('transactionCount', transactions.length);
      span.setStatus('ok');
      return transactions;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Gets a transaction by ID
   *
   * Retrieves a single transaction by its unique identifier within the specified
   * organization and ledger.
   *
   * @param orgId - Organization ID that owns the transaction
   * @param ledgerId - Ledger ID that contains the transaction
   * @param id - Transaction ID to retrieve
   * @returns Promise resolving to the transaction
   */
  public async getTransaction(orgId: string, ledgerId: string, id: string): Promise<Transaction> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('getTransaction');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('transactionId', id);

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.getTransaction(orgId, ledgerId, id);

      // Record metrics
      this.observability.recordMetric('transactions.get', 1, {
        orgId,
        ledgerId,
        transactionId: id,
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
   * Creates a new transaction
   *
   * Creates a new transaction within the specified organization and ledger using
   * the provided transaction details. The transaction will be validated and
   * assigned a unique identifier.
   *
   * @param orgId - Organization ID that will own the transaction
   * @param ledgerId - Ledger ID that will contain the transaction
   * @param input - Transaction creation input with required properties
   * @returns Promise resolving to the created transaction
   */
  public async createTransaction(
    orgId: string,
    ledgerId: string,
    input: CreateTransactionInput
  ): Promise<Transaction> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('createTransaction');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    // Set attributes for the transaction if available
    if (input.description) {
      span.setAttribute('description', input.description);
    }
    if (input.externalId) {
      span.setAttribute('externalId', input.externalId);
    }
    span.setAttribute('operationCount', input.operations?.length || 0);

    try {
      // Delegate to API client (validation happens there)
      const result = await this.apiClient.createTransaction(orgId, ledgerId, input);

      // Record metrics
      this.observability.recordMetric('transactions.create', 1, {
        orgId,
        ledgerId,
      });

      // Record transaction amount metrics if available
      if (input.amount) {
        this.observability.recordMetric('transactions.amount', input.amount, {
          orgId,
          ledgerId,
          assetCode: input.assetCode || 'unknown',
        });
      }

      span.setAttribute('transactionId', result.id);
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
}

/**
 * Implementation of the TransactionPaginator interface
 *
 * This class provides the concrete implementation of the TransactionPaginator interface,
 * handling the pagination of transactions when retrieving them from the Midaz API.
 * It maintains state about the current page, cursor, and whether there are more
 * transactions to retrieve.
 *
 * @implements {TransactionPaginator}
 */
export class TransactionPaginatorImpl implements TransactionPaginator {
  private nextCursor?: string;
  private hasNextPage = true;
  private currentPage?: Transaction[];
  private readonly observability: Observability;

  /**
   * Creates a new TransactionPaginatorImpl
   *
   * @param apiClient - API client for transaction operations
   * @param orgId - Organization ID
   * @param ledgerId - Ledger ID
   * @param opts - List options for pagination
   * @param observability - Optional observability instance (if not provided, a new one will be created)
   */
  constructor(
    private readonly apiClient: TransactionApiClient,
    private readonly orgId: string,
    private readonly ledgerId: string,
    private readonly opts?: ListOptions,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability =
      observability ||
      new Observability({
        serviceName: 'midaz-transaction-paginator',
        enableTracing: process.env.MIDAZ_ENABLE_TRACING
          ? process.env.MIDAZ_ENABLE_TRACING.toLowerCase() === 'true'
          : false,
        enableMetrics: process.env.MIDAZ_ENABLE_METRICS
          ? process.env.MIDAZ_ENABLE_METRICS.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Checks if there are more transactions to retrieve
   *
   * Determines if there are additional pages of transactions available.
   * Returns true if there are more transactions to retrieve, false otherwise.
   *
   * This method is based on the presence of a nextCursor in the API response.
   *
   * @returns Promise resolving to true if there are more transactions
   */
  public async hasNext(): Promise<boolean> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('hasNext');
    span.setAttribute('orgId', this.orgId);
    span.setAttribute('ledgerId', this.ledgerId);

    try {
      const result = this.hasNextPage;
      span.setAttribute('hasNext', result);
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
   * Gets the next page of transactions
   *
   * Retrieves the next page of transactions based on the pagination settings.
   * If there are no more transactions, returns an empty array.
   *
   * This method:
   * 1. Checks if there are more transactions to retrieve
   * 2. Makes an API request with the current cursor
   * 3. Updates the cursor and hasNextPage flag based on the response
   * 4. Returns the current page of transactions
   *
   * @returns Promise resolving to the next page of transactions
   */
  public async next(): Promise<Transaction[]> {
    // Create a span for tracing this operation
    const span = this.observability.startSpan('next');
    span.setAttribute('orgId', this.orgId);
    span.setAttribute('ledgerId', this.ledgerId);

    try {
      // If there are no more pages, return an empty array
      if (!this.hasNextPage) {
        span.setAttribute('transactionCount', 0);
        span.setStatus('ok');
        return [];
      }

      // Prepare options with cursor
      const paginationOpts = {
        ...this.opts,
        cursor: this.nextCursor,
      };

      // Make the request through the API client
      const response = await this.apiClient.listTransactions(
        this.orgId,
        this.ledgerId,
        paginationOpts
      );

      // Update pagination state
      this.nextCursor = response.meta?.nextCursor;
      this.hasNextPage = !!this.nextCursor;
      this.currentPage = response.items;

      // Record metrics
      this.observability.recordMetric('transactions.paginator.fetch', 1, {
        orgId: this.orgId,
        ledgerId: this.ledgerId,
        count: this.currentPage?.length || 0,
      });

      span.setAttribute('transactionCount', this.currentPage?.length || 0);
      span.setAttribute('hasMore', this.hasNextPage);
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
   * Gets the current page of transactions
   *
   * @returns The current page of transactions
   */
  public async getCurrentPage(): Promise<Transaction[]> {
    const span = this.observability.startSpan('TransactionPaginator.getCurrentPage');

    try {
      // Fetch current page if not already fetched
      if (!this.currentPage) {
        await this.next();
      }

      // Record metrics
      this.observability.recordMetric(
        'transactions.paginator.page_size',
        this.currentPage?.length || 0,
        {
          organizationId: this.orgId,
          ledgerId: this.ledgerId,
          count: this.currentPage?.length || 0,
        }
      );

      span.setAttribute('transactionCount', this.currentPage?.length || 0);
      span.setStatus('ok');

      // Return current page
      return this.currentPage || [];
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
