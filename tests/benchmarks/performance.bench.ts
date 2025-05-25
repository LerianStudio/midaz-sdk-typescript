/**
 * Performance benchmarks for the Midaz SDK
 */

import { MidazClient } from '../../src/client';
import { MockServer, createMidazMockRoutes } from '../integration/mock-server';

// Helper to measure performance
async function measurePerformance(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<{
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p90: number;
  p99: number;
}> {
  const times: number[] = [];

  // Warm up
  for (let i = 0; i < 5; i++) {
    await fn();
  }

  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  times.sort((a, b) => a - b);
  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const avgTime = totalTime / times.length;
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.5)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const p99 = times[Math.floor(times.length * 0.99)];

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    p50,
    p90,
    p99,
  };
}

// Format benchmark results
function formatResults(results: any[]): string {
  const header = [
    'Benchmark',
    'Iterations',
    'Avg (ms)',
    'Min (ms)',
    'Max (ms)',
    'P50 (ms)',
    'P90 (ms)',
    'P99 (ms)',
  ];
  const rows = results.map((r) => [
    r.name,
    r.iterations,
    r.avgTime.toFixed(2),
    r.minTime.toFixed(2),
    r.maxTime.toFixed(2),
    r.p50.toFixed(2),
    r.p90.toFixed(2),
    r.p99.toFixed(2),
  ]);

  // Calculate column widths
  const widths = header.map((h, i) => {
    const maxWidth = Math.max(h.length, ...rows.map((row) => String(row[i]).length));
    return maxWidth + 2;
  });

  // Format table
  const separator = widths.map((w) => '-'.repeat(w)).join('+');
  const formatRow = (row: any[]) => row.map((cell, i) => String(cell).padEnd(widths[i])).join('|');

  return [separator, formatRow(header), separator, ...rows.map(formatRow), separator].join('\n');
}

describe('Performance Benchmarks', () => {
  let mockServer: MockServer;
  let client: MidazClient;
  let clientWithPool: MidazClient;
  let clientWithCache: MidazClient;
  const baseURL = 'http://localhost:3002';

  beforeAll(() => {
    // Save original fetch
    (globalThis as any).__originalFetch = globalThis.fetch;

    // Setup mock server
    mockServer = new MockServer({
      port: 3002,
      latency: 2, // Small realistic latency
    });

    mockServer.addRoutes(createMidazMockRoutes());
    mockServer.install();

    // Create clients
    client = new MidazClient({
      baseUrls: { onboarding: baseURL },
      apiKey: 'test-api-key',
      security: {
        enforceHttps: false,
        allowInsecureHttp: true,
      },
    });

    clientWithPool = new MidazClient({
      baseUrls: { onboarding: baseURL },
      apiKey: 'test-api-key',
      security: {
        enforceHttps: false,
        allowInsecureHttp: true,
        connectionPool: {
          maxConnectionsPerHost: 10,
          maxTotalConnections: 20,
        },
      },
    });

    clientWithCache = new MidazClient({
      baseUrls: { onboarding: baseURL },
      apiKey: 'test-api-key',
      cache: {
        ttl: 60000,
        maxSize: 100,
      },
      security: {
        enforceHttps: false,
        allowInsecureHttp: true,
      },
    });
  });

  afterAll(async () => {
    await client.destroy();
    await clientWithPool.destroy();
    await clientWithCache.destroy();
    mockServer.uninstall();
    mockServer.reset();

    // Restore original fetch
    if ((globalThis as any).__originalFetch) {
      globalThis.fetch = (globalThis as any).__originalFetch;
    }
  });

  test('SDK Performance Benchmarks', async () => {
    const results = [];

    // Benchmark 1: Simple list operation
    results.push(
      await measurePerformance('List Organizations (No Pool)', async () => {
        await client.entities.organizations.listOrganizations();
      })
    );

    // Benchmark 2: List with connection pooling
    results.push(
      await measurePerformance('List Organizations (With Pool)', async () => {
        await clientWithPool.entities.organizations.listOrganizations();
      })
    );

    // Benchmark 3: Cached requests
    results.push(
      await measurePerformance('List Organizations (Cached)', async () => {
        await clientWithCache.entities.organizations.listOrganizations();
      })
    );

    // Benchmark 4: Create operation
    results.push(
      await measurePerformance(
        'Create Organization',
        async () => {
          await client.entities.organizations.createOrganization({
            legalName: 'Test Org',
            legalDocument: '123456789',
          });
        },
        50 // Fewer iterations for write operations
      )
    );

    // Benchmark 5: Concurrent requests
    results.push(
      await measurePerformance(
        'Concurrent Requests (5x)',
        async () => {
          await Promise.all([
            client.entities.organizations.listOrganizations(),
            client.entities.organizations.listOrganizations(),
            client.entities.organizations.listOrganizations(),
            client.entities.organizations.listOrganizations(),
            client.entities.organizations.listOrganizations(),
          ]);
        },
        20
      )
    );

    // Benchmark 6: Error handling
    results.push(
      await measurePerformance(
        'Error Handling (404)',
        async () => {
          try {
            await client.entities.organizations.getOrganization('non-existent');
          } catch {
            // Expected
          }
        },
        50
      )
    );

    // Print results
    console.log('\n\nPERFORMANCE BENCHMARK RESULTS\n');
    console.log(formatResults(results));
    console.log('\n');

    // Basic assertions to ensure tests are reasonable
    results.forEach((result) => {
      expect(result.avgTime).toBeLessThan(1000); // Should be under 1 second
      expect(result.minTime).toBeGreaterThan(0);
      expect(result.p99).toBeLessThan(result.avgTime * 10); // P99 shouldn't be too high
    });
  });

  test('Memory Usage Benchmark', async () => {
    const iterations = 1000;
    const memoryBefore = process.memoryUsage();

    // Create many requests
    for (let i = 0; i < iterations; i++) {
      await client.entities.organizations.listOrganizations();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = process.memoryUsage();
    const heapDiff = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;

    console.log('\n\nMEMORY USAGE BENCHMARK\n');
    console.log(`Iterations: ${iterations}`);
    console.log(`Heap Growth: ${heapDiff.toFixed(2)} MB`);
    console.log(`Heap Growth per Request: ${((heapDiff / iterations) * 1000).toFixed(2)} KB`);

    // Memory growth should be reasonable
    expect(heapDiff / iterations).toBeLessThan(0.1); // Less than 100KB per request
  });

  test('Connection Pool Efficiency', async () => {
    const concurrency = 20;
    const iterations = 5;

    // Without pool
    const withoutPoolStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await Promise.all(
        Array(concurrency)
          .fill(0)
          .map(() => client.entities.organizations.listOrganizations())
      );
    }
    const withoutPoolTime = performance.now() - withoutPoolStart;

    // With pool
    const withPoolStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await Promise.all(
        Array(concurrency)
          .fill(0)
          .map(() => clientWithPool.entities.organizations.listOrganizations())
      );
    }
    const withPoolTime = performance.now() - withPoolStart;

    const improvement = (((withoutPoolTime - withPoolTime) / withoutPoolTime) * 100).toFixed(1);

    console.log('\n\nCONNECTION POOL EFFICIENCY\n');
    console.log(`Without Pool: ${withoutPoolTime.toFixed(2)}ms`);
    console.log(`With Pool: ${withPoolTime.toFixed(2)}ms`);
    console.log(`Improvement: ${improvement}%`);

    // Pool should provide some improvement for concurrent requests
    expect(withPoolTime).toBeLessThanOrEqual(withoutPoolTime);
  });

  test('Cache Hit Rate', async () => {
    let cacheHits = 0;
    let cacheMisses = 0;

    // Set up interceptor to track cache behavior
    mockServer.setInterceptor((request) => {
      if (request.method === 'GET') {
        cacheMisses++;
      }
    });

    // First round - all misses
    for (let i = 0; i < 10; i++) {
      await clientWithCache.entities.organizations.listOrganizations();
    }

    const missesAfterFirst = cacheMisses;

    // Second round - should be cached
    for (let i = 0; i < 10; i++) {
      await clientWithCache.entities.organizations.listOrganizations();
    }

    const missesAfterSecond = cacheMisses;
    cacheHits = 10 - (missesAfterSecond - missesAfterFirst);

    const hitRate = ((cacheHits / 10) * 100).toFixed(1);

    console.log('\n\nCACHE PERFORMANCE\n');
    console.log(`Cache Hits: ${cacheHits}`);
    console.log(`Cache Misses: ${missesAfterSecond - missesAfterFirst}`);
    console.log(`Hit Rate: ${hitRate}%`);

    // Cache should work
    expect(cacheHits).toBeGreaterThan(0);
  });
});
