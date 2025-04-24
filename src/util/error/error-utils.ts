/**
 * @file Error utility functions for the Midaz SDK
 * @description Provides utility functions for working with errors
 */

import { isMidazError } from './error-guards';
import { ErrorCategory, ErrorCode, ErrorDetails, MidazError } from './error-types';

/**
 * Gets standardized error details from any error type
 *
 * Extracts consistent error details from various error formats.
 *
 * @param error - Error to extract details from
 * @returns Standardized error details
 */
export function getErrorDetails(error: unknown): ErrorDetails {
  // If it's already a MidazError, return its details
  if (isMidazError(error)) {
    return {
      message: error.message,
      category: error.category,
      code: error.code,
      statusCode: error.statusCode,
      resource: error.resource,
      resourceId: error.resourceId,
      requestId: error.requestId,
    };
  }

  // If it's a standard Error object
  if (error instanceof Error) {
    return {
      message: error.message,
      // We don't know the category or code for standard errors
    };
  }

  // If it's a string
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  // If it's an object with an error property
  if (error && typeof error === 'object' && 'error' in error && error.error) {
    // Extract from error property recursively
    return getErrorDetails(error.error);
  }

  // If it's an object with a message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    const details: ErrorDetails = {
      message: error.message,
    };

    // Extract additional properties if present
    if ('code' in error && typeof error.code === 'string') {
      // Try to map the code to a MidazError code if possible
      const errorCode = Object.values(ErrorCode).find(
        (code) => code === error.code || code === (error.code as string).toLowerCase()
      );
      if (errorCode) {
        details.code = errorCode as ErrorCode;
      }
    }

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      details.statusCode = error.statusCode as number;
    }

    if ('resource' in error && typeof error.resource === 'string') {
      details.resource = error.resource as string;
    }

    if ('resourceId' in error && typeof error.resourceId === 'string') {
      details.resourceId = error.resourceId as string;
    }

    if ('requestId' in error && typeof error.requestId === 'string') {
      details.requestId = error.requestId as string;
    }

    return details;
  }

  // For unknown error formats
  return {
    message: 'Unknown error occurred',
  };
}

/**
 * Gets the HTTP status code from an error
 *
 * @param error - Error to extract status code from
 * @returns HTTP status code or undefined if not available
 */
export function getStatusCode(error: unknown): number | undefined {
  const details = getErrorDetails(error);
  return details.statusCode;
}

/**
 * Gets the error category from an error
 *
 * @param error - Error to extract category from
 * @returns Error category or undefined if not available
 */
export function getErrorCategory(error: unknown): ErrorCategory | undefined {
  if (isMidazError(error)) {
    return error.category;
  }

  const details = getErrorDetails(error);
  return details.category;
}
