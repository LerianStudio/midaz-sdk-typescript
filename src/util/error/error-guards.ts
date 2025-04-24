/**
 * @file Error type guard functions for the Midaz SDK
 * @description Provides type guard functions to check error types
 */

import { ErrorCategory, ErrorCode, MidazError } from './error-types';

/**
 * Type guard for MidazError
 *
 * Checks if an error is an instance of MidazError.
 *
 * @param error - Error to check
 * @returns Whether the error is a MidazError
 */
export function isMidazError(error: unknown): error is MidazError {
  return error instanceof MidazError;
}

/**
 * Type guard for validation errors
 *
 * Checks if an error is a validation error.
 *
 * @param error - Error to check
 * @returns Whether the error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.VALIDATION;
}

/**
 * Type guard for not found errors
 *
 * Checks if an error is a not found error.
 *
 * @param error - Error to check
 * @returns Whether the error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.NOT_FOUND;
}

/**
 * Type guard for authentication errors
 *
 * Checks if an error is an authentication error.
 *
 * @param error - Error to check
 * @returns Whether the error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.AUTHENTICATION;
}

/**
 * Type guard for authorization errors
 *
 * Checks if an error is an authorization error.
 *
 * @param error - Error to check
 * @returns Whether the error is an authorization error
 */
export function isAuthorizationError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.AUTHORIZATION;
}

/**
 * Type guard for conflict errors
 *
 * Checks if an error is a conflict error.
 *
 * @param error - Error to check
 * @returns Whether the error is a conflict error
 */
export function isConflictError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.CONFLICT;
}

/**
 * Type guard for rate limit errors
 *
 * Checks if an error is a rate limit error.
 *
 * @param error - Error to check
 * @returns Whether the error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.LIMIT_EXCEEDED;
}

/**
 * Type guard for timeout errors
 *
 * Checks if an error is a timeout error.
 *
 * @param error - Error to check
 * @returns Whether the error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.TIMEOUT;
}

/**
 * Type guard for cancellation errors
 *
 * Checks if an error is a cancellation error.
 *
 * @param error - Error to check
 * @returns Whether the error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.CANCELLATION;
}

/**
 * Type guard for network errors
 *
 * Checks if an error is a network error.
 *
 * @param error - Error to check
 * @returns Whether the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.NETWORK;
}

/**
 * Type guard for internal errors
 *
 * Checks if an error is an internal error.
 *
 * @param error - Error to check
 * @returns Whether the error is an internal error
 */
export function isInternalError(error: unknown): boolean {
  return isMidazError(error) && error.category === ErrorCategory.INTERNAL;
}

/**
 * Type guard for insufficient balance errors
 *
 * Checks if an error is an insufficient balance error.
 *
 * @param error - Error to check
 * @returns Whether the error is an insufficient balance error
 */
export function isInsufficientBalanceError(error: unknown): boolean {
  return isMidazError(error) && error.code === ErrorCode.INSUFFICIENT_BALANCE;
}

/**
 * Type guard for account eligibility errors
 *
 * Checks if an error is an account eligibility error.
 *
 * @param error - Error to check
 * @returns Whether the error is an account eligibility error
 */
export function isAccountEligibilityError(error: unknown): boolean {
  return isMidazError(error) && error.code === ErrorCode.ACCOUNT_ELIGIBILITY_ERROR;
}

/**
 * Type guard for asset mismatch errors
 *
 * Checks if an error is an asset mismatch error.
 *
 * @param error - Error to check
 * @returns Whether the error is an asset mismatch error
 */
export function isAssetMismatchError(error: unknown): boolean {
  return isMidazError(error) && error.code === ErrorCode.ASSET_MISMATCH;
}
