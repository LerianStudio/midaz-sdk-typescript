import { createHash } from 'crypto';
import * as dns from 'dns';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { URL } from 'url';

// Import these at the top to avoid require statements
import { ConfigService } from '../config';

import { Cache } from '../cache/cache';
import { errorFromHttpResponse } from '../error';
import { Observability, Span } from '../observability/observability';

import { RetryPolicy } from './retry-policy';

/**
 * Options for HTTP requests
 */
export interface RequestOptions {
  /**
   * Query parameters to include in the URL
   * These will be automatically encoded and appended to the URL
   */
  params?: Record<string, any>;

  /**
   * Request timeout in milliseconds
   * Overrides the default timeout set in the HttpClient constructor
   */
  timeout?: number;

  /**
   * AbortSignal for cancellation
   * Can be used to manually cancel a request
   */
  signal?: AbortSignal;

  /**
   * Custom idempotency key for the request
   * If provided, this key will be used instead of generating a random one
   * Useful for ensuring that a request is only processed once, even if sent multiple times
   */
  idempotencyKey?: string;

  /**
   * Custom headers to include in the request
   * These headers will be merged with the default headers
   */
  headers?: Record<string, string>;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /**
   * Base URLs for different services
   * Example: { 'onboarding': 'https://api.midaz.io/v1/onboarding', 'transaction': 'https://api.midaz.io/v1/transaction' }
   */
  baseUrls?: Record<string, string>;

  /**
   * Default timeout for requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Retry policy for failed requests
   */
  retryPolicy?: RetryPolicy;

  /**
   * Cache configuration
   */
  cache?: Cache;

  /**
   * Observability provider for tracing and metrics
   */
  observability?: Observability;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Additional headers to include in all requests
   */
  headers?: Record<string, string>;

  /**
   * Whether to include the idempotency key header in requests
   * @default true
   */
  useIdempotencyKey?: boolean;

  /**
   * Name of the idempotency key header
   * @default 'Idempotency-Key'
   */
  idempotencyKeyHeader?: string;

  /**
   * Whether to enable connection keep-alive
   * @default true
   */
  keepAlive?: boolean;

  /**
   * Maximum number of sockets to allow per host
   * Controls connection pooling capacity
   * @default 10
   */
  maxSockets?: number;

  /**
   * Time in milliseconds to keep idle connections open
   * @default 60000 (60 seconds)
   */
  keepAliveMsecs?: number;

  /**
   * Whether to enable HTTP/2 where available
   * @default true
   */
  enableHttp2?: boolean;

  /**
   * DNS cache TTL in milliseconds
   * Set to 0 to disable DNS caching
   * @default 300000 (5 minutes)
   */
  dnsCacheTtl?: number;

  /**
   * SSL/TLS configuration options
   */
  tlsOptions?: {
    /**
     * Whether to reject unauthorized certificates
     * @default true
     */
    rejectUnauthorized?: boolean;

    /**
     * Custom CA certificates to trust
     */
    ca?: Buffer | Buffer[] | string | string[];

    /**
     * Client certificate for mutual TLS
     */
    cert?: Buffer | string;

    /**
     * Client key for mutual TLS
     */
    key?: Buffer | string;
  };
}

/**
 * HTTP client for making API requests
 *
 * This client provides a robust implementation with:
 * - Automatic retries for transient failures
 * - Caching for GET requests
 * - Observability with tracing and metrics
 * - Consistent error handling
 * - Support for multiple base URLs
 * - Connection pooling and keep-alive for performance
 * - DNS caching for reduced latency
 *
 * @example
 * ```typescript
 * // Create an HTTP client with default configuration
 * const httpClient = new HttpClient({
 *   baseUrls: {
 *     onboarding: 'https://api.midaz.io/v1/onboarding',
 *     transaction: 'https://api.midaz.io/v1/transaction'
 *   },
 *   apiKey: 'your-api-key',
 *   debug: true,
 *   keepAlive: true,
 *   maxSockets: 20
 * });
 *
 * // Make a GET request
 * const response = await httpClient.get(
 *   'onboarding/organizations',
 *   { params: { limit: 10 } }
 * );
 *
 * // Make a POST request
 * const newOrg = await httpClient.post(
 *   'onboarding/organizations',
 *   { name: 'New Organization' }
 * );
 *
 * // Check connection stats
 * const stats = httpClient.getConnectionStats();
 * console.log(`Active HTTPS connections: ${stats.httpsConnections.active}`);
 *
 * // Clean up resources when done
 * httpClient.destroy();
 * ```
 */
export type HttpClientInterface = {
  /**
   * Makes a GET request
   * @returns A promise that resolves to the response
   */
  get<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Makes a POST request
   * @returns A promise that resolves to the response
   */
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Makes a PUT request
   * @returns A promise that resolves to the response
   */
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Makes a PATCH request
   * @returns A promise that resolves to the response
   */
  patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Makes a DELETE request
   * @returns A promise that resolves to the response
   */
  delete<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Gets the base URL for a specific service
   * @returns The base URL for the service
   */
  getBaseUrl(service: string): string;

  /**
   * Updates the client configuration
   *
   * This method allows updating the configuration after the client has been created.
   * It's particularly useful for updating base URLs and authentication credentials
   * without having to recreate the client.
   *
   */
  updateConfig(config: Partial<HttpClientConfig>): void;

  /**
   * Gets current connection pool statistics
   *
   * Returns information about active and idle connections in the pool.
   *
   * @returns Object containing HTTP and HTTPS connection statistics
   */
  getConnectionStats(): {
    httpConnections: { active: number; idle: number; total: number };
    httpsConnections: { active: number; idle: number; total: number };
  };

  /**
   * Destroys all idle connections in the connection pool
   *
   * This method can be used to free up resources when the client is not
   * expected to be used for a while, but you don't want to completely
   * destroy the client.
   *
   * @returns The number of connections that were destroyed
   */
  closeIdleConnections(): number;

  /**
   * Completely destroys the HTTP client, closing all connections
   *
   * This method should be called when you're completely done with the client
   * to free up resources. After calling this method, the client should not be used.
   */
  destroy(): void;
};

/**
 * Creates a new HTTP client
 *
 */
export class HttpClient implements HttpClientInterface {
  /**
   * Base URLs for different services
   * @private
   */
  private baseUrls: Record<string, string>;

  /**
   * Default timeout for requests in milliseconds
   * @private
   */
  private timeout: number;

  /**
   * API key for authentication
   * @private
   */
  private apiKey?: string;

  /**
   * Retry policy for failed requests
   * @private
   */
  private retryPolicy: RetryPolicy;

  /**
   * Cache for GET requests
   * @private
   */
  private cache?: Cache;

  /**
   * Observability provider for tracing and metrics
   * @private
   */
  private observability?: Observability;

  /**
   * Whether to enable debug logging
   * @private
   */
  private debug: boolean;

  /**
   * Additional headers to include in all requests
   * @private
   */
  private headers: Record<string, string>;

  /**
   * Whether to include the idempotency key header in requests
   * @private
   */
  private useIdempotencyKey: boolean;

  /**
   * Name of the idempotency key header
   * @private
   */
  private idempotencyKeyHeader: string;

  /**
   * HTTP agent for connection pooling (for HTTP URLs)
   * @private
   */
  private httpAgent: HttpAgent;

  /**
   * HTTPS agent for connection pooling (for HTTPS URLs)
   * @private
   */
  private httpsAgent: HttpsAgent;

  /**
   * Whether to enable connection keep-alive
   * @private
   */
  private keepAlive: boolean;

  /**
   * Maximum number of sockets to allow per host
   * @private
   */
  private maxSockets: number;

  /**
   * Time in milliseconds to keep idle connections open
   * @private
   */
  private keepAliveMsecs: number;

  /**
   * Whether to enable HTTP/2 where available
   * @private
   */
  private enableHttp2: boolean;

  /**
   * DNS cache TTL in milliseconds
   * @private
   */
  private dnsCacheTtl: number;

  /**
   * SSL/TLS configuration options
   * @private
   */
  private tlsOptions?: {
    /**
     * Whether to reject unauthorized certificates
     * @default true
     */
    rejectUnauthorized?: boolean;

    /**
     * Custom CA certificates to trust
     */
    ca?: Buffer | Buffer[] | string | string[];

    /**
     * Client certificate for mutual TLS
     */
    cert?: Buffer | string;

    /**
     * Client key for mutual TLS
     */
    key?: Buffer | string;
  };

  /**
   * Creates a new HTTP client
   *
   */
  constructor(config: HttpClientConfig = {}) {
    // Get the config service instance
    const configService = ConfigService.getInstance();

    // Get API URL configuration from ConfigService
    const apiUrlConfig = configService.getApiUrlConfig();
    // Get HTTP configuration from ConfigService with explicit type casting to avoid conflicts
    const httpConfig = configService.getHttpClientConfig() as any;

    // Initialize base URLs
    this.baseUrls = config.baseUrls || {};

    // Apply URLs from ConfigService if not provided in config
    if (!this.baseUrls.onboarding) {
      this.baseUrls.onboarding = apiUrlConfig.onboardingUrl;
    }
    if (!this.baseUrls.transaction) {
      this.baseUrls.transaction = apiUrlConfig.transactionUrl;
    }

    // Initialize timeout from ConfigService or config
    this.timeout = config.timeout || httpConfig.timeout;

    // Initialize API key from config or ConfigService
    this.apiKey = config.apiKey || httpConfig.apiKey;

    // Initialize retry policy
    this.retryPolicy = config.retryPolicy || new RetryPolicy();

    // Initialize cache
    this.cache = config.cache;

    // Initialize observability
    this.observability = config.observability;

    // Initialize debug mode from config or ConfigService
    this.debug = config.debug !== undefined ? config.debug : httpConfig.debug;

    // Initialize headers
    this.headers = config.headers || {};

    // Initialize idempotency key settings
    this.useIdempotencyKey = config.useIdempotencyKey !== false;
    this.idempotencyKeyHeader = config.idempotencyKeyHeader || 'Idempotency-Key';

    // Initialize connection management settings from config or ConfigService
    this.keepAlive = config.keepAlive !== undefined ? config.keepAlive : httpConfig.keepAlive;
    this.maxSockets = config.maxSockets || httpConfig.maxSockets;
    this.keepAliveMsecs = config.keepAliveMsecs || httpConfig.keepAliveMsecs;
    this.enableHttp2 =
      config.enableHttp2 !== undefined ? config.enableHttp2 : httpConfig.enableHttp2;
    this.dnsCacheTtl =
      config.dnsCacheTtl !== undefined ? config.dnsCacheTtl : httpConfig.dnsCacheTtl;
    this.tlsOptions = config.tlsOptions;

    // Initialize connection pooling with agents
    this.httpAgent = new HttpAgent({
      keepAlive: this.keepAlive,
      keepAliveMsecs: this.keepAliveMsecs,
      maxSockets: this.maxSockets,
    });

    this.httpsAgent = new HttpsAgent({
      keepAlive: this.keepAlive,
      keepAliveMsecs: this.keepAliveMsecs,
      maxSockets: this.maxSockets,
      // Apply TLS options if provided
      ...(this.tlsOptions || {}),
    });

    // Log connection settings if debug is enabled
    if (this.debug) {
      console.log(`[HttpClient] Initialized with connection settings:`, {
        keepAlive: this.keepAlive,
        maxSockets: this.maxSockets,
        keepAliveMsecs: this.keepAliveMsecs,
        enableHttp2: this.enableHttp2,
        dnsCacheTtl: this.dnsCacheTtl,
      });
    }
  }

  /**
   * Makes a GET request
   *
   * @returns Promise resolving to the response data
   *
   * @example
   * ```typescript
   * // Get a list of organizations
   * const orgs = await httpClient.get('onboarding/organizations', {
   *   params: { limit: 10, status: 'active' }
   * });
   * ```
   */
  public async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    // Start a span for tracing
    const span = this.startSpan('HttpClient.get', { url });

    try {
      // Check cache if available
      if (this.cache) {
        const cacheKey = this.getCacheKey('GET', url, options.params);
        const cachedResponse = this.cache.get<T>(cacheKey);

        if (cachedResponse) {
          span.setAttribute('cache', 'hit');
          span.setStatus('ok');
          span.end();

          return cachedResponse;
        }

        span.setAttribute('cache', 'miss');
      }

      // Make the request
      const response = await this.request<T>('GET', url, undefined, options);

      // Cache the response if cache is available
      if (this.cache) {
        const cacheKey = this.getCacheKey('GET', url, options.params);
        this.cache.set(cacheKey, response);
      }

      span.setStatus('ok');
      span.end();

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      throw error;
    }
  }

  /**
   * Makes a POST request
   *
   * @returns Promise resolving to the response data
   *
   * @example
   * ```typescript
   * // Create a new organization
   * const newOrg = await httpClient.post('onboarding/organizations', {
   *   name: 'New Organization',
   *   status: 'active'
   * });
   * ```
   */
  public async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const span = this.startSpan('HttpClient.post', { url });

    try {
      const response = await this.request<T>('POST', url, data, options);

      span.setStatus('ok');
      span.end();

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      throw error;
    }
  }

  /**
   * Makes a PUT request
   *
   * @returns Promise resolving to the response data
   *
   * @example
   * ```typescript
   * // Update an organization
   * const updatedOrg = await httpClient.put('onboarding/organizations/org_123', {
   *   status: 'inactive'
   * });
   * ```
   */
  public async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const span = this.startSpan('HttpClient.put', { url });

    try {
      const response = await this.request<T>('PUT', url, data, options);

      span.setStatus('ok');
      span.end();

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      throw error;
    }
  }

  /**
   * Makes a PATCH request
   *
   * @returns Promise resolving to the response data
   *
   * @example
   * ```typescript
   * // Partially update an organization
   * const patchedOrg = await httpClient.patch('onboarding/organizations/org_123', {
   *   status: 'inactive'
   * });
   * ```
   */
  public async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const span = this.startSpan('HttpClient.patch', { url });

    try {
      const response = await this.request<T>('PATCH', url, data, options);

      span.setStatus('ok');
      span.end();

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      throw error;
    }
  }

  /**
   * Makes a DELETE request
   *
   * @returns Promise resolving to the response data
   *
   * @example
   * ```typescript
   * // Delete an organization
   * await httpClient.delete('onboarding/organizations/org_123');
   * ```
   */
  public async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const span = this.startSpan('HttpClient.delete', { url });

    try {
      const response = await this.request<T>('DELETE', url, undefined, options);

      span.setStatus('ok');
      span.end();

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      throw error;
    }
  }

  /**
   * Gets the base URL for a specific service
   *
   * @returns The base URL for the service
   */
  public getBaseUrl(service: string): string {
    return this.baseUrls[service];
  }

  /**
   * Updates the client configuration
   *
   * This method allows updating the configuration after the client has been created.
   * It's particularly useful for updating base URLs and authentication credentials
   * without having to recreate the client.
   *
   */
  public updateConfig(config: Partial<HttpClientConfig>): void {
    // Update base URLs if provided
    if (config.baseUrls) {
      this.baseUrls = { ...this.baseUrls, ...config.baseUrls };
    }

    // Update API key if provided
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }

    // Update timeout if provided
    if (config.timeout) {
      this.timeout = config.timeout;
    }

    // Update retry policy if provided
    if (config.retryPolicy) {
      this.retryPolicy = config.retryPolicy;
    }

    // Update cache if provided
    if (config.cache) {
      this.cache = config.cache;
    }

    // Update debug setting if provided
    if (config.debug !== undefined) {
      this.debug = config.debug;
    }

    // Update additional headers if provided
    if (config.headers) {
      this.headers = { ...this.headers, ...config.headers };
    }

    // Update idempotency key settings if provided
    if (config.useIdempotencyKey !== undefined) {
      this.useIdempotencyKey = config.useIdempotencyKey;
    }

    if (config.idempotencyKeyHeader) {
      this.idempotencyKeyHeader = config.idempotencyKeyHeader;
    }

    // Update connection management settings if provided
    if (
      config.keepAlive !== undefined ||
      config.maxSockets !== undefined ||
      config.keepAliveMsecs !== undefined ||
      config.tlsOptions
    ) {
      // Get updated values
      if (config.keepAlive !== undefined) {
        this.keepAlive = config.keepAlive;
      }

      if (config.maxSockets !== undefined) {
        this.maxSockets = config.maxSockets;
      }

      if (config.keepAliveMsecs !== undefined) {
        this.keepAliveMsecs = config.keepAliveMsecs;
      }

      if (config.tlsOptions) {
        this.tlsOptions = { ...this.tlsOptions, ...config.tlsOptions };
      }

      // Create new agents with updated settings
      this.httpAgent = new HttpAgent({
        keepAlive: this.keepAlive,
        keepAliveMsecs: this.keepAliveMsecs,
        maxSockets: this.maxSockets,
      });

      this.httpsAgent = new HttpsAgent({
        keepAlive: this.keepAlive,
        keepAliveMsecs: this.keepAliveMsecs,
        maxSockets: this.maxSockets,
        // Apply TLS options if provided
        ...(this.tlsOptions || {}),
      });

      if (this.debug) {
        console.log(`[HttpClient] Updated connection settings:`, {
          keepAlive: this.keepAlive,
          maxSockets: this.maxSockets,
          keepAliveMsecs: this.keepAliveMsecs,
        });
      }
    }

    // Update DNS cache TTL if provided
    if (config.dnsCacheTtl !== undefined) {
      this.dnsCacheTtl = config.dnsCacheTtl;
    }
  }

  /**
   * Gets the current connection pool statistics
   *
   * @returns Connection pool statistics
   */
  public getConnectionStats(): {
    httpConnections: {
      active: number;
      idle: number;
      total: number;
    };
    httpsConnections: {
      active: number;
      idle: number;
      total: number;
    };
  } {
    // Get statistics for HTTP agent
    const httpSockets = this.httpAgent.sockets;
    const httpFreeSockets = this.httpAgent.freeSockets || {};

    // Get statistics for HTTPS agent
    const httpsSockets = this.httpsAgent.sockets;
    const httpsFreeSockets = this.httpsAgent.freeSockets || {};

    // Calculate totals
    const httpActive = Object.values(httpSockets).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
    const httpIdle = Object.values(httpFreeSockets).reduce(
      (sum, arr) => sum + (arr?.length ?? 0),
      0
    );
    const httpsActive = Object.values(httpsSockets).reduce(
      (sum, arr) => sum + (arr?.length ?? 0),
      0
    );
    const httpsIdle = Object.values(httpsFreeSockets).reduce(
      (sum, arr) => sum + (arr?.length ?? 0),
      0
    );

    return {
      httpConnections: {
        active: httpActive,
        idle: httpIdle,
        total: httpActive + httpIdle,
      },
      httpsConnections: {
        active: httpsActive,
        idle: httpsIdle,
        total: httpsActive + httpsIdle,
      },
    };
  }

  /**
   * Destroys all idle connections in the connection pool
   *
   * This method can be used to free up resources when the client is not
   * expected to be used for a while, but you don't want to completely
   * destroy the client.
   *
   * @returns The number of connections that were destroyed
   */
  public closeIdleConnections(): number {
    // Count total connections that will be closed
    const stats = this.getConnectionStats();
    const totalIdle = stats.httpConnections.idle + stats.httpsConnections.idle;

    // Destroy all idle connections in HTTP agent
    if (this.httpAgent.freeSockets) {
      Object.keys(this.httpAgent.freeSockets).forEach((key) => {
        const sockets = this.httpAgent.freeSockets?.[key];
        if (sockets) {
          // Destroy each socket individually
          while (sockets.length > 0) {
            const socket = sockets.pop();
            if (socket) socket.destroy();
          }
        }
      });
    }

    // Destroy all idle connections in HTTPS agent
    if (this.httpsAgent.freeSockets) {
      Object.keys(this.httpsAgent.freeSockets).forEach((key) => {
        const sockets = this.httpsAgent.freeSockets?.[key];
        if (sockets) {
          // Destroy each socket individually
          while (sockets.length > 0) {
            const socket = sockets.pop();
            if (socket) socket.destroy();
          }
        }
      });
    }

    if (this.debug) {
      console.log(`[HttpClient] Closed ${totalIdle} idle connections`);
    }

    return totalIdle;
  }

  /**
   * Completely destroys the HTTP client, closing all connections
   *
   * This method should be called when you're completely done with the client
   * to free up resources. After calling this method, the client should not be used.
   */
  public destroy(): void {
    // Destroy all sockets (both active and idle)
    this.httpAgent.destroy();
    this.httpsAgent.destroy();

    if (this.debug) {
      console.log(`[HttpClient] Destroyed all connections`);
    }
  }

  /**
   * Makes an HTTP request with retry logic
   *
   * @returns Promise resolving to the response data
   * @private
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    // Start a span for tracing
    const span = this.startSpan('HttpClient.request', { method, url });

    try {
      // Determine the full URL
      const fullUrl = this.buildUrl(url);

      // Parse the URL to determine which agent to use
      const parsedUrl = new URL(fullUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      // Prepare request options
      const requestOptions = {
        method,
        headers: this.buildHeaders(method, options),
        timeout: options.timeout || this.timeout,
        signal: options.signal,
        // Use the appropriate agent for connection pooling
        agent: isHttps ? this.httpsAgent : this.httpAgent,
      };

      // Add query parameters to URL if provided
      const urlWithParams = options.params
        ? `${fullUrl}${this.buildQueryString(options.params)}`
        : fullUrl;

      // Add body if method is not GET or DELETE
      if (method !== 'GET' && method !== 'DELETE' && data !== undefined) {
        (requestOptions as any).body = JSON.stringify(data);
      }

      // Log request if debug is enabled
      if (this.debug) {
        console.log(`[HttpClient] ${method} ${urlWithParams}`);
        if (data) {
          console.log(`[HttpClient] Request body:`, JSON.stringify(data));
        }
      }

      // Execute request with retry logic
      const response = await this.retryPolicy.execute(
        async () => {
          const response = await fetch(urlWithParams, requestOptions);
          // Handle non-successful responses
          if (!response.ok) {
            // Use the errorFromHttpResponse helper with the correct number of arguments

            throw errorFromHttpResponse(
              response.status,
              await this.parseResponseBody(response),
              method,
              url
            );
          }

          // Parse and return response body
          return this.parseResponseBody(response);
        },
        // Track retry attempts in the span
        (info) => {
          if (info.attempt === 0) {
            // First attempt - set the max retries attribute
            span.setAttribute('retry.max_attempts', info.maxRetries);
          } else {
            // Retry attempt - record the attempt number and delay
            span.setAttribute('retry.attempt', info.attempt);
            span.setAttribute('retry.count', info.attempt);
            if (info.delay) {
              span.setAttribute('retry.delay_ms', info.delay);
            }
          }
        }
      );

      // Log response if debug is enabled
      if (this.debug) {
        console.log(`[HttpClient] Response:`, response);
      }

      span.setStatus('ok');
      span.end();

      return response as T;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus('error', (error as Error).message);
      span.end();

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Builds the full URL for a request
   *
   * @returns Full URL
   * @private
   */
  private buildUrl(url: string): string {
    // If the URL is already a full URL (starts with http:// or https://), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Check if the URL already includes a service prefix
    const parts = url.split('/');
    const servicePrefix = parts[0];

    // If the service prefix is a known base URL, use it
    if (this.baseUrls[servicePrefix]) {
      const path = parts.slice(1).join('/');
      return `${this.baseUrls[servicePrefix]}/${path}`;
    }

    // If no service prefix is found, use the onboarding base URL by default
    return `${this.baseUrls.onboarding}/${url}`;
  }

  /**
   * Builds headers for a request
   *
   * @returns Headers object
   * @private
   */
  private buildHeaders(method: string, options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.headers,
      ...(options.headers || {}), // Merge headers from options
    };

    // Add API key if available and no Authorization header is present in options
    if (this.apiKey && !options.headers?.['Authorization']) {
      headers['Authorization'] = this.apiKey;
    }

    // Add idempotency key for non-GET requests if enabled
    if (this.useIdempotencyKey && method !== 'GET') {
      headers[this.idempotencyKeyHeader] = options.idempotencyKey || this.generateIdempotencyKey();
    }

    return headers;
  }

  /**
   * Builds a query string from parameters
   *
   * @returns Query string starting with '?'
   * @private
   */
  private buildQueryString(params: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array parameters
          for (const item of value) {
            searchParams.append(`${key}[]`, String(item));
          }
        } else if (typeof value === 'object') {
          // Handle object parameters
          searchParams.append(key, JSON.stringify(value));
        } else {
          // Handle primitive parameters
          searchParams.append(key, String(value));
        }
      }
    }

    return `?${searchParams.toString()}`;
  }

  /**
   * Parses the response body based on content type
   *
   * @returns Parsed response body
   * @private
   */
  private async parseResponseBody(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType && contentType.includes('text/')) {
      return response.text();
    }

    // For other content types, return as text
    return response.text();
  }

  /**
   * Generates a cache key for a request
   *
   * @returns Cache key
   * @private
   */
  private getCacheKey(method: string, url: string, params?: Record<string, any>): string {
    const fullUrl = this.buildUrl(url);
    const urlWithParams = params ? `${fullUrl}${this.buildQueryString(params)}` : fullUrl;

    return `${method}:${urlWithParams}`;
  }

  /**
   * Generates a random idempotency key
   *
   * @returns Idempotency key
   * @private
   */
  private generateIdempotencyKey(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Creates a DNS lookup function with caching
   *
   * @returns Lookup function for the http.Agent
   * @private
   */
  private createCachedLookup(ttl: number): (hostname: string, options: any, callback: any) => void {
    // Create a cache for DNS lookups
    const dnsCache = new Map<string, { expires: number; addresses: string[]; family: number }>();

    // Return a lookup function that uses the cache
    return (hostname: string, options: any, callback: any) => {
      const now = Date.now();
      const cacheKey = `${hostname}:${options.family || 0}`;

      // Check if we have a cached entry that's still valid
      const cached = dnsCache.get(cacheKey);
      if (cached && cached.expires > now) {
        const address = cached.addresses[0];
        process.nextTick(() => callback(null, address, cached.family));
        return;
      }

      // If not in cache or expired, do a fresh lookup
      dns.lookup(hostname, options, (err: Error | null, address: string, family: number) => {
        if (err) {
          callback(err);
          return;
        }

        // Cache the result
        dnsCache.set(cacheKey, {
          expires: now + ttl,
          addresses: [address],
          family,
        });

        callback(null, address, family);
      });
    };
  }

  /**
   * Starts a span for tracing
   *
   * @returns Span object
   * @private
   */
  private startSpan(name: string, attributes: Record<string, any> = {}): Span {
    if (this.observability) {
      return this.observability.startSpan(name, attributes);
    }

    // Return a no-op span if observability is not available
    return {
      setAttribute: () => {
        /* empty setAttribute */
      },
      recordException: () => {
        /* empty recordException */
      },
      setStatus: () => {
        /* empty setStatus */
      },
      end: () => {
        /* empty end */
      },
    };
  }
}
