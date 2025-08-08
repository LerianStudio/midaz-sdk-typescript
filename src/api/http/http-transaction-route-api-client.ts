/**
 * HTTP Transaction Route API Client Implementation
 */

import { HttpBaseApiClient } from './http-base-api-client';
import { TransactionRouteApiClient } from '../interfaces/transaction-route-api-client';
import { TransactionRoute, CreateTransactionRouteInput, UpdateTransactionRouteInput } from '../../models/transaction-route';
import { PaginatedResponse, ListOptions } from '../../models/common';
import { HttpClient } from '../../util/network/http-client';
import { buildQueryParams, UrlBuilder } from '../url-builder';
import { Observability } from '../../util/observability/observability';

/**
 * HTTP implementation of TransactionRouteApiClient
 */
export class HttpTransactionRouteApiClient 
  extends HttpBaseApiClient<TransactionRoute, CreateTransactionRouteInput, UpdateTransactionRouteInput>
  implements TransactionRouteApiClient {
  
  constructor(
    httpClient: HttpClient,
    urlBuilder: UrlBuilder,
    observability?: Observability
  ) {
    super(httpClient, urlBuilder, 'transaction-routes', observability);
  }

  /**
   * List transaction routes for a ledger
   */
  async listTransactionRoutes(
    organizationId: string,
    ledgerId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<TransactionRoute>> {
    const url = this.urlBuilder.buildTransactionRouteUrl(organizationId, ledgerId);
    const queryParams = buildQueryParams(options || {});
    
    return this.getRequest<PaginatedResponse<TransactionRoute>>(
      'listTransactionRoutes',
      `${url}${queryParams}`
    );
  }

  /**
   * Get a specific transaction route
   */
  async getTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<TransactionRoute> {
    const url = this.urlBuilder.buildTransactionRouteUrl(organizationId, ledgerId, transactionRouteId);
    
    return this.getRequest<TransactionRoute>(
      'getTransactionRoute',
      url
    );
  }

  /**
   * Create a new transaction route
   */
  async createTransactionRoute(
    organizationId: string,
    ledgerId: string,
    input: CreateTransactionRouteInput
  ): Promise<TransactionRoute> {
    const url = this.urlBuilder.buildTransactionRouteUrl(organizationId, ledgerId);
    
    return this.postRequest<TransactionRoute>(
      'createTransactionRoute',
      url,
      input
    );
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
    const url = this.urlBuilder.buildTransactionRouteUrl(organizationId, ledgerId, transactionRouteId);
    
    return this.patchRequest<TransactionRoute>(
      'updateTransactionRoute',
      url,
      input
    );
  }

  /**
   * Delete a transaction route
   */
  async deleteTransactionRoute(
    organizationId: string,
    ledgerId: string,
    transactionRouteId: string
  ): Promise<void> {
    const url = this.urlBuilder.buildTransactionRouteUrl(organizationId, ledgerId, transactionRouteId);
    
    return this.deleteRequest(
      'deleteTransactionRoute',
      url
    );
  }
}