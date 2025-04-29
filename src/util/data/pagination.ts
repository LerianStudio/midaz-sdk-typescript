/**
 */

import { ListMetadata, ListOptions, ListResponse } from '../../models/common';

/**
 * Options for configuring a paginator instance
 *
 * @template T - Type of items being paginated
 */
export interface PaginatorOptions<T> {
  /**
   * Function to fetch a page of results
   * This function should accept ListOptions and return a Promise resolving to a ListResponse
   */
  fetchPage: (options: ListOptions) => Promise<ListResponse<T>>;

  /**
   * Initial list options
   * These options will be used for the first page request
   */
  initialOptions?: ListOptions;

  /**
   * Page size (number of items per page)
   * @default 100
   */
  pageSize?: number;

  /**
   * Maximum number of items to fetch across all pages
   * Useful for limiting the total number of items returned
   * @default Infinity
   */
  maxItems?: number;

  /**
   * Maximum number of pages to fetch
   * Useful for limiting the number of API requests
   * @default Infinity
   */
  maxPages?: number;

  /**
   * Function to call on each page of results
   * Allows processing each page as it arrives
   */
  onPage?: (items: T[], meta: ListMetadata) => void;
}

/**
 * Paginator for handling paginated API responses
 *
 * This class implements the AsyncIterator interface, allowing it to be used
 * in for-await-of loops and with other async iteration patterns.
 *
 * @template T - Type of items being paginated
 *
 * @example
 * ```typescript
 * // Create a paginator for accounts
 * const paginator = new Paginator<Account>({
 *   fetchPage: (options) => client.entities.accounts.list(options),
 *   pageSize: 25,
 *   maxItems: 100
 * });
 *
 * // Iterate through pages
 * let result = await paginator.next();
 * while (!result.done) {
 *   const accounts = result.value;
 *   console.log(`Processing ${accounts.length} accounts`);
 *   // Process accounts...
 *   result = await paginator.next();
 * }
 * ```
 */
export class Paginator<T> implements AsyncIterator<T[]> {
  /**
   * Function to fetch a page of results
   * @private
   */
  private fetchPage: (options: ListOptions) => Promise<ListResponse<T>>;

  /**
   * Current list options
   * @private
   */
  private options: ListOptions;

  /**
   * Number of items per page
   * @private
   */
  private pageSize: number;

  /**
   * Maximum number of items to fetch
   * @private
   */
  private maxItems: number;

  /**
   * Maximum number of pages to fetch
   * @private
   */
  private maxPages: number;

  /**
   * Function to call on each page
   * @private
   */
  private onPage?: (items: T[], meta: ListMetadata) => void;

  /**
   * Current page number (0-based)
   * @private
   */
  private currentPage = 0;

  /**
   * Total number of items fetched so far
   * @private
   */
  private totalItems = 0;

  /**
   * Cursor for the next page
   * @private
   */
  private nextCursor?: string;

  /**
   * Whether pagination is complete
   * @private
   */
  private done = false;

  /**
   * Creates a new Paginator instance
   *
   */
  constructor(options: PaginatorOptions<T>) {
    this.fetchPage = options.fetchPage;
    this.options = options.initialOptions || {};
    this.pageSize = options.pageSize || 100;
    this.maxItems = options.maxItems || Infinity;
    this.maxPages = options.maxPages || Infinity;
    this.onPage = options.onPage;

    // Set initial page size
    this.options.limit = this.options.limit || this.pageSize;
  }

  /**
   * Gets the next page of results
   *
   * This method is part of the AsyncIterator interface and is called
   * automatically when using for-await-of loops.
   *
   * @returns Promise resolving to an IteratorResult containing the next page of items
   */
  public async next(): Promise<IteratorResult<T[]>> {
    if (this.done) {
      return { done: true, value: undefined };
    }

    // Check if we've reached the maximum number of pages
    if (this.currentPage >= this.maxPages) {
      this.done = true;
      return { done: true, value: undefined };
    }

    // Update options with cursor
    const options: ListOptions = {
      ...this.options,
      cursor: this.nextCursor,
    };

    // Fetch the next page
    const response = await this.fetchPage(options);

    // Update state
    this.currentPage++;
    this.totalItems += response.items.length;
    this.nextCursor = response.meta.nextCursor;

    // Check if we've reached the end of the results
    if (!this.nextCursor || this.totalItems >= this.maxItems) {
      this.done = true;
    }

    // Call onPage callback if provided
    if (this.onPage) {
      this.onPage(response.items, response.meta);
    }

    // Return the results
    return {
      done: false,
      value: response.items,
    };
  }

  /**
   * Resets the paginator to the beginning
   *
   * This allows reusing the same paginator instance to fetch the data again
   * from the beginning.
   */
  public reset(): void {
    this.currentPage = 0;
    this.totalItems = 0;
    this.nextCursor = undefined;
    this.done = false;
  }
}

/**
 * Creates an async generator for iterating through paginated results
 *
 * This function provides a more convenient way to iterate through
 * paginated results using for-await-of loops.
 *
 * @template T - Type of items being paginated
 * @returns Async generator yielding pages of items
 *
 * @example
 * ```typescript
 * // Iterate through pages of accounts
 * const accountPages = paginateItems<Account>({
 *   fetchPage: (options) => client.entities.accounts.list(options),
 *   pageSize: 25
 * });
 *
 * for await (const accounts of accountPages) {
 *   console.log(`Processing ${accounts.length} accounts`);
 *   // Process accounts...
 * }
 * ```
 */
export async function* paginateItems<T>(options: PaginatorOptions<T>): AsyncGenerator<T[]> {
  const paginator = new Paginator<T>(options);

  let result = await paginator.next();
  while (!result.done) {
    yield result.value;
    result = await paginator.next();
  }
}

/**
 * Fetches all items from a paginated API
 *
 * This is a convenience function that collects all items from all pages
 * into a single array.
 *
 * @template T - Type of items being paginated
 * @returns Promise resolving to an array of all items
 *
 * @example
 * ```typescript
 * // Fetch all accounts (up to maxItems)
 * const allAccounts = await fetchAllItems<Account>({
 *   fetchPage: (options) => client.entities.accounts.list(options),
 *   maxItems: 1000  // Limit to 1000 accounts
 * });
 *
 * console.log(`Fetched ${allAccounts.length} accounts in total`);
 * ```
 */
export async function fetchAllItems<T>(options: PaginatorOptions<T>): Promise<T[]> {
  const allItems: T[] = [];

  for await (const items of paginateItems(options)) {
    allItems.push(...items);
  }

  return allItems;
}

/**
 * Simplified function to fetch all pages of results from a list function
 *
 * This provides a more straightforward way to fetch all items from paginated endpoints
 * without having to create a PaginatorOptions object.
 *
 * @template T - The type of items being paginated
 * @returns Promise resolving to an array of all items
 *
 * @example
 * ```typescript
 * // Fetch all accounts across all pages
 * const allAccounts = await fetchAllPages(
 *   (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options)
 * );
 *
 * // Fetch all transactions with initial filtering
 * const allTransactions = await fetchAllPages(
 *   (options) => client.entities.transactions.listTransactions(orgId, ledgerId, options),
 *   { filter: { status: 'completed' } }
 * );
 * ```
 */
export async function fetchAllPages<T>(
  fetchFunction: (options?: ListOptions) => Promise<ListResponse<T>>,
  initialOptions?: ListOptions
): Promise<T[]> {
  // Initialize options
  const options: PaginatorOptions<T> = {
    fetchPage: fetchFunction,
    initialOptions: initialOptions || {},
    pageSize: initialOptions?.limit || 50,
  };

  // Use the existing fetchAllItems function
  return fetchAllItems(options);
}
