/**
 * @file Tests for rate limiter utilities
 */
import { RateLimiter, RateLimiterOptions } from '../../src/util/concurrency/rate-limiter';

// Helper function to create a rate-limited function (moved from the original file)
function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RateLimiterOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const rateLimiter = new RateLimiter(options);

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return rateLimiter.execute(() => fn(...args));
  };
}

describe('Rate Limiter Utilities', () => {
  // Mock Date.now to control time in tests
  const mockDateNow = jest.spyOn(Date, 'now');

  // Store setTimeout callbacks and delays for controlled execution
  let timeoutCallbacks: Array<{ callback: (...args: unknown[]) => void; delay: number }> = [];
  let originalSetTimeout: typeof global.setTimeout;

  beforeEach(() => {
    // Reset mocks and state before each test
    jest.clearAllMocks();
    timeoutCallbacks = [];

    // Mock Date.now to return a fixed timestamp initially
    mockDateNow.mockReturnValue(1000);

    // Store the original setTimeout
    originalSetTimeout = global.setTimeout;

    // Mock setTimeout to store callbacks instead of executing them
    global.setTimeout = jest.fn((callback: any, delay: number) => {
      timeoutCallbacks.push({ callback, delay });
      return {} as NodeJS.Timeout;
    }) as unknown as typeof global.setTimeout;

    // Reset environment variables that might affect tests
    delete process.env.MIDAZ_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.MIDAZ_RATE_LIMIT_TIME_WINDOW_MS;
    delete process.env.MIDAZ_RATE_LIMIT_QUEUE_EXCEEDED;
    delete process.env.MIDAZ_RATE_LIMIT_MAX_QUEUE_SIZE;
  });

  afterEach(() => {
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  // Helper function to execute the next queued setTimeout callback
  const runNextTimeout = () => {
    if (timeoutCallbacks.length === 0) return;
    // The array is guaranteed to be non-empty due to the length check above
    const { callback } = timeoutCallbacks.shift() || {
      callback: () => {
        /* empty callback for testing */
      },
    };
    callback();
  };

  describe('RateLimiter constructor', () => {
    it('should use provided options', () => {
      const options: RateLimiterOptions = {
        maxRequests: 10,
        timeWindowMs: 5000,
        queueExceeded: false,
        maxQueueSize: 100,
      };

      const rateLimiter = new RateLimiter(options);

      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxRequests).toBe(10);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.timeWindowMs).toBe(5000);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.queueExceeded).toBe(false);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxQueueSize).toBe(100);
    });

    it('should use default values for optional parameters', () => {
      const options: RateLimiterOptions = {
        maxRequests: 10,
        timeWindowMs: 5000,
      };

      const rateLimiter = new RateLimiter(options);

      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxRequests).toBe(10);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.timeWindowMs).toBe(5000);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.queueExceeded).toBe(true);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxQueueSize).toBe(1000);
    });

    it('should use environment variables when available', () => {
      // Set environment variables
      process.env.MIDAZ_RATE_LIMIT_MAX_REQUESTS = '20';
      process.env.MIDAZ_RATE_LIMIT_TIME_WINDOW_MS = '10000';
      process.env.MIDAZ_RATE_LIMIT_QUEUE_EXCEEDED = 'false';
      process.env.MIDAZ_RATE_LIMIT_MAX_QUEUE_SIZE = '50';

      const options: RateLimiterOptions = {
        maxRequests: 10,
        timeWindowMs: 5000,
      };

      const rateLimiter = new RateLimiter(options);

      // Explicit options should take precedence over environment variables
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxRequests).toBe(10);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.timeWindowMs).toBe(5000);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.queueExceeded).toBe(false);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxQueueSize).toBe(50);
    });

    it('should use environment variables when options are not provided', () => {
      // Set environment variables for this test
      process.env.MIDAZ_RATE_LIMIT_MAX_REQUESTS = '20';
      process.env.MIDAZ_RATE_LIMIT_TIME_WINDOW_MS = '10000';
      process.env.MIDAZ_RATE_LIMIT_QUEUE_EXCEEDED = 'false';
      process.env.MIDAZ_RATE_LIMIT_MAX_QUEUE_SIZE = '50';

      const options: RateLimiterOptions = {
        maxRequests: 5,
        timeWindowMs: 1000,
      };

      const rateLimiter = new RateLimiter(options);

      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxRequests).toBe(5); // Should use provided options over env vars
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.timeWindowMs).toBe(1000); // Should use provided options over env vars
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.queueExceeded).toBe(false); // Using env var since not provided in options
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxQueueSize).toBe(50); // Using env var since not provided in options
    });

    it('should use default values when neither options nor environment variables are provided', () => {
      const options: RateLimiterOptions = {
        maxRequests: 0, // This will be falsy, so default should be used
        timeWindowMs: 0, // This will be falsy, so default should be used
      };

      const rateLimiter = new RateLimiter(options);

      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxRequests).toBe(100);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.timeWindowMs).toBe(60000);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.queueExceeded).toBe(true);
      // @ts-expect-error - Accessing private properties for testing
      expect(rateLimiter.maxQueueSize).toBe(1000);
    });
  });

  describe('execute method', () => {
    it('should execute function immediately when under rate limit', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        timeWindowMs: 1000,
      });

      const fn = jest.fn().mockResolvedValue('result');

      const result = await rateLimiter.execute(fn);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should allow multiple requests within the rate limit', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 3,
        timeWindowMs: 1000,
      });

      const fn = jest.fn().mockResolvedValue('result');

      await rateLimiter.execute(fn);
      await rateLimiter.execute(fn);
      await rateLimiter.execute(fn);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error when rate limit exceeded and queueExceeded is false', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        timeWindowMs: 1000,
        queueExceeded: false,
      });

      const fn = jest.fn().mockResolvedValue('result');

      // Use up the rate limit
      await rateLimiter.execute(fn);
      await rateLimiter.execute(fn);

      // This should throw an error
      await expect(rateLimiter.execute(fn)).rejects.toThrow('Rate limit exceeded');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should queue requests when rate limit exceeded and queueExceeded is true', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        timeWindowMs: 1000,
        queueExceeded: true,
      });

      const fn = jest.fn().mockResolvedValue('result');

      // Use up the rate limit
      await rateLimiter.execute(fn);
      await rateLimiter.execute(fn);

      // This should be queued
      const promise = rateLimiter.execute(fn);

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // Execute the queued callback
      runNextTimeout();

      // Wait for the queued request to execute
      await promise;

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error when queue is full', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        timeWindowMs: 1000,
        queueExceeded: true,
        maxQueueSize: 1,
      });

      const fn = jest.fn().mockResolvedValue('result');

      // Use up the rate limit
      await rateLimiter.execute(fn);

      // Queue one request (fills the queue)
      const queuedPromise = rateLimiter.execute(fn);

      // This should throw an error because the queue is full
      await expect(rateLimiter.execute(fn)).rejects.toThrow('Rate limit queue full');

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // Execute the queued callback
      runNextTimeout();

      // Wait for the queued request to execute
      await queuedPromise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should clean up old timestamps', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 2,
        timeWindowMs: 1000,
      });

      const fn = jest.fn().mockResolvedValue('result');

      // Use up the rate limit
      await rateLimiter.execute(fn);
      await rateLimiter.execute(fn);

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // This should execute immediately because the oldest timestamp is now expired
      await rateLimiter.execute(fn);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should release slot after execution', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        timeWindowMs: 1000,
        queueExceeded: true,
      });

      const fn = jest.fn().mockResolvedValue('result');

      // Use up the rate limit
      await rateLimiter.execute(fn);

      // Queue a request
      const queuedPromise = rateLimiter.execute(fn);

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // Execute the queued callback
      runNextTimeout();

      // Wait for the queued request to execute
      await queuedPromise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should release slot even if function throws', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        timeWindowMs: 1000,
      });

      const error = new Error('Function error');
      const fnThatThrows = jest.fn().mockRejectedValue(error);
      const fnSuccess = jest.fn().mockResolvedValue('result');

      // Execute a function that throws
      await expect(rateLimiter.execute(fnThatThrows)).rejects.toThrow(error);

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // This should execute successfully because the slot was released
      await rateLimiter.execute(fnSuccess);

      expect(fnThatThrows).toHaveBeenCalledTimes(1);
      expect(fnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('processQueue method', () => {
    it('should process queued requests when a slot becomes available', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        timeWindowMs: 1000,
        queueExceeded: true,
      });

      const fn1 = jest.fn().mockResolvedValue('result1');
      const fn2 = jest.fn().mockResolvedValue('result2');

      // Use up the rate limit
      await rateLimiter.execute(fn1);

      // Queue a request
      const promise2 = rateLimiter.execute(fn2);

      // At this point, the request should be queued
      expect(fn2).not.toHaveBeenCalled();

      // Advance time to expire the oldest request
      mockDateNow.mockReturnValue(2001);

      // Execute the queued callback
      runNextTimeout();

      // Wait for the queued request to execute
      await promise2;

      // Now the second function should have been called
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('should stop processing when queue is empty', async () => {
      const rateLimiter = new RateLimiter({
        maxRequests: 1,
        timeWindowMs: 1000,
        queueExceeded: true,
      });

      // Mock the processQueue method to check if it stops when queue is empty
      // @ts-expect-error - Accessing private method for testing
      const processQueueSpy = jest.spyOn(rateLimiter, 'processQueue');

      // Execute a function that will be processed immediately
      const fn = jest.fn().mockResolvedValue('result');
      const result = await rateLimiter.execute(fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);

      // processQueue should be called once and then stop
      expect(processQueueSpy).toHaveBeenCalledTimes(0);

      // @ts-expect-error - Accessing private property for testing
      expect(rateLimiter.requestQueue.length).toBe(0);
      // @ts-expect-error - Accessing private property for testing
      expect(rateLimiter.isProcessingQueue).toBe(false);
    });
  });

  describe('createRateLimitedFunction', () => {
    it('should create a rate-limited version of a function', async () => {
      const fn = jest.fn().mockImplementation(async (x: number) => x * 2);

      const rateLimitedFn = createRateLimitedFunction(fn, {
        maxRequests: 2,
        timeWindowMs: 1000,
      });

      // Execute the rate-limited function
      const result1 = await rateLimitedFn(1);
      const result2 = await rateLimitedFn(2);

      expect(result1).toBe(2);
      expect(result2).toBe(4);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 1);
      expect(fn).toHaveBeenNthCalledWith(2, 2);
    });

    it('should respect rate limits for the created function', async () => {
      const fn = jest.fn().mockImplementation(async (x: number) => x * 2);

      const rateLimitedFn = createRateLimitedFunction(fn, {
        maxRequests: 2,
        timeWindowMs: 1000,
        queueExceeded: false,
      });

      // Execute the rate-limited function twice (using up the rate limit)
      await rateLimitedFn(1);
      await rateLimitedFn(2);

      // The third call should throw an error
      await expect(rateLimitedFn(3)).rejects.toThrow('Rate limit exceeded');

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass through errors from the original function', async () => {
      const error = new Error('Original function error');
      const fn = jest.fn().mockRejectedValue(error);

      const rateLimitedFn = createRateLimitedFunction(fn, {
        maxRequests: 2,
        timeWindowMs: 1000,
      });

      // Execute the rate-limited function
      await expect(rateLimitedFn(1)).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
