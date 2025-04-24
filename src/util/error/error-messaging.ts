/**
 * @file Error messaging utilities
 * @description Functions for generating user-friendly error messages and recommendations
 */

import {
  getTransactionErrorType,
  isRetryableError,
  TransactionErrorType,
} from './error-classification';
import { processApiError } from './error-processor';
import { ErrorCategory } from './error-types';
import { getErrorDetails } from './error-utils';

/**
 * Gets a user-friendly message for a specific error
 *
 * This function returns a simplified, user-friendly error message that can
 * be displayed directly to end users in UI components.
 *
 * @param error - Any error object
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.transactions.createTransaction(orgId, ledgerId, txInput);
 * } catch (error) {
 *   // Get a user-friendly message
 *   const message = getUserFriendlyErrorMessage(error);
 *
 *   // Display in UI
 *   showErrorToast(message);
 * }
 * ```
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const processed = processApiError(error);

  // Return specific messages based on error type
  switch (processed.type) {
    case ErrorCategory.VALIDATION:
      return 'The provided data is invalid. Please check your input and try again.';

    case ErrorCategory.NOT_FOUND:
      return processed.message;

    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please check your credentials.';

    case ErrorCategory.AUTHORIZATION:
      return "You don't have permission to perform this action.";

    case ErrorCategory.CONFLICT:
      return 'This operation conflicts with the current state. The resource may have been modified.';

    case ErrorCategory.LIMIT_EXCEEDED:
      return 'Rate limit exceeded. Please try again later.';

    case ErrorCategory.TIMEOUT:
      return 'The operation timed out. Please try again.';

    case ErrorCategory.NETWORK:
      return 'Network error. Please check your connection and try again.';

    case ErrorCategory.INTERNAL:
      return 'An internal server error occurred. Please try again later.';

    case ErrorCategory.UNPROCESSABLE:
      if (processed.message.includes('insufficient')) {
        return 'Insufficient funds to complete this transaction.';
      }
      return 'The request could not be processed. Please check your input.';

    default:
      // For unknown errors, return a generic message or the original if it's user-friendly
      return processed.message.length > 100
        ? 'An unexpected error occurred. Please try again or contact support.'
        : processed.message;
  }
}

/**
 * Provides domain-specific recovery recommendations based on error type
 *
 * @param error - Any error object
 * @returns Recovery recommendation text
 */
export function getErrorRecoveryRecommendation(error: unknown): string {
  const transactionErrorType = getTransactionErrorType(error);

  switch (transactionErrorType) {
    case TransactionErrorType.INSUFFICIENT_FUNDS:
      return 'Ensure the source account has sufficient funds before retrying the transaction.';

    case TransactionErrorType.DUPLICATE_TRANSACTION:
      return 'This transaction was already processed. No action needed.';

    case TransactionErrorType.ACCOUNT_FROZEN:
      return 'Contact support to unfreeze the account before retrying.';

    case TransactionErrorType.ACCOUNT_INACTIVE:
      return 'Activate the account before retrying this transaction.';

    case TransactionErrorType.ASSET_MISMATCH:
      return 'Ensure both accounts use the same asset type or add a currency conversion step.';

    case TransactionErrorType.NEGATIVE_BALANCE:
      return 'Ensure the transaction will not result in a negative balance.';

    case TransactionErrorType.LIMIT_EXCEEDED:
      return 'Wait for the rate limit to reset before retrying, or reduce the frequency of requests.';

    case TransactionErrorType.TRANSACTION_REJECTED:
      return 'Review the transaction details and correct any issues before retrying.';

    case TransactionErrorType.UNAUTHORIZED_TRANSACTION:
      return 'Ensure you have the necessary permissions for this transaction.';

    case TransactionErrorType.CURRENCY_CONVERSION_ERROR:
      return 'Check that the currency conversion rate is available and valid.';

    case TransactionErrorType.ACCOUNT_NOT_FOUND:
      return 'Verify the account IDs are correct and the accounts exist.';

    default:
      return isRetryableError(error)
        ? 'This issue may be temporary. Please try again.'
        : 'Review the operation details and correct any issues before retrying.';
  }
}

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
  // Import needed because this function requires getEnhancedErrorInfo
  // But we need to avoid circular dependencies with processor.ts
  const { getEnhancedErrorInfo } = require('./error-processor');

  const errorInfo = getEnhancedErrorInfo(error);
  const errorDetails = getErrorDetails(error);

  logger('===== ERROR DETAILS =====');
  logger(`Type: ${errorInfo.type}`);
  logger(`Message: ${errorInfo.message}`);

  if (errorInfo.transactionErrorType) {
    logger(`Transaction Error Type: ${errorInfo.transactionErrorType}`);
  }

  if (errorInfo.statusCode) {
    logger(`Status Code: ${errorInfo.statusCode}`);
  }

  if (errorInfo.resource) {
    logger(
      `Resource: ${errorInfo.resource}${errorInfo.resourceId ? `/${errorInfo.resourceId}` : ''}`
    );
  }

  if (errorInfo.requestId) {
    logger(`Request ID: ${errorInfo.requestId}`);
  }

  if (errorInfo.recoveryRecommendation) {
    logger(`Recovery Recommendation: ${errorInfo.recoveryRecommendation}`);
  }

  logger(`Retryable: ${errorInfo.isRetryable}`);

  if (context) {
    logger('Context:', context);
  }

  // Use error.stack directly if available, otherwise check errorDetails
  if (error instanceof Error && error.stack) {
    logger('Stack Trace:');
    logger(error.stack);
  }

  logger('=========================');
}

/**
 * Creates a function that can be used to handle errors in a standardized way
 *
 * @param options - Options for error handling
 * @returns A function that handles errors
 *
 * @example
 * ```typescript
 * const handleApiError = createErrorHandler({
 *   logError: true,
 *   rethrow: false,
 *   formatMessage: (error) => `API Error: ${error.userMessage}`
 * });
 *
 * try {
 *   await client.entities.accounts.getAccount(orgId, ledgerId, accountId);
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function createErrorHandler(options?: {
  /** Whether to log the error */
  logError?: boolean;
  /** Custom logger function */
  logger?: (message: string, error?: unknown) => void;
  /** Whether to rethrow the error after handling */
  rethrow?: boolean;
  /** Custom message formatter */
  formatMessage?: (errorInfo: any) => string;
  /** Default return value if not rethrowing */
  defaultReturnValue?: any;
}) {
  // Import needed because this function requires getEnhancedErrorInfo
  // But we need to avoid circular dependencies with processor.ts
  const { getEnhancedErrorInfo } = require('./error-processor');

  const {
    logError = true,
    logger = console.error,
    rethrow = false,
    formatMessage,
    defaultReturnValue = null,
  } = options || {};

  return function handleError(error: unknown) {
    // Process the error to get enhanced information
    const errorInfo = getEnhancedErrorInfo(error);

    // Format the error message if a formatter is provided
    const message = formatMessage ? formatMessage(errorInfo) : errorInfo.userMessage;

    // Log the error if enabled
    if (logError) {
      logger(message, error);
    }

    // Rethrow the error if enabled
    if (rethrow) {
      throw error;
    }

    // Return the default value
    return defaultReturnValue;
  };
}
