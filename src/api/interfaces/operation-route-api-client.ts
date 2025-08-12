/**
 * Operation Route API Client Interface
 */

import { ApiClient } from './api-client';
import {
  OperationRoute,
  CreateOperationRouteInput,
  UpdateOperationRouteInput,
} from '../../models/operation-route';
import { PaginatedResponse, ListOptions } from '../../models/common';

/**
 * Interface for Operation Route API operations
 */
export interface OperationRouteApiClient
  extends ApiClient<OperationRoute, CreateOperationRouteInput, UpdateOperationRouteInput> {
  /**
   * Retrieve a paginated list of operation routes for a ledger
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated operation routes
   */
  listOperationRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<OperationRoute>>;

  /**
   * Retrieve a specific operation route by ID
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param operationRouteId - The operation route ID
   * @returns Promise resolving to the operation route
   */
  getOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<OperationRoute>;

  /**
   * Create a new operation route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param input - The operation route creation data
   * @returns Promise resolving to the created operation route
   */
  createOperationRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateOperationRouteInput
  ): Promise<OperationRoute>;

  /**
   * Update an existing operation route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param operationRouteId - The operation route ID to update
   * @param input - The operation route update data
   * @returns Promise resolving to the updated operation route
   */
  updateOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string,
    input: UpdateOperationRouteInput
  ): Promise<OperationRoute>;

  /**
   * Delete an operation route
   *
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param operationRouteId - The operation route ID to delete
   * @returns Promise resolving when the operation route is deleted
   */
  deleteOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<void>;
}
