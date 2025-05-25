/**
 */

import { ListResponse } from '../../models/common';

/**
 * Extracts items from an API response that may be either an array or a ListResponse object
 *
 * This is useful for handling different response formats consistently, especially
 * when API endpoints return items directly or wrapped in a response object.
 *
 * @template T - The type of items in the response
 * @returns An array of items, or an empty array if no items were found
 *
 * @example
 * ```typescript
 * // Handle response that might be either format
 * const transactions = await client.entities.transactions.listTransactions(...);
 * const txItems = extractItems(transactions);
 *
 * // Now txItems is guaranteed to be an array, even if the response was:
 * // - An array directly: [tx1, tx2, tx3]
 * // - A ListResponse: { items: [tx1, tx2, tx3], meta: {...} }
 * // - undefined or null
 * ```
 */
export function extractItems<T>(response: T[] | ListResponse<T> | undefined | null | any): T[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  try {
    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // If response is not an object or accessing response.items fails, return empty array
    return [];
  }

  return [];
}

/**
 * Deduplicate items in an array based on a key selector function
 *
 * This is useful for removing duplicate items from API responses,
 * especially when combining results from multiple sources.
 *
 * @template T - The type of items in the array
 * @returns Array of unique items
 *
 * @example
 * ```typescript
 * // Deduplicate accounts by ID
 * const uniqueAccounts = deduplicateItems(allAccounts, account => account.id);
 *
 * // Deduplicate external balances from multiple sources
 * const uniqueBalances = deduplicateItems(
 *   [...regularBalances, ...externalBalances],
 *   balance => balance.accountId
 * );
 * ```
 */
export function deduplicateItems<T, K>(items: T[], keySelector: (item: T) => K): T[] {
  const map = new Map<K, T>();

  for (const item of items) {
    const key = keySelector(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Creates a function that safely accesses properties from potentially undefined objects
 *
 * This is useful for accessing nested properties in API responses without
 * having to check for undefined at each level.
 *
 * @template T - The type of object to access
 * @returns A function that safely accesses properties
 *
 * @example
 * ```typescript
 * // Create a safe accessor for a transaction response
 * const safe = createSafeAccessor<TransactionResponse>();
 *
 * // Access nested properties safely
 * const amount = safe(response, r => r.transaction?.amount?.value, 0);
 * const assetCode = safe(response, r => r.transaction?.amount?.assetCode, 'USD');
 * ```
 */
export function createSafeAccessor<T>() {
  return function safeGet<R>(
    obj: T | undefined | null,
    accessor: (obj: T) => R,
    defaultValue: R
  ): R {
    if (obj === undefined || obj === null) {
      return defaultValue;
    }

    try {
      const value = accessor(obj);
      return value === undefined || value === null ? defaultValue : value;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return defaultValue;
    }
  };
}
