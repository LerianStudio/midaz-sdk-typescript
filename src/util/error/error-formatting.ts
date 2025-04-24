/**
 * @file Error formatting utilities for the Midaz SDK
 * @description Provides functions to format errors for display and user interaction
 */

import { ErrorCategory, ErrorDetails, MidazError } from './error-types';
import { getErrorDetails } from './error-utils';

/**
 * Formats an error for display to end users
 *
 * Creates a user-friendly error message from any error type.
 *
 * @param error - Error to format
 * @param includeDetails - Whether to include detailed information
 * @returns Formatted error message
 */
export function formatErrorForDisplay(error: unknown, includeDetails = false): string {
  const details = getErrorDetails(error);
  let message = details.message || 'An unknown error occurred';

  // Keep the message concise for end users
  if (message.length > 100 && !includeDetails) {
    message = message.substring(0, 97) + '...';
  }

  // For detailed output, add resource and status information
  if (includeDetails) {
    const parts = [message];

    if (details.resource && details.resourceId) {
      parts.push(`Resource: ${details.resource} ${details.resourceId}`);
    }

    if (details.statusCode) {
      parts.push(`Status: ${details.statusCode}`);
    }

    if (details.requestId) {
      parts.push(`Request ID: ${details.requestId}`);
    }

    return parts.join('\n');
  }

  return message;
}

/**
 * Formats a transaction error with financial context
 *
 * Provides transaction-specific error formatting.
 *
 * @param error - Transaction error to format
 * @param operationContext - Optional context about the operation
 * @returns Formatted transaction error message
 */
export function formatTransactionError(
  error: unknown,
  operationContext?: {
    transactionId?: string;
    accountId?: string;
    amount?: string;
    assetCode?: string;
  }
): string {
  const details = getErrorDetails(error);
  let message = details.message || 'Transaction failed';

  // Add context about the transaction if available
  if (operationContext) {
    const contextParts = [];

    if (operationContext.transactionId) {
      contextParts.push(`Transaction: ${operationContext.transactionId}`);
    }

    if (operationContext.accountId) {
      contextParts.push(`Account: ${operationContext.accountId}`);
    }

    if (operationContext.amount && operationContext.assetCode) {
      contextParts.push(`Amount: ${operationContext.amount} ${operationContext.assetCode}`);
    }

    if (contextParts.length > 0) {
      message = `${message}\n${contextParts.join('\n')}`;
    }
  }

  return message;
}
