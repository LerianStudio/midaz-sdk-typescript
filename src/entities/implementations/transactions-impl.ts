/**
 * @file Transactions service implementation for the Midaz SDK
 * @description Implements the TransactionsService interface for managing transactions within the Midaz system
 */

import { TransactionApiClient } from '../../api/interfaces/transaction-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import { CreateTransactionInput, Transaction } from '../../models/transaction';
import { BasePaginator, PaginatorConfig } from '../../util/data/pagination-abstraction';
import { Observability } from '../../util/observability/observability';
import { TransactionPaginator, TransactionsService } from '../transactions';

/**
 * @inheritdoc
 * @implements {TransactionsService}
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
      Observability.getInstance();
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
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
 * @inheritdoc
 * @implements {TransactionPaginator}
 */
export class TransactionPaginatorImpl extends BasePaginator<Transaction> implements TransactionPaginator {
  /**
   * Organization ID
   */
  private readonly orgId: string;

  /**
   * Ledger ID
   */
  private readonly ledgerId: string;

  /**
   * Transaction API client
   */
  private readonly apiClient: TransactionApiClient;

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
    apiClient: TransactionApiClient,
    orgId: string,
    ledgerId: string,
    opts?: ListOptions,
    observability?: Observability
  ) {
    // Create the configuration for the base paginator
    const config: PaginatorConfig<Transaction> = {
      fetchPage: (options) => apiClient.listTransactions(orgId, ledgerId, options),
      initialOptions: opts,
      observability,
      serviceName: 'transaction-paginator',
      spanAttributes: {
        orgId,
        ledgerId
      }
    };

    super(config);

    this.orgId = orgId;
    this.ledgerId = ledgerId;
    this.apiClient = apiClient;
  }

  /**
   * Gets the next page of transactions
   *
   * Retrieves the next page of transactions based on the pagination settings.
   * If there are no more transactions, returns an empty array.
   *
   * This implementation adds transaction-specific metrics in addition to the
   * standard pagination metrics.
   *
   * @returns Promise resolving to the next page of transactions
   */
  public async next(): Promise<Transaction[]> {
    const span = this.createSpan('next');
    
    try {
      // Check if there are more transactions to retrieve
      if (!(await this.hasNext())) {
        span.setAttribute('transactionCount', 0);
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
      const response = await this.apiClient.listTransactions(
        this.orgId,
        this.ledgerId,
        paginationOpts
      );
      
      // Update pagination state
      this.nextCursor = response.meta?.nextCursor;
      this.hasMorePages = !!this.nextCursor;
      this.currentPage = response.items;
      this.pagesFetched++;
      this.itemsFetched += response.items.length;

      // Record transaction-specific metrics
      this.observability.recordMetric('transactions.paginator.fetch', 1, {
        orgId: this.orgId,
        ledgerId: this.ledgerId,
        count: response.items.length
      });
      
      span.setAttribute('transactionCount', response.items.length);
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
   * Gets all transactions
   * 
   * Retrieves all transactions that match the filters, handling
   * pagination automatically.
   * 
   * @returns Promise resolving to all matching transactions
   */
  public async getAllTransactions(): Promise<Transaction[]> {
    return this.getAllItems();
  }

  /**
   * Process transactions by category
   * 
   * Processes all transactions and groups them by category
   * 
   * @param categoryHandler - Function to call for each transaction with its category
   * @returns Map of categories to transaction counts
   */
  public async categorizeTransactions(
    categoryHandler: (transaction: Transaction, category: string) => Promise<void>
  ): Promise<Map<string, number>> {
    const span = this.createSpan('categorizeTransactions');
    const categoryMap = new Map<string, number>();
    
    try {
      await this.forEachItem(async (transaction) => {
        // Determine category (using a simplified approach for this example)
        const category = transaction.type || 'uncategorized';
        
        // Update category count
        const currentCount = categoryMap.get(category) || 0;
        categoryMap.set(category, currentCount + 1);
        
        // Call the handler
        await categoryHandler(transaction, category);
      });
      
      // Record metrics
      for (const [category, count] of categoryMap.entries()) {
        this.observability.recordMetric('transactions.category', count, {
          orgId: this.orgId,
          ledgerId: this.ledgerId,
          category
        });
      }
      
      span.setAttribute('categoryCount', categoryMap.size);
      span.setStatus('ok');
      return categoryMap;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }
}
