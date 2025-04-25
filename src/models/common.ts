/** Common models, shared data structures, enums, and constants */

/** Base marker interface for all API responses */
export interface ApiResponse {
  // Base marker interface
}

/** Marker interface for models that can be built using builder pattern */
export interface BuildableModel {
  // Base marker interface
}

/**
 * Options for listing resources with pagination, sorting, and filtering
 *
 * @example
 * ```typescript
 * // First page of accounts sorted by creation date
 * const options: ListOptions = {
 *   limit: 25,
 *   sortBy: "createdAt",
 *   sortDirection: "desc"
 * };
 * 
 * // Next page using a cursor
 * const nextPage: ListOptions = {
 *   limit: 25,
 *   cursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9"
 * };
 * ```
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
 *
 * @example
 * ```typescript
 * const metadata: ListMetadata = {
 *   total: 157,
 *   count: 25,
 *   nextCursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9"
 * };
 * ```
 */
export interface ListMetadata {
  /** Total number of items matching the query across all pages */
  total: number;

  /** Cursor for retrieving the next page (undefined if on last page) */
  nextCursor?: string;

  /** Cursor for retrieving the previous page (undefined if on first page) */
  prevCursor?: string;

  /** Number of items in the current page */
  count: number;
}

/**
 * Paginated response containing a list of items and pagination metadata
 *
 * @template T - The type of items in the list
 *
 * @example
 * ```typescript
 * const response: ListResponse<Account> = {
 *   items: [
 *     { id: "acc_123", name: "Operating Cash" },
 *     { id: "acc_456", name: "Petty Cash" }
 *   ],
 *   meta: {
 *     total: 157,
 *     count: 2,
 *     nextCursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9"
 *   }
 * };
 * ```
 */
export interface ListResponse<T> extends ApiResponse {
  /** Items for the current page of results */
  items: T[];

  /** Pagination metadata */
  meta: ListMetadata;
}

/**
 * Status information for a resource
 *
 * @example
 * ```typescript
 * const activeStatus: Status = {
 *   code: "ACTIVE",
 *   description: "Account is active and can be used",
 *   timestamp: "2023-09-15T14:30:00Z"
 * };
 * ```
 */
export interface Status {
  /** Status code identifier (e.g., "ACTIVE", "INACTIVE", "PENDING") */
  code: string;

  /** Optional human-readable explanation of the current status */
  description?: string;

  /** ISO 8601 formatted date-time when the status was last updated */
  timestamp: string;
}

/**
 * Address for a physical location
 *
 * @example
 * ```typescript
 * const address: Address = {
 *   line1: "123 Main Street",
 *   line2: "Suite 456",
 *   city: "San Francisco",
 *   state: "CA",
 *   zipCode: "94105",
 *   country: "US"
 * };
 * ```
 */
export interface Address {
  /** First line of the address (street number and name, max 256 chars) */
  line1: string;

  /** Second line of the address (apartment, suite, unit, etc., max 256 chars) */
  line2?: string;

  /** City name (max 128 chars) */
  city: string;

  /** State or province name (max 128 chars) */
  state: string;

  /** Postal code (max 32 chars) */
  zipCode: string;

  /** ISO 3166-1 alpha-2 country code (e.g., "US", "CA") */
  country: string;
}

/**
 * Common status codes for resources
 * 
 * @example
 * ```typescript
 * // Check if an account is active
 * if (account.status.code === StatusCode.ACTIVE) {
 *   // Proceed with transaction
 * } else {
 *   console.log(`Account is ${account.status.code}`);
 * }
 * ```
 */
export enum StatusCode {
  /** Active resource that can be used normally */
  ACTIVE = 'ACTIVE',

  /** Temporarily inactive resource */
  INACTIVE = 'INACTIVE',

  /** Resource awaiting activation or approval */
  PENDING = 'PENDING',

  /** Resource that has been temporarily disabled */
  SUSPENDED = 'SUSPENDED',

  /** Resource marked as deleted (soft-delete) */
  DELETED = 'DELETED',

  /** Permanently closed resource */
  CLOSED = 'CLOSED',
}

/**
 * Transaction status constants
 *
 * @example
 * ```typescript
 * // Check transaction status
 * if (transaction.status === TransactionStatus.PENDING) {
 *   await client.transactions.commit(transaction.id);
 * } else if (transaction.status === TransactionStatus.COMPLETED) {
 *   console.log("Transaction completed successfully");
 * }
 * ```
 */
export enum TransactionStatus {
  /** Transaction that is not yet completed */
  PENDING = 'pending',

  /** Successfully completed transaction */
  COMPLETED = 'completed',

  /** Transaction that failed to process */
  FAILED = 'failed',

  /** Transaction that was cancelled before being committed */
  CANCELLED = 'cancelled',
}

/**
 * Sort direction for listing operations
 *
 * @example
 * ```typescript
 * const options: ListOptions = {
 *   sortBy: "name",
 *   sortDirection: SortDirection.ASC
 * };
 * ```
 */
export enum SortDirection {
  /** Ascending sort order (A→Z, 0→9) */
  ASC = 'asc',

  /** Descending sort order (Z→A, 9→0) */
  DESC = 'desc',
}

/**
 * Pagination defaults for listing operations
 *
 * @example
 * ```typescript
 * const limit = options.limit || PaginationDefaults.DEFAULT_LIMIT;
 * const safeLimit = Math.min(requestedLimit, PaginationDefaults.MAX_LIMIT);
 * ```
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
};
