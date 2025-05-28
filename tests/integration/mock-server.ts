/**
 * Mock server for integration testing
 */

export interface MockRoute {
  method: string;
  path: string;
  response: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
    delay?: number;
  };
  validator?: (request: MockRequest) => boolean;
}

export interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface MockServerOptions {
  port?: number;
  latency?: number;
  errorRate?: number;
}

/**
 * In-memory mock server for testing
 */
export class MockServer {
  private routes: Map<string, MockRoute> = new Map();
  private requests: MockRequest[] = [];
  private options: Required<MockServerOptions>;
  private interceptor?: (request: MockRequest) => void;

  constructor(options: MockServerOptions = {}) {
    this.options = {
      port: options.port || 3001,
      latency: options.latency || 0,
      errorRate: options.errorRate || 0,
    };
  }

  /**
   * Adds a mock route
   */
  addRoute(route: MockRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  /**
   * Adds multiple routes
   */
  addRoutes(routes: MockRoute[]): void {
    routes.forEach((route) => this.addRoute(route));
  }

  /**
   * Gets all recorded requests
   */
  getRequests(): MockRequest[] {
    return [...this.requests];
  }

  /**
   * Gets requests by path
   */
  getRequestsByPath(path: string): MockRequest[] {
    return this.requests.filter((req) => {
      const url = new URL(req.url, 'http://localhost');
      // Handle API version prefix (e.g., /v1/organizations)
      // Also handle path parameters (e.g., /organizations/:orgId)
      const pathname = url.pathname;
      
      // Exact match
      if (pathname === path) {
        return true;
      }
      
      // Ends with the path (for versioned APIs)
      if (pathname.endsWith(path)) {
        return true;
      }
      
      // Check if the path is a pattern with parameters
      if (path.includes(':')) {
        // Convert path pattern to regex
        const regexPattern = path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(pathname);
      }
      
      return false;
    });
  }

  /**
   * Clears recorded requests
   */
  clearRequests(): void {
    this.requests = [];
  }

  /**
   * Resets the mock server
   */
  reset(): void {
    this.routes.clear();
    this.requests = [];
  }

  /**
   * Sets request interceptor
   */
  setInterceptor(interceptor: (request: MockRequest) => void): void {
    this.interceptor = interceptor;
  }

  /**
   * Creates a fetch interceptor
   */
  createFetchInterceptor(): typeof fetch {
    // Store original fetch for reference (not used directly but helps document the flow)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const originalFetch = globalThis.fetch;
    const mockServer = this;

    return async function mockFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';

      // Parse URL
      const urlObj = new URL(url, 'http://localhost');
      const pathname = urlObj.pathname;
      const searchParams = Object.fromEntries(urlObj.searchParams);

      // Parse body
      let body: any;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            body = JSON.parse(init.body);
          } catch {
            body = init.body;
          }
        } else {
          body = init.body;
        }
      }

      // Create request object
      const request: MockRequest = {
        method,
        url,
        headers: (init?.headers as Record<string, string>) || {},
        body,
        params: searchParams,
      };

      // Record request
      mockServer.requests.push(request);

      // Call interceptor
      if (mockServer.interceptor) {
        mockServer.interceptor(request);
      }

      // Simulate error rate
      if (Math.random() < mockServer.options.errorRate) {
        throw new Error('Network error (simulated)');
      }

      // Find matching route
      const routeKey = `${method}:${pathname}`;
      const route = mockServer.routes.get(routeKey);

      if (!route) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate request if validator provided
      if (route.validator && !route.validator(request)) {
        return new Response(JSON.stringify({ error: 'Bad request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Simulate latency
      const delay = route.response.delay || mockServer.options.latency;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Create response
      const responseBody =
        route.response.body !== undefined ? JSON.stringify(route.response.body) : '';

      return new Response(responseBody, {
        status: route.response.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...route.response.headers,
        },
      });
    };
  }

  /**
   * Installs the mock server
   */
  install(): void {
    (globalThis as any).fetch = this.createFetchInterceptor();
  }

  /**
   * Uninstalls the mock server
   */
  uninstall(): void {
    // Restore original fetch if it was saved
    if ((globalThis as any).__originalFetch) {
      (globalThis as any).fetch = (globalThis as any).__originalFetch;
    }
  }
}

/**
 * Creates standard Midaz API mock routes
 */
export function createMidazMockRoutes(): MockRoute[] {
  return [
    // Organizations
    {
      method: 'GET',
      path: '/v1/organizations',
      response: {
        body: {
          items: [
            {
              id: 'org_123',
              legalName: 'Test Organization',
              status: { code: 'active' },
            },
          ],
        },
      },
    },
    {
      method: 'POST',
      path: '/v1/organizations',
      response: {
        status: 201,
        body: {
          id: 'org_456',
          legalName: 'New Organization',
          status: { code: 'active' },
        },
      },
    },
    // Also add route for retry test
    {
      method: 'GET',
      path: '/v1/organizations',
      response: {
        body: {
          items: [
            {
              id: 'org_123',
              legalName: 'Test Organization',
              status: { code: 'active' },
            },
          ],
        },
      },
    },

    // Ledgers
    {
      method: 'GET',
      path: '/v1/organizations/:orgId/ledgers',
      response: {
        body: {
          items: [
            {
              id: 'ledger_123',
              name: 'Test Ledger',
              status: { code: 'active' },
            },
          ],
        },
      },
    },

    // Accounts
    {
      method: 'GET',
      path: '/v1/organizations/:orgId/ledgers/:ledgerId/accounts',
      response: {
        body: {
          items: [
            {
              id: 'acc_123',
              name: 'Test Account',
              balance: {
                available: 1000,
                onHold: 0,
                scale: 2,
              },
            },
          ],
        },
      },
    },

    // Transactions
    {
      method: 'POST',
      path: '/v1/organizations/:orgId/ledgers/:ledgerId/transactions',
      response: {
        status: 201,
        body: {
          id: 'txn_123',
          amount: 100,
          status: 'completed',
        },
      },
      validator: (req) => {
        return req.body && req.body.amount > 0;
      },
    },

    // Error scenarios
    {
      method: 'GET',
      path: '/v1/error/500',
      response: {
        status: 500,
        body: { error: 'Internal server error' },
      },
    },
    {
      method: 'GET',
      path: '/v1/error/timeout',
      response: {
        delay: 35000, // Longer than default timeout
        body: { message: 'This should timeout' },
      },
    },
  ];
}
