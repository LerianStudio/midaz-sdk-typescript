/**
 * Transaction Routes Service Interface
 */

import { TransactionRoute, CreateTransactionRouteInput, UpdateTransactionRouteInput } from '../models/transaction-route';
import { PaginatedResponse, ListOptions } from '../models/common';

/**
 * Service interface for Transaction Route operations
 * 
 * Transaction routes define routing configuration for transactions,
 * specifying how transactions should be processed using operation routes.
 */
export interface TransactionRoutesService {
  /**
   * Retrieve a paginated list of transaction routes for a ledger
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param options - Optional list options for pagination and filtering
   * @returns Promise resolving to paginated transaction routes
   * 
   * @example
   * ```typescript
   * const transactionRoutes = await client.entities.transactionRoutes.listTransactionRoutes(
   *   'org_123',
   *   'ledger_456', 
   *   { limit: 10, page: 1 }
   * );
   * 
   * console.log(`Found ${transactionRoutes.items.length} transaction routes`);
   * transactionRoutes.items.forEach(route => {
   *   console.log(`${route.title}: ${route.operationRoutes.length} operation routes`);
   * });
   * ```
   */
  listTransactionRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<TransactionRoute>>;

  /**
   * Retrieve a specific transaction route by ID
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID
   * @returns Promise resolving to the transaction route
   * 
   * @example
   * ```typescript
   * const transactionRoute = await client.entities.transactionRoutes.getTransactionRoute(
   *   'org_123',
   *   'ledger_456',
   *   'txroute_789'
   * );
   * 
   * console.log(`Transaction Route: ${transactionRoute.title}`);
   * console.log(`Description: ${transactionRoute.description}`);
   * console.log(`Operation Routes: ${transactionRoute.operationRoutes.join(', ')}`);
   * ```
   */
  getTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<TransactionRoute>;

  /**
   * Create a new transaction route
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param input - The transaction route creation data
   * @returns Promise resolving to the created transaction route
   * 
   * @example
   * ```typescript
   * import { createTransactionRouteBuilder } from 'midaz-sdk';
   * 
   * const input = createTransactionRouteBuilder(
   *   'Standard Payment Route',
   *   'Route for standard payment transactions',
   *   ['opRoute_source_123', 'opRoute_destination_456']
   * )
   *   .withMetadata({
   *     category: 'payment',
   *     flow: 'standard'
   *   })
   *   .build();
   * 
   * const transactionRoute = await client.entities.transactionRoutes.createTransactionRoute(
   *   'org_123',
   *   'ledger_456',
   *   input
   * );
   * 
   * console.log(`Created transaction route: ${transactionRoute.id}`);
   * ```
   */
  createTransactionRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateTransactionRouteInput
  ): Promise<TransactionRoute>;

  /**
   * Update an existing transaction route
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID to update
   * @param input - The transaction route update data
   * @returns Promise resolving to the updated transaction route
   * 
   * @example
   * ```typescript
   * import { createUpdateTransactionRouteBuilder } from 'midaz-sdk';
   * 
   * const input = createUpdateTransactionRouteBuilder()
   *   .withTitle('Enhanced Payment Route')
   *   .withDescription('Enhanced route for payment transactions with validation')
   *   .addOperationRoute('opRoute_validation_789')
   *   .withMetadata({
   *     category: 'payment',
   *     flow: 'enhanced',
   *     updated: new Date().toISOString()
   *   })
   *   .build();
   * 
   * const transactionRoute = await client.entities.transactionRoutes.updateTransactionRoute(
   *   'org_123',
   *   'ledger_456',
   *   'txroute_789',
   *   input
   * );
   * 
   * console.log(`Updated transaction route: ${transactionRoute.title}`);
   * ```
   */
  updateTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string,
    input: UpdateTransactionRouteInput
  ): Promise<TransactionRoute>;

  /**
   * Delete a transaction route
   * 
   * @param organizationId - The organization ID
   * @param ledgerId - The ledger ID
   * @param transactionRouteId - The transaction route ID to delete
   * @returns Promise resolving when the transaction route is deleted
   * 
   * @example
   * ```typescript
   * await client.entities.transactionRoutes.deleteTransactionRoute(
   *   'org_123',
   *   'ledger_456',
   *   'txroute_789'
   * );
   * 
   * console.log('Transaction route deleted successfully');
   * ```
   */
  deleteTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<void>;
}