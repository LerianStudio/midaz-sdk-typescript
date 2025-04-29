/**
 */

import { ApiResponse, ListOptions, ListResponse } from '../../models/common';
import { HttpClient, RequestOptions } from '../../util/network/http-client';
import { Observability, Span } from '../../util/observability/observability';
import {
  validateRequiredParams as baseValidateRequiredParams,
  ValidationParams,
} from '../interfaces/api-client';
import { UrlBuilder } from '../url-builder';

/**
 * Base HTTP API client that provides common functionality for all HTTP API clients
 *
 * This abstract class implements shared behavior for HTTP operations, error handling,
 * parameter validation, observability, and response processing.
 *
 * @template T - The entity type (e.g., Account, Transaction)
 * @template C - The create input type
 * @template U - The update input type
 */
export abstract class HttpBaseApiClient<T, C = unknown, U = unknown> {
  protected readonly observability: Observability;
  protected readonly apiVersion: string;

  /**
   * Creates a new HttpBaseApiClient
   *
   */
  constructor(
    protected readonly httpClient: HttpClient,
    protected readonly urlBuilder: UrlBuilder,
    protected readonly serviceName: string,
    observability?: Observability
  ) {
    // Use provided observability or create a new one
    this.observability = observability || Observability.getInstance();

    // Get API version from URL builder
    this.apiVersion = this.urlBuilder.getApiVersion();
  }

  /**
   * Makes a GET request with standardized error handling and tracing
   *
   * @returns Promise resolving to the response data
   */
  protected async getRequest<R extends ApiResponse>(
    operationName: string,
    url: string,
    options?: RequestOptions,
    attributes?: Record<string, any>
  ): Promise<R> {
    const span = this.startSpan(operationName, attributes);

    try {
      span.setAttribute('url', url);
      span.setAttribute('apiVersion', this.apiVersion);

      if (options?.params) {
        span.setAttribute('hasParams', true);
        this.setListOptionsAttributes(span, options.params as ListOptions);
      }

      // Add version header to requests
      const requestOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-API-Version': this.apiVersion,
        },
      };

      const result = await this.httpClient.get<R>(url, requestOptions);

      this.recordResponseMetrics(operationName, result, attributes);
      span.setStatus('ok');
      return result;
    } catch (error) {
      this.handleError(span, error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Makes a POST request with standardized error handling and tracing
   *
   * @returns Promise resolving to the response data
   */
  protected async postRequest<R extends ApiResponse>(
    operationName: string,
    url: string,
    data: any,
    options?: RequestOptions,
    attributes?: Record<string, any>
  ): Promise<R> {
    const span = this.startSpan(operationName, attributes);

    try {
      span.setAttribute('url', url);
      span.setAttribute('apiVersion', this.apiVersion);

      // Add version header to requests
      const requestOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-API-Version': this.apiVersion,
        },
      };

      const result = await this.httpClient.post<R>(url, data, requestOptions);

      this.recordResponseMetrics(operationName, result, attributes);
      span.setStatus('ok');
      return result;
    } catch (error) {
      this.handleError(span, error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Makes a PATCH request with standardized error handling and tracing
   *
   * @returns Promise resolving to the response data
   */
  protected async patchRequest<R extends ApiResponse>(
    operationName: string,
    url: string,
    data: any,
    options?: RequestOptions,
    attributes?: Record<string, any>
  ): Promise<R> {
    const span = this.startSpan(operationName, attributes);

    try {
      span.setAttribute('url', url);
      span.setAttribute('apiVersion', this.apiVersion);

      // Add version header to requests
      const requestOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-API-Version': this.apiVersion,
        },
      };

      const result = await this.httpClient.patch<R>(url, data, requestOptions);

      this.recordResponseMetrics(operationName, result, attributes);
      span.setStatus('ok');
      return result;
    } catch (error) {
      this.handleError(span, error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Makes a DELETE request with standardized error handling and tracing
   *
   * @returns Promise resolving to void
   */
  protected async deleteRequest(
    operationName: string,
    url: string,
    options?: RequestOptions,
    attributes?: Record<string, any>
  ): Promise<void> {
    const span = this.startSpan(operationName, attributes);

    try {
      span.setAttribute('url', url);
      span.setAttribute('apiVersion', this.apiVersion);

      // Add version header to requests
      const requestOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-API-Version': this.apiVersion,
        },
      };

      await this.httpClient.delete(url, requestOptions);

      this.recordMetrics(`${operationName}.count`, 1, attributes);
      span.setStatus('ok');
    } catch (error) {
      this.handleError(span, error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Validates required parameters consistently using the common implementation
   *
   */
  protected validateRequiredParams(span: Span, params: ValidationParams): void {
    baseValidateRequiredParams(span, params);
  }

  /**
   * Records metrics for an operation
   *
   */
  protected recordMetrics(name: string, value: number, tags?: Record<string, any>): void {
    this.observability.recordMetric(name, value, tags || {});
  }

  /**
   * Creates a new span with the given attributes
   *
   * @returns The created span
   */
  protected startSpan(operationName: string, attributes?: Record<string, any>): Span {
    const span = this.observability.startSpan(operationName);

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          span.setAttribute(key, value);
        }
      }
    }

    return span;
  }

  /**
   * Records metrics based on the response data
   *
   */
  protected recordResponseMetrics(
    operationName: string,
    response: ApiResponse,
    attributes?: Record<string, any>
  ): void {
    // Record count metric for the operation
    this.recordMetrics(`${operationName}.count`, 1, attributes);

    // If it's a list response, record the count of items
    if ('items' in response && Array.isArray(response.items)) {
      this.recordMetrics(`${operationName}.items.count`, response.items.length, attributes);
    }
  }

  /**
   * Sets attributes on the span for list options
   *
   */
  protected setListOptionsAttributes(span: Span, options: ListOptions): void {
    if (!options) return;

    if (options.limit !== undefined) {
      span.setAttribute('limit', options.limit);
    }

    if (options.offset !== undefined) {
      span.setAttribute('offset', options.offset);
    }

    if (options.filter) {
      span.setAttribute('hasFilters', true);
    }
  }

  /**
   * Handles errors consistently
   *
   */
  protected handleError(span: Span, error: Error): void {
    span.recordException(error);
    span.setStatus('error', error.message);
  }

  /**
   * List resources (base implementation for ApiClient interface)
   * Intended to be overridden by subclasses
   *
   * @returns Promise resolving to list response
   */
  public list?(_listOptions?: ListOptions): Promise<ListResponse<T>> {
    throw new Error('Method not implemented');
  }

  /**
   * Get a resource by ID (base implementation for ApiClient interface)
   * Intended to be overridden by subclasses
   *
   * @returns Promise resolving to resource
   */
  public get?(_resourceId: string): Promise<T> {
    throw new Error('Method not implemented');
  }

  /**
   * Create a resource (base implementation for ApiClient interface)
   * Intended to be overridden by subclasses
   *
   * @returns Promise resolving to created resource
   */
  public create?(_input: C): Promise<T> {
    throw new Error('Method not implemented');
  }

  /**
   * Update a resource (base implementation for ApiClient interface)
   * Intended to be overridden by subclasses
   *
   * @returns Promise resolving to updated resource
   */
  public update?(_id: string, _input: U): Promise<T> {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a resource (base implementation for ApiClient interface)
   * Intended to be overridden by subclasses
   *
   * @returns Promise resolving when deleted
   */
  public delete?(_resourceId: string): Promise<void> {
    throw new Error('Method not implemented');
  }
}
