/**
 * Error Handling Utility Example
 *
 * This example demonstrates how to use the error handling utilities from the Midaz SDK
 * to implement robust error handling with categorization and error types.
 */

import {
  ErrorCategory,
  ErrorCode,
  isNetworkError,
  isNotFoundError,
  isTimeoutError,
  isValidationError,
  MidazError,
} from '../src/util/error';

// Example 1: Basic Error Creation and Handling
function basicErrorHandlingExample() {
  console.log('\n=== Basic Error Handling Example ===');

  try {
    // Simulate an API call that fails
    throw new MidazError({
      message: 'Failed to fetch user data',
      code: ErrorCode.INTERNAL_ERROR, // Using a valid error code from the enum
      category: ErrorCategory.NETWORK,
      operation: 'getUserDetails',
      resource: 'user',
      resourceId: '123',
      statusCode: 503,
      requestId: 'req_abc123',
    });
  } catch (error) {
    if (error instanceof MidazError) {
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error category:', error.category);
      console.log('Operation:', error.operation);
      console.log('Resource:', error.resource);
      console.log('Resource ID:', error.resourceId);
      console.log('Status code:', error.statusCode);
      console.log('Request ID:', error.requestId);
      console.log('Error stack:', error.stack);
    } else {
      console.log('Unknown error:', error);
    }
  }
}

// Example 2: Error Type Checking
function errorTypeCheckingExample() {
  console.log('\n=== Error Type Checking Example ===');

  // Create a network error
  const networkError = new MidazError({
    message: 'Failed to connect to API server',
    code: ErrorCode.INTERNAL_ERROR, // Using a valid error code from the enum
    category: ErrorCategory.NETWORK,
    statusCode: 503,
  });

  // Create a timeout error
  const timeoutError = new MidazError({
    message: 'Request timed out after 30 seconds',
    code: ErrorCode.TIMEOUT, // Using a valid error code from the enum
    category: ErrorCategory.TIMEOUT,
    operation: 'fetchUserData',
  });

  // Create a not found error
  const notFoundError = new MidazError({
    message: 'User not found',
    code: ErrorCode.NOT_FOUND, // Using a valid error code from the enum
    category: ErrorCategory.NOT_FOUND,
    resource: 'user',
    resourceId: '123',
  });

  // Create a validation error
  const validationError = new MidazError({
    message: 'Invalid user data',
    code: ErrorCode.VALIDATION_ERROR, // Using a valid error code from the enum
    category: ErrorCategory.VALIDATION,
  });

  // Check error types using the utility functions
  console.log('networkError is NetworkError:', isNetworkError(networkError));
  console.log('timeoutError is TimeoutError:', isTimeoutError(timeoutError));
  console.log('notFoundError is NotFoundError:', isNotFoundError(notFoundError));
  console.log('validationError is ValidationError:', isValidationError(validationError));

  // Example of handling different error types
  function handleApiError(error: unknown) {
    if (isNetworkError(error)) {
      const networkErr = error as MidazError;
      console.log('Handling network error:', networkErr.message);
      console.log('Status code:', networkErr.statusCode);

      // Implement retry logic for network errors
      console.log('Retrying request...');
    } else if (isTimeoutError(error)) {
      const timeoutErr = error as MidazError;
      console.log('Handling timeout error:', timeoutErr.message);
      console.log('Operation:', timeoutErr.operation);

      // Implement timeout handling
      console.log('Retrying with increased timeout...');
    } else if (isNotFoundError(error)) {
      const notFoundErr = error as MidazError;
      console.log('Handling not found error:', notFoundErr.message);
      console.log('Resource:', notFoundErr.resource);
      console.log('Resource ID:', notFoundErr.resourceId);

      // Handle missing resource
      console.log('Showing resource not found message to user...');
    } else if (isValidationError(error)) {
      const validationErr = error as MidazError;
      console.log('Handling validation error:', validationErr.message);

      // Handle validation errors
      console.log('Showing validation error to user...');
    } else if (error instanceof MidazError) {
      console.log('Handling generic Midaz error:', error.message);
      console.log('Error category:', error.category);

      // Generic error handling
      console.log('Showing generic error message to user...');
    } else if (error instanceof Error) {
      console.log('Handling standard error:', error.message);

      // Standard error handling
      console.log('Logging error and showing generic message to user...');
    } else {
      console.log('Handling unknown error:', error);

      // Unknown error handling
      console.log('Logging unknown error and showing generic message to user...');
    }
  }

  console.log('\nDemonstrating error handling:');
  handleApiError(networkError);
  handleApiError(timeoutError);
  handleApiError(notFoundError);
  handleApiError(validationError);
  handleApiError(new Error('Standard error'));
  handleApiError('Unknown error');
}

// Example 3: Error Chains
function errorChainsExample() {
  console.log('\n=== Error Chains Example ===');

  try {
    // Simulate a chain of errors
    try {
      // Level 3 (deepest) - Database error
      throw new MidazError({
        message: 'Database query failed',
        code: ErrorCode.INTERNAL_ERROR,
        category: ErrorCategory.INTERNAL,
      });
    } catch (dbError) {
      // Level 2 - Repository layer error
      if (dbError instanceof Error) {
        throw new MidazError({
          message: 'Failed to fetch user from repository',
          code: ErrorCode.INTERNAL_ERROR,
          category: ErrorCategory.INTERNAL,
          cause: dbError,
        });
      }
      throw dbError;
    }
  } catch (repoError) {
    // Level 1 (top) - Service layer error
    if (repoError instanceof Error) {
      const serviceError = new MidazError({
        message: 'User service error',
        code: ErrorCode.INTERNAL_ERROR,
        category: ErrorCategory.INTERNAL,
        cause: repoError,
      });

      // Extract the error chain manually since we don't have a getErrorChain utility
      let currentError: Error | undefined = serviceError;
      const errorChain: Error[] = [];

      // TypeScript doesn't recognize the 'cause' property on Error by default
      // We need to use type assertion or check if the property exists
      while (currentError) {
        errorChain.push(currentError);
        // Check if cause exists and is an Error
        const errorWithCause = currentError as { cause?: unknown };
        currentError = errorWithCause.cause instanceof Error ? errorWithCause.cause : undefined;
      }

      console.log('Error chain length:', errorChain.length);
      console.log('Full error chain:');

      errorChain.forEach((err, index) => {
        console.log(`\nError ${index + 1}:`);
        if (err instanceof MidazError) {
          console.log(`- Message: ${err.message}`);
          console.log(`- Code: ${err.code}`);
          console.log(`- Category: ${err.category}`);
        } else {
          console.log(`- Message: ${err.message}`);
          console.log(`- Type: ${err.constructor.name}`);
        }
      });

      // Find the root cause
      const rootCause = errorChain[errorChain.length - 1];
      console.log('\nRoot cause:');
      console.log(`- Message: ${rootCause.message}`);
      if (rootCause instanceof MidazError) {
        console.log(`- Code: ${rootCause.code}`);
        console.log(`- Category: ${rootCause.category}`);
      }
    }
  }
}

// Run the examples
function runExamples() {
  try {
    basicErrorHandlingExample();
    errorTypeCheckingExample();
    errorChainsExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
// Note: In a pure TypeScript/ESM environment, this check is handled differently
// For Node.js execution:
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
}
