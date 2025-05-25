/**
 * HTTP Client Wrapper - Provides backward compatibility while using the universal HTTP client
 */

import { UniversalHttpClient, HttpClientOptions as UniversalOptions, RequestOptions as UniversalRequestOptions, HttpResponse as UniversalHttpResponse } from '../http/universal-http-client';
import { ConfigService } from '../config';
import { Cache } from '../cache/cache';
import { errorFromHttpResponse } from '../error';
import { Observability, Span } from '../observability/observability';
import { RetryPolicy } from './retry-policy';
import { createLogger } from '../logger/universal-logger';
import { sha256 } from '../crypto';

// Re-export the response interface but redefine to match old behavior
export type HttpResponse<T = any> = T;

/**
 * Options for HTTP requests (backward compatible)
 */
export interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  retryOnStatusCodes?: number[];
  bypassCache?: boolean;
  customCacheKey?: string;
  disableIdempotencyKey?: boolean;
  idempotencyKey?: string;
  useReadonlyCache?: boolean;
  enableStreamingResponse?: boolean;
  signal?: AbortSignal;
}

/**
 * HTTP Client configuration options (backward compatible)
 */
export interface HttpClientOptions {
  baseURL?: string;
  headers?: Record<string, string | undefined>;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeout?: number;
  enableDnsCache?: boolean;
  dnsCacheTTL?: number;
  keepAliveEnabled?: boolean;
  maxSockets?: number;
  maxFreeSockets?: number;
  requestRetryDelay?: number;
  cache?: Cache<any>;
  observability?: Observability;
  reuseCache?: boolean;
  keepSocketAlive?: boolean;
  tlsOptions?: any;
}

/**
 * HTTP Client wrapper that uses the universal HTTP client internally
 */
export class HttpClient {
  private client: UniversalHttpClient;
  private cache?: Cache<any>;
  private observability?: Observability;
  private retryPolicy: RetryPolicy;
  private circuitBreakerState: Map<string, { failures: number; lastFailure: number }> = new Map();
  private circuitBreakerThreshold: number;
  private circuitBreakerResetTimeout: number;

  constructor(options: HttpClientOptions = {}) {
    // Create universal HTTP client
    this.client = new UniversalHttpClient({
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
      headers: this.cleanHeaders(options.headers),
      retries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      logger: createLogger({ name: 'http-client' }),
    });

    this.cache = options.cache;
    this.observability = options.observability;
    this.retryPolicy = new RetryPolicy({
      maxRetries: options.maxRetries || 3,
      initialDelay: options.requestRetryDelay || 1000
    });
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerResetTimeout = options.circuitBreakerResetTimeout || 60000;
  }

  /**
   * Make an HTTP GET request
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Make an HTTP POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * Make an HTTP PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * Make an HTTP PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', url, data, options);
  }

  /**
   * Make an HTTP DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check circuit breaker
    const circuitKey = `${method}:${url}`;
    if (this.isCircuitOpen(circuitKey)) {
      throw new Error(`Circuit breaker is open for ${circuitKey}`);
    }

    // Generate cache key if caching is enabled
    let cacheKey: string | undefined;
    if (this.cache && !options.bypassCache && method === 'GET') {
      cacheKey = options.customCacheKey || await this.generateCacheKey(method, url, options.params);
      
      // Try to get from cache
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Create span for observability
    let span: Span | undefined;
    if (this.observability) {
      span = this.observability.startSpan(`HTTP ${method} ${url}`);
    }

    try {
      // Prepare request options
      const requestOptions: UniversalRequestOptions = {
        method: method as any,
        params: options.params,
        headers: options.headers,
        timeout: options.timeout,
        retries: options.maxRetries,
        idempotencyKey: options.idempotencyKey,
        signal: options.signal,
        body: data,
      };

      // Disable idempotency key if requested
      if (options.disableIdempotencyKey) {
        requestOptions.idempotencyKey = '';
      }

      // Make the request
      const response = await this.client.request<T>(url, requestOptions);

      // Reset circuit breaker on success
      this.circuitBreakerState.delete(circuitKey);

      // Cache successful GET responses
      if (this.cache && cacheKey && method === 'GET') {
        await this.cache.set(cacheKey, response.data);
      }

      // End span
      if (span) {
        span.setAttribute('http.status_code', response.status);
        span.end();
      }

      return response.data;
    } catch (error) {
      // Record circuit breaker failure
      this.recordCircuitFailure(circuitKey);

      // End span with error
      if (span) {
        span.recordException(error as Error);
        span.end();
      }

      throw error;
    }
  }

  /**
   * Clean headers by removing undefined values
   */
  private cleanHeaders(headers?: Record<string, string | undefined>): Record<string, string> {
    if (!headers) return {};
    
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Generate cache key for requests
   */
  private async generateCacheKey(method: string, url: string, params?: any): Promise<string> {
    const keyParts = [method, url];
    if (params) {
      keyParts.push(JSON.stringify(params));
    }
    return sha256(keyParts.join(':'));
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(key: string): boolean {
    const state = this.circuitBreakerState.get(key);
    if (!state) return false;

    const now = Date.now();
    if (now - state.lastFailure > this.circuitBreakerResetTimeout) {
      this.circuitBreakerState.delete(key);
      return false;
    }

    return state.failures >= this.circuitBreakerThreshold;
  }

  /**
   * Record a circuit breaker failure
   */
  private recordCircuitFailure(key: string): void {
    const state = this.circuitBreakerState.get(key) || { failures: 0, lastFailure: 0 };
    state.failures++;
    state.lastFailure = Date.now();
    this.circuitBreakerState.set(key, state);
  }

  /**
   * Set a default header
   */
  setDefaultHeader(key: string, value: string | undefined): void {
    if (value !== undefined) {
      this.client.setDefaultHeader(key, value);
    } else {
      this.client.removeDefaultHeader(key);
    }
  }

  /**
   * Get metrics (for compatibility)
   */
  getMetrics(): any {
    return {
      requests: 0,
      errors: 0,
      retries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Health check (for compatibility)
   */
  isHealthy(): boolean {
    return true;
  }

  /**
   * Shutdown (for compatibility)
   */
  async shutdown(): Promise<void> {
    // No-op for universal client
  }
}