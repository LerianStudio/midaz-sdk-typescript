/**
 * @file Error factory functions for the Midaz SDK
 * @description Provides factory functions for creating different types of MidazError instances
 */

import { ErrorCategory, ErrorCode, MidazError } from './error-types';

/**
 * Creates a new validation error
 *
 * Used when input data fails validation requirements.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with validation category and code
 */
export function newValidationError(
  message: string,
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.VALIDATION,
    code: ErrorCode.VALIDATION_ERROR,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    statusCode: 400,
    cause: params.cause,
  });
}

/**
 * Creates a new invalid input error
 *
 * A specific type of validation error for invalid input data.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with validation category and code
 */
export function newInvalidInputError(
  message = 'Invalid input provided',
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return newValidationError(message, params);
}

/**
 * Creates a new missing parameter error
 *
 * A specific type of validation error for missing required parameters.
 *
 * @param paramName - Name of the missing parameter
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with validation category and code
 */
export function newMissingParameterError(
  paramName: string,
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return newValidationError(`Required parameter '${paramName}' is missing`, params);
}

/**
 * Creates a new not found error
 *
 * Used when a requested resource could not be found.
 *
 * @param resourceType - Type of resource that was not found
 * @param resourceId - ID of the resource that was not found
 * @param params - Additional error parameters
 * @param params.message - Custom error message
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with not found category and code
 */
export function newNotFoundError(
  resourceType: string,
  resourceId: string,
  params: {
    message?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  const message = params.message || `${resourceType} '${resourceId}' not found`;

  return new MidazError({
    message,
    category: ErrorCategory.NOT_FOUND,
    code: ErrorCode.NOT_FOUND,
    resource: resourceType,
    resourceId,
    operation: params.operation,
    statusCode: 404,
    cause: params.cause,
  });
}

/**
 * Creates a new authentication error
 *
 * Used when there are issues with authentication credentials.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with authentication category and code
 */
export function newAuthenticationError(
  message = 'Authentication failed',
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.AUTHENTICATION,
    code: ErrorCode.AUTHENTICATION_ERROR,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    statusCode: 401,
    cause: params.cause,
  });
}

/**
 * Creates a new authorization error
 *
 * Used when the user lacks sufficient permissions for an operation.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with authorization category and code
 */
export function newAuthorizationError(
  message = 'Access denied',
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.AUTHORIZATION,
    code: ErrorCode.PERMISSION_ERROR,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    statusCode: 403,
    cause: params.cause,
  });
}

/**
 * Creates a new conflict error
 *
 * Used when an operation would conflict with the current state of a resource.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.code - Error code
 * @param params.cause - Original cause of the error
 * @returns MidazError with conflict category and provided or default code
 */
export function newConflictError(
  message = 'Resource conflict',
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    code?: ErrorCode;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.CONFLICT,
    code: params.code || ErrorCode.ALREADY_EXISTS,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    statusCode: 409,
    cause: params.cause,
  });
}

/**
 * Creates a new rate limit error
 *
 * Used when a rate limit or quota has been exceeded.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.retryAfter - Seconds to wait before retrying
 * @param params.cause - Original cause of the error
 * @returns MidazError with limit exceeded category and rate limit code
 */
export function newRateLimitError(
  message = 'Rate limit exceeded',
  params: {
    retryAfter?: number;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.LIMIT_EXCEEDED,
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    statusCode: 429,
    cause: params.cause,
  });
}

/**
 * Creates a new timeout error
 *
 * Used when an operation times out.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with timeout category and code
 */
export function newTimeoutError(
  message = 'Operation timed out',
  params: {
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.TIMEOUT,
    code: ErrorCode.TIMEOUT,
    operation: params.operation,
    statusCode: 504,
    cause: params.cause,
  });
}

/**
 * Creates a new cancellation error
 *
 * Used when an operation is cancelled by the user or system.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with cancellation category and cancelled code
 */
export function newCancellationError(
  message = 'Operation cancelled',
  params: {
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.CANCELLATION,
    code: ErrorCode.CANCELLED,
    operation: params.operation,
    cause: params.cause,
  });
}

/**
 * Creates a new network error
 *
 * Used when there are network connectivity issues.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with network category and internal error code
 */
export function newNetworkError(
  message = 'Network error',
  params: {
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.NETWORK,
    code: ErrorCode.INTERNAL_ERROR,
    operation: params.operation,
    cause: params.cause,
  });
}

/**
 * Creates a new internal error
 *
 * Used for unexpected server-side or SDK internal errors.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with internal category and internal error code
 */
export function newInternalError(
  message = 'Internal error',
  params: {
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.INTERNAL,
    code: ErrorCode.INTERNAL_ERROR,
    operation: params.operation,
    statusCode: 500,
    cause: params.cause,
  });
}

/**
 * Creates a new unprocessable entity error
 *
 * Used when a request is valid but cannot be processed due to semantic errors.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.resource - Resource type
 * @param params.resourceId - Resource ID
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with unprocessable category and internal error code
 */
export function newUnprocessableError(
  message = 'Unprocessable request',
  params: {
    resource?: string;
    resourceId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.UNPROCESSABLE,
    code: ErrorCode.INTERNAL_ERROR,
    resource: params.resource,
    resourceId: params.resourceId,
    operation: params.operation,
    statusCode: 422,
    cause: params.cause,
  });
}

/**
 * Creates a new insufficient balance error
 *
 * Used when an account has insufficient balance for a financial operation.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.accountId - ID of the account with insufficient balance
 * @param params.assetCode - Asset code that has insufficient balance
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with unprocessable category and insufficient balance code
 */
export function newInsufficientBalanceError(
  message = 'Insufficient balance',
  params: {
    accountId?: string;
    assetCode?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.UNPROCESSABLE,
    code: ErrorCode.INSUFFICIENT_BALANCE,
    resource: 'account',
    resourceId: params.accountId,
    operation: params.operation,
    statusCode: 422,
    cause: params.cause,
  });
}

/**
 * Creates a new asset mismatch error
 *
 * Used when an operation involves incompatible assets.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.expectedAsset - The expected asset code
 * @param params.actualAsset - The actual asset code provided
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with unprocessable category and asset mismatch code
 */
export function newAssetMismatchError(
  message = 'Asset mismatch',
  params: {
    expectedAsset?: string;
    actualAsset?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  // Generate default message if expected and actual assets are provided
  if (params.expectedAsset && params.actualAsset && message === 'Asset mismatch') {
    message = `Asset mismatch: expected ${params.expectedAsset}, got ${params.actualAsset}`;
  }

  return new MidazError({
    message,
    category: ErrorCategory.UNPROCESSABLE,
    code: ErrorCode.ASSET_MISMATCH,
    operation: params.operation,
    statusCode: 422,
    cause: params.cause,
  });
}

/**
 * Creates a new account eligibility error
 *
 * Used when an account is not eligible for a specific operation.
 *
 * @param message - Error message
 * @param params - Additional error parameters
 * @param params.accountId - ID of the ineligible account
 * @param params.operation - Operation being performed
 * @param params.cause - Original cause of the error
 * @returns MidazError with unprocessable category and account eligibility code
 */
export function newAccountEligibilityError(
  message = 'Account not eligible for this operation',
  params: {
    accountId?: string;
    operation?: string;
    cause?: Error;
  } = {}
): MidazError {
  return new MidazError({
    message,
    category: ErrorCategory.UNPROCESSABLE,
    code: ErrorCode.ACCOUNT_ELIGIBILITY_ERROR,
    resource: 'account',
    resourceId: params.accountId,
    operation: params.operation,
    statusCode: 422,
    cause: params.cause,
  });
}
