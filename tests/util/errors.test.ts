/**
 * @file Tests for error utilities
 * @description Tests for the error handling functions in the util/errors.ts file
 */

import {
  categorizeTransactionError,
  ErrorCategory,
  ErrorCode,
  errorFromHttpResponse,
  formatErrorForDisplay,
  formatTransactionError,
  getErrorCategory,
  getErrorDetails,
  getStatusCode,
  isAccountEligibilityError,
  isAssetMismatchError,
  isAuthenticationError,
  isAuthorizationError,
  isCancellationError,
  isConflictError,
  isInsufficientBalanceError,
  isInternalError,
  isMidazError,
  isNetworkError,
  isNotFoundError,
  isRateLimitError,
  isTimeoutError,
  isValidationError,
  MidazError,
  newAccountEligibilityError,
  newAssetMismatchError,
  newAuthenticationError,
  newAuthorizationError,
  newCancellationError,
  newConflictError,
  newInsufficientBalanceError,
  newInternalError,
  newInvalidInputError,
  newMissingParameterError,
  newNetworkError,
  newNotFoundError,
  newRateLimitError,
  newTimeoutError,
  newUnprocessableError,
  newValidationError,
} from '../../src/util/error';

describe('Error Utilities', () => {
  // Test 1: MidazError class
  describe('MidazError', () => {
    it('should create a MidazError with required properties', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
      });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof MidazError).toBe(true);
    });

    it('should create a MidazError with all properties', () => {
      const originalError = new Error('Original error');
      const error = new MidazError({
        category: ErrorCategory.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        operation: 'getAccount',
        resource: 'account',
        resourceId: 'acc_123',
        statusCode: 404,
        requestId: 'req_123',
        cause: originalError,
      });

      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.operation).toBe('getAccount');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.statusCode).toBe(404);
      expect(error.requestId).toBe('req_123');
      expect(error.cause).toBe(originalError);
    });

    it('should preserve the stack trace', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
      });

      expect(error.stack).toBeDefined();
      expect(error.stack!.includes('MidazError')).toBe(true);
    });
  });

  // Test 2: Error factory functions
  describe('Error Factory Functions', () => {
    it('should create a validation error', () => {
      const error = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('createAccount');
    });

    it('should create an invalid input error', () => {
      const error = newValidationError('Invalid input', { operation: 'createAccount' });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.operation).toBe('createAccount');
    });

    it('should create a missing parameter error', () => {
      const error = newMissingParameterError('name', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toContain('name');
      expect(error.operation).toBe('createAccount');
    });

    it('should create a not found error', () => {
      const error = newNotFoundError('account', 'acc_123', {
        operation: 'getAccount',
      });

      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toContain('account');
      expect(error.message).toContain('acc_123');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('getAccount');
    });

    it('should create an authentication error', () => {
      const error = newAuthenticationError('Invalid credentials', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'getAccount',
      });

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.message).toBe('Invalid credentials');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('getAccount');
    });

    it('should create an authorization error', () => {
      const error = newAuthorizationError('Insufficient permissions', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'getAccount',
      });

      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.code).toBe(ErrorCode.PERMISSION_ERROR);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('getAccount');
    });

    it('should create a conflict error', () => {
      const error = newConflictError('Resource already exists', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.code).toBe(ErrorCode.ALREADY_EXISTS);
      expect(error.message).toBe('Resource already exists');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('createAccount');
    });

    it('should create a rate limit error', () => {
      const error = newRateLimitError('Rate limit exceeded');

      expect(error.category).toBe(ErrorCategory.LIMIT_EXCEEDED);
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.operation).toBeUndefined();
    });

    it('should create a timeout error', () => {
      const error = newTimeoutError('Operation timed out', { operation: 'getAccount' });

      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.message).toBe('Operation timed out');
      expect(error.operation).toBe('getAccount');
    });

    it('should create a cancellation error', () => {
      const error = newCancellationError('Operation cancelled', {
        operation: 'processTransaction',
      });

      expect(error.category).toBe(ErrorCategory.CANCELLATION);
      expect(error.code).toBe(ErrorCode.CANCELLED);
      expect(error.message).toBe('Operation cancelled');
      expect(error.operation).toBe('processTransaction');
    });

    it('should create a network error', () => {
      const error = newNetworkError('Network error occurred', { operation: 'getAccount' });

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Network error occurred');
      expect(error.operation).toBe('getAccount');
    });

    it('should create an internal error', () => {
      const error = newInternalError('Internal error occurred', {
        operation: 'processTransaction',
      });

      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Internal error occurred');
      expect(error.operation).toBe('processTransaction');
    });

    it('should create an unprocessable error', () => {
      const error = newUnprocessableError('Cannot process transaction', {
        resource: 'transaction',
        resourceId: 'tx_123',
        operation: 'processTransaction',
      });

      expect(error.category).toBe(ErrorCategory.UNPROCESSABLE);
      expect(error.message).toBe('Cannot process transaction');
      expect(error.resource).toBe('transaction');
      expect(error.resourceId).toBe('tx_123');
      expect(error.operation).toBe('processTransaction');
    });

    it('should create an insufficient balance error', () => {
      const error = newInsufficientBalanceError('Insufficient balance', {
        accountId: 'acc_123',
        assetCode: 'USD',
        operation: 'createTransaction',
      });

      expect(error.category).toBe(ErrorCategory.UNPROCESSABLE);
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(error.message).toBe('Insufficient balance');
      expect(error.operation).toBe('createTransaction');
    });

    it('should create an asset mismatch error', () => {
      const error = newAssetMismatchError('Asset mismatch', {
        expectedAsset: 'USD',
        actualAsset: 'EUR',
        operation: 'transfer',
      });

      expect(error.category).toBe(ErrorCategory.UNPROCESSABLE);
      expect(error.code).toBe(ErrorCode.ASSET_MISMATCH);
      expect(error.message).toBe('Asset mismatch: expected USD, got EUR');
      expect(error.operation).toBe('transfer');
    });

    it('should create an account eligibility error', () => {
      const error = newAccountEligibilityError('Account not eligible', {
        accountId: 'acc_123',
        operation: 'transfer',
      });

      expect(error.category).toBe(ErrorCategory.UNPROCESSABLE);
      expect(error.code).toBe(ErrorCode.ACCOUNT_ELIGIBILITY_ERROR);
      expect(error.message).toBe('Account not eligible');
      expect(error.operation).toBe('transfer');
    });
  });

  // Test 3: Error type checking functions
  describe('Error Type Checking Functions', () => {
    it('should identify MidazError', () => {
      const error = new MidazError({
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
      });
      const standardError = new Error('Standard error');

      expect(isMidazError(error)).toBe(true);
      expect(isMidazError(standardError)).toBe(false);
      expect(isMidazError(null)).toBe(false);
      expect(isMidazError(undefined)).toBe(false);
      expect(isMidazError('string')).toBe(false);
    });

    it('should identify validation errors', () => {
      const error = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });
      const notFoundError = newNotFoundError('account', 'acc_123', {
        operation: 'getAccount',
      });

      expect(isValidationError(error)).toBe(true);
      expect(isValidationError(notFoundError)).toBe(false);
    });

    it('should identify not found errors', () => {
      const error = newNotFoundError('account', 'acc_123', {
        operation: 'getAccount',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isNotFoundError(error)).toBe(true);
      expect(isNotFoundError(validationError)).toBe(false);
    });

    it('should identify authentication errors', () => {
      const error = newAuthenticationError('Invalid credentials', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'getAccount',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isAuthenticationError(error)).toBe(true);
      expect(isAuthenticationError(validationError)).toBe(false);
    });

    it('should identify authorization errors', () => {
      const error = newAuthorizationError('Insufficient permissions', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'getAccount',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isAuthorizationError(error)).toBe(true);
      expect(isAuthorizationError(validationError)).toBe(false);
    });

    it('should identify conflict errors', () => {
      const error = newConflictError('Resource already exists', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isConflictError(error)).toBe(true);
      expect(isConflictError(validationError)).toBe(false);
    });

    it('should identify rate limit errors', () => {
      const error = newRateLimitError('Rate limit exceeded');
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isRateLimitError(error)).toBe(true);
      expect(isRateLimitError(validationError)).toBe(false);
    });

    it('should identify timeout errors', () => {
      const error = newTimeoutError('Operation timed out', { operation: 'getAccount' });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isTimeoutError(error)).toBe(true);
      expect(isTimeoutError(validationError)).toBe(false);
    });

    it('should identify cancellation errors', () => {
      const error = newCancellationError('Operation cancelled', {
        operation: 'processTransaction',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isCancellationError(error)).toBe(true);
      expect(isCancellationError(validationError)).toBe(false);
    });

    it('should identify network errors', () => {
      const error = newNetworkError('Network error occurred', { operation: 'getAccount' });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isNetworkError(error)).toBe(true);
      expect(isNetworkError(validationError)).toBe(false);
    });

    it('should identify internal errors', () => {
      const error = newInternalError('Internal error occurred', {
        operation: 'processTransaction',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isInternalError(error)).toBe(true);
      expect(isInternalError(validationError)).toBe(false);
    });

    it('should identify insufficient balance errors', () => {
      const error = newInsufficientBalanceError('Insufficient balance', {
        accountId: 'acc_123',
        assetCode: 'USD',
        operation: 'createTransaction',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isInsufficientBalanceError(error)).toBe(true);
      expect(isInsufficientBalanceError(validationError)).toBe(false);
    });

    it('should identify account eligibility errors', () => {
      const error = newAccountEligibilityError('Account not eligible', {
        accountId: 'acc_123',
        operation: 'transfer',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isAccountEligibilityError(error)).toBe(true);
      expect(isAccountEligibilityError(validationError)).toBe(false);
    });

    it('should identify asset mismatch errors', () => {
      const error = newAssetMismatchError('Asset mismatch', {
        expectedAsset: 'USD',
        actualAsset: 'EUR',
        operation: 'transfer',
      });
      const validationError = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(isAssetMismatchError(error)).toBe(true);
      expect(isAssetMismatchError(validationError)).toBe(false);
    });
  });

  // Test 4: Error utility functions
  describe('Error Utility Functions', () => {
    it('should get error details from MidazError', () => {
      const error = newNotFoundError('account', 'acc_123', {
        operation: 'getAccount',
      });
      const details = getErrorDetails(error);

      expect(details.message).toBe(error.message);
      expect(details.category).toBe(error.category);
      expect(details.code).toBe(error.code);
      expect(details.statusCode).toBe(error.statusCode);
    });

    it('should get error details from standard Error', () => {
      const error = new Error('Standard error');
      const details = getErrorDetails(error);

      expect(details.message).toBe('Standard error');
      expect(details.category).toBeUndefined();
      expect(details.code).toBeUndefined();
      expect(details.statusCode).toBeUndefined();
    });

    it('should get error details from object with message', () => {
      const error = { message: 'Object error' };
      const details = getErrorDetails(error);

      expect(details.message).toBe('Object error');
      expect(details.category).toBeUndefined();
      expect(details.code).toBeUndefined();
      expect(details.statusCode).toBeUndefined();
    });

    it('should get error details from string', () => {
      const details = getErrorDetails('String error');

      expect(details.message).toBe('String error');
      expect(details.category).toBeUndefined();
      expect(details.code).toBeUndefined();
      expect(details.statusCode).toBeUndefined();
    });

    it('should get status code from MidazError', () => {
      const error = newNotFoundError('account', 'acc_123', {
        operation: 'getAccount',
      });

      expect(getStatusCode(error)).toBe(404);
    });

    it('should get default status code from standard Error', () => {
      const error = new Error('Standard error');

      expect(getStatusCode(error)).toBeUndefined();
    });

    it('should get error category from MidazError', () => {
      const error = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });

      expect(getErrorCategory(error)).toBe(ErrorCategory.VALIDATION);
    });

    it('should get undefined category from standard Error', () => {
      const error = new Error('Standard error');

      expect(getErrorCategory(error)).toBeUndefined();
    });

    it('should format error for display', () => {
      const error = newValidationError('Invalid input', {
        resource: 'account',
        resourceId: 'acc_123',
        operation: 'createAccount',
      });
      const formatted = formatErrorForDisplay(error);

      expect(formatted).toContain('Invalid input');
    });

    it('should format transaction error', () => {
      const error = newInsufficientBalanceError('Insufficient balance', {
        accountId: 'acc_123',
        assetCode: 'USD',
        operation: 'transfer',
      });
      const formatted = formatTransactionError(error, {
        accountId: 'acc_123',
        assetCode: 'USD',
        amount: '100.00',
      });

      expect(formatted).toContain('Insufficient balance');
    });

    it('should categorize transaction error', () => {
      const error = new MidazError({
        category: ErrorCategory.UNPROCESSABLE,
        code: ErrorCode.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance for transaction',
      });
      const category = categorizeTransactionError(error);

      expect(category).toBe('insufficient_funds');
    });
  });

  // Test 5: HTTP response to error mapping
  describe('HTTP Response Error Mapping', () => {
    it('should map 400 status code to validation error', () => {
      const error = errorFromHttpResponse(
        400,
        {
          message: 'Invalid input',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'createAccount',
        },
        'POST',
        '/accounts'
      );

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input (POST /accounts)');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('createAccount');
    });

    it('should map 401 status code to authentication error', () => {
      const error = errorFromHttpResponse(
        401,
        {
          message: 'Invalid credentials',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'getAccount',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.message).toBe('Invalid credentials (GET /accounts/acc_123)');
      expect(error.resource).toBeUndefined();
      expect(error.resourceId).toBeUndefined();
      expect(error.operation).toBeUndefined();
    });

    it('should map 403 status code to authorization error', () => {
      const error = errorFromHttpResponse(
        403,
        {
          message: 'Insufficient permissions',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'getAccount',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.code).toBe(ErrorCode.PERMISSION_ERROR);
      expect(error.message).toBe('Insufficient permissions (GET /accounts/acc_123)');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('getAccount');
    });

    it('should map 404 status code to not found error', () => {
      const error = errorFromHttpResponse(
        404,
        {
          message: 'Resource not found',
          resource: 'account',
          resourceId: 'acc_123',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found (GET /accounts/acc_123)');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
    });

    it('should map 409 status code to conflict error', () => {
      const error = errorFromHttpResponse(
        409,
        {
          message: 'Resource already exists',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'createAccount',
        },
        'POST',
        '/accounts'
      );

      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.code).toBe(ErrorCode.ALREADY_EXISTS);
      expect(error.message).toBe('Resource already exists (POST /accounts)');
      expect(error.resource).toBe('account');
      expect(error.resourceId).toBe('acc_123');
      expect(error.operation).toBe('createAccount');
    });

    it('should map 429 status code to rate limit exceeded error', () => {
      const error = errorFromHttpResponse(
        429,
        {
          message: 'Rate limit exceeded',
          resource: 'account',
          resourceId: 'acc_123',
        },
        'GET',
        '/accounts'
      );

      expect(error.category).toBe(ErrorCategory.LIMIT_EXCEEDED);
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.message).toBe('Rate limit exceeded (GET /accounts)');
    });

    it('should map 500 status code to internal error', () => {
      const error = errorFromHttpResponse(
        500,
        {
          message: 'Internal server error',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'getAccount',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Internal server error (GET /accounts/acc_123)');
      expect(error.operation).toBe('getAccount');
    });

    it('should map 504 status code to timeout error', () => {
      const error = errorFromHttpResponse(
        504,
        {
          message: 'Gateway timeout',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'getAccount',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.message).toBe('Gateway timeout (GET /accounts/acc_123)');
      expect(error.operation).toBe('getAccount');
    });

    it('should map unknown status code to generic error', () => {
      const error = errorFromHttpResponse(
        599,
        {
          message: 'Unknown error',
          resource: 'account',
          resourceId: 'acc_123',
          operation: 'getAccount',
        },
        'GET',
        '/accounts/acc_123'
      );

      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Unknown error (GET /accounts/acc_123)');
      expect(error.operation).toBe('getAccount');
    });
  });
});
