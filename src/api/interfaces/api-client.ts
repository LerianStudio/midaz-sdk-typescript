/**
 */

import { ListOptions, ListResponse } from '../../models/common';
import { Observability } from '../../util/observability/observability';

/**
 * Base interface for API clients
 *
 * Defines the common operations that all entity API clients should support.
 * Specific entity API clients will extend this interface with entity-specific
 * methods and parameters.
 *
 * @template T - The entity type that this API client handles
 * @template C - The create input type
 * @template U - The update input type
 */
export interface ApiClient<T, C = unknown, U = unknown> {
  /**
   * Lists entities with optional filtering and pagination
   *
   * @returns Promise resolving to a paginated list of entities
   */
  list?(options?: ListOptions): Promise<ListResponse<T>>;

  /**
   * Gets a single entity by its ID
   *
   * @returns Promise resolving to the entity
   */
  get?(id: string): Promise<T>;

  /**
   * Creates a new entity
   *
   * @returns Promise resolving to the created entity
   */
  create?(input: C): Promise<T>;

  /**
   * Updates an existing entity
   *
   * @returns Promise resolving to the updated entity
   */
  update?(id: string, input: U): Promise<T>;

  /**
   * Deletes an entity
   *
   * @returns Promise resolving when the entity is deleted
   */
  delete?(id: string): Promise<void>;
}

/**
 * Type-safe parameter validation record
 * Allows only string, number, boolean, or undefined values for validation
 */
export type ValidationParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Validates required parameters and throws an error if any are missing
 *
 * This utility function is for API clients to validate required parameters
 * in a consistent way across all clients. The service layer should not
 * perform this validation.
 *
 * @throws Error if any parameter is falsy (undefined, null, empty string)
 */
export function validateRequiredParams(
  span: ReturnType<Observability['startSpan']>,
  params: ValidationParams
): void {
  for (const [key, value] of Object.entries(params)) {
    if (!value && value !== 0 && value !== false) {
      // Allow 0 and false as valid values
      const error = new Error(`${key} is required`);
      span.recordException(error);
      throw error;
    }
  }
}
