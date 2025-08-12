/**
 * Operation Routes Service Implementation
 */

import { OperationRoutesService } from '../operation-routes';
import {
  OperationRoute,
  CreateOperationRouteInput,
  UpdateOperationRouteInput,
} from '../../models/operation-route';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { OperationRouteApiClient } from '../../api/interfaces/operation-route-api-client';
import { Observability } from '../../util/observability/observability';
import { logger } from '../../util/observability/logger-instance';

/**
 * Implementation of OperationRoutesService
 */
export class OperationRoutesServiceImpl implements OperationRoutesService {
  constructor(
    private readonly apiClient: OperationRouteApiClient,
    private readonly observability?: Observability
  ) {}

  /**
   * List operation routes for a ledger
   */
  async listOperationRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<OperationRoute>> {
    const span = this.observability?.startSpan('OperationRoutesService.listOperationRoutes');

    try {
      logger.debug('Listing operation routes', {
        organizationId,
        ledgerId,
        options,
      });

      const result = await this.apiClient.listOperationRoutes(organizationId, ledgerId, options);

      logger.debug('Operation routes listed successfully', {
        organizationId,
        ledgerId,
        count: result.items.length,
        total: result.totalCount,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to list operation routes', {
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
   * Get a specific operation route
   */
  async getOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<OperationRoute> {
    const span = this.observability?.startSpan('OperationRoutesService.getOperationRoute');

    try {
      logger.debug('Getting operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
      });

      const result = await this.apiClient.getOperationRoute(
        organizationId,
        ledgerId,
        operationRouteId
      );

      logger.debug('Operation route retrieved successfully', {
        organizationId,
        ledgerId,
        operationRouteId,
        operationRouteTitle: result.title,
        operationType: result.operationType,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to get operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
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
   * Create a new operation route
   */
  async createOperationRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateOperationRouteInput
  ): Promise<OperationRoute> {
    const span = this.observability?.startSpan('OperationRoutesService.createOperationRoute');

    try {
      logger.debug('Creating operation route', {
        organizationId,
        ledgerId,
        input: {
          title: input.title,
          operationType: input.operationType,
          hasDescription: !!input.description,
          hasAccount: !!input.account,
          hasMetadata: !!input.metadata,
        },
      });

      // Basic validation
      if (!input.title?.trim()) {
        throw new Error('Operation route title is required');
      }
      if (!input.description?.trim()) {
        throw new Error('Operation route description is required');
      }
      if (!input.operationType) {
        throw new Error('Operation route type is required');
      }
      if (!['source', 'destination'].includes(input.operationType)) {
        throw new Error('Operation route type must be "source" or "destination"');
      }

      const result = await this.apiClient.createOperationRoute(organizationId, ledgerId, input);

      logger.info('Operation route created successfully', {
        organizationId,
        ledgerId,
        operationRouteId: result.id,
        operationRouteTitle: result.title,
        operationType: result.operationType,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to create operation route', {
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
   * Update an existing operation route
   */
  async updateOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string,
    input: UpdateOperationRouteInput
  ): Promise<OperationRoute> {
    const span = this.observability?.startSpan('OperationRoutesService.updateOperationRoute');

    try {
      logger.debug('Updating operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
        input: {
          hasTitle: !!input.title,
          hasDescription: !!input.description,
          hasAccount: !!input.account,
          hasMetadata: !!input.metadata,
        },
      });

      const result = await this.apiClient.updateOperationRoute(
        organizationId,
        ledgerId,
        operationRouteId,
        input
      );

      logger.info('Operation route updated successfully', {
        organizationId,
        ledgerId,
        operationRouteId,
        operationRouteTitle: result.title,
        operationType: result.operationType,
      });

      span?.setStatus('ok'); // SUCCESS
      return result;
    } catch (error) {
      logger.error('Failed to update operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
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
   * Delete an operation route
   */
  async deleteOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<void> {
    const span = this.observability?.startSpan('OperationRoutesService.deleteOperationRoute');

    try {
      logger.debug('Deleting operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
      });

      await this.apiClient.deleteOperationRoute(organizationId, ledgerId, operationRouteId);

      logger.info('Operation route deleted successfully', {
        organizationId,
        ledgerId,
        operationRouteId,
      });

      span?.setStatus('ok'); // SUCCESS
    } catch (error) {
      logger.error('Failed to delete operation route', {
        organizationId,
        ledgerId,
        operationRouteId,
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
