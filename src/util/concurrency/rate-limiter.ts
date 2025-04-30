/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 */

/**
 * Configuration options for the rate limiter
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed per time window
   * This determines the rate limit, e.g., 100 requests per minute
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   * The period over which the maxRequests is measured
   * For example, 60000 for a one-minute window
   */
  timeWindowMs: number;

  /**
   * Whether to queue requests that exceed the rate limit
   * When true, excess requests will wait in a queue until they can be processed
   * When false, excess requests will be rejected immediately with an error
   * @default true
   */
  queueExceeded?: boolean;

  /**
   * Maximum size of the queue for excess requests
   * Once this limit is reached, additional requests will be rejected
   * @default Infinity
   */
  maxQueueSize?: number;
}

/**
 * Rate limiter for controlling the frequency of API requests
 *
 * This class implements a token bucket algorithm to enforce rate limits
 * while providing options for queuing excess requests.
 *
 * @example
 * ```typescript
 * // Create a rate limiter allowing 100 requests per minute
 * const rateLimiter = new RateLimiter({
 *   maxRequests: 100,
 *   timeWindowMs: 60000, // 1 minute
 *   queueExceeded: true,
 *   maxQueueSize: 1000
 * });
 *
 * // Execute a function with rate limiting
 * try {
 *   const result = await rateLimiter.execute(async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     return response.json();
 *   });
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.error('Rate limit exceeded:', error);
 * }
 * ```
 */
export class RateLimiter {
  /**
   * Maximum number of requests allowed per time window
   * @private
   */
  private maxRequests: number;

  /**
   * Time window in milliseconds
   * @private
   */
  private timeWindowMs: number;

  /**
   * Whether to queue requests that exceed the rate limit
   * @private
   */
  private queueExceeded: boolean;

  /**
   * Maximum size of the queue for excess requests
   * @private
   */
  private maxQueueSize: number;

  /**
   * Timestamps of recent requests
   * @private
   */
  private requestTimestamps: number[] = [];

  /**
   * Queue of pending requests
   * @private
   */
  private requestQueue: {
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }[] = [];

  /**
   * Whether the queue processor is running
   * @private
   */
  private isProcessingQueue = false;

  /**
   * Creates a new rate limiter
   *
   */
  constructor(options: RateLimiterOptions) {
    // Use environment variables if available
    this.maxRequests =
      options.maxRequests ||
      (process.env.MIDAZ_RATE_LIMIT_MAX_REQUESTS
        ? parseInt(process.env.MIDAZ_RATE_LIMIT_MAX_REQUESTS, 10)
        : 100);

    this.timeWindowMs =
      options.timeWindowMs ||
      (process.env.MIDAZ_RATE_LIMIT_TIME_WINDOW
        ? parseInt(process.env.MIDAZ_RATE_LIMIT_TIME_WINDOW, 10)
        : 60000);

    this.queueExceeded =
      options.queueExceeded !== undefined
        ? options.queueExceeded
        : process.env.MIDAZ_RATE_LIMIT_QUEUE_EXCEEDED
          ? process.env.MIDAZ_RATE_LIMIT_QUEUE_EXCEEDED.toLowerCase() === 'true'
          : true;

    this.maxQueueSize =
      options.maxQueueSize !== undefined
        ? options.maxQueueSize
        : process.env.MIDAZ_RATE_LIMIT_MAX_QUEUE_SIZE
          ? parseInt(process.env.MIDAZ_RATE_LIMIT_MAX_QUEUE_SIZE, 10)
          : Infinity;
  }

  /**
   * Executes a function with rate limiting
   *
   * @template T - Type of the function's return value
   * @returns Promise resolving to the function's return value
   * @throws Error if the rate limit is exceeded and queueExceeded is false
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Clean up old timestamps
    this.cleanupTimestamps();

    // Check if we're under the rate limit
    if (this.requestTimestamps.length < this.maxRequests) {
      // We're under the limit, execute immediately
      this.requestTimestamps.push(Date.now());
      return fn();
    }

    // We're over the limit, check if we should queue
    if (!this.queueExceeded) {
      throw new Error(
        `Rate limit exceeded: ${this.maxRequests} requests per ${this.timeWindowMs}ms`
      );
    }

    // Check if the queue is full
    if (this.requestQueue.length >= this.maxQueueSize) {
      throw new Error(`Rate limit queue full: ${this.maxQueueSize} requests queued`);
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        fn,
        resolve,
        reject,
      });

      // Start processing the queue if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Processes the queue of pending requests
   * @private
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    // Calculate time until next available slot
    const oldestTimestamp = this.requestTimestamps[0];
    const now = Date.now();
    const timeUntilNextSlot = Math.max(0, oldestTimestamp + this.timeWindowMs - now);

    // Wait until a slot is available
    await new Promise((resolve) => setTimeout(resolve, timeUntilNextSlot));

    // Clean up old timestamps
    this.cleanupTimestamps();

    // Process the next request if we're under the limit
    if (this.requestTimestamps.length < this.maxRequests && this.requestQueue.length > 0) {
      // Queue is guaranteed to have items due to the length check above
      const queueItem = this.requestQueue.shift();
      if (!queueItem) return; // Should never happen, but satisfies TypeScript
      
      const { fn, resolve, reject } = queueItem;

      try {
        // Add timestamp for this request
        this.requestTimestamps.push(Date.now());

        // Execute the function
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    // Continue processing the queue
    setImmediate(() => this.processQueue());
  }

  /**
   * Cleans up old timestamps that are outside the time window
   * @private
   */
  private cleanupTimestamps(): void {
    const now = Date.now();
    const cutoff = now - this.timeWindowMs;

    // Remove timestamps older than the time window
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] <= cutoff) {
      this.requestTimestamps.shift();
    }
  }
}
