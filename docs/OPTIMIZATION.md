# SDK Performance Optimization Guide

This guide provides techniques to optimize the performance of your Midaz SDK integration.

## Table of Contents

- [Initial Setup Optimization](#initial-setup-optimization)
- [Request Optimization](#request-optimization)
- [Memory Optimization](#memory-optimization)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Runtime Performance](#runtime-performance)
- [Monitoring & Profiling](#monitoring--profiling)

## Initial Setup Optimization

### 1. Lazy Initialization

Initialize the client only when needed:

```typescript
let client: MidazClient | null = null;

function getMidazClient(): MidazClient {
  if (!client) {
    client = new MidazClient({
      apiKey: process.env.MIDAZ_API_KEY!,
      baseUrls: { onboarding: process.env.MIDAZ_API_URL! },
      // Minimal initial config
      cache: { ttl: 300000, maxSize: 50 },
      security: {
        connectionPool: {
          maxConnectionsPerHost: 5,
          maxTotalConnections: 10,
        },
      },
    });
  }
  return client;
}
```

### 2. Preconnect to API

Add preconnect hints to your HTML:

```html
<link rel="preconnect" href="https://api.midaz.com" />
<link rel="dns-prefetch" href="https://api.midaz.com" />
```

### 3. Warm Up Connections

```typescript
// Warm up connections on app start
async function warmUpConnections() {
  const client = getMidazClient();
  // Make a lightweight request to establish connection
  await client.entities.organizations.listOrganizations({ limit: 1 });
}

// Call during app initialization
warmUpConnections().catch(console.error);
```

## Request Optimization

### 1. Batch Requests

Instead of multiple sequential requests:

```typescript
// ❌ Slow: Sequential requests
const org = await client.entities.organizations.getOrganization(orgId);
const ledgers = await client.entities.ledgers.listLedgers(orgId);
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);

// ✅ Fast: Parallel requests
const [org, ledgers, accounts] = await Promise.all([
  client.entities.organizations.getOrganization(orgId),
  client.entities.ledgers.listLedgers(orgId),
  client.entities.accounts.listAccounts(orgId, ledgerId),
]);
```

### 2. Use Pagination Efficiently

```typescript
// Optimal page size based on your use case
const PAGE_SIZE = 100;

async function* getAllAccounts(orgId: string, ledgerId: string) {
  let cursor: string | undefined;

  do {
    const response = await client.entities.accounts.listAccounts(orgId, ledgerId, {
      limit: PAGE_SIZE,
      cursor,
    });

    yield* response.items;
    cursor = response.nextCursor;
  } while (cursor);
}

// Process in batches
const batchSize = 10;
const batch: Account[] = [];

for await (const account of getAllAccounts(orgId, ledgerId)) {
  batch.push(account);

  if (batch.length === batchSize) {
    await processBatch(batch);
    batch.length = 0;
  }
}

if (batch.length > 0) {
  await processBatch(batch);
}
```

### 3. Field Selection

Request only needed fields (when API supports it):

```typescript
// Future API feature
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId, {
  fields: ['id', 'name', 'balance'], // Only request needed fields
});
```

## Memory Optimization

### 1. Clean Up Resources

```typescript
// Always clean up when done
process.on('SIGTERM', async () => {
  await client.destroy();
  process.exit(0);
});

// In serverless functions
export async function handler(event: any) {
  const client = new MidazClient(config);
  try {
    // Your logic here
    return result;
  } finally {
    await client.destroy();
  }
}
```

### 2. Limit Cache Size

```typescript
const client = new MidazClient({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100, // Limit number of cached items
    // Custom size calculation
    sizeCalculation: (value) => {
      return JSON.stringify(value).length;
    },
    maxByteSize: 10 * 1024 * 1024, // 10MB max
  },
});
```

### 3. Stream Large Datasets

```typescript
// For large data exports
async function exportTransactions(orgId: string, ledgerId: string, stream: WritableStream) {
  const writer = stream.getWriter();

  try {
    for await (const transaction of getAllTransactions(orgId, ledgerId)) {
      await writer.write(JSON.stringify(transaction) + '\n');
    }
  } finally {
    await writer.close();
  }
}
```

## Bundle Size Optimization

### 1. Tree Shaking

```typescript
// ❌ Imports entire SDK
import * as Midaz from 'midaz-sdk';

// ✅ Imports only what's needed
import { MidazClient } from 'midaz-sdk/core';
import { createOrganizationsService } from 'midaz-sdk/entities/organizations';
```

### 2. Dynamic Imports

```typescript
// Load features on demand
async function loadTransactionModule() {
  const { TransactionsService } = await import('midaz-sdk/entities/transactions');
  return new TransactionsService(client);
}

// React example
const TransactionView = lazy(() =>
  import('./TransactionView').then((module) => ({
    default: module.TransactionView,
  }))
);
```

### 3. Production Build

```bash
# Optimize for production
NODE_ENV=production npm run build:optimized

# Analyze bundle
npm run build:analyze
```

## Runtime Performance

### 1. Connection Pooling

```typescript
const client = new MidazClient({
  security: {
    connectionPool: {
      maxConnectionsPerHost: 10, // Adjust based on load
      maxTotalConnections: 50,
      connectionTimeout: 60000,
      requestTimeout: 30000,
      // Keep-alive settings
      keepAlive: true,
      keepAliveInitialDelay: 0,
    },
  },
});
```

### 2. Circuit Breaker Tuning

```typescript
const client = new MidazClient({
  security: {
    circuitBreaker: {
      failureThreshold: 5, // Open after 5 failures
      successThreshold: 2, // Close after 2 successes
      timeout: 30000, // Try again after 30s
      rollingWindow: 60000, // Count failures in 1 minute window
    },
    // Per-endpoint configuration
    endpointCircuitBreakers: {
      '/v1/organizations': {
        failureThreshold: 10, // Less sensitive for this endpoint
      },
      '/v1/transactions': {
        failureThreshold: 3, // More sensitive for critical endpoint
      },
    },
  },
});
```

### 3. Retry Strategy

```typescript
const client = new MidazClient({
  retries: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffFactor: 2,
    // Retry only on specific errors
    retryCondition: (error) => {
      if (error.status) {
        return [408, 429, 500, 502, 503, 504].includes(error.status);
      }
      return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
    },
  },
});
```

### 4. Timeout Budget

```typescript
// Ensure operations complete within time limit
const client = new MidazClient({
  timeout: 30000, // Total timeout budget
  security: {
    timeoutBudget: {
      enabled: true,
      minRequestTimeout: 1000, // Minimum 1s per request
    },
  },
});
```

## Monitoring & Profiling

### 1. Enable Metrics

```typescript
const client = new MidazClient({
  observability: {
    metrics: {
      enabled: true,
      flushInterval: 60000,
      onFlush: async (metrics) => {
        // Send to your metrics service
        await sendToPrometheus(metrics);
      },
    },
  },
});

// Get metrics summary
const summary = MetricsCollector.getInstance().getSummary();
console.log('API Performance:', summary);
```

### 2. Performance Timing

```typescript
import { performance } from 'perf_hooks';

async function measureApiCall() {
  const start = performance.now();

  try {
    const result = await client.entities.organizations.listOrganizations();
    const duration = performance.now() - start;

    console.log(`API call took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`API call failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}
```

### 3. Memory Profiling

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
  });
}, 30000);
```

## Performance Checklist

Before deploying to production:

- [ ] Enable connection pooling with appropriate limits
- [ ] Configure caching with size limits
- [ ] Set up circuit breakers for fault tolerance
- [ ] Implement proper retry logic
- [ ] Use timeout budgets for time-sensitive operations
- [ ] Enable compression for large payloads
- [ ] Implement request batching where possible
- [ ] Use pagination for large datasets
- [ ] Clean up resources properly
- [ ] Monitor and profile performance
- [ ] Optimize bundle size with tree shaking
- [ ] Use dynamic imports for optional features
- [ ] Test under expected load conditions
- [ ] Set up alerts for performance degradation

## Benchmarking

Run the SDK benchmarks to establish baselines:

```bash
# Run performance benchmarks
npm run benchmark

# Profile specific operations
NODE_ENV=production node --prof your-app.js
node --prof-process isolate-*.log > profile.txt
```

## Common Pitfalls

1. **Not reusing client instances**: Create once, reuse many times
2. **Sequential requests**: Use Promise.all() for parallel operations
3. **Unbounded caching**: Always set cache size limits
4. **Missing error handling**: Errors impact performance
5. **Not cleaning up**: Memory leaks degrade performance over time

## Getting Help

If you're experiencing performance issues:

1. Run the built-in benchmarks
2. Enable metrics collection
3. Profile your specific use case
4. Check the troubleshooting guide
5. Contact support with metrics data
