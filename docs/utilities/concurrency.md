# Concurrency Utilities

The Midaz SDK provides several utilities for managing concurrent operations, controlling execution rates, and processing collections of items in parallel with configurable throughput.

## Worker Pool

The worker pool allows you to process a collection of items in parallel while limiting the number of concurrent operations to avoid overwhelming system resources or external services.

### Basic Usage

```typescript
import { workerPool } from 'midaz-sdk/util/concurrency';

// Process a list of user IDs with a maximum of 3 concurrent requests
const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];

const userDetails = await workerPool({
  items: userIds,
  workerFn: async (userId) => {
    // Fetch user details from API
    const response = await fetch(`https://api.example.com/users/${userId}`);
    return response.json();
  },
  options: {
    concurrency: 3,
    ordered: true // Results will be in the same order as userIds
  }
});

console.log(userDetails); // Array of user details in the same order as userIds
```

### Configuration Options

The worker pool accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | number | 5 | Maximum number of concurrent operations |
| `ordered` | boolean | true | Whether to preserve the order of results |

### Processing Large Datasets

The worker pool can efficiently handle large datasets by processing items in smaller batches:

```typescript
import { workerPool, chunk } from 'midaz-sdk/util/concurrency';

// Break a large dataset into chunks
const allItems = await fetchLargeDataset(); // Thousands of items
const itemChunks = chunk(allItems, 100); // Groups of 100 items

// Process each chunk with the worker pool
const results = [];
for (const items of itemChunks) {
  const chunkResults = await workerPool({
    items,
    workerFn: processItem,
    options: { concurrency: 10 }
  });
  results.push(...chunkResults);
}
```

## Rate Limiter

The rate limiter controls the frequency of operations like API requests to prevent throttling and ensure compliance with rate limits.

### Basic Usage

```typescript
import { RateLimiter } from 'midaz-sdk/util/concurrency';

// Create a rate limiter allowing 100 requests per minute
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindowMs: 60000, // 1 minute
  queueExceeded: true,
  maxQueueSize: 1000
});

// Execute a function with rate limiting
try {
  const result = await rateLimiter.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });
  console.log('Success:', result);
} catch (error) {
  console.error('Rate limit exceeded:', error);
}
```

### Configuration Options

The rate limiter accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRequests` | number | 100 | Maximum number of requests allowed per time window |
| `timeWindowMs` | number | 60000 | Time window in milliseconds |
| `queueExceeded` | boolean | true | Whether to queue requests that exceed the rate limit |
| `maxQueueSize` | number | Infinity | Maximum size of the queue for excess requests |

### API Request Management

The rate limiter is particularly useful for API clients that need to respect rate limits:

```typescript
import { RateLimiter } from 'midaz-sdk/util/concurrency';

class ApiClient {
  private rateLimiter: RateLimiter;
  
  constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequests: 50,
      timeWindowMs: 10000, // 10 seconds
      queueExceeded: true
    });
  }
  
  async get(url: string) {
    return this.rateLimiter.execute(async () => {
      const response = await fetch(url);
      return response.json();
    });
  }
  
  async post(url: string, data: any) {
    return this.rateLimiter.execute(async () => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    });
  }
}

// Usage
const api = new ApiClient();
const results = await Promise.all([
  api.get('/resources/1'),
  api.get('/resources/2'),
  api.get('/resources/3')
  // These will be automatically rate limited
]);
```

## Chunking Utility

The Midaz SDK also provides a `chunk` utility to divide arrays into smaller pieces for processing:

```typescript
import { chunk } from 'midaz-sdk/util/concurrency';

// Divide an array into chunks of 3
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const chunks = chunk(items, 3);

console.log(chunks);
// Output: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
```

## Example Use Cases

### Batch Processing Transactions

```typescript
import { workerPool } from 'midaz-sdk/util/concurrency';

async function batchProcessTransactions(client, transactions) {
  // Process up to 5 transactions concurrently
  const results = await workerPool({
    items: transactions,
    workerFn: async (transaction) => {
      try {
        return await client.entities.transactions.createTransaction(
          transaction.organizationId,
          transaction.ledgerId,
          transaction
        );
      } catch (error) {
        // Handle errors but don't stop the batch
        return { 
          error: true, 
          message: error.message, 
          transaction 
        };
      }
    },
    options: {
      concurrency: 5,
      ordered: true
    }
  });
  
  // Separate successful and failed transactions
  const succeeded = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  return { succeeded, failed };
}
```

### Parallel Data Migration

```typescript
import { workerPool } from 'midaz-sdk/util/concurrency';

async function migrateData(sourceClient, targetClient, accountIds) {
  // Migrate up to 3 accounts concurrently
  const migrationResults = await workerPool({
    items: accountIds,
    workerFn: async (accountId) => {
      try {
        // Get source data
        const account = await sourceClient.entities.accounts.getAccount(
          organizationId,
          accountId
        );
        
        // Get associated data
        const balances = await sourceClient.entities.accounts.getAccountBalances(
          organizationId,
          accountId
        );
        
        // Create in target system
        const newAccount = await targetClient.entities.accounts.createAccount(
          organizationId,
          {
            name: account.name,
            ledgerId: account.ledgerId,
            assetIds: account.assetIds,
            metadata: {
              ...account.metadata,
              migratedFrom: account.id,
              migratedAt: new Date().toISOString()
            }
          }
        );
        
        return {
          success: true,
          sourceId: accountId,
          targetId: newAccount.id,
          name: account.name
        };
      } catch (error) {
        return {
          success: false,
          sourceId: accountId,
          error: error.message
        };
      }
    },
    options: {
      concurrency: 3
    }
  });
  
  return migrationResults;
}
```

### Rate-Limited API Integration

```typescript
import { RateLimiter } from 'midaz-sdk/util/concurrency';

async function syncWithExternalApi(client, entities) {
  // Create a rate limiter for the external API
  const rateLimiter = new RateLimiter({
    maxRequests: 30,
    timeWindowMs: 60000, // 30 requests per minute
    queueExceeded: true
  });
  
  // Process each entity
  const results = [];
  for (const entity of entities) {
    try {
      // This will automatically queue if rate limit is exceeded
      const result = await rateLimiter.execute(async () => {
        // Get external data
        const externalData = await fetchFromExternalApi(entity.externalId);
        
        // Update internal system
        return client.entities.updateEntity(
          entity.id,
          {
            ...entity,
            externalData,
            lastSyncedAt: new Date().toISOString()
          }
        );
      });
      
      results.push({
        success: true,
        id: entity.id,
        result
      });
    } catch (error) {
      results.push({
        success: false,
        id: entity.id,
        error: error.message
      });
    }
  }
  
  return results;
}
```
