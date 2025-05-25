/**
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
 * Transaction error categories
 *
 * Specific error types for financial transactions
 */
export enum TransactionErrorCategory {
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  ACCOUNT_FROZEN = 'account_frozen',
  ACCOUNT_INACTIVE = 'account_inactive',
  ASSET_MISMATCH = 'asset_mismatch',
  NEGATIVE_BALANCE = 'negative_balance',
  LIMIT_EXCEEDED = 'limit_exceeded',
  INVALID_TRANSACTION = 'invalid_transaction',
  ACCOUNT_NOT_FOUND = 'account_not_found',
  UNAUTHORIZED_TRANSACTION = 'unauthorized_transaction',
  TRANSACTION_REJECTED = 'transaction_rejected',
  TRANSACTION_FAILED = 'transaction_failed',
  CURRENCY_CONVERSION_ERROR = 'currency_conversion_error',
  ACCOUNT_INELIGIBLE = 'account_ineligible',
}

// For backward compatibility
export type TransactionErrorType = TransactionErrorCategory;
export const TransactionErrorType = TransactionErrorCategory;

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

    // Maintains proper stack trace in V8 engines (Node.js only)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, MidazError);
    }
  }
}

/**
 * Enhanced error information with all data needed for error handling
 */
export interface EnhancedErrorInfo {
  /** Error type or category */
  type: string;

  /** Error code if available */
  code?: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code if available */
  statusCode?: number;

  /** Original error object */
  originalError: unknown;

  /** Additional error details if available */
  details?: any;

  /** Resource type involved in the error */
  resource?: string;

  /** Resource ID involved in the error */
  resourceId?: string;

  /** Request ID if available */
  requestId?: string;

  /** Transaction-specific error classification */
  transactionErrorType?: TransactionErrorCategory;

  /** Error recovery recommendation */
  recoveryRecommendation?: string;

  /** UI-friendly error message */
  userMessage: string;

  /** Technical error details for logging */
  technicalDetails: string;

  /** Whether the error is retryable */
  isRetryable: boolean;

  /** Whether to show this error to the end user */
  shouldShowUser: boolean;

  /** Type of operation that was being performed (added for enhanced error recovery) */
  operationType?: string;

  /** Number of recovery attempts made (added for enhanced error recovery) */
  recoveryAttempts?: number;

  /** Whether this was a network error (added for enhanced error recovery) */
  isNetworkError?: boolean;

  /** Detailed diagnostics about the error (added for enhanced error recovery) */
  diagnostics?: string;

  /** Steps taken during recovery process (added for enhanced error recovery) */
  recoverySteps?: string[];
}

/**
 * Error recovery strategy options
 */
export interface ErrorRecoveryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds before retrying */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number;
  /** Multiplier to apply to delay after each retry */
  backoffFactor?: number;
  /** Optional custom backoff strategy function */
  backoffStrategy?: (
    attempt: number,
    initialDelay: number,
    options: ErrorRecoveryOptions
  ) => number;
  /** Custom function to determine if an error is retryable */
  retryCondition?: (error: unknown) => boolean;
  /** Optional callback to run before each retry attempt */
  onRetry?: (error: unknown, attempt: number) => void | Promise<void>;
  /** Optional callback when retry attempts are exhausted */
  onExhausted?: (error: unknown, attempts: number) => void | Promise<void>;
}

/**
 * Type for operation execution result with status
 */
export interface OperationResult<T> {
  /** Operation result, null if failed */
  result: T | null;
  /** Operation status */
  status: 'success' | 'duplicate' | 'failed' | 'retried';
  /** Enhanced error information if failed */
  error?: EnhancedErrorInfo;
  /** Number of attempts made */
  attempts?: number;
}

/**
 * Error handling options
 */
export interface ErrorHandlerOptions {
  /** Whether to display errors to the user */
  displayErrors?: boolean;

  /** Function to display errors to the user */
  displayFn?: (message: string) => void;

  /** Whether to log errors */
  logErrors?: boolean;

  /** Log level for error logging */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** Whether to rethrow errors after handling */
  rethrow?: boolean;

  /** Default return value when not rethrowing errors */
  defaultReturnValue?: any;

  /** Custom error message formatter */
  formatMessage?: (errorInfo: EnhancedErrorInfo) => string;

  /** Whether to include stack traces in logs */
  includeStackTrace?: boolean;
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
