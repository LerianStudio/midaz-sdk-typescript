import { getEnv } from '../runtime/environment';

/**
 * Cache entry with expiration
 * @internal
 */
interface CacheEntry<T> {
  /**
   * Cached value
   */
  value: T;

  /**
   * Expiration timestamp in milliseconds since epoch
   */
  expiresAt: number;
}

/**
 * Cache options for configuring cache behavior
 */
export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   * @default 60000 (1 minute)
   */
  ttl?: number;

  /**
   * Maximum number of entries to keep in cache
   * @default 100
   */
  maxEntries?: number;

  /**
   * Whether to use a least-recently-used eviction policy
   * @default true
   */
  useLRU?: boolean;
}

/**
 * In-memory cache with expiration and optional LRU eviction
 *
 * @template T - Type of values stored in the cache
 *
 * @example
 * ```typescript
 * // Create a cache with default options
 * const cache = new Cache();
 *
 * // Set a value with the default TTL
 * cache.set('key1', 'value1');
 *
 * // Set a value with a custom TTL
 * cache.set('key2', 'value2', 30000); // 30 seconds
 *
 * // Get a value
 * const value = cache.get('key1');
 *
 * // Delete a value
 * cache.delete('key1');
 *
 * // Clear the entire cache
 * cache.clear();
 * ```
 */
export class Cache<T = any> {
  /**
   * Cache storage
   * @private
   */
  private cache: Map<string, CacheEntry<T>> = new Map();

  /**
   * LRU tracking
   * @private
   */
  private lruList: string[] = [];

  /**
   * Default TTL in milliseconds
   * @private
   */
  private ttl: number;

  /**
   * Maximum number of entries
   * @private
   */
  private maxEntries: number;

  /**
   * Whether to use LRU eviction
   * @private
   */
  private useLRU: boolean;

  /**
   * Creates a new cache
   *
   */
  constructor(options: CacheOptions = {}) {
    // Set default TTL from environment variable or fallback to 60 seconds
    this.ttl =
      options.ttl ??
      (getEnv('MIDAZ_CACHE_TTL') ? parseInt(getEnv('MIDAZ_CACHE_TTL')!, 10) : 60000);

    // Set max entries from environment variable or fallback to 100
    this.maxEntries =
      options.maxEntries ??
      (getEnv('MIDAZ_CACHE_MAX_ENTRIES')
        ? parseInt(getEnv('MIDAZ_CACHE_MAX_ENTRIES')!, 10)
        : 100);

    // Set LRU usage from options or default to true
    this.useLRU = options.useLRU !== false;
  }

  /**
   * Gets a value from the cache
   *
   * @returns Cached value or undefined if not found or expired
   */
  public get<R = T>(key: string): R | undefined {
    // Get the cache entry
    const entry = this.cache.get(key);

    // Return undefined if entry doesn't exist
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (entry.expiresAt < Date.now()) {
      // Delete expired entry
      this.delete(key);
      return undefined;
    }

    // Update LRU if enabled
    if (this.useLRU) {
      this.updateLRU(key);
    }

    return entry.value as unknown as R;
  }

  /**
   * Sets a value in the cache
   *
   */
  public set(key: string, value: T, ttl?: number): void {
    // Calculate expiration time
    const expiresAt = Date.now() + (ttl ?? this.ttl);

    // Create cache entry
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
    };

    // Check if we need to evict an entry due to size limit
    if (!this.cache.has(key) && this.cache.size >= this.maxEntries) {
      this.evict();
    }

    // Store the entry
    this.cache.set(key, entry);

    // Update LRU if enabled
    if (this.useLRU) {
      this.updateLRU(key);
    }
  }

  /**
   * Deletes a value from the cache
   *
   * @returns Whether the key was found and deleted
   */
  public delete(key: string): boolean {
    // Remove from LRU list if enabled
    if (this.useLRU) {
      const index = this.lruList.indexOf(key);
      if (index !== -1) {
        this.lruList.splice(index, 1);
      }
    }

    // Delete from cache
    return this.cache.delete(key);
  }

  /**
   * Clears the entire cache
   */
  public clear(): void {
    this.cache.clear();
    this.lruList = [];
  }

  /**
   * Gets all keys in the cache
   *
   * @returns Array of cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Gets all values in the cache
   *
   * @returns Array of cache values
   */
  public values(): T[] {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Gets all entries in the cache
   *
   * @returns Array of [key, value] pairs
   */
  public entries(): [string, T][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Gets the number of entries in the cache
   *
   * @returns Cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Updates the LRU status of a key
   *
   * @private
   */
  private updateLRU(key: string): void {
    // Remove key from current position
    const index = this.lruList.indexOf(key);
    if (index !== -1) {
      this.lruList.splice(index, 1);
    }

    // Add key to the end of the list (most recently used)
    this.lruList.push(key);
  }

  /**
   * Evicts an entry from the cache
   *
   * @private
   */
  private evict(): void {
    // If LRU is enabled, evict the least recently used entry
    if (this.useLRU && this.lruList.length > 0) {
      // LRU list is guaranteed to have items due to the length check above
      const lruKey = this.lruList.shift() || '';
      this.cache.delete(lruKey);
    } else {
      // Otherwise, evict a random entry
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        const randomKey = keys[0];
        this.cache.delete(randomKey);
      }
    }
  }
}

/**
 * Memoizes a function with caching
 *
 * @template T - Function return type
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * // Memoize a function with default options
 * const getUser = memoize(
 *   async (userId: string) => {
 *     console.log(`Fetching user ${userId}...`);
 *     return { id: userId, name: `User ${userId}` };
 *   }
 * );
 *
 * // First call will execute the function
 * const user1 = await getUser('123');
 *
 * // Second call with same arguments will return cached result
 * const user2 = await getUser('123');
 *
 * // Call with different arguments will execute the function again
 * const user3 = await getUser('456');
 * ```
 */
export function memoize<T>(
  fn: (...args: any[]) => T,
  keyFn?: (...args: any[]) => string,
  options?: CacheOptions
): (...args: any[]) => T {
  // Create cache
  const cache = new Cache<T>(options);

  // Return memoized function
  return (...args: any[]): T => {
    // Generate cache key
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    // Check cache
    const cached = cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    const result = fn(...args);

    // Handle promises
    if (result instanceof Promise) {
      // Don't cache rejected promises
      result.catch(() => cache.delete(key));
    }

    // Cache result
    cache.set(key, result);

    return result;
  };
}
