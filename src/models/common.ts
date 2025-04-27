/** Common models, shared data structures, enums, and constants */

/** 
 * Base marker interface for all API responses 
 * This is used for type checking and doesn't contain any properties
 */
export interface ApiResponse {
  readonly __apiResponse?: never;
}

/** 
 * Marker interface for models that can be built using builder pattern 
 * This is used for type checking and doesn't contain any properties
 */
export interface BuildableModel {
  readonly __buildable?: never;
}

/**
 * Options for listing resources with pagination, sorting, and filtering
 */
export interface ListOptions {
  /** Maximum number of items to return per page */
  limit?: number;

  /** Opaque string identifier for retrieving the next or previous page */
  cursor?: string;

  /** Field to sort by (e.g., "createdAt", "updatedAt", "name") */
  sortBy?: string;

  /** Sort direction - "asc" (A→Z, 0→9) or "desc" (Z→A, 9→0) */
  sortDirection?: 'asc' | 'desc';

  /** Additional resource-specific filters as extra properties */
  [key: string]: any;
}

/**
 * Metadata for paginated responses
 */
export interface ListMetadata {
  /** Total number of items available */
  total: number;

  /** Cursor for retrieving the next page of results */
  nextCursor?: string;

  /** Cursor for retrieving the previous page of results */
  prevCursor?: string;

  /** Number of items in the current page */
  count: number;
}

/**
 * Paginated response containing a list of items and pagination metadata
 * @template T - The type of items in the list
 */
export interface ListResponse<T> extends ApiResponse {
  /** Array of items in the current page */
  items: T[];

  /** Pagination metadata */
  meta: ListMetadata;
}

/**
 * Status information for a resource
 */
export interface Status {
  /** Status code string */
  code: string;

  /** Optional human-readable description of the status */
  description?: string;

  /** Timestamp when the status was set or last updated */
  timestamp: string;
}

/**
 * Address for a physical location
 */
export interface Address {
  /** First line of the address */
  line1: string;

  /** Optional second line of the address */
  line2?: string;

  /** City name */
  city: string;

  /** State or province */
  state: string;

  /** Postal or ZIP code */
  zipCode: string;

  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
}

/**
 * Common status codes for resources
 */
export enum StatusCode {
  /** Resource is active and can be used */
  ACTIVE = 'ACTIVE',

  /** Resource is inactive and cannot be used */
  INACTIVE = 'INACTIVE',

  /** Resource is pending activation */
  PENDING = 'PENDING',

  /** Resource is suspended */
  SUSPENDED = 'SUSPENDED',

  /** Resource is archived */
  ARCHIVED = 'ARCHIVED',

  /** Resource is deleted */
  DELETED = 'DELETED',

  /** Resource is locked */
  LOCKED = 'LOCKED',

  /** Resource is in error state */
  ERROR = 'ERROR',
}

/**
 * Common error codes
 */
export enum ErrorCode {
  /** Generic error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  /** Authentication failed */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',

  /** Authorization failed */
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',

  /** Resource not found */
  NOT_FOUND = 'NOT_FOUND',

  /** Input validation failed */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  /** Service unavailable */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  /** Request timeout */
  TIMEOUT = 'TIMEOUT',

  /** Conflict with existing resource */
  CONFLICT = 'CONFLICT',
}

/**
 * Common currency codes
 */
export enum CurrencyCode {
  /** United States Dollar */
  USD = 'USD',

  /** Euro */
  EUR = 'EUR',

  /** British Pound */
  GBP = 'GBP',

  /** Japanese Yen */
  JPY = 'JPY',

  /** Canadian Dollar */
  CAD = 'CAD',

  /** Australian Dollar */
  AUD = 'AUD',

  /** Swiss Franc */
  CHF = 'CHF',

  /** Chinese Yuan */
  CNY = 'CNY',
}

/**
 * Sort direction for listing operations
 */
export enum SortDirection {
  /** Ascending sort order (A→Z, 0→9) */
  ASC = 'asc',

  /** Descending sort order (Z→A, 9→0) */
  DESC = 'desc',
}

/**
 * Pagination defaults for listing operations
 */
export const PaginationDefaults = {
  /** Default number of items per page */
  DEFAULT_LIMIT: 10,

  /** Maximum number of items per page */
  MAX_LIMIT: 100,

  /** Default starting position for offset-based pagination */
  DEFAULT_OFFSET: 0,

  /** Default page number for page-based pagination */
  DEFAULT_PAGE: 1,

  /** Default sort direction */
  DEFAULT_SORT_DIRECTION: SortDirection.DESC,
}
