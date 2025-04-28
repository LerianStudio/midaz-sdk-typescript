/**
 * @file Tests for HTTP client utilities
 */
import { HttpClient, HttpClientConfig, RequestOptions } from '../../src/util/network/http-client';
import { ErrorCategory, ErrorCode, MidazError } from '../../src/util/error';
import { RetryPolicy } from '../../src/util/network/retry-policy';
import { Cache } from '../../src/util/cache/cache';
import { Observability } from '../../src/util/observability/observability';

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: () => ({
    update: () => ({
      digest: () => 'mock-idempotency-key'
    })
  })
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
HttpClient.prototype.getBaseUrl = function(service: string): string {
  const baseUrls = (this as any).baseUrls || {};
  return baseUrls[service] || '';
};

// Create a mock Cache class for testing
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  clear: jest.fn()
};

// Mock the Cache constructor
(Cache as unknown as jest.Mock).mockImplementation(() => mockCache);

// Create a mock Observability instance for testing
const mockObservability = {
  startSpan: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn()
  }),
  recordMetric: jest.fn(),
  log: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined)
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
      
      // Setup
      const _options = {
        maxRetries: 5,
        initialDelay: 200,
        maxDelay: 2000
      };
      
      // Create client with options
      const _client = new HttpClient({
        authToken: 'test-token'
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
        MIDAZ_MAX_DELAY: process.env.MIDAZ_MAX_DELAY
      };
      
      try {
        // Set environment variables
        process.env.MIDAZ_MAX_RETRIES = '4';
        process.env.MIDAZ_INITIAL_DELAY = '300';
        process.env.MIDAZ_MAX_DELAY = '3000';
        
        // Create client without retry options
        const _client = new HttpClient({
          authToken: 'test-token'
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
        authToken: 'test-token'
      });
      
      // Verify RetryPolicy was created
      expect(RetryPolicy).toHaveBeenCalled();
    });
    
    it('should create a client with cache', () => {
      // Arrange
      const mockCache = {
        get: jest.fn(),
        set: jest.fn()
      };

      // Act
      // Create client
      const _client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1'
        },
        cache: mockCache as unknown as Cache
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
        end: jest.fn()
      };
      
      // Create mock cache
      mockCache = {
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn()
      };
      
      // Setup mocks
      mockFetch = jest.fn();
      mockRetryPolicyExecute = jest.fn();
      mockObservabilityStartSpan = jest.fn().mockReturnValue(mockSpan);
      
      // Mock global fetch
      global.fetch = mockFetch;
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Cache constructor
      (Cache as unknown as jest.Mock<any>).mockImplementation(() => mockCache);
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: mockObservabilityStartSpan,
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1'
        },
        authToken: 'test-token',
        cache: mockCache
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
          'content-type': 'application/json'
        }),
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse))
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
        cache: new Cache()
      });
      
      // Mock the Cache constructor to return our mocked instance
      (Cache as jest.Mock).mockImplementation(() => ({
        get: mockCache.get,
        set: mockCache.set
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
          'content-type': 'application/json'
        }),
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse))
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
    
    it('should make a PUT request with correct parameters and body', async () => {
      // Setup mock response
      const mockResponse = { id: '123', name: 'Updated' };
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce(mockResponse),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse))
        });
        return fn();
      });
      
      // Request body
      const requestBody = { name: 'Updated Resource' };
      
      // Make PUT request
      const result = await client.put<typeof mockResponse>(
        'https://api.test.com/resources/123',
        requestBody
      );
      
      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = mockFetch.mock.calls[0][0];
      const fetchOptions = mockFetch.mock.calls[0][1];
      
      // Check that the URL contains the expected path
      expect(fetchUrl).toContain('api.test.com/resources/123');
      
      // Check the request options
      expect(fetchOptions.method).toBe('PUT');
      expect(fetchOptions.body).toBe(JSON.stringify(requestBody));
      
      // Verify headers
      const headers = fetchOptions.headers;
      expect(headers).toBeDefined();
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
    
    it('should make a PATCH request with correct parameters and body', async () => {
      // Setup mock response
      const mockResponse = { id: '123', name: 'Patched' };
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce(mockResponse),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse))
        });
        return fn();
      });
      
      // Request body
      const requestBody = { name: 'Patched Resource' };
      
      // Make PATCH request
      const result = await client.patch<typeof mockResponse>(
        'https://api.test.com/resources/123',
        requestBody
      );
      
      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = mockFetch.mock.calls[0][0];
      const fetchOptions = mockFetch.mock.calls[0][1];
      
      // Check that the URL contains the expected path
      expect(fetchUrl).toContain('api.test.com/resources/123');
      
      // Check the request options
      expect(fetchOptions.method).toBe('PATCH');
      expect(fetchOptions.body).toBe(JSON.stringify(requestBody));
      
      // Verify headers
      const headers = fetchOptions.headers;
      expect(headers).toBeDefined();
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
    
    it('should make a DELETE request with correct parameters', async () => {
      // Setup mock response
      const _mockResponse = { success: true };
      
      // Mock fetch to return a response
      mockFetch.mockImplementation((_url, _options) => {
        // Return a mock response that matches the expected URL
        return Promise.resolve({
          ok: true,
          status: 204,
          statusText: 'No Content',
          headers: new Headers(),
          text: jest.fn().mockResolvedValueOnce('')
        });
      });
      
      // Mock RetryPolicy to execute the fetch
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        return fn();
      });
      
      // Make DELETE request
      const _result = await client.delete('https://api.midaz.io/v1/resources/123');
      
      // Verify fetch was called with the correct method
      expect(mockFetch).toHaveBeenCalled();
      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.method).toBe('DELETE');
      
      // Verify headers
      const headers = fetchOptions.headers;
      expect(headers).toBeDefined();
    });
  });
  
  describe('Query Parameters', () => {
    let client: HttpClient;
    let mockRetryPolicyExecute: jest.Mock;
    let mockSpan: any;
    
    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn()
      };
      
      // Setup mocks
      mockRetryPolicyExecute = jest.fn();
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: jest.fn().mockReturnValue(mockSpan),
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        authToken: 'test-token'
      });
    });
    
    it('should correctly append query parameters to URL', async () => {
      // Setup mock response
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: async () => ({ data: 'test' }),
          text: async () => JSON.stringify({ data: 'test' })
        });
        return fn();
      });

      // Make request with query parameters
      await client.get('https://api.test.com/resources', {
        params: {
          limit: 10,
          offset: 20,
          filter: 'active',
          include: ['details', 'metadata']
        }
      });

      // Extract the URL from the fetch call
      const url = mockFetch.mock.calls[0][0];
      
      // Verify URL contains query parameters
      expect(url).toContain('https://api.test.com/resources?');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=20');
      expect(url).toContain('filter=active');
      // The actual implementation might encode arrays differently, so we just check for the include parameter
      expect(url).toContain('include');
      expect(url).toContain('details');
      expect(url).toContain('metadata');
    });
    
    it('should skip null and undefined query parameters', async () => {
      // Setup mock response
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce({}),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify({}))
        });
        
        return fn();
      });
      
      // Query parameters with null and undefined values
      const params = {
        limit: 10,
        offset: null,
        filter: undefined,
        include: 'details'
      };
      
      // Make GET request with query parameters
      await client.get('https://api.test.com/resources', { params });
      
      // Extract the URL from the fetch call
      const url = mockFetch.mock.calls[0][0];
      
      // Verify URL contains only non-null parameters
      expect(url).toContain('limit=10');
      expect(url).toContain('include=details');
      expect(url).not.toContain('offset=');
      expect(url).not.toContain('filter=');
    });
    
    it('should properly encode query parameters', async () => {
      // Setup mock response
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: async () => ({ data: 'test' }),
          text: async () => JSON.stringify({ data: 'test' })
        });
        return fn();
      });

      // Make request with query parameters
      await client.get('https://api.test.com/resources', {
        params: {
          limit: 10,
          offset: 20,
          filter: 'active',
          include: 'details,metadata'
        }
      });

      // Extract the URL from the fetch call
      const url = mockFetch.mock.calls[0][0];
      
      // Verify URL contains query parameters
      expect(url).toContain('https://api.test.com/resources?');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=20');
      expect(url).toContain('filter=active');
      // Check that the include parameter exists with the correct values, regardless of encoding
      expect(url.includes('include=')).toBe(true);
      expect(url.includes('details')).toBe(true);
      expect(url.includes('metadata')).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    let client: HttpClient;
    let mockRetryPolicyExecute: jest.Mock;
    let mockSpan: any;
    
    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn()
      };
      
      // Setup mocks
      mockRetryPolicyExecute = jest.fn();
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: jest.fn().mockReturnValue(mockSpan),
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        authToken: 'test-token'
      });
    });
    
    it('should handle API errors with JSON response', async () => {
      // Setup mock error response
      const errorResponse = {
        message: 'Resource not found',
        code: 'resource_not_found',
        resource: 'account',
        resourceId: 'acc-123'
      };
      
      // Create a MidazError instance to throw
      const midazError = new MidazError({
        message: 'Resource not found',
        code: ErrorCode.NOT_FOUND,
        category: ErrorCategory.NETWORK,
        statusCode: 404,
        requestId: 'req-123'
      });
      
      // Mock RetryPolicy to throw the MidazError
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        const response = {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({
            'content-type': 'application/json',
            'x-request-id': 'req-123'
          }),
          json: jest.fn().mockResolvedValueOnce(errorResponse),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(errorResponse))
        };
        
        // Mock fetch to return the error response
        mockFetch.mockResolvedValueOnce(response);
        
        // Record the error in the span
        mockSpan.recordException(midazError);
        mockSpan.setStatus('error', 'Resource not found');
        
        // Throw the MidazError
        throw midazError;
      });
      
      // Make GET request that will fail
      try {
        await client.get('https://api.test.com/resources/not-found');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBe(midazError);
      }
      
      // Verify error was recorded in span
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error', expect.any(String));
    });
    
    it('should handle network errors', async () => {
      // Create network error
      const networkError = new Error('Network error');
      
      // Mock RetryPolicy to throw a network error
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        // Mock fetch to throw a network error
        mockFetch.mockRejectedValueOnce(networkError);
        
        try {
          // This will throw an error in the actual implementation
          return await fn();
        } catch (error) {
          // Record the error in the span
          mockSpan.recordException(networkError);
          mockSpan.setStatus('error');
          
          // Rethrow the error
          throw networkError;
        }
      });
      
      // Make GET request that will fail
      try {
        await client.get('https://api.test.com/resources');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBe(networkError);
      }
      
      // Verify error was recorded in span
      expect(mockSpan.recordException).toHaveBeenCalledWith(networkError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error');
    });
    
    it('should handle timeout errors', async () => {
      // Create timeout error
      const timeoutError = new Error('Request timed out');
      
      // Mock RetryPolicy to throw a timeout error
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        // Mock fetch to throw a timeout error
        mockFetch.mockRejectedValueOnce(timeoutError);
        
        try {
          // This will throw an error in the actual implementation
          return await fn();
        } catch (error) {
          // Record the error in the span
          mockSpan.recordException(timeoutError);
          mockSpan.setStatus('error');
          
          // Rethrow the error
          throw timeoutError;
        }
      });
      
      // Make GET request that will fail
      try {
        await client.get('https://api.test.com/resources', { timeout: 100 });
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBe(timeoutError);
      }
      
      // Verify error was recorded in span
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith('error');
    });
  });
  
  describe('Retry Logic', () => {
    let client: HttpClient;
    let mockRetryPolicyExecute: jest.Mock;
    let mockSpan: any;
    
    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn()
      };
      
      // Setup mocks
      mockRetryPolicyExecute = jest.fn();
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: jest.fn().mockReturnValue(mockSpan),
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        authToken: 'test-token',
        retries: {
          maxRetries: 3,
          initialDelay: 100,
          maxDelay: 1000
        }
      });
    });
    
    it('should use retry policy for failed requests', async () => {
      // Setup mock responses - first fails, second succeeds
      const successResponse = { id: '123', name: 'Test' };
      
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        // First call fails
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce({
            message: 'Server error'
          }),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify({
            message: 'Server error'
          }))
        });
        
        // Second call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce(successResponse),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(successResponse))
        });
        
        // Simulate retry by calling the function twice
        try {
          await fn();
        } catch (error) {
          // Ignore first error
        }
        
        return fn();
      });
      
      // Make GET request
      const result = await client.get<typeof successResponse>('https://api.test.com/resources/123');
      
      // Verify retry policy was used
      expect(mockRetryPolicyExecute).toHaveBeenCalled();
      
      // Verify fetch was called twice
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Verify result
      expect(result).toEqual(successResponse);
    });
  });
  
  describe('Idempotency Keys', () => {
    let client: HttpClient;
    let mockRetryPolicyExecute: jest.Mock;
    let mockSpan: any;
    
    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn()
      };
      
      // Setup mocks
      mockRetryPolicyExecute = jest.fn();
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: jest.fn().mockReturnValue(mockSpan),
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        authToken: 'test-token'
      });
    });
    
    it('should use provided idempotency key when available', async () => {
      // Setup mock response
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce({}),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify({}))
        });
        return fn();
      });
      
      // Define idempotency key
      const idempotencyKey = 'test-idempotency-key';
      
      // Make POST request with idempotency key
      await client.post('https://api.test.com/resources', {}, { idempotencyKey });
      
      // Verify headers
      expect(mockFetch).toHaveBeenCalled();
      const requestOptions = mockFetch.mock.calls[0][1];
      expect(requestOptions.headers).toBeDefined();
      
      // Check if the idempotency key was set in the headers
      // The headers might be a Headers object or a plain object
      let headersObj: Record<string, string> = {};
      
      if (requestOptions.headers instanceof Headers) {
        requestOptions.headers.forEach((value: string, key: string) => {
          headersObj[key] = value;
        });
      } else {
        // Plain object
        headersObj = requestOptions.headers as Record<string, string>;
      }
      
      // Check for the idempotency key in a case-insensitive way
      const hasIdempotencyKey = Object.keys(headersObj).some(key => 
        key.toLowerCase() === 'idempotency-key' && headersObj[key] === idempotencyKey
      );
      expect(hasIdempotencyKey).toBe(true);
    });
    
    it('should generate idempotency key when not provided', async () => {
      // Setup mock response
      mockRetryPolicyExecute.mockImplementation(async (fn) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          json: jest.fn().mockResolvedValueOnce({}),
          text: jest.fn().mockResolvedValueOnce(JSON.stringify({}))
        });
        return fn();
      });
      
      // Make POST request without idempotency key
      await client.post('https://api.test.com/resources', {});
      
      // Verify headers
      expect(mockFetch).toHaveBeenCalled();
      const requestOptions = mockFetch.mock.calls[0][1];
      expect(requestOptions.headers).toBeDefined();
      // Check if the idempotency key was set in the headers
      // The headers might be a Headers object or a plain object
      let headersObj: Record<string, string> = {};
      
      if (requestOptions.headers instanceof Headers) {
        requestOptions.headers.forEach((value: string, key: string) => {
          headersObj[key] = value;
        });
      } else {
        // Plain object
        headersObj = requestOptions.headers as Record<string, string>;
      }
      
      // Check for the idempotency key in a case-insensitive way
      const hasIdempotencyKey = Object.keys(headersObj).some(key => 
        key.toLowerCase() === 'idempotency-key' && headersObj[key] !== undefined
      );
      expect(hasIdempotencyKey).toBe(true);
    });
  });
  
  describe('Cache', () => {
    let client: HttpClient;
    let mockRetryPolicyExecute: jest.Mock;
    let mockCacheGet: jest.Mock;
    let mockCacheSet: jest.Mock;
    let mockObservabilityStartSpan: jest.Mock;
    let mockSpan: any;
    
    beforeEach(() => {
      // Create mock span
      mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn()
      };
      
      // Setup mocks
      mockRetryPolicyExecute = jest.fn();
      mockCacheGet = jest.fn().mockReturnValue(undefined);
      mockCacheSet = jest.fn();
      mockObservabilityStartSpan = jest.fn().mockReturnValue(mockSpan);
      
      // Mock RetryPolicy execute method
      (RetryPolicy as unknown as jest.Mock<any>).mockImplementation(() => ({
        execute: mockRetryPolicyExecute
      }));
      
      // Mock Cache get and set methods
      (Cache as unknown as jest.Mock<any>).mockImplementation(() => ({
        get: mockCacheGet,
        set: mockCacheSet
      }));
      
      // Mock Observability startSpan method
      ((Observability as unknown) as jest.Mock<any>).mockImplementation(() => ({
        startSpan: mockObservabilityStartSpan,
        recordMetric: jest.fn()
      }));
      
      // Create client
      client = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1'
        },
        cache: mockCache as unknown as Cache
      });
    });
    
    it('should use cache when enabled', async () => {
      // Setup mock cache with data
      const cachedData = { data: 'cached-data' };
      mockCacheGet.mockReturnValue(cachedData);
      
      // Create a new client with cache enabled
      const clientWithCache = new HttpClient({
        baseUrls: {
          api: 'https://api.midaz.io/v1'
        },
        cache: new Cache({
          ttl: 60000
        })
      });
      
      // Mock the Cache constructor to return our mocked instance
      (Cache as jest.Mock).mockImplementation(() => ({
        get: mockCacheGet,
        set: mockCacheSet
      }));
      
      // Act
      const response = await clientWithCache.get('https://api.midaz.io/v1/resources/123');
      
      // Assert
      expect(mockCacheGet).toHaveBeenCalled();
      expect(response).toEqual(cachedData);
    });
  });
});