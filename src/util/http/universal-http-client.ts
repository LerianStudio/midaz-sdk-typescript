/**
 * Universal HTTP Client - Works in any JavaScript environment
 * Uses the Fetch API which is available in modern browsers and Node.js 18+
 */

import { createIdempotencyKey } from '../crypto';
import { createLogger, UniversalLogger } from '../logger/universal-logger';
import { sanitizeHeaders } from '../security/sanitizer';
import { ConnectionPool, ConnectionPoolOptions } from './connection-pool';
import { TimeoutBudget } from '../timeout/timeout-budget';
import { MetricsCollector } from '../monitoring/metrics';
import { CorrelationManager } from '../tracing/correlation';

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  logger?: UniversalLogger;
  enforceHttps?: boolean; // Whether to enforce HTTPS (default: true in production)
  allowInsecureHttp?: boolean; // Explicitly allow HTTP (for development/testing)
  certificateValidation?: {
    enabled?: boolean; // Whether to validate certificates (default: true)
    rejectUnauthorized?: boolean; // Reject requests with invalid certificates (default: true)
    ca?: string[]; // Custom CA certificates (for environments that support it)
    minVersion?: 'TLSv1.2' | 'TLSv1.3'; // Minimum TLS version (default: TLSv1.2)
  };
  connectionPool?: ConnectionPoolOptions; // Connection pool configuration
  enableTimeoutBudget?: boolean; // Whether to use timeout budget tracking (default: true)
  minRequestTimeout?: number; // Minimum timeout per request when using budget (default: 1000)
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutBudget?: TimeoutBudget; // Optional timeout budget for retry tracking
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Universal HTTP Client implementation
 */
export class UniversalHttpClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;
  private retries: number;
  private retryDelay: number;
  private logger: UniversalLogger;
  private enforceHttps: boolean;
  private allowInsecureHttp: boolean;
  private certificateValidation?: HttpClientOptions['certificateValidation'];
  private connectionPool: ConnectionPool;
  private enableTimeoutBudget: boolean;
  private minRequestTimeout: number;
  private metrics: MetricsCollector;
  private correlationManager: CorrelationManager;

  constructor(options: HttpClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.logger = options.logger || createLogger({ name: 'http-client' });

    // Default to NOT enforcing HTTPS since MIDAZ backend doesn't support SSL yet
    // Users can explicitly enable HTTPS enforcement when the backend is ready
    this.enforceHttps = options.enforceHttps || false;
    this.allowInsecureHttp = options.allowInsecureHttp !== false; // Default to true for backward compatibility
    this.certificateValidation = options.certificateValidation;

    // Initialize connection pool
    this.connectionPool = new ConnectionPool(options.connectionPool);

    // Initialize timeout budget settings
    this.enableTimeoutBudget = options.enableTimeoutBudget !== false;
    this.minRequestTimeout = options.minRequestTimeout || 1000;

    // Initialize metrics collector
    this.metrics = MetricsCollector.getInstance();

    // Initialize correlation manager
    this.correlationManager = CorrelationManager.getInstance();
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(url, options.params);
    const method = options.method || 'GET';
    const headers = this.buildHeaders(options.headers);
    const baseTimeout = options.timeout || this.timeout;
    const retries = options.retries !== undefined ? options.retries : this.retries;

    // Create or use existing timeout budget
    const timeoutBudget =
      options.timeoutBudget ||
      (this.enableTimeoutBudget
        ? new TimeoutBudget({
            totalTimeout: baseTimeout * (retries + 1), // Total budget for all attempts
            minRequestTimeout: this.minRequestTimeout,
          })
        : null);

    // Log certificate validation settings for HTTPS requests
    if (fullUrl.startsWith('https://') && this.certificateValidation) {
      this.logger.debug('HTTPS request with certificate validation settings', {
        url: fullUrl,
        certificateValidation: {
          enabled: this.certificateValidation.enabled !== false,
          rejectUnauthorized: this.certificateValidation.rejectUnauthorized !== false,
          minVersion: this.certificateValidation.minVersion || 'TLSv1.2',
        },
      });
    }

    // Add idempotency key if needed
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Idempotency-Key'] = await createIdempotencyKey(
        method,
        fullUrl,
        JSON.stringify(options.body)
      );
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Check timeout budget
      if (timeoutBudget && !timeoutBudget.hasRemainingBudget()) {
        throw new Error(`Timeout budget exhausted after ${attempt} attempts`);
      }

      // Calculate timeout for this attempt
      const attemptTimeout = timeoutBudget
        ? timeoutBudget.getNextTimeout(baseTimeout)
        : baseTimeout;

      if (attemptTimeout === 0) {
        throw new Error('Insufficient timeout budget for request');
      }

      // Create abort controller for this attempt
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), attemptTimeout);

      // Merge signals
      const signal = options.signal
        ? this.mergeSignals(options.signal, abortController.signal)
        : abortController.signal;

      const requestOptions: RequestInit = {
        method,
        headers,
        signal,
      };

      // Add body if present
      if (options.body !== undefined) {
        if (headers['Content-Type'] === 'application/json') {
          requestOptions.body = JSON.stringify(options.body);
        } else {
          requestOptions.body = options.body;
        }
      }
      try {
        this.logger.debug(`HTTP ${method} ${fullUrl}`, {
          attempt,
          headers: sanitizeHeaders(headers),
          timeout: attemptTimeout,
          budgetRemaining: timeoutBudget?.getRemainingBudget(),
        });

        const requestTimer = this.metrics.timer('http_request_duration');
        const response = await this.connectionPool.fetch(fullUrl, requestOptions);
        clearTimeout(timeoutId);
        const duration = requestTimer.end();

        // Record metrics
        const path = new URL(fullUrl).pathname;
        this.metrics.recordHttpRequest(method, path, response.status, duration);

        if (!response.ok) {
          const errorBody = await this.parseErrorResponse(response);
          throw new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            errorBody
          );
        }

        const data = await this.parseResponse<T>(response);

        this.logger.debug(`HTTP ${method} ${fullUrl} - Success`, {
          status: response.status,
          attempt,
        });

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        // Record error metrics
        this.metrics.increment('http_errors_total', 1, {
          method,
          error: lastError.name || 'unknown',
          attempt: String(attempt),
        });

        this.logger.warn(`HTTP ${method} ${fullUrl} - Failed`, {
          attempt,
          error: lastError.message,
        });

        // Don't retry on client errors (4xx)
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry if this was the last attempt or out of budget
        if (attempt < retries) {
          const delayTime = this.retryDelay * (attempt + 1);

          // Check if we have budget for the delay
          if (timeoutBudget && timeoutBudget.getRemainingBudget() < delayTime) {
            throw new Error('Insufficient timeout budget for retry delay');
          }

          await this.delay(delayTime);
        }
      }
    }

    const finalError = lastError || new Error('Request failed after all retries');
    throw this.correlationManager ? this.correlationManager.enhanceError(finalError) : finalError;
  }

  /**
   * Convenience methods
   */
  async get<T = any>(
    url: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(
    url: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(
    url: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    let url = path.startsWith('http') ? path : `${this.baseURL}${path}`;

    // Only enforce HTTPS if explicitly enabled
    if (this.enforceHttps && url.startsWith('http://')) {
      this.logger.info('Upgrading HTTP URL to HTTPS due to enforceHttps setting', {
        originalUrl: url,
      });
      url = url.replace(/^http:\/\//, 'https://');
    }

    // Only warn about insecure connections if HTTPS enforcement is enabled but not upgrading
    if (url.startsWith('http://') && this.enforceHttps && this.allowInsecureHttp) {
      this.logger.warn('Using insecure HTTP connection despite enforceHttps setting', { url });
    }

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${searchParams.toString()}`;
  }

  /**
   * Build headers
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.headers,
      ...additionalHeaders,
    };

    // Remove undefined values
    return Object.fromEntries(Object.entries(headers).filter(([_, value]) => value !== undefined));
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text() as any;
    } else {
      return response.blob() as any;
    }
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    } catch {
      return null;
    }
  }

  /**
   * Delay for retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Merge abort signals
   */
  private mergeSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();
    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);

    return controller.signal;
  }

  /**
   * Update base configuration
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  setDefaultHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.headers[key];
  }

  getDefaultHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  /**
   * Gets connection pool statistics
   */
  getConnectionPoolStats() {
    return this.connectionPool.getStats();
  }

  /**
   * Resets the connection pool
   */
  resetConnectionPool(): void {
    this.connectionPool.reset();
  }

  /**
   * Destroys the HTTP client and cleans up resources
   */
  destroy(): void {
    this.connectionPool.destroy();
    // Note: Don't destroy metrics here as it's a singleton shared across clients
  }
}

/**
 * Create a new HTTP client instance
 */
export function createHttpClient(options?: HttpClientOptions): UniversalHttpClient {
  return new UniversalHttpClient(options);
}
