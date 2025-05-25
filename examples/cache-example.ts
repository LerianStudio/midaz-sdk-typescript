/**
 * Cache Utility Example
 *
 * This example demonstrates how to use the Cache utility from the Midaz SDK
 * to implement efficient in-memory caching with TTL and LRU eviction.
 */

import { Cache, memoize } from '../src/util/cache';

// Example 1: Basic Cache Usage
async function basicCacheExample() {
  console.log('\n=== Basic Cache Example ===');

  // Create a cache with default options (1 minute TTL, 100 max entries, LRU eviction)
  const cache = new Cache<string>();

  // Set some values
  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.set('key3', 'value3');

  // Get values
  console.log('key1:', cache.get('key1')); // Output: value1
  console.log('key2:', cache.get('key2')); // Output: value2
  console.log('key3:', cache.get('key3')); // Output: value3
  console.log('nonexistent:', cache.get('nonexistent')); // Output: undefined

  // Delete a value
  cache.delete('key2');
  console.log('After deleting key2:', cache.get('key2')); // Output: undefined

  // Get all keys
  console.log('All keys:', cache.keys()); // Output: ['key1', 'key3']

  // Get all values
  console.log('All values:', cache.values()); // Output: ['value1', 'value3']

  // Get cache size
  console.log('Cache size:', cache.size()); // Output: 2

  // Clear the cache
  cache.clear();
  console.log('Cache size after clear:', cache.size()); // Output: 0
}

// Example 2: Custom Cache Options
async function customCacheExample() {
  console.log('\n=== Custom Cache Options Example ===');

  // Create a cache with custom options (10 seconds TTL, 5 max entries)
  const cache = new Cache<number>({
    ttl: 10000, // 10 seconds
    maxEntries: 5,
    useLRU: true,
  });

  // Set some values
  for (let i = 1; i <= 5; i++) {
    cache.set(`key${i}`, i * 10);
  }

  console.log('Cache size:', cache.size()); // Output: 5
  console.log('All keys:', cache.keys()); // Output: ['key1', 'key2', 'key3', 'key4', 'key5']

  // Add one more value - should evict the least recently used entry (key1)
  cache.set('key6', 60);

  console.log('Cache size after adding key6:', cache.size()); // Output: 5
  console.log('All keys after adding key6:', cache.keys()); // Should not contain 'key1'
  console.log('key1 value (should be undefined):', cache.get('key1')); // Output: undefined

  // Demonstrate TTL expiration
  console.log('Waiting for TTL expiration (11 seconds)...');
  await new Promise((resolve) => setTimeout(resolve, 11000));

  console.log('key6 after TTL expiration:', cache.get('key6')); // Output: undefined
  console.log('Cache size after TTL expiration:', cache.size()); // Output: 0
}

// Example 3: Function Memoization
async function memoizationExample() {
  console.log('\n=== Function Memoization Example ===');

  // Create a mock expensive function
  let callCount = 0;
  const fetchUserData = async (userId: string) => {
    callCount++;
    console.log(`Fetching data for user ${userId}... (call #${callCount})`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
    };
  };

  // Memoize the function with a 5-second TTL
  const memoizedFetchUserData = memoize(fetchUserData, undefined, { ttl: 5000 });

  // First call - should execute the function
  console.log('First call for user 123:');
  const result1 = await memoizedFetchUserData('123');
  console.log('Result:', result1);

  // Second call with same arguments - should return cached result
  console.log('\nSecond call for user 123 (should be cached):');
  const result2 = await memoizedFetchUserData('123');
  console.log('Result:', result2);

  // Call with different arguments - should execute the function again
  console.log('\nCall for user 456 (should execute function):');
  const result3 = await memoizedFetchUserData('456');
  console.log('Result:', result3);

  // Wait for cache to expire
  console.log('\nWaiting for cache to expire (6 seconds)...');
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Call again after expiration - should execute the function again
  console.log('\nCall for user 123 after cache expiration:');
  const result4 = await memoizedFetchUserData('123');
  console.log('Result:', result4);
}

// Run the examples
async function runExamples() {
  try {
    await basicCacheExample();
    await customCacheExample();
    await memoizationExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
// Note: In a pure TypeScript/ESM environment, this check is handled differently
// For Node.js execution:
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
}
