/**
 */

// Export all error handler functions
export * from './error-handler';

// Export all error types and interfaces
export * from './error-types';

// Export all error utility functions  
export * from './error-utils';

// Export compatibility functions for workflow example
export * from './enhanced-recovery-exports';

// Export enhanced error recovery
export * from './enhanced-error-recovery';

// Import necessary types for the additional functions
import { ErrorCategory, ErrorCode, MidazError } from './error-types';
import { 
  isMidazError
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