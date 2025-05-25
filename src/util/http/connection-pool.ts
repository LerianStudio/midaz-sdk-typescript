/**
 * HTTP Connection Pool Manager
 * Manages concurrent HTTP requests with configurable limits
 */

export interface ConnectionPoolOptions {
  /**
   * Maximum number of concurrent connections per host
   * @default 6
   */
  maxConnectionsPerHost?: number;

  /**
   * Maximum total concurrent connections
   * @default 20
   */
  maxTotalConnections?: number;

  /**
   * Maximum number of queued requests
   * @default 100
   */
  maxQueueSize?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  requestTimeout?: number;

  /**
   * Whether to enable request coalescing (deduplication)
   * @default true
   */
  enableCoalescing?: boolean;

  /**
   * Time window for request coalescing in milliseconds
   * @default 100
   */
  coalescingWindow?: number;
}

interface QueuedRequest {
  url: string;
  options: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  timestamp: number;
  abortController: AbortController;
}

interface HostConnectionState {
  activeConnections: number;
  queue: QueuedRequest[];
}

/**
 * Connection pool manager for HTTP requests
 */
export class ConnectionPool {
  private hostStates: Map<string, HostConnectionState> = new Map();
  private totalActiveConnections = 0;
  private options: Required<ConnectionPoolOptions>;
  private coalescingCache: Map<string, Promise<Response>> = new Map();
  private requestIdCounter = 0;

  constructor(options: ConnectionPoolOptions = {}) {
    this.options = {
      maxConnectionsPerHost: options.maxConnectionsPerHost || 6,
      maxTotalConnections: options.maxTotalConnections || 20,
      maxQueueSize: options.maxQueueSize || 100,
      requestTimeout: options.requestTimeout || 30000,
      enableCoalescing: options.enableCoalescing !== false,
      coalescingWindow: options.coalescingWindow || 100,
    };
  }

  /**
   * Executes a fetch request through the connection pool
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const requestKey = this.getRequestKey(url, options);

    // Check for request coalescing
    if (this.options.enableCoalescing && options.method === 'GET') {
      const cachedPromise = this.coalescingCache.get(requestKey);
      if (cachedPromise) {
        return cachedPromise;
      }
    }

    const promise = this.executeFetch(url, options);

    // Add to coalescing cache for GET requests
    if (this.options.enableCoalescing && options.method === 'GET') {
      this.coalescingCache.set(requestKey, promise);

      // Remove from cache after coalescing window
      setTimeout(() => {
        this.coalescingCache.delete(requestKey);
      }, this.options.coalescingWindow);
    }

    return promise;
  }

  /**
   * Executes the actual fetch request with connection management
   */
  private async executeFetch(url: string, options: RequestInit): Promise<Response> {
    const host = this.getHost(url);
    const hostState = this.getOrCreateHostState(host);

    // Check if we can make the request immediately
    if (this.canMakeRequest(host)) {
      return this.makeRequest(url, options, host);
    }

    // Queue the request
    return this.queueRequest(url, options, host, hostState);
  }

  /**
   * Checks if a request can be made immediately
   */
  private canMakeRequest(host: string): boolean {
    const hostState = this.hostStates.get(host);
    const hostConnections = hostState?.activeConnections || 0;

    return (
      hostConnections < this.options.maxConnectionsPerHost &&
      this.totalActiveConnections < this.options.maxTotalConnections
    );
  }

  /**
   * Makes an HTTP request and manages connection state
   */
  private async makeRequest(url: string, options: RequestInit, host: string): Promise<Response> {
    const hostState = this.getOrCreateHostState(host);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.options.requestTimeout);

    // Merge abort signals if one was provided
    const signal = options.signal
      ? this.mergeSignals(options.signal, abortController.signal)
      : abortController.signal;

    // Update connection counts
    hostState.activeConnections++;
    this.totalActiveConnections++;

    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
      return response;
    } finally {
      // Update connection counts
      hostState.activeConnections--;
      this.totalActiveConnections--;

      // Process queue for this host
      this.processQueue(host);
    }
  }

  /**
   * Queues a request for later execution
   */
  private queueRequest(
    url: string,
    options: RequestInit,
    host: string,
    hostState: HostConnectionState
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (hostState.queue.length >= this.options.maxQueueSize) {
        reject(new Error(`Request queue full for host: ${host}`));
        return;
      }

      const abortController = new AbortController();
      const queuedRequest: QueuedRequest = {
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
        abortController,
      };

      hostState.queue.push(queuedRequest);
    });
  }

  /**
   * Processes the queue for a specific host
   */
  private processQueue(host: string): void {
    const hostState = this.hostStates.get(host);
    if (!hostState || hostState.queue.length === 0) {
      return;
    }

    // Process as many queued requests as possible
    while (hostState.queue.length > 0 && this.canMakeRequest(host)) {
      const request = hostState.queue.shift()!;

      // Skip if request has been aborted
      if (request.abortController.signal.aborted) {
        continue;
      }

      // Execute the queued request
      this.makeRequest(request.url, request.options, host)
        .then(request.resolve)
        .catch(request.reject);
    }
  }

  /**
   * Gets or creates host state
   */
  private getOrCreateHostState(host: string): HostConnectionState {
    let state = this.hostStates.get(host);
    if (!state) {
      state = {
        activeConnections: 0,
        queue: [],
      };
      this.hostStates.set(host, state);
    }
    return state;
  }

  /**
   * Extracts host from URL
   */
  private getHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Creates a request key for coalescing
   */
  private getRequestKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    return `${method}:${url}:${headers}`;
  }

  /**
   * Merges two abort signals
   */
  private mergeSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();
    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);

    return controller.signal;
  }

  /**
   * Gets current pool statistics
   */
  getStats(): {
    totalActiveConnections: number;
    hostStates: Array<{ host: string; activeConnections: number; queuedRequests: number }>;
  } {
    const hostStates = Array.from(this.hostStates.entries()).map(([host, state]) => ({
      host,
      activeConnections: state.activeConnections,
      queuedRequests: state.queue.length,
    }));

    return {
      totalActiveConnections: this.totalActiveConnections,
      hostStates,
    };
  }

  /**
   * Clears all queued requests and resets the pool
   */
  reset(): void {
    // Reject all queued requests
    for (const [, hostState] of this.hostStates) {
      for (const request of hostState.queue) {
        request.reject(new Error('Connection pool reset'));
      }
    }

    // Clear all state
    this.hostStates.clear();
    this.coalescingCache.clear();
    this.totalActiveConnections = 0;
  }

  /**
   * Destroys the connection pool
   */
  destroy(): void {
    this.reset();
  }
}
