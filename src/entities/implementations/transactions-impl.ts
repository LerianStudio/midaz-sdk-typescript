/**
 */

import { TransactionApiClient } from '../../api/interfaces/transaction-api-client';
import { ListOptions, ListResponse } from '../../models/common';
import {
  BlockFundsInput,
  CountTransactionsOptions,
  CreateAnnotationInput,
  CreateInflowInput,
  CreateOutflowInput,
  CreateTransactionInput,
  RevertTransactionOptions,
  Transaction,
  TransactionStateTransitionOptions,
  UnblockFundsInput,
  UpdateTransactionInput,
} from '../../models/transaction';
import { BasePaginator, PaginatorConfig } from '../../util/data/pagination-abstraction';
import { Observability } from '../../util/observability/observability';
import { TransactionPaginator, TransactionsService } from '../transactions';

/**
 * @inheritdoc
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
   */
  constructor(
    private readonly apiClient: TransactionApiClient,
    observability?: Observability
  ) {
    // Initialize observability with service name
    this.observability = observability || Observability.getInstance();
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

  /** @inheritdoc */
  public async countTransactions(
    orgId: string,
    ledgerId: string,
    options: CountTransactionsOptions
  ): Promise<number> {
    const span = this.observability.startSpan('countTransactions');
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    try {
      const result = await this.apiClient.countTransactions(orgId, ledgerId, options);

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
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        this.observability.recordMetric('transactions.amount', amount, {
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

  /**
   * @inheritdoc
   */
  public async updateTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    return this.traceStateTransition('update', orgId, ledgerId, transactionId, () =>
      this.apiClient.updateTransaction(orgId, ledgerId, transactionId, input)
    );
  }

  /**
   * @inheritdoc
   */
  public async createInflow(
    orgId: string,
    ledgerId: string,
    input: CreateInflowInput
  ): Promise<Transaction> {
    return this.traceFlow('createInflow', 'inflow', orgId, ledgerId, input.send?.asset, () =>
      this.apiClient.createInflow(orgId, ledgerId, input)
    );
  }

  /**
   * @inheritdoc
   */
  public async createOutflow(
    orgId: string,
    ledgerId: string,
    input: CreateOutflowInput
  ): Promise<Transaction> {
    return this.traceFlow('createOutflow', 'outflow', orgId, ledgerId, input.send?.asset, () =>
      this.apiClient.createOutflow(orgId, ledgerId, input)
    );
  }

  /**
   * @inheritdoc
   */
  public async blockFunds(
    orgId: string,
    ledgerId: string,
    input: BlockFundsInput
  ): Promise<Transaction> {
    return this.traceFlow('blockFunds', 'block', orgId, ledgerId, input.send?.asset, () =>
      this.apiClient.blockFunds(orgId, ledgerId, input)
    );
  }

  /**
   * @inheritdoc
   */
  public async unblockFunds(
    orgId: string,
    ledgerId: string,
    input: UnblockFundsInput
  ): Promise<Transaction> {
    return this.traceFlow('unblockFunds', 'unblock', orgId, ledgerId, input.send?.asset, () =>
      this.apiClient.unblockFunds(orgId, ledgerId, input)
    );
  }

  /**
   * @inheritdoc
   */
  public async createAnnotation(
    orgId: string,
    ledgerId: string,
    input: CreateAnnotationInput
  ): Promise<Transaction> {
    return this.traceFlow(
      'createAnnotation',
      'annotation',
      orgId,
      ledgerId,
      input.send?.asset,
      () => this.apiClient.createAnnotation(orgId, ledgerId, input)
    );
  }

  /**
   * Traces a single-sided flow and records its metric.
   *
   * `operation` names the span and matches both the public method and the operation the
   * transport layer emits, so a trace can be followed across the two; `variant` is the
   * metric suffix only.
   *
   * @returns Promise resolving to the transaction the API client answered with
   */
  private async traceFlow(
    operation: string,
    variant: string,
    orgId: string,
    ledgerId: string,
    asset: string | undefined,
    call: () => Promise<Transaction>
  ): Promise<Transaction> {
    const span = this.observability.startSpan(operation);
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);

    if (asset) {
      span.setAttribute('asset', asset);
    }

    try {
      const result = await call();

      this.observability.recordMetric(`transactions.${variant}`, 1, { orgId, ledgerId });

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

  /**
   * @inheritdoc
   */
  public async commitTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction> {
    return this.traceStateTransition('commit', orgId, ledgerId, transactionId, () =>
      this.apiClient.commitTransaction(orgId, ledgerId, transactionId, options)
    );
  }

  /**
   * @inheritdoc
   */
  public async cancelTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: TransactionStateTransitionOptions
  ): Promise<Transaction> {
    return this.traceStateTransition('cancel', orgId, ledgerId, transactionId, () =>
      this.apiClient.cancelTransaction(orgId, ledgerId, transactionId, options)
    );
  }

  /**
   * @inheritdoc
   */
  public async revertTransaction(
    orgId: string,
    ledgerId: string,
    transactionId: string,
    options?: RevertTransactionOptions
  ): Promise<Transaction> {
    return this.traceStateTransition('revert', orgId, ledgerId, transactionId, () =>
      this.apiClient.revertTransaction(orgId, ledgerId, transactionId, options)
    );
  }

  /**
   * Traces a state transition and records its metric
   *
   * @returns Promise resolving to the transaction the API client answered with
   */
  private async traceStateTransition(
    transition: string,
    orgId: string,
    ledgerId: string,
    transactionId: string,
    call: () => Promise<Transaction>
  ): Promise<Transaction> {
    const span = this.observability.startSpan(`${transition}Transaction`);
    span.setAttribute('orgId', orgId);
    span.setAttribute('ledgerId', ledgerId);
    span.setAttribute('transactionId', transactionId);

    try {
      const result = await call();

      this.observability.recordMetric(`transactions.${transition}`, 1, {
        orgId,
        ledgerId,
        transactionId,
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
}

/**
 * @inheritdoc
 */
export class TransactionPaginatorImpl
  extends BasePaginator<Transaction>
  implements TransactionPaginator
{
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
        ledgerId,
      },
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
        count: response.items.length,
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
          category,
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
