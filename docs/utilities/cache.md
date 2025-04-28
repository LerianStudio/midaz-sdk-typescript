# Cache

The Midaz SDK provides a flexible in-memory caching mechanism with time-to-live (TTL) and least-recently-used (LRU) eviction capabilities. This utility can improve performance by caching frequently accessed data.

## Cache Class

The `Cache` class provides a versatile in-memory caching solution:

```typescript
import { Cache } from 'midaz-sdk/util/cache';

// Create a cache with default options
const cache = new Cache<string>();

// Set a value with the default TTL (60 seconds)
cache.set('key1', 'value1');

// Set a value with a custom TTL
cache.set('key2', 'value2', 30000); // 30 seconds

// Get a value
const value = cache.get('key1');
console.log(value); // 'value1'

// Delete a value
cache.delete('key1');

// Clear the entire cache
cache.clear();
```

### Configuration Options

You can customize the cache behavior with options:

```typescript
// Create a cache with custom options
const cache = new Cache<any>({
  ttl: 5 * 60 * 1000,     // 5 minutes TTL
  maxEntries: 1000,       // Maximum of 1000 entries
  useLRU: true            // Use LRU eviction policy
});
```

Cache options include:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | number | 60000 | Time-to-live in milliseconds |
| `maxEntries` | number | 100 | Maximum number of entries to keep in cache |
| `useLRU` | boolean | true | Whether to use a least-recently-used eviction policy |

## Function Memoization

The cache utility also provides a `memoize` function to cache the results of function calls:

```typescript
import { memoize } from 'midaz-sdk/util/cache';

// Memoize a function with default options
const getUser = memoize(
  async (userId: string) => {
    console.log(`Fetching user ${userId}...`);
    // Expensive operation like API call
    return { id: userId, name: `User ${userId}` };
  }
);

// First call will execute the function
const user1 = await getUser('123');
// Console: Fetching user 123...

// Second call with same arguments will return cached result
const user2 = await getUser('123');
// No console output, result is from cache

// Call with different arguments will execute the function again
const user3 = await getUser('456');
// Console: Fetching user 456...
```

### Custom Key Generation

You can customize how cache keys are generated for memoized functions:

```typescript
// Custom key generation function
const getAccount = memoize(
  async (orgId: string, accountId: string) => {
    console.log(`Fetching account ${accountId} in org ${orgId}...`);
    return { id: accountId, orgId };
  },
  // Custom key function
  (orgId, accountId) => `${orgId}:${accountId}`
);

// Calls with same parameters will use cache
await getAccount('org1', 'acc1');
await getAccount('org1', 'acc1'); // Cached

// Different parameters generate different keys
await getAccount('org2', 'acc1'); // Not cached
```

### Memoization Options

You can configure the underlying cache for memoized functions:

```typescript
// Configure the cache for memoization
const getAsset = memoize(
  async (assetId: string) => {
    console.log(`Fetching asset ${assetId}...`);
    return { id: assetId, name: `Asset ${assetId}` };
  },
  // Default key generation
  undefined,
  // Cache options
  {
    ttl: 300000, // 5 minutes
    maxEntries: 50
  }
);
```

## Example Use Cases

### Caching API Responses

```typescript
import { Cache } from 'midaz-sdk/util/cache';

// Create a cache for API responses with 2 minute TTL
const apiCache = new Cache<any>({ ttl: 120000 });

async function fetchData(endpoint: string, params: Record<string, any>) {
  // Create a cache key from endpoint and params
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  
  // Check if result is in cache
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for ${endpoint}`);
    return cachedResult;
  }
  
  // If not in cache, fetch from API
  console.log(`Cache miss for ${endpoint}`);
  const result = await makeApiCall(endpoint, params);
  
  // Store in cache
  apiCache.set(cacheKey, result);
  
  return result;
}
```

### Memoizing Expensive Calculations

```typescript
import { memoize } from 'midaz-sdk/util/cache';

// Memoize an expensive calculation
const calculateTotals = memoize(
  (accountIds: string[], ledgerId: string) => {
    console.log('Running expensive calculation...');
    // Perform expensive calculation
    return accountIds.reduce(
      (result, id) => {
        // Complex calculation logic
        return {
          ...result,
          [id]: Math.random() * 1000 // Simulated calculation
        };
      },
      {}
    );
  },
  // Custom key function that handles arrays
  (accountIds, ledgerId) => `${ledgerId}:${accountIds.sort().join(',')}`
);

// Usage
const result1 = calculateTotals(['acc1', 'acc2'], 'ledger1');
// Logs: Running expensive calculation...

// Same parameters (order doesn't matter due to sorting in key function)
const result2 = calculateTotals(['acc2', 'acc1'], 'ledger1');
// Uses cached result, no log

// Different parameters
const result3 = calculateTotals(['acc1', 'acc3'], 'ledger1');
// Logs: Running expensive calculation...
```

### Caching Entity Lookups

```typescript
import { memoize } from 'midaz-sdk/util/cache';

// Memoized entity lookup functions with different TTLs
const getAsset = memoize(
  async (client, orgId, ledgerId, assetId) => {
    console.log(`Fetching asset ${assetId}...`);
    return client.entities.assets.getAsset(orgId, ledgerId, assetId);
  },
  (client, orgId, ledgerId, assetId) => `asset:${orgId}:${ledgerId}:${assetId}`,
  { ttl: 300000 } // 5 minutes
);

const getAccount = memoize(
  async (client, orgId, accountId) => {
    console.log(`Fetching account ${accountId}...`);
    return client.entities.accounts.getAccount(orgId, accountId);
  },
  (client, orgId, accountId) => `account:${orgId}:${accountId}`,
  { ttl: 60000 } // 1 minute
);

// Usage
const asset = await getAsset(client, organizationId, ledgerId, 'asset123');
const account = await getAccount(client, organizationId, 'account456');
```
