/**
 * @file Tests for retry policy utilities
 */
import { RetryOptions, RetryPolicy } from '../../src/util/network/retry-policy';
import { ErrorCategory, ErrorCode, MidazError } from '../../src/util/error';

describe('Retry Policy Utilities', () => {
  // Helper to mock the sleep function to avoid actual delays in tests
  const mockSleep = (instance: RetryPolicy) => {
    // @ts-expect-error - Accessing private method for testing
    jest.spyOn(instance, 'sleep').mockImplementation(() => Promise.resolve());
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('RetryPolicy constructor', () => {
    it('should use default options when none are provided', () => {
      const policy = new RetryPolicy();
      
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxRetries).toBe(3);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.initialDelay).toBe(100);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxDelay).toBe(1000);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
    });

    it('should override default options with provided options', () => {
      const customOptions: RetryOptions = {
        maxRetries: 5,
        initialDelay: 200,
        maxDelay: 2000,
        retryableStatusCodes: [429, 503]
      };
      
      const policy = new RetryPolicy(customOptions);
      
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxRetries).toBe(5);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.initialDelay).toBe(200);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxDelay).toBe(2000);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.retryableStatusCodes).toEqual([429, 503]);
    });
  });

  describe('execute method', () => {
    it('should execute function successfully on first attempt', async () => {
      const policy = new RetryPolicy();
      mockSleep(policy);
      
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await policy.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on subsequent attempt', async () => {
      const policy = new RetryPolicy();
      mockSleep(policy);
      
      // Mock a function that fails on first attempt but succeeds on second
      const fn = jest.fn()
        .mockRejectedValueOnce(new MidazError({
          category: ErrorCategory.INTERNAL,
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Temporary failure',
          statusCode: 503
        }))
        .mockResolvedValueOnce('success');
      
      const result = await policy.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry up to maxRetries times and then throw the last error', async () => {
      const maxRetries = 3;
      const policy = new RetryPolicy({ maxRetries });
      mockSleep(policy);
      
      const error = new MidazError({
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Persistent failure',
        statusCode: 503
      });
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(policy.execute(fn)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(maxRetries + 1); // Initial attempt + maxRetries
    });

    it('should not retry if error does not match retry criteria', async () => {
      const policy = new RetryPolicy();
      mockSleep(policy);
      
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Bad request',
        statusCode: 400
      });
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(policy.execute(fn)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(1); // Only the initial attempt
    });

    it('should handle non-Error objects thrown by the function', async () => {
      const policy = new RetryPolicy();
      mockSleep(policy);
      
      // Mock a function that throws a string instead of an Error
      const fn = jest.fn().mockImplementation(() => {
        throw 'string error';
      });
      
      // The RetryPolicy should convert the string to an Error
      try {
        await policy.execute(fn);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(String(error)).toContain('string error');
      }
      
      expect(fn).toHaveBeenCalledTimes(1); // Only the initial attempt, as string errors don't match retry criteria
    });

    it('should use custom retry condition if provided', async () => {
      const retryCondition = jest.fn().mockImplementation((error: Error) => {
        return error.message.includes('retry me');
      });
      
      const policy = new RetryPolicy({ retryCondition });
      mockSleep(policy);
      
      const error = new Error('retry me please');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(policy.execute(fn)).rejects.toThrow(error);
      expect(fn).toHaveBeenCalledTimes(4); // Initial attempt + 3 retries
      expect(retryCondition).toHaveBeenCalledWith(error);
    });
  });

  describe('isRetryable method', () => {
    it('should retry on retryable status codes', () => {
      const policy = new RetryPolicy();
      
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      
      for (const statusCode of retryableStatusCodes) {
        const error = new MidazError({
          category: ErrorCategory.INTERNAL,
          code: ErrorCode.INTERNAL_ERROR,
          message: `HTTP ${statusCode}`,
          statusCode
        });
        // @ts-expect-error - Accessing private method for testing
        expect(policy.isRetryable(error)).toBe(true);
      }
      
      const nonRetryableError = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'HTTP 400',
        statusCode: 400
      });
      
      // @ts-expect-error - Accessing private method for testing
      expect(policy.isRetryable(nonRetryableError)).toBe(false);
    });

    it('should not retry on non-MidazError errors by default', () => {
      const policy = new RetryPolicy();
      
      const error = new Error('Generic error');
      // @ts-expect-error - Accessing private method for testing
      expect(policy.isRetryable(error)).toBe(false);
    });

    it('should use custom retry condition when provided', () => {
      const customRetryCondition = (error: Error) => {
        return error.message.includes('retry');
      };
      
      const policy = new RetryPolicy({
        retryCondition: customRetryCondition
      });
      
      const retryableError = new Error('This should retry');
      const nonRetryableError = new Error('This should not');
      
      // @ts-expect-error - Accessing private method for testing
      expect(policy.isRetryable(retryableError)).toBe(true);
      // @ts-expect-error - Accessing private method for testing
      expect(policy.isRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe('calculateDelay method', () => {
    it('should increase delay exponentially with each attempt', () => {
      const policy = new RetryPolicy({
        initialDelay: 100,
        maxDelay: 10000
      });
      
      // Remove jitter for deterministic testing
      jest.spyOn(Math, 'random').mockReturnValue(0);
      
      // @ts-expect-error - Accessing private method for testing
      const delay0 = policy.calculateDelay(0);
      // @ts-expect-error - Accessing private method for testing
      const delay1 = policy.calculateDelay(1);
      // @ts-expect-error - Accessing private method for testing
      const delay2 = policy.calculateDelay(2);
      
      expect(delay0).toBe(100); // initialDelay * 2^0 = 100
      expect(delay1).toBe(200); // initialDelay * 2^1 = 200
      expect(delay2).toBe(400); // initialDelay * 2^2 = 400
    });

    it('should cap delay at maxDelay', () => {
      const policy = new RetryPolicy({
        initialDelay: 500,
        maxDelay: 1000
      });
      
      // Remove jitter for deterministic testing
      jest.spyOn(Math, 'random').mockReturnValue(0);
      
      // @ts-expect-error - Accessing private method for testing
      const delay0 = policy.calculateDelay(0);
      // @ts-expect-error - Accessing private method for testing
      const delay1 = policy.calculateDelay(1);
      // @ts-expect-error - Accessing private method for testing
      const delay2 = policy.calculateDelay(2);
      
      expect(delay0).toBe(500); // initialDelay * 2^0 = 500
      expect(delay1).toBe(1000); // initialDelay * 2^1 = 1000, but capped at maxDelay
      expect(delay2).toBe(1000); // initialDelay * 2^2 = 2000, but capped at maxDelay
    });

    it('should add jitter to the delay', () => {
      const policy = new RetryPolicy({
        initialDelay: 100
      });
      
      // Mock random to return a specific value
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      
      // @ts-expect-error - Accessing private method for testing
      const delay = policy.calculateDelay(0);
      
      // initialDelay + jitter = 100 + (0.5 * 100) = 150
      expect(delay).toBe(150);
    });
  });

  describe('sleep method', () => {
    it('should resolve after the specified time', async () => {
      // Use jest.spyOn instead of direct replacement
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, _ms?: number) => {
        callback();
        return {} as NodeJS.Timeout;
      });
      
      const policy = new RetryPolicy();
      const sleepPromise = policy['sleep'](100);
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      await expect(sleepPromise).resolves.toBeUndefined();
      
      // Restore original setTimeout
      setTimeoutSpy.mockRestore();
    });
  });
});
