/**
 * @file Tests for retry policy utilities with environment variables
 */

// Store original environment
const originalEnv = { ...process.env };

// Set environment variables before importing the module
process.env.MIDAZ_RETRY_MAX_RETRIES = '4';
process.env.MIDAZ_RETRY_INITIAL_DELAY = '300';
process.env.MIDAZ_RETRY_MAX_DELAY = '3000';
process.env.MIDAZ_RETRY_STATUS_CODES = '429,503,504';

// Import after setting environment variables
import { RetryOptions, RetryPolicy } from '../../src/util/network/retry-policy';
import { ErrorCategory, ErrorCode, MidazError } from '../../src/util/error';

describe('Retry Policy Utilities with Environment Variables', () => {
  afterAll(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('RetryPolicy constructor with environment variables', () => {
    it('should use environment variables when available', () => {
      const policy = new RetryPolicy();

      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxRetries).toBe(4);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.initialDelay).toBe(300);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxDelay).toBe(3000);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.retryableStatusCodes).toEqual([429, 503, 504]);
    });

    it('should merge environment variables with provided options', () => {
      const customOptions: RetryOptions = {
        maxDelay: 2000,
        retryableStatusCodes: [429, 503],
      };

      const policy = new RetryPolicy(customOptions);

      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxRetries).toBe(4);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.initialDelay).toBe(300);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.maxDelay).toBe(2000);
      // @ts-expect-error - Accessing private properties for testing
      expect(policy.retryableStatusCodes).toEqual([429, 503]);
    });
  });
});
