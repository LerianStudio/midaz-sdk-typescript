/**
 * HTTP Operation Route API Client Implementation
 */

import { HttpBaseApiClient } from './http-base-api-client';
import { OperationRouteApiClient } from '../interfaces/operation-route-api-client';
import { OperationRoute, CreateOperationRouteInput, UpdateOperationRouteInput } from '../../models/operation-route';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { HttpClient } from '../../util/network/http-client';
import { buildQueryParams, UrlBuilder } from '../url-builder';
import { Observability } from '../../util/observability/observability';

/**
 * HTTP implementation of OperationRouteApiClient
 */
export class HttpOperationRouteApiClient 
  extends HttpBaseApiClient<OperationRoute, CreateOperationRouteInput, UpdateOperationRouteInput>
  implements OperationRouteApiClient {
  
  constructor(
    httpClient: HttpClient,
    urlBuilder: UrlBuilder,
    observability?: Observability
  ) {
    super(httpClient, urlBuilder, 'operation-routes', observability);
  }

  /**
   * List operation routes for a ledger
   */
  async listOperationRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<OperationRoute>> {
    const url = this.urlBuilder.buildOperationRouteUrl(organizationId, ledgerId);
    const queryParams = buildQueryParams(options || {});
    
    return this.getRequest<PaginatedResponse<OperationRoute>>(
      'listOperationRoutes',
      `${url}${queryParams}`
    );
  }

  /**
   * Get a specific operation route
   */
  async getOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<OperationRoute> {
    const url = this.urlBuilder.buildOperationRouteUrl(organizationId, ledgerId, operationRouteId);
    
    return this.getRequest<OperationRoute>(
      'getOperationRoute',
      url
    );
  }

  /**
   * Create a new operation route
   */
  async createOperationRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateOperationRouteInput
  ): Promise<OperationRoute> {
    const url = this.urlBuilder.buildOperationRouteUrl(organizationId, ledgerId);
    
    return this.postRequest<OperationRoute>(
      'createOperationRoute',
      url,
      input
    );
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
    const url = this.urlBuilder.buildOperationRouteUrl(organizationId, ledgerId, operationRouteId);
    
    return this.patchRequest<OperationRoute>(
      'updateOperationRoute',
      url,
      input
    );
  }

  /**
   * Delete an operation route
   */
  async deleteOperationRoute(
    organizationId: string,
    ledgerId: string,
    operationRouteId: string
  ): Promise<void> {
    const url = this.urlBuilder.buildOperationRouteUrl(organizationId, ledgerId, operationRouteId);
    
    return this.deleteRequest(
      'deleteOperationRoute',
      url
    );
  }
}