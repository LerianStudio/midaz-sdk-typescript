/**
 * Transaction Routes Service Implementation
 */

import { TransactionRoutesService } from '../transaction-routes';
import {
  TransactionRoute,
  CreateTransactionRouteInput,
  UpdateTransactionRouteInput,
} from '../../models/transaction-route';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { TransactionRouteApiClient } from '../../api/interfaces/transaction-route-api-client';
import { Observability } from '../../util/observability/observability';
import { logger } from '../../util/observability/logger-instance';

/**
 * Implementation of TransactionRoutesService
 */
export class TransactionRoutesServiceImpl implements TransactionRoutesService {
  constructor(
    private readonly apiClient: TransactionRouteApiClient,
    private readonly observability?: Observability
  ) {}

  /**
   * List transaction routes for a ledger
   */
  async listTransactionRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<TransactionRoute>> {
    const span = this.observability?.startSpan('TransactionRoutesService.listTransactionRoutes');

    try {
      logger.debug('Listing transaction routes', {
        organizationId,
        ledgerId,
        options,
      });

      const result = await this.apiClient.listTransactionRoutes(organizationId, ledgerId, options);

      logger.debug('Transaction routes listed successfully', {
        organizationId,
        ledgerId,
        count: result.items.length,
        total: result.totalCount,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to list transaction routes', {
        organizationId,
        ledgerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Get a specific transaction route
   */
  async getTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<TransactionRoute> {
    const span = this.observability?.startSpan('TransactionRoutesService.getTransactionRoute');

    try {
      logger.debug('Getting transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
      });

      const result = await this.apiClient.getTransactionRoute(
        organizationId,
        ledgerId,
        transactionRouteId
      );

      logger.debug('Transaction route retrieved successfully', {
        organizationId,
        ledgerId,
        transactionRouteId,
        transactionRouteTitle: result.title,
        operationRoutesCount: result.operationRoutes.length,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to get transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Create a new transaction route
   */
  async createTransactionRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateTransactionRouteInput
  ): Promise<TransactionRoute> {
    const span = this.observability?.startSpan('TransactionRoutesService.createTransactionRoute');

    try {
      logger.debug('Creating transaction route', {
        organizationId,
        ledgerId,
        input: {
          title: input.title,
          hasDescription: !!input.description,
          operationRoutesCount: input.operationRoutes?.length || 0,
          hasMetadata: !!input.metadata,
        },
      });

      // Basic validation
      if (!input.title?.trim()) {
        throw new Error('Transaction route title is required');
      }
      if (!input.description?.trim()) {
        throw new Error('Transaction route description is required');
      }
      if (!input.operationRoutes || input.operationRoutes.length === 0) {
        throw new Error('At least one operation route is required');
      }

      // Validate operation route IDs
      const invalidRoutes = input.operationRoutes.filter((routeId) => !routeId?.trim());
      if (invalidRoutes.length > 0) {
        throw new Error('All operation route IDs must be non-empty strings');
      }

      const result = await this.apiClient.createTransactionRoute(organizationId, ledgerId, input);

      logger.info('Transaction route created successfully', {
        organizationId,
        ledgerId,
        transactionRouteId: result.id,
        transactionRouteTitle: result.title,
        operationRoutesCount: result.operationRoutes.length,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to create transaction route', {
        organizationId,
        ledgerId,
        inputTitle: input.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Update an existing transaction route
   */
  async updateTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string,
    input: UpdateTransactionRouteInput
  ): Promise<TransactionRoute> {
    const span = this.observability?.startSpan('TransactionRoutesService.updateTransactionRoute');

    try {
      logger.debug('Updating transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
        input: {
          hasTitle: !!input.title,
          hasDescription: !!input.description,
          hasOperationRoutes: !!input.operationRoutes,
          operationRoutesCount: input.operationRoutes?.length || 0,
          hasMetadata: !!input.metadata,
        },
      });

      // Validate operation route IDs if provided
      if (input.operationRoutes) {
        const invalidRoutes = input.operationRoutes.filter((routeId) => !routeId?.trim());
        if (invalidRoutes.length > 0) {
          throw new Error('All operation route IDs must be non-empty strings');
        }
      }

      const result = await this.apiClient.updateTransactionRoute(
        organizationId,
        ledgerId,
        transactionRouteId,
        input
      );

      logger.info('Transaction route updated successfully', {
        organizationId,
        ledgerId,
        transactionRouteId,
        transactionRouteTitle: result.title,
        operationRoutesCount: result.operationRoutes.length,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to update transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Delete a transaction route
   */
  async deleteTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<void> {
    const span = this.observability?.startSpan('TransactionRoutesService.deleteTransactionRoute');

    try {
      logger.debug('Deleting transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
      });

      await this.apiClient.deleteTransactionRoute(organizationId, ledgerId, transactionRouteId);

      logger.info('Transaction route deleted successfully', {
        organizationId,
        ledgerId,
        transactionRouteId,
      });

      span?.setStatus('ok'); // SUCCESS
    } catch (error) {
      logger.error('Failed to delete transaction route', {
        organizationId,
        ledgerId,
        transactionRouteId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      span?.recordException(error as Error);
      span?.setStatus('error', (error as Error).message); // ERROR
      throw error;
    } finally {
      span?.end();
    }
  }
}
