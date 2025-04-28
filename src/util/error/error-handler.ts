/**
 * @file Error handler
 * @description Error handling and recovery functions
 */

import type { LogLevel } from '../observability/logger';
import { 
  EnhancedErrorInfo, 
  ErrorHandlerOptions, 
  ErrorRecoveryOptions, 
  OperationResult, 
  TransactionErrorCategory
} from './error-types';
import { 
  ErrorCategory, 
  ErrorCode, 
  MidazError, 
  TransactionErrorType 
} from './error-types';
import { 
  isAccountEligibilityError, 
  isDuplicateTransactionError, 
  isInsufficientBalanceError,
  isInsufficientFundsError, 
  isRetryableError,
  processError
} from './error-utils';

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
 * Logs detailed error information for debugging
 * 
 * @param error - Error to log
 * @param context - Additional context information
 * @param logger - Custom logger function (defaults to console.error)
 */
export function logDetailedError(
  error: unknown,
  context?: Record<string, any>,
  logger: (message: string, ...args: any[]) => void = console.error
): void {
  // Process the error to get enhanced information
  const errorInfo = processError(error);

  logger('===== ERROR DETAILS =====');
  logger(`Type: ${errorInfo?.type || 'Unknown'}`);
  logger(`Message: ${errorInfo?.message || 'No message available'}`);

  if (errorInfo?.transactionErrorType) {
    logger(`Transaction Error Type: ${errorInfo.transactionErrorType}`);
  }

  if (errorInfo?.statusCode) {
    logger(`Status Code: ${errorInfo.statusCode}`);
  }

  if (errorInfo?.resource) {
    logger(
      `Resource: ${errorInfo.resource}${errorInfo.resourceId ? `/${errorInfo.resourceId}` : ''}`
    );
  }

  if (errorInfo?.requestId) {
    logger(`Request ID: ${errorInfo.requestId}`);
  }

  if (errorInfo?.recoveryRecommendation) {
    logger(`Recovery Recommendation: ${errorInfo.recoveryRecommendation}`);
  }

  logger(`Retryable: ${errorInfo?.isRetryable}`);

  if (context) {
    logger('Context:', context);
  }

  // Use error.stack directly if available
  if (error instanceof Error && error.stack) {
    logger('Stack Trace:');
    logger(error.stack);
  }

  logger('=========================');
}

/** Creates a standardized error handler with configurable behavior */
export function createErrorHandler(options?: ErrorHandlerOptions) {
  const {
    displayErrors = true,
    displayFn = console.error,
    logErrors = true,
    logLevel = 'error',
    rethrow = false,
    formatMessage,
    defaultReturnValue = null,
  } = options || {};

  return function handleError(error: unknown, handlerContext?: Record<string, any>) {
    // Process the error to get all details
    const errorInfo = processError(error);
    
    // Get the error message
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle user display if enabled
    if (displayErrors) {
      // If we have a formatter and valid errorInfo, use it, otherwise use the raw error message
      const displayMessage = formatMessage && errorInfo 
        ? formatMessage(errorInfo) 
        : errorMessage;
      
      displayFn(displayMessage);
    }

    // Log detailed information if enabled
    if (logErrors) {
      logDetailedError(error, handlerContext, (message, ...args) => {
        // Handle different log levels appropriately
        switch(logLevel) {
          case 'debug':
            console.debug(message, ...args);
            break;
          case 'info':
            console.info(message, ...args);
            break;
          case 'warn':
            console.warn(message, ...args);
            break;
          case 'error':
          default:
            console.error(message, ...args);
            break;
        }
      });
    }

    // Rethrow the error if enabled
    if (rethrow) {
      throw error;
    }

    // Return the default value or the error info if no default is specified
    return defaultReturnValue === null ? errorInfo : defaultReturnValue;
  };
}

/** Handles a function that may throw errors with consistent error handling */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: ErrorHandlerOptions
): Promise<T | null> {
  const handler = createErrorHandler(options);
  
  try {
    return await fn();
  } catch (error) {
    return handler(error) as any;
  }
}

/** 
 * Executes a function with automatic error recovery (retry with exponential backoff)
 *
 * @param operation - Function to execute and potentially retry
 * @param options - Error recovery options
 * @returns The result of the operation
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
 * Safely executes an operation with advanced error handling and recovery
 * 
 * @param operation - Function to execute 
 * @param options - Error recovery options
 * @returns Operation result with status and error information
 */
export async function executeOperation<T>(
  operation: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<OperationResult<T>> {
  let attempts = 0;

  try {
    // First, try to execute the operation with automatic retries for retryable errors
    const result = await withErrorRecovery(
      async () => {
        attempts++;
        return await operation();
      },
      options
    );

    // Operation succeeded
    return {
      result,
      status: 'success',
      attempts,
    };
  } catch (error) {
    // Process the error to get enhanced information
    const enhancedError = processError(error);

    // Check if this is a duplicate operation (common for idempotent APIs)
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

/** 
 * Result type specifically for transaction execution
 * This interface extends OperationResult without adding new members
 * to provide a more specific type for transaction operations.
 * @typescript-eslint/no-empty-interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExecuteTransactionResult<T> extends OperationResult<T> {}

/** 
 * Specialized version of executeOperation for financial transactions
 * 
 * @param transactionFn - Transaction function to execute
 * @param options - Error recovery options
 * @returns Transaction result and status information
 */
export async function executeTransaction<T>(
  transactionFn: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<ExecuteTransactionResult<T>> {
  return executeOperation(
    transactionFn,
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
}

// For backward compatibility
export const createStandardErrorHandler = createErrorHandler;
export const safelyExecuteOperation = executeOperation;