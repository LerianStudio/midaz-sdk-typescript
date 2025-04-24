/**
 * @file Tests for cache utilities
 */
import { Cache, memoize } from '../../src/util/cache/cache';

// Mock the process.env object
const originalEnv = process.env;

// Extend the Cache prototype with a 'has' method for testing
// This is needed because the tests use this method but it's not in the new implementation
declare module '../../src/util/cache/cache' {
  interface Cache<T> {
    has(key: string): boolean;
  }
}

// Add the implementation for the 'has' method
Cache.prototype.has = function(key: string): boolean {
  return this.get(key) !== undefined;
};

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Cache Utilities', () => {
  // Test 1: Cache class
  describe('Cache', () => {
    it('should store and retrieve values', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should respect custom TTL', async () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1', 50); // 50ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    it('should respect default TTL from options', async () => {
      const cache = new Cache<string>({ ttl: 50 }); // 50ms default TTL
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should respect environment variable TTL', async () => {
      process.env.MIDAZ_CACHE_TTL = '50'; // 50ms TTL from env
      
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should delete entries', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      const deleted = cache.delete('key1');
      
      expect(deleted).toBe(true);
      expect(cache.size()).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should respect maxEntries and evict LRU entries', () => {
      const cache = new Cache<string>({ maxEntries: 2 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Access key1 to make it more recently used than key2
      cache.get('key1');
      
      // Add a third entry, should evict key2 (least recently used)
      cache.set('key3', 'value3');
      
      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
    });

    it('should enforce maxEntries even when useLRU is false', () => {
      // When useLRU is false, the cache still enforces maxEntries
      // but uses a FIFO-like policy instead of LRU
      const cache = new Cache<string>({ maxEntries: 2, useLRU: false });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Add a third entry, should evict one of the existing entries
      cache.set('key3', 'value3');
      
      // Check that we still have 2 entries (maxEntries is enforced)
      expect(cache.size()).toBe(2);
      
      // With FIFO-like policy, key1 should be evicted and key2 and key3 should remain
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });

    it('should return all keys', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return all values', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const values = cache.values();
      
      expect(values).toHaveLength(2);
      expect(values).toContain('value1');
      expect(values).toContain('value2');
    });

    it('should return all entries', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const entries = cache.entries();
      
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
    });
  });

  // Test 2: memoize function
  describe('memoize', () => {
    it('should cache function results', async () => {
      // Create a mock function with a spy
      const mockFn = jest.fn().mockImplementation(async (a: number, b: number) => {
        return a + b;
      });
      
      const memoizedFn = memoize(mockFn);
      
      // First call should execute the function
      const result1 = await memoizedFn(1, 2);
      expect(result1).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Second call with same args should use cache
      const result2 = await memoizedFn(1, 2);
      expect(result2).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
      
      // Call with different args should execute the function again
      const result3 = await memoizedFn(2, 3);
      expect(result3).toBe(5);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use custom key function', async () => {
      const mockFn = jest.fn().mockImplementation(async (obj: { id: string }) => {
        return obj.id;
      });
      
      // Use a custom key function that only considers the id property
      const keyFn = (obj: { id: string }) => obj.id;
      const memoizedFn = memoize(mockFn, keyFn);
      
      // First call should execute the function
      const result1 = await memoizedFn({ id: 'abc' });
      expect(result1).toBe('abc');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Second call with same id but different object should use cache
      const result2 = await memoizedFn({ id: 'abc' });
      expect(result2).toBe('abc');
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
      
      // Call with different id should execute the function again
      const result3 = await memoizedFn({ id: 'def' });
      expect(result3).toBe('def');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      const mockFn = jest.fn().mockImplementation(async (a: number, b: number) => {
        return a + b;
      });
      
      const memoizedFn = memoize(mockFn, undefined, { ttl: 50 }); // 50ms TTL
      
      // First call should execute the function
      const result1 = await memoizedFn(1, 2);
      expect(result1).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Call again with same args should execute the function again
      const result2 = await memoizedFn(1, 2);
      expect(result2).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});
