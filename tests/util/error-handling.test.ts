/**
 * @file Tests for error handling utilities
 */
import {
  processApiError,
  getUserFriendlyErrorMessage,
  isInsufficientFundsError,
  isDuplicateTransactionError,
  MidazError,
  ErrorCategory,
  ErrorCode
} from '../../src/util/error';
import { categorizeTransactionError } from '../../src/util/error';

describe('Error Handling Utilities', () => {
  describe('processApiError', () => {
    it('should process MidazError correctly', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        resource: 'account',
        resourceId: 'acc_123',
        statusCode: 400,
        requestId: 'req_456'
      });

      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: ErrorCategory.VALIDATION,
        message: 'Invalid input',
        resource: 'account',
        resourceId: 'acc_123',
        statusCode: 400,
        requestId: 'req_456',
        originalError: error
      });
    });

    it('should process standard Error correctly', () => {
      const error = new Error('Something went wrong');
      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: 'Error',
        message: 'Something went wrong',
        originalError: error
      });
    });

    it('should process Error with additional properties', () => {
      const error = new Error('API error');
      (error as any).statusCode = 500;
      (error as any).code = 'server_error';

      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: 'server_error',
        message: 'API error',
        statusCode: 500,
        originalError: error
      });
    });

    it('should process string error', () => {
      const error = 'Simple string error';
      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: 'unknown',
        message: 'Simple string error',
        originalError: error
      });
    });

    it('should process object error', () => {
      const error = {
        message: 'Object error',
        statusCode: 403,
        code: 'forbidden'
      };

      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: 'forbidden',
        message: 'Object error',
        statusCode: 403,
        originalError: error
      });
    });

    it('should process object with error property', () => {
      const error = {
        error: 'Error message in error property',
        status: 404
      };

      const processed = processApiError(error);

      expect(processed).toMatchObject({
        message: 'Error message in error property',
        statusCode: 404,
        originalError: error
      });
    });

    it('should handle unknown error types', () => {
      const error = null;
      const processed = processApiError(error);

      expect(processed).toMatchObject({
        type: 'unknown',
        message: 'An unknown error occurred',
        originalError: error
      });
    });

    it('should add specific handling for validation errors', () => {
      const validationDetails = { field: 'amount', message: 'Must be positive' };
      const originalError = new Error('Validation error');
      (originalError as any).details = validationDetails;
      
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        cause: originalError
      });

      const processed = processApiError(error);

      expect(processed.details).toEqual(validationDetails);
    });

    it('should customize message for not found errors', () => {
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
        resource: 'transaction',
        resourceId: 'tx_123'
      });

      const processed = processApiError(error);

      expect(processed.message).toBe('The requested transaction (tx_123) was not found');
    });

    it('should customize message for authentication errors', () => {
      const error = new MidazError({
        category: ErrorCategory.AUTHENTICATION,
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Auth failed'
      });

      const processed = processApiError(error);

      expect(processed.message).toBe('Authentication failed. Please check your API credentials');
    });

    it('should customize message for authorization errors', () => {
      const error = new MidazError({
        category: ErrorCategory.AUTHORIZATION,
        code: ErrorCode.PERMISSION_ERROR,
        message: 'Permission denied'
      });

      const processed = processApiError(error);

      expect(processed.message).toBe('You don\'t have permission to perform this operation');
    });

    it('should customize message for rate limit errors', () => {
      const error = new MidazError({
        category: ErrorCategory.LIMIT_EXCEEDED,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests'
      });

      const processed = processApiError(error);

      expect(processed.message).toBe('Rate limit exceeded. Please try again later');
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for validation errors', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Technical validation error message'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('The provided data is invalid. Please check your input and try again.');
    });

    it('should return the processed message for not found errors', () => {
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        resource: 'account',
        resourceId: 'acc_123'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('The requested account (acc_123) was not found');
    });

    it('should return user-friendly message for authentication errors', () => {
      const error = new MidazError({
        category: ErrorCategory.AUTHENTICATION,
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Authentication failed. Please check your credentials.');
    });

    it('should return user-friendly message for authorization errors', () => {
      const error = new MidazError({
        category: ErrorCategory.AUTHORIZATION,
        code: ErrorCode.PERMISSION_ERROR,
        message: 'Permission denied'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('You don\'t have permission to perform this action.');
    });

    it('should return user-friendly message for conflict errors', () => {
      const error = new MidazError({
        category: ErrorCategory.CONFLICT,
        code: ErrorCode.ALREADY_EXISTS,
        message: 'Resource already exists'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('This operation conflicts with the current state. The resource may have been modified.');
    });

    it('should return user-friendly message for rate limit errors', () => {
      const error = new MidazError({
        category: ErrorCategory.LIMIT_EXCEEDED,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should return user-friendly message for timeout errors', () => {
      const error = new MidazError({
        category: ErrorCategory.TIMEOUT,
        code: ErrorCode.TIMEOUT,
        message: 'Operation timed out'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('The operation timed out. Please try again.');
    });

    it('should return user-friendly message for network errors', () => {
      const error = new MidazError({
        category: ErrorCategory.NETWORK,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Network error'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Network error. Please check your connection and try again.');
    });

    it('should return user-friendly message for internal errors', () => {
      const error = new MidazError({
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('An internal server error occurred. Please try again later.');
    });

    it('should return specific message for insufficient funds in unprocessable errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Transaction failed due to insufficient balance'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Insufficient funds to complete this transaction.');
    });

    it('should return generic message for unprocessable errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Transaction failed'
      });

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('The request could not be processed. Please check your input.');
    });

    it('should return original message for unknown errors if short enough', () => {
      const error = new Error('Simple error message');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Simple error message');
    });

    it('should return generic message for unknown errors with long messages', () => {
      const longMessage = 'A'.repeat(101);
      const error = new Error(longMessage);

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('An unexpected error occurred. Please try again or contact support.');
    });
  });

  describe('categorizeTransactionError', () => {
    it('should categorize insufficient funds errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient funds for this transaction'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('insufficient_funds');
    });

    it('should categorize insufficient balance errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Account has insufficient balance'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('insufficient_funds');
    });

    it('should categorize frozen account errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.ACCOUNT_ELIGIBILITY_ERROR,
        message: 'Account is frozen and cannot process transactions'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('account_frozen');
    });

    it('should categorize inactive account errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.ACCOUNT_ELIGIBILITY_ERROR,
        message: 'Account is inactive'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('account_inactive');
    });

    it('should categorize duplicate transaction errors', () => {
      const error = new MidazError({
        category: ErrorCategory.CONFLICT,
        code: ErrorCode.IDEMPOTENCY_ERROR,
        message: 'Duplicate transaction with the same idempotency key'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('duplicate_transaction');
    });

    it('should categorize limit exceeded errors', () => {
      const error = new MidazError({
        category: ErrorCategory.LIMIT_EXCEEDED,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Transaction limit exceeded'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('limit_exceeded');
    });

    it('should categorize asset mismatch errors', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.ASSET_MISMATCH,
        message: 'Asset mismatch between accounts'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('asset_mismatch');
    });

    it('should categorize negative balance errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance would result in negative balance'
      });
      
      const category = categorizeTransactionError(error);
      
      expect(category).toBe('insufficient_funds');
    });

    it('should categorize validation errors as invalid transaction', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid transaction data'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('invalid_transaction');
    });

    it('should categorize not found errors as account not found', () => {
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Account not found'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('account_not_found');
    });

    it('should categorize authorization errors as unauthorized transaction', () => {
      const error = new MidazError({
        category: ErrorCategory.AUTHORIZATION,
        code: ErrorCode.PERMISSION_ERROR,
        message: 'Not authorized to create transactions'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('unauthorized_transaction');
    });

    it('should categorize unprocessable errors as transaction rejected', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Transaction rejected'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('transaction_rejected');
    });

    it('should categorize other errors as transaction failed', () => {
      const error = new MidazError({
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error'
      });

      const category = categorizeTransactionError(error);

      expect(category).toBe('transaction_failed');
    });
  });

  describe('isInsufficientFundsError', () => {
    it('should return true for insufficient funds errors', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient funds for this transaction'
      });

      const result = isInsufficientFundsError(error);

      expect(result).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid transaction data'
      });

      const result = isInsufficientFundsError(error);

      expect(result).toBe(false);
    });
  });

  describe('isDuplicateTransactionError', () => {
    it('should return true for duplicate transaction errors', () => {
      const error = new MidazError({
        category: ErrorCategory.CONFLICT,
        code: ErrorCode.IDEMPOTENCY_ERROR,
        message: 'Duplicate transaction with the same idempotency key'
      });

      const result = isDuplicateTransactionError(error);

      expect(result).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid transaction data'
      });

      const result = isDuplicateTransactionError(error);

      expect(result).toBe(false);
    });
  });
});
