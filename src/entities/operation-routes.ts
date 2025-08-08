/**
 * Operation Routes Service Interface
 */

import { OperationRoute, CreateOperationRouteInput, UpdateOperationRouteInput } from '../models/operation-route';
import { PaginatedResponse, ListOptions } from '../models/common';

/**
 * Service interface for Operation Route operations
 * 
 * Operation routes define routing configuration for operations,
 * specifying how operations should be processed and directed.
 */
export interface OperationRoutesService {
  /**
   * Retrieve a paginated list of operation routes for a ledger
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated operation routes
   * 
   * @example
   * ```typescript
   * const operationRoutes = await client.entities.operationRoutes.listOperationRoutes(
   *   'org_123',
   *   'ledger_456',
   *   { limit: 10, page: 1 }
   * );
   * 
   * console.log(`Found ${operationRoutes.items.length} operation routes`);
   * operationRoutes.items.forEach(route => {
   *   console.log(`${route.title}: ${route.operationType}`);
   * });
   * ```
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
   * 
   * @example
   * ```typescript
   * const operationRoute = await client.entities.operationRoutes.getOperationRoute(
   *   'org_123',
   *   'ledger_456',
   *   'route_789'
   * );
   * 
   * console.log(`Operation Route: ${operationRoute.title}`);
   * console.log(`Type: ${operationRoute.operationType}`);
   * if (operationRoute.account) {
   *   console.log(`Account Rule: ${operationRoute.account.ruleType}`);
   * }
   * ```
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
   * 
   * @example
   * ```typescript
   * import { createOperationRouteBuilder } from 'midaz-sdk';
   * 
   * const input = createOperationRouteBuilder(
   *   'Payment Source',
   *   'Route for payment source operations',
   *   'source'
   * )
   *   .withAccountAlias('payment-account')
   *   .withMetadata({
   *     category: 'payment',
   *     priority: 'high'
   *   })
   *   .build();
   * 
   * const operationRoute = await client.entities.operationRoutes.createOperationRoute(
   *   'org_123',
   *   'ledger_456',
   *   input
   * );
   * 
   * console.log(`Created operation route: ${operationRoute.id}`);
   * ```
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
   * 
   * @example
   * ```typescript
   * import { createUpdateOperationRouteBuilder } from 'midaz-sdk';
   * 
   * const input = createUpdateOperationRouteBuilder()
   *   .withTitle('Updated Payment Source')
   *   .withDescription('Updated route for payment source operations')
   *   .withAccountTypes(['cash', 'digital'])
   *   .withMetadata({
   *     category: 'payment',
   *     priority: 'critical',
   *     updated: new Date().toISOString()
   *   })
   *   .build();
   * 
   * const operationRoute = await client.entities.operationRoutes.updateOperationRoute(
   *   'org_123',
   *   'ledger_456',
   *   'route_789',
   *   input
   * );
   * 
   * console.log(`Updated operation route: ${operationRoute.title}`);
   * ```
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
   * 
   * @example
   * ```typescript
   * await client.entities.operationRoutes.deleteOperationRoute(
   *   'org_123',
   *   'ledger_456',
   *   'route_789'
   * );
   * 
   * console.log('Operation route deleted successfully');
   * ```
   */
  deleteOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<void>;
}