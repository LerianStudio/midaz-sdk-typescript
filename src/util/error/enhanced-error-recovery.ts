/**
 */

import { executeOperation } from './error-handler';
import { ErrorRecoveryOptions, OperationResult, TransactionErrorCategory } from './error-types';
import { categorizeTransactionError, isRetryableError, processError } from './error-utils';

/**
 * Extended options for enhanced error recovery
 */
export interface EnhancedRecoveryOptions extends ErrorRecoveryOptions {
  /**
   * Number of fallback attempts after all retries are exhausted
   * @default 0
   */
  fallbackAttempts?: number;

  /**
   * Function that transforms the operation for a fallback attempt
   * Used to modify parameters based on previous error (e.g., reduce amount on insufficient funds)
   */
  transformOperation?: (error: unknown, attempt: number) => (() => Promise<any>) | null;

  /**
   * Whether to automatically handle duplicate operations as success
   * @default true
   */
  handleDuplicatesAsSuccess?: boolean;

  /**
   * Whether to automatically adjust transaction parameters
   * based on specific error types (e.g., reduce amount on insufficient funds)
   * @default false
   */
  enableSmartRecovery?: boolean;

  /**
   * Whether to use periodic polled verification for async operations
   * that may continue processing after timeout
   * @default false
   */
  usePolledVerification?: boolean;

  /**
   * Function to verify if an operation completed despite error
   * Used with usePolledVerification
   */
  verifyOperation?: () => Promise<boolean>;

  /**
   * Maximum number of verification attempts
   * @default 3
   */
  maxVerificationAttempts?: number;

  /**
   * Delay between verification attempts in milliseconds
   * @default 1000
   */
  verificationDelay?: number;
}

/**
 * Additional result fields for enhanced recovery
 */
export interface EnhancedOperationResult<T> extends OperationResult<T> {
  /**
   * Whether a fallback strategy was used
   */
  usedFallback?: boolean;

  /**
   * Number of fallback attempts made
   */
  fallbackAttempts?: number;

  /**
   * Whether verification confirmed success despite errors
   */
  verifiedSuccess?: boolean;

  /**
   * Detailed recovery strategy used
   */
  recoveryStrategy?: string;

  /**
   * Messages describing recovery steps taken
   */
  recoverySteps?: string[];
}

/**
 * Executes an operation with enhanced error recovery
 *
 * This function extends the standard error recovery with intelligent
 * strategies like operation transformation, fallbacks, and verification.
 *
 * @returns Promise resolving to an enhanced operation result
 *
 * @example
 * ```typescript
 * // Execute a financial operation with fallback strategy
 * const result = await withEnhancedRecovery(
 *   () => sendMoney(account, recipient, 1000, 'USD'),
 *   {
 *     maxRetries: 3,
 *     fallbackAttempts: 2,
 *     transformOperation: (error, attempt) => {
 *       // If insufficient funds, try with a lower amount
 *       if (isInsufficientFundsError(error)) {
 *         const newAmount = 1000 * (1 - attempt * 0.1); // Reduce by 10% each attempt
 *         return () => sendMoney(account, recipient, newAmount, 'USD');
 *       }
 *       return null; // No transformation for other errors
 *     },
 *     onRetry: (error, attempt) => {
 *       console.log(`Retrying after error (attempt ${attempt}): ${error.message}`);
 *     }
 *   }
 * );
 *
 * if (result.status === 'success' || result.verifiedSuccess) {
 *   console.log('Operation succeeded!');
 *   if (result.usedFallback) {
 *     console.log(`Used fallback strategy: ${result.recoveryStrategy}`);
 *   }
 * } else {
 *   console.error(`Operation failed after ${result.attempts} attempts`);
 * }
 * ```
 */
export async function withEnhancedRecovery<T>(
  operation: () => Promise<T>,
  options?: Partial<EnhancedRecoveryOptions>
): Promise<EnhancedOperationResult<T>> {
  // Merge with default options
  const mergedOptions: Required<EnhancedRecoveryOptions> = {
    maxRetries: options?.maxRetries ?? 3,
    initialDelay: options?.initialDelay ?? 500,
    maxDelay: options?.maxDelay ?? 10000,
    backoffFactor: options?.backoffFactor ?? 2,
    retryCondition: options?.retryCondition ?? isRetryableError,
    fallbackAttempts: options?.fallbackAttempts ?? 0,
    transformOperation: options?.transformOperation ?? (() => null),
    handleDuplicatesAsSuccess: options?.handleDuplicatesAsSuccess ?? true,
    enableSmartRecovery: options?.enableSmartRecovery ?? false,
    usePolledVerification: options?.usePolledVerification ?? false,
    verifyOperation: options?.verifyOperation ?? (() => Promise.resolve(false)),
    maxVerificationAttempts: options?.maxVerificationAttempts ?? 3,
    verificationDelay: options?.verificationDelay ?? 1000,
    onRetry:
      options?.onRetry ??
      ((_error: unknown, _attempt: number) => {
        // Default no-op retry handler
      }),
    onExhausted:
      options?.onExhausted ??
      ((_error: unknown, _attempts: number) => {
        // Default no-op exhaustion handler
      }),
    backoffStrategy:
      options?.backoffStrategy ??
      ((attempt: number, initialDelay: number, opts: ErrorRecoveryOptions) => {
        return Math.min(
          initialDelay * Math.pow(opts.backoffFactor || 2, attempt),
          opts.maxDelay || 10000
        );
      }),
  };

  // Initialize result with tracking for recovery steps
  const result: EnhancedOperationResult<T> = {
    result: null,
    status: 'failed',
    attempts: 0,
    fallbackAttempts: 0,
    usedFallback: false,
    verifiedSuccess: false,
    recoverySteps: [],
  };

  // Ensure recoverySteps is defined
  if (!result.recoverySteps) {
    result.recoverySteps = [];
  }

  // Try standard recovery first
  try {
    // Execute with standard recovery
    const standardResult = await executeOperation(operation, {
      maxRetries: mergedOptions.maxRetries,
      initialDelay: mergedOptions.initialDelay,
      maxDelay: mergedOptions.maxDelay,
      backoffFactor: mergedOptions.backoffFactor,
      retryCondition: mergedOptions.retryCondition,
      onRetry: (error, attempt) => {
        result.recoverySteps?.push(
          `Standard retry ${attempt}: ${(error as Error)?.message || 'Unknown error'}`
        );
        if (mergedOptions.onRetry) {
          mergedOptions.onRetry(error, attempt);
        }
      },
      onExhausted: mergedOptions.onExhausted,
      backoffStrategy: mergedOptions.backoffStrategy,
    });

    // Update our result with standard operation results
    result.result = standardResult.result;
    result.status = standardResult.status;
    result.attempts = standardResult.attempts;
    result.error = standardResult.error;

    // If succeeded or it's a duplicate and we should treat as success
    if (
      standardResult.status === 'success' ||
      (standardResult.status === 'duplicate' && mergedOptions.handleDuplicatesAsSuccess)
    ) {
      return result;
    }

    // If standard recovery failed, handle with fallback strategy if enabled
    if (
      standardResult.status === 'failed' &&
      standardResult.error &&
      mergedOptions.fallbackAttempts > 0
    ) {
      result.usedFallback = true;

      // Categorize the error to determine appropriate recovery strategy
      const errorCategory = categorizeTransactionError(standardResult.error);
      result.recoveryStrategy = `fallback-${errorCategory}`;

      // Try fallback attempts with transformed operations
      for (let attempt = 1; attempt <= mergedOptions.fallbackAttempts; attempt++) {
        result.fallbackAttempts = attempt;

        // Transform the operation based on the error
        const transformedOperation = mergedOptions.transformOperation(
          standardResult.error,
          attempt
        );

        // Skip if no transformation returned
        if (!transformedOperation) {
          result.recoverySteps.push(
            `Fallback ${attempt}: No transformation available for ${errorCategory}`
          );
          continue;
        }

        result.recoverySteps.push(
          `Fallback ${attempt}: Attempting with transformed operation for ${errorCategory}`
        );

        try {
          // Execute the transformed operation
          const fallbackResult = await transformedOperation();

          // Success with fallback
          result.result = fallbackResult;
          result.status = 'success';
          result.recoverySteps.push(`Fallback ${attempt}: Succeeded with transformed operation`);
          return result;
        } catch (fallbackError) {
          // Log the fallback error
          result.recoverySteps.push(
            `Fallback ${attempt}: Failed with error: ${
              (fallbackError as Error)?.message || 'Unknown error'
            }`
          );

          // Update error to most recent one
          result.error = processError(fallbackError);
        }
      }
    }

    // If we get here, both standard and fallback strategies failed
    // If verification is enabled, check if operation actually completed
    if (mergedOptions.usePolledVerification && mergedOptions.verifyOperation) {
      result.recoverySteps.push('Starting operation verification despite error');

      for (let attempt = 1; attempt <= mergedOptions.maxVerificationAttempts; attempt++) {
        result.recoverySteps.push(`Verification attempt ${attempt}`);

        try {
          const verified = await mergedOptions.verifyOperation();

          if (verified) {
            result.verifiedSuccess = true;
            result.status = 'success';
            result.recoverySteps.push(
              'Verification succeeded: Operation completed successfully despite error'
            );
            return result;
          }

          // Wait before next verification attempt
          if (attempt < mergedOptions.maxVerificationAttempts) {
            await new Promise((resolve) => setTimeout(resolve, mergedOptions.verificationDelay));
          }
        } catch (verificationError) {
          result.recoverySteps.push(
            `Verification attempt ${attempt} failed: ${
              (verificationError as Error)?.message || 'Unknown error'
            }`
          );
        }
      }

      result.recoverySteps.push('Verification failed: Operation did not complete');
    }

    // All recovery strategies have failed
    return result;
  } catch (unexpectedError) {
    // Handle any unexpected errors from the recovery process itself
    result.error = processError(unexpectedError);
    result.recoverySteps.push(
      `Unexpected error in recovery process: ${
        (unexpectedError as Error)?.message || 'Unknown error'
      }`
    );
    return result;
  }
}

/**
 * Executes a financial transaction with enhanced error recovery and
 * specialized handling for common financial transaction errors
 *
 * @returns Promise resolving to an enhanced operation result
 *
 * @example
 * ```typescript
 * // Execute a payment transaction with smart recovery
 * const result = await executeTransactionWithRecovery(
 *   () => client.entities.transactions.createTransaction(orgId, ledgerId, paymentTx),
 *   {
 *     maxRetries: 2,
 *     enableSmartRecovery: true,
 *     transformOperation: (error, attempt) => {
 *       if (isInsufficientBalanceError(error)) {
 *         // Create a smaller transaction
 *         const reducedAmount = paymentTx.amount * 0.9; // 90% of original
 *         const newTx = { ...paymentTx, amount: reducedAmount };
 *         return () => client.entities.transactions.createTransaction(orgId, ledgerId, newTx);
 *       }
 *       return null;
 *     }
 *   }
 * );
 *
 * if (result.status === 'success') {
 *   console.log('Payment processed successfully');
 *   if (result.usedFallback) {
 *     console.log(`Used recovery strategy: ${result.recoveryStrategy}`);
 *   }
 * } else if (result.status === 'duplicate') {
 *   console.log('Payment was already processed');
 * } else {
 *   console.error(`Payment failed: ${result.error?.message}`);
 * }
 * ```
 */
export async function executeTransactionWithRecovery<T>(
  transactionFn: () => Promise<T>,
  options?: Partial<EnhancedRecoveryOptions>
): Promise<EnhancedOperationResult<T>> {
  // Merge with default options
  const mergedOptions: Partial<EnhancedRecoveryOptions> = {
    // Use shorter timeout for financial transactions
    maxDelay: 5000,
    // Don't retry business logic errors
    retryCondition: (error) => {
      const errorCategory = categorizeTransactionError(error);

      // Don't retry these business logic errors
      if (
        errorCategory === TransactionErrorCategory.INSUFFICIENT_FUNDS ||
        errorCategory === TransactionErrorCategory.ACCOUNT_FROZEN ||
        errorCategory === TransactionErrorCategory.ACCOUNT_INACTIVE ||
        errorCategory === TransactionErrorCategory.ASSET_MISMATCH
      ) {
        return false;
      }

      // Use standard retry condition for other errors
      return isRetryableError(error);
    },
    // Handle duplicates as success by default for idempotent transactions
    handleDuplicatesAsSuccess: true,
    ...options,
  };

  // Enhanced recovery specifically for financial transactions
  return await withEnhancedRecovery(transactionFn, mergedOptions);
}

/**
 * Creates an operation verification function for transaction status
 *
 * @returns Function for use with usePolledVerification
 *
 * @example
 * ```typescript
 * // Create a verification function for a transaction
 * const verifyTx = createTransactionVerification(
 *   () => client.entities.transactions.getTransaction(orgId, ledgerId, txId)
 *     .then(() => true)
 *     .catch(() => false)
 * );
 *
 * // Use it with enhanced recovery
 * const result = await executeTransactionWithRecovery(
 *   () => client.entities.transactions.createTransaction(orgId, ledgerId, paymentTx),
 *   {
 *     usePolledVerification: true,
 *     verifyOperation: verifyTx
 *   }
 * );
 * ```
 */
export function createTransactionVerification(
  checkFn: () => Promise<boolean>
): () => Promise<boolean> {
  return async () => {
    try {
      return await checkFn();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false;
    }
  };
}
