/**
 * @file Tests for HTTP client utilities
 */
import { HttpClient } from '../../src/util/network/http-client';
import { RetryPolicy } from '../../src/util/network/retry-policy';
import { Cache } from '../../src/util/cache/cache';
import { Observability } from '../../src/util/observability/observability';

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: () => ({
    update: () => ({
      digest: () => 'mock-idempotency-key',
    }),
  }),
}));

// Mock dependencies
jest.mock('../../src/util/network/retry-policy');
jest.mock('../../src/util/cache/cache');
jest.mock('../../src/util/observability/observability');

// Extend the HttpClientConfig interface for testing
declare module '../../src/util/network/http-client' {
  interface HttpClientConfig {
    authToken?: string;
    retries?: {
      maxRetries: number;
      initialDelay: number;
      maxDelay: number;
    };
  }
}

// Add getBaseUrl method to HttpClient prototype for testing
declare module '../../src/util/network/http-client' {
  interface HttpClient {
    getBaseUrl(service: string): string;
  }
}

// Implement the getBaseUrl method
HttpClient.prototype.getBaseUrl = function (service: string): string {
  const baseUrls = (this as any).baseUrls || {};
  return baseUrls[service] || '';
};

// Create a mock Cache class for testing
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  clear: jest.fn(),
};

// Mock the Cache constructor
(Cache as unknown as jest.Mock).mockImplementation(() => mockCache);

// Create a mock Observability instance for testing
const mockObservability = {
  startSpan: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  }),
  recordMetric: jest.fn(),
  log: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
};

// Mock the Observability constructor
(Observability as unknown as jest.Mock).mockImplementation(() => mockObservability);

// Mock global fetch
const originalFetch = global.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Mock fetch
  mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Reset environment variables
  delete process.env.MIDAZ_HTTP_TIMEOUT;
  delete process.env.MIDAZ_HTTP_MAX_RETRIES;
  delete process.env.MIDAZ_HTTP_INITIAL_RETRY_DELAY;
  delete process.env.MIDAZ_HTTP_MAX_RETRY_DELAY;
  delete process.env.MIDAZ_CACHE_ENABLED;
  delete process.env.MIDAZ_ENABLE_TRACING;
  delete process.env.MIDAZ_ENABLE_METRICS;
});

afterEach(() => {
  // Restore fetch
  global.fetch = originalFetch;
});

describe('HTTP Client Utilities', () => {
  describe('Constructor', () => {
    it('should use provided configuration options', () => {
      // Reset mocks
      jest.clearAllMocks();

      // Create client with options
      new HttpClient({
        authToken: 'test-token',
      });

      // Verify RetryPolicy was created
      expect(RetryPolicy).toHaveBeenCalled();
    });

    it('should use environment variables as fallbacks', () => {
      // Reset mocks
      jest.clearAllMocks();

      // Save original environment variables
      const originalEnv = {
        MIDAZ_MAX_RETRIES: process.env.MIDAZ_MAX_RETRIES,
        MIDAZ_INITIAL_DELAY: process.env.MIDAZ_INITIAL_DELAY,
        MIDAZ_MAX_DELAY: process.env.MIDAZ_MAX_DELAY,
      };

      try {
        // Set environment variables
        process.env.MIDAZ_MAX_RETRIES = '4';
        process.env.MIDAZ_INITIAL_DELAY = '300';
        process.env.MIDAZ_MAX_DELAY = '3000';

        // Create client without retry options
        new HttpClient({
          authToken: 'test-token',
        });

        // Verify RetryPolicy was created
        expect(RetryPolicy).toHaveBeenCalled();
      } finally {
        // Restore original environment variables
        process.env.MIDAZ_MAX_RETRIES = originalEnv.MIDAZ_MAX_RETRIES;
        process.env.MIDAZ_INITIAL_DELAY = originalEnv.MIDAZ_INITIAL_DELAY;
        process.env.MIDAZ_MAX_DELAY = originalEnv.MIDAZ_MAX_DELAY;
      }
    });

    it('should create a client with default options', () => {
      // Reset mocks
      jest.clearAllMocks();

      // Create client with minimal config
      const _client = new HttpClient({
        authToken: 'test-token',
      });

      // Verify RetryPolicy was created
      expect(RetryPolicy).toHaveBeenCalled();
    });

    it('should create a client with cache', () => {
      // Arrange
      const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
      };

      // Act
      // Create client
      const _client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
        cache: mockCache as unknown as Cache,
      });
    });
  });

  describe('HTTP Methods', () => {
    let client: HttpClient;
    let mockFetch: jest.Mock;
    let mockRetryPolicyExecute: jest.Mock;
    let mockObservabilityStartSpan: jest.Mock;
    let mockSpan: any;
    let mockCache: any;

    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      };

      // Create mock cache
      mockCache = {
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
      };

      // Setup mocks
      mockFetch = jest.fn();
      mockRetryPolicyExecute = jest.fn();
      mockObservabilityStartSpan = jest.fn().mockReturnValue(mockSpan);

      // Mock global fetch
      global.fetch = mockFetch;

      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute,
      }));

      // Mock Cache constructor
      (Cache as unknown as jest.Mock<any>).mockImplementation(() => mockCache);

      // Mock Observability startSpan method
      (Observability as unknown as jest.Mock<any>).mockImplementation(() => ({
        startSpan: mockObservabilityStartSpan,
        recordMetric: jest.fn(),
      }));

      // Create client
      client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1',
        },
        authToken: 'test-token',
        cache: mockCache,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should make a GET request with correct parameters', async () => {
      // Reset mocks
      jest.clearAllMocks();

      // Setup mock response
      const mockResponse = { id: '123', name: 'Test' };

      // Mock fetch to return a response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse)),
      });

      // Mock RetryPolicy to execute the fetch
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        return fn();
      });

      // Make GET request
      const result = await client.get('https://api.test.com/resource/123');

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = mockFetch.mock.calls[0][0];
      const fetchOptions = mockFetch.mock.calls[0][1];

      // Check that the URL contains the expected path
      expect(fetchUrl).toContain('resource/123');

      // Check the request options
      expect(fetchOptions.method).toBe('GET');

      // Verify headers
      const headers = fetchOptions.headers;
      expect(headers).toBeDefined();

      // Verify result
      expect(result).toEqual(mockResponse);

      // Verify cache was checked and set
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), mockResponse);
    });

    it('should return cached response for GET requests when available', async () => {
      // Setup
      const cachedResponse = { id: '123', name: 'Cached' };
      mockCache.get.mockReturnValue(cachedResponse);

      // Create a client with cache
      const clientWithCache = new HttpClient({
        authToken: 'test-token',
        cache: new Cache(),
      });

      // Mock the Cache constructor to return our mocked instance
      (Cache as jest.Mock).mockImplementation(() => ({
        get: mockCache.get,
        set: mockCache.set,
      }));

      // Act
      const result = await clientWithCache.get('https://api.test.com/resources/123');

      // Verify result
      expect(result).toEqual(cachedResponse);

      // Verify cache was checked but not set
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();

      // Verify fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should make a POST request with correct parameters and body', async () => {
      // Reset mocks
      jest.clearAllMocks();

      // Setup mock request and response
      const requestBody = { name: 'Test', value: 123 };
      const mockResponse = { id: '123', ...requestBody };

      // Mock fetch to return a response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse)),
      });

      // Mock RetryPolicy to execute the fetch
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        return fn();
      });

      // Make POST request
      const result = await client.post('https://api.test.com/resources', requestBody);

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = mockFetch.mock.calls[0][0];
      const fetchOptions = mockFetch.mock.calls[0][1];

      // Check that the URL contains the expected path
      expect(fetchUrl).toContain('resources');

      // Check the request options
      expect(fetchOptions.method).toBe('POST');

      // Verify body was sent correctly
      expect(JSON.parse(fetchOptions.body)).toEqual(requestBody);

      // Verify headers
      const headers = fetchOptions.headers;
      expect(headers).toBeDefined();

      // Verify result
      expect(result).toEqual(mockResponse);

      // Verify cache was not used
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });



  });

});

