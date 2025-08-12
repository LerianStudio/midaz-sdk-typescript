/** Common models, shared data structures, enums, and constants */

/**
 * Base marker interface for all API responses
 * This interface now also serves as an extensible object type for API responses
 */
export interface ApiResponse {
  readonly __apiResponse?: never;

  /**
   * Allow any additional properties in API responses
   */
  [key: string]: any;
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
 * This structure is used to specify filtering, pagination, and sorting parameters
 * when retrieving lists of resources from the Midaz API.
 */
export interface ListOptions {
  /** Maximum number of items to return per page */
  limit?: number;

  /** Starting position for pagination */
  offset?: number;

  /** Opaque string identifier for retrieving the next or previous page */
  cursor?: string;

  /** Field to sort by (e.g., "createdAt", "updatedAt", "name") */
  sortBy?: string;

  /** Sort direction - "asc" (A→Z, 0→9) or "desc" (Z→A, 9→0) */
  sortDirection?: 'asc' | 'desc';

  /** Field to order results by */
  orderBy?: string;

  /** Order direction ("asc" for ascending or "desc" for descending) */
  orderDirection?: string;

  /** Page number to return (when using page-based pagination) */
  page?: number;

  /** Start date for filtering by date range (ISO 8601 format) */
  startDate?: string;

  /** End date for filtering by date range (ISO 8601 format) */
  endDate?: string;

  /** Additional filters to apply to the query */
  filters?: Record<string, string>;

  /** Additional parameters that are specific to certain endpoints */
  additionalParams?: Record<string, string>;

  /** Additional resource-specific filters as extra properties */
  [key: string]: any;
}

/**
 * Pagination information for paginated responses
 * Contains metadata about the current page and navigation options
 */
export interface Pagination {
  /** Number of items per page */
  limit: number;

  /** Starting position for the current page */
  offset: number;

  /** Total number of items available across all pages */
  total: number;

  /** Cursor for the previous page (for cursor-based pagination) */
  prevCursor?: string;

  /** Cursor for the next page (for cursor-based pagination) */
  nextCursor?: string;
}

/**
 * Metadata for paginated responses
 * @deprecated Use Pagination interface instead
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
 * Alias for ListResponse for backward compatibility
 * @template T - The type of items in the list
 */
export type PaginatedResponse<T> = ListResponse<T>;

/**
 * Base model interface for all data models
 */
export interface BaseModel {
  /** Unique system-generated identifier */
  id: string;

  /** Timestamp when the resource was created */
  createdAt: string;

  /** Timestamp when the resource was last updated */
  updatedAt: string;

  /** Timestamp when the resource was deleted (null if active) */
  deletedAt?: string;
}

/**
 * Generic metadata type for storing key-value pairs
 */
export type Metadata = Record<string, any>;

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
};

/**
 * Query parameter names used for API requests
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

// ========================================
// Pagination Utility Functions
// ========================================

/**
 * Creates a new ListOptions with default values
 * This constructor ensures that the default pagination values are applied consistently
 */
export function newListOptions(): ListOptions {
  return {
    limit: PaginationDefaults.DEFAULT_LIMIT,
    offset: PaginationDefaults.DEFAULT_OFFSET,
    orderDirection: PaginationDefaults.DEFAULT_SORT_DIRECTION,
  };
}

/**
 * Sets the maximum number of items to return per page
 * This method validates that the limit is within acceptable bounds
 */
export function withLimit(options: ListOptions, limit: number): ListOptions {
  const validatedLimit =
    limit <= 0
      ? PaginationDefaults.DEFAULT_LIMIT
      : limit > PaginationDefaults.MAX_LIMIT
        ? PaginationDefaults.MAX_LIMIT
        : limit;

  return { ...options, limit: validatedLimit };
}

/**
 * Sets the starting position for pagination
 */
export function withOffset(options: ListOptions, offset: number): ListOptions {
  return { ...options, offset: Math.max(0, offset) };
}

/**
 * Sets the cursor for cursor-based pagination
 */
export function withCursor(options: ListOptions, cursor: string): ListOptions {
  return { ...options, cursor };
}

/**
 * Sets the field to order results by
 */
export function withOrderBy(options: ListOptions, orderBy: string): ListOptions {
  return { ...options, orderBy };
}

/**
 * Sets the order direction
 */
export function withOrderDirection(options: ListOptions, direction: 'asc' | 'desc'): ListOptions {
  return { ...options, orderDirection: direction };
}

/**
 * Sets the page number (for backward compatibility)
 */
export function withPage(options: ListOptions, page: number): ListOptions {
  const validatedPage = Math.max(1, page);
  return {
    ...options,
    page: validatedPage,
    offset: (validatedPage - 1) * (options.limit || PaginationDefaults.DEFAULT_LIMIT),
  };
}

/**
 * Adds filters to the options
 */
export function withFilters(options: ListOptions, filters: Record<string, string>): ListOptions {
  return { ...options, filters: { ...options.filters, ...filters } };
}

/**
 * Sets the date range for filtering
 */
export function withDateRange(
  options: ListOptions,
  startDate: string,
  endDate: string
): ListOptions {
  return { ...options, startDate, endDate };
}

/**
 * Converts ListOptions to a map of query parameters
 * This method transforms the ListOptions structure into a format suitable for use as URL query parameters
 */
export function toQueryParams(options: ListOptions): Record<string, string> {
  const params: Record<string, string> = {};

  // Add pagination parameters
  addPaginationParams(options, params);

  // Add filtering parameters
  addFilteringParams(options, params);

  // Add sorting parameters
  addSortingParams(options, params);

  // Add date range parameters
  addDateRangeParams(options, params);

  // Add additional parameters
  addAdditionalParams(options, params);

  return params;
}

/**
 * Adds pagination-related parameters to the query parameters map
 */
function addPaginationParams(options: ListOptions, params: Record<string, string>): void {
  // Always include limit parameter with at least the default
  const limit =
    !options.limit || options.limit <= 0
      ? PaginationDefaults.DEFAULT_LIMIT
      : options.limit > PaginationDefaults.MAX_LIMIT
        ? PaginationDefaults.MAX_LIMIT
        : options.limit;
  params[QueryParamNames.LIMIT] = limit.toString();

  // Add offset if specified
  if (options.offset && options.offset > 0) {
    params[QueryParamNames.OFFSET] = options.offset.toString();
  }

  // These are kept for backward compatibility
  if (options.page && options.page > 0) {
    params[QueryParamNames.PAGE] = options.page.toString();
  }

  if (options.cursor) {
    params[QueryParamNames.CURSOR] = options.cursor;
  }
}

/**
 * Adds filter-related parameters to the query parameters map
 */
function addFilteringParams(options: ListOptions, params: Record<string, string>): void {
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      // If the filter value is empty, skip it
      if (value === '') {
        continue;
      }
      params[key] = value;
    }
  }
}

/**
 * Adds sorting-related parameters to the query parameters map
 */
function addSortingParams(options: ListOptions, params: Record<string, string>): void {
  if (options.orderBy) {
    params[QueryParamNames.ORDER_BY] = options.orderBy;
  }

  // Always include order direction with at least the default
  const orderDirection = options.orderDirection || PaginationDefaults.DEFAULT_SORT_DIRECTION;
  params[QueryParamNames.ORDER_DIRECTION] = orderDirection;
}

/**
 * Adds date range parameters to the query parameters map
 */
function addDateRangeParams(options: ListOptions, params: Record<string, string>): void {
  if (options.startDate) {
    params[QueryParamNames.START_DATE] = options.startDate;
  }

  if (options.endDate) {
    params[QueryParamNames.END_DATE] = options.endDate;
  }
}

/**
 * Adds additional parameters to the query parameters map
 */
function addAdditionalParams(options: ListOptions, params: Record<string, string>): void {
  if (options.additionalParams) {
    for (const [key, value] of Object.entries(options.additionalParams)) {
      params[key] = value;
    }
  }
}

// ========================================
// Pagination Helper Functions
// ========================================

/**
 * Returns true if there are more pages available
 */
export function hasMorePages(pagination: Pagination): boolean {
  return pagination.offset + pagination.limit < pagination.total;
}

/**
 * Returns true if there is a previous page available
 */
export function hasPrevPage(pagination: Pagination): boolean {
  return pagination.offset > 0 || !!pagination.prevCursor;
}

/**
 * Returns true if there is a next page available
 */
export function hasNextPage(pagination: Pagination): boolean {
  return hasMorePages(pagination) || !!pagination.nextCursor;
}

/**
 * Returns options for fetching the next page
 */
export function nextPageOptions(pagination: Pagination): ListOptions | null {
  if (!hasNextPage(pagination)) {
    return null;
  }

  const options = newListOptions();
  options.limit = pagination.limit;

  // Prefer cursor-based pagination if available
  if (pagination.nextCursor) {
    return withCursor(options, pagination.nextCursor);
  }

  // Fall back to offset-based pagination
  return withOffset(options, pagination.offset + pagination.limit);
}

/**
 * Returns options for fetching the previous page
 */
export function prevPageOptions(pagination: Pagination): ListOptions | null {
  if (!hasPrevPage(pagination)) {
    return null;
  }

  const options = newListOptions();
  options.limit = pagination.limit;

  // Prefer cursor-based pagination if available
  if (pagination.prevCursor) {
    return withCursor(options, pagination.prevCursor);
  }

  // Fall back to offset-based pagination
  const newOffset = Math.max(0, pagination.offset - pagination.limit);
  return withOffset(options, newOffset);
}

/**
 * Returns the current page number (1-based)
 */
export function currentPage(pagination: Pagination): number {
  if (pagination.limit <= 0) {
    return 1;
  }

  return Math.floor(pagination.offset / pagination.limit) + 1;
}

/**
 * Returns the total number of pages available
 */
export function totalPages(pagination: Pagination): number {
  if (pagination.limit <= 0) {
    return 1;
  }

  return Math.ceil(pagination.total / pagination.limit);
}

/**
 * Creates a new pagination object
 */
export function createPagination(
  limit: number,
  offset: number,
  total: number,
  nextCursor?: string,
  prevCursor?: string
): Pagination {
  return {
    limit,
    offset,
    total,
    nextCursor,
    prevCursor,
  };
}

// ========================================
// Builder Pattern Classes
// ========================================

/**
 * Builder class for ListOptions to provide a fluent API
 */
export class ListOptionsBuilder {
  private options: ListOptions;

  constructor() {
    this.options = newListOptions();
  }

  withLimit(limit: number): ListOptionsBuilder {
    this.options = withLimit(this.options, limit);
    return this;
  }

  withOffset(offset: number): ListOptionsBuilder {
    this.options = withOffset(this.options, offset);
    return this;
  }

  withCursor(cursor: string): ListOptionsBuilder {
    this.options = withCursor(this.options, cursor);
    return this;
  }

  withOrderBy(orderBy: string): ListOptionsBuilder {
    this.options = withOrderBy(this.options, orderBy);
    return this;
  }

  withOrderDirection(direction: 'asc' | 'desc'): ListOptionsBuilder {
    this.options = withOrderDirection(this.options, direction);
    return this;
  }

  withPage(page: number): ListOptionsBuilder {
    this.options = withPage(this.options, page);
    return this;
  }

  withFilters(filters: Record<string, string>): ListOptionsBuilder {
    this.options = withFilters(this.options, filters);
    return this;
  }

  withDateRange(startDate: string, endDate: string): ListOptionsBuilder {
    this.options = withDateRange(this.options, startDate, endDate);
    return this;
  }

  build(): ListOptions {
    return { ...this.options };
  }
}

// ========================================
// Validation Utilities
// ========================================

/**
 * Represents a validation error for a specific field with rich context and suggestions
 */
export interface FieldError {
  /** The path to the field that has a validation error (use dot notation for nested fields) */
  field: string;

  /** The invalid value that caused the error */
  value?: any;

  /** Human-readable description of the error */
  message: string;

  /** Error code for programmatic error handling */
  code?: string;

  /** The specific constraint that was violated (e.g., "required", "min", "max") */
  constraint?: string;

  /** Potential ways to fix the error */
  suggestions?: string[];
}

/**
 * Collection of field validation errors
 */
export class FieldErrors extends Error {
  public readonly errors: FieldError[];

  constructor(errors: FieldError[] = []) {
    const message =
      errors.length > 0
        ? `Validation failed with ${errors.length} field errors:\n${errors.map((e, i) => `${i + 1}. ${formatFieldError(e)}`).join('\n')}`
        : 'No validation errors';

    super(message);
    this.name = 'FieldErrors';
    this.errors = errors;
  }

  /** Adds a new field error to the collection */
  add(field: string, value: any, message: string): FieldError {
    const fieldError: FieldError = { field, value, message };
    this.errors.push(fieldError);
    return fieldError;
  }

  /** Adds an existing field error to the collection */
  addError(error: FieldError): void {
    this.errors.push(error);
  }

  /** Returns true if there are any errors in the collection */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /** Returns all errors for a specific field */
  getErrorsForField(field: string): FieldError[] {
    return this.errors.filter((err) => err.field === field || err.field.startsWith(field + '.'));
  }
}

/**
 * Creates a field error with common fields
 */
export function buildFieldError(field: string, value: any, message: string): FieldError {
  return { field, value, message };
}

/**
 * Adds additional properties to a field error
 */
export function enhanceFieldError(
  error: FieldError,
  options: {
    code?: string;
    constraint?: string;
    suggestions?: string[];
  }
): FieldError {
  return {
    ...error,
    code: options.code,
    constraint: options.constraint,
    suggestions: options.suggestions,
  };
}

/**
 * Formats a field error as a human-readable string
 */
export function formatFieldError(error: FieldError): string {
  let result = `Invalid field '${error.field}'`;

  if (error.value !== undefined) {
    result += `: '${error.value}'`;
  }

  if (error.message) {
    result += ` - ${error.message}`;
  }

  if (error.constraint) {
    result += ` (constraint: ${error.constraint})`;
  }

  if (error.suggestions && error.suggestions.length > 0) {
    result += '\\nSuggestions:\\n' + error.suggestions.map((s) => `- ${s}`).join('\\n');
  }

  return result;
}

/**
 * Creates a new empty FieldErrors collection
 */
export function newFieldErrors(): FieldErrors {
  return new FieldErrors();
}

/**
 * Wraps a regular error as a field error
 */
export function wrapError(field: string, value: any, error: Error): FieldError {
  return buildFieldError(field, value, error.message);
}

// ========================================
// Common Validation Functions
// ========================================

/** Regex pattern for asset codes (3-4 uppercase letters) */
const ASSET_CODE_PATTERN = /^[A-Z]{3,4}$/;

/** Regex pattern for account aliases */
const ACCOUNT_ALIAS_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

/** Regex pattern for external account references */
const EXTERNAL_ACCOUNT_PATTERN = /^@external\/([A-Z]{3,4})$/;

/** Maximum metadata size in bytes (4KB) */
const MAX_METADATA_SIZE = 4096;

/**
 * Validates an asset code
 */
export function validateAssetCode(assetCode: string): FieldError | null {
  if (!assetCode) {
    return buildFieldError('assetCode', assetCode, 'Asset code is required');
  }

  if (!ASSET_CODE_PATTERN.test(assetCode)) {
    return enhanceFieldError(
      buildFieldError('assetCode', assetCode, 'Asset code must be 3-4 uppercase letters'),
      {
        constraint: 'pattern',
        suggestions: [
          'Use standard currency codes like USD, EUR, BRL',
          'Ensure all letters are uppercase',
        ],
      }
    );
  }

  return null;
}

/**
 * Validates an account alias
 */
export function validateAccountAlias(alias: string): FieldError | null {
  if (!alias) {
    return buildFieldError('accountAlias', alias, 'Account alias is required');
  }

  if (!ACCOUNT_ALIAS_PATTERN.test(alias)) {
    return enhanceFieldError(
      buildFieldError(
        'accountAlias',
        alias,
        'Account alias must be 1-50 characters using only letters, numbers, underscore, and hyphen'
      ),
      {
        constraint: 'pattern',
        suggestions: [
          'Use only alphanumeric characters, underscore (_), and hyphen (-)',
          'Keep length between 1-50 characters',
        ],
      }
    );
  }

  return null;
}

/**
 * Validates external account reference
 */
export function validateExternalAccount(account: string): FieldError | null {
  if (!account) {
    return buildFieldError('account', account, 'Account reference is required');
  }

  if (!EXTERNAL_ACCOUNT_PATTERN.test(account)) {
    return enhanceFieldError(
      buildFieldError('account', account, 'External account must be in format @external/ASSETCODE'),
      {
        constraint: 'pattern',
        suggestions: [
          'Use format @external/USD for external accounts',
          'Ensure asset code is 3-4 uppercase letters',
        ],
      }
    );
  }

  return null;
}

/**
 * Validates transaction code
 */
export function validateTransactionCode(code: string): FieldError | null {
  if (!code) {
    return buildFieldError('transactionCode', code, 'Transaction code is required');
  }

  if (code.length < 3 || code.length > 50) {
    return enhanceFieldError(
      buildFieldError(
        'transactionCode',
        code,
        'Transaction code must be between 3 and 50 characters'
      ),
      {
        constraint: 'length',
        suggestions: ['Use descriptive codes like "transfer", "payment", "deposit"'],
      }
    );
  }

  return null;
}

/**
 * Validates amount value
 */
export function validateAmount(amount: string | number, scale?: number): FieldError | null {
  if (amount === undefined || amount === null || amount === '') {
    return buildFieldError('amount', amount, 'Amount is required');
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return enhanceFieldError(buildFieldError('amount', amount, 'Amount must be a valid number'), {
      constraint: 'type',
      suggestions: ['Use numeric values like "100.50" or 100.50', 'Avoid non-numeric characters'],
    });
  }

  if (numericAmount <= 0) {
    return enhanceFieldError(buildFieldError('amount', amount, 'Amount must be positive'), {
      constraint: 'min',
      suggestions: ['Use positive values greater than 0'],
    });
  }

  if (scale !== undefined && scale < 0) {
    return enhanceFieldError(buildFieldError('scale', scale, 'Scale must be non-negative'), {
      constraint: 'min',
      suggestions: ['Use 0 or positive integers for decimal precision'],
    });
  }

  return null;
}

/**
 * Validates metadata object
 */
export function validateMetadata(metadata: Record<string, any>): FieldErrors {
  const errors = newFieldErrors();

  if (!metadata) {
    return errors;
  }

  // Check total size
  const metadataStr = JSON.stringify(metadata);
  const metadataSize = new Blob([metadataStr]).size;

  if (metadataSize > MAX_METADATA_SIZE) {
    errors.addError(
      enhanceFieldError(
        buildFieldError(
          'metadata',
          metadata,
          `Metadata size (${metadataSize} bytes) exceeds maximum allowed size of ${MAX_METADATA_SIZE} bytes`
        ),
        {
          constraint: 'size',
          suggestions: ['Reduce the amount of metadata', 'Use shorter key names and values'],
        }
      )
    );
  }

  // Validate individual keys and values
  for (const [key, value] of Object.entries(metadata)) {
    if (key.length > 100) {
      errors.addError(
        enhanceFieldError(
          buildFieldError(`metadata.${key}`, key, 'Metadata key must not exceed 100 characters'),
          {
            constraint: 'length',
            suggestions: ['Use shorter, descriptive key names'],
          }
        )
      );
    }

    if (typeof value === 'string' && value.length > 2000) {
      errors.addError(
        enhanceFieldError(
          buildFieldError(
            `metadata.${key}`,
            value,
            'Metadata value must not exceed 2000 characters'
          ),
          {
            constraint: 'length',
            suggestions: ['Use shorter values or split into multiple keys'],
          }
        )
      );
    }
  }

  return errors;
}

/**
 * Validates date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startField = 'startDate',
  endField = 'endDate'
): FieldErrors {
  const errors = newFieldErrors();

  if (!startDate && !endDate) {
    return errors;
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (startDate && (!start || isNaN(start.getTime()))) {
    errors.addError(
      enhanceFieldError(
        buildFieldError(startField, startDate, 'Start date must be a valid ISO 8601 date'),
        {
          constraint: 'format',
          suggestions: ['Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ'],
        }
      )
    );
  }

  if (endDate && (!end || isNaN(end.getTime()))) {
    errors.addError(
      enhanceFieldError(
        buildFieldError(endField, endDate, 'End date must be a valid ISO 8601 date'),
        {
          constraint: 'format',
          suggestions: ['Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ'],
        }
      )
    );
  }

  if (start && end && start >= end) {
    errors.addError(
      enhanceFieldError(
        buildFieldError(startField, startDate, 'Start date must be before end date'),
        {
          constraint: 'range',
          suggestions: ['Ensure start date is earlier than end date'],
        }
      )
    );
  }

  return errors;
}

/**
 * Validates required field
 */
export function validateRequired(value: any, fieldName: string): FieldError | null {
  if (value === undefined || value === null || value === '') {
    return enhanceFieldError(buildFieldError(fieldName, value, `${fieldName} is required`), {
      constraint: 'required',
      suggestions: [`Provide a valid value for ${fieldName}`],
    });
  }

  return null;
}

/**
 * Validates string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): FieldError | null {
  if (!value && (min === undefined || min === 0)) {
    return null;
  }

  if (!value) {
    return enhanceFieldError(buildFieldError(fieldName, value, `${fieldName} is required`), {
      constraint: 'required',
      suggestions: [`Provide a valid value for ${fieldName}`],
    });
  }

  if (min !== undefined && value.length < min) {
    return enhanceFieldError(
      buildFieldError(fieldName, value, `${fieldName} must be at least ${min} characters`),
      {
        constraint: 'minLength',
        suggestions: [`Use at least ${min} characters for ${fieldName}`],
      }
    );
  }

  if (max !== undefined && value.length > max) {
    return enhanceFieldError(
      buildFieldError(fieldName, value, `${fieldName} must not exceed ${max} characters`),
      {
        constraint: 'maxLength',
        suggestions: [`Keep ${fieldName} under ${max} characters`],
      }
    );
  }

  return null;
}

/**
 * Validates UUID format
 */
export function validateUUID(value: string, fieldName: string): FieldError | null {
  if (!value) {
    return enhanceFieldError(buildFieldError(fieldName, value, `${fieldName} is required`), {
      constraint: 'required',
      suggestions: [`Provide a valid UUID for ${fieldName}`],
    });
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(value)) {
    return enhanceFieldError(
      buildFieldError(fieldName, value, `${fieldName} must be a valid UUID`),
      {
        constraint: 'format',
        suggestions: ['Use a valid UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'],
      }
    );
  }

  return null;
}
