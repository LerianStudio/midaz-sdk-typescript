# Performance Guide

This guide covers performance optimization techniques and best practices for the Midaz SDK.

## Table of Contents

- [Performance Features](#performance-features)
- [Optimization Techniques](#optimization-techniques)
- [Benchmarking](#benchmarking)
- [Troubleshooting](#troubleshooting)

## Performance Features

### 1. Connection Pooling

The SDK includes built-in connection pooling to reuse HTTP connections:

```typescript
const client = new MidazClient({
  security: {
    connectionPool: {
      maxConnectionsPerHost: 10,
      maxTotalConnections: 50,
      connectionTimeout: 60000,
      requestTimeout: 30000,
    },
  },
});
```

Benefits:

- Reduces connection overhead
- Improves latency for subsequent requests
- Better resource utilization

### 2. Request Caching

Enable caching for read operations:

```typescript
const client = new MidazClient({
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100, // Maximum cache entries
    strategy: 'lru', // Least Recently Used
  },
});
```

Cached operations:

- `listOrganizations()`
- `getOrganization()`
- `listAccounts()`
- `getAccount()`
- All other GET operations

### 3. Concurrent Request Handling

Make multiple requests in parallel:

```typescript
// Good: Parallel execution
const [orgs, ledgers, accounts] = await Promise.all([
  client.entities.organizations.listOrganizations(),
  client.entities.ledgers.listLedgers(orgId),
  client.entities.accounts.listAccounts(orgId, ledgerId),
]);

// Avoid: Sequential execution
const orgs = await client.entities.organizations.listOrganizations();
const ledgers = await client.entities.ledgers.listLedgers(orgId);
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
```

### 4. Batch Operations

Use batch operations when available:

```typescript
// Create multiple accounts in one request
const accounts = await client.entities.accounts.createBatch(orgId, ledgerId, [
  { name: 'Account 1', assetCode: 'USD' },
  { name: 'Account 2', assetCode: 'USD' },
  { name: 'Account 3', assetCode: 'USD' },
]);
```

### 5. Pagination

Use pagination for large datasets:

```typescript
// Fetch data in chunks
const pageSize = 100;
let hasMore = true;
let cursor = undefined;

while (hasMore) {
  const response = await client.entities.accounts.listAccounts(orgId, ledgerId, {
    limit: pageSize,
    cursor: cursor,
  });

  // Process accounts
  processAccounts(response.items);

  cursor = response.nextCursor;
  hasMore = !!cursor;
}
```

## Optimization Techniques

### 1. Minimize Payload Size

Request only the fields you need:

```typescript
// Good: Request specific fields
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId, {
  fields: ['id', 'name', 'balance'],
});

// Avoid: Fetching all fields when not needed
const accounts = await client.entities.accounts.listAccounts(orgId, ledgerId);
```

### 2. Use Compression

Enable compression for large payloads:

```typescript
const client = new MidazClient({
  compression: {
    enabled: true,
    threshold: 1024, // Compress payloads > 1KB
  },
});
```

### 3. Implement Retry Logic

Configure smart retry logic:

```typescript
const client = new MidazClient({
  retries: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffFactor: 2,
    retryableErrors: [429, 502, 503, 504],
  },
});
```

### 4. Connection Keep-Alive

Enable keep-alive for persistent connections:

```typescript
const client = new MidazClient({
  keepAlive: {
    enabled: true,
    initialDelay: 0,
    maxSockets: 50,
  },
});
```

### 5. Resource Cleanup

Always clean up resources when done:

```typescript
// Clean up when shutting down
process.on('SIGTERM', async () => {
  await client.destroy();
  process.exit(0);
});
```

## Benchmarking

### Running Benchmarks

The SDK includes performance benchmarks:

```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark
npm test -- tests/benchmarks/performance.bench.ts
```

### Interpreting Results

Benchmark output shows:

- **Avg (ms)**: Average response time
- **P50 (ms)**: Median response time
- **P90 (ms)**: 90th percentile response time
- **P99 (ms)**: 99th percentile response time

Example output:

```
Benchmark                    | Iterations | Avg (ms) | P50 (ms) | P90 (ms) | P99 (ms)
----------------------------|------------|----------|----------|----------|----------
List Organizations (No Pool) | 100        | 15.2     | 14.5     | 18.3     | 25.1
List Organizations (Pool)    | 100        | 8.7      | 8.2      | 10.1     | 14.3
List Organizations (Cached)  | 100        | 0.3      | 0.2      | 0.5      | 1.2
```

### Custom Benchmarks

Create custom benchmarks for your use case:

```typescript
import { measurePerformance } from 'midaz-sdk/benchmarks';

const results = await measurePerformance(
  'My Custom Operation',
  async () => {
    // Your operation here
    await client.entities.transactions.createTransaction(...);
  },
  100 // iterations
);

console.log(`Average time: ${results.avgTime}ms`);
```

## Troubleshooting

### High Latency

1. **Check Network**: Ensure good connectivity to Midaz servers
2. **Enable Pooling**: Connection pooling reduces overhead
3. **Use Caching**: Cache frequently accessed data
4. **Batch Requests**: Combine multiple operations

### Memory Issues

1. **Limit Cache Size**: Prevent unbounded cache growth
2. **Use Pagination**: Don't load entire datasets at once
3. **Clean Up**: Call `destroy()` when done
4. **Monitor Leaks**: Use heap snapshots to find leaks

### Rate Limiting

1. **Implement Backoff**: Respect rate limit headers
2. **Use Queuing**: Queue requests to stay within limits
3. **Monitor Usage**: Track API usage patterns
4. **Contact Support**: Request higher limits if needed

### Debugging Performance

Enable performance logging:

```typescript
const client = new MidazClient({
  logging: {
    level: 'debug',
    includeTimings: true,
  },
  observability: {
    metrics: {
      enabled: true,
      includeHistograms: true,
    },
  },
});
```

## Performance Checklist

Before deploying:

- [ ] Connection pooling configured
- [ ] Caching strategy defined
- [ ] Pagination implemented for large datasets
- [ ] Retry logic configured
- [ ] Compression enabled for large payloads
- [ ] Resource cleanup implemented
- [ ] Benchmarks run and acceptable
- [ ] Monitoring configured
- [ ] Rate limits understood
- [ ] Error handling optimized
