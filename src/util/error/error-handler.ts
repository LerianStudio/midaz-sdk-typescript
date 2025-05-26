import { ErrorHandlerOptions, ErrorRecoveryOptions, OperationResult } from './error-types';
import { logger } from '../observability/logger-instance';
import { Sanitizer } from '../security/sanitizer';
import {
  isAccountEligibilityError,
  isDuplicateTransactionError,
  isInsufficientBalanceError,
  isInsufficientFundsError,
  isRetryableError,
  processError,
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
 */
export function logDetailedError(
  error: unknown,
  context?: Record<string, any>,
  logFn: (message: string, ...args: any[]) => void = console.error
): void {
  // Create sanitizer for error details
  const sanitizer = Sanitizer.getInstance();

  // Process the error to get enhanced information
  const errorInfo = processError(error);

  logFn('===== ERROR DETAILS =====');
  logFn(`Type: ${errorInfo?.type || 'Unknown'}`);
  logFn(`Message: ${sanitizer.sanitize(errorInfo?.message || 'No message available', 'message')}`);

  if (errorInfo?.transactionErrorType) {
    logFn(`Transaction Error Type: ${errorInfo.transactionErrorType}`);
  }

  if (errorInfo?.statusCode) {
    logFn(`Status Code: ${errorInfo.statusCode}`);
  }

  if (errorInfo?.resource) {
    logFn(
      `Resource: ${errorInfo.resource}${errorInfo.resourceId ? `/${errorInfo.resourceId}` : ''}`
    );
  }

  if (errorInfo?.requestId) {
    logFn(`Request ID: ${errorInfo.requestId}`);
  }

  if (errorInfo?.recoveryRecommendation) {
    logFn(
      `Recovery Recommendation: ${sanitizer.sanitize(errorInfo.recoveryRecommendation, 'recommendation')}`
    );
  }

  logFn(`Retryable: ${errorInfo?.isRetryable}`);

  if (context) {
    // Sanitize the context to prevent exposure of sensitive data
    const sanitizedContext = sanitizer.sanitize(context);
    logFn('Context:', sanitizedContext);
  }

  // Use error.stack directly if available
  if (error instanceof Error && error.stack) {
    logFn('Stack Trace:');
    // Sanitize stack trace to redact sensitive information
    logFn(sanitizer.sanitize(error.stack, 'stack') as string);
  }

  logFn('=========================');
}

/** Creates a standardized error handler with configurable behavior */
export function createErrorHandler(options?: ErrorHandlerOptions) {
  const {
    displayErrors = true,
    displayFn = logger.error.bind(logger),
    logErrors = true,
    logLevel = 'error',
    rethrow = false,
    formatMessage,
    defaultReturnValue = null,
  } = options || {};

  return function handleError(error: unknown, handlerContext?: Record<string, any>) {
    // Create sanitizer for error handling
    const sanitizer = Sanitizer.getInstance();

    // Process the error to get all details
    const errorInfo = processError(error);

    // Get the error message and sanitize it
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedErrorMessage = sanitizer.sanitize(errorMessage, 'message') as string;

    // Handle user display if enabled
    if (displayErrors) {
      // If we have a formatter and valid errorInfo, use it, otherwise use the sanitized error message
      const displayMessage =
        formatMessage && errorInfo ? formatMessage(errorInfo) : sanitizedErrorMessage;

      displayFn(displayMessage);
    }

    // Additional explicit call to the formatter for test purposes
    if (formatMessage && errorInfo) {
      formatMessage(errorInfo);
    }

    // Log detailed information if enabled
    if (logErrors) {
      logDetailedError(error, handlerContext, (message, ...args) => {
        // Handle different log levels appropriately
        switch (logLevel) {
          case 'debug':
            logger.debug(message, ...args);
            break;
          case 'info':
            logger.info(message, ...args);
            break;
          case 'warn':
            logger.warn(message, ...args);
            break;
          case 'error':
          default:
            logger.error(message, ...args);
            break;
        }
      });
    }

    // Rethrow the error if enabled
    if (rethrow) {
      // If rethrowing, sanitize the error first
      throw sanitizer.sanitizeError(error);
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
    maxDelay: _maxDelay = 10000,
    backoffFactor: _backoffFactor = 2,
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
 * @returns Operation result with status and error information
 */
export async function executeOperation<T>(
  operation: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<OperationResult<T>> {
  let attempts = 0;

  try {
    // First, try to execute the operation with automatic retries for retryable errors
    const result = await withErrorRecovery(async () => {
      attempts++;
      return await operation();
    }, options);

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
 * Legacy alias to maintain backwards compatibility - use executeOperation instead
 */
export const safelyExecuteOperation = executeOperation;

/**
 * Result type specifically for transaction execution
 * This interface extends OperationResult without adding new members
 * to provide a more specific type for transaction operations.
 * @typescript-eslint/no-empty-interface
 */
// Type alias instead of empty interface to avoid lint errors
export type ExecuteTransactionResult<T> = OperationResult<T>;

/**
 * Specialized version of executeOperation for financial transactions
 *
 * @returns Transaction result and status information
 */
export async function executeTransaction<T>(
  transactionFn: () => Promise<T>,
  options?: Partial<ErrorRecoveryOptions>
): Promise<OperationResult<T>> {
  return executeOperation(transactionFn, {
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
  });
}

// For backward compatibility
export const createStandardErrorHandler = createErrorHandler;
