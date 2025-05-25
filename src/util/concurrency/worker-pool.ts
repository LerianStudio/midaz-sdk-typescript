/**
 */

import { getEnv } from '../runtime/environment';

/**
 * Configuration options for the worker pool
 *
 * @template T - Type of the results produced by workers
 */
export interface WorkerPoolOptions<_T> {
  /**
   * Maximum number of concurrent workers
   * Controls how many tasks can run in parallel
   * @default 10
   */
  concurrency?: number;

  /**
   * Whether to preserve the order of results
   * When true, results will be returned in the same order as input items
   * @default true
   */
  preserveOrder?: boolean;

  /**
   * Delay between batches in milliseconds
   * Useful for rate-limiting or reducing load
   * @default 0
   */
  batchDelay?: number;

  /**
   * Function to call on each successful item
   * Allows processing results as they complete
   */
  onSuccess?: (result: any, index: number) => void;

  /**
   * Function to call on each failed item
   * Allows handling errors as they occur
   */
  onError?: (error: Error, index: number) => void;

  /**
   * Whether to continue processing on error
   * When false, the entire pool will reject on first error
   * @default false
   */
  continueOnError?: boolean;
}

/**
 * Default worker pool options
 * @internal
 */
const _DEFAULT_WORKER_POOL_OPTIONS = {
  concurrency: getEnv('MIDAZ_WORKER_POOL_CONCURRENCY')
    ? parseInt(getEnv('MIDAZ_WORKER_POOL_CONCURRENCY')!, 10)
    : 10,
  preserveOrder: getEnv('MIDAZ_WORKER_POOL_PRESERVE_ORDER')
    ? getEnv('MIDAZ_WORKER_POOL_PRESERVE_ORDER')?.toLowerCase() === 'true'
    : true,
  batchDelay: getEnv('MIDAZ_WORKER_POOL_BATCH_DELAY')
    ? parseInt(getEnv('MIDAZ_WORKER_POOL_BATCH_DELAY')!, 10)
    : 0,
  continueOnError: getEnv('MIDAZ_WORKER_POOL_CONTINUE_ON_ERROR')
    ? getEnv('MIDAZ_WORKER_POOL_CONTINUE_ON_ERROR')?.toLowerCase() === 'true'
    : false,
};

/**
 * Processes a collection of items in parallel with controlled concurrency
 *
 * This function allows processing a collection of items in parallel while
 * limiting the number of concurrent operations to avoid overwhelming system
 * resources or external services.
 *
 * @template I - Type of input items
 * @template T - Type of output results
 * @returns Promise resolving to an array of results
 *
 * @example
 * ```typescript
 * // Process a list of user IDs with a maximum of 3 concurrent requests
 * const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
 *
 * const userDetails = await workerPool(
 *   userIds,
 *   async (userId, index) => {
 *     // Fetch user details from API
 *     const response = await fetch(`https://api.example.com/users/${userId}`);
 *     return response.json();
 *   },
 *   {
 *     concurrency: 3,
 *     preserveOrder: true, // Results will be in the same order as userIds
 *     onSuccess: (user, index) => {
 *       console.log(`Processed user ${index + 1}/${userIds.length}`);
 *     }
 *   }
 * );
 *
 * console.log(userDetails); // Array of user details in the same order as userIds
 * ```
 */
export async function workerPool<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<any>,
  options: WorkerPoolOptions<T> = {}
): Promise<any[]> {
  // Return empty array for empty input
  if (!items || items.length === 0) {
    return [];
  }

  // Merge options with defaults
  const mergedOptions: Required<WorkerPoolOptions<T>> = {
    concurrency:
      options.concurrency ?? parseInt(getEnv('MIDAZ_WORKER_POOL_CONCURRENCY') || '10', 10),
    preserveOrder: options.preserveOrder ?? true,
    batchDelay: options.batchDelay ?? 0,
    onSuccess:
      options.onSuccess ??
      (() => {
        /* empty success handler */
      }),
    onError:
      options.onError ??
      (() => {
        /* empty error handler */
      }),
    continueOnError: options.continueOnError ?? false,
  };

  // Process sequentially if concurrency is 1
  if (mergedOptions.concurrency === 1) {
    return processSequentially(items, worker, mergedOptions);
  }

  // Process in batches if batch delay is specified
  if (mergedOptions.batchDelay > 0) {
    return processBatches(items, worker, mergedOptions);
  }

  // Process with throttling otherwise
  return processWithThrottling(items, worker, mergedOptions);
}

/**
 * Processes items sequentially
 *
 * @template I - Type of input items
 * @template T - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
async function processSequentially<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<any>,
  options: Required<WorkerPoolOptions<T>>
): Promise<any[]> {
  const results: any[] = options.preserveOrder ? new Array(items.length) : [];

  // Process items sequentially
  for (let i = 0; i < items.length; i++) {
    try {
      const result = await worker(items[i], i);
      if (options.preserveOrder) {
        results[i] = result;
      } else {
        results.push(result);
      }
      options.onSuccess(result, i);
    } catch (error) {
      options.onError(error as Error, i);
      if (!options.continueOnError) {
        throw error;
      }
    }

    if (options.batchDelay > 0 && i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, options.batchDelay));
    }
  }

  return results;
}

/**
 * Processes items in batches
 *
 * @template I - Type of input items
 * @template T - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
async function processBatches<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<any>,
  options: Required<WorkerPoolOptions<T>>
): Promise<any[]> {
  const results: any[] = options.preserveOrder ? new Array(items.length) : [];

  // Process items in batches
  for (let i = 0; i < items.length; i += options.concurrency) {
    const batch = items.slice(i, i + options.concurrency);
    const batchPromises = batch.map((item, batchIndex) => {
      const index = i + batchIndex;
      return worker(item, index)
        .then((result) => {
          if (options.preserveOrder) {
            results[index] = result;
          } else {
            results.push(result);
          }
          options.onSuccess(result, index);
          return result;
        })
        .catch((error) => {
          options.onError(error, index);
          if (!options.continueOnError) {
            throw error;
          }
        });
    });

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      if (!options.continueOnError) {
        throw error;
      }
    }

    if (options.batchDelay > 0 && i + options.concurrency < items.length) {
      await new Promise((resolve) => setTimeout(resolve, options.batchDelay));
    }
  }

  return results;
}

/**
 * Processes items with throttling for maximum throughput
 *
 * @template I - Type of input items
 * @template T - Type of output results
 * @returns Promise resolving to an array of results
 * @private
 */
async function processWithThrottling<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<any>,
  options: Required<WorkerPoolOptions<T>>
): Promise<any[]> {
  const results: any[] = new Array(items.length);
  let activeCount = 0;
  let itemIndex = 0;
  let errorOccurred = false;

  return new Promise((resolve, reject) => {
    // Function to process the next item
    const processNext = () => {
      if (errorOccurred && !options.continueOnError) {
        return;
      }

      if (itemIndex >= items.length) {
        // All items have been started
        if (activeCount === 0) {
          // All items have completed
          resolve(results);
        }
        return;
      }

      // Process the current item
      const currentIndex = itemIndex++;
      activeCount++;

      worker(items[currentIndex], currentIndex)
        .then((result) => {
          results[currentIndex] = result;
          options.onSuccess(result, currentIndex);
        })
        .catch((error) => {
          options.onError(error, currentIndex);
          if (!options.continueOnError) {
            errorOccurred = true;
            reject(error);
            return;
          }
        })
        .finally(() => {
          activeCount--;

          // Start the next item
          processNext();
        });

      // Start more items if below concurrency limit
      if (activeCount < options.concurrency && itemIndex < items.length) {
        setTimeout(processNext, options.batchDelay);
      }
    };

    // Start initial batch of workers
    for (let i = 0; i < Math.min(options.concurrency, items.length); i++) {
      processNext();
    }
  });
}

/**
 * Sleeps for a specified duration
 *
 * @returns Promise that resolves after the specified duration
 * @private
 */
function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
