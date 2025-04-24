/**
 * @file Error recovery utilities
 * @description Functions for retrying operations and handling recoverable errors
 */

import {
  isDuplicateTransactionError,
  isInsufficientFundsError,
  isRetryableError,
} from './error-classification';
import { isAccountEligibilityError, isInsufficientBalanceError } from './error-guards';
import { EnhancedErrorInfo } from './error-processor';

/**
 * Error recovery strategy options
 */
export interface ErrorRecoveryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds before retrying */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number;
  /** Multiplier to apply to delay after each retry */
  backoffFactor?: number;
  /** Optional custom backoff strategy function */
  backoffStrategy?: (
    attempt: number,
    initialDelay: number,
    options: ErrorRecoveryOptions
  ) => number;
  /** Custom function to determine if an error is retryable */
  retryCondition?: (error: unknown) => boolean;
  /** Optional callback to run before each retry attempt */
  onRetry?: (error: unknown, attempt: number) => void | Promise<void>;
  /** Optional callback when retry attempts are exhausted */
  onExhausted?: (error: unknown, attempts: number) => void | Promise<void>;
}

/**
 * Default recovery options
 */
const DEFAULT_RECOVERY_OPTIONS: ErrorRecoveryOptions = {
  maxRetries: 3,
  initialDelay: 500, // 500ms
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: isRetryableError,
};

/**
 * Executes a function with automatic error recovery
 *
 * This function implements a retry mechanism with exponential backoff
 * for operations that may fail due to transient issues.
 *
 * @param operation - Function to execute and potentially retry
 * @param options - Error recovery options
 * @returns The result of the operation
 *
 * @example
 * ```typescript
 * // Create a transaction with automatic retries for network issues
 * const transaction = await withErrorRecovery(
 *   () => client.entities.transactions.createTransaction(orgId, ledgerId, txInput),
 *   {
 *     maxRetries: 3,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retrying after error (attempt ${attempt}): ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<T> {
  // Merge default options with provided options
  const mergedOptions: ErrorRecoveryOptions = {
    ...DEFAULT_RECOVERY_OPTIONS,
    ...options,
  };

  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = isRetryableError,
    onRetry,
    onExhausted,
  } = mergedOptions;

  // Custom backoff strategy or default exponential backoff
  const getDelay =
    mergedOptions.backoffStrategy ||
    ((attempt: number, initialDelay: number, options: ErrorRecoveryOptions) => {
      const delay = initialDelay * Math.pow(options.backoffFactor || 2, attempt - 1);
      return Math.min(delay, options.maxDelay || 10000);
    });

  let lastError: unknown;

  // Try the operation up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error;

      // If this is the last attempt or the error is not retryable, throw
      if (attempt === maxRetries || !retryCondition(error)) {
        if (attempt === maxRetries && onExhausted) {
          await onExhausted(error, attempt);
        }
        throw error;
      }

      // Calculate delay for this attempt
      const delay = getDelay(attempt + 1, initialDelay, mergedOptions);

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(error, attempt + 1);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the catch block
  // but TypeScript needs it for type safety
  throw lastError;
}

/**
 * Safely executes a transaction with automatic handling for common errors
 *
 * This specialization of error recovery is tailored for financial transactions,
 * with domain-specific error handling and automatic retry for appropriate error types.
 *
 * @param transactionFn - Transaction function to execute
 * @param options - Error recovery options
 * @returns Transaction result and status information
 *
 * @example
 * ```typescript
 * // Create a transfer transaction with automatic handling for common errors
 * const { result, status, error } = await executeTransaction(
 *   () => client.entities.transactions.createTransaction(
 *     organizationId,
 *     ledgerId,
 *     createTransferTransaction(
 *       sourceAccount,
 *       destinationAccount,
 *       amount,
 *       assetCode
 *     )
 *   )
 * );
 *
 * if (status === 'success' || status === 'duplicate') {
 *   console.log(`Transaction completed: ${result.id}`);
 * } else {
 *   console.error(`Transaction failed: ${error.userMessage}`);
 * }
 * ```
 */
export async function executeTransaction<T>(
  transactionFn: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<{
  result: T | null;
  status: 'success' | 'duplicate' | 'failed' | 'retried';
  error?: EnhancedErrorInfo;
  attempts?: number;
}> {
  // Use require to avoid circular dependencies
  const { getEnhancedErrorInfo } = require('./error-processor');

  let attempts = 0;

  try {
    // First, try to execute the transaction with automatic retries for network errors
    const result = await withErrorRecovery(
      async () => {
        attempts++;
        return await transactionFn();
      },
      {
        // Use custom retry condition that only retries network errors, not business logic errors
        retryCondition: (error) => {
          // Don't retry business logic errors like insufficient funds
          if (
            isInsufficientFundsError(error) ||
            isInsufficientBalanceError(error) ||
            isAccountEligibilityError(error)
          ) {
            return false;
          }

          // Use standard retry condition for other errors
          return isRetryableError(error);
        },
        ...options,
      }
    );

    // Transaction succeeded
    return {
      result,
      status: 'success',
      attempts,
    };
  } catch (error) {
    // Process the error to get enhanced information
    const enhancedError = getEnhancedErrorInfo(error);

    // Check if this is a duplicate transaction
    if (isDuplicateTransactionError(error)) {
      return {
        result: null,
        status: 'duplicate',
        error: enhancedError,
        attempts,
      };
    }

    // Check if we retried but still failed
    if (attempts > 1) {
      return {
        result: null,
        status: 'retried',
        error: enhancedError,
        attempts,
      };
    }

    // Regular failure without retries
    return {
      result: null,
      status: 'failed',
      error: enhancedError,
      attempts,
    };
  }
}
