/**
 * @file Tests for error recovery scenarios in the Midaz SDK
 * This file tests how the system handles various error conditions
 */
import {
  ErrorCategory,
  ErrorCode,
  executeTransaction,
  isRetryableError,
  MidazError,
  TransactionErrorCategory,
  withErrorRecovery,
} from '../../../src/util/error';
import { standardErrors } from '../../../src/util/error/error-types';

describe('Error Recovery Scenarios', () => {
  // Mock setTimeout to avoid actual delays in tests
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return {} as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Transient Network Failures', () => {
    it('should recover from temporary network disconnections', async () => {
      // Create a function that fails with network errors a few times then succeeds
      let attempts = 0;
      const networkErrorOperation = jest.fn().mockImplementation(() => {
        if (attempts === 0) {
          attempts++;
          throw new Error('network error: connection reset');
        } else if (attempts === 1) {
          attempts++;
          throw new Error('network error: connection refused');
        } else {
          return Promise.resolve('success');
        }
      });

      const onRetry = jest.fn();
      const result = await withErrorRecovery(networkErrorOperation, { onRetry });

      expect(result).toBe('success');
      expect(networkErrorOperation).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should eventually fail after maximum retries', async () => {
      // Create a function that always fails with network errors
      const networkErrorOperation = jest.fn().mockImplementation(() => {
        throw new Error('persistent network error');
      });

      const onRetry = jest.fn();
      const onExhausted = jest.fn();

      await expect(
        withErrorRecovery(networkErrorOperation, {
          maxRetries: 3,
          onRetry,
          onExhausted,
        })
      ).rejects.toThrow('persistent network error');

      expect(networkErrorOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onExhausted).toHaveBeenCalledTimes(1);
    });

    it('should use custom backoff strategy if provided', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        if (attempts < 2) {
          attempts++;
          throw new Error('network error');
        } else {
          return Promise.resolve('success');
        }
      });

      const customBackoff = jest.fn().mockReturnValue(100);

      const result = await withErrorRecovery(operation, {
        backoffStrategy: customBackoff,
      });

      expect(result).toBe('success');
      expect(customBackoff).toHaveBeenCalledTimes(2);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use custom retry condition if provided', async () => {
      // Create errors that would normally be retried
      const networkErrorOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce('success');

      // Custom condition that always returns false (never retry)
      const customCondition = jest.fn().mockReturnValue(false);

      // Should fail immediately without retrying
      await expect(
        withErrorRecovery(networkErrorOperation, {
          retryCondition: customCondition,
        })
      ).rejects.toThrow('network error');

      expect(networkErrorOperation).toHaveBeenCalledTimes(1); // No retries
      expect(customCondition).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transaction Recovery', () => {
    it('should handle successful transactions', async () => {
      // Mock a successful transaction
      const transaction = jest.fn().mockResolvedValue({
        id: 'tx123',
        status: 'completed',
      });

      const result = await executeTransaction(transaction);

      // Updated expectation for new API
      expect(result.status).toBe('success');
      expect(result.result).toEqual({
        id: 'tx123',
        status: 'completed',
      });
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('should detect and handle duplicate transactions', async () => {
      // Create a duplicate error using the standard error template
      const error = new MidazError({
        ...standardErrors.conflict.idempotencyKey,
        message: 'Duplicate transaction',
      });

      // Mock a transaction that throws a duplicate error
      const transaction = jest.fn().mockRejectedValue(error);

      const result = await executeTransaction(transaction);

      // Updated expectation for new API
      expect(result.status).toBe('duplicate');
      expect(result.error).toBeDefined();
      expect(result.error?.transactionErrorType).toBe('duplicate_transaction');
    });

    it('should retry network errors during transactions', async () => {
      // Mock a transaction that fails with network errors then succeeds
      let attempts = 0;
      const transaction = jest.fn().mockImplementation(() => {
        if (attempts < 2) {
          attempts++;
          throw new Error('Network error');
        } else {
          return Promise.resolve({
            id: 'tx789',
            status: 'completed',
          });
        }
      });

      const result = await executeTransaction(transaction);

      // Updated expectation for new API
      expect(result.status).toBe('success');
      expect(result.result).toEqual({
        id: 'tx789',
        status: 'completed',
      });
      expect(result.attempts).toBe(3);
      expect(transaction).toHaveBeenCalledTimes(3);
    });

    it('should not retry business logic errors during transactions', async () => {
      // Create a business logic error using the standard error template
      const error = new MidazError({
        message: 'Insufficient funds',
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        statusCode: 400,
      });

      const transaction = jest.fn().mockRejectedValue(error);

      // Updated expectation for new API - no longer throws, returns result with status
      const result = await executeTransaction(transaction);
      expect(result.status).toBe('failed');
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.transactionErrorType).toBe(TransactionErrorCategory.INSUFFICIENT_FUNDS);
      expect(transaction).toHaveBeenCalledTimes(1); // No retries
    });

    it('should give up after maximum retries for persistent network errors', async () => {
      // Mock a transaction that always fails with network errors
      const transaction = jest.fn().mockImplementation(() => {
        throw new Error('Persistent network error');
      });

      // Updated expectation for new API - no longer throws, returns result with status
      const result = await executeTransaction(transaction, { maxRetries: 2 });

      expect(result.status).toBe('retried');
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(transaction).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle account frozen errors', async () => {
      // Create an account frozen error
      const error = new MidazError({
        message: 'Account is frozen',
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.ACCOUNT_ELIGIBILITY_ERROR,
        statusCode: 422,
      });

      const transaction = jest.fn().mockRejectedValue(error);

      const result = await executeTransaction(transaction);

      expect(result.status).toBe('failed');
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.userMessage).toBeDefined();
      expect(result.attempts).toBe(1); // No retries
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle asset mismatch errors', async () => {
      // Create an asset mismatch error
      const error = new MidazError({
        message: 'Asset mismatch between accounts',
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.ASSET_MISMATCH,
        statusCode: 422,
      });

      const transaction = jest.fn().mockRejectedValue(error);

      const result = await executeTransaction(transaction);

      expect(result.status).toBe('failed');
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.transactionErrorType).toBe(TransactionErrorCategory.ASSET_MISMATCH);
      expect(result.attempts).toBe(1); // No retries
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout errors but retry them', async () => {
      // Create a timeout error
      let attempts = 0;
      const transaction = jest.fn().mockImplementation(() => {
        if (attempts < 2) {
          attempts++;
          throw new MidazError({
            message: 'Request timed out',
            category: ErrorCategory.TIMEOUT,
            code: ErrorCode.TIMEOUT,
            statusCode: 504,
          });
        } else {
          return Promise.resolve({
            id: 'tx456',
            status: 'completed',
          });
        }
      });

      const result = await executeTransaction(transaction);

      expect(result.status).toBe('success');
      expect(result.result).toEqual({
        id: 'tx456',
        status: 'completed',
      });
      expect(result.attempts).toBe(3);
      expect(transaction).toHaveBeenCalledTimes(3);
    });

    it('should retry rate limit errors', async () => {
      // Create a rate limit error
      let attempts = 0;
      const transaction = jest.fn().mockImplementation(() => {
        if (attempts < 2) {
          attempts++;
          throw new MidazError({
            message: 'Rate limit exceeded',
            category: ErrorCategory.LIMIT_EXCEEDED,
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            statusCode: 429,
          });
        } else {
          return Promise.resolve({
            id: 'tx555',
            status: 'completed',
          });
        }
      });

      const result = await executeTransaction(transaction);

      expect(result.status).toBe('success');
      expect(result.result).toEqual({
        id: 'tx555',
        status: 'completed',
      });
      expect(result.attempts).toBe(3);
      expect(transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors as retryable', () => {
      expect(isRetryableError(new Error('network error'))).toBe(true);
      expect(isRetryableError(new Error('connection refused'))).toBe(true);
      expect(isRetryableError(new Error('socket hang up'))).toBe(true);
      expect(isRetryableError('econnreset')).toBe(true);
    });

    it('should classify MidazErrors by category', () => {
      expect(
        isRetryableError(
          new MidazError({
            message: 'Network error',
            category: ErrorCategory.NETWORK,
            code: ErrorCode.INTERNAL_ERROR,
          })
        )
      ).toBe(true);

      expect(
        isRetryableError(
          new MidazError({
            message: 'Timeout',
            category: ErrorCategory.TIMEOUT,
            code: ErrorCode.TIMEOUT,
          })
        )
      ).toBe(true);

      expect(
        isRetryableError(
          new MidazError({
            message: 'Rate limit',
            category: ErrorCategory.LIMIT_EXCEEDED,
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
          })
        )
      ).toBe(true);

      // Business logic errors should not be retryable
      expect(
        isRetryableError(
          new MidazError({
            message: 'Validation error',
            category: ErrorCategory.VALIDATION,
            code: ErrorCode.VALIDATION_ERROR,
          })
        )
      ).toBe(false);
    });

    it('should not classify null or undefined as retryable', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });
});
