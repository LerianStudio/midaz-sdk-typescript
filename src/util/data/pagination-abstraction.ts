/**
 */

import { ListMetadata as _ListMetadata, ListOptions, ListResponse } from '../../models/common';
import { Observability, Span } from '../../util/observability/observability';
import { getEnv } from '../runtime/environment';

/**
 * Generic paginator interface for all entity types
 *
 * @template T - Type of items being paginated
 */
export interface Paginator<T> {
  /**
   * Checks if there are more items to retrieve
   *
   * @returns Promise resolving to true if there are more items
   */
  hasNext(): Promise<boolean>;

  /**
   * Gets the next page of items
   *
   * @returns Promise resolving to the next page of items
   */
  next(): Promise<T[]>;

  /**
   * Gets the current page of items
   *
   * @returns Promise resolving to the current page of items
   */
  getCurrentPage(): Promise<T[]>;

  /**
   * Gets all remaining items (fetches all pages)
   *
   * @returns Promise resolving to all remaining items
   */
  getAllItems(): Promise<T[]>;

  /**
   * Processes each page with a callback function
   *
   */
  forEachPage(callback: (items: T[]) => Promise<void>): Promise<void>;

  /**
   * Processes each item with a callback function
   *
   */
  forEachItem(callback: (item: T) => Promise<void>): Promise<void>;

  /**
   * Gets the current pagination state
   *
   * @returns Current pagination metadata
   */
  getPaginationState(): PaginationState;

  /**
   * Resets the paginator to the beginning
   */
  reset(): void;
}

/**
 * Pagination state representation
 */
export interface PaginationState {
  /**
   * Current cursor for pagination
   */
  cursor?: string;

  /**
   * Whether there are more pages available
   */
  hasMore: boolean;

  /**
   * Total number of pages fetched so far
   */
  pagesFetched: number;

  /**
   * Total number of items fetched so far
   */
  itemsFetched: number;

  /**
   * Last fetch timestamp
   */
  lastFetchTimestamp?: number;
}

/**
 * Configuration options for the paginator
 *
 * @template T - Type of items being paginated
 */
export interface PaginatorConfig<T> {
  /**
   * Function to fetch a page of items
   */
  fetchPage: (options: ListOptions) => Promise<ListResponse<T>>;

  /**
   * Initial list options (filters, sorting, etc.)
   */
  initialOptions?: ListOptions;

  /**
   * Observability provider for tracing and metrics
   */
  observability?: Observability;

  /**
   * Service name for observability
   */
  serviceName?: string;

  /**
   * Maximum number of items to fetch (across all pages)
   */
  maxItems?: number;

  /**
   * Maximum number of pages to fetch
   */
  maxPages?: number;

  /**
   * Attributes to include in observability spans
   */
  spanAttributes?: Record<string, any>;
}

/**
 * Base implementation of the Paginator interface
 *
 * @template T - Type of items being paginated
 */
export abstract class BasePaginator<T> implements Paginator<T> {
  /**
   * Current pagination cursor
   */
  protected nextCursor?: string;

  /**
   * Whether there are more pages to fetch
   */
  protected hasMorePages = true;

  /**
   * Current page of items
   */
  protected currentPage?: T[];

  /**
   * Observability provider
   */
  protected readonly observability: Observability;

  /**
   * Initial list options
   */
  protected readonly options: ListOptions;

  /**
   * Number of pages fetched so far
   */
  protected pagesFetched = 0;

  /**
   * Number of items fetched so far
   */
  protected itemsFetched = 0;

  /**
   * Maximum number of items to fetch
   */
  protected readonly maxItems: number;

  /**
   * Maximum number of pages to fetch
   */
  protected readonly maxPages: number;

  /**
   * Attributes to include in observability spans
   */
  protected readonly spanAttributes: Record<string, any>;

  /**
   * Last fetch timestamp
   */
  protected lastFetchTimestamp?: number;

  /**
   * Creates a new BasePaginator
   *
   */
  constructor(protected readonly config: PaginatorConfig<T>) {
    this.options = config.initialOptions || {};
    this.maxItems = config.maxItems || Infinity;
    this.maxPages = config.maxPages || Infinity;
    this.spanAttributes = config.spanAttributes || {};

    // Set up observability
    this.observability =
      config.observability ||
      new Observability({
        serviceName: config.serviceName || 'midaz-paginator',
        enableTracing: getEnv('MIDAZ_ENABLE_TRACING')
          ? getEnv('MIDAZ_ENABLE_TRACING')?.toLowerCase() === 'true'
          : false,
        enableMetrics: getEnv('MIDAZ_ENABLE_METRICS')
          ? getEnv('MIDAZ_ENABLE_METRICS')?.toLowerCase() === 'true'
          : false,
      });
  }

  /**
   * Creates a span for the current operation
   *
   * @returns Created span with common attributes
   */
  protected createSpan(operationName: string): Span {
    const span = this.observability.startSpan(`paginator.${operationName}`);

    // Add standard attributes
    for (const [key, value] of Object.entries(this.spanAttributes)) {
      span.setAttribute(key, value);
    }

    // Add pagination state attributes
    span.setAttribute('pagesFetched', this.pagesFetched);
    span.setAttribute('itemsFetched', this.itemsFetched);
    span.setAttribute('hasMorePages', this.hasMorePages);

    return span;
  }

  /**
   * Checks if there are more items to retrieve
   *
   * @returns Promise resolving to true if there are more items
   */
  public async hasNext(): Promise<boolean> {
    const span = this.createSpan('hasNext');

    try {
      // Check limits
      const reachedMaxItems = this.itemsFetched >= this.maxItems;
      const reachedMaxPages = this.pagesFetched >= this.maxPages;

      // No more pages if we've reached limits or API indicated no more pages
      const result = this.hasMorePages && !reachedMaxItems && !reachedMaxPages;

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
   * Gets the next page of items
   * This method must be implemented by subclasses
   */
  public abstract next(): Promise<T[]>;

  /**
   * Gets the current page of items
   *
   * @returns Promise resolving to the current page of items
   */
  public async getCurrentPage(): Promise<T[]> {
    const span = this.createSpan('getCurrentPage');

    try {
      // Fetch the page if not already fetched
      if (!this.currentPage) {
        await this.next();
      }

      span.setAttribute('itemCount', this.currentPage?.length || 0);
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
   * Gets all remaining items (fetches all pages)
   *
   * @returns Promise resolving to all remaining items
   */
  public async getAllItems(): Promise<T[]> {
    const span = this.createSpan('getAllItems');
    const allItems: T[] = [];

    try {
      while (await this.hasNext()) {
        const items = await this.next();
        allItems.push(...items);
      }

      span.setAttribute('totalItems', allItems.length);
      span.setStatus('ok');
      return allItems;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Processes each page with a callback function
   *
   */
  public async forEachPage(callback: (items: T[]) => Promise<void>): Promise<void> {
    const span = this.createSpan('forEachPage');

    try {
      while (await this.hasNext()) {
        const items = await this.next();
        await callback(items);
      }

      span.setAttribute('pagesProcessed', this.pagesFetched);
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
   * Processes each item with a callback function
   *
   */
  public async forEachItem(callback: (item: T) => Promise<void>): Promise<void> {
    const span = this.createSpan('forEachItem');

    try {
      await this.forEachPage(async (items) => {
        for (const item of items) {
          await callback(item);
        }
      });

      span.setAttribute('itemsProcessed', this.itemsFetched);
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
   * Gets the current pagination state
   *
   * @returns Current pagination metadata
   */
  public getPaginationState(): PaginationState {
    return {
      cursor: this.nextCursor,
      hasMore: this.hasMorePages,
      pagesFetched: this.pagesFetched,
      itemsFetched: this.itemsFetched,
      lastFetchTimestamp: this.lastFetchTimestamp,
    };
  }

  /**
   * Resets the paginator to the beginning
   */
  public reset(): void {
    const span = this.createSpan('reset');

    try {
      this.nextCursor = undefined;
      this.hasMorePages = true;
      this.currentPage = undefined;
      this.pagesFetched = 0;
      this.itemsFetched = 0;
      this.lastFetchTimestamp = undefined;

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

/**
 * Standard implementation of the Paginator interface
 *
 * @template T - Type of items being paginated
 */
export class StandardPaginator<T> extends BasePaginator<T> {
  /**
   * Gets the next page of items
   *
   * @returns Promise resolving to the next page of items
   */
  public async next(): Promise<T[]> {
    const span = this.createSpan('next');

    try {
      // Check if there are more pages to fetch
      if (!(await this.hasNext())) {
        span.setAttribute('itemCount', 0);
        span.setStatus('ok');
        return [];
      }

      // Prepare options with cursor
      const paginationOpts = {
        ...this.options,
        cursor: this.nextCursor,
      };

      // Fetch the next page
      this.lastFetchTimestamp = Date.now();
      const response = await this.config.fetchPage(paginationOpts);

      // Update pagination state
      this.nextCursor = response.meta?.nextCursor;
      this.hasMorePages = !!this.nextCursor;
      this.currentPage = response.items;
      this.pagesFetched++;
      this.itemsFetched += response.items.length;

      // Record metrics
      this.observability.recordMetric('paginator.page', response.items.length, {
        serviceName: this.config.serviceName || 'midaz-paginator',
        ...this.spanAttributes,
      });

      span.setAttribute('itemCount', response.items.length);
      span.setAttribute('hasMore', this.hasMorePages);
      span.setStatus('ok');

      return this.currentPage;
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
 * Creates a standard paginator for any entity type
 *
 * @template T - Type of items to paginate
 * @returns A new paginator instance
 */
export function createPaginator<T>(config: PaginatorConfig<T>): Paginator<T> {
  return new StandardPaginator<T>(config);
}

/**
 * Creates an async generator for iterating through paginated results
 *
 * @template T - Type of items being paginated
 * @returns Async generator yielding pages of items
 */
export async function* paginateItems<T>(config: PaginatorConfig<T>): AsyncGenerator<T[]> {
  const paginator = createPaginator<T>(config);

  while (await paginator.hasNext()) {
    yield await paginator.next();
  }
}

/**
 * Fetches all items from a paginated API
 *
 * @template T - Type of items being paginated
 * @returns Promise resolving to an array of all items
 */
export async function fetchAllItems<T>(config: PaginatorConfig<T>): Promise<T[]> {
  const paginator = createPaginator<T>(config);
  return paginator.getAllItems();
}
