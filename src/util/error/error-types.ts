/**
 * @file Error types for the Midaz SDK
 * @description Defines error categories, codes, and the base MidazError class
 */

/**
 * Error categories for Midaz API errors
 *
 * These categories group errors by their general type and help with error handling strategies.
 */
export enum ErrorCategory {
  /** Validation errors occur when input data fails validation rules */
  VALIDATION = 'validation',

  /** Authentication errors occur when credentials are invalid or missing */
  AUTHENTICATION = 'authentication',

  /** Authorization errors occur when the user lacks permission for an operation */
  AUTHORIZATION = 'authorization',

  /** Not found errors occur when a requested resource doesn't exist */
  NOT_FOUND = 'not_found',

  /** Conflict errors occur when an operation conflicts with the current state */
  CONFLICT = 'conflict',

  /** Limit exceeded errors occur when a rate limit or quota is exceeded */
  LIMIT_EXCEEDED = 'limit_exceeded',

  /** Timeout errors occur when an operation takes too long to complete */
  TIMEOUT = 'timeout',

  /** Cancellation errors occur when an operation is cancelled */
  CANCELLATION = 'cancellation',

  /** Network errors occur when there's a problem with the network connection */
  NETWORK = 'network',

  /** Internal errors occur when there's an unexpected problem with the API */
  INTERNAL = 'internal',

  /** Unprocessable errors occur when a request is valid but cannot be processed */
  UNPROCESSABLE = 'unprocessable',
}

/**
 * Error codes for Midaz API errors
 *
 * These specific error codes provide detailed information about what went wrong.
 */
export enum ErrorCode {
  /** Validation error for invalid input data */
  VALIDATION_ERROR = 'validation_error',

  /** Resource not found error */
  NOT_FOUND = 'not_found',

  /** Resource already exists error */
  ALREADY_EXISTS = 'already_exists',

  /** Authentication error for invalid credentials */
  AUTHENTICATION_ERROR = 'authentication_error',

  /** Permission error for insufficient access rights */
  PERMISSION_ERROR = 'permission_error',

  /** Insufficient balance error for financial operations */
  INSUFFICIENT_BALANCE = 'insufficient_balance',

  /** Account eligibility error when an account cannot participate in an operation */
  ACCOUNT_ELIGIBILITY_ERROR = 'account_eligibility_error',

  /** Asset mismatch error when incompatible assets are used */
  ASSET_MISMATCH = 'asset_mismatch',

  /** Idempotency error when a duplicate operation is detected */
  IDEMPOTENCY_ERROR = 'idempotency_error',

  /** Rate limit exceeded error */
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  /** Timeout error for operations that take too long */
  TIMEOUT = 'timeout',

  /** Cancelled error for operations that were cancelled */
  CANCELLED = 'cancelled',

  /** Internal error for unexpected server problems */
  INTERNAL_ERROR = 'internal_error',
}

/**
 * Base error class for all Midaz SDK errors
 *
 * This class extends the standard Error class with additional properties
 * specific to the Midaz API, making error handling more consistent and informative.
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation that might fail
 *   await client.entities.accounts.get('non-existent-id');
 * } catch (error) {
 *   if (error instanceof MidazError) {
 *     console.error(`Midaz error: ${error.category}/${error.code}`);
 *     console.error(`Message: ${error.message}`);
 *     if (error.resource && error.resourceId) {
 *       console.error(`Resource: ${error.resource} ${error.resourceId}`);
 *     }
 *   } else {
 *     console.error('Unknown error:', error);
 *   }
 * }
 * ```
 */
export class MidazError extends Error {
  /**
   * Error category
   * Provides a high-level classification of the error
   */
  public readonly category: ErrorCategory;

  /**
   * Error code
   * Provides a specific error type within the category
   */
  public readonly code: ErrorCode;

  /**
   * Error message
   * Human-readable description of the error
   */
  public readonly message: string;

  /**
   * Operation that was being performed
   * The API operation or method that failed
   */
  public readonly operation?: string;

  /**
   * Resource type involved
   * The type of resource that was being accessed (e.g., 'account', 'transaction')
   */
  public readonly resource?: string;

  /**
   * Resource ID involved
   * The specific ID of the resource that was being accessed
   */
  public readonly resourceId?: string;

  /**
   * HTTP status code
   * The HTTP status code returned by the API, if applicable
   */
  public readonly statusCode?: number;

  /**
   * API request ID
   * A unique identifier for the API request, useful for troubleshooting with support
   */
  public readonly requestId?: string;

  /**
   * Original error
   * The underlying error that caused this error, if applicable
   */
  public readonly cause?: Error;

  /**
   * Creates a new MidazError
   *
   * @param params - Error parameters
   * @param params.category - Error category
   * @param params.code - Error code
   * @param params.message - Error message
   * @param params.operation - Operation that was being performed
   * @param params.resource - Resource type involved
   * @param params.resourceId - Resource ID involved
   * @param params.statusCode - HTTP status code
   * @param params.requestId - API request ID
   * @param params.cause - Cause of the error
   */
  constructor(params: {
    category: ErrorCategory;
    code: ErrorCode;
    message: string;
    operation?: string;
    resource?: string;
    resourceId?: string;
    statusCode?: number;
    requestId?: string;
    cause?: Error;
  }) {
    super(params.message);
    this.category = params.category;
    this.code = params.code;
    this.message = params.message;
    this.operation = params.operation;
    this.resource = params.resource;
    this.resourceId = params.resourceId;
    this.statusCode = params.statusCode;
    this.requestId = params.requestId;
    this.cause = params.cause;

    // Ensure the name property is set correctly
    this.name = 'MidazError';

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MidazError);
    }
  }
}

/**
 * Detailed error information
 *
 * A standardized structure for error details, used for consistent error handling.
 */
export interface ErrorDetails {
  /** Error message */
  message: string;
  /** Error category */
  category?: ErrorCategory;
  /** Error code */
  code?: ErrorCode;
  /** HTTP status code */
  statusCode?: number;
  /** Resource type */
  resource?: string;
  /** Resource ID */
  resourceId?: string;
  /** Request ID for debugging */
  requestId?: string;
}

/**
 * Standard error templates
 *
 * Pre-configured error instances for common error types
 */
export const standardErrors = {
  validation: {
    invalidInput: {
      category: ErrorCategory.VALIDATION,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid input provided',
    },
    missingParameter: {
      category: ErrorCategory.VALIDATION,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Required parameter is missing',
    },
    invalidFormat: {
      category: ErrorCategory.VALIDATION,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid format',
    },
  },
  authentication: {
    invalidCredentials: {
      category: ErrorCategory.AUTHENTICATION,
      code: ErrorCode.AUTHENTICATION_ERROR,
      message: 'Invalid credentials provided',
    },
    missingCredentials: {
      category: ErrorCategory.AUTHENTICATION,
      code: ErrorCode.AUTHENTICATION_ERROR,
      message: 'Authentication credentials are missing',
    },
    tokenExpired: {
      category: ErrorCategory.AUTHENTICATION,
      code: ErrorCode.AUTHENTICATION_ERROR,
      message: 'Authentication token has expired',
    },
  },
  authorization: {
    accessDenied: {
      category: ErrorCategory.AUTHORIZATION,
      code: ErrorCode.PERMISSION_ERROR,
      message: 'Access denied',
    },
    insufficientPermissions: {
      category: ErrorCategory.AUTHORIZATION,
      code: ErrorCode.PERMISSION_ERROR,
      message: 'Insufficient permissions',
    },
  },
  notFound: {
    resourceNotFound: {
      category: ErrorCategory.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
    },
  },
  conflict: {
    resourceExists: {
      category: ErrorCategory.CONFLICT,
      code: ErrorCode.ALREADY_EXISTS,
      message: 'Resource already exists',
    },
    idempotencyKey: {
      category: ErrorCategory.CONFLICT,
      code: ErrorCode.IDEMPOTENCY_ERROR,
      message: 'Operation already processed with given idempotency key',
    },
  },
  rateLimit: {
    exceeded: {
      category: ErrorCategory.LIMIT_EXCEEDED,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Rate limit exceeded',
    },
  },
  timeout: {
    requestTimeout: {
      category: ErrorCategory.TIMEOUT,
      code: ErrorCode.TIMEOUT,
      message: 'Request timed out',
    },
  },
  network: {
    connectionError: {
      category: ErrorCategory.NETWORK,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Network connection error',
    },
  },
  internal: {
    serverError: {
      category: ErrorCategory.INTERNAL,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    },
    serviceUnavailable: {
      category: ErrorCategory.INTERNAL,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Service temporarily unavailable',
    },
  },
};
