/**
 * @file Error utilities barrel file
 * @description Exports all error-related utilities from consolidated error handling system
 */

// Export all error types and interfaces
export * from './error-types';

// Export all error utility functions  
export * from './error-utils';

// Export all error handler functions
export * from './error-handler';

// Import necessary types for the additional functions
import { ErrorCategory, ErrorCode, MidazError } from './error-types';
import { 
  isMidazError, 
  newValidationError 
} from './error-utils';

/**
 * Checks if an error is a cancellation error
 */
export const isCancellationError = (error: unknown): boolean => {
  return isMidazError(error) && error.category === ErrorCategory.CANCELLATION;
};

/**
 * Creates a cancellation error
 */
export const newCancellationError = (message = 'Operation cancelled', params = {}): MidazError => {
  return new MidazError({
    message,
    category: ErrorCategory.CANCELLATION,
    code: ErrorCode.CANCELLED,
    ...params
  });
};