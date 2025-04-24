/**
 * @file Error classification utilities
 * @description Functions for categorizing and classifying errors by their properties
 */

import { isMidazError } from './error-guards';
import { categorizeTransactionError, TransactionErrorCategory } from './error-mapping';
import { ErrorCategory, MidazError } from './error-types';

// Export transaction error types for backward compatibility
export type TransactionErrorType = TransactionErrorCategory;

export const TransactionErrorType = TransactionErrorCategory;

/**
 * Determines if an error should be retried based on its type
 *
 * @param error - Any error object
 * @returns Whether the error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check for network-related errors, which are typically transient
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('econnreset')
    );
  }

  if (isMidazError(error)) {
    // Retry for specific error categories
    return (
      error.category === ErrorCategory.NETWORK ||
      error.category === ErrorCategory.TIMEOUT ||
      error.category === ErrorCategory.LIMIT_EXCEEDED
    );
  }

  // For standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('socket') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    );
  }

  return false;
}

/**
 * Provides detailed classification of transaction-specific errors
 *
 * @param error - Any error object
 * @returns Transaction error type
 */
export function getTransactionErrorType(error: unknown): TransactionErrorType {
  // Use the consolidated categorizeTransactionError function
  const category = categorizeTransactionError(error) as TransactionErrorType;

  // Handle the additional CURRENCY_CONVERSION_ERROR that exists in TransactionErrorType
  // but not in the consolidated categorizeTransactionError function
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('currency') && message.includes('conversion')) {
      return 'currency_conversion_error' as TransactionErrorType;
    }
  }

  return category;
}

/**
 * Checks if an error is related to insufficient funds
 *
 * This is a convenience function to quickly check if a transaction failed
 * due to insufficient funds, which is a common error condition.
 *
 * @param error - Any error object
 * @returns True if the error is related to insufficient funds
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.transactions.createTransaction(orgId, ledgerId, txInput);
 * } catch (error) {
 *   if (isInsufficientFundsError(error)) {
 *     // Show specific message for insufficient funds
 *     showErrorMessage("Your account doesn't have enough funds for this transaction.");
 *   } else {
 *     // Show generic error message
 *     showErrorMessage(getUserFriendlyErrorMessage(error));
 *   }
 * }
 * ```
 */
export function isInsufficientFundsError(error: unknown): boolean {
  if (!error) return false;

  // Check for specific MidazError types
  if (isMidazError(error)) {
    if (error.category === ErrorCategory.UNPROCESSABLE && error.code === 'insufficient_balance') {
      return true;
    }

    // Also check the message for keywords
    if (
      error.message.toLowerCase().includes('insufficient funds') ||
      error.message.toLowerCase().includes('insufficient_funds')
    ) {
      return true;
    }
  }

  // Check for standard Error or string with specific keywords
  if (error instanceof Error || typeof error === 'string') {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();

    return (
      lowerMessage.includes('insufficient funds') ||
      lowerMessage.includes('insufficient_funds') ||
      lowerMessage.includes('not enough funds') ||
      lowerMessage.includes('balance too low')
    );
  }

  // For other error types, check if transaction error category is set
  const errorType = getTransactionErrorType(error);
  return errorType === TransactionErrorType.INSUFFICIENT_FUNDS;
}

/**
 * Checks if an error is related to a duplicate transaction
 *
 * This is a convenience function to quickly check if a transaction failed
 * due to being a duplicate (often due to reusing an idempotency key).
 *
 * @param error - Any error object
 * @returns True if the error is related to a duplicate transaction
 *
 * @example
 * ```typescript
 * try {
 *   await client.entities.transactions.createTransaction(orgId, ledgerId, txInput);
 * } catch (error) {
 *   if (isDuplicateTransactionError(error)) {
 *     // This transaction was already processed, so we can safely continue
 *     console.log("Transaction was already processed");
 *     return;
 *   } else {
 *     // Handle other errors
 *     handleError(error);
 *   }
 * }
 * ```
 */
export function isDuplicateTransactionError(error: unknown): boolean {
  if (!error) return false;

  // Check for specific MidazError types
  if (isMidazError(error)) {
    if (error.category === ErrorCategory.CONFLICT && error.code === 'idempotency_error') {
      return true;
    }

    // Also check the message for keywords
    if (
      error.message.toLowerCase().includes('duplicate transaction') ||
      error.message.toLowerCase().includes('duplicate_transaction')
    ) {
      return true;
    }
  }

  // Check for standard Error or string with specific keywords
  if (error instanceof Error || typeof error === 'string') {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();

    return (
      lowerMessage.includes('duplicate transaction') ||
      lowerMessage.includes('duplicate_transaction') ||
      lowerMessage.includes('already processed') ||
      lowerMessage.includes('idempotency key already used')
    );
  }

  // For other error types, check if transaction error category is set
  const errorType = getTransactionErrorType(error);
  return errorType === TransactionErrorType.DUPLICATE_TRANSACTION;
}
