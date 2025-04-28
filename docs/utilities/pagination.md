# Pagination

The Midaz SDK provides pagination utilities to help you efficiently navigate through large result sets. This document explains how to use pagination when working with list operations in the SDK.

## Understanding Pagination

Pagination in the Midaz SDK follows a standard offset-based approach:

```typescript
interface ListOptions {
  limit?: number;    // Number of items to return
  offset?: number;   // Number of items to skip
  sort?: SortOption; // Field and direction to sort by
}

interface ListResponse<T> {
  data: T[];         // Array of items
  total: number;     // Total count of items available
  limit: number;     // Limit used for this response
  offset: number;    // Offset used for this response
  hasMore: boolean;  // Whether more items are available
}
```

## Basic Usage

Most list operations in the SDK accept pagination parameters:

```typescript
// List assets with pagination
const assetList = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { 
    limit: 50,     // Return 50 items
    offset: 0      // Start from the beginning
  }
);

console.log(`Showing ${assetList.data.length} of ${assetList.total} assets`);
console.log(`Has more: ${assetList.hasMore}`);
```

## Navigating Through Pages

To retrieve subsequent pages, increment the offset by the limit:

```typescript
// First page
const page1 = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 0 }
);

// Second page
const page2 = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 50 }
);

// Third page
const page3 = await client.entities.assets.listAssets(
  organizationId,
  ledgerId,
  { limit: 50, offset: 100 }
);
```

## Auto-Pagination Iterator

The SDK provides a utility to automatically handle pagination:

```typescript
import { createPaginatedIterator } from 'midaz-sdk/util';

// Create a paginated iterator for assets
const assetIterator = createPaginatedIterator(
  (options) => client.entities.assets.listAssets(
    organizationId, 
    ledgerId,
    options
  ),
  { 
    limit: 50,                  // Items per page
    maxPages: 10,               // Maximum number of pages to fetch
    initialOffset: 0            // Starting offset
  }
);

// Iterate through all results automatically
for await (const asset of assetIterator) {
  console.log(`Processing asset: ${asset.name} (${asset.id})`);
  // Process each asset...
}
```

## Collecting All Results

To collect all results into a single array:

```typescript
import { collectAllPages } from 'midaz-sdk/util';

// Collect all assets into an array
const allAssets = await collectAllPages(
  (options) => client.entities.assets.listAssets(
    organizationId, 
    ledgerId,
    options
  ),
  { 
    limit: 100,          // Items per page
    maxTotal: 1000       // Maximum total items to collect
  }
);

console.log(`Collected ${allAssets.length} assets`);
```

## Sorting Results

You can specify sorting criteria when listing resources:

```typescript
// List transactions sorted by creation date in descending order
const transactions = await client.entities.transactions.listTransactions(
  organizationId,
  ledgerId,
  { 
    limit: 50,
    offset: 0,
    sort: {
      field: 'createdAt',
      direction: 'desc'
    }
  }
);
```

## Parallel Pagination

For faster processing, you can fetch multiple pages in parallel:

```typescript
import { parallelPaginate } from 'midaz-sdk/util';

// Process multiple pages in parallel
await parallelPaginate(
  (options) => client.entities.accounts.listAccounts(
    organizationId, 
    ledgerId,
    options
  ),
  async (accounts) => {
    // Process each batch of accounts
    for (const account of accounts) {
      await processAccount(account);
    }
  },
  { 
    limit: 50,               // Items per page
    concurrency: 3,          // Number of parallel requests
    maxPages: 10             // Maximum number of pages to process
  }
);
```

## Best Practices

1. **Use Reasonable Page Sizes**

   Choose a page size that balances network efficiency and memory usage:

   ```typescript
   // Too small - inefficient network usage
   { limit: 5, offset: 0 }

   // Good balance for most use cases
   { limit: 50, offset: 0 }

   // Too large - may cause memory issues or timeouts
   { limit: 1000, offset: 0 }
   ```

2. **Handle Empty Results**

   Always check if the result includes data:

   ```typescript
   const response = await client.entities.assets.listAssets(
     organizationId,
     ledgerId,
     { limit: 50, offset: 0 }
   );

   if (response.data.length === 0) {
     console.log('No assets found');
   }
   ```

3. **Use Auto-Pagination for Large Datasets**

   For large datasets, use the auto-pagination utilities:

   ```typescript
   // Better than manually fetching multiple pages
   const iterator = createPaginatedIterator(...);
   for await (const item of iterator) {
     // Process each item
   }
   ```

4. **Set Maximum Limits**

   When collecting all pages, set reasonable limits to avoid processing too many items:

   ```typescript
   const allItems = await collectAllPages(
     fetchFunction,
     { 
       limit: 100,
       maxTotal: 1000,  // Never collect more than 1000 items
       maxPages: 10     // Never fetch more than 10 pages
     }
   );
   ```

5. **Use Filtering when Available**

   Combine pagination with filtering to reduce the dataset size:

   ```typescript
   const transactions = await client.entities.transactions.listTransactions(
     organizationId,
     ledgerId,
     { 
       limit: 50,
       offset: 0,
       status: 'completed',
       fromDate: '2023-01-01T00:00:00Z',
       toDate: '2023-01-31T23:59:59Z'
     }
   );
   ```
