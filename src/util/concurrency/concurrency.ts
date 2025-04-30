/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 */

/**
 * Configuration options for the worker pool
 */
export interface WorkerPoolOptions {
  /**
   * Maximum number of concurrent operations
   * Controls how many tasks can run in parallel
   */
  concurrency: number;

  /**
   * Whether to preserve the order of results
   * When true, results will be returned in the same order as input items
   */
  ordered: boolean;
}

/**
 * Default worker pool options
 * @internal
 */
const DEFAULT_WORKER_POOL_OPTIONS: WorkerPoolOptions = {
  concurrency: process.env.MIDAZ_WORKER_POOL_CONCURRENCY
    ? parseInt(process.env.MIDAZ_WORKER_POOL_CONCURRENCY, 10)
    : 5,
  ordered: process.env.MIDAZ_WORKER_POOL_ORDERED
    ? process.env.MIDAZ_WORKER_POOL_ORDERED.toLowerCase() === 'true'
    : true,
};

/**
 * Executes a function on multiple items with controlled concurrency
 *
 * This function allows processing a collection of items in parallel while
 * limiting the number of concurrent operations to avoid overwhelming system
 * resources or external services.
 *
 * @template T - Type of input items
 * @template R - Type of output results
 * @returns Promise resolving to an array of results
 *
 * @example
 * ```typescript
 * // Process a list of user IDs with a maximum of 3 concurrent requests
 * const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
 *
 * const userDetails = await workerPool({
 *   items: userIds,
 *   workerFn: async (userId) => {
 *     // Fetch user details from API
 *     const response = await fetch(`https://api.example.com/users/${userId}`);
 *     return response.json();
 *   },
 *   options: {
 *     concurrency: 3,
 *     ordered: true // Results will be in the same order as userIds
 *   }
 * });
 *
 * console.log(userDetails); // Array of user details in the same order as userIds
 * ```
 */
export async function workerPool<T, R>({
  items,
  workerFn,
  options = DEFAULT_WORKER_POOL_OPTIONS,
}: {
  items: T[];
  workerFn: (item: T, index: number) => Promise<R>;
  options?: Partial<WorkerPoolOptions>;
}): Promise<R[]> {
  // If no items, return empty array
  if (!items.length) {
    return [];
  }

  // Merge options with defaults
  const mergedOptions: WorkerPoolOptions = {
    ...DEFAULT_WORKER_POOL_OPTIONS,
    ...options,
  };

  // If concurrency is 1, process sequentially
  if (mergedOptions.concurrency === 1) {
    return processSequentially(items, workerFn);
  }

  // If ordered is true, process in batches to maintain order
  if (mergedOptions.ordered) {
    return processBatches(items, workerFn, mergedOptions.concurrency);
  }

  // Otherwise, process with throttling for maximum throughput
  return processWithThrottling(items, workerFn, mergedOptions.concurrency);
}

/**
 * Processes items sequentially
 *
 * @template T - Type of input items
 * @template R - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
async function processSequentially<T, R>(
  items: T[],
  workerFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i++) {
    results.push(await workerFn(items[i], i));
  }

  return results;
}

/**
 * Processes items in batches to maintain order
 *
 * @template T - Type of input items
 * @template R - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
export async function processBatches<T, R>(
  items: T[],
  workerFn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) => workerFn(item, i + batchIndex));

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Processes items with throttling for maximum throughput
 *
 * @template T - Type of input items
 * @template R - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
export async function processWithThrottling<T, R>(
  items: T[],
  workerFn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  // Create a copy of the items array
  const itemsQueue = [...items];
  const results: R[] = [];
  const resultsMap = new Map<number, R>();
  let nextResultIndex = 0;

  // Function to process the next item in the queue
  const processNext = async (index: number): Promise<void> => {
    if (itemsQueue.length === 0) {
      return;
    }

    const itemIndex = items.length - itemsQueue.length;
    // Queue is guaranteed to have items due to the length check above
    const item = itemsQueue.shift() || null;

    // Type assertion to handle the item being passed to the worker function
    const result = await workerFn(item as T, itemIndex);
    resultsMap.set(itemIndex, result);

    // Check if we can add results to the final array
    while (resultsMap.has(nextResultIndex)) {
      const result = resultsMap.get(nextResultIndex);
      // Result must exist since we've checked with resultsMap.has()
      if (result !== undefined) {
        results.push(result);
      }
      resultsMap.delete(nextResultIndex);
      nextResultIndex++;
    }

    // Process the next item
    if (itemsQueue.length > 0) {
      return processNext(index);
    }
  };

  // Start processing with concurrency
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, (_, i) =>
    processNext(i)
  );

  // Wait for all workers to complete
  await Promise.all(workers);

  return results;
}

/**
 * Divides an array into chunks of a specified size
 *
 * @template T - Type of array elements
 * @returns Array of chunks
 *
 * @example
 * ```typescript
 * // Divide an array into chunks of 3
 * const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * const chunks = chunk(items, 3);
 *
 * console.log(chunks);
 * // Output: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
 * ```
 */
export function chunk<T>(array: T[], size = 10): T[][] {
  // Use environment variable for default chunk size if available
  const chunkSize =
    size ||
    (process.env.MIDAZ_DEFAULT_CHUNK_SIZE
      ? parseInt(process.env.MIDAZ_DEFAULT_CHUNK_SIZE, 10)
      : 10);

  // Handle edge cases
  if (!array.length) {
    return [];
  }

  if (chunkSize <= 0) {
    return [array];
  }

  // Create chunks
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}
