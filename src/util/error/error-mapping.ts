/**
 * @file Error mapping utilities for the Midaz SDK
 * @description Provides functions to map between different error representations
 */

import {
  newAuthenticationError,
  newAuthorizationError,
  newConflictError,
  newInsufficientBalanceError,
  newInternalError,
  newNotFoundError,
  newRateLimitError,
  newTimeoutError,
  newUnprocessableError,
  newValidationError,
} from './error-factories';
import { isMidazError } from './error-guards';
import { ErrorCategory, ErrorCode, MidazError } from './error-types';

/**
 * Transaction error categories
 */
export enum TransactionErrorCategory {
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  ACCOUNT_FROZEN = 'account_frozen',
  ACCOUNT_INACTIVE = 'account_inactive',
  ASSET_MISMATCH = 'asset_mismatch',
  NEGATIVE_BALANCE = 'negative_balance',
  LIMIT_EXCEEDED = 'limit_exceeded',
  INVALID_TRANSACTION = 'invalid_transaction',
  ACCOUNT_NOT_FOUND = 'account_not_found',
  UNAUTHORIZED_TRANSACTION = 'unauthorized_transaction',
  TRANSACTION_REJECTED = 'transaction_rejected',
  TRANSACTION_FAILED = 'transaction_failed',
  CURRENCY_CONVERSION_ERROR = 'currency_conversion_error',
  ACCOUNT_INELIGIBLE = 'account_ineligible',
}

/**
 * Maps a transaction error to a user-friendly category
 *
 * Categorizes errors in a way that makes sense for transaction operations.
 * Consolidates previous implementations for consistent error categorization.
 *
 * @param error - Error to categorize
 * @param uppercase - Whether to return uppercase format (defaults to false - lowercase_underscores format)
 * @returns User-friendly error category
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.transactions.createTransaction(orgId, ledgerId, txInput);
 * } catch (error) {
 *   const category = categorizeTransactionError(error);
 *
 *   switch (category) {
 *     case TransactionErrorCategory.INSUFFICIENT_FUNDS:
 *       showErrorMessage("Your account has insufficient funds for this transaction.");
 *       break;
 *     case TransactionErrorCategory.ACCOUNT_FROZEN:
 *       showErrorMessage("This account is currently frozen and cannot process transactions.");
 *       break;
 *     // Handle other categories...
 *   }
 * }
 * ```
 */
export function categorizeTransactionError(error: unknown, uppercase = false): string {
  if (!error) {
    return uppercase ? 'TRANSACTION_FAILED' : TransactionErrorCategory.TRANSACTION_FAILED;
  }

  // Check for specific MidazError types first
  if (isMidazError(error)) {
    if (error.code === ErrorCode.INSUFFICIENT_BALANCE) {
      return uppercase ? 'INSUFFICIENT_FUNDS' : TransactionErrorCategory.INSUFFICIENT_FUNDS;
    }

    if (error.code === ErrorCode.ACCOUNT_ELIGIBILITY_ERROR) {
      // Further classify account eligibility errors
      const message = error.message.toLowerCase();

      if (message.includes('frozen')) {
        return uppercase ? 'ACCOUNT_FROZEN' : TransactionErrorCategory.ACCOUNT_FROZEN;
      }

      if (message.includes('inactive')) {
        return uppercase ? 'ACCOUNT_INACTIVE' : TransactionErrorCategory.ACCOUNT_INACTIVE;
      }

      return uppercase ? 'ACCOUNT_INELIGIBLE' : 'account_ineligible';
    }

    if (error.code === ErrorCode.ASSET_MISMATCH) {
      return uppercase ? 'ASSET_MISMATCH' : TransactionErrorCategory.ASSET_MISMATCH;
    }

    if (error.code === ErrorCode.IDEMPOTENCY_ERROR) {
      return uppercase ? 'DUPLICATE_TRANSACTION' : TransactionErrorCategory.DUPLICATE_TRANSACTION;
    }

    // Check by category
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return uppercase ? 'INVALID_TRANSACTION' : TransactionErrorCategory.INVALID_TRANSACTION;

      case ErrorCategory.NOT_FOUND:
        return uppercase ? 'ACCOUNT_NOT_FOUND' : TransactionErrorCategory.ACCOUNT_NOT_FOUND;

      case ErrorCategory.AUTHORIZATION:
        return uppercase
          ? 'UNAUTHORIZED_TRANSACTION'
          : TransactionErrorCategory.UNAUTHORIZED_TRANSACTION;

      case ErrorCategory.UNPROCESSABLE:
        return uppercase ? 'TRANSACTION_REJECTED' : TransactionErrorCategory.TRANSACTION_REJECTED;
    }
  }

  // For all error types including non-MidazError instances
  // Check message content for specific patterns
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
      ? error.toLowerCase()
      : '';

  if (
    message.includes('insufficient') &&
    (message.includes('funds') || message.includes('balance'))
  ) {
    return uppercase ? 'INSUFFICIENT_FUNDS' : TransactionErrorCategory.INSUFFICIENT_FUNDS;
  }

  if (message.includes('account') && message.includes('frozen')) {
    return uppercase ? 'ACCOUNT_FROZEN' : TransactionErrorCategory.ACCOUNT_FROZEN;
  }

  if (message.includes('account') && message.includes('inactive')) {
    return uppercase ? 'ACCOUNT_INACTIVE' : TransactionErrorCategory.ACCOUNT_INACTIVE;
  }

  if (message.includes('duplicate') || message.includes('idempotency')) {
    return uppercase ? 'DUPLICATE_TRANSACTION' : TransactionErrorCategory.DUPLICATE_TRANSACTION;
  }

  if (message.includes('limit') && message.includes('exceed')) {
    return uppercase ? 'LIMIT_EXCEEDED' : TransactionErrorCategory.LIMIT_EXCEEDED;
  }

  if (message.includes('asset') && message.includes('mismatch')) {
    return uppercase ? 'ASSET_MISMATCH' : TransactionErrorCategory.ASSET_MISMATCH;
  }

  if (
    message.includes('balance') &&
    (message.includes('negative') || message.includes('below zero'))
  ) {
    return uppercase ? 'NEGATIVE_BALANCE' : TransactionErrorCategory.NEGATIVE_BALANCE;
  }

  // Default category if no match found
  return uppercase ? 'TRANSACTION_FAILED' : TransactionErrorCategory.TRANSACTION_FAILED;
}

/**
 * Creates a MidazError from an HTTP response
 *
 * Maps HTTP status codes to appropriate error types.
 *
 * @param statusCode - HTTP status code
 * @param responseBody - Response body (may contain error details)
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 * @returns Appropriate MidazError for the HTTP status
 */
export function errorFromHttpResponse(
  statusCode: number,
  responseBody: any,
  method?: string,
  url?: string
): MidazError {
  // Extract error information from response body if available
  let errorMessage = 'Request failed';
  let errorDetails: Record<string, any> = {};

  if (responseBody) {
    // Handle standard error object format
    if (typeof responseBody === 'object' && responseBody.error) {
      if (typeof responseBody.error === 'string') {
        errorMessage = responseBody.error;
      } else if (typeof responseBody.error === 'object') {
        if (responseBody.error.message) {
          errorMessage = responseBody.error.message;
        }
        errorDetails = responseBody.error;
      }
    }
    // Handle error message directly in response
    else if (typeof responseBody === 'object' && responseBody.message) {
      errorMessage = responseBody.message;
      errorDetails = responseBody;
    }
    // Handle string response
    else if (typeof responseBody === 'string') {
      try {
        // Try to parse as JSON
        const parsedBody = JSON.parse(responseBody);
        if (parsedBody.error || parsedBody.message) {
          return errorFromHttpResponse(statusCode, parsedBody, method, url);
        }
      } catch (e) {
        // If it's not JSON, use as error message if it looks like an error
        if (responseBody.toLowerCase().includes('error')) {
          errorMessage = responseBody;
        }
      }
    }
  }

  // Add request context to error message
  if (method && url) {
    errorMessage = `${errorMessage} (${method} ${url})`;
  }

  // Default error properties
  const errorParams = {
    ...errorDetails,
    message: errorMessage,
    statusCode,
  };

  // Map status code to specific error type
  switch (statusCode) {
    case 400:
      return newValidationError(errorMessage, {
        resource: errorDetails.resource,
        resourceId: errorDetails.resourceId,
        operation: errorDetails.operation,
      });

    case 401:
      return newAuthenticationError(errorMessage);

    case 403:
      return newAuthorizationError(errorMessage, {
        resource: errorDetails.resource,
        resourceId: errorDetails.resourceId,
        operation: errorDetails.operation,
      });

    case 404:
      // Try to extract resource information from URL
      if (url) {
        const urlParts = url.split('/');
        let resource;
        let resourceId;

        // Simple heuristic to extract resource type and ID from URL path
        // This assumes URLs follow a pattern like /organizations/org123/accounts/acc456
        for (let i = 0; i < urlParts.length - 1; i++) {
          if (/^[a-z-]+s$/.test(urlParts[i])) {
            // Looks like a plural resource type
            resource = urlParts[i].replace(/s$/, ''); // Remove trailing 's'
            if (i + 1 < urlParts.length) {
              resourceId = urlParts[i + 1];
              break;
            }
          }
        }

        if (resource && resourceId) {
          return newNotFoundError(resource, resourceId, {
            message: errorMessage,
          });
        }
      }
      return newNotFoundError('resource', 'unknown', { message: errorMessage });

    case 409:
      return newConflictError(errorMessage, {
        resource: errorDetails.resource,
        resourceId: errorDetails.resourceId,
        operation: errorDetails.operation,
        code: errorDetails.code,
      });

    case 422:
      // Check for specific unprocessable error types
      if (
        errorDetails.code === ErrorCode.INSUFFICIENT_BALANCE ||
        (errorMessage.toLowerCase().includes('insufficient') &&
          (errorMessage.toLowerCase().includes('balance') ||
            errorMessage.toLowerCase().includes('funds')))
      ) {
        return newInsufficientBalanceError(errorMessage, {
          accountId: errorDetails.accountId,
          assetCode: errorDetails.assetCode,
          operation: errorDetails.operation,
        });
      }
      return newUnprocessableError(errorMessage, {
        resource: errorDetails.resource,
        resourceId: errorDetails.resourceId,
        operation: errorDetails.operation,
      });

    case 429:
      return newRateLimitError(errorMessage, {
        retryAfter: errorDetails.retryAfter,
      });

    case 500:
    case 502:
    case 503:
      return newInternalError(errorMessage, {
        operation: errorDetails.operation,
      });

    case 504:
      return newTimeoutError(errorMessage, {
        operation: errorDetails.operation,
      });

    default:
      // For other status codes, create a generic error
      if (statusCode >= 400 && statusCode < 500) {
        return newValidationError(errorMessage, {
          resource: errorDetails.resource,
          resourceId: errorDetails.resourceId,
          operation: errorDetails.operation,
        });
      } else if (statusCode >= 500) {
        return newInternalError(errorMessage, {
          operation: errorDetails.operation,
        });
      } else {
        return new MidazError({
          message: errorMessage,
          category: ErrorCategory.INTERNAL,
          code: ErrorCode.INTERNAL_ERROR,
          statusCode,
        });
      }
  }
}
