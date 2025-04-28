/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * @file Common model definitions for the Midaz SDK
 * @description Defines shared data structures, enums, and constants used throughout the Midaz ledger system
 */

/**
 * Base interface for all API responses
 * All API responses should extend this interface
 */
export interface ApiResponse {
  // Base marker interface
}

/**
 * Base interface for all buildable models
 * Marker interface for models that can be built using builder pattern
 */
export interface BuildableModel {
  // Base marker interface
}

/**
 * Options for listing resources
 *
 * This interface defines the standard parameters for paginated list operations
 * across all resource types in the Midaz system. It supports cursor-based pagination,
 * sorting, and filtering.
 *
 * @example
 * ```typescript
 * // Request the first page of accounts sorted by creation date
 * const options: ListOptions = {
 *   limit: 25,
 *   sortBy: "createdAt",
 *   sortDirection: "desc"
 * };
 *
 * // Request the next page using a cursor
 * const nextPageOptions: ListOptions = {
 *   limit: 25,
 *   cursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9",
 *   sortBy: "createdAt",
 *   sortDirection: "desc"
 * };
 * ```
 */
export interface ListOptions {
  /**
   * Maximum number of items to return
   * Controls the page size for paginated results
   * Default and maximum values are defined by PaginationDefaults
   */
  limit?: number;

  /**
   * Cursor for pagination
   * Opaque string that points to a specific item in the collection
   * Used for retrieving the next or previous page of results
   */
  cursor?: string;

  /**
   * Field to sort by
   * Must be a valid field name for the resource being listed
   * Common sort fields include "createdAt", "updatedAt", "name"
   */
  sortBy?: string;

  /**
   * Sort direction (asc or desc)
   * "asc" for ascending order (A→Z, 0→9)
   * "desc" for descending order (Z→A, 9→0)
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * Additional filters
   * Resource-specific filters can be added as extra properties
   * For example: { status: "ACTIVE", assetCode: "USD" }
   */
  [key: string]: any;
}

/**
 * Metadata for paginated responses
 *
 * This interface provides information about the current page of results
 * and links to navigate to adjacent pages. It's included in all list responses.
 *
 * @example
 * ```typescript
 * // Example metadata for a paginated response
 * const metadata: ListMetadata = {
 *   total: 157,
 *   count: 25,
 *   nextCursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9",
 *   prevCursor: null
 * };
 * ```
 */
export interface ListMetadata {
  /**
   * Total number of items
   * The total count of all items matching the query across all pages
   * May be an estimate for very large collections
   */
  total: number;

  /**
   * Cursor for the next page
   * Opaque string that can be used to retrieve the next page of results
   * Will be undefined if there are no more pages after the current one
   */
  nextCursor?: string;

  /**
   * Cursor for the previous page
   * Opaque string that can be used to retrieve the previous page of results
   * Will be undefined if this is the first page
   */
  prevCursor?: string;

  /**
   * Number of items in the current page
   * Will be less than or equal to the requested limit
   * May be less than limit if there are not enough items remaining
   */
  count: number;
}

/**
 * Paginated response containing a list of items
 *
 * This is the standard response format for all list operations in the Midaz API.
 * It includes both the items for the current page and metadata for pagination.
 *
 * @template T - The type of items in the list
 *
 * @example
 * ```typescript
 * // Example of a paginated response for accounts
 * const response: ListResponse<Account> = {
 *   items: [
 *     { id: "acc_01H9ZQCK3VP6WS2EZ5JQKD5E1S", name: "Operating Cash", ... },
 *     { id: "acc_02H9ZQCK3VP6WS2EZ5JQKD5E1T", name: "Petty Cash", ... },
 *     // ... more accounts
 *   ],
 *   meta: {
 *     total: 157,
 *     count: 25,
 *     nextCursor: "eyJpZCI6ImFjY18wMUg5WlFDSzNWUDZXUzJFWjVKUUtENUUxUyJ9"
 *   }
 * };
 * ```
 */
export interface ListResponse<T> extends ApiResponse {
  /**
   * List of items
   * The items for the current page of results
   * The length of this array will be less than or equal to the requested limit
   */
  items: T[];

  /**
   * Pagination metadata
   * Contains information about the current page and links to adjacent pages
   */
  meta: ListMetadata;
}

/**
 * Status information
 *
 * This interface represents the status of a resource in the Midaz system.
 * It includes both a code indicating the current state and additional context.
 *
 * @example
 * ```typescript
 * // Example of an active status
 * const activeStatus: Status = {
 *   code: "ACTIVE",
 *   description: "Account is active and can be used for transactions",
 *   timestamp: "2023-09-15T14:30:00Z"
 * };
 *
 * // Example of a suspended status
 * const suspendedStatus: Status = {
 *   code: "SUSPENDED",
 *   description: "Account suspended due to suspicious activity",
 *   timestamp: "2023-09-16T09:45:00Z"
 * };
 * ```
 */
export interface Status {
  /**
   * Status code
   * A string identifier for the status, typically one of the values from StatusCode enum
   * Examples: "ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"
   */
  code: string;

  /**
   * Status description
   * Optional human-readable explanation of the current status
   * Useful for providing context about why a resource is in its current state
   */
  description?: string;

  /**
   * Status timestamp
   * ISO 8601 formatted date-time when the status was last updated
   * Allows tracking when a resource entered its current state
   */
  timestamp: string;
}

/**
 * Address represents a physical location in the Midaz system.
 *
 * This structure is used for storing address information for organizations and other entities.
 * It follows a standard format that accommodates addresses from most countries.
 *
 * @example
 * ```typescript
 * // Example of a US address
 * const usAddress: Address = {
 *   line1: "123 Main Street",
 *   line2: "Suite 456",
 *   city: "San Francisco",
 *   state: "CA",
 *   zipCode: "94105",
 *   country: "US"
 * };
 *
 * // Example of a UK address
 * const ukAddress: Address = {
 *   line1: "10 Downing Street",
 *   city: "London",
 *   state: "Greater London",
 *   zipCode: "SW1A 2AA",
 *   country: "GB"
 * };
 * ```
 */
export interface Address {
  /**
   * Line1 is the first line of the address (typically street number and name)
   * This field is required and has a maximum length of 256 characters.
   */
  line1: string;

  /**
   * Line2 is the second line of the address (typically apartment, suite, unit, etc.)
   * This field is optional and has a maximum length of 256 characters if provided.
   */
  line2?: string;

  /**
   * City is the name of the city
   * This field is required and has a maximum length of 128 characters.
   */
  city: string;

  /**
   * State is the name of the state or province
   * This field is required and has a maximum length of 128 characters.
   */
  state: string;

  /**
   * ZipCode is the postal code
   * This field is required and has a maximum length of 32 characters.
   */
  zipCode: string;

  /**
   * Country is the ISO 3166-1 alpha-2 country code (e.g., "US", "CA")
   * This field is required and must be a valid 2-letter country code.
   */
  country: string;
}

/**
 * Common status codes used throughout the Midaz system.
 *
 * These status values represent the different states a resource can be in.
 * They are used consistently across different resource types (accounts, assets, etc.)
 * to indicate their current operational state.
 *
 * The lifecycle of a resource typically follows these patterns:
 * - New resources start as ACTIVE or PENDING
 * - ACTIVE resources can be changed to INACTIVE (temporarily) or CLOSED (permanently)
 * - INACTIVE resources can be reactivated to ACTIVE
 * - SUSPENDED resources require administrative intervention
 * - DELETED resources are soft-deleted and may be recoverable
 *
 * @example
 * ```typescript
 * // Check if an account is active
 * if (account.status.code === StatusCode.ACTIVE) {
 *   // Proceed with transaction
 * } else {
 *   // Handle inactive account
 *   console.log(`Account is ${account.status.code}`);
 * }
 *
 * // Update an account to inactive status
 * const updateInput = {
 *   status: StatusCode.INACTIVE
 * };
 * ```
 */
export enum StatusCode {
  /**
   * ACTIVE represents an active resource that can be used normally
   * Active accounts can participate in transactions as both source and destination.
   */
  ACTIVE = 'ACTIVE',

  /**
   * INACTIVE represents a temporarily inactive resource
   * Inactive accounts cannot participate in new transactions but can be reactivated.
   */
  INACTIVE = 'INACTIVE',

  /**
   * PENDING represents a resource awaiting activation or approval
   * Pending accounts are in the process of being set up or approved.
   */
  PENDING = 'PENDING',

  /**
   * SUSPENDED represents a resource that has been temporarily disabled
   * Suspended resources cannot be used until the suspension is lifted.
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * DELETED represents a resource marked as deleted
   * Deleted resources are soft-deleted and may be recoverable.
   */
  DELETED = 'DELETED',

  /**
   * CLOSED represents a permanently closed resource
   * Closed accounts cannot participate in new transactions and cannot be reopened.
   */
  CLOSED = 'CLOSED',
}

/**
 * Transaction status constants define the possible states of a transaction in the Midaz system.
 *
 * These constants are used throughout the SDK to represent transaction statuses in a consistent way.
 * They reflect the lifecycle of a transaction as it moves through the system.
 *
 * Transaction Lifecycle:
 * 1. A transaction is created with status "pending" if it requires explicit commitment
 * 2. When committed, the transaction transitions to "completed"
 * 3. If issues occur, the transaction may transition to "failed"
 * 4. A pending transaction can be cancelled, transitioning to "cancelled"
 *
 * @example
 * ```typescript
 * // Create a pending transaction
 * const pendingTx = await client.transactions.create({
 *   // transaction details...
 *   commit: false // Creates a pending transaction
 * });
 *
 * // Check transaction status
 * if (transaction.status === TransactionStatus.PENDING) {
 *   // Transaction needs to be committed
 *   await client.transactions.commit(transaction.id);
 * } else if (transaction.status === TransactionStatus.COMPLETED) {
 *   // Transaction has been processed successfully
 *   console.log("Transaction completed successfully");
 * }
 * ```
 */
export enum TransactionStatus {
  /**
   * PENDING represents a transaction that is not yet completed
   * Pending transactions have been created but require explicit commitment
   * before their operations are applied to account balances. This status
   * is useful for implementing approval workflows or two-phase commits.
   */
  PENDING = 'pending',

  /**
   * COMPLETED represents a successfully completed transaction
   * Completed transactions have been fully processed and their operations
   * have been applied to the relevant account balances. This is the final
   * state for successful transactions.
   */
  COMPLETED = 'completed',

  /**
   * FAILED represents a transaction that failed to process
   * Failed transactions encountered an error during processing and were
   * not applied to account balances. The transaction's FailureReason field
   * provides details about why the transaction failed.
   */
  FAILED = 'failed',

  /**
   * CANCELLED represents a transaction that was cancelled
   * Cancelled transactions were explicitly cancelled before being committed.
   * Only pending transactions can be cancelled; completed transactions cannot
   * be reversed through cancellation.
   */
  CANCELLED = 'cancelled',
}

/**
 * Sort direction for listing operations.
 *
 * This enum defines the possible sort directions when listing resources.
 * It is used in conjunction with the sortBy field in ListOptions.
 *
 * @example
 * ```typescript
 * // List accounts sorted by name in ascending order
 * const options: ListOptions = {
 *   sortBy: "name",
 *   sortDirection: SortDirection.ASC
 * };
 *
 * // List transactions sorted by amount in descending order
 * const options: ListOptions = {
 *   sortBy: "amount",
 *   sortDirection: SortDirection.DESC
 * };
 * ```
 */
export enum SortDirection {
  /**
   * Ascending sort order (A→Z, 0→9)
   * Results are sorted from smallest to largest or alphabetically
   */
  ASC = 'asc',

  /**
   * Descending sort order (Z→A, 9→0)
   * Results are sorted from largest to smallest or reverse alphabetically
   */
  DESC = 'desc',
}

/**
 * Pagination defaults for listing operations.
 *
 * These constants define the default values and limits for pagination
 * parameters used in list operations throughout the Midaz API.
 *
 * @example
 * ```typescript
 * // Apply default pagination if not specified
 * const limit = options.limit || PaginationDefaults.DEFAULT_LIMIT;
 *
 * // Enforce maximum limit
 * const safeLimit = Math.min(
 *   requestedLimit,
 *   PaginationDefaults.MAX_LIMIT
 * );
 * ```
 */
export const PaginationDefaults = {
  /**
   * Default number of items to return per page
   * Used when no limit is specified in the request
   */
  DEFAULT_LIMIT: 10,

  /**
   * Maximum number of items that can be requested per page
   * Requests for larger page sizes will be capped at this value
   */
  MAX_LIMIT: 100,

  /**
   * Default starting position for pagination
   * Used for offset-based pagination (for backward compatibility)
   */
  DEFAULT_OFFSET: 0,

  /**
   * Default page number for backward compatibility
   * Used for page-based pagination (for backward compatibility)
   */
  DEFAULT_PAGE: 1,

  /**
   * Default sort direction
   * Used when no sort direction is specified in the request
   */
  DEFAULT_SORT_DIRECTION: SortDirection.DESC,
};
