/**
 * Constants for the Midaz SDK
 *
 * This file contains all the constant values used throughout the SDK,
 * including status codes, defaults, and configuration values.
 */

/**
 * Transaction status constants define the possible states of a transaction in the Midaz system.
 * These constants are used throughout the SDK to represent transaction statuses in a consistent way.
 *
 * Transaction Lifecycle:
 * 1. A transaction is created with status "pending" if it requires explicit commitment
 * 2. When committed, the transaction transitions to "completed"
 * 3. If issues occur, the transaction may transition to "failed"
 * 4. A pending transaction can be cancelled, transitioning to "cancelled"
 */
export const TransactionStatus = {
  /** Represents a transaction that is not yet completed */
  PENDING: 'pending',
  /** Represents a successfully completed transaction */
  COMPLETED: 'completed',
  /** Represents a transaction that failed to process */
  FAILED: 'failed',
  /** Represents a transaction that was cancelled */
  CANCELLED: 'cancelled',
} as const;

export type TransactionStatusType = (typeof TransactionStatus)[keyof typeof TransactionStatus];

/**
 * Account status constants define the possible states of an account in the Midaz system.
 * These constants are used throughout the SDK to represent account statuses in a consistent way.
 */
export const AccountStatus = {
  /** Represents an active resource that can be used normally */
  ACTIVE: 'ACTIVE',
  /** Represents a temporarily inactive resource */
  INACTIVE: 'INACTIVE',
  /** Represents a resource awaiting activation or approval */
  PENDING: 'PENDING',
  /** Represents a permanently closed resource */
  CLOSED: 'CLOSED',
} as const;

export type AccountStatusType = (typeof AccountStatus)[keyof typeof AccountStatus];

/**
 * Asset status constants define the possible states of an asset in the Midaz system.
 */
export const AssetStatus = {
  /** Represents an active asset that can be used in transactions */
  ACTIVE: 'ACTIVE',
  /** Represents an inactive asset that cannot be used in transactions */
  INACTIVE: 'INACTIVE',
} as const;

export type AssetStatusType = (typeof AssetStatus)[keyof typeof AssetStatus];

/**
 * Sort direction constants for ordering results in list operations.
 */
export const SortDirection = {
  /** Ascending sort order (A→Z, 0→9) */
  ASC: 'asc',
  /** Descending sort order (Z→A, 9→0) */
  DESC: 'desc',
} as const;

export type SortDirectionType = (typeof SortDirection)[keyof typeof SortDirection];

/**
 * Pagination defaults contain default values for pagination parameters.
 * These constants define the standard default behavior for list operations.
 */
export const PaginationDefaults = {
  /** Default number of items to return per page */
  DEFAULT_LIMIT: 10,
  /** Maximum number of items that can be requested per page */
  MAX_LIMIT: 100,
  /** Default starting position for pagination */
  DEFAULT_OFFSET: 0,
  /** Default page number for backward compatibility */
  DEFAULT_PAGE: 1,
  /** Default sort direction */
  DEFAULT_SORT_DIRECTION: SortDirection.DESC,
} as const;

/**
 * Query parameter names used for API requests.
 * These constants ensure consistent parameter naming across all SDK operations.
 */
export const QueryParamNames = {
  /** Query parameter name for limit */
  LIMIT: 'limit',
  /** Query parameter name for offset */
  OFFSET: 'offset',
  /** Query parameter name for page (backward compatibility) */
  PAGE: 'page',
  /** Query parameter name for cursor */
  CURSOR: 'cursor',
  /** Query parameter name for the field to order by */
  ORDER_BY: 'orderBy',
  /** Query parameter name for sort direction */
  ORDER_DIRECTION: 'orderDirection',
  /** Query parameter name for start date */
  START_DATE: 'startDate',
  /** Query parameter name for end date */
  END_DATE: 'endDate',
} as const;

/**
 * Operation type constants for transaction operations.
 */
export const OperationType = {
  /** Represents a debit operation (decreases account balance) */
  DEBIT: 'DEBIT',
  /** Represents a credit operation (increases account balance) */
  CREDIT: 'CREDIT',
} as const;

export type OperationTypeType = (typeof OperationType)[keyof typeof OperationType];

/**
 * Account type constants for different types of accounts.
 */
export const AccountTypeConstants = {
  /** Deposit account type */
  DEPOSIT: 'deposit',
  /** Savings account type */
  SAVINGS: 'savings',
  /** Loans account type */
  LOANS: 'loans',
  /** Marketplace account type */
  MARKETPLACE: 'marketplace',
  /** Credit card account type */
  CREDITCARD: 'creditcard',
  /** Investment account type */
  INVESTMENT: 'investment',
  /** External account type */
  EXTERNAL: 'external',
} as const;

export type AccountTypeConstantsType =
  (typeof AccountTypeConstants)[keyof typeof AccountTypeConstants];

/**
 * Route operation type constants for operation routes.
 */
export const RouteOperationType = {
  /** Source operation type */
  SOURCE: 'source',
  /** Destination operation type */
  DESTINATION: 'destination',
} as const;

export type RouteOperationTypeType = (typeof RouteOperationType)[keyof typeof RouteOperationType];

/**
 * Rule type constants for operation routes.
 */
export const RuleType = {
  /** Account type rule */
  ACCOUNT_TYPE: 'account_type',
  /** Alias rule */
  ALIAS: 'alias',
  /** Chart of accounts rule */
  CHART_OF_ACCOUNTS: 'chart_of_accounts',
} as const;

export type RuleTypeType = (typeof RuleType)[keyof typeof RuleType];

/**
 * HTTP status codes commonly used in the SDK.
 */
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCodeType = (typeof HttpStatusCode)[keyof typeof HttpStatusCode];
