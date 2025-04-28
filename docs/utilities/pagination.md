# Pagination Utilities

The Midaz SDK provides pagination utilities to help you efficiently process large result sets from list operations. This document explains how to use these utilities to handle paginated responses.

## Understanding Pagination

The Midaz API returns paginated results for list operations to limit response size and improve performance. Each paginated response includes:

```typescript
interface ListResponse<T> {
  data: T[];      // The current page of results
  total: number;  // Total number of items across all pages
  offset: number; // Current offset (starting position)
  limit: number;  // Number of items per page
  hasMore: boolean; // Whether there are more pages available
}
```

## Basic Manual Pagination

You can manually handle pagination by making successive requests:

```typescript
import { MidazClient } from 'midaz-sdk';

async function fetchAllAssets(client, orgId, ledgerId) {
  const allAssets = [];
  let offset = 0;
  const limit = 50; // Number of items per page
  let hasMore = true;
  
  while (hasMore) {
    const response = await client.entities.assets.listAssets(
      orgId, 
      ledgerId, 
      { limit, offset }
    );
    
    // Add current page results to the accumulated results
    allAssets.push(...response.data);
    
    // Update offset for next page
    offset += limit;
    
    // Check if there are more results
    hasMore = response.data.length === limit;
  }
  
  return allAssets;
}
```

## Using the Pagination Utility

The SDK provides a `processPaginatedResults` utility to simplify handling paginated data:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get all assets across all pages
const allAssets = await processPaginatedResults(
  (options) => client.entities.assets.listAssets(orgId, ledgerId, options)
);

// Process all assets
for (const asset of allAssets) {
  console.log(`Asset: ${asset.name} (${asset.id})`);
}
```

## Pagination with Processing

You can also process items as they are fetched, which is useful for memory-efficient processing of large datasets:

```typescript
import { processPaginatedPages } from 'midaz-sdk/util/data';

// Process each page of results
await processPaginatedPages(
  (options) => client.entities.accounts.listAccounts(orgId, ledgerId, options),
  (accounts, pageInfo) => {
    console.log(`Processing page ${pageInfo.pageNumber} (${accounts.length} items)`);
    
    // Process each account in the current page
    for (const account of accounts) {
      // Do something with each account
      console.log(`Account: ${account.name} (${account.id})`);
    }
  }
);
```

## Parallel Pagination Processing

For processing large datasets more efficiently, you can use parallel processing:

```typescript
import { processPaginatedPagesParallel } from 'midaz-sdk/util/data';

// Process pages in parallel with controlled concurrency
await processPaginatedPagesParallel(
  (options) => client.entities.transactions.listTransactions(orgId, ledgerId, options),
  async (transactions) => {
    // Process batch of transactions in parallel
    await Promise.all(
      transactions.map(async (tx) => {
        // Process each transaction
        await processTransaction(tx);
      })
    );
  },
  {
    concurrency: 3,  // Process 3 pages in parallel
    pageSize: 100    // 100 items per page
  }
);
```

## Custom Pagination Options

You can customize pagination parameters:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get assets with custom pagination settings
const allAssets = await processPaginatedResults(
  (options) => client.entities.assets.listAssets(orgId, ledgerId, options),
  {
    initialLimit: 100,    // Initial page size
    initialOffset: 200,   // Start from the 201st item
    maxPages: 5,          // Only process up to 5 pages
    totalLimit: 500       // Only retrieve a maximum of 500 items
  }
);
```

## Filtering During Pagination

You can combine pagination with filtering:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get active accounts only, across all pages
const activeAccounts = await processPaginatedResults(
  (options) => client.entities.accounts.listAccounts(
    orgId, 
    ledgerId, 
    {
      ...options,
      filter: 'status=active'  // Add filter parameter
    }
  )
);
```

## Sorting During Pagination

You can also specify sorting during pagination:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';

// Get transactions sorted by creation date in descending order
const sortedTransactions = await processPaginatedResults(
  (options) => client.entities.transactions.listTransactions(
    orgId, 
    ledgerId, 
    {
      ...options,
      sort: 'createdAt:desc'  // Add sort parameter
    }
  )
);
```

## Error Handling

When using pagination utilities, you should handle potential errors:

```typescript
import { processPaginatedResults } from 'midaz-sdk/util/data';
import { withEnhancedRecovery } from 'midaz-sdk/util';

try {
  // Use enhanced recovery with pagination
  const result = await withEnhancedRecovery(
    () => processPaginatedResults(
      (options) => client.entities.assets.listAssets(orgId, ledgerId, options)
    )
  );
  
  if (result.success) {
    const allAssets = result.data;
    console.log(`Retrieved ${allAssets.length} assets`);
  } else {
    console.error(`Failed to retrieve assets: ${result.error.message}`);
  }
} catch (error) {
  console.error(`Unhandled error during pagination: ${error.message}`);
}
```

## Best Practices

1. **Use the Built-in Utilities**: Prefer the pagination utilities over manual pagination to reduce boilerplate code and ensure proper handling of all edge cases.

2. **Control Page Size**: Adjust the page size based on your application's needs - larger pages mean fewer API calls but more data per response.

3. **Consider Memory Usage**: For very large datasets, use page-by-page processing instead of accumulating all results to avoid memory issues.

4. **Implement Timeouts**: Set appropriate timeouts when processing large datasets to prevent hanging operations.

5. **Add Error Recovery**: Combine pagination utilities with enhanced recovery for robust error handling.

6. **Use Filtering When Possible**: Apply server-side filtering to reduce the amount of data transferred and processed.

## Example: Comprehensive Pagination

```typescript
import { processPaginatedPages } from 'midaz-sdk/util/data';
import { withEnhancedRecovery } from 'midaz-sdk/util';

async function processAllTransactions(client, orgId, ledgerId, startDate, endDate) {
  let processedCount = 0;
  let errorCount = 0;
  
  const paginationOptions = {
    initialLimit: 100,
    maxConcurrentRequests: 2,  // Limit concurrent API calls
    maxRetries: 3              // Retry failed page fetches
  };
  
  // Define the page processor with enhanced recovery
  const processPage = async (transactions, pageInfo) => {
    console.log(`Processing page ${pageInfo.pageNumber} with ${transactions.length} transactions`);
    
    // Process transactions in smaller batches
    const batchSize = 20;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process each batch with enhanced recovery
      const result = await withEnhancedRecovery(
        async () => {
          for (const tx of batch) {
            await processTransaction(tx);
            processedCount++;
          }
        },
        { retries: 2 }
      );
      
      if (!result.success) {
        errorCount += batch.length;
        console.error(`Failed to process batch: ${result.error.message}`);
      }
    }
  };
  
  // Execute pagination with page processor
  await processPaginatedPages(
    (options) => client.entities.transactions.listTransactions(
      orgId, 
      ledgerId, 
      {
        ...options,
        fromDate: startDate,
        toDate: endDate,
        sort: 'createdAt:asc'
      }
    ),
    processPage,
    paginationOptions
  );
  
  return {
    processedCount,
    errorCount,
    totalCount: processedCount + errorCount
  };
}
```
