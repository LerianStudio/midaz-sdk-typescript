/**
 * Universal HTTP Client - Works in any JavaScript environment
 * Uses the Fetch API which is available in modern browsers and Node.js 18+
 */

import { createIdempotencyKey } from '../crypto';
import { UniversalLogger, createLogger } from '../logger/universal-logger';

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  logger?: UniversalLogger;
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

  constructor(options: HttpClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.logger = options.logger || createLogger({ name: 'http-client' });
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(url, options.params);
    const method = options.method || 'GET';
    const headers = this.buildHeaders(options.headers);
    const timeout = options.timeout || this.timeout;
    const retries = options.retries !== undefined ? options.retries : this.retries;

    // Add idempotency key if needed
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Idempotency-Key'] = await createIdempotencyKey(method, fullUrl, JSON.stringify(options.body));
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    // Merge signals if one was provided
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

    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`HTTP ${method} ${fullUrl}`, { attempt, headers });

        const response = await fetch(fullUrl, requestOptions);
        clearTimeout(timeoutId);

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
          attempt 
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

        this.logger.warn(`HTTP ${method} ${fullUrl} - Failed`, {
          attempt,
          error: lastError.message,
        });

        // Don't retry on client errors (4xx)
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry if this was the last attempt
        if (attempt < retries) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Convenience methods
   */
  async get<T = any>(url: string, options?: Omit<RequestOptions, 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(url: string, options?: Omit<RequestOptions, 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`;
    
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
      'Accept': 'application/json',
      ...this.headers,
      ...additionalHeaders,
    };

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(headers).filter(([_, value]) => value !== undefined)
    );
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
    return new Promise(resolve => setTimeout(resolve, ms));
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
}

/**
 * Create a new HTTP client instance
 */
export function createHttpClient(options?: HttpClientOptions): UniversalHttpClient {
  return new UniversalHttpClient(options);
}