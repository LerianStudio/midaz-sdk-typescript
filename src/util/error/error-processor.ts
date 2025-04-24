/**
 * @file Error processor utilities
 * @description Processes errors into standardized formats with rich metadata
 */

import { getTransactionErrorType, isRetryableError } from './error-classification';
import { isMidazError } from './error-guards';
import { TransactionErrorCategory } from './error-mapping';
import { getErrorRecoveryRecommendation, getUserFriendlyErrorMessage } from './error-messaging';
import { ErrorCategory, ErrorCode, MidazError } from './error-types';

// For backward compatibility
interface MidazErrorWithOriginalError extends MidazError {
  originalError?: Error;
}

/**
 * Detailed error information extracted from any error type
 */
export interface ProcessedApiError {
  /** Error type or category */
  type: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code if available */
  statusCode?: number;

  /** Original error object */
  originalError: unknown;

  /** Additional error details if available */
  details?: any;

  /** Resource type involved in the error */
  resource?: string;

  /** Resource ID involved in the error */
  resourceId?: string;

  /** Request ID if available */
  requestId?: string;
}

/**
 * Enhanced error information with recovery options and domain-specific data
 */
export interface EnhancedErrorInfo extends ProcessedApiError {
  /** Transaction-specific error classification */
  transactionErrorType?: TransactionErrorCategory;
  /** Error recovery recommendation */
  recoveryRecommendation?: string;
  /** UI-friendly error message */
  userMessage: string;
  /** Technical error details for logging */
  technicalDetails: string;
  /** Whether the error is retryable */
  isRetryable: boolean;
  /** Whether to show this error to the end user */
  shouldShowUser: boolean;
}

/**
 * Processes any API error into a standardized format
 *
 * This function extracts useful information from any error type (MidazError,
 * standard Error, or any other object) and returns it in a consistent format
 * that's easier to work with.
 *
 * @param error - Any error object to process
 * @returns Standardized error information
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.accounts.getAccount("org_123", "ldg_456", "non_existent_id");
 * } catch (error) {
 *   const processedError = processApiError(error);
 *
 *   console.log(`Error type: ${processedError.type}`);
 *   console.log(`Message: ${processedError.message}`);
 *
 *   if (processedError.resource) {
 *     console.log(`Resource: ${processedError.resource} ${processedError.resourceId || ''}`);
 *   }
 *
 *   if (processedError.statusCode) {
 *     console.log(`Status code: ${processedError.statusCode}`);
 *   }
 * }
 * ```
 */
export function processApiError(error: unknown): ProcessedApiError {
  // Initialize with default values
  const processed: ProcessedApiError = {
    type: 'unknown',
    message: 'An unknown error occurred',
    originalError: error,
  };

  if (isMidazError(error)) {
    // Handle MidazError type
    processed.type = error.category;
    processed.message = error.message;
    processed.statusCode = error.statusCode;
    processed.resource = error.resource;
    processed.resourceId = error.resourceId;
    processed.requestId = error.requestId;

    // Add specific error handling based on category
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        // Check for either cause (new) or originalError (legacy) property
        const errorWithOriginal = error as MidazErrorWithOriginalError;
        const originalError = error.cause || errorWithOriginal.originalError;
        processed.details = originalError ? (originalError as any).details : undefined;
        break;
      case ErrorCategory.NOT_FOUND:
        processed.message = `The requested ${error.resource || 'resource'} ${
          error.resourceId ? `(${error.resourceId})` : ''
        } was not found`;
        break;
      case ErrorCategory.AUTHENTICATION:
        processed.message = 'Authentication failed. Please check your API credentials';
        break;
      case ErrorCategory.AUTHORIZATION:
        processed.message = "You don't have permission to perform this operation";
        break;
      case ErrorCategory.LIMIT_EXCEEDED:
        processed.message = 'Rate limit exceeded. Please try again later';
        break;
    }
  } else if (error instanceof Error) {
    // Handle standard Error type
    processed.message = error.message;
    processed.type = error.name || 'error';

    // Try to extract more details if available
    const anyError = error as any;
    if (anyError.statusCode) processed.statusCode = anyError.statusCode;
    if (anyError.status) processed.statusCode = anyError.status;
    if (anyError.code) processed.type = anyError.code;
  } else if (typeof error === 'string') {
    // Handle string error
    processed.message = error;
  } else if (error && typeof error === 'object') {
    // Handle object error
    const anyError = error as any;
    if (anyError.message) processed.message = anyError.message;
    if (anyError.error) processed.message = anyError.error;
    if (anyError.statusCode) processed.statusCode = anyError.statusCode;
    if (anyError.status) processed.statusCode = anyError.status;
    if (anyError.code) processed.type = anyError.code;
  }

  return processed;
}

/**
 * Processes any error into a comprehensive enhanced error information object
 *
 * This function combines all error information into a single object with
 * domain-specific classifications, recovery recommendations, and user-friendly messages.
 *
 * @param error - Any error object
 * @returns Enhanced error information
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.transactions.createTransaction(txInput);
 * } catch (error) {
 *   const errorInfo = getEnhancedErrorInfo(error);
 *
 *   console.error(`Error: ${errorInfo.userMessage}`);
 *   console.error(`Technical details: ${errorInfo.technicalDetails}`);
 *
 *   if (errorInfo.recoveryRecommendation) {
 *     console.error(`Recommendation: ${errorInfo.recoveryRecommendation}`);
 *   }
 *
 *   if (errorInfo.isRetryable) {
 *     // Implement retry logic or suggest retry to user
 *   }
 * }
 * ```
 */
export function getEnhancedErrorInfo(error: unknown): EnhancedErrorInfo {
  const processed = processApiError(error);
  const transactionErrorType = getTransactionErrorType(error);
  const recoveryRecommendation = getErrorRecoveryRecommendation(error);
  const isRetryable = isRetryableError(error);

  // Get user-friendly message
  const userMessage = getUserFriendlyErrorMessage(error);

  // Generate technical details for logging
  let technicalDetails = processed.message;

  if (isMidazError(error)) {
    technicalDetails = `[${error.category}/${error.code}] ${error.message}`;

    if (error.resource) {
      technicalDetails += ` (Resource: ${error.resource}${
        error.resourceId ? `/${error.resourceId}` : ''
      })`;
    }

    if (error.requestId) {
      technicalDetails += ` (Request ID: ${error.requestId})`;
    }
  } else if (processed.statusCode) {
    technicalDetails = `[${processed.statusCode}] ${processed.message}`;
  }

  // Determine if error should be shown to user
  // Hide duplicate transaction errors since they're not actual errors from a business perspective
  const shouldShowUser = transactionErrorType !== TransactionErrorCategory.DUPLICATE_TRANSACTION;

  return {
    ...processed,
    transactionErrorType,
    recoveryRecommendation,
    userMessage,
    technicalDetails,
    isRetryable,
    shouldShowUser,
  };
}
